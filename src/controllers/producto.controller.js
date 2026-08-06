const { Producto, Marca } = require("../models");

// ===============================
// OBTENER TODOS LOS PRODUCTOS
// ===============================

exports.obtenerProductos = async (req, res) => {

    try {

        const productos = await Producto.findAll({

            where: {
                activo: true
            },

            include: [
                {
                    model: Marca,
                    as: "marca",
                    attributes: ["id_marca", "nombre"]
                }
            ],

            order: [["id_producto", "ASC"]]

        });

        res.json(productos);

    } catch (error) {

        res.status(500).json({
            mensaje: "Error al obtener productos",
            error: error.message
        });

    }

};


// ===============================
// OBTENER PRODUCTO POR ID
// ===============================

exports.obtenerProducto = async (req, res) => {

    try {

        const producto = await Producto.findOne({

            where: {
                id_producto: req.params.id,
                activo: true
            },

            include: [
                {
                    model: Marca,
                    as: "marca",
                    attributes: ["id_marca", "nombre"]
                }
            ]

        });

        if (!producto) {

            return res.status(404).json({
                mensaje: "Producto no encontrado"
            });

        }

        res.json(producto);

    } catch (error) {

        res.status(500).json({
            mensaje: "Error al buscar producto",
            error: error.message
        });

    }

};


// ===============================
// CREAR PRODUCTO (ADMIN)
// ===============================

// ===============================
// CREAR PRODUCTO (ADMIN)
// ===============================

exports.crearProducto = async (req, res) => {

    try {

        const {
            nombre,
            descripcion,
            precio,
            stock,
            talla,
            imagen,
            marcaId
        } = req.body;

        // Verificar que la marca exista

        const marca = await Marca.findByPk(marcaId);

        if (!marca) {

            return res.status(404).json({
                mensaje: "La marca no existe"
            });

        }

        // Verificar que no exista un producto con el mismo nombre

        const productoExiste = await Producto.findOne({

            where: {
                nombre,
                activo: true
            }

        });

        if (productoExiste) {

            return res.status(400).json({
                mensaje: "Ya existe un producto con ese nombre"
            });

        }

        const producto = await Producto.create({

            nombre,
            descripcion,
            precio,
            stock,
            talla,
            imagen,
            marcaId,
            activo: true

        });

        res.status(201).json({

            mensaje: "Producto creado correctamente",
            producto

        });

    } catch (error) {

        res.status(500).json({

            mensaje: "Error al crear producto",
            error: error.message

        });

    }

};


// ===============================
// ACTUALIZAR PRODUCTO (ADMIN)
// ===============================

// ===============================
// ACTUALIZAR PRODUCTO (ADMIN)
// ===============================

exports.actualizarProducto = async (req, res) => {

    try {

        const producto = await Producto.findOne({

            where: {
                id_producto: req.params.id,
                activo: true
            }

        });

        if (!producto) {

            return res.status(404).json({
                mensaje: "Producto no encontrado"
            });

        }

        const {
            nombre,
            descripcion,
            precio,
            stock,
            talla,
            imagen,
            marcaId
        } = req.body;

        // Verificar que la marca exista

        const marca = await Marca.findByPk(marcaId);

        if (!marca) {

            return res.status(404).json({
                mensaje: "La marca no existe"
            });

        }

        // Verificar que no exista otro producto con el mismo nombre

        const productoExiste = await Producto.findOne({

            where: {
                nombre,
                activo: true
            }

        });

        if (
            productoExiste &&
            productoExiste.id_producto !== producto.id_producto
        ) {

            return res.status(400).json({
                mensaje: "Ya existe un producto con ese nombre"
            });

        }

        await producto.update({

            nombre,
            descripcion,
            precio,
            stock,
            talla,
            imagen,
            marcaId

        });

        res.json({

            mensaje: "Producto actualizado correctamente",
            producto

        });

    } catch (error) {

        res.status(500).json({

            mensaje: "Error al actualizar producto",
            error: error.message

        });

    }

};


// ===============================
// ELIMINAR PRODUCTO (ADMIN)
// ===============================

exports.eliminarProducto = async (req, res) => {

    try {

        const producto = await Producto.findOne({

            where: {
                id_producto: req.params.id,
                activo: true
            }

        });

        if (!producto) {

            return res.status(404).json({

                mensaje: "Producto no encontrado"

            });

        }

        await producto.update({

            activo: false

        });

        res.json({

            mensaje: "Producto eliminado correctamente"

        });

    } catch (error) {

        res.status(500).json({

            mensaje: "Error al eliminar producto",
            error: error.message

        });

    }

};