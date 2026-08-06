const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");


const Pedido = sequelize.define(

    "Pedido",

    {

        id_pedido:{

            type:DataTypes.INTEGER,

            primaryKey:true,

            autoIncrement:true

        },


        id_usuario:{

            type:DataTypes.INTEGER,

            allowNull:false

        },


        fecha_pedido:{

            type:DataTypes.DATE,

            allowNull:false,

            defaultValue:DataTypes.NOW

        },


        total:{

            type:DataTypes.DECIMAL(10,2),

            allowNull:false

        },


        estado:{

            type:DataTypes.ENUM(

                "PENDIENTE",
                "PAGADO",
                "ENVIADO",
                "ENTREGADO",
                "CANCELADO"

            ),

            allowNull:false,

            defaultValue:"PENDIENTE"

        }


    },


    {

        tableName:"pedidos",

        timestamps:false

    }

);


module.exports = Pedido;