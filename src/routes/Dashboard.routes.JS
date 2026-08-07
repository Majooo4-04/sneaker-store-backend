const router = require("express").Router();

const dashboardController = require("../controllers/dashboard.controller");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const { validarDispositivo } = require("../controllers/dispositivo.controller");
// GET
// http://localhost:3001/api/admin/dashboard

router.get(
    "/dashboard",
    auth,
    admin,
    dashboardController.obtenerDashboard
);
router.get(
    "/estadisticas-watch",
    validarDispositivo,
    dashboardController.obtenerEstadisticasWatch
);

module.exports = router;