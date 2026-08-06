const router = require("express").Router();

const marcaController = require("../controllers/marca.controller");

router.get("/", marcaController.obtenerMarcas);

router.get("/:id", marcaController.obtenerMarca);

router.post("/", marcaController.crearMarca);

router.put("/:id", marcaController.actualizarMarca);

router.delete("/:id", marcaController.eliminarMarca);

module.exports = router;