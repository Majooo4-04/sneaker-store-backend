const { Usuario } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


// ===============================
// REGISTRAR USUARIO
// ===============================

exports.registrarUsuario = async (req, res) => {
console.log("BODY RECIBIDO:", req.body);
    try {

        const {
            nombre,
            apellido,
            correo,
            password,
            telefono,
            direccion,
            ciudad,
            rol
        } = req.body;


        // Verificar correo existente

        const usuarioExiste = await Usuario.findOne({
            where:{
                correo
            }
        });


        if(usuarioExiste){
            return res.status(400).json({
                mensaje:"El correo ya está registrado"
            });
        }


        // Encriptar contraseña

        const passwordEncriptada =
        await bcrypt.hash(password,10);



        const usuario = await Usuario.create({

            nombre,
            apellido,
            correo,
            password:passwordEncriptada,
            telefono,
            direccion,
            ciudad,

            // Si no manda rol será CLIENTE

            rol:rol || "CLIENTE",

            activo:true

        });


        res.status(201).json({

            mensaje:"Usuario registrado correctamente",

            usuario:{
    id_usuario:usuario.id_usuario,
    nombre:usuario.nombre,
    apellido:usuario.apellido,
    correo:usuario.correo,
    telefono:usuario.telefono,
    direccion:usuario.direccion,
    ciudad:usuario.ciudad,
    rol:usuario.rol,
    activo:usuario.activo,
    fecha_registro:usuario.fecha_registro
}

        });


    }catch(error){

        res.status(500).json({
            mensaje:"Error al registrar usuario",
            error:error.message
        });

    }

};


// ===============================
// CREAR USUARIO ADMIN
// ===============================

exports.crearUsuarioAdmin = async (req, res) => {

    try {

        const {
            nombre,
            apellido,
            correo,
            password,
            telefono,
            direccion,
            ciudad
        } = req.body;

        const existe = await Usuario.findOne({
            where: {
                correo
            }
        });

        if (existe) {

            return res.status(400).json({
                mensaje: "El correo ya existe"
            });

        }

        const passwordEncriptada =
            await bcrypt.hash(password, 10);

        const usuario = await Usuario.create({

            nombre,
            apellido,
            correo,
            password: passwordEncriptada,
            telefono,
            direccion,
            ciudad,

            // SIEMPRE ADMIN
            rol: "ADMIN",

            activo: true

        });

        res.status(201).json({

            mensaje: "Administrador creado correctamente",

            usuario

        });

    } catch (error) {

        res.status(500).json({

            mensaje: "Error creando administrador",

            error: error.message

        });

    }

};

// ===============================
// LOGIN
// ===============================

exports.login = async(req,res)=>{

    try{


        const {
            correo,
            password
        } = req.body;



        const usuario = await Usuario.findOne({

            where:{
                correo
            }

        });



        if(!usuario){

            return res.status(404).json({

                mensaje:"Usuario no encontrado"

            });

        }



        // Revisar si está activo

        if(!usuario.activo){

            return res.status(403).json({

                mensaje:"Usuario desactivado"

            });

        }




        // Comparar contraseña

        const passwordCorrecta =
        await bcrypt.compare(
            password,
            usuario.password
        );



        if(!passwordCorrecta){

            return res.status(401).json({

                mensaje:"Contraseña incorrecta"

            });

        }




        // Crear token

        const token = jwt.sign(

            {
                id_usuario:usuario.id_usuario,
                correo:usuario.correo,
                rol:usuario.rol
            },

            process.env.JWT_SECRET,

            {
                expiresIn:"2h"
            }

        );



        res.json({

            mensaje:"Login correcto",

            token,


            usuario:{
                id_usuario:usuario.id_usuario,
                nombre:usuario.nombre,
                rol:usuario.rol
            }

        });



    }catch(error){

        res.status(500).json({

            mensaje:"Error al iniciar sesión",
            error:error.message

        });

    }

};



// ===============================
// OBTENER USUARIOS
// ===============================


exports.obtenerUsuarios = async(req,res)=>{

    try{

        const usuarios =
        await Usuario.findAll();


        res.json(usuarios);


    }catch(error){

        res.status(500).json({

            mensaje:"Error",
            error:error.message

        });

    }

};




// ===============================
// OBTENER USUARIO POR ID
// ===============================


exports.obtenerUsuario = async(req,res)=>{

    try{


        const usuario =
        await Usuario.findByPk(
            req.params.id
        );


        if(!usuario){

            return res.status(404).json({

                mensaje:"Usuario no encontrado"

            });

        }


        res.json(usuario);



    }catch(error){

        res.status(500).json({

            mensaje:"Error",
            error:error.message

        });

    }

};
// ===============================
// OBTENER PERFIL DEL USUARIO LOGUEADO
// ===============================

exports.obtenerPerfil = async(req,res)=>{

    try{

        const usuario = await Usuario.findByPk(
            req.usuario.id_usuario,
            {
                attributes:{
                    exclude:["password"]
                }
            }
        );


        if(!usuario){
            return res.status(404).json({
                mensaje:"Usuario no encontrado"
            });
        }


        res.json(usuario);


    }catch(error){

        res.status(500).json({
            mensaje:"Error al obtener perfil",
            error:error.message
        });

    }

};



