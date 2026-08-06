const router = require("express").Router();

const productoController = require("../controllers/producto.controller");
const validarProducto = require("../middleware/validarProducto");


// PUBLICO

router.get("/", productoController.obtenerProductos);

router.get("/:id", productoController.obtenerProducto);

    

// ADMIN

router.post("/", validarProducto, productoController.crearProducto);

router.put("/:id", validarProducto, productoController.actualizarProducto);

router.delete("/:id", productoController.eliminarProducto);



module.exports = router;