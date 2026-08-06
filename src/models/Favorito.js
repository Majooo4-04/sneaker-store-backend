const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Favorito = sequelize.define(
    "Favorito",
    {

        id_favorito: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        id_usuario: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        id_producto: {
            type: DataTypes.INTEGER,
            allowNull: false
        }

    },
    {
        tableName: "favoritos",
        timestamps: false
    }
);

module.exports = Favorito;