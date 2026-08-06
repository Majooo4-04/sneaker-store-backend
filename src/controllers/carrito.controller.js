const {
    Carrito,
    DetalleCarrito,
    Producto
} = require("../models");



// ==========================================
// OBTENER CARRITO DEL USUARIO
// ==========================================

exports.obtenerCarrito = async (req, res) => {

    try {


        console.log("ID Usuario:", req.params.idUsuario);



        const carrito = await Carrito.findOne({

            where: {

                id_usuario: req.params.idUsuario,

                estado: "activo"

            },


            include: [

                {

                    model: DetalleCarrito,

                    as: "detalles",


                    include: [

                        {

                            model: Producto,

                            as: "producto",

                            attributes:[

                                "id_producto",
                                "nombre",
                                "precio",
                                "imagen",
                                "stock"

                            ]

                        }

                    ]

                }

            ]

        });



        console.log("Carrito encontrado:");

        console.log(carrito);



        if(!carrito){

            return res.status(404).json({

                mensaje:"No existe carrito activo"

            });

        }



        res.json(carrito);



    }catch(error){


        console.log(error);



        res.status(500).json({

            mensaje:"Error al obtener carrito",

            error:error.message

        });


    }

};





// ==========================================
// AGREGAR PRODUCTO AL CARRITO
// ==========================================

exports.agregarProducto = async(req,res)=>{


    try{


        const{

            id_usuario,

            id_producto,

            cantidad

        } = req.body;



        // VALIDACIONES

        if(!id_usuario){

            return res.status(400).json({

                mensaje:"El usuario es obligatorio"

            });

        }



        if(!id_producto){

            return res.status(400).json({

                mensaje:"El producto es obligatorio"

            });

        }



        if(!cantidad || cantidad <= 0){

            return res.status(400).json({

                mensaje:"La cantidad debe ser mayor a 0"

            });

        }




        // BUSCAR CARRITO ACTIVO


        let carrito = await Carrito.findOne({

            where:{

                id_usuario,

                estado:"activo"

            }

        });



        // CREAR CARRITO SI NO EXISTE


        if(!carrito){


            carrito = await Carrito.create({

                id_usuario,

                estado:"activo"

            });


        }





        // BUSCAR PRODUCTO


        const producto = await Producto.findByPk(id_producto);



        if(!producto){


            return res.status(404).json({

                mensaje:"Producto no encontrado"

            });


        }





        // VALIDAR STOCK


        if(producto.stock < cantidad){


            return res.status(400).json({

                mensaje:"No hay suficiente stock disponible"

            });


        }





        // BUSCAR PRODUCTO EN CARRITO


        let detalle = await DetalleCarrito.findOne({

            where:{

                id_carrito:carrito.id_carrito,

                id_producto

            }

        });





        if(detalle){



            const nuevaCantidad =
            detalle.cantidad + cantidad;



            if(producto.stock < nuevaCantidad){


                return res.status(400).json({

                    mensaje:"La cantidad supera el stock disponible"

                });


            }




            detalle.cantidad = nuevaCantidad;



            await detalle.save();



        }else{


            detalle = await DetalleCarrito.create({

                id_carrito:carrito.id_carrito,

                id_producto,

                cantidad,

                precio_unitario:producto.precio

            });


        }




        res.status(201).json({

            mensaje:"Producto agregado al carrito",

            detalle

        });



    }catch(error){


        res.status(500).json({

            mensaje:"Error al agregar producto",

            error:error.message

        });


    }


};






// ==========================================
// ACTUALIZAR CANTIDAD
// ==========================================

exports.actualizarCantidad = async(req,res)=>{


    try{


        const detalle = await DetalleCarrito.findByPk(

            req.params.id

        );



        if(!detalle){


            return res.status(404).json({

                mensaje:"Producto no encontrado en carrito"

            });


        }




        const cantidad = req.body.cantidad;



        if(!cantidad || cantidad <= 0){


            return res.status(400).json({

                mensaje:"Cantidad inválida"

            });


        }





        const producto = await Producto.findByPk(

            detalle.id_producto

        );



        if(producto.stock < cantidad){


            return res.status(400).json({

                mensaje:"No hay suficiente stock"

            });


        }




        detalle.cantidad = cantidad;



        await detalle.save();




        res.json({

            mensaje:"Cantidad actualizada",

            detalle

        });




    }catch(error){


        res.status(500).json({

            mensaje:"Error al actualizar cantidad",

            error:error.message

        });


    }


};






// ==========================================
// ELIMINAR PRODUCTO DEL CARRITO
// ==========================================

exports.eliminarProducto = async(req,res)=>{


    try{


        const detalle = await DetalleCarrito.findByPk(

            req.params.id

        );



        if(!detalle){


            return res.status(404).json({

                mensaje:"Producto no encontrado"

            });


        }




        await detalle.destroy();




        res.json({

            mensaje:"Producto eliminado del carrito"

        });




    }catch(error){


        res.status(500).json({

            mensaje:"Error al eliminar producto",

            error:error.message

        });


    }


};