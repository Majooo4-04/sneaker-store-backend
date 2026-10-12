const express = require("express");
const cors = require("cors");

const usuarioRoutes = require("./routes/usuario.routes");
const productoRoutes = require("./routes/producto.routes");
const marcaRoutes = require("./routes/marca.routes");
const favoritoRoutes = require("./routes/favorito.routes");
const carritoRoutes = require("./routes/carrito.routes");
const pedidoRoutes = require("./routes/pedido.routes");
const dashboardRoutes = require("./routes/dashboard.routes.js");
const dispositivoRoutes = require("./routes/dispositivo.routes");
const inventarioRoutes = require("./routes/inventario.routes");
const resenaRoutes = require("./routes/resena.routes");
const path = require("path");

const app = express();
app.set("trust proxy", 1);


// ===============================
// CONFIGURACIÓN CORS
// ===============================

app.use(cors({
    origin: [
        "http://localhost:5173",
         "https://sneaker-store-frontend-kcfgb1fz5-sneaker-store1.vercel.app",
         "https://sneaker-store-frontend-pi.vercel.app",
         "http://localhost:8101",
         "http://localhost:8100",
         "http://localhost",
        "https://localhost",
    ],
    credentials: true
})
);


app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// ===============================
// RUTAS API
// ===============================

app.use("/api/usuarios", usuarioRoutes);
app.use("/api/productos", productoRoutes);
app.use("/api/marcas", marcaRoutes);
app.use("/api/favoritos", favoritoRoutes);
app.use("/api/carritos", carritoRoutes);
app.use("/api/pedidos", pedidoRoutes);
app.use("/api/admin",  dashboardRoutes);
app.use("/api/dispositivos", dispositivoRoutes);
app.use("/api/inventario", inventarioRoutes);
app.use("/api/resenas", resenaRoutes);


// ===============================
// PRUEBA DEL SERVIDOR
// ===============================

app.get("/", (req, res) => {
    res.json({
        mensaje: "Backend tienda tenis funcionando"
    });
});


module.exports = app;