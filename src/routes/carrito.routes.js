const router = require("express").Router();

const carritoController = require("../controllers/carrito.controller");

// Obtener carrito del usuario
router.get("/:idUsuario", carritoController.obtenerCarrito);

// Agregar producto
router.post("/", carritoController.agregarProducto);

// Actualizar cantidad
router.put("/:id", carritoController.actualizarCantidad);

// Eliminar producto
router.delete("/:id", carritoController.eliminarProducto);

module.exports = router;