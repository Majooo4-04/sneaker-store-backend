const { DispositivoVinculado } = require("../models");
const {
    crearTokenTemporal,
    validarTokenTemporal
} = require("../services/tokenTemporal.service");

// ===============================
// GENERAR QR (usuario logueado en el sitio web)
// ===============================
exports.generarQR = async (req, res) => {
    try {
        console.log("USUARIO AUTH:", req.usuario);
        console.log("CREANDO TOKEN PARA:", req.usuario.id_usuario);
        const token = crearTokenTemporal(req.usuario.id_usuario);

        res.json({
            token,
            expira_en_segundos: 120
        });

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al generar código de vinculación",
            error: error.message
        });
    }
};

// ===============================
// CONFIRMAR VÍNCULO (desde la app del watch)
// ===============================
exports.confirmarVinculo = async (req, res) => {
    try {
        const { token, device_id, push_token, nombre_dispositivo } = req.body;

        if (!token || !device_id) {
            return res.status(400).json({
                mensaje: "Token y device_id son obligatorios"
            });
        }

        const id_usuario = validarTokenTemporal(token);

        if (!id_usuario) {
            return res.status(400).json({
                mensaje: "Código inválido o expirado"
            });
        }

        const [dispositivo, creado] = await DispositivoVinculado.findOrCreate({
            where: { device_id },
            defaults: {
                id_usuario,
                push_token,
                nombre_dispositivo,
                activo: true
            }
        });

        if (!creado) {
            await dispositivo.update({
                id_usuario,
                push_token,
                nombre_dispositivo,
                activo: true
            });
        }

        res.json({
            mensaje: "Dispositivo vinculado correctamente",
            dispositivo
        });

    } catch (error) {
        console.error("ERROR EN CONFIRMAR VINCULO:", error);
        res.status(500).json({
            mensaje: "Error al confirmar vínculo",
            error: error.message
        });
    }
};

// ===============================
// LISTAR MIS DISPOSITIVOS
// ===============================
exports.misDispositivos = async (req, res) => {
    try {
        const dispositivos = await DispositivoVinculado.findAll({
            where: {
                id_usuario: req.usuario.id_usuario,
                activo: true
            }
        });

        res.json(dispositivos);

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener dispositivos",
            error: error.message
        });
    }
};

// ===============================
// DESVINCULAR
// ===============================
exports.desvincular = async (req, res) => {
    try {
        const dispositivo = await DispositivoVinculado.findOne({
            where: {
                id_dispositivo: req.params.id,
                id_usuario: req.usuario.id_usuario
            }
        });

        if (!dispositivo) {
            return res.status(404).json({
                mensaje: "Dispositivo no encontrado"
            });
        }

        await dispositivo.update({ activo: false });

        res.json({ mensaje: "Dispositivo desvinculado correctamente" });

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al desvincular",
            error: error.message
        });
    }
};

// ===============================
// VALIDAR DEVICE_ID (para que el watch consulte estadísticas sin JWT de usuario)
// ===============================
exports.validarDispositivo = async (req, res, next) => {
    try {
        const device_id = req.headers["x-device-id"];

        if (!device_id) {
            return res.status(401).json({
                mensaje: "device_id requerido"
            });
        }

        const dispositivo = await DispositivoVinculado.findOne({
            where: { device_id, activo: true }
        });

        if (!dispositivo) {
            return res.status(401).json({
                mensaje: "Dispositivo no vinculado o inactivo"
            });
        }

        req.id_usuario_dispositivo = dispositivo.id_usuario;
        next();

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al validar dispositivo",
            error: error.message
        });
    }
};