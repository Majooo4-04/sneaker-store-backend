const app = require("./app");

const sequelize = require("./config/database");


const PORT = process.env.PORT || 3001;


async function iniciarServidor(){

    try{

        await sequelize.authenticate();

        console.log("✅ MySQL conectado");


        app.listen(PORT,()=>{

            console.log(
                `🚀 Servidor corriendo en puerto ${PORT}`
            );

        });


    }catch(error){

        console.log(
            "❌ Error de conexión:",
            error
        );

    }

}


iniciarServidor();