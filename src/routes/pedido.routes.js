const express = require("express");
const router = express.Router();
const pedidoController = require("../controllers/pedido.controller");
const dispositivoController = require("../controllers/dispositivo.controller");

// ==========================================
// CREAR PEDIDO
// ==========================================
router.post("/", pedidoController.crearPedido);

// ==========================================
// OBTENER PEDIDOS DE UN USUARIO
// ==========================================
router.get("/usuario/:idUsuario", pedidoController.obtenerPedidosUsuario);

// ==========================================
// EXPORTAR
// ==========================================
router.get("/exportar", pedidoController.exportarPedidos);

router.get(
    "/ventas-mensuales",
    pedidoController.ventasPorMes
);

// ==========================================
// ACTUALIZAR ESTADO
// ==========================================
router.put("/estado/:id", pedidoController.actualizarEstado);

// ==========================================
// SMARTWATCH
// ==========================================
router.get(
    "/ultimo-pedido-watch",
    dispositivoController.validarDispositivo,
    pedidoController.ultimoPedidoWatch
);

// ==========================================
// OBTENER TODOS
// ==========================================
router.get("/", pedidoController.obtenerPedidos);

// ==========================================
// DETALLE
// ==========================================
router.get("/:id", pedidoController.obtenerPedido);

module.exports = router;