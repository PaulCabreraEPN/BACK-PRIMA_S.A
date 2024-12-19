import generarJWT from '../helpers/JWT.js';
import admins from '../models/admins.js';
import mongoose from 'mongoose';


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
        if(password !== verifyAdminBDD.password && verifyAdminBDD.status==true){
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

export {
    login_admin
}