
const { Op, Sequelize } = require("sequelize");
const Pedido = require("../models/Pedido");
const Producto = require("../models/Producto");
const Usuario = require("../models/Usuario");
const Marca = require("../models/Marca");
const DetallePedido = require("../models/DetallePedido");
const { validarDispositivo } = require("./dispositivo.controller");

exports.obtenerDashboard = async (req, res) => {
    try {
        // ===== KPIs (tarjetas) =====

        // Total ventas: suma de pedidos que NO estén cancelados
        const totalVentas = await Pedido.sum("total", {
            where: {
                estado: { [Op.ne]: "CANCELADO" }
            }
        });

        const totalProductos = await Producto.count({
            where: { activo: true }
        });

        const totalPedidos = await Pedido.count();

        const totalUsuarios = await Usuario.count({
            where: { activo: true }
        });

        // ===== Últimos pedidos (ahora con producto) =====
        const ultimosPedidosRaw = await Pedido.findAll({
            limit: 5,
            order: [["fecha_pedido", "DESC"]],
            include: [
                {
                    model: DetallePedido,
                    as: "detalles",
                    include: [
                        {
                            model: Producto,
                            as: "producto",
                            attributes: ["nombre"]
                        }
                    ]
                }
            ]
        });

        const idsUsuarios = ultimosPedidosRaw.map(p => p.id_usuario);
        const usuariosPedidos = await Usuario.findAll({
            where: { id_usuario: idsUsuarios },
            attributes: ["id_usuario", "nombre", "apellido"]
        });

        const ultimosPedidos = ultimosPedidosRaw.map(p => {
            const u = usuariosPedidos.find(us => us.id_usuario === p.id_usuario);

            // Si el pedido tiene varios productos, se muestran separados por coma
            const nombresProductos = p.detalles
                .map(d => d.producto?.nombre)
                .filter(Boolean)
                .join(", ");

            return {
                id_pedido: p.id_pedido,
                cliente: u ? `${u.nombre} ${u.apellido}` : "Desconocido",
                producto: nombresProductos || "Sin productos",
                total: p.total,
                estado: p.estado,
                fecha: p.fecha_pedido
            };
        });

        // ===== Stock bajo =====
        const UMBRAL_STOCK_BAJO = 5;

        const stockBajo = await Producto.findAll({
            where: {
                stock: { [Op.lte]: UMBRAL_STOCK_BAJO },
                activo: true
            },
            attributes: ["id_producto", "nombre", "stock"],
            order: [["stock", "ASC"]],
            limit: 5
        });

        // ===== Actividad reciente =====
        const usuariosRecientes = await Usuario.findAll({
            attributes: ["nombre", "apellido", "fecha_registro"],
            order: [["fecha_registro", "DESC"]],
            limit: 5
        });

        const pedidosRecientesActividad = await Pedido.findAll({
            attributes: ["id_pedido", "estado", "fecha_pedido"],
            order: [["fecha_pedido", "DESC"]],
            limit: 5
        });

        const actividad = [
            ...usuariosRecientes.map(u => ({
                texto: `Nuevo usuario registrado: ${u.nombre} ${u.apellido}`,
                fecha: u.fecha_registro
            })),
            ...pedidosRecientesActividad.map(p => ({
                texto: `Pedido #${p.id_pedido} está ${p.estado.toLowerCase()}`,
                fecha: p.fecha_pedido
            }))
        ]
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .slice(0, 6)
            .map(item => item.texto);

        // ===== Ventas por mes (gráfica "Ventas del Mes") =====
        const ventasPorMesRaw = await Pedido.findAll({
            attributes: [
                [Sequelize.fn("DATE_FORMAT", Sequelize.col("fecha_pedido"), "%Y-%m"), "mes"],
                [Sequelize.fn("SUM", Sequelize.col("total")), "total_ventas"]
            ],
            where: {
                estado: { [Op.ne]: "CANCELADO" }
            },
            group: ["mes"],
            order: [[Sequelize.literal("mes"), "ASC"]],
            raw: true
        });

        const ventasPorMes = ventasPorMesRaw.map(v => ({
            mes: v.mes,
            total_ventas: Number(v.total_ventas)
        }));

        // ===== Productos más vendidos =====
        const masVendidosRaw = await DetallePedido.findAll({
            attributes: [
                "id_producto",
                [Sequelize.fn("SUM", Sequelize.col("DetallePedido.cantidad")), "total_vendidos"]
            ],
            include: [
                {
                    model: Producto,
                    as: "producto",
                    attributes: ["nombre"]
                }
            ],
            group: ["id_producto", "producto.id_producto", "producto.nombre"],
            order: [[Sequelize.literal("total_vendidos"), "DESC"]],
            limit: 5,
            raw: true
        });

        const masVendidos = masVendidosRaw.map(v => ({
            producto: v["producto.nombre"],
            ventas: Number(v.total_vendidos)
        }));

        // ===== Respuesta =====
        return res.status(200).json({
            cards: {
                ventas: totalVentas || 0,
                productos: totalProductos,
                pedidos: totalPedidos,
                usuarios: totalUsuarios
            },
            ultimosPedidos,
            stockBajo,
            actividadReciente: actividad,
            ventasPorMes,
            masVendidos
        });

    } catch (error) {
        console.error("Error en dashboard admin:", error);
        return res.status(500).json({
            mensaje: "Error al obtener datos del dashboard",
            error: error.message
        });
    }
};
// ===============================
// ESTADÍSTICAS RESUMIDAS PARA WEARABLE
// ===============================
exports.obtenerEstadisticasWatch = async (req, res) => {
    try {
        const totalVentas = await Pedido.sum("total", {
            where: { estado: { [Op.ne]: "CANCELADO" } }
        });

        const totalPedidos = await Pedido.count();

        const pedidosPendientes = await Pedido.count({
            where: { estado: "PENDIENTE" }
        });

        const ventasPorMesRaw = await Pedido.findAll({
            attributes: [
                [Sequelize.fn("DATE_FORMAT", Sequelize.col("fecha_pedido"), "%Y-%m"), "mes"],
                [Sequelize.fn("SUM", Sequelize.col("total")), "total_ventas"]
            ],
            where: { estado: { [Op.ne]: "CANCELADO" } },
            group: ["mes"],
            order: [[Sequelize.literal("mes"), "DESC"]],
            limit: 6,
            raw: true
        });

        const ventasPorMes = ventasPorMesRaw
            .reverse()
            .map(v => ({ mes: v.mes, total: Number(v.total_ventas) }));

        res.json({
            ventas_totales: totalVentas || 0,
            pedidos_totales: totalPedidos,
            pedidos_pendientes: pedidosPendientes,
            ventas_por_mes: ventasPorMes
        });

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener estadísticas",
            error: error.message
        });
    }
};
exports.obtenerEstadisticasWatch = async (req, res) => {
    try {
        const id_usuario = req.id_usuario_dispositivo;

        const totalVentas = await Pedido.sum("total", {
            where: { estado: { [Op.ne]: "CANCELADO" } }
        });

        const totalPedidos = await Pedido.count();

        const pedidosPendientes = await Pedido.count({
            where: { estado: "PENDIENTE" }
        });

        res.json({
            ventas_totales: totalVentas || 0,
            pedidos_totales: totalPedidos,
            pedidos_pendientes: pedidosPendientes
        });

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener estadísticas",
            error: error.message
        });
    }
};