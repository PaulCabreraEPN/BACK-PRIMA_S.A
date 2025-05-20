import Clients from '../models/clients.js';
import Orders from '../models/orders.js';

const RegisterClient = async (req, res) => {
    try {
        const { Ruc, email } = req.body;

        // Validación básica (se puede mejorar con express-validator)
        if (!Ruc || !email) {
            return res.status(400).json({
                status: "error",
                code: "MISSING_FIELD",
                msg: "Los campos 'Ruc' y 'email' son obligatorios."
            });
        }
        // Aquí podrías añadir validación de formato para Ruc y email

        const verifyClient = await Clients.findOne({ Ruc: Ruc });
        if (verifyClient) {
            return res.status(409).json({ // 409 Conflict es más adecuado para recurso existente
                status: "error",
                code: "RESOURCE_ALREADY_EXISTS",
                msg: `El cliente con RUC '${Ruc}' ya existe.`
            });
        }

        const verifyEmail = await Clients.findOne({ email: email });
        if (verifyEmail) {
            return res.status(409).json({ // 409 Conflict
                status: "error",
                code: "RESOURCE_ALREADY_EXISTS",
                msg: `El email '${email}' ya está registrado por otro cliente.`
            });
        }

        const newClient = new Clients(req.body);
        await newClient.save();

        // Devolver solo los datos relevantes, no todo req.body
        const clientData = {
            _id: newClient._id,
            Name: newClient.Name,
            ComercialName: newClient.ComercialName,
            Ruc: newClient.Ruc,
            Address: newClient.Address,
            telephone: newClient.telephone,
            email: newClient.email,
            state: newClient.state,
        };

        return res.status(201).json({ // 201 Created
            status: "success",
            code: "CLIENT_REGISTERED",
            msg: "Cliente registrado con éxito.",
            data: clientData
        });

    } catch (error) {
        //console.error("Error en RegisterClient:", error); // Log interno
        return res.status(500).json({
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al registrar el cliente. Intente de nuevo más tarde."
        });
    }
}

const getAllClients = async (req, res) => {
    try {
        // Excluir _id si no se necesita, pero incluir otros campos necesarios
        const clientsBDD = await Clients.find().select("Name ComercialName Ruc Address telephone email state"); // Ajusta los campos según necesidad
        return res.status(200).json({
            status: "success",
            code: "CLIENTS_FETCHED",
            msg: "Clientes obtenidos correctamente.",
            data: clientsBDD
        });
    } catch (error) {
        //console.error("Error en getAllClients:", error); // Log interno
        return res.status(500).json({
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al obtener los clientes. Intente de nuevo más tarde."
        });
    }
}

const getClientsById = async (req, res) => {
    try {
        //* Paso 1 - Tomar Datos del Request
        const { ruc } = req.params;

        //* Paso 2 - Validar Datos (Básica, idealmente con express-validator)
        if (!ruc) { // Podría validarse formato de RUC aquí también
            return res.status(400).json({
                status: "error",
                code: "MISSING_FIELD", // O INVALID_FORMAT si la validación es más específica
                msg: "El parámetro 'ruc' es obligatorio."
            });
        }

        //* Paso 3 - Interactuar con BDD
        const client = await Clients.findOne({ Ruc: ruc }).select("Name ComercialName Ruc Address telephone email state"); // Seleccionar campos
        if (!client) {
            return res.status(404).json({
                status: "error",
                code: "NOT_FOUND",
                msg: `No se encontró cliente con RUC ${ruc}.`
            });
        }

        return res.status(200).json({
            status: "success",
            code: "CLIENT_FOUND",
            msg: "Cliente encontrado.",
            data: client // El objeto ya tiene los campos seleccionados
        });
    } catch (error) {
        //console.error("Error en getClientsById:", error); // Log interno
        return res.status(500).json({
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al buscar el cliente. Intente de nuevo más tarde."
        });
    }
}

