const { Favorito, Producto } = require("../models");


// Obtener favoritos de un usuario

exports.obtenerFavoritos = async(req,res)=>{

    try{

        const favoritos = await Favorito.findAll({

            where:{
                id_usuario:req.params.idUsuario
            },

            include:[
                {
                    model:Producto,
                    as:"producto"
                }
            ]

        });

        res.json(favoritos);

    }catch(error){

        res.status(500).json({
            mensaje:"Error al obtener favoritos",
            error:error.message
        });

    }

};



// Agregar favorito

exports.agregarFavorito = async(req,res)=>{

    try{

        const {id_usuario,id_producto}=req.body;

        const existe = await Favorito.findOne({

            where:{
                id_usuario,
                id_producto
            }

        });

        if(existe){

            return res.status(400).json({
                mensaje:"El producto ya está en favoritos"
            });

        }

        const favorito = await Favorito.create({

            id_usuario,
            id_producto

        });

        res.status(201).json({

            mensaje:"Producto agregado a favoritos",
            favorito

        });

    }catch(error){

        res.status(500).json({

            mensaje:"Error al agregar favorito",
            error:error.message

        });

    }

};



// Eliminar favorito

exports.eliminarFavorito = async(req,res)=>{

    try{

        const favorito = await Favorito.findByPk(req.params.id);

        if(!favorito){

            return res.status(404).json({
                mensaje:"Favorito no encontrado"
            });

        }

        await favorito.destroy();

        res.json({

            mensaje:"Favorito eliminado"

        });

    }catch(error){

        res.status(500).json({

            mensaje:"Error al eliminar favorito",
            error:error.message

        });

    }

};