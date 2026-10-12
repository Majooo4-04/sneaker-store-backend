const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Resena = sequelize.define(
    "Resena",
    {
        id_resena: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_usuario: { type: DataTypes.INTEGER, allowNull: false },
        id_pedido: { type: DataTypes.INTEGER, allowNull: false },
        id_producto: { type: DataTypes.INTEGER, allowNull: false },
        foto: { type: DataTypes.STRING(255), allowNull: false },
        comentario: { type: DataTypes.TEXT, allowNull: false },
        calificacion: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
        recomienda: { type: DataTypes.BOOLEAN, allowNull: true },
        fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    },
    { tableName: "resenas", timestamps: false }
);

module.exports = Resena;