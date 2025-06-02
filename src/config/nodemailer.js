import nodemailer from 'nodemailer'
import dotenv from 'dotenv'


dotenv.config()


let transporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.HOST_MAILTRAP,
    port: process.env.PORT_MAILTRAP,
    auth: {
        user: process.env.USER_MAILTRAP,
        pass: process.env.PASS_MAILTRAP,
    }
});

// Modificada para usar async/await y retornar estado/error
const SendMailCredentials = async (userMail, name, username, password, token) => {
    let mailOptions = {
        from: process.env.USER_MAILTRAP,
        to: userMail,
        subject: 'Tu cuenta ha sido creada en PRIMA S.A.',
        html:
        `
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f9;">
                <div style="max-width: 600px; margin: 20px auto; background: #ffffff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="https://res.cloudinary.com/dnp9gpo8w/image/upload/v1734182789/myEmailLogo_m4nkqh.jpg" width="80px" height="80px" alt="Logo PRIMA" style="border-radius: 50%;">
                        <h2 style="color: #004ba0;">¡Bienvenido/a a PRIMA S.A.!</h2>
                    </div>
                    <p style="color: #333;">Hola <strong>${name}</strong>,</p>
                    <p style="color: #333;">Nos complace informarte que tu cuenta ha sido creada exitosamente. A continuación, te compartimos tus credenciales de acceso:</p>
                    <div style="background: #f9f9f9; padding: 15px; border: 1px solid #eee; border-radius: 5px;">
                        <p style="color: #004ba0;"><strong>Usuario:</strong> ${username}</p>
                        <p style="color: #004ba0;"><strong>Contraseña:</strong> ${password}</p>
                    </div>
                    <h3 style="color: #004ba0;">1. Confirma tu correo electrónico:</h3>
                    <p style="color: #333;">Antes de iniciar sesión, necesitas confirmar tu cuenta. Haz clic en el siguiente enlace:</p>
                    <p style="text-align: center;">
                        <a href="${process.env.URL_BACK}/confirm-account/${encodeURIComponent(token)}" target="_blank" style="background-color: #004ba0; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block;">Confirmar mi cuenta</a>
                    </p>
                    <h3 style="color: #004ba0;">2. Descarga la app:</h3>
                    <p style="color: #333;">Para acceder a tu cuenta, descarga nuestra app desde el siguiente enlace:</p>
                    <p style="text-align: center;">
                        <a href="${process.env.URL_APP_DOWNLOAD}" target="_blank" style="background-color: #004ba0; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block;">Descargar App</a>
                    </p>
                    <h3 style="color: #004ba0;">3. Recomendaciones de seguridad:</h3>
                    <ul style="color: #333;">
                        <li>Cambia tu contraseña en el primer inicio de sesión.</li>
                        <li>No compartas esta información con nadie.</li>
                    </ul>
                    <p style="color: #333;">Si tienes alguna duda o necesitas ayuda, contáctanos a través de <a href="mailto:support@prima.com" style="color: #004ba0; text-decoration: none;">support@prima.com</a> o al <strong>(+123) 456-7890</strong>.</p>
                    <p style="text-align: center; margin-top: 20px; color: #333;">¡Gracias por confiar en nosotros!</p>
                    <p style="text-align: center; color: #aaa;">© 2024 PRIMA S.A. Todos los derechos reservados.</p>
                </div>
            </body>
        </html>
        `
    }

    try {
        const info = await transporter.sendMail(mailOptions);
        // En lugar de loggear, retornamos éxito
        return { success: true, message: `Email de credenciales enviado a ${userMail}`, info: info.response };
    } catch (error) {
        // En lugar de loggear, retornamos fallo
        console.error(`Error enviando credenciales a ${userMail}:`, error); // Mantenemos log de error en servidor
        return { success: false, message: `Error al enviar email de credenciales a ${userMail}`, error: error };
    }
}

// Modificada para usar try/catch y retornar estado/error
const sendMailToRecoveryPassword = async(username, password)=>{
    try {
        let info = await transporter.sendMail({
            from: process.env.USER_MAILTRAP,
            to: process.env.ADMIN_MAILTRAP, // Considera si esto debería ir al email del usuario real
            subject: "Correo para reestablecer tu contraseña",
            html: `
            <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f9;">
                <div style="max-width: 600px; margin: 20px auto; background: #ffffff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="https://res.cloudinary.com/dnp9gpo8w/image/upload/v1734182789/myEmailLogo_m4nkqh.jpg" width="80px" height="80px" alt="Logo PRIMA" style="border-radius: 50%;">
                        <h2 style="color: #004ba0;">Recuperación de Contraseña</h2>
                    </div>
                    <p style="color: #333;">Hola <strong>${username}</strong>,</p>
                    <p style="color: #333;">Hemos recibido una solicitud para restablecer tu contraseña. A continuación, encontrarás tu nueva contraseña:</p>
                    <div style="background: #f9f9f9; padding: 15px; border: 1px solid #eee; border-radius: 5px; text-align: center;">
                        <p style="color: #004ba0; font-size: 1.2em;"><strong>Contraseña:</strong> ${password}</p>
                    </div>
                    <p style="color: #333;">Si no solicitaste este cambio, notifícalo por este medio.</p>
                    <p style="text-align: center; margin-top: 20px; color: #333;">¡Gracias por confiar en nosotros!</p>
                    <p style="text-align: center; margin-top: 20px; color: #aaa;">© 2024 PRIMA S.A. Todos los derechos reservados.</p>
                </div>
            </body>
            `
        });
        // En lugar de loggear, retornamos éxito
        return { success: true, message: `Email de recuperación enviado para ${username}`, info: info.messageId };
    } catch (error) {
        // En lugar de loggear, retornamos fallo
        console.error(`Error enviando email de recuperación para ${username}:`, error); // Mantenemos log de error en servidor
        return { success: false, message: `Error al enviar email de recuperación para ${username}`, error: error };
    }
}

