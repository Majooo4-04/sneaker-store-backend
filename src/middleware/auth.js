const jwt = require("jsonwebtoken");

module.exports = (req,res,next)=>{

    const authHeader = req.headers.authorization;
   console.log("AUTH HEADER:", req.headers.authorization);

    if(!authHeader){
        return res.status(401).json({
            mensaje:"Token requerido"
        });
    }


    try{

        const token = authHeader.split(" ")[1];


        const usuario = jwt.verify(
            token,
            process.env.JWT_SECRET
        );


        // console.log("PAYLOAD JWT:", usuario);


        req.usuario = usuario;


        next();


    }catch(error){

        console.log(error.message);

        return res.status(401).json({
            mensaje:"Token inválido"
        });

    }

};