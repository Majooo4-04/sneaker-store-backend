const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MovimientoInventario = sequelize.define(
    "MovimientoInventario",
    {
        id_movimiento: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        id_producto: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        cantidad_anterior: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        cantidad_nueva: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        tipo_movimiento: {
            type: DataTypes.ENUM("entrada", "salida"),
            allowNull: false
        },

        fecha: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    },
    {
        tableName: "movimientos_inventario",
        timestamps: false
    }
);

module.exports = MovimientoInventario;