const sendMailToRecoveryPasswordSeller = async (username, token,email) => {
    try {
        let info = await transporter.sendMail({
            from: process.env.USER_MAILTRAP,
            to: email, 
            subject: "Recupera tu contraseña en PRIMA S.A.",
            html: `
            <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f9;">
                <div style="max-width: 600px; margin: 20px auto; background: #ffffff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="https://res.cloudinary.com/dnp9gpo8w/image/upload/v1734182789/myEmailLogo_m4nkqh.jpg" width="80px" height="80px" alt="Logo PRIMA" style="border-radius: 50%;">
                        <h2 style="color: #004ba0;">Recuperación de Contraseña</h2>
                    </div>
                    <p style="color: #333;">Hola <strong>${username}</strong>,</p>
                    <p style="color: #333;">Hemos recibido una solicitud para restablecer tu contraseña. Utiliza el siguiente token para completar el proceso:</p>
                    <div style="background: #f0f0f0; padding: 15px; border: 1px solid #ccc; border-radius: 5px; text-align: center; margin: 20px 0;">
                        <p style="color: #333; font-size: 1.1em; margin-bottom: 10px;">Tu token de recuperación es:</p>
                        <p style="color: #004ba0; font-size: 1.3em; font-family: 'Courier New', Courier, monospace; background: #e9ecef; padding: 10px; border-radius: 3px; display: inline-block; letter-spacing: 2px;">
                            <strong>${token}</strong>
                        </p>
                    </div>
                    <p style="color: #333;">Copia y pega este token en el campo correspondiente en la aplicación o página web.</p>
                    <p style="color: #333;">Si no solicitaste este cambio, por favor ignora este correo o contacta a nuestro equipo de soporte.</p>
                    <p style="text-align: center; margin-top: 20px; color: #333;">¡Gracias por confiar en nosotros!</p>
                    <p style="text-align: center; margin-top: 20px; color: #aaa;">© 2024 PRIMA S.A. Todos los derechos reservados.</p>
                </div>
            </body>
            `
        });
        return { success: true, message: `Email de recuperación con token enviado para ${username}`, info: info.messageId };
    } catch (error) {
        console.error(`Error enviando email de recuperación con token para ${username}:`, error);
        return { success: false, message: `Error al enviar email de recuperación con token para ${username}`, error: error };
    }
}

// Modificada para usar try/catch y retornar estado/error
const sendMailToVerifyEmail = async(email, token) => {
    try {
        let info = await transporter.sendMail({
            from: process.env.USER_MAILTRAP,
            to: email,
            subject: "Cambiar contraseña en cuenta PRIMA S.A.",
            html: `
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f9;">
                    <div style="max-width: 600px; margin: 20px auto; background: #ffffff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <img src="https://res.cloudinary.com/dnp9gpo8w/image/upload/v1734182789/myEmailLogo_m4nkqh.jpg" width="80px" height="80px" alt="Logo PRIMA" style="border-radius: 50%;">
                            <h2 style="color: #004ba0;">Autentificación de cuenta</h2>
                        </div>
                        <p style="color: #333;">Hola,</p>
                        <p style="color: #333;">Hemos recibido una solicitud de cambio de contraseña para tu cuenta en PRIMA S.A.</p>
                        <p style="color: #333;">Por favor, haz click en el siguiente botón para continuar:</p>
                        <p style="text-align: center;">
                            <a href="${process.env.URL_BACK}/recovery-password/${encodeURIComponent(token)}" target="_blank" style="background-color: #004ba0; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block;">Cambiar contraseña</a>
                        </p>
                        <p style="color: #333;">En caso de no haber realizado la solicitud, puede ignorar este mensaje.</p>
                        <p style="color: #333;">Si tiene problemas con el botón, copia y pega el siguiente enlace en tu navegador:</p>
                        <p style="word-break: break-all; color: #004ba0;">
                            ${process.env.URL_BACK}/recovery-password/${encodeURIComponent(token)}
                        </p>
                        <p style="text-align: center; margin-top: 20px; color: #333;">¡Gracias por confiar en nosotros!</p>
                        <p style="text-align: center; color: #aaa;">© 2024 PRIMA S.A. Todos los derechos reservados.</p>
                    </div>
                </body>
            </html>
            `
        });
        // En lugar de loggear, retornamos éxito
        return { success: true, message: `Email de verificación enviado a ${email}`, info: info.messageId };
    } catch (error) {
        // En lugar de loggear, retornamos fallo
        console.error(`Error enviando email de verificación a ${email}:`, error); // Mantenemos log de error en servidor
        return { success: false, message: `Error al enviar email de verificación a ${email}`, error: error };
    }
}


export {
    SendMailCredentials,
    sendMailToRecoveryPassword,
    sendMailToRecoveryPasswordSeller,
    sendMailToVerifyEmail
}
