const jwt = require("jsonwebtoken");

// Crear token temporal para vincular dispositivo
exports.crearTokenTemporal = (id_usuario) => {
    return jwt.sign(
        {
            id_usuario,
            tipo: "VINCULACION_DISPOSITIVO"
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "120s"
        }
    );
};

// Validar token temporal enviado por el watch
exports.validarTokenTemporal = (token) => {
    try {
        const datos = jwt.verify(token, process.env.JWT_SECRET);

        console.log("DATOS DECODIFICADOS:", datos); // debug temporal

        if (datos.tipo !== "VINCULACION_DISPOSITIVO") {
            console.log("Token rechazado: tipo incorrecto ->", datos.tipo);
            return null;
        }

        return datos.id_usuario;

    } catch (error) {
        console.log("ERROR JWT:", error.message); // debug temporal
        return null;
    }
};