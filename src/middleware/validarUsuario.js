const validarUsuario = (req, res, next) => {

    const {
        nombre,
        apellido,
        correo,
        password,
        telefono
    } = req.body;


    // Campos obligatorios

    if (!nombre || !apellido || !correo || !password || !telefono) {
        return res.status(400).json({
            mensaje: "Todos los campos son obligatorios"
        });
    }


    // Validar nombre

    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

    if (!soloLetras.test(nombre)) {
        return res.status(400).json({
            mensaje: "El nombre solo debe contener letras"
        });
    }


    if (!soloLetras.test(apellido)) {
        return res.status(400).json({
            mensaje: "El apellido solo debe contener letras"
        });
    }


    // Validar correo

    const formatoCorreo =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!formatoCorreo.test(correo)) {
        return res.status(400).json({
            mensaje: "Correo electrónico inválido"
        });
    }


    // Validar contraseña

    /*
        Mínimo:
        8 caracteres
        1 mayúscula
        1 minúscula
        1 número
    */

    const formatoPassword =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;


    if (!formatoPassword.test(password)) {
        return res.status(400).json({
            mensaje:
            "La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número"
        });
    }


    // Validar teléfono México

    const formatoTelefono =
    /^[0-9]{10}$/;


    if (!formatoTelefono.test(telefono)) {
        return res.status(400).json({
            mensaje:
            "El teléfono debe contener exactamente 10 números"
        });
    }


    next();

};


module.exports = validarUsuario;