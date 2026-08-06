const validarProducto = (req, res, next) => {

    const {
        nombre,
        precio,
        stock,
        marcaId
    } = req.body;

    if (!nombre || !precio || stock === undefined || !marcaId) {
        return res.status(400).json({
            mensaje: "Todos los campos obligatorios deben ser enviados"
        });
    }

    if (nombre.trim().length < 3) {
        return res.status(400).json({
            mensaje: "El nombre debe tener mínimo 3 caracteres"
        });
    }

    if (isNaN(precio) || Number(precio) <= 0) {
        return res.status(400).json({
            mensaje: "Precio inválido"
        });
    }

    if (isNaN(stock) || Number(stock) < 0) {
        return res.status(400).json({
            mensaje: "Stock inválido"
        });
    }

    next();

};

module.exports = validarProducto;