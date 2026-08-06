const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Carrito = sequelize.define(
    "Carrito",
    {

        id_carrito: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        id_usuario: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        estado: {
            type: DataTypes.ENUM("activo", "completado"),
            defaultValue: "activo"
        }

    },
    {
        tableName: "carritos",
        timestamps: false
    }
);

module.exports = Carrito;