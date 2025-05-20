import { passwordGenerator } from '../helpers/passwordGenerator.js'
import Sellers from '../models/sellers.js'
import { SendMailCredentials, sendMailToVerifyEmail } from '../config/nodemailer.js';
import usernameGenerator from '../helpers/usernameGenerator.js';
import mongoose from 'mongoose';
import { generarJWT } from '../middlewares/JWT.js'

//* Registrar un Vendedor
const registerSeller = async (req, res) => {
    let emailStatus = { // Para guardar el resultado del envío de correo
        sent: false,
        message: ""
    };
    try {
        //* Paso 1 -Tomar Datos del Request
        const { email, cedula, names, lastNames, PhoneNumber, SalesCity,role } = req.body; // Ser explícito con los campos

        //* Paso 2 - Validar Datos
        //? Verifica si un campo esta vacio
        if (!email || !cedula || !names || !lastNames || !PhoneNumber || !SalesCity) {
            return res.status(400).json({
                status: "error",
                code: "MISSING_FIELD",
                msg: "Lo sentimos, debes llenar todos los campos requeridos (email, cedula, names, lastNames, PhoneNumber, SalesCity)."
            });
        }
        // Aquí se podrían añadir validaciones de formato para email, cedula, PhoneNumber, etc.

        //? Verifica si el email ya existe
        const verifySellerBDD = await Sellers.findOne({ email });
        if (verifySellerBDD) {
            return res.status(409).json({ // 409 Conflict
                status: "error",
                code: "RESOURCE_ALREADY_EXISTS",
                msg: `El email '${email}' ya se encuentra registrado.`
            });
        }

        //? Verifica si el número de cédula ya está registrado
        const verifyID = await Sellers.findOne({ cedula });
        if (verifyID) {
            return res.status(409).json({ // 409 Conflict
                status: "error",
                code: "RESOURCE_ALREADY_EXISTS",
                msg: `El número de cédula '${cedula}' ya se encuentra registrado.`
            });
        }

        //? Genera una contraseña aleatoria
        const passwordGen = passwordGenerator();
        //? Genera un usuario
        let usernameGen = usernameGenerator(names);

        //? Verificar Username y generar uno único si es necesario
        let verifyUsername = await Sellers.findOne({ username: usernameGen });
        while (verifyUsername) {
            usernameGen = usernameGenerator(names);
            verifyUsername = await Sellers.findOne({ username: usernameGen });
        }

        //* Paso 3 - Interactuar con BDD
        const newSeller = new Sellers({ email, cedula, names, lastNames, PhoneNumber, SalesCity,role }); // Usar campos validados
        newSeller.password = await newSeller.encryptPassword(passwordGen);
        newSeller.username = usernameGen;

        // Crear token
        const token = newSeller.createToken();
        newSeller.token = token; // Asegurarse de asignar el token al objeto antes de guardar

        // Guardar en la base de datos PRIMERO
        const savedSeller = await newSeller.save();

        // Enviar correo DESPUÉS de guardar y guardar el resultado
        const emailResult = await SendMailCredentials(email, names, usernameGen, passwordGen, token);
        emailStatus.sent = emailResult.success;
        emailStatus.message = emailResult.message;

        // Formatear datos del vendedor para la respuesta
        const sellerData = {
            _id: savedSeller._id,
            names: savedSeller.names,
            lastNames: savedSeller.lastNames,
            cedula: savedSeller.cedula,
            email: savedSeller.email,
            username: savedSeller.username,
            PhoneNumber: savedSeller.PhoneNumber,
            SalesCity: savedSeller.SalesCity,
            role: savedSeller.role,
            status: savedSeller.status,
            confirmEmail: savedSeller.confirmEmail
        };

        if (!emailResult.success) {
            // Si el correo falla, el vendedor ya está creado. Informar.
            console.warn("Vendedor registrado, pero falló el envío del correo de confirmación:", emailResult.message);
            return res.status(201).json({ // 201 Created porque el vendedor se creó
                status: "warning", // Indicar que la operación principal tuvo éxito pero una secundaria falló
                code: "SELLER_CREATED_EMAIL_FAILED",
                msg: "Vendedor registrado exitosamente, pero hubo un problema al enviar el correo de confirmación.",
                notification: `Verifica tu bandeja de entrada o contacta a soporte si no recibes el correo.`,
                data: sellerData, // Devolver datos del vendedor creado
                info: { emailDetails: emailStatus } // Incluir detalles del fallo del correo
            });
        }

        // Si todo fue bien (vendedor creado Y correo enviado)
        return res.status(201).json({ // 201 Created
            status: "success",
            code: "SELLER_REGISTERED",
            msg: "Vendedor registrado exitosamente.",
            notification: `Se ha enviado un correo a ${email} para confirmar el registro y se ha generado un usuario y una contraseña temporal.`,
            data: sellerData,
            info: { emailDetails: emailStatus } // Incluir detalles del éxito del correo
        });

    } catch (error) {
        console.error("Error en registerSeller:", error); // Log interno
        return res.status(500).json({
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al registrar el vendedor. Intente de nuevo más tarde.",
            info: { detail: error.message, emailAttempted: !!req.body.email, emailDetails: emailStatus } // Incluir estado del correo si se intentó
        });
    }
}

