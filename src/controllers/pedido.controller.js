const {
    Pedido,
    DetallePedido,
    Carrito,
    DetalleCarrito,
    Producto,
    Usuario
} = require("../models");

const sequelize = require("../config/database");
const ExcelJS = require("exceljs");
const { Sequelize } = require("sequelize");


// ==========================================
// CREAR PEDIDO
// ==========================================

exports.crearPedido = async (req, res) => {

    const t = await sequelize.transaction();

    try {

        const { id_usuario } = req.body;


        if (!id_usuario) {

            await t.rollback();

            return res.status(400).json({
                mensaje:"El usuario es obligatorio."
            });

        }



        // Buscar carrito activo

        const carrito = await Carrito.findOne({

            where:{
                id_usuario,
                estado:"activo"
            },

            include:[

                {
                    model:DetalleCarrito,
                    as:"detalles",

                    include:[

                        {
                            model:Producto,
                            as:"producto"
                        }

                    ]
                }

            ],

            transaction:t

        });



        if(!carrito){

            await t.rollback();

            return res.status(404).json({

                mensaje:"No existe carrito activo."

            });

        }




        if(carrito.detalles.length === 0){

            await t.rollback();

            return res.status(400).json({

                mensaje:"El carrito está vacío."

            });

        }




        let total = 0;



        // =====================================
        // VALIDAR STOCK Y CALCULAR TOTAL
        // =====================================


        for(const detalle of carrito.detalles){


            const producto = await Producto.findByPk(

                detalle.id_producto,

                {
                    transaction:t
                }

            );



            if(!producto){

                throw new Error(
                    `Producto ${detalle.id_producto} no encontrado`
                );

            }



            if(producto.stock < detalle.cantidad){

                throw new Error(
                    `Stock insuficiente para ${producto.nombre}`
                );

            }



            total += detalle.cantidad * detalle.precio_unitario;


        }




        // =====================================
        // CREAR PEDIDO
        // =====================================


        const pedido = await Pedido.create({

            id_usuario,

            total,

            estado:"PENDIENTE"

        },
        {
            transaction:t
        });



        // =====================================
        // CREAR DETALLES Y DESCONTAR STOCK
        // =====================================


        for(const detalle of carrito.detalles){



            await DetallePedido.create({

                id_pedido:pedido.id_pedido,

                id_producto:detalle.id_producto,

                cantidad:detalle.cantidad,

                precio_compra:detalle.precio_unitario

            },
            {
                transaction:t
            });





            const producto = await Producto.findByPk(

                detalle.id_producto,

                {
                    transaction:t
                }

            );



            producto.stock -= detalle.cantidad;



            await producto.save({

                transaction:t

            });


        }




        // =====================================
        // CAMBIAR CARRITO
        // =====================================


        carrito.estado="completado";


        await carrito.save({

            transaction:t

        });




        await t.commit();



        res.status(201).json({

            mensaje:"Pedido realizado correctamente.",

            pedido

        });



    }catch(error){


        await t.rollback();


        res.status(500).json({

            mensaje:"Error al crear pedido.",

            error:error.message

        });


    }

};





// ==========================================
// OBTENER PEDIDOS DE USUARIO
// ==========================================

exports.obtenerPedidosUsuario = async(req,res)=>{

    try{


        const pedidos = await Pedido.findAll({

            where:{
                id_usuario:req.params.idUsuario
            },

            order:[

                ["fecha_pedido","DESC"]

            ]

        });



        res.json(pedidos);



    }catch(error){


        res.status(500).json({

            mensaje:"Error al obtener pedidos.",

            error:error.message

        });


    }

};






// ==========================================
// OBTENER PEDIDO COMPLETO
// ==========================================

exports.obtenerPedido = async(req,res)=>{


    try{


        const pedido = await Pedido.findByPk(

            req.params.id,

            {

                include:[

                    {

                        model:DetallePedido,

                        as:"detalles",


                        include:[

                            {

                                model:Producto,

                                as:"producto",

                                attributes:[

                                    "id_producto",
                                    "nombre",
                                    "imagen"

                                ]

                            }

                        ]

                    }

                ]

            }

        );




        if(!pedido){

            return res.status(404).json({

                mensaje:"Pedido no encontrado"

            });

        }




        res.json(pedido);



    }catch(error){


        res.status(500).json({

            mensaje:"Error al obtener pedido.",

            error:error.message

        });


    }


};







// ==========================================
// OBTENER TODOS LOS PEDIDOS ADMIN
// ==========================================

exports.obtenerPedidos = async(req,res)=>{


    try{


        const pedidos = await Pedido.findAll({

            include:[

                {

                    model:Usuario,

                    as:"usuario",

                    attributes:[

                        "id_usuario",
                        "nombre",
                        "apellido",
                        "correo"

                    ]

                }

            ],


            order:[

                ["fecha_pedido","DESC"]

            ]

        });



        res.json(pedidos);



    }catch(error){


        res.status(500).json({

            mensaje:"Error al obtener pedidos.",

            error:error.message

        });


    }


};