// ===============================
// ACTUALIZAR PERFIL (CLIENTE)
// ===============================

exports.actualizarPerfil = async (req, res) => {

    try {

        const usuario = await Usuario.findByPk(
            req.usuario.id_usuario
        );

        if (!usuario) {
            return res.status(404).json({
                mensaje: "Usuario no encontrado"
            });
        }

        const {
            nombre,
            apellido,
            correo,
            telefono,
            direccion,
            ciudad
        } = req.body;

        // Verificar que el correo no exista en otro usuario
        if (correo !== usuario.correo) {

            const existe = await Usuario.findOne({
                where: { correo }
            });

            if (existe) {
                return res.status(400).json({
                    mensaje: "El correo ya está registrado"
                });
            }
        }

        await usuario.update({

            nombre,
            apellido,
            correo,
            telefono,
            direccion,
            ciudad

        });

        res.json({

            mensaje: "Perfil actualizado correctamente",

            usuario: {

                id_usuario: usuario.id_usuario,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                correo: usuario.correo,
                telefono: usuario.telefono,
                direccion: usuario.direccion,
                ciudad: usuario.ciudad

            }

        });

}catch(error){

    console.log("ERROR ACTUALIZAR PERFIL");
    console.log(error);

    res.status(500).json({
        mensaje:"Error al actualizar perfil",
        error:error.message
    });

}

};



// ===============================
// EDITAR USUARIO (ADMIN)
// ===============================

exports.actualizarUsuarioAdmin = async (req, res) => {

    try {

        const usuario = await Usuario.findByPk(
            req.params.id
        );

        if (!usuario) {

            return res.status(404).json({
                mensaje: "Usuario no encontrado"
            });

        }

        const {
            nombre,
            apellido,
            correo,
            telefono,
            direccion,
            ciudad,
            rol,
            activo
        } = req.body;

        // Validar correo repetido
        if (correo && correo !== usuario.correo) {

            const existe = await Usuario.findOne({
                where: { correo }
            });

            if (existe) {
                return res.status(400).json({
                    mensaje: "El correo ya está registrado"
                });
            }

        }

        await usuario.update({

            nombre,
            apellido,
            correo,
            telefono,
            direccion,
            ciudad,
            rol,
            activo

        });

        res.json({

            mensaje: "Usuario actualizado correctamente",

            usuario: {

                id_usuario: usuario.id_usuario,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                correo: usuario.correo,
                telefono: usuario.telefono,
                direccion: usuario.direccion,
                ciudad: usuario.ciudad,
                rol: usuario.rol,
                activo: usuario.activo,
                fecha_registro: usuario.fecha_registro

            }

        });

    } catch (error) {

        res.status(500).json({

            mensaje: "Error al actualizar usuario",
            error: error.message

        });

    }

};



// ===============================
// ACTIVAR / DESACTIVAR USUARIO
// ===============================

exports.cambiarEstadoUsuario = async (req, res) => {

    try {

        const usuario = await Usuario.findByPk(req.params.id);


        if (!usuario) {
            return res.status(404).json({
                mensaje:"Usuario no encontrado"
            });
        }


        console.log("USUARIO ENCONTRADO:", usuario.nombre);
        console.log("ACTIVO ANTES:", usuario.activo);
        console.log("TIPO:", typeof usuario.activo);


        usuario.activo = !usuario.activo;


        console.log("ACTIVO DESPUÉS:", usuario.activo);


        await usuario.save();


        res.json({
            mensaje:"Estado actualizado",
            activo:usuario.activo
        });


    } catch(error){

        console.log(error);

        res.status(500).json({
            mensaje:"Error al cambiar estado",
            error:error.message
        });

    }

};
// ===============================
// CAMBIAR ESTADO USUARIO
// ===============================

exports.cambiarEstadoUsuario = async (req, res) => {

    try {

        const usuario = await Usuario.findByPk(req.params.id);

        if (!usuario) {

            return res.status(404).json({
                mensaje: "Usuario no encontrado"
            });

        }

        await usuario.update({

            activo: !usuario.activo

        });

        res.json({

            mensaje: "Estado actualizado correctamente",
            usuario

        });

    } catch (error) {

        res.status(500).json({

            mensaje: "Error al cambiar estado",
            error: error.message

        });

    }

};


// ===============================
// ELIMINAR USUARIO (LÓGICO)
// ===============================

exports.eliminarUsuario = async (req, res) => {

    try {

        const usuario = await Usuario.findByPk(req.params.id);

        if (!usuario) {

            return res.status(404).json({

                mensaje: "Usuario no encontrado"

            });

        }

        await usuario.update({

            activo: false

        });

        res.json({

            mensaje: "Usuario eliminado correctamente"

        });

    } catch (error) {

        res.status(500).json({

            mensaje: "Error al eliminar usuario",
            error: error.message

        });

    }

};