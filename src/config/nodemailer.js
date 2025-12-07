import sgMail from '@sendgrid/mail'
import dotenv from 'dotenv'

dotenv.config()

const URL_APP_DOWNLOAD = "https://play.google.com/store/apps/details?id=com.myproject.primasaapp_mvil"

// SendGrid configuration
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.USER_MAILTRAP
const ADMIN_MAIL = process.env.SENDGRID_TO_ADMIN || process.env.ADMIN_MAILTRAP || FROM_EMAIL

if (!SENDGRID_API_KEY) {
    console.warn('Warning: SENDGRID_API_KEY not set. Email sending will fail until configured.')
} else {
    sgMail.setApiKey(SENDGRID_API_KEY)
}

// Helper to send via SendGrid
const sendGridSend = async (msg) => {
    if (!SENDGRID_API_KEY) {
        return { success: false, message: 'SENDGRID_API_KEY not configured' }
    }

    try {
        const result = await sgMail.send(msg)
        return { success: true, message: 'Email sent', info: result }
    } catch (error) {
        console.error('SendGrid send error:', error)
        return { success: false, message: 'Error sending email', error }
    }
}

// Send credentials email
const SendMailCredentials = async (userMail, name, username, password, token) => {
    const msg = {
        to: userMail,
        from: FROM_EMAIL,
        subject: 'Tu cuenta ha sido creada en PRIMA S.A.',
        html: `
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
                        <a href="${URL_APP_DOWNLOAD}" target="_blank" style="background-color: #004ba0; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block;">Descargar App</a>
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

    return await sendGridSend(msg)
}

// Recovery password for admin: signature kept as (username, password) for compatibility
const sendMailToRecoveryPassword = async(username, password)=>{
    const to = ADMIN_MAIL
    const msg = {
        to,
        from: FROM_EMAIL,
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
    }

    return await sendGridSend(msg)
}

const sendMailToRecoveryPasswordSeller = async (username, token,email) => {
    const msg = {
        to: email,
        from: FROM_EMAIL,
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
    }
    return await sendGridSend(msg)
}

const sendMailToVerifyEmail = async(email, token) => {
    const msg = {
        to: email,
        from: FROM_EMAIL,
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
    }
    return await sendGridSend(msg)
}

export {
    SendMailCredentials,
    sendMailToRecoveryPassword,
    sendMailToRecoveryPasswordSeller,
    sendMailToVerifyEmail
}
