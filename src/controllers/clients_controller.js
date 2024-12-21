import Clients from '../models/clients.js';
import mongoose from 'mongoose';

const getAllClients = async (req, res) => {
    try {
        const ClientsBDD = await Clients.find().select("-_id")
        res.status(200).json(ClientsBDD);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los productos", error: error.message })
    }
}

const getClientsById = async (req, res) => {
    //* Paso 1 - Tomar Datos del Request
    const { id } = req.params;

    //* Paso 2 - Validar Datos
    if (!id) {
        return res.status(400).json({
            msg: "Por favor, ingrese un ID válido",
        });
    }

    // Validar si el ID es un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({
            msg: `Lo sentimos, no existe un cliente con el ID ${id}`,
        });
    }

    //* Paso 3 - Interactuar con BDD
    try {
        const client = await Clients.findById(id); // Usamos findById para buscar por _id
        if (!client) {
            return res.status(404).json({
                msg: "Cliente no encontrado",
            });
        }

        // Preparar los datos del cliente para enviar
        const clientData = {
            _id: client._id,
            name: client.Name,
            ruc: client.Ruc,
            address: client.Address,
            telephone: client.telephone,
            email: client.email,
            credit: client.credit,
            state: client.state,
        };

        return res.status(200).json({ data: clientData });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            msg: "Error al buscar el cliente",
        });
    }
};



export {
    getAllClients,
    getClientsById
}