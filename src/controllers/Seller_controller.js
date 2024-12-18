import passwordGenerator from '../helpers/passwordGenerator.js'
import Sellers from '../models/sellers.js'
import {SendMailCredentials} from '../config/nodemailer.js';
import usernameGenerator from '../helpers/usernameGenerator.js';
import mongoose from 'mongoose';



//*Login

//* Registrar un Vendedor
const registerSeller = async (req, res) => {
    try {
        //* Paso 1 -Tomar Datos del Request
    const {email,numberID,names} = req.body

    //* Paso 2 - Validar Datos
    //? Verifica si un campo esta vacio
    if(Object.values(req.body).includes("")) {
        return res.status(400).json({msg: "Lo sentimos, debes llenar todos los campos"})
    }
    
    //? Verifica si el email ya existe
    const verifySellerBDD = await Sellers.findOne({email})
    if(verifySellerBDD) {
        return res.status(400).json({msg: "Ya se encuentra registrado el email"})
    }

    //? Verifica si el número de cédula ya está registrado
    const verifyID = await Sellers.findOne({numberID})
    if(verifyID) {
        return res.status(400).json({msg: "Número de cédula ya se encuentra registrado"})
    }


    //? Genera una contraseña aleatoria
    const passwordGen = passwordGenerator()
    //? Genera un usuario
    let usernameGen = usernameGenerator(names)

    //? Verificar Username
    let verifyUsername = await Sellers.findOne({ username: usernameGen });

    // Mientras el username esté en uso, genera uno nuevo
    while (verifyUsername) {
        usernameGen = usernameGenerator(names);  // Genera un nuevo username
        verifyUsername = await Sellers.findOne({ username: usernameGen });  // Verifica si ya existe
    }
    
    //* Paso 3 - Interactuar con BDD
    const newSeller = new Sellers(req.body)
    newSeller.password = await newSeller.encryptPassword(passwordGen)
    newSeller.username = usernameGen

    // Crear token
    const token = newSeller.createToken()
    SendMailCredentials(email,names,usernameGen,passwordGen,token)

    // Guardar en la base de datos
    await newSeller.save()

    // Enviar respuesta con el token
    res.status(201).json({msg: "Vendedor registrado exitosamente",})
    } catch (error) {
        console.log(error);
        res.status(500).json({msg: "Error al registrar el vendedor",error: error.message})
    }
}

//* Confirmar Registro parte Vendedor
const confirmEmail = async (req,res)=>{
    try {
        //* Paso 1 -Tomar Datos del Request
    const {token}=req.params
    
    //* Paso 2 - Validar Datos
    if(!(token)){return res.status(400).json({msg:"Lo sentimos no se puede vvalidar la cuenta"})}
    const SellerBDD = await Sellers.findOne({token})
    if(!SellerBDD){return res.status(400).json({msg:"la cuenta ya ha sido confirmada"})}
    //* Paso 3 Interactuar con BDD
    SellerBDD.token = null
    SellerBDD.confirmEmail = true
    await SellerBDD.save()
    res.status(200).json({msg:"Token confirmado, ya puedes iniciar sesión"})
    } catch (error) {
        console.log(error);
        res.status(500).json({msg: "Error al confirmar el registro",error: error.message})
    }
}

const seeSellers = async(req,res) => {
    try {
        const sellers = await Sellers.find()
        const response = sellers.map(seller => ({
            _id: seller._id, 
            name: seller.names,
            lastNames: seller.lastNames,
            numberID: seller.numberID,
            email: seller.email,
            username: seller.username,
            PhoneNumber: seller.PhoneNumber,
            SalesCity: seller.SalesCity,
            role: seller.role,
        }));
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los vendedores', error: error.message });
    }
}

//* Buscar un vendedor por ObjectID
const searchSellerById = async (req, res) => {
    //* Paso 1 - Tomar Datos del Request
    const { id } = req.params;
    
    //* Paso 2 - Validar Datos
    if (!id) return res.status(404).json({
        msg: "Por favor ingrese un id válido"
    });

    // Validar si el id es un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({
        msg: `Lo sentimos, no existe el vendedor con el id ${id}`
    });

    //* Paso 3 - Interactuar con BDD
    try {
        const seller = await Sellers.findById(id) // Usamos findById para buscar por _id
        if (!seller) {
            return res.status(404).json({
                msg: "Vendedor no encontrado"
            });
        }
        const idSeller = {
            _id: seller._id, 
            name: seller.names,
            lastNames: seller.lastNames,
            numberID: seller.numberID,
            email: seller.email,
            username: seller.username,
            PhoneNumber: seller.PhoneNumber,
            SalesCity: seller.SalesCity,
            role: seller.role,
        }

        return res.status(200).json({ msg: idSeller });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "Error al buscar el vendedor" });
    }
}

