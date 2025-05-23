import admins from '../models/admins.js'
import Seller from '../models/sellers.js'
import jwt from "jsonwebtoken";

const generarJWT = (id, rol) => {
    return jwt.sign({ id, rol }, process.env.JWT_SECRET, { expiresIn: "8h" })
}

const verificarAutenticacion = async (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).json({
            status: "error",
            code: "UNAUTHORIZED",
            msg: "Se requiere autenticación. Falta el token."
        });
    }

    const { authorization } = req.headers

    try {
        const token = authorization.split(' ')[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const { id, rol } = decoded        // Verificar rol y asignar usuario
        if (rol === "admin") {
            req.veterinarioBDD = await admins.findById(id).lean().select("-password")
            // También establecer req.user para consistencia en controladores
            req.user = req.veterinarioBDD;
            req.user.role = "admin"; // Asegurarse que tenga la propiedad role
            
            if (!req.veterinarioBDD) {
                // 3. Usuario no encontrado (aunque el token sea válido)
                return res.status(404).json({
                    status: "error",
                    code: "NOT_FOUND",
                    msg: `No se encontró administrador con ID ${id}.`
                });
            }
            next()
        } else if (rol === "seller" || rol === "Seller") { // Aceptar ambos formatos
            req.SellerBDD = await Seller.findById(id).lean().select("-password")
            // También establecer req.user para consistencia en controladores
            req.user = req.SellerBDD;
            req.user.role = "seller"; // Asegurarse que tenga la propiedad role en minúsculas
            
            if (!req.SellerBDD) {
                // 3. Usuario no encontrado
                return res.status(404).json({
                    status: "error",
                    code: "NOT_FOUND",
                    msg: `No se encontró vendedor con ID ${id}.`
                });
            }
            next()
        } else {
            return res.status(403).json({
                status: "error",
                code: "FORBIDDEN",
                msg: "No tiene permiso para acceder a este recurso."
            });
        }

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: "error",
                code: "EXPIRED_TOKEN",
                msg: "Su sesión ha expirado. Por favor, inicie sesión nuevamente."
            })
        }
        if (error.name === 'JsonWebTokenError') {
            // Error genérico de JWT (formato inválido, firma incorrecta, etc.)
            return res.status(401).json({
                status: "error",
                code: "INVALID_TOKEN",
                msg: "El token proporcionado no es válido."
            });
        }
        return res.status(500).json({
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al verificar la autenticación. Intente de nuevo más tarde."
        });
    }
}

// Nuevo middleware para solo verificar el estado del token
const verificarEstadoToken = async (req, res) => {
    if (!req.headers.authorization) {
        return res.status(401).json({
            status: "error",
            code: "UNAUTHORIZED",
            msg: "Se requiere autenticación. Falta el token."
        });
    }

    const { authorization } = req.headers

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

        return res.status(200).json({
            status: "success",
            code: "TOKEN_VALID",
            msg: "Token válido.",
            data: { valid: true }
        })

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: "error",
                code: "EXPIRED_TOKEN",
                msg: "Token expirado.",
                info: {
                    expired: true
                }
            });
        }
        if (error.name === 'JsonWebTokenError') {
            // Error genérico de JWT
            return res.status(401).json({
                status: "error",
                code: "INVALID_TOKEN",
                msg: "Token inválido."
            });
        }
        return res.status(500).json({
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al verificar el token. Intente de nuevo más tarde."
        });
    }
}

const authorizeRole = (rolesPermitidos) => (req, res, next) => {
    // Usar req.user que hemos establecido en verificarAutenticacion
    const userRole = req.user?.role;
    
    if (!userRole || !rolesPermitidos.includes(userRole)) {
        return res.status(403).json({
            status: "error",
            code: "FORBIDDEN",
            msg: "No tienes permiso para acceder a este recurso."
        });
    }
    next();
};

export {
    generarJWT,
    verificarAutenticacion,
    verificarEstadoToken,
    authorizeRole
}