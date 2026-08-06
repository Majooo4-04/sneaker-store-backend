const router = require("express").Router();

const inventarioController = require("../controllers/inventario.controller");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

// GET
// http://localhost:3001/api/inventario

router.get(
    "/",
    auth,
    admin,
    inventarioController.obtenerInventario
);

// GET - historial general (últimos 50 movimientos)
// http://localhost:3001/api/inventario/movimientos

router.get(
    "/movimientos",
    auth,
    admin,
    inventarioController.obtenerHistorial
);

// GET - historial de un producto específico
// http://localhost:3001/api/inventario/5/movimientos

router.get(
    "/:id/movimientos",
    auth,
    admin,
    inventarioController.obtenerHistorial
);

// PATCH - ajustar stock (registra movimiento automáticamente)
// http://localhost:3001/api/inventario/5/stock
// body: { tipo: "entrada" | "salida", cantidad: 10 }

router.patch(
    "/:id/stock",
    auth,
    admin,
    inventarioController.ajustarStock
);

module.exports = router;