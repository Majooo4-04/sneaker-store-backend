const router = require("express").Router();

const favoritoController = require("../controllers/favorito.controller");

router.get("/:idUsuario",favoritoController.obtenerFavoritos);

router.post("/",favoritoController.agregarFavorito);

router.delete("/:id",favoritoController.eliminarFavorito);

module.exports=router;