/**
 * Integración real: ruta Express (resena.routes.js) + middleware auth + modelos Sequelize
 * + base de datos SQLite en memoria. Solo se simulan servicios externos:
 * la conexión MySQL (se reemplaza por SQLite) y Cloudinary (no se sube nada real).
 */
process.env.JWT_SECRET = 'secreto-solo-para-pruebas';

jest.mock('../src/config/database', () => {
  const { Sequelize } = require('sequelize');
  return new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
});

const URL_FOTO = 'https://res.cloudinary.test/image/upload/v1/snapreview/resenas/foto-prueba.jpg';
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn((opts, cb) => ({ end: () => cb(null, { secure_url: URL_FOTO }) })),
      destroy: jest.fn().mockResolvedValue({}),
    },
  },
}));

const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const { sequelize, Usuario, Producto, Pedido, DetallePedido, Resena } = require('../src/models');

const app = express();
app.use(express.json());
app.use('/api/resenas', require('../src/routes/resena.routes'));

const token = (id) => jwt.sign({ id_usuario: id }, process.env.JWT_SECRET);
const FOTO = Buffer.from('imagen-de-prueba');

// Envía una reseña como multipart/form-data (igual que la app)
const publicar = (uid, campos = {}, conFoto = true) => {
  const req = request(app).post('/api/resenas').set('Authorization', `Bearer ${token(uid)}`);
  const base = { pedidoId: '1', productoId: '1', comentario: 'Muy cómodos', calificacion: '4', recomienda: 'true', ...campos };
  Object.entries(base).forEach(([k, v]) => req.field(k, v));
  if (conFoto) req.attach('foto', FOTO, { filename: 'foto.jpg', contentType: 'image/jpeg' });
  return req;
};

beforeAll(async () => {
  await sequelize.query('PRAGMA foreign_keys = OFF');
});

// Datos de prueba ficticios (nada real)
beforeEach(async () => {
  for (const m of [Usuario, Producto, Pedido, DetallePedido, Resena]) await m.sync({ force: true });
  await Usuario.bulkCreate([
    { nombre: 'Cliente', apellido: 'Uno', correo: 'uno@prueba.test', password: 'hash-falso' },
    { nombre: 'Cliente', apellido: 'Dos', correo: 'dos@prueba.test', password: 'hash-falso' },
  ]);
  await Producto.bulkCreate([
    { nombre: 'Tenis Alfa', precio: 1000, talla: '27', marcaId: 1 },
    { nombre: 'Tenis Beta', precio: 1200, talla: '26', marcaId: 1 },
  ]);
  await Pedido.bulkCreate([
    { id_usuario: 1, total: 2200, estado: 'ENTREGADO' }, // pedido 1: del usuario 1, entregado
    { id_usuario: 1, total: 1000, estado: 'PENDIENTE' }, // pedido 2: del usuario 1, no entregado
    { id_usuario: 2, total: 1000, estado: 'ENTREGADO' }, // pedido 3: del usuario 2
  ]);
  await DetallePedido.bulkCreate([
    { id_pedido: 1, id_producto: 1, cantidad: 1, precio_compra: 1000 },
    { id_pedido: 1, id_producto: 2, cantidad: 1, precio_compra: 1200 },
    { id_pedido: 2, id_producto: 1, cantidad: 1, precio_compra: 1000 },
    { id_pedido: 3, id_producto: 1, cantidad: 1, precio_compra: 1000 },
  ]);
  jest.clearAllMocks();
});

afterAll(async () => { await sequelize.close(); });