//* Confirmar Registro parte Vendedor
const confirmEmail = async (req, res) => {
    try {
        //* Paso 1 -Tomar Datos del Request
        const { token } = req.params;

        //* Paso 2 - Validar Datos
        if (!token) {
            return res.status(400).json({
                status: "error",
                code: "MISSING_FIELD",
                msg: "Falta el token de confirmación."
            });
        }

        const SellerBDD = await Sellers.findOne({ token });

        if (!SellerBDD) {
            // Podría ser que el token no exista o que ya se usó (SellerBDD.token es null)
            return res.status(404).json({ // 404 Not Found o 400 Bad Request
                status: "error",
                code: "INVALID_OR_EXPIRED_TOKEN",
                msg: "El token es inválido, ya ha sido utilizado o ha expirado."
            });
        }

        //* Paso 3 Interactuar con BDD
        SellerBDD.token = null;
        SellerBDD.confirmEmail = true;
        SellerBDD.status = true; // Activar la cuenta al confirmar
        await SellerBDD.save();

        return res.status(200).json({
            status: "success",
            code: "EMAIL_CONFIRMED",
            msg: "Correo confirmado exitosamente. Ya puedes iniciar sesión."
        });

    } catch (error) {
        console.error("Error en confirmEmail:", error); // Log interno
        return res.status(500).json({
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al confirmar el correo. Intente de nuevo más tarde.",
            info: { detail: error.message }
        });
    }
}

//* Iniciar Sesión Vendedor
const loginSeller = async (req, res) => {
    try {
        //* Paso 1 -Tomar Datos del Request
        const { username, password } = req.body;

        //* Paso 2 - Validar Datos
        if (!username || !password) {
            return res.status(400).json({
                status: "error",
                code: "MISSING_FIELD",
                msg: "Los campos 'username' y 'password' son obligatorios."
            });
        }

        //* Paso 3 - Interactuar con BDD
        const SellerBDD = await Sellers.findOne({ username });

        if (!SellerBDD) {
            return res.status(404).json({ // 404 Not Found
                status: "error",
                code: "NOT_FOUND",
                msg: `Usuario '${username}' no encontrado.`
            });
        }

        if (SellerBDD.confirmEmail === false) {
            return res.status(403).json({ // 403 Forbidden
                status: "error",
                code: "EMAIL_NOT_CONFIRMED",
                msg: "Debes confirmar tu correo electrónico antes de iniciar sesión."
            });
        }

        if (SellerBDD.status === false) {
            return res.status(403).json({ // 403 Forbidden
                status: "error",
                code: "ACCOUNT_DISABLED",
                msg: `La cuenta del vendedor '${username}' está desactivada.`
            });
        }

        const verifyPassword = await SellerBDD.matchPassword(password);
        if (!verifyPassword) {
            // Aquí se podría implementar lógica de intentos fallidos si se desea
            return res.status(401).json({ // 401 Unauthorized
                status: "error",
                code: "INVALID_CREDENTIALS",
                msg: "Contraseña incorrecta."
            });
        }

        // Login exitoso
        const tokenJWT = generarJWT(SellerBDD._id, "Seller"); // Asegúrate que el rol sea correcto

        // Datos a devolver
        const sellerInfo = {
            _id: SellerBDD._id,
            username: SellerBDD.username,
            cedula: SellerBDD.cedula,
            email: SellerBDD.email,
            names: SellerBDD.names,
            lastNames: SellerBDD.lastNames,
            SalesCity: SellerBDD.SalesCity
        };

        return res.status(200).json({
            status: "success",
            code: "LOGIN_SUCCESS",
            msg: `Inicio de sesión exitoso para '${username}'.`,
            data: {
                seller: sellerInfo,
                token: tokenJWT
            }
        });

    } catch (error) {
        console.error("Error en loginSeller:", error); // Log interno
        return res.status(500).json({
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al iniciar sesión. Intente de nuevo más tarde.",
            info: { detail: error.message }
        });
    }
}

//* Recuperación de Contraseña (Iniciar Proceso)
const passwordRecovery = async (req, res) => {
    let emailStatus = { // Para guardar el resultado del envío de correo
        sent: false,
        message: ""
    };
    try {
        //* Paso 1 -Tomar Datos del Request
        const { email } = req.body;

        //* Paso 2 - Validar Datos
        if (!email) {
            return res.status(400).json({
                status: "error",
                code: "MISSING_FIELD",
                msg: "El campo 'email' es obligatorio."
            });
        }
        // Aquí se podría añadir validación de formato de email

        const SellerBDD = await Sellers.findOne({ email });
        if (!SellerBDD) {
            // No revelar si el email existe o no por seguridad
            // Simular éxito aunque el email no exista
            console.log(`Intento de recuperación para email no registrado: ${email}`);
            return res.status(200).json({
                status: "success", // Simular éxito
                code: "RECOVERY_EMAIL_SENT_IF_EXISTS", // Código ambiguo a propósito
                msg: `Si existe una cuenta asociada a ${email}, se ha enviado un correo con instrucciones para recuperar la contraseña.`
                // No incluir info de emailStatus aquí
            });
        }

        //* Paso 3 - Interactuar con BDD
        const token = SellerBDD.createToken(); // Usar el método del modelo
        SellerBDD.token = token;
        // Guardar el token PRIMERO
        await SellerBDD.save();

        // Enviar correo DESPUÉS de guardar y guardar el resultado
        const emailResult = await sendMailToVerifyEmail(email, token); // Asegúrate que esta función envíe el correo correcto para recuperación
        emailStatus.sent = emailResult.success;
        emailStatus.message = emailResult.message;

        if (!emailResult.success) {
            // Si el correo falla, el token ya está guardado. Informar.
            console.warn("Token de recuperación generado, pero falló el envío del correo:", emailResult.message);
            // No se debería revertir el token aquí, el usuario puede reintentar
            return res.status(500).json({ // Indicar error de servidor por fallo en envío
                status: "error",
                code: "EMAIL_SEND_FAILED",
                msg: `Se inició el proceso de recuperación, pero hubo un problema crítico al enviar el correo a ${email}. Intenta de nuevo o contacta a soporte.`,
                info: { emailDetails: emailStatus } // Incluir detalles del fallo del correo
            });
        }

        // Si todo fue bien (token guardado Y correo enviado)
        return res.status(200).json({
            status: "success",
            code: "RECOVERY_EMAIL_SENT",
            msg: `Se ha enviado un correo a ${email} con instrucciones para recuperar la contraseña.`,
            info: { emailDetails: emailStatus } // Incluir detalles del éxito del correo
        });

    } catch (error) {
        console.error("Error en passwordRecovery:", error); // Log interno
        return res.status(500).json({
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al procesar la solicitud de recuperación de contraseña. Intente de nuevo más tarde.",
            info: { detail: error.message, emailAttempted: !!req.body.email, emailDetails: emailStatus }
        });
    }
}

//* Comprobar Token de Recuperación
const tokenComprobation = async (req, res) => {
    try {
        //* Paso 1 - Tomar Datos del Request
        const { token } = req.params;

        //* Paso 2 - Validar Datos
        if (!token) {
            return res.status(400).json({
                status: "error",
                code: "MISSING_FIELD",
                msg: "Falta el token de recuperación."
            });
        }

        const SellerBDD = await Sellers.findOne({ token });

        if (!SellerBDD) {
            return res.status(404).json({ // 404 Not Found o 400 Bad Request
                status: "error",
                code: "INVALID_OR_EXPIRED_TOKEN",
                msg: "El token es inválido, ya ha sido utilizado o ha expirado."
            });
        }

        // No se modifica la BDD aquí, solo se comprueba
        // El token se anulará al establecer la nueva contraseña

        return res.status(200).json({
            status: "success",
            code: "TOKEN_VALID",
            msg: "Token válido. Ya puedes establecer una nueva contraseña."
        });

    } catch (error) {
        console.error("Error en tokenComprobation:", error); // Log interno
        return res.status(500).json({
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al comprobar el token. Intente de nuevo más tarde.",
            info: { detail: error.message }
        });
    }
}

//* Establecer Nueva Contraseña (después de recuperación)
const newPassword = async (req, res) => {
    try {
        //* Paso 1 - Tomar Datos del Request
        const { token } = req.params;
        const { password, confirmpassword } = req.body;

        //* Paso 2 - Validar Datos
        if (!password || !confirmpassword) {
            return res.status(400).json({
                status: "error",
                code: "MISSING_FIELD",
                msg: "Debes proporcionar la nueva contraseña y su confirmación."
            });
        }

        if (password !== confirmpassword) {
            return res.status(400).json({
                status: "error",
                code: "PASSWORD_MISMATCH",
                msg: "Las contraseñas no coinciden."
            });
        }
        // Aquí se podría añadir validación de fortaleza de contraseña

        if (!token) { // Aunque ya está en la ruta, una validación extra no hace daño
            return res.status(400).json({
                status: "error",
                code: "MISSING_FIELD",
                msg: "Falta el token de recuperación."
            });
        }

        const SellerBDD = await Sellers.findOne({ token });

        if (!SellerBDD) {
            return res.status(404).json({ // 404 Not Found o 400 Bad Request
                status: "error",
                code: "INVALID_OR_EXPIRED_TOKEN",
                msg: "El token es inválido, ya ha sido utilizado o ha expirado. No se puede cambiar la contraseña."
            });
        }

        //* Paso 3 - Interactuar con BDD
        SellerBDD.token = null; // Invalidar el token
        SellerBDD.password = await SellerBDD.encryptPassword(password);
        SellerBDD.confirmEmail = true; // Asegurarse que esté confirmado si llegó aquí
        SellerBDD.status = true; // Reactivar cuenta si estaba desactivada por alguna razón (opcional)
        await SellerBDD.save();

        return res.status(200).json({
            status: "success",
            code: "PASSWORD_UPDATED",
            msg: "Contraseña actualizada correctamente. Ya puedes iniciar sesión con tu nueva contraseña."
        });

    } catch (error) {
        console.error("Error en newPassword:", error); // Log interno
        return res.status(500).json({
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al establecer la nueva contraseña. Intente de nuevo más tarde.",
            info: { detail: error.message }
        });
    }
}

//* Ver todos los Vendedores
const seeSellers = async (req, res) => {
    try {
        const sellers = await Sellers.find()
            .select("_id names lastNames cedula email username PhoneNumber SalesCity role status") // Seleccionar campos explícitamente
            .lean(); // Usar lean para mejor rendimiento

        return res.status(200).json({
            status: "success",
            code: "SELLERS_FETCHED",
            msg: "Vendedores obtenidos correctamente.",
            data: sellers // 'sellers' ya tiene el formato deseado por .select()
        });
    } catch (error) {
        console.error("Error en seeSellers:", error); // Log interno
        return res.status(500).json({
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al obtener los vendedores. Intente de nuevo más tarde.",
            info: { detail: error.message }
        });
    }
}

//* Buscar un vendedor por ObjectID
const searchSellerById = async (req, res) => {
    try {
        //* Paso 1 - Tomar Datos del Request
        const { id } = req.params;

        //* Paso 2 - Validar Datos
        if (!id) {
            return res.status(400).json({ // 400 Bad Request
                status: "error",
                code: "MISSING_FIELD",
                msg: "El parámetro 'id' es obligatorio."
            });
        }

        // Validar si el id es un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ // 400 Bad Request
                status: "error",
                code: "INVALID_FORMAT",
                msg: `El ID '${id}' no tiene un formato válido.`
            });
        }

        //* Paso 3 - Interactuar con BDD
        const seller = await Sellers.findById(id)
            .select("_id names lastNames cedula email username PhoneNumber SalesCity role status") // Seleccionar campos
            .lean(); // Usar lean

        if (!seller) {
            return res.status(404).json({ // 404 Not Found
                status: "error",
                code: "NOT_FOUND",
                msg: `No se encontró vendedor con ID ${id}.`
            });
        }

        return res.status(200).json({
            status: "success",
            code: "SELLER_FOUND",
            msg: "Vendedor encontrado.",
            data: seller // 'seller' ya tiene el formato deseado
        });

    } catch (error) {
        console.error("Error en searchSellerById:", error); // Log interno
        return res.status(500).json({
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al buscar el vendedor por ID. Intente de nuevo más tarde.",
            info: { detail: error.message }
        });
    }
}

//* Buscar un vendedor por cedula
const searchSellerByNumberId = async (req, res) => {
    try {
        //* Paso 1 - Tomar Datos del Request
        const { cedula } = req.params;

        //* Paso 2 - Validar Datos
        if (!cedula) {
            return res.status(400).json({ // 400 Bad Request
                status: "error",
                code: "MISSING_FIELD",
                msg: "El parámetro 'cedula' es obligatorio."
            });
        }
        // Aquí se podría añadir validación de formato de cédula si es posible

        //* Paso 3 - Interactuar con BDD
        const seller = await Sellers.findOne({ cedula })
            .select("_id names lastNames cedula email username PhoneNumber SalesCity role status") // Seleccionar campos
            .lean(); // Usar lean

        if (!seller) {
            return res.status(404).json({ // 404 Not Found
                status: "error",
                code: "NOT_FOUND",
                msg: `No se encontró vendedor con cédula ${cedula}.`
            });
        }

        return res.status(200).json({
            status: "success",
            code: "SELLER_FOUND",
            msg: "Vendedor encontrado.",
            data: seller // 'seller' ya tiene el formato deseado
        });

    } catch (error) {
        console.error("Error en searchSellerByNumberId:", error); // Log interno
        return res.status(500).json({
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al buscar el vendedor por cédula. Intente de nuevo más tarde.",
            info: { detail: error.message }
        });
    }
}

//* Actualizar vendedor
const updateSellerController = async (req, res) => {
    try {
        //* Paso 1 - Tomar Datos del Request
        const { id } = req.params; // ID del vendedor a actualizar
        const updates = req.body; // Datos a actualizar

        //* Paso 2 - Validar Datos
        // Validar si el id es un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ // 400 Bad Request
                status: "error",
                code: "INVALID_FORMAT",
                msg: `El ID '${id}' no tiene un formato válido.`
            });
        }

        // Obtener los atributos válidos del modelo que se pueden actualizar
        // Excluir campos sensibles o que no deberían cambiarse masivamente aquí (como password, username, token, confirmEmail)
        const validFields = ['email', 'PhoneNumber', 'SalesCity', 'names', 'lastNames', 'cedula', 'role', 'status'];
        const filteredUpdates = {};
        const fieldsReceived = Object.keys(updates);

        // Filtrar los campos válidos y proporcionados para la actualización
        for (const key of fieldsReceived) {
            if (validFields.includes(key)) {
                // Añadir validación específica por campo si es necesario
                // Ejemplo: if (key === 'email' && !isValidEmail(updates[key])) { return res.status(400)... }
                filteredUpdates[key] = updates[key];
            }
        }

        // Validar si hay campos válidos para actualizar
        if (Object.keys(filteredUpdates).length === 0) {
            return res.status(400).json({
                status: "error",
                code: "NO_UPDATABLE_FIELDS",
                msg: "No se proporcionaron campos válidos o permitidos para actualizar.",
                info: { receivedFields: fieldsReceived, allowedFields: validFields }
            });
        }

        // Validar duplicados si se intenta cambiar email o cedula
        if (filteredUpdates.email) {
            const existingEmail = await Sellers.findOne({ email: filteredUpdates.email, _id: { $ne: id } });
            if (existingEmail) {
                return res.status(409).json({ status: "error", code: "RESOURCE_ALREADY_EXISTS", msg: `El email '${filteredUpdates.email}' ya está en uso por otro vendedor.` });
            }
        }
        if (filteredUpdates.cedula) {
            const existingCedula = await Sellers.findOne({ cedula: filteredUpdates.cedula, _id: { $ne: id } });
            if (existingCedula) {
                return res.status(409).json({ status: "error", code: "RESOURCE_ALREADY_EXISTS", msg: `La cédula '${filteredUpdates.cedula}' ya está en uso por otro vendedor.` });
            }
        }

        //* Paso 3 - Interactuar con BDD
        // Realizar la actualización y obtener el documento actualizado
        const updatedSeller = await Sellers.findByIdAndUpdate(id, filteredUpdates, { new: true })
            .select("_id names lastNames cedula email username PhoneNumber SalesCity role status") // Seleccionar campos
            .lean(); // Usar lean

        if (!updatedSeller) {
             // Esto podría ocurrir si el ID es válido pero el vendedor fue eliminado entre la validación y la actualización
             return res.status(404).json({
                status: "error",
                code: "NOT_FOUND",
                msg: `No se encontró vendedor con ID ${id} para actualizar (posiblemente eliminado).`
            });
        }

        // Responder con el registro actualizado
        return res.status(200).json({
            status: "success",
            code: "SELLER_UPDATED",
            msg: "Vendedor actualizado correctamente.",
            data: updatedSeller,
            info: { updatedFields: Object.keys(filteredUpdates) }
        });

    } catch (error) {
        // Manejo de errores
        console.error("Error en updateSellerController:", error); // Log interno
        // Verificar si es un error de validación de Mongoose (ej. enum inválido para 'role' o 'status')
        if (error.name === 'ValidationError') {
             return res.status(400).json({
                status: "error",
                code: "VALIDATION_ERROR",
                msg: "Error de validación al actualizar el vendedor.",
                info: { detail: error.message, errors: error.errors }
             });
        }
        return res.status(500).json({
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al actualizar el vendedor. Intente de nuevo más tarde.",
            info: { detail: error.message }
        });
    }
};


//* Eliminar un vendedor por ID
const DeleteSellerController = async (req, res) => {
    try {
        //* Paso 1 - Tomar Datos del Request
        const { id } = req.params; // ID del vendedor a eliminar

        //* Paso 2 - Validar Datos
        // Validar si el id es un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ // 400 Bad Request
                status: "error",
                code: "INVALID_FORMAT",
                msg: `El ID '${id}' no tiene un formato válido.`
            });
        }

        // Validar si el vendedor tiene órdenes activas (no Enviado ni Cancelado)
        const Orders = (await import('../models/orders.js')).default;
        const activeOrder = await Orders.findOne({
            seller: id,
            status: { $nin: ["Enviado", "Cancelado"] }
        });

        if (activeOrder) {
            return res.status(400).json({
                status: "error",
                code: "SELLER_HAS_ACTIVE_ORDERS",
                msg: "No se puede eliminar el vendedor porque tiene órdenes activas (no Enviado ni Cancelado).",
                info: { orderId: activeOrder._id, orderStatus: activeOrder.status }
            });
        }

        //* Paso 3 - Interactuar con BDD
        // Buscar y eliminar el vendedor en la base de datos
        const deletedSeller = await Sellers.findByIdAndDelete(id);

        if (!deletedSeller) {
            return res.status(404).json({ // 404 Not Found
                status: "error",
                code: "NOT_FOUND",
                msg: `No se encontró vendedor con ID ${id} para eliminar.`
            });
        }

        // Responder con éxito
        return res.status(200).json({
            status: "success",
            code: "SELLER_DELETED",
            msg: "Vendedor eliminado correctamente.",
            // Opcionalmente, devolver el ID del vendedor eliminado en info
            info: { deletedId: id }
        });

    } catch (error) {
        console.error("Error en DeleteSellerController:", error); // Log interno
        return res.status(500).json({
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al eliminar el vendedor. Intente de nuevo más tarde.",
            info: { detail: error.message }
        });
    }
};


export {
    registerSeller,
    confirmEmail,
    loginSeller,
    passwordRecovery,
    tokenComprobation,
    newPassword,
    seeSellers,
    searchSellerById,
    searchSellerByNumberId,
    updateSellerController,
    DeleteSellerController
}
