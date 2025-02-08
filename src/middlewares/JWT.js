import admins from '../models/admins.js'
import Seller from '../models/sellers.js'
import jwt from "jsonwebtoken";

const generarJWT = (id,rol) => {
    return jwt.sign({id,rol}, process.env.JWT_SECRET, {expiresIn:"8h"})
}

const verificarAutenticacion = async (req,res,next) => {
    if(!req.headers.authorization) {
        return res.status(401).json({msg: "Lo sentimos, debes proporcionar un token"})
    }    
    
    const {authorization} = req.headers
    
    try {
        const token = authorization.split(' ')[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const {id, rol} = decoded

        // Verificar si el token está expirado
        const tokenExp = decoded.exp * 1000 // Convertir a milisegundos
        if (Date.now() >= tokenExp) {
            return res.status(401).json({
                msg: "Token expirado, por favor inicie sesión nuevamente",
                expired: true
            })
        }

        // Verificar rol y asignar usuario
        if (rol === "admin") {
            req.veterinarioBDD = await admins.findById(id).lean().select("-password")
            next()
        } else if (rol === "Seller") {
            req.SellerBDD = await Seller.findById(id).lean().select("-password")
            next()
        } else {
            return res.status(403).json({ msg: "No tienes permisos para acceder a este recurso" })
        }
        
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                msg: "Token expirado, por favor inicie sesión nuevamente",
                expired: true
            })
        }
        return res.status(401).json({msg: "Formato del token no válido"})
    }
}

// Nuevo middleware para solo verificar el estado del token
const verificarEstadoToken = async (req, res) => {
    if(!req.headers.authorization) {
        return res.status(401).json({msg: "Lo sentimos, debes proporcionar un token"})
    }    
    
    const {authorization} = req.headers
    
    try {
        const token = authorization.split(' ')[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        
        // Verificar si el token está expirado
        const tokenExp = decoded.exp * 1000
        if (Date.now() >= tokenExp) {
            return res.status(401).json({
                msg: "Token expirado",
                expired: true
            })
        }

        return res.status(200).json({ valid: true })
        
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                msg: "Token expirado",
                expired: true
            })
        }
        return res.status(401).json({msg: "Token inválido"})
    }
}

export {
    generarJWT,
    verificarAutenticacion,
    verificarEstadoToken
}