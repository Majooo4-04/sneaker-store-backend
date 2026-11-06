const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Reporte = sequelize.define(
    "Reporte",
    {
        id_reporte: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_usuario: { type: DataTypes.INTEGER, allowNull: false },
        id_pedido: { type: DataTypes.INTEGER, allowNull: false },
        id_producto: { type: DataTypes.INTEGER, allowNull: true },
        tipo: { type: DataTypes.STRING(40), allowNull: false },
        descripcion: { type: DataTypes.TEXT, allowNull: false },
        foto: { type: DataTypes.STRING(255), allowNull: true },
        prioridad: { type: DataTypes.ENUM("BAJA", "MEDIA", "ALTA"), allowNull: false, defaultValue: "MEDIA" },
        estado: {
            type: DataTypes.ENUM("ABIERTO", "ASIGNADO", "EN_ATENCION", "RESUELTO"),
            allowNull: false,
            defaultValue: "ABIERTO"
        },
        id_agente: { type: DataTypes.INTEGER, allowNull: true },
        activo: { type: DataTypes.BOOLEAN, defaultValue: true },
        fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    },
    { tableName: "reportes", timestamps: false }
);

module.exports = Reporte;