const router = require("express").Router();

const usuarioController = require("../controllers/usuario.controller");
const validarUsuario = require("../middleware/validarUsuario");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

// ======================================
// RUTAS PÚBLICAS
// ======================================

// Registro de clientes
router.post(
    "/register",
    validarUsuario,
    usuarioController.registrarUsuario
);

// Login
router.post(
    "/login",
    usuarioController.login
);

// ======================================
// PERFIL DEL USUARIO
// ======================================

// Obtener perfil
router.get(
    "/perfil",
    auth,
    usuarioController.obtenerPerfil
);

// Actualizar perfil
router.put(
    "/perfil",
    auth,
    usuarioController.actualizarPerfil
);

// ======================================
// PANEL ADMIN
// ======================================

// Obtener todos los usuarios
router.get(
    "/",
    auth,
    admin,
    usuarioController.obtenerUsuarios
);

// Crear un nuevo ADMIN
router.post(
    "/",
    auth,
    admin,
    usuarioController.crearUsuarioAdmin
);

// Obtener usuario por ID
router.get(
    "/:id",
    auth,
    admin,
    usuarioController.obtenerUsuario
);

// Actualizar usuario
router.put(
    "/:id",
    auth,
    admin,
    usuarioController.actualizarUsuarioAdmin
);

// Activar / Desactivar usuario
router.patch(
    "/:id/estado",
    auth,
    admin,
    usuarioController.cambiarEstadoUsuario
);
// Crear usuario administrador
router.post(
    "/",
    auth,
    admin,
    usuarioController.crearUsuarioAdmin
);

// Eliminar usuario
router.delete(
    "/:id",
    auth,
    admin,
    usuarioController.eliminarUsuario
);

module.exports = router;