const sequelize = require("../config/database");
const {
    Producto,
    Marca,
    MovimientoInventario
} = require("../models");

const UMBRAL_BAJO = 5; // stock <= 5 se considera "Bajo" (ajustable)

function calcularStatus(stock) {
    if (stock <= 0) return "Agotado";
    if (stock <= UMBRAL_BAJO) return "Bajo";
    return "Disponible";
}

// ==========================================
// OBTENER INVENTARIO
// ==========================================
exports.obtenerInventario = async (req, res) => {
    try {
        const productos = await Producto.findAll({
            where: { activo: true },
            attributes: ["id_producto", "nombre", "stock", "precio", "talla"],
            include: [
                {
                    model: Marca,
                    as: "marca",
                    attributes: ["nombre"]
                }
            ],
            order: [["stock", "ASC"]]
        });

        const inventario = productos.map(p => ({
            id_producto: p.id_producto,
            nombre: p.nombre,
            marca: p.marca?.nombre || "Sin marca",
            talla: p.talla,
            precio: p.precio,
            stock: p.stock,
            status: calcularStatus(p.stock)
        }));

        const resumen = {
            disponibles: inventario.filter(i => i.status === "Disponible").length,
            bajos: inventario.filter(i => i.status === "Bajo").length,
            agotados: inventario.filter(i => i.status === "Agotado").length
        };

        return res.json({ inventario, resumen });

    } catch (error) {
        return res.status(500).json({
            mensaje: "Error al obtener inventario",
            error: error.message
        });
    }
};

// ==========================================
// AJUSTAR STOCK (entrada / salida manual)
// Registra automáticamente el movimiento en el kardex
// ==========================================
// body: { tipo: "entrada" | "salida", cantidad: number }
exports.ajustarStock = async (req, res) => {

    const t = await sequelize.transaction();

    try {
        const { tipo, cantidad } = req.body;

        if (!["entrada", "salida"].includes(tipo)) {
            await t.rollback();
            return res.status(400).json({
                mensaje: "Tipo inválido. Debe ser 'entrada' o 'salida'."
            });
        }

        const cantidadNum = parseInt(cantidad, 10);

        if (!cantidadNum || cantidadNum <= 0) {
            await t.rollback();
            return res.status(400).json({
                mensaje: "La cantidad debe ser un número mayor a 0."
            });
        }

        const producto = await Producto.findByPk(req.params.id, { transaction: t });

        if (!producto) {
            await t.rollback();
            return res.status(404).json({
                mensaje: "Producto no encontrado"
            });
        }

        const cantidadAnterior = producto.stock;
        let cantidadNueva;

        if (tipo === "entrada") {
            cantidadNueva = cantidadAnterior + cantidadNum;
        } else {
            if (cantidadAnterior < cantidadNum) {
                await t.rollback();
                return res.status(400).json({
                    mensaje: `Stock insuficiente. Stock actual: ${cantidadAnterior}`
                });
            }
            cantidadNueva = cantidadAnterior - cantidadNum;
        }

        producto.stock = cantidadNueva;
        await producto.save({ transaction: t });

        await MovimientoInventario.create({
            id_producto: producto.id_producto,
            cantidad_anterior: cantidadAnterior,
            cantidad_nueva: cantidadNueva,
            tipo_movimiento: tipo,
            fecha: new Date()
        }, { transaction: t });

        await t.commit();

        return res.json({
            mensaje: "Stock actualizado correctamente",
            producto: {
                id_producto: producto.id_producto,
                nombre: producto.nombre,
                stock: producto.stock,
                status: calcularStatus(producto.stock)
            }
        });

    } catch (error) {
        await t.rollback();
        return res.status(500).json({
            mensaje: "Error al ajustar stock",
            error: error.message
        });
    }
};

// ==========================================
// HISTORIAL DE MOVIMIENTOS
// ==========================================
// GET /api/inventario/movimientos           -> historial general (últimos 50)
// GET /api/inventario/:id/movimientos       -> historial de un producto específico
exports.obtenerHistorial = async (req, res) => {
    try {
        const where = req.params.id
            ? { id_producto: req.params.id }
            : {};

        const movimientos = await MovimientoInventario.findAll({
            where,
            limit: 50,
            order: [["fecha", "DESC"]],
            include: [
                {
                    model: Producto,
                    as: "producto",
                    attributes: ["nombre"]
                }
            ]
        });

        const historial = movimientos.map(m => ({
            id_movimiento: m.id_movimiento,
            producto: m.producto?.nombre || "Producto eliminado",
            cantidad_anterior: m.cantidad_anterior,
            cantidad_nueva: m.cantidad_nueva,
            tipo_movimiento: m.tipo_movimiento,
            fecha: m.fecha
        }));

        return res.json(historial);

    } catch (error) {
        return res.status(500).json({
            mensaje: "Error al obtener historial",
            error: error.message
        });
    }
};