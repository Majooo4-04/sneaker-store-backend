const express = require("express");
const cors = require("cors");

const usuarioRoutes = require("./routes/usuario.routes");
const productoRoutes = require("./routes/producto.routes");
const marcaRoutes = require("./routes/marca.routes");
const favoritoRoutes = require("./routes/favorito.routes");
const carritoRoutes = require("./routes/carrito.routes");
const pedidoRoutes = require("./routes/pedido.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const dispositivoRoutes = require("./routes/dispositivo.routes");
const inventarioRoutes = require("./routes/inventario.routes");

const app = express();


app.use(cors());
app.use(express.json());


// RUTAS
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/productos", productoRoutes);
app.use("/api/marcas", marcaRoutes);
app.use("/api/favoritos", favoritoRoutes);
app.use("/api/carritos", carritoRoutes);
app.use("/api/pedidos", pedidoRoutes);
app.use("/api/admin", dashboardRoutes);
app.use("/api/dispositivos", dispositivoRoutes);
app.use("/api/inventario", inventarioRoutes);

app.get("/", (req, res) => {
    res.json({
        mensaje: "Backend tienda tenis funcionando"
    });
});


module.exports = app;