//* Buscar un vendedor por cedula
const searchSellerByNumberId = async (req, res) =>{
    //* Paso 1 - Tomar Datos del Request
    const { numberID } = req.body;
    
    //* Paso 2 - Validar Datos
    if (!numberID || numberID.toString().trim() === ""){
        return res.status(400).json({msg: "Lo sentimos, debes propocionar la cédula del vendedor"})
    }

    const longitud = String(numberID).length;
    if (longitud!==10){
        return res.status(400).json({msg: "Lo sentimos, formato de cédula invalido"})
    }

    try {
        //* Paso 3 - Interactuar con BDD
        const seller = await Sellers.findOne({ numberID }); 
        if (!seller) {
            return res.status(404).json({
                msg: "Vendedor no encontrado"
            });
        }

        const idSeller = {
            _id: seller._id, 
            name: seller.names,
            lastNames: seller.lastNames,
            numberID: seller.numberID,
            email: seller.email,
            username: seller.username,
            PhoneNumber: seller.PhoneNumber,
            SalesCity: seller.SalesCity,
            role: seller.role,
        }

        return res.status(200).json({ msg: idSeller });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "Error al buscar el vendedor" });
    }
   
}

// Actualizar vendedor - patch 

const updateSellerController = async (req, res) => {
    //* Paso 1 - Tomar Datos del Request
    const { id } = req.params; // ID del vendedor a actualizar
    const updates = req.body; // Datos a actualizar

    //* Paso 2 - Validar Datos
    // Validar si el id es un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({
        msg: `Lo sentimos, no existe el vendedor con el id ${id} ingrese un id valido para actualizar `
    });

    // Obtener los atributos válidos del modelo
    const validFields = ['email', 'PhoneNumber', 'SalesCity'];
    const filteredUpdates = {};

    // Filtrar los campos válidos para la actualización
    for (const key in updates) {
        if (validFields.includes(key)) {
            filteredUpdates[key] = updates[key];
        }
    }

    // Validar si hay campos válidos para actualizar
    if (Object.keys(filteredUpdates).length === 0) {
        return res.status(400).json({ msg: "No se proporcionaron campos válidos para actualizar" });
    }

    try {
        //* Paso 3 - Interactuar con BDD

        // Realizar la actualización
        await Sellers.findByIdAndUpdate(id, filteredUpdates, { new: true });

        // Obtener el registro actualizado, excluyendo el campo "password"
        const updatedSeller = await Sellers.findById(id).lean().select("-password -__v");

        // Responder con el registro actualizado
        return res.status(200).json({
            msg: "Vendedor actualizado correctamente",
            data: updatedSeller,
        });
    } catch (error) {
        // Manejo de errores
        console.error(error);
        return res.status(500).json({ msg: "Error interno del servidor", error: error.message });
    }
};



//* Actualizar completamente un vendedor - put 
const UpdateAllSellerController = async (req, res) => {
    //* Paso 1 - Tomar Datos del Request
    const { id } = req.params; // ID del vendedor a actualizar
    const { email, PhoneNumber, SalesCity, ...otherData } = req.body; // Datos a actualizar

    //* Paso 2 - Validar Datos

    // Validar si el id es un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({
        msg: `Lo sentimos, no existe el vendedor con el id ${id} ingrese un id valido para actualizar `
    });

    // Función para verificar campos vacíos
    const areFieldsEmpty = (...fields) => fields.some(field => !field || field.trim() === "");

    // Validar campos obligatorios
    if (areFieldsEmpty(email, PhoneNumber, SalesCity)) {
        return res.status(400).json({
            error: "Datos vacíos. Por favor, llene todos los campos."
        });
    }

    try {
        //* Paso 3 - Interactuar con BDD
        

        // Construir los datos para la actualización
        const updatedData = {
            email,
            PhoneNumber,
            SalesCity,
            ...otherData // otros campos adicionales que podrían ser enviados en el request
        };

        // Actualizar el vendedor en la base de datos
        const updatedSeller = await Sellers.findByIdAndUpdate(id, updatedData, { new: true });

        // Responder con el vendedor actualizado (sin el campo "password" por seguridad)
        return res.status(200).json({
            msg: "Vendedor actualizado correctamente",
            data: updatedSeller,
        });
    } catch (error) {
        // Manejo de errores
        console.error(error);
        return res.status(500).json({ msg: "Error interno del servidor", error: error.message });
    }
};

//Eliminar 
//* Eliminar un vendedor por ID - delete
const DeleteSellerController = async (req, res) => {
    //* Paso 1 - Tomar Datos del Request
    const { id } = req.params; // ID del vendedor a eliminar

    //* Paso 2 - Validar Datos

    // Validar si el id es un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({
        msg: `Lo sentimos, no existe el vendedor con el id ${id}. Por favor, ingrese un ID válido para eliminar.`
    });

    try {
        //* Paso 3 - Interactuar con BDD

        // Buscar y eliminar el vendedor en la base de datos
        const deletedSeller = await Sellers.findByIdAndDelete(id);

        // Responder con éxito
        return res.status(200).json({
            msg: "Vendedor eliminado correctamente",
            data: deletedSeller
        });
    } catch (error) {
        // Manejo de errores
        console.error(error);
        return res.status(500).json({ msg: "Error interno del servidor", error: error.message });
    }
};


export {
    registerSeller,
    confirmEmail,
    seeSellers,
    searchSellerById,
    searchSellerByNumberId,
    updateSellerController,
    UpdateAllSellerController,
    DeleteSellerController
}
