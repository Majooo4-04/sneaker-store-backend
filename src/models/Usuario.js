const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Usuario = sequelize.define(
    "usuarios",
    {
        id_usuario:{
            type:DataTypes.INTEGER,
            primaryKey:true,
            autoIncrement:true
        },

        nombre:{
            type:DataTypes.STRING(50),
            allowNull:false
        },

        apellido:{
            type:DataTypes.STRING(50),
            allowNull:false
        },

        correo:{
            type:DataTypes.STRING(100),
            allowNull:false,
            unique:true
        },

        password:{
            type:DataTypes.STRING(255),
            allowNull:false
        },

        telefono:{
            type:DataTypes.STRING(20)
        },

        direccion:{
            type:DataTypes.STRING(200)
        },

        ciudad:{
            type:DataTypes.STRING(50)
        },

        rol:{
            type:DataTypes.ENUM("ADMIN","CLIENTE"),
            defaultValue:"CLIENTE"
        },

        activo:{
            type:DataTypes.BOOLEAN,
            defaultValue:true
        },

        fecha_registro:{
            type:DataTypes.DATE,
            defaultValue:DataTypes.NOW
        }
    },
    {
        tableName:"usuarios",
        timestamps:false
    }
);

module.exports = Usuario;