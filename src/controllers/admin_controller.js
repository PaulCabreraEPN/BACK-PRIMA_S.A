import { sendMailToRecoveryPassword } from '../config/nodemailer.js';
import { passwordGeneratorbyAdmin } from '../helpers/passwordGenerator.js';
import {generarJWT} from '../middlewares/JWT.js';
import admins from '../models/admins.js';



// Login

const login_admin = async (req,res) => {
    //* Paso 1 -Tomar Datos del Request
    const {username, password} = req.body;

    //* Paso 2 - Validar Datos
    //? Verifica si un campo esta vacio
    if(Object.values(req.body).includes("")) {
        return res.status(400).json({msg: "Lo sentimos, debes llenar todos los campos"});
    }

    //? Verifica si el email ya existe
    const verifyAdminBDD = await admins.findOne({username})

    if(!verifyAdminBDD) {
        return res.status(400).json({msg: "Usuario Inexistente"});
    }else{
        const verifyPassword = await verifyAdminBDD.matchPassword(password)
        if(!verifyPassword && verifyAdminBDD.status==true){
            verifyAdminBDD.chances = verifyAdminBDD.chances-1
            if(verifyAdminBDD.chances<=0){
                verifyAdminBDD.status = false;
            }
            await verifyAdminBDD.save()
            return res.status(400).json({msg: `Contraseña erronea. Le quedan ${verifyAdminBDD.chances} intentos`});       
        }else{
            if(verifyAdminBDD.status==false){
                return res.status(400).json({msg: `La Cuenta está bloqueada`});
            }

            //* Paso 3 - Interactuar con la base de datos
            const fechaActual = new Date();
            verifyAdminBDD.lastLogin = new Date(fechaActual.getTime() - fechaActual.getTimezoneOffset() * 60000);
            verifyAdminBDD.chances = 3;
            
            const response = {
                _id: verifyAdminBDD._id, 
                username: verifyAdminBDD.username,
                role: verifyAdminBDD.role,
                createdAt: verifyAdminBDD.createdAt
            };

            await verifyAdminBDD.save();

            const tokenJWT = generarJWT(verifyAdminBDD._id, "admin")
            return res.status(200).json({msg: `Inicio de sesion exitoso`, inf: response, tokenJWT});
        }   
    }

}

// Recuperar contraseña
const recovery_pass_admin = async (req, res) => {
    let emailStatus = { // Para guardar el resultado del envío de correo
        sent: false,
        message: ""
    };
    try {
        //* Paso 1 -Tomar Datos del Request
        const {username} = req.body;
        const newpassword = passwordGeneratorbyAdmin();

        //* Paso 2 - Validar Datos
        //? Verifica si un campo esta vacio
        if(Object.values(req.body).includes("")) {
            return res.status(400).json({msg: "Lo sentimos, debes llenar todos los campos"});
        }

        //* Paso 3 - Interactuar con la base de datos
        const verifyAdminBDD = await admins.findOne({username});
        // Verificar si el admin existe antes de proceder
        if (!verifyAdminBDD) {
            return res.status(404).json({msg: "Usuario administrador no encontrado"});
        }

        verifyAdminBDD.password = await verifyAdminBDD.encryptPassword(newpassword);
        await verifyAdminBDD.save();

        // Enviar correo y guardar el resultado
        const emailResult = await sendMailToRecoveryPassword(username, newpassword);
        emailStatus.sent = emailResult.success;
        emailStatus.message = emailResult.message;

        if (!emailResult.success) {
            // Si el correo falla, aún así la contraseña se cambió. Informar al usuario.
            //console.warn("Contraseña de admin actualizada, pero falló el envío del correo:", emailResult.message);
            return res.status(200).json({ // 200 OK porque la contraseña se cambió, pero con advertencia
                msg: `Contraseña actualizada, pero hubo un problema al enviar el correo de notificación a la empresa.`,
                emailInfo: emailStatus // Incluir detalles del fallo del correo
            });
        }

        // Si todo fue bien (contraseña cambiada Y correo enviado)
        return res.status(200).json({
            msg: `Nueva Contraseña generada, REVISA EL CORREO DE LA EMPRESA`,
            emailInfo: emailStatus // Incluir detalles del éxito del correo
        });

    } catch (error) {
        //console.error("Error en recovery_pass_admin:", error); /
        return res.status(500).json({
            msg: `Error del servidor al recuperar contraseña`,
            error: error.message,
            emailInfo: emailStatus // Incluir estado del correo incluso en error general
        });
    }
}

export {
    login_admin,
    recovery_pass_admin
}