describe('POST /api/resenas - flujo correcto y errores (BD real en memoria)', () => {
  it('INT-B01 crea una reseña válida: responde 201 y guarda la fila correcta en la BD', async () => {
    const res = await publicar(1);
    expect(res.status).toBe(201);
    const fila = await Resena.findOne({ where: { id_pedido: 1, id_producto: 1 } });
    expect(fila).not.toBeNull();
    expect(fila.id_usuario).toBe(1);
    expect(fila.calificacion).toBe(4);
    expect(fila.comentario).toBe('Muy cómodos');
    expect(fila.foto).toBe(URL_FOTO);
    expect(res.body.productoNombre).toBe('Tenis Alfa');
  });

  it('INT-B02 rechaza la reseña duplicada del mismo pedido y producto (409) y no crea otra fila', async () => {
    await publicar(1);
    const res = await publicar(1);
    expect(res.status).toBe(409);
    expect(await Resena.count({ where: { id_pedido: 1, id_producto: 1 } })).toBe(1);
  });

  it('INT-B03 rechaza reseñar el pedido de otro usuario (403)', async () => {
    const res = await publicar(1, { pedidoId: '3' });
    expect(res.status).toBe(403);
    expect(await Resena.count()).toBe(0);
  });

  it('INT-B04 rechaza reseñar un pedido no entregado (403)', async () => {
    const res = await publicar(1, { pedidoId: '2' });
    expect(res.status).toBe(403);
    expect(await Resena.count()).toBe(0);
  });

  it('INT-B05 rechaza una reseña sin foto (400) y no sube nada a Cloudinary', async () => {
    const res = await publicar(1, {}, false);
    expect(res.status).toBe(400);
    expect(cloudinary.uploader.upload_stream).not.toHaveBeenCalled();
    expect(await Resena.count()).toBe(0);
  });

  it('INT-B06 rechaza calificación 6 (400)', async () => {
    const res = await publicar(1, { calificacion: '6' });
    expect(res.status).toBe(400);
    expect(await Resena.count()).toBe(0);
  });

  it('INT-B07 rechaza la petición sin token (401)', async () => {
    const res = await request(app).get('/api/resenas');
    expect(res.status).toBe(401);
  });

  it('INT-B08 un usuario no puede editar la reseña de otro (404)', async () => {
    await publicar(1);
    const res = await request(app)
      .put('/api/resenas/1').set('Authorization', `Bearer ${token(2)}`)
      .field('comentario', 'Intento de edición ajena').field('calificacion', '1').field('recomienda', 'false');
    expect(res.status).toBe(404);
    expect((await Resena.findByPk(1)).comentario).toBe('Muy cómodos');
  });

  it('INT-B09 DEF-01: calificación 0 con recomendación NO debería aceptarse', async () => {
    const res = await publicar(1, { calificacion: '0' });
    expect(res.status).toBe(400);
  });

  it('INT-B10 DEF-04: comentario de 256 caracteres NO debería aceptarse', async () => {
    const res = await publicar(1, { comentario: 'a'.repeat(256) });
    expect(res.status).toBe(400);
  });

  it('INT-B11 acepta un comentario de 255 caracteres (límite)', async () => {
    const res = await publicar(1, { comentario: 'a'.repeat(255) });
    expect(res.status).toBe(201);
  });
});

describe('Consulta, edición y eliminación (BD real en memoria)', () => {
  it('INT-B12 GET /pedidos lista solo pedidos entregados del usuario y marca el reseñado', async () => {
    await publicar(1);
    const res = await request(app).get('/api/resenas/pedidos').set('Authorization', `Bearer ${token(1)}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2); // pedido 1 con 2 productos; el pedido 2 no está entregado
    const alfa = res.body.find((i) => i.id === '1-1');
    const beta = res.body.find((i) => i.id === '1-2');
    expect(alfa.resenaId).not.toBeNull();
    expect(beta.resenaId).toBeNull();
  });

  it('INT-B13 editar la propia reseña actualiza la fila en la BD', async () => {
    await publicar(1);
    const res = await request(app)
      .put('/api/resenas/1').set('Authorization', `Bearer ${token(1)}`)
      .field('comentario', 'Editado').field('calificacion', '5').field('recomienda', 'true');
    expect(res.status).toBe(200);
    const fila = await Resena.findByPk(1);
    expect(fila.comentario).toBe('Editado');
    expect(fila.calificacion).toBe(5);
  });

  it('INT-B14 eliminar la propia reseña borra la fila y la foto de Cloudinary', async () => {
    await publicar(1);
    const res = await request(app).delete('/api/resenas/1').set('Authorization', `Bearer ${token(1)}`);
    expect(res.status).toBe(204);
    expect(await Resena.count()).toBe(0);
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('snapreview/resenas/foto-prueba');
  });
});