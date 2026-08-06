const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");


const Producto = sequelize.define(
"Producto",
{

id_producto:{
    type:DataTypes.INTEGER,
    primaryKey:true,
    autoIncrement:true
},


nombre:{
    type:DataTypes.STRING(150),
    allowNull:false
},


descripcion:{
    type:DataTypes.TEXT,
    allowNull:true
},


precio:{
    type:DataTypes.DECIMAL(10,2),
    allowNull:false
},


stock:{
    type:DataTypes.INTEGER,
    defaultValue:0
},


talla:{
    type:DataTypes.STRING(10),
    allowNull:true
},


imagen:{
    type:DataTypes.STRING(255),
    allowNull:true
},


marcaId:{
    type:DataTypes.INTEGER,
    allowNull:false,
    field:"id_marca"
},


activo:{
    type:DataTypes.BOOLEAN,
    defaultValue:true
}


},
{
tableName:"productos",
timestamps:false
});


module.exports = Producto;