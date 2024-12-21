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

const SendMailCredentials = (userMail,name, username, password,token) => {
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
                        <img src="https://res.cloudinary.com/dnp9gpo8w/image/upload/v1734182789/myEmailLogo_m4nkqh.jpg" width="80px" height="80px" alt="Logo PRIMA" style="border-radius: 50%;">            <h2 style="color: #004ba0;">¡Bienvenido/a a PRIMA S.A.!</h2>
                    </div>
                    <p style="color: #333;">Hola <strong>${name}</strong>,</p>
                    <p style="color: #333;">Nos complace informarte que tu cuenta ha sido creada exitosamente. A continuación, te compartimos tus credenciales de acceso:</p>
                    <div style="background: #f9f9f9; padding: 15px; border: 1px solid #eee; border-radius: 5px;">
                        <p style="color: #004ba0;"><strong>Usuario:</strong> ${username}</p>
                        <p style="color: #004ba0;"><strong>Contraseña:</strong> ${password}</p>
                    </div>
                    <p style="color: #333;">Para acceder a tu cuenta, visita nuestro sistema en el siguiente enlace:</p>
                    <p style="text-align: center;">
                        <a href="${process.env.URL_BACK}/login" target="_blank" style="background-color: #004ba0; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block;">Iniciar sesión</a>
                    </p>
                    <h3 style="color: #004ba0;">Confirma tu correo electrónico:</h3>
                    <p style="color: #333;">Antes de iniciar sesión, necesitas confirmar tu cuenta. Haz clic en el siguiente enlace:</p>
                    <p style="text-align: center;">
                        <a href="${process.env.URL_BACK}/confirm-account/${encodeURIComponent(token)}" target="_blank" style="background-color: #004ba0; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block;">Confirmar mi cuenta</a>
                    </p>
                    <h3 style="color: #004ba0;">Recomendaciones de seguridad:</h3>
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

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('email sent: ' + info.response);
        }
    });
}

const sendMailToRecoveryPassword = async(username)=>{
    let info = await transporter.sendMail({
    from: process.env.USER_MAILTRAP,
    to: process.env.ADMIN_MAILTRAP,
    subject: "Correo para reestablecer tu contraseña",
    html: `
    <h1>Sistema de gestión (VET-ESFOT 🐶 😺)</h1>
    <hr>
    <a href=${process.env.URL_BACKEND}recuperar-password/${token}>Clic para reestablecer tu contraseña</a>
    <hr>
    <footer>Grandote te da la Bienvenida!</footer>
    `
    });
    console.log("Mensaje enviado satisfactoriamente: ", info.messageId);
}


export {
    SendMailCredentials,
    sendMailToRecoveryPassword
}