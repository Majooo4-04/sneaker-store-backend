const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Marca = sequelize.define(
    "Marca",
    {

        id_marca: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        nombre: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },

        activo: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }

    },
    {
        tableName: "marcas",
        timestamps: false
    }
);

module.exports = Marca;