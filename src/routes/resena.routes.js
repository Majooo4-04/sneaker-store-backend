const router = require("express").Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const auth = require("../middleware/auth");
const { Pedido, DetallePedido, Producto, Resena } = require("../models");

// Solo se puede reseñar un pedido que ya llegó al cliente
const ESTADOS_VALIDOS = ["ENTREGADO"];

// AJUSTAR: cómo tu middleware auth guarda al usuario en la petición
const idUsuario = (req) => req.usuario.id_usuario;

// ---------- Fotos (Cloudinary) ----------
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// La foto se recibe en memoria y se sube directo a Cloudinary (nada se escribe en disco)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith("image/"))
});

const subirFoto = (buffer) =>
    new Promise((resolve, reject) => {
        cloudinary.uploader
            .upload_stream(
                { folder: "snapreview/resenas", resource_type: "image" },
                (err, result) => (err ? reject(err) : resolve(result))
            )
            .end(buffer);
    });

// Borra la imagen de Cloudinary a partir de su URL (ignora fotos antiguas guardadas en disco)
const borrarFoto = (url) => {
    if (!url || !url.startsWith("http")) return;
    const m = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
    if (m) cloudinary.uploader.destroy(m[1]).catch(() => {});
};

// ---------- Utilidades ----------
const urlFoto = (req, foto) =>
    foto && foto.startsWith("http")
        ? foto
        : `${req.protocol}://${req.get("host")}/uploads/${foto}`; // reseñas antiguas

const aDTO = (req, r) => ({
    id: String(r.id_resena),
    pedidoId: `${r.id_pedido}-${r.id_producto}`,
    productoId: r.id_producto,
    productoNombre: r.producto ? r.producto.nombre : "",
    fotoUrl: urlFoto(req, r.foto),
    comentario: r.comentario,
    calificacion: r.calificacion,
    recomienda: r.recomienda === null ? null : !!r.recomienda,
    fecha: r.fecha
});

const conProducto = { model: Producto, as: "producto" };

function leerCampos(body) {
    return {
        comentario: (body.comentario || "").trim(),
        calificacion: parseInt(body.calificacion, 10) || 0,
        recomienda: body.recomienda === "true" ? true : body.recomienda === "false" ? false : null
    };
}

function validar({ comentario, calificacion, recomienda }) {
    if (!comentario) return "Escribe un comentario.";
    if (calificacion < 0 || calificacion > 5) return "La calificación debe ser de 0 a 5.";
    if (calificacion === 0 && recomienda === null) return "Indica una calificación o si lo recomiendas.";
    return null;
}

const errorServidor = (res, e) => {
    console.error(e);
    res.status(500).json({ error: "Error del servidor" });
};

// ---------- Pedidos del cliente (un renglón por producto comprado) ----------
router.get("/pedidos", auth, async (req, res) => {
    try {
        const uid = idUsuario(req);
        const pedidos = await Pedido.findAll({
            where: { id_usuario: uid, estado: ESTADOS_VALIDOS },
            include: [{ model: DetallePedido, as: "detalles", include: [conProducto] }],
            order: [["fecha_pedido", "DESC"]]
        });
        const resenas = await Resena.findAll({ where: { id_usuario: uid } });

        const items = [];
        for (const p of pedidos) {
            for (const d of p.detalles) {
                const r = resenas.find(
                    (x) => x.id_pedido === p.id_pedido && x.id_producto === d.id_producto
                );
                items.push({
                    id: `${p.id_pedido}-${d.id_producto}`,
                    numero: String(p.id_pedido),
                    fecha: p.fecha_pedido,
                    producto: {
                        id: String(d.id_producto),
                        nombre: d.producto.nombre,
                        talla: d.producto.talla || "",
                        color: ""
                    },
                    resenaId: r ? String(r.id_resena) : null
                });
            }
        }
        res.json(items);
    } catch (e) { errorServidor(res, e); }
});

// ---------- Público: reseñas de un producto (para la tienda web) ----------
router.get("/producto/:idProducto", async (req, res) => {
    try {
        const lista = await Resena.findAll({
            where: { id_producto: req.params.idProducto },
            include: [conProducto],
            order: [["fecha", "DESC"]]
        });
        res.json(lista.map((r) => aDTO(req, r)));
    } catch (e) { errorServidor(res, e); }
});

// ---------- Mis reseñas ----------
router.get("/", auth, async (req, res) => {
    try {
        const lista = await Resena.findAll({
            where: { id_usuario: idUsuario(req) },
            include: [conProducto],
            order: [["fecha", "DESC"]]
        });
        res.json(lista.map((r) => aDTO(req, r)));
    } catch (e) { errorServidor(res, e); }
});

// ---------- Crear ----------
router.post("/", auth, upload.single("foto"), async (req, res) => {
    try {
        const idPedido = parseInt(req.body.pedidoId, 10);
        const idProducto = parseInt(req.body.productoId, 10);

        // Validación de compra: el pedido es del cliente, ya se entregó y contiene el producto
        const pedido = await Pedido.findOne({
            where: { id_pedido: idPedido, id_usuario: idUsuario(req), estado: ESTADOS_VALIDOS }
        });
        const detalle = pedido && await DetallePedido.findOne({
            where: { id_pedido: idPedido, id_producto: idProducto }
        });
        if (!pedido || !detalle) {
            return res.status(403).json({ error: "Ese pedido no está a tu nombre o aún no se entrega." });
        }
        if (await Resena.findOne({ where: { id_pedido: idPedido, id_producto: idProducto } })) {
            return res.status(409).json({ error: "Ese producto ya tiene una reseña." });
        }
        if (!req.file) return res.status(400).json({ error: "Agrega una foto del producto." });

        const campos = leerCampos(req.body);
        const problema = validar(campos);
        if (problema) return res.status(400).json({ error: problema });

        // Todo es válido: ahora sí se sube la foto
        const subida = await subirFoto(req.file.buffer);

        const nueva = await Resena.create({
            id_usuario: idUsuario(req),
            id_pedido: idPedido,
            id_producto: idProducto,
            foto: subida.secure_url,
            ...campos
        });
        const completa = await Resena.findByPk(nueva.id_resena, { include: [conProducto] });
        res.status(201).json(aDTO(req, completa));
    } catch (e) { errorServidor(res, e); }
});

// ---------- Editar ----------
router.put("/:id", auth, upload.single("foto"), async (req, res) => {
    try {
        const r = await Resena.findOne({
            where: { id_resena: req.params.id, id_usuario: idUsuario(req) },
            include: [conProducto]
        });
        if (!r) return res.status(404).json({ error: "Reseña no encontrada." });

        const campos = leerCampos(req.body);
        const problema = validar(campos);
        if (problema) return res.status(400).json({ error: problema });

        const fotoAnterior = r.foto;
        r.set(campos);
        if (req.file) {
            const subida = await subirFoto(req.file.buffer);
            r.foto = subida.secure_url;
        }
        await r.save();
        if (req.file) borrarFoto(fotoAnterior);
        res.json(aDTO(req, r));
    } catch (e) { errorServidor(res, e); }
});

// ---------- Eliminar ----------
router.delete("/:id", auth, async (req, res) => {
    try {
        const r = await Resena.findOne({
            where: { id_resena: req.params.id, id_usuario: idUsuario(req) }
        });
        if (!r) return res.status(404).json({ error: "Reseña no encontrada." });
        const foto = r.foto;
        await r.destroy();
        borrarFoto(foto);
        res.status(204).end();
    } catch (e) { errorServidor(res, e); }
});

module.exports = router;