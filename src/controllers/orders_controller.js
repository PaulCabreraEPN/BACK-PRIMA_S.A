import Orders from '../models/orders.js'
import Clients from '../models/clients.js'
import Products from '../models/products.js'
import Sellers from '../models/sellers.js'


//* Crear Ordenes
const createOrder = async(req,res) => {
    try {
        const { customer, products, discountApplied, netTotal, totalWithTax } = req.body;
        
        // Validaciones iniciales
        if (!customer || !products || !discountApplied || !netTotal || !totalWithTax) {
            return res.status(400).json({ message: "Todos los campos son requeridos" });
        }

        if (discountApplied < 0 || netTotal < 0 || totalWithTax < 0) {
            return res.status(400).json({ message: "Los valores numéricos deben ser positivos" });
        }

        const customerExists = await Clients.findOne({Ruc: customer});
        
        if (!customerExists) {
            return res.status(404).json({ message: "Cliente no encontrado" });
        }

        // Array para almacenar los productos verificados
        const productsToUpdate = [];

        // Verificación inicial de productos y stock
        for (const product of products) {
            console.log(`Verificando producto ID: ${product.productId}`);
            
            // Convertir productId a número ya que en el modelo es type: Number
            const productId = parseInt(product.productId);
            
            const productInDB = await Products.findOne({ id: productId });
            
            if (!productInDB) {
                return res.status(404).json({ 
                    message: `Producto no encontrado: ${product.productId}` 
                });
            }

            console.log(`Stock actual del producto ${productId}: ${productInDB.stock}`);
            console.log(`Cantidad solicitada: ${product.quantity}`);

            if (productInDB.stock < product.quantity) {
                return res.status(400).json({ 
                    message: `Stock insuficiente para el producto ${productId}. Stock actual: ${productInDB.stock}, Cantidad solicitada: ${product.quantity}` 
                });
            }

            productsToUpdate.push({
                id: productId,
                quantity: product.quantity,
                currentStock: productInDB.stock
            });
        }

        // Actualización de stock
        for (const product of productsToUpdate) {
            console.log(`Actualizando stock del producto ${product.id}`);
            console.log(`Stock antes de actualizar: ${product.currentStock}`);
            console.log(`Cantidad a restar: ${product.quantity}`);
            
            const result = await Products.findOneAndUpdate(
                { id: product.id },
                { $inc: { stock: -product.quantity } },
                { new: true }
            );

            if (!result) {
                throw new Error(`Error al actualizar el stock del producto ${product.id}`);
            }

            console.log(`Stock después de actualizar: ${result.stock}`);
        }

        // Crear la orden
        const newOrder = new Orders(req.body);
        newOrder.seller = req.SellerBDD._id;
        const savedOrder = await newOrder.save();

        res.status(201).json({
            msg: "Orden creada con éxito",
            savedOrder
        });

    } catch (error) {
        console.error('Error en createOrder:', error);
        res.status(500).json({
            message: "Error al registrar la orden",
            error: error.message
        });
    }
}

//* Ver todas las ordenes
const getAllOrders = async (req, res) => {
    try {
        const ordersBDD = await Orders.find().select("-_id")
        res.status(200).json(ordersBDD);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los productos", error: error.message })
    }
}

const listOrders = async (req,res) => {
    //Solo necesitamos interactuar con la BDD
    //const pacientes = await Paciente.find({estado:true}).where("veterinario").equals(req.veterinarioBDD).select("-salida -createAt -updateAt -__v")
    const orders = await Orders.find({estado:true}).populate("products","productId quantity").select("-salida -createAt -updateAt -__v")
    
    res.status(200).json(orders)
  }

