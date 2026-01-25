import { sendMailToRecoveryPassword } from '../config/nodemailer.js';
import { passwordGeneratorbyAdmin } from '../helpers/passwordGenerator.js';
import { generarJWT } from '../middlewares/JWT.js';
import admins from '../models/admins.js';

// Login
const login_admin = async (req, res) => {
    try {
        //* Paso 1 -Tomar Datos del Request
        const { username, password } = req.body;

        //* Paso 2 - Validar Datos
        //? Verifica si un campo esta vacio
        if (!username || !password) { 
            return res.status(400).json({
                status: "error",
                code: "MISSING_FIELD",
                msg: "Los campos 'username' y 'password' son obligatorios."
            });
        }

        //? Verifica si el admin existe
        const verifyAdminBDD = await admins.findOne({ username });

        if (!verifyAdminBDD) {
            return res.status(404).json({ 
                status: "error",
                code: "NOT_FOUND",
                msg: `No se encontró administrador con username '${username}'.`
            });
        }

        //? Verifica estado y contraseña
        if (!verifyAdminBDD.status) {
            return res.status(403).json({ 
                status: "error",
                code: "ACCOUNT_LOCKED",
                msg: `La cuenta del administrador '${username}' está bloqueada.`
            });
        }

        const verifyPassword = await verifyAdminBDD.matchPassword(password);

        if (!verifyPassword) {
            verifyAdminBDD.chances = verifyAdminBDD.chances - 1;
            if (verifyAdminBDD.chances <= 0) {
                verifyAdminBDD.status = false;
            }
            await verifyAdminBDD.save();

            const remainingAttemptsMsg = verifyAdminBDD.status
                ? `Contraseña errónea. Le quedan ${verifyAdminBDD.chances} intentos.`
                : `Contraseña errónea. La cuenta ha sido bloqueada.`;

            return res.status(401).json({
                status: "error",
                code: "INVALID_CREDENTIALS",
                msg: remainingAttemptsMsg
            });
        }

        //* Paso 3 - Interactuar con la base de datos (Login exitoso)
        const fechaActual = new Date();
        verifyAdminBDD.lastLogin = new Date(fechaActual.getTime() - fechaActual.getTimezoneOffset() * 60000);
        verifyAdminBDD.chances = 3; // Resetear intentos al loguearse correctamente
        await verifyAdminBDD.save();

        const adminInfo = {
            _id: verifyAdminBDD._id,
            username: verifyAdminBDD.username,
            role: verifyAdminBDD.role,
            createdAt: verifyAdminBDD.createdAt,
            lastLogin: verifyAdminBDD.lastLogin
        };

        const tokenJWT = generarJWT(verifyAdminBDD._id, "admin");

        return res.status(200).json({
            status: "success",
            code: "LOGIN_SUCCESS",
            msg: `Inicio de sesión exitoso para '${username}'.`,
            data: {
                admin: adminInfo,
                token: tokenJWT
            }
        });

    } catch (error) {
        //console.error("Error en login_admin:", error); // Log interno
        return res.status(500).json({
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al intentar iniciar sesión. Intente de nuevo más tarde."
        });
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
        const { username } = req.body;
        const newpassword = passwordGeneratorbyAdmin();

        //* Paso 2 - Validar Datos
        if (!username) {
            return res.status(400).json({
                status: "error",
                code: "MISSING_FIELD",
                msg: "El campo 'username' es obligatorio."
            });
        }

        //* Paso 3 - Interactuar con la base de datos
        const verifyAdminBDD = await admins.findOne({ username });
        if (!verifyAdminBDD) {
            return res.status(404).json({
                status: "error",
                code: "NOT_FOUND",
                msg: `No se encontró administrador con username '${username}'.`
            });
        }

        verifyAdminBDD.password = await verifyAdminBDD.encryptPassword(newpassword);
        verifyAdminBDD.status = true; // Desbloquear cuenta si estaba bloqueada
        verifyAdminBDD.chances = 3; // Resetear intentos
        await verifyAdminBDD.save();

        // Enviar correo y guardar el resultado
        const emailResult = await sendMailToRecoveryPassword(username, newpassword);
        emailStatus.sent = emailResult.success;
        emailStatus.message = emailResult.message;

        if (!emailResult.success) {
            //console.warn("Contraseña de admin actualizada, pero falló el envío del correo:", emailResult.message);
            // Advertencia: Operación principal exitosa, pero secundaria falló
            return res.status(200).json({
                status: "warning",
                code: "EMAIL_WARNING",
                msg: `Contraseña actualizada para '${username}', pero hubo un problema al enviar el correo de notificación a la empresa.`,
                info: { emailSent: emailStatus.sent }
            });
        }

        // Éxito completo
        return res.status(200).json({
            status: "success",
            code: "PASSWORD_RECOVERY_SUCCESS",
            msg: `Nueva contraseña generada y enviada al correo de la empresa para el usuario '${username}'.`,
            info: { emailSent: emailStatus.sent }
        });

    } catch (error) {
        //console.error("Error en recovery_pass_admin:", error);
        return res.status(500).json({
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al recuperar la contraseña. Intente de nuevo más tarde.",
            info: { emailAttempted: !!req.body.username, emailDetails: emailStatus }
        });
    }
}

export {
    login_admin,
    recovery_pass_admin
}