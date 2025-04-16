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
            console.log(verifyAdminBDD.chances);
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
        verifyAdminBDD.password = await verifyAdminBDD.encryptPassword(newpassword);
        await verifyAdminBDD.save();
        sendMailToRecoveryPassword(username, newpassword);
    
        return res.status(200).json({msg: `Nueva Contraseña generada, REVISA EL CORREO DE LA EMPRESA`});
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({msg: `Error del servidor`});
        
    }
}

export {
    login_admin,
    recovery_pass_admin
}