// ==========================================
// ACTUALIZAR ESTADO PEDIDO ADMIN
// ==========================================

exports.actualizarEstado = async(req,res)=>{


    const t = await sequelize.transaction();


    try{


        const pedido = await Pedido.findByPk(

            req.params.id,

            {

                include:[

                    {

                        model:DetallePedido,

                        as:"detalles"

                    }

                ],

                transaction:t

            }

        );




        if(!pedido){


            await t.rollback();


            return res.status(404).json({

                mensaje:"Pedido no encontrado"

            });


        }





        const estadosPermitidos=[

            "PENDIENTE",

            "PAGADO",

            "ENVIADO",

            "ENTREGADO",

            "CANCELADO"

        ];




        const nuevoEstado=req.body.estado;




        if(!estadosPermitidos.includes(nuevoEstado)){


            await t.rollback();


            return res.status(400).json({

                mensaje:"Estado no válido"

            });


        }





        // =====================================
        // DEVOLVER STOCK SI SE CANCELA
        // =====================================


        if(

            nuevoEstado==="CANCELADO" &&

            pedido.estado!=="CANCELADO"

        ){


            for(const detalle of pedido.detalles){



                const producto = await Producto.findByPk(

                    detalle.id_producto,

                    {
                        transaction:t
                    }

                );



                if(producto){


                    producto.stock += detalle.cantidad;



                    await producto.save({

                        transaction:t

                    });


                }


            }


        }





        pedido.estado=nuevoEstado;



        await pedido.save({

            transaction:t

        });





        await t.commit();




        res.json({

            mensaje:"Estado actualizado correctamente.",

            pedido

        });




    }catch(error){



        await t.rollback();



        res.status(500).json({

            mensaje:"Error al actualizar estado.",

            error:error.message

        });


    }


};
// ==========================================
// EXPORTAR PEDIDOS A EXCEL
// ==========================================

exports.exportarPedidos = async (req, res) => {

    try {

        const pedidos = await Pedido.findAll({

            include: [

                {

                    model: Usuario,

                    as: "usuario",

                    attributes: [

                        "nombre",
                        "apellido",
                        "correo"

                    ]

                }

            ],

            order: [

                ["fecha_pedido", "DESC"]

            ]

        });

        const workbook = new ExcelJS.Workbook();

        const worksheet = workbook.addWorksheet("Pedidos");

        worksheet.columns = [

            {
                header: "Pedido",
                key: "pedido",
                width: 12
            },

            {
                header: "Cliente",
                key: "cliente",
                width: 30
            },

            {
                header: "Correo",
                key: "correo",
                width: 35
            },

            {
                header: "Fecha",
                key: "fecha",
                width: 22
            },

            {
                header: "Total",
                key: "total",
                width: 15
            },

            {
                header: "Estado",
                key: "estado",
                width: 18
            }

        ];

        pedidos.forEach(pedido => {

            worksheet.addRow({

                pedido: pedido.id_pedido,

                cliente: `${pedido.usuario?.nombre ?? ""} ${pedido.usuario?.apellido ?? ""}`,

                correo: pedido.usuario?.correo,

                fecha: new Date(pedido.fecha_pedido).toLocaleString(),

                total: pedido.total,

                estado: pedido.estado

            });

        });

        worksheet.getRow(1).font = {

            bold: true

        };

        res.setHeader(

            "Content-Type",

            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

        );

        res.setHeader(

            "Content-Disposition",

            `attachment; filename=Pedidos.xlsx`

        );

        await workbook.xlsx.write(res);

        res.end();

    } catch (error) {

        res.status(500).json({

            mensaje: "Error al exportar pedidos.",

            error: error.message

        });

    }

};
exports.ventasPorMes = async (req, res) => {

    try {

        const ventas = await Pedido.findAll({

            attributes: [
                [Sequelize.fn("DATE_FORMAT", Sequelize.col("fecha_pedido"), "%Y-%m"), "mes"],
                [Sequelize.fn("SUM", Sequelize.col("total")), "total_ventas"],
                [Sequelize.fn("COUNT", Sequelize.col("id_pedido")), "cantidad_pedidos"]
            ],

            group: ["mes"],

            order: [[Sequelize.literal("mes"), "ASC"]],

            raw: true

        });

        res.json(ventas);

    } catch (error) {

        res.status(500).json({
            mensaje: "Error al obtener ventas por mes.",
            error: error.message
        });

    }

};
// ==========================================
// ÚLTIMO PEDIDO PARA SMARTWATCH
// ==========================================

exports.ultimoPedidoWatch = async (req, res) => {
    try {

        const pedido = await Pedido.findOne({

            where: {
                id_usuario: req.id_usuario_dispositivo
            },

            order: [
                ["fecha_pedido", "DESC"]
            ]

        });

        if (!pedido) {
            return res.json({
                id_pedido: "-",
                estatus: "Sin pedidos"
            });
        }

        res.json({
            id_pedido: pedido.id_pedido,
            estatus: pedido.estado
        });

    } catch (error) {

        res.status(500).json({
            mensaje: "Error al obtener el pedido.",
            error: error.message
        });

    }
};