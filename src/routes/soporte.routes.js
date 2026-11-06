const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { Op } = require("sequelize");

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const { Reporte, MensajeReporte, Usuario, Pedido, DetallePedido, Producto } = require("../models");

const TIPOS = ["PEDIDO_EQUIVOCADO", "TALLA", "PRODUCTO_DANADO", "RESENA", "ACCESO", "OTRO"];
const PRIORIDADES = ["BAJA", "MEDIA", "ALTA"];
const ESTADOS = ["ABIERTO", "ASIGNADO", "EN_ATENCION", "RESUELTO"];

// ---------- Fotos ----------
const UPLOADS = path.join(__dirname, "..", "uploads");
fs.mkdirSync(UPLOADS, { recursive: true });

const upload = multer({
    storage: multer.diskStorage({
        destination: UPLOADS,
        filename: (req, file, cb) =>
            cb(null, crypto.randomUUID() + (path.extname(file.originalname) || ".jpg"))
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith("image/"))
});

const borrarArchivo = (n) => n && fs.unlink(path.join(UPLOADS, n), () => {});
const urlFoto = (req, n) => (n ? `${req.protocol}://${req.get("host")}/uploads/${n}` : null);

// ---------- Utilidades ----------
const nombre = (u) => (u ? `${u.nombre} ${u.apellido}`.trim() : null);
const folio = (r) => "REP" + String(r.id_reporte).padStart(3, "0");

const incluir = [
    { model: Usuario, as: "cliente", attributes: ["id_usuario", "nombre", "apellido"] },
    { model: Usuario, as: "agente", attributes: ["id_usuario", "nombre", "apellido"] },
    { model: Producto, as: "producto", attributes: ["id_producto", "nombre", "talla"] }
];

const incluirEmisor = [
    { model: Usuario, as: "emisor", attributes: ["id_usuario", "nombre", "apellido", "rol"] }
];

const reporteDTO = (req, r) => ({
    id: String(r.id_reporte),
    folio: folio(r),
    tipo: r.tipo,
    descripcion: r.descripcion,
    fotoUrl: urlFoto(req, r.foto),
    prioridad: r.prioridad,
    estado: r.estado,
    fecha: r.fecha,
    pedidoId: r.id_pedido,
    productoNombre: r.producto ? r.producto.nombre : "",
    cliente: r.cliente ? { id: r.cliente.id_usuario, nombre: nombre(r.cliente) } : null,
    agente: r.agente ? { id: r.agente.id_usuario, nombre: nombre(r.agente) } : null
});

// Solo existen dos roles: ADMIN y CLIENTE
const mensajeDTO = (req, m) => {
    const e = m.emisor;
    return {
        id: String(m.id_mensaje),
        texto: m.texto,
        fotoUrl: urlFoto(req, m.foto),
        fecha: m.fecha,
        emisorNombre: nombre(e),
        rolEtiqueta: e && e.rol === "ADMIN" ? "Administrador" : "Cliente",
        esMio: m.id_emisor === req.usuario.id_usuario
    };
};

const errorServidor = (res, e) => {
    console.error(e);
    res.status(500).json({ error: "Error del servidor" });
};

// Un cliente solo accede a sus reportes; un ADMIN accede a todos
async function cargarAcceso(req, res) {
    const r = await Reporte.findOne({
        where: { id_reporte: req.params.id, activo: true },
        include: incluir
    });
    if (!r || (req.usuario.rol !== "ADMIN" && r.id_usuario !== req.usuario.id_usuario)) {
        res.status(404).json({ error: "Reporte no encontrado." });
        return null;
    }
    return r;
}

// ---------- Crear reporte (cliente) ----------
router.post("/", auth, upload.single("foto"), async (req, res) => {
    const quitarFoto = () => req.file && borrarArchivo(req.file.filename);
    try {
        const idPedido = parseInt(req.body.pedidoId, 10);
        const idProducto = parseInt(req.body.productoId, 10) || null;
        const tipo = (req.body.tipo || "").trim();
        const descripcion = (req.body.descripcion || "").trim();

        if (!TIPOS.includes(tipo)) {
            quitarFoto();
            return res.status(400).json({ error: "Elige el tipo de problema." });
        }
        if (descripcion.length < 10) {
            quitarFoto();
            return res.status(400).json({ error: "Describe el problema (mínimo 10 caracteres)." });
        }

        // El pedido debe ser del cliente
        const pedido = await Pedido.findOne({
            where: { id_pedido: idPedido, id_usuario: req.usuario.id_usuario }
        });
        if (!pedido) {
            quitarFoto();
            return res.status(403).json({ error: "Ese pedido no está a tu nombre." });
        }

        // El producto debe pertenecer a ese pedido
        if (idProducto) {
            const detalle = await DetallePedido.findOne({
                where: { id_pedido: idPedido, id_producto: idProducto }
            });
            if (!detalle) {
                quitarFoto();
                return res.status(403).json({ error: "Ese producto no pertenece al pedido." });
            }
        }

        // Un solo reporte abierto por producto de cada pedido
        const abierto = await Reporte.findOne({
            where: {
                id_pedido: idPedido,
                id_producto: idProducto,
                activo: true,
                estado: { [Op.ne]: "RESUELTO" }
            }
        });
        if (abierto) {
            quitarFoto();
            return res.status(409).json({
                error: `Ya tienes un reporte abierto de este pedido (${folio(abierto)}).`
            });
        }

        const nuevo = await Reporte.create({
            id_usuario: req.usuario.id_usuario,
            id_pedido: idPedido,
            id_producto: idProducto,
            tipo,
            descripcion,
            foto: req.file ? req.file.filename : null
        });
        const completo = await Reporte.findByPk(nuevo.id_reporte, { include: incluir });
        res.status(201).json(reporteDTO(req, completo));
    } catch (e) { quitarFoto(); errorServidor(res, e); }
});

// ---------- Mis reportes (cliente) ----------
router.get("/mios", auth, async (req, res) => {
    try {
        const lista = await Reporte.findAll({
            where: { id_usuario: req.usuario.id_usuario, activo: true },
            include: incluir,
            order: [["fecha", "DESC"]]
        });
        res.json(lista.map((r) => reporteDTO(req, r)));
    } catch (e) { errorServidor(res, e); }
});

// ---------- Administradores disponibles para asignar un caso ----------
router.get("/admins", auth, admin, async (req, res) => {
    try {
        const lista = await Usuario.findAll({
            where: { rol: "ADMIN", activo: true },
            attributes: ["id_usuario", "nombre", "apellido"]
        });
        res.json(lista.map((u) => ({ id: u.id_usuario, nombre: nombre(u) })));
    } catch (e) { errorServidor(res, e); }
});

// ---------- Todos los reportes (ADMIN). ?asignados=1 solo los asignados a mí ----------
router.get("/", auth, admin, async (req, res) => {
    try {
        const where = { activo: true };
        if (req.query.asignados === "1") where.id_agente = req.usuario.id_usuario;
        if (ESTADOS.includes(req.query.estado)) where.estado = req.query.estado;
        const lista = await Reporte.findAll({ where, include: incluir, order: [["fecha", "DESC"]] });
        res.json(lista.map((r) => reporteDTO(req, r)));
    } catch (e) { errorServidor(res, e); }
});

// ---------- Detalle ----------
router.get("/:id", auth, async (req, res) => {
    try {
        const r = await cargarAcceso(req, res);
        if (r) res.json(reporteDTO(req, r));
    } catch (e) { errorServidor(res, e); }
});

// ---------- Mensajes: listar ----------
router.get("/:id/mensajes", auth, async (req, res) => {
    try {
        const r = await cargarAcceso(req, res);
        if (!r) return;
        const lista = await MensajeReporte.findAll({
            where: { id_reporte: r.id_reporte },
            include: incluirEmisor,
            order: [["fecha", "ASC"], ["id_mensaje", "ASC"]]
        });
        res.json(lista.map((m) => mensajeDTO(req, m)));
    } catch (e) { errorServidor(res, e); }
});

// ---------- Mensajes: enviar ----------
router.post("/:id/mensajes", auth, upload.single("foto"), async (req, res) => {
    const quitarFoto = () => req.file && borrarArchivo(req.file.filename);
    try {
        const r = await cargarAcceso(req, res);
        if (!r) return quitarFoto();

        if (r.estado === "RESUELTO") {
            quitarFoto();
            return res.status(409).json({ error: "Este reporte ya fue resuelto." });
        }
        const texto = (req.body.texto || "").trim();
        if (!texto && !req.file) {
            return res.status(400).json({ error: "Escribe un mensaje antes de enviar." });
        }

        const nuevo = await MensajeReporte.create({
            id_reporte: r.id_reporte,
            id_emisor: req.usuario.id_usuario,
            texto,
            foto: req.file ? req.file.filename : null
        });
        const completo = await MensajeReporte.findByPk(nuevo.id_mensaje, { include: incluirEmisor });
        res.status(201).json(mensajeDTO(req, completo));
    } catch (e) { quitarFoto(); errorServidor(res, e); }
});

// ---------- ADMIN: prioridad, estado y administrador asignado ----------
router.patch("/:id", auth, admin, async (req, res) => {
    try {
        const r = await Reporte.findOne({ where: { id_reporte: req.params.id, activo: true } });
        if (!r) return res.status(404).json({ error: "Reporte no encontrado." });

        const { prioridad, estado, id_agente } = req.body;

        if (prioridad !== undefined) {
            if (!PRIORIDADES.includes(prioridad)) return res.status(400).json({ error: "Prioridad no válida." });
            r.prioridad = prioridad;
        }
        if (id_agente !== undefined) {
            if (id_agente === null) {
                r.id_agente = null;
                if (r.estado === "ASIGNADO") r.estado = "ABIERTO";
            } else {
                const asignado = await Usuario.findOne({
                    where: { id_usuario: id_agente, rol: "ADMIN", activo: true }
                });
                if (!asignado) return res.status(400).json({ error: "Solo se puede asignar a un administrador activo." });
                r.id_agente = asignado.id_usuario;
                if (r.estado === "ABIERTO") r.estado = "ASIGNADO";
            }
        }
        if (estado !== undefined) {
            if (!ESTADOS.includes(estado)) return res.status(400).json({ error: "Estado no válido." });
            r.estado = estado;
        }

        await r.save();
        const completo = await Reporte.findByPk(r.id_reporte, { include: incluir });
        res.json(reporteDTO(req, completo));
    } catch (e) { errorServidor(res, e); }
});

// ---------- ADMIN: eliminar reporte (lógico) ----------
router.delete("/:id", auth, admin, async (req, res) => {
    try {
        const r = await Reporte.findOne({ where: { id_reporte: req.params.id, activo: true } });
        if (!r) return res.status(404).json({ error: "Reporte no encontrado." });
        await r.update({ activo: false });
        res.status(204).end();
    } catch (e) { errorServidor(res, e); }
});

// ---------- ADMIN: limpiar historial de mensajes ----------
router.delete("/:id/mensajes", auth, admin, async (req, res) => {
    try {
        const r = await Reporte.findOne({ where: { id_reporte: req.params.id, activo: true } });
        if (!r) return res.status(404).json({ error: "Reporte no encontrado." });
        await MensajeReporte.destroy({ where: { id_reporte: r.id_reporte } });
        res.status(204).end();
    } catch (e) { errorServidor(res, e); }
});

module.exports = router;