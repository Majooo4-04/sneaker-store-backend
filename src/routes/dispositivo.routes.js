const router = require("express").Router();
const dispositivoController = require("../controllers/dispositivo.controller");
const auth = require("../middleware/auth");

// Generar QR (usuario logueado en el sitio web)
router.post("/generar-qr", auth, dispositivoController.generarQR);

// El watch confirma el vínculo usando el token del QR
router.post("/confirmar-vinculo", dispositivoController.confirmarVinculo);

// Listar dispositivos vinculados (desde el sitio web)
router.get("/mis-dispositivos", auth, dispositivoController.misDispositivos);

// Desvincular
router.delete("/:id", auth, dispositivoController.desvincular);

module.exports = router;