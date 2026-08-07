const sequelize = require("../config/database");


const Usuario = require("./Usuario");
const Producto = require("./Producto");
const Pedido = require("./Pedido");
const DetallePedido = require("./DetallePedido");

const Carrito = require("./Carrito");
const DetalleCarrito = require("./DetalleCarrito");

const Favorito = require("./Favorito");
const Marca = require("./Marca");

const MovimientoInventario = require("./Movimientoinventario");
const DispositivoVinculado = require("./DispositivoVinculado");

// ======================================
// USUARIO - PEDIDO
// ======================================


Usuario.hasMany(Pedido,{

    foreignKey:"id_usuario",

    as:"pedidos"

});


Pedido.belongsTo(Usuario,{

    foreignKey:"id_usuario",

    as:"usuario"

});



// ======================================
// PEDIDO - DETALLE PEDIDO
// ======================================


Pedido.hasMany(DetallePedido,{

    foreignKey:"id_pedido",

    as:"detalles"

});


DetallePedido.belongsTo(Pedido,{

    foreignKey:"id_pedido",

    as:"pedido"

});



// ======================================
// PRODUCTO - DETALLE PEDIDO
// ======================================


Producto.hasMany(DetallePedido,{

    foreignKey:"id_producto",

    as:"detallesPedido"

});


DetallePedido.belongsTo(Producto,{

    foreignKey:"id_producto",

    as:"producto"

});



// ======================================
// CARRITO - DETALLE CARRITO
// ======================================


Carrito.hasMany(DetalleCarrito,{

    foreignKey:"id_carrito",

    as:"detalles"

});


DetalleCarrito.belongsTo(Carrito,{

    foreignKey:"id_carrito",

    as:"carrito"

});



// ======================================
// PRODUCTO - DETALLE CARRITO
// ======================================


Producto.hasMany(DetalleCarrito,{

    foreignKey:"id_producto",

    as:"detallesCarrito"

});


DetalleCarrito.belongsTo(Producto,{

    foreignKey:"id_producto",

    as:"producto"

});



// ======================================
// USUARIO - CARRITO
// ======================================


Usuario.hasMany(Carrito,{

    foreignKey:"id_usuario",

    as:"carritos"

});


Carrito.belongsTo(Usuario,{

    foreignKey:"id_usuario",

    as:"usuario"

});


// ======================================
// MARCA - PRODUCTO
// ======================================


Marca.hasMany(Producto,{

    foreignKey:"marcaId",

    as:"productos"

});


Producto.belongsTo(Marca,{

    foreignKey:"marcaId",

    as:"marca"

});


// ======================================
// FAVORITO - PRODUCTO
// ======================================

Producto.hasMany(Favorito,{
    foreignKey:"id_producto",
    as:"favoritos"
});

Favorito.belongsTo(Producto,{
    foreignKey:"id_producto",
    as:"producto"
});


// ======================================
// PRODUCTO - MOVIMIENTO INVENTARIO
// ======================================

Producto.hasMany(MovimientoInventario,{

    foreignKey:"id_producto",

    as:"movimientos"

});

MovimientoInventario.belongsTo(Producto,{

    foreignKey:"id_producto",

    as:"producto"

});

// ======================================
// USUARIO - DISPOSITIVO VINCULADO
// ======================================

Usuario.hasMany(DispositivoVinculado, {
    foreignKey: "id_usuario",
    as: "dispositivos"
});

DispositivoVinculado.belongsTo(Usuario, {
    foreignKey: "id_usuario",
    as: "usuario"
});
// ======================================
// EXPORTAR
// ======================================


module.exports = {

    sequelize,

    Usuario,

    Producto,

    Pedido,

    DetallePedido,

    Carrito,

    DetalleCarrito,

    Favorito,

    Marca,

    MovimientoInventario,
    DispositivoVinculado

};