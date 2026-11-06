const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MensajeReporte = sequelize.define(
    "MensajeReporte",
    {
        id_mensaje: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_reporte: { type: DataTypes.INTEGER, allowNull: false },
        id_emisor: { type: DataTypes.INTEGER, allowNull: false },
        texto: { type: DataTypes.TEXT, allowNull: false },
        foto: { type: DataTypes.STRING(255), allowNull: true },
        fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    },
    { tableName: "mensajes_reporte", timestamps: false }
);

module.exports = MensajeReporte;