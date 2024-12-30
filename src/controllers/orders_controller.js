import Orders from '../models/orders.js'
import Clients from '../models/clients.js'
import Sellers from '../models/sellers.js'
import Products from '../models/products.js'
import mongoose from 'mongoose'


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

        if (orderToUpdate.status!=="Pending"){
            return res.status(400).json({ message: "El pedido ya no se puede actualizar" });
        }

        console.log(orderToUpdate.status);
        

        // Traer todos los productos de la base de datos de una sola vez
        const productIds = products.map(product => parseInt(product.productId)); // Obtener todos los IDs de productos a actualizar
        const productsInDB = await Products.find({ id: { $in: productIds } }); // Traemos todos los productos de una vez

        // Crear un mapa de los productos de la base de datos para acceso rápido
        const productsMap = productsInDB.reduce((acc, product) => {
            acc[product.id] = product;
            return acc;
        }, {});

        // Verificación inicial de stock y actualización (Regresar los productos al Stock)
        console.log(orderToUpdate.products);
        
        for (const product of orderToUpdate.products) {
            const productId = parseInt(product.productId);

            console.log(`Actualizando stock del producto ${productId}`);
            console.log(`Stock antes de actualizar: ${product.currentStock}`);
            console.log(`Cantidad al reestablecer: ${product.quantity}`);

            const productInDB = productsMap[productId];

            if (productInDB) {
                const result = await Products.findOneAndUpdate(
                    { id: productId },
                    { $inc: { stock: +product.quantity } },
                    { new: true }
                );

                if (!result) {
                    throw new Error(`Error al actualizar el stock del producto ${productId}`);
                }

                console.log(`Stock después de actualizar: ${result.stock}`);
            } else {
                return res.status(404).json({ message: `Producto no encontrado: ${productId}` });
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
                productId: product.productId,
                quantity: product.quantity,
                currentStock: productInDB.stock
            });
        }

        // Actualización de stock para los nuevos productos
        for (const product of productsToUpdate) {

            const productId = parseInt(product.productId);

            console.log(`Actualizando stock del producto ${productId}`);
            console.log(`Stock antes de actualizar: ${product.currentStock}`);
            console.log(`Cantidad a restar: ${product.quantity}`);

            const result = await Products.findOneAndUpdate(
                { id: productId },
                { $inc: { stock: -product.quantity } },
                { new: true }
            );

            if (!result) {
                throw new Error(`Error al actualizar el stock del producto ${productId}`);
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

//Eliminar una orden 
const deleteOrder = async (req, res) => {
    try {
        // Toma de datos desde la solicitud
        const { id } = req.params;

        // Verificar si la orden existe
        const orderToDelete = await Orders.findById(id);

        if (!orderToDelete) {
            return res.status(404).json({ message: "Orden no encontrada" });
        }

        // Reestablecer el stock de los productos relacionados
        const productIds = orderToDelete.products.map(product => parseInt(product.productId));
        const productsInDB = await Products.find({ id: { $in: productIds } });

        // Crear un mapa para acceso rápido a los productos en la base de datos
        const productsMap = productsInDB.reduce((acc, product) => {
            acc[product.id] = product;
            return acc;
        }, {});

        for (const product of orderToDelete.products) {
            const productId = parseInt(product.productId);

            const productInDB = productsMap[productId];

            if (productInDB) {
                const result = await Products.findOneAndUpdate(
                    { id: productId },
                    { $inc: { stock: +product.quantity } },
                    { new: true }
                );

                if (!result) {
                    throw new Error(`Error al reestablecer el stock del producto ${productId}`);
                }

                console.log(`Producto ${productId} - Stock actualizado a ${result.stock}`);
            } else {
                return res.status(404).json({ message: `Producto no encontrado: ${productId}` });
            }
        }

        // Eliminar la orden de la base de datos
        await Orders.findByIdAndDelete(id);

        res.status(200).json({
            msg: "Orden eliminada con éxito y stock reestablecido"
        });
    } catch (error) {
        console.error('Error en deleteOrder:', error);
        res.status(500).json({
            message: "Error al eliminar orden",
            error: error.message
        });
    }
};




const SeeAllOrders = async (req, res) => {
    try {
        // Obtener todas las órdenes
        const orders = await Orders.find();

        if (!orders || orders.length === 0) {
            return res.status(404).json({ message: "No se encontraron órdenes" });
        }

        // Obtener todos los RUCs de clientes y IDs de vendedores
        const customerRUCs = [...new Set(orders.map(order => order.customer))];
        const sellerIds = [...new Set(orders.map(order => order.seller))];

        // Consultar detalles de clientes y vendedores
        const clients = await Clients.find({ Ruc: { $in: customerRUCs } });
        const sellers = await Sellers.find({ _id: { $in: sellerIds } });

        // Crear mapas para acceso rápido con los campos especificados
        const clientMap = clients.reduce((map, client) => {
            map[client.Ruc] = {
                _id: client._id,
                Name: client.Name,
                Ruc: client.Ruc,
                Address: client.Address,
                telephone: client.telephone,
                email: client.email,
                credit: client.credit,
                state: client.state
            };
            return map;
        }, {});

        const sellerMap = sellers.reduce((map, seller) => {
            map[seller._id.toString()] = {
                _id: seller._id,
                names: seller.names,
                lastNames: seller.lastNames,
                numberID: seller.numberID,
                email: seller.email,
                SalesCity: seller.SalesCity,
                PhoneNumber: seller.PhoneNumber,
                role: seller.role,
                username: seller.username
            };
            return map;
        }, {});

        // Obtener todos los productId de las órdenes
        const productIds = orders.flatMap(order =>
            order.products.map(product => parseInt(product.productId))
        );

        // Consultar los detalles de los productos en la base de datos
        const products = await Products.find({ id: { $in: productIds } });

        // Crear un mapa de productos para acceso rápido
        const productMap = products.reduce((map, product) => {
            map[product.id] = {
                _id: product._id,
                product_name: product.product_name,
                measure: product.measure,
                price: product.price
            };
            return map;
        }, {});

        // Formatear las órdenes con la información requerida
        const formattedOrders = orders.map(order => ({
            _id: order._id,
            customer: clientMap[order.customer] || null,
            products: order.products.map(p => ({
                productId: p.productId,
                quantity: p.quantity,
                productDetails: productMap[parseInt(p.productId)] || null
            })),
            discountApplied: order.discountApplied,
            netTotal: order.netTotal,
            totalWithTax: order.totalWithTax,
            status: order.status,
            comment: order.comment,
            seller: sellerMap[order.seller.toString()] || null
        }));

        res.status(200).json(formattedOrders);
    } catch (error) {
        console.error("Error en getOrdersWithDetails: ", error);
        res.status(500).json({
            message: "Error al obtener las órdenes con detalles",
            error: error.message
        });
    }
};



const SeeOrderById = async (req, res) => {
    try {
        // Obtener el ID de la orden desde los parámetros de la solicitud
        const { id } = req.params;

        // Validar que el ID sea un ObjectId válido de MongoDB
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({
                msg: `No existe la orden con el id ${id}. Ingrese un ID válido.`
            });
        }

        // Buscar la orden por su ID
        const order = await Orders.findById(id);

        // Si no se encuentra la orden, retornar error 404
        if (!order) {
            return res.status(404).json({ message: "Orden no encontrada" });
        }

        // Obtener el RUC del cliente y el ID del vendedor de la orden
        const customerRuc = order.customer;
        const sellerId = order.seller;

        // Consultar detalles del cliente y vendedor
        const client = await Clients.findOne({ Ruc: customerRuc });
        const seller = await Sellers.findById(sellerId);

        // Obtener los IDs de los productos en la orden
        const productIds = order.products.map(product => parseInt(product.productId));

        // Consultar los detalles de los productos en la base de datos
        const products = await Products.find({ id: { $in: productIds } });

        // Crear mapas para cliente, vendedor y productos
        const clientDetails = client
            ? {
                _id: client._id,
                Name: client.Name,
                Ruc: client.Ruc,
                Address: client.Address,
                telephone: client.telephone,
                email: client.email,
                credit: client.credit,
                state: client.state
            }
            : null;

        const sellerDetails = seller
            ? {
                _id: seller._id,
                names: seller.names,
                lastNames: seller.lastNames,
                numberID: seller.numberID,
                email: seller.email,
                SalesCity: seller.SalesCity,
                PhoneNumber: seller.PhoneNumber,
                role: seller.role,
                username: seller.username
            }
            : null;

        const productMap = products.reduce((map, product) => {
            map[product.id] = {
                _id: product._id,
                product_name: product.product_name,
                measure: product.measure,
                price: product.price
            };
            return map;
        }, {});

        // Formatear la orden con la información requerida
        const formattedOrder = {
            _id: order._id,
            customer: clientDetails,
            products: order.products.map(p => ({
                productId: p.productId,
                quantity: p.quantity,
                productDetails: productMap[parseInt(p.productId)] || null
            })),
            discountApplied: order.discountApplied,
            netTotal: order.netTotal,
            totalWithTax: order.totalWithTax,
            status: order.status,
            comment: order.comment,
            seller: sellerDetails
        };

        // Enviar la respuesta con la orden formateada
        res.status(200).json(formattedOrder);
    } catch (error) {
        console.error("Error en SeeOrderById: ", error);
        res.status(500).json({
            message: "Error al obtener los detalles de la orden",
            error: error.message
        });
    }
};




export{
    createOrder,
    updateOrder,
    SeeAllOrders,
    SeeOrderById,
    updateStateOrder,
    deleteOrder
    
}
