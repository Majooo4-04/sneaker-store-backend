const { Marca } = require("../models");
const { fn, col, where } = require("sequelize");

// ===============================
// OBTENER TODAS LAS MARCAS
// ===============================

exports.obtenerMarcas = async (req, res) => {

    try {

        const marcas = await Marca.findAll();

        res.json(marcas);

    } catch (error) {

        res.status(500).json({
            mensaje: "Error al obtener marcas",
            error: error.message
        });

    }

};


// ===============================
// OBTENER MARCA POR ID
// ===============================

exports.obtenerMarca = async (req, res) => {

    try {

        const marca = await Marca.findByPk(req.params.id);

        if (!marca) {

            return res.status(404).json({
                mensaje: "Marca no encontrada"
            });

        }

        res.json(marca);

    } catch (error) {

        res.status(500).json({
            mensaje: "Error al buscar marca",
            error: error.message
        });

    }

};


// ===============================
// CREAR MARCA
// ===============================

exports.crearMarca = async (req, res) => {

    try {

        let { nombre } = req.body;

        if (!nombre || nombre.trim() === "") {

            return res.status(400).json({
                mensaje: "El nombre de la marca es obligatorio."
            });

        }

        nombre = nombre.trim();

      const existe = await Marca.findOne({
    where: where(
        fn("LOWER", col("nombre")),
        nombre.toLowerCase()
    )
});

        if (existe) {

            return res.status(400).json({
                mensaje: "La marca ya está registrada."
            });

        }

        const marca = await Marca.create({
            nombre
        });

        res.status(201).json({

            mensaje: "Marca creada correctamente.",
            marca

        });

    } catch (error) {

        res.status(500).json({

            mensaje: "Error al crear la marca.",
            error: error.message

        });

    }

};


// ===============================
// ACTUALIZAR MARCA
// ===============================

exports.actualizarMarca = async (req, res) => {

    try {

        const marca = await Marca.findByPk(req.params.id);

        if (!marca) {

            return res.status(404).json({

                mensaje: "Marca no encontrada"

            });

        }

        await marca.update(req.body);

        res.json({

            mensaje: "Marca actualizada correctamente",
            marca

        });

    } catch (error) {

        res.status(500).json({

            mensaje: "Error al actualizar marca",
            error: error.message

        });

    }

};


// ===============================
// ELIMINAR MARCA
// ===============================

exports.eliminarMarca = async (req, res) => {

    try {

        const marca = await Marca.findByPk(req.params.id);

        if (!marca) {

            return res.status(404).json({

                mensaje: "Marca no encontrada"

            });

        }

        await marca.update({
            activo: false
        });

        res.json({

            mensaje: "Marca eliminada correctamente"

        });

    } catch (error) {

        res.status(500).json({

            mensaje: "Error al eliminar marca",
            error: error.message

        });

    }

};