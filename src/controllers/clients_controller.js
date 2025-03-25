import Clients from '../models/clients.js';

const RegisterClient = async (req,res) => {
    try {
        const {Ruc,email} = req.body;
    
        const verifyClient = await Clients.findOne({Ruc:Ruc});
    
        if(verifyClient){return res.status(400).json({message:"El cliente ya existe"})}
    
        const verifyEmail = await Clients.findOne({email:email,});
    
        if(verifyEmail){return res.status(400).json({message:"El email ya existe"})}
    
        const newClient = new Clients(req.body);
        await newClient.save()
        res.status(201).json({message:"Cliente registrado con éxito"});
        
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Error al registrar el cliente",error:error.message})
    }
}

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
    const { ruc } = req.params;

    //* Paso 2 - Validar Datos
    if (!ruc) {
        return res.status(400).json({
            msg: "Por favor, ingrese un RUC válido",
        });
    }

    //* Paso 3 - Interactuar con BDD
    try {
        const client = await Clients.findOne({ Ruc: ruc }); // Usamos findOne para buscar por RUC
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
}

const UpdateClient = async (req,res) => {
    try {
        const {ruc} = req.params;
        const updatedData = req.body;
        // Obtener los atributos válidos del modelo
        const validFields = ['Name', 'Address', 'telephone', 'email', 'credit', 'state'];
        const filteredUpdates = {};
        const verifyEmail = await Clients.findOne({email:updatedData.email,});
        if(verifyEmail){return res.status(400).json({message:"El email ya existe"});}
        // Filtrar los campos válidos para la actualización
        for (const key in updatedData) {
            if (validFields.includes(key)) {
                filteredUpdates[key] = updatedData[key];
            }
        }

        // Validar si hay campos válidos para actualizar
        if (Object.keys(filteredUpdates).length === 0) {
            return res.status(400).json({ msg: "No se proporcionaron campos válidos para actualizar" });
        }

        // Actualizar el cliente
        await Clients.findOneAndUpdate({ Ruc: ruc }, filteredUpdates,{new:true});
        res.status(200).json({ msg: "Cliente actualizado correctamente", data: filteredUpdates });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al actualizar el cliente", error: error.message });
    }
}

const DeleteClient = async (req,res) => {
    const {id} = req.params;
    try {
        const deletedClient = await Clients.findByIdAndDelete(id);
        if(!deletedClient){return res.status(404).json({message:"Cliente no encontrado"})}
        res.status(200).json({message:"Cliente eliminado con éxito"});
    } catch (error) {
        console.error(error);
        res.status(500).json({message:"Error al eliminar el cliente",error:error.message})
    }
}



export {
    RegisterClient,
    getAllClients,
    getClientsById,
    UpdateClient,
    DeleteClient
}
