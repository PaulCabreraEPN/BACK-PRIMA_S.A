import admins from '../models/admins.js'
import jwt from "jsonwebtoken";

const generarJWT = (id,rol)=>{
    return jwt.sign({id,rol},process.env.JWT_SECRET,{expiresIn:"8h"})
}

export default  generarJWT

const verificarAutenticacion = async (req,res,next)=>{

    if(!req.headers.authorization) return res.status(404).json({msg:"Lo sentimos, debes proprocionar un token"})    
    const {authorization} = req.headers
    
    try {
        const {id,rol} = jwt.verify(authorization.split(' ')[1],process.env.JWT_SECRET)
        console.log(id,rol);
        
        if (rol==="admin"){
            req.veterinarioBDD = await admins.findById(id).lean().select("-password");
            next();
        }
        
    } catch (error) {
        const e = new Error("Formato del token no válido")
        return res.status(404).json({msg:e.message})
    }
}


export {
    generarJWT,
    verificarAutenticacion
};