//* Actualizar una orden
const updateOrder = async (req, res) => {
    try {
        //Toma de datos
        const { id } = req.params;
        const { products, discountApplied, netTotal, totalWithTax } = req.body;

        //Validaciones
        if (Object.values(req.body).includes("")) {
            return res.status(400).json({ msg: "Lo sentimos, debes llenar todos los campos" });
        }

        if (discountApplied < 0 || netTotal < 0 || totalWithTax < 0) {
            return res.status(400).json({ message: "Los valores numéricos deben ser positivos" });
        }

        const orderToUpdate = await Orders.findById(id);

        if (!orderToUpdate) {
            return res.status(404).json({ message: "Orden no encontrada" });
        }

        // Traer todos los productos de la base de datos de una sola vez
        const productIds = products.map(product => parseInt(product.productId)); // Obtener todos los IDs de productos a actualizar
        const productsInDB = await Products.find({ id: { $in: productIds } }); // Traemos todos los productos de una vez

        // Crear un mapa de los productos de la base de datos para acceso rápido
        const productsMap = productsInDB.reduce((acc, product) => {
            acc[product.id] = product;
            return acc;
        }, {});

        // Verificación inicial de stock y actualización (Regresar los productos al Stock)
        for (const product of orderToUpdate.products) {
            console.log(`Actualizando stock del producto ${product.id}`);
            console.log(`Stock antes de actualizar: ${product.currentStock}`);
            console.log(`Cantidad al reestablecer: ${product.quantity}`);

            const productInDB = productsMap[product.id];

            if (productInDB) {
                const result = await Products.findOneAndUpdate(
                    { id: product.id },
                    { $inc: { stock: +product.quantity } },
                    { new: true }
                );

                if (!result) {
                    throw new Error(`Error al actualizar el stock del producto ${product.id}`);
                }

                console.log(`Stock después de actualizar: ${result.stock}`);
            } else {
                return res.status(404).json({ message: `Producto no encontrado: ${product.id}` });
            }
        }

        // Verificación y actualización de stock para los nuevos productos
        const productsToUpdate = [];

        for (const product of products) {
            const productInDB = productsMap[parseInt(product.productId)];

            if (!productInDB) {
                return res.status(404).json({
                    message: `Producto no encontrado: ${product.productId}`
                });
            }

            console.log(`Stock actual del producto ${product.productId}: ${productInDB.stock}`);
            console.log(`Cantidad solicitada: ${product.quantity}`);

            if (productInDB.stock < product.quantity) {
                return res.status(400).json({
                    message: `Stock insuficiente para el producto ${product.productId}. Stock actual: ${productInDB.stock}, Cantidad solicitada: ${product.quantity}`
                });
            }

            productsToUpdate.push({
                id: productInDB.id,
                quantity: product.quantity,
                currentStock: productInDB.stock
            });
        }

        // Actualización de stock para los nuevos productos
        for (const product of productsToUpdate) {
            console.log(`Actualizando stock del producto ${product.id}`);
            console.log(`Stock antes de actualizar: ${product.currentStock}`);
            console.log(`Cantidad a restar: ${product.quantity}`);

            const result = await Products.findOneAndUpdate(
                { id: product.id },
                { $inc: { stock: -product.quantity } },
                { new: true }
            );

            if (!result) {
                throw new Error(`Error al actualizar el stock del producto ${product.id}`);
            }

            console.log(`Stock después de actualizar: ${result.stock}`);
        }

        // Actualizar la orden
        const filteredUpdates = {
            products: productsToUpdate,
            discountApplied: discountApplied,
            netTotal: netTotal,
            totalWithTax: totalWithTax
        };

        const updatedOrder = await Orders.findByIdAndUpdate(id, filteredUpdates, { new: true });

        res.status(200).json({
            msg: "Orden actualizada con éxito",
            updatedOrder
        });

    } catch (error) {
        console.error('Error en updateOrder: ', error);
        res.status(500).json({
            message: "Error al actualizar orden",
            error: error.message
        });
    }
};




//* Actualizar el estado de una Orden
const updateStateOrder = async (req, res) => {
    //* Paso 1 - Tomar Datos del Request
    const { id } = req.params; // ID de la orden a actualizar
    const { status } = req.body; // Estado a actualizar

    //* Paso 2 - Validar Datos
    // Validar si el id es un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ 
            msg: `No existe la proforma con el id ${id}. Ingrese un ID válido para actualizar.` 
        });
    }

    if (!status) {
        return res.status(400).json({ 
            msg: "El campo 'status' es requerido para actualizar el estado." 
        });
    }

    try {
        //Agregar fecha de actualización
        const fechaActual = new Date();

        // Actualizar el estado y la fecha de última modificación
        const updatedOrder = await Orders.findByIdAndUpdate(
            id,
            { status, lastUpdate: new Date(fechaActual.getTime() - fechaActual.getTimezoneOffset() * 60000)},
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ 
                msg: `No se encontró la proforma con el id ${id}.` 
            });
        }

        // Responder con el registro actualizado
        return res.status(200).json({
            msg: "Estado de la proforma actualizado correctamente.",
            data: updatedOrder,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ 
            msg: "Error interno del servidor.", 
            error: error.message 
        });
    }
};


export{
    createOrder,
    updateOrder,
    getAllOrders,
    listOrders,
    updateStateOrder
}