const UpdateClient = async (req, res) => {
    try {
        const { ruc } = req.params;
        const updatedData = req.body;

        if (!ruc) {
            return res.status(400).json({
                status: "error",
                code: "MISSING_FIELD",
                msg: "El parámetro 'ruc' es obligatorio."
            });
        }

        // Validar si el email proporcionado ya existe en otro cliente
        if (updatedData.email) {
            const verifyEmail = await Clients.findOne({ email: updatedData.email, Ruc: { $ne: ruc } }); // Excluir el cliente actual
            if (verifyEmail) {
                return res.status(409).json({ // 409 Conflict
                    status: "error",
                    code: "RESOURCE_ALREADY_EXISTS",
                    msg: `El email '${updatedData.email}' ya está registrado por otro cliente.`
                });
            }
        }


        // Obtener los atributos válidos del modelo (mejor si se define explícitamente)
        const validFields = ['Name','ComercialName', 'Address', 'telephone', 'email','state'];
        const filteredUpdates = {};

        // Filtrar los campos válidos para la actualización
        for (const key in updatedData) {
            if (validFields.includes(key)) {
                filteredUpdates[key] = updatedData[key];
            }
        }

        // Validar si hay campos válidos para actualizar
        if (Object.keys(filteredUpdates).length === 0) {
            return res.status(400).json({
                status: "error",
                code: "NO_UPDATABLE_FIELDS",
                msg: "No se proporcionaron campos válidos para actualizar.",
                info:{
                    validFields: validFields,
                }
            });
        }

        // Actualizar el cliente
        const clientToUpdate = await Clients.findOneAndUpdate({ Ruc: ruc }, filteredUpdates, { new: true }).select("Name ComercialName Ruc Address telephone email credit state"); // Devolver el doc actualizado y seleccionar campos

        if (!clientToUpdate) {
            return res.status(404).json({
                status: "error",
                code: "NOT_FOUND",
                msg: `No se encontró cliente con RUC ${ruc} para actualizar.`
            });
        }

        return res.status(200).json({
            status: "success",
            code: "CLIENT_UPDATED",
            msg: "Cliente actualizado correctamente.",
            data: clientToUpdate // Devolver el cliente actualizado
        });
    } catch (error) {
        //console.error("Error en UpdateClient:", error); // Log interno
        return res.status(500).json({
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al actualizar el cliente. Intente de nuevo más tarde."
        });
    }
}

const DeleteClient = async (req, res) => {
    try {
        const { id } = req.params; // Asumiendo que se usa el _id de MongoDB

        if (!id) { // Validar que el ID está presente
            return res.status(400).json({
                status: "error",
                code: "MISSING_FIELD",
                msg: "El parámetro 'id' es obligatorio."
            });
        }
        // Validar formato de ObjectId si es necesario
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                status: "error",
                code: "INVALID_FORMAT",
                msg: `El ID '${id}' no tiene un formato válido.`
            });
        }

        // Buscar el cliente para obtener su RUC
        const client = await Clients.findById(id);
        if (!client) {
            return res.status(404).json({
                status: "error",
                code: "NOT_FOUND",
                msg: `No se encontró cliente con ID ${id} para eliminar.`
            });
        }

        // Validar si el cliente tiene órdenes activas (no Enviado ni Cancelado)
        const activeOrder = await Orders.findOne({
            customer: client.Ruc,
            status: { $nin: ["Enviado", "Cancelado"] }
        });

        if (activeOrder) {
            return res.status(400).json({
                status: "error",
                code: "CLIENT_HAS_ACTIVE_ORDERS",
                msg: "No se puede eliminar el cliente porque tiene órdenes activas (no Enviado ni Cancelado).",
                info: { orderId: activeOrder._id, orderStatus: activeOrder.status }
            });
        }

        const deletedClient = await Clients.findByIdAndDelete(id);

        return res.status(200).json({
            status: "success",
            code: "CLIENT_DELETED",
            msg: "Cliente eliminado con éxito."
        });
    } catch (error) {
        //console.error("Error en DeleteClient:", error); // Log interno
        // Manejar error específico si el ID no es un ObjectId válido
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return res.status(400).json({
                status: "error",
                code: "INVALID_FORMAT",
                msg: `El ID '${req.params.id}' no tiene un formato válido.`
            });
        }
        return res.status(500).json({
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al eliminar el cliente. Intente de nuevo más tarde."
        });
    }
}

export {
    RegisterClient,
    getAllClients,
    getClientsById,
    UpdateClient,
    DeleteClient
}
