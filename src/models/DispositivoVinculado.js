const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DispositivoVinculado = sequelize.define(
    "DispositivoVinculado",
    {
        id_dispositivo: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        id_usuario: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        device_id: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true
        },
        push_token: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        nombre_dispositivo: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        fecha_vinculacion: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        activo: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    },
    {
        tableName: "dispositivos_vinculados",
        timestamps: false
    }
);

module.exports = DispositivoVinculado;