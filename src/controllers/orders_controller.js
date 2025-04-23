import Orders from '../models/orders.js'
import Clients from '../models/clients.js'
import Sellers from '../models/sellers.js'
import Products from '../models/products.js'
import mongoose from 'mongoose'


//* Crear Ordenes
const createOrder = async (req, res) => {
    let stockUpdated = false; // Bandera para saber si el stock se modificó
    let updateOperations = []; // Guardar las operaciones por si hay que revertir

    try {
        const { customer, products: inputProducts, discountApplied, netTotal, totalWithTax, comment } = req.body;

        // --- Validaciones Iniciales ---
        if (!customer || !inputProducts || !Array.isArray(inputProducts) || inputProducts.length === 0 || discountApplied == null || netTotal == null || totalWithTax == null) {
            return res.status(400).json({ message: "Lista de productos (no vacía), descuento aplicado, total neto y total con impuesto son requeridos." });
        }

        if (discountApplied < 0 || netTotal < 0 || totalWithTax < 0) {
            return res.status(400).json({ message: "Los valores numéricos (descuento, totales) deben ser positivos." });
        }

        // Validar contenido de productos en la entrada
        const productQuantities = {};
        for (const product of inputProducts) {
            if (!product.productId || !product.quantity || product.quantity <= 0) {
                return res.status(400).json({ msg: `Cada producto debe tener 'productId' y 'quantity' (mayor que 0). Error en: ${JSON.stringify(product)}` });
            }
            const pId = parseInt(product.productId);
            if (isNaN(pId)) {
                return res.status(400).json({ msg: `El productId '${product.productId}' no es un número válido.` });
            }
            productQuantities[pId] = (productQuantities[pId] || 0) + product.quantity;
        }
        const productIds = Object.keys(productQuantities).map(Number);

        // --- Operaciones ---

        // 1. Verificar Cliente
        const customerExists = await Clients.findOne({ Ruc: customer });
        if (!customerExists) {
            return res.status(404).json({ message: "Cliente no encontrado" });
        }

        // 2. Obtener Productos y Verificar Stock
        const productsInDB = await Products.find({ id: { $in: productIds } });
        const productsMap = productsInDB.reduce((map, p) => {
            map[p.id] = p;
            return map;
        }, {});

        const bulkWriteOps = [];
        updateOperations = []; // Limpiar/inicializar por si acaso
        for (const productId of productIds) {
            const productInDB = productsMap[productId];
            const requestedQuantity = productQuantities[productId];

            if (!productInDB) {
                return res.status(404).json({ message: `Producto con ID ${productId} no encontrado.` });
            }

            // Verificación de stock antes de la operación 
            if (productInDB.stock < requestedQuantity) {
                return res.status(400).json({
                    message: `Stock insuficiente para el producto ${productId}. Stock actual: ${productInDB.stock}, Cantidad solicitada: ${requestedQuantity}`
                });
            }

            const operation = {
                updateOne: {
                    // Añadir condición de stock para evitar conflictos
                    filter: { id: productId, stock: { $gte: requestedQuantity } },
                    update: { $inc: { stock: -requestedQuantity } }
                }
            };
            bulkWriteOps.push(operation);
            // Guardar la operación y la cantidad para posible reversión
            updateOperations.push({ productId, quantity: requestedQuantity });
        }

        // 3. Actualizar Stock
        if (bulkWriteOps.length > 0) {
            const bulkResult = await Products.bulkWrite(bulkWriteOps);
            console.log(`Resultado de bulkWrite de stock:`, bulkResult);

            // Verificar si todas las operaciones esperadas modificaron el stock
            if (bulkResult.modifiedCount !== bulkWriteOps.length) {
                console.warn("Advertencia: No todas las operaciones de stock se completaron como se esperaba. Posible cambio de stock concurrente.");
                // Considerar devolver un error si la consistencia es crítica
                return res.status(409).json({ message: "Conflicto de stock al intentar actualizar. Inténtalo de nuevo." });
            }
            stockUpdated = true; // Marcar que el stock se actualizó
            console.log(`Stock actualizado para ${bulkResult.modifiedCount} productos.`);
        } else {
            return res.status(400).json({ message: "No se prepararon operaciones de stock." });
        }


        // 4. Crear la Orden
        const newOrder = new Orders({
            customer,
            products: Object.entries(productQuantities).map(([pId, qty]) => ({
                productId: pId,
                quantity: qty
            })),
            discountApplied,
            netTotal,
            totalWithTax,
            comment,
            seller: req.SellerBDD._id
        });
        const savedDoc = await newOrder.save(); // Guardar la orden


        // --- Fin de Operaciones ---

        // Formatear respuesta
        const savedOrderResponse = {
            _id: savedDoc._id,
            customer: savedDoc.customer,
            products: savedDoc.products.map(p => ({
                productId: p.productId,
                quantity: p.quantity
            })),
            discountApplied: savedDoc.discountApplied,
            netTotal: savedDoc.netTotal,
            totalWithTax: savedDoc.totalWithTax,
            status: savedDoc.status,
            comment: savedDoc.comment,
            registrationDate: savedDoc.registrationDate,
            lastUpdate: savedDoc.lastUpdate,
            seller: savedDoc.seller
        };

        res.status(201).json({
            msg: "Orden creada con éxito y stock actualizado",
            savedOrder: savedOrderResponse
        });

    } catch (error) {
        console.error('Error en createOrder:', error);

        // Intentar revertir el stock si ya se había actualizado
        if (stockUpdated && updateOperations.length > 0) {
            console.warn("Error después de actualizar stock. Intentando revertir...");
            const revertBulkOps = updateOperations.map(op => ({
                updateOne: {
                    filter: { id: op.productId },
                    // Incrementar el stock para revertir la disminución
                    update: { $inc: { stock: op.quantity } }
                }
            }));
            try {
                await Products.bulkWrite(revertBulkOps);
                console.log("Reversión de stock completada.");
            } catch (revertError) {
                console.error("¡Error Crítico! Falló la reversión del stock:", revertError);
            }
        }

        res.status(500).json({
            message: "Error al registrar la orden",
            detail: error.message // Cambiado 'error' a 'detail' para evitar confusión con el objeto Error
        });
    }
    // No hay bloque finally necesario solo para la sesión
}


//* Actualizar Orden
const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        // Renombrar 'products' de req.body para evitar confusión con la variable interna
        const { products: newProductsData, discountApplied, netTotal, totalWithTax, comment } = req.body;

        // --- Validaciones Iniciales ---
        if (!newProductsData || !discountApplied || !netTotal || !totalWithTax) {
            return res.status(400).json({ msg: "Lo sentimos, debes llenar todos los campos requeridos (products, discountApplied, netTotal, totalWithTax)" });
        }
        // Validar que products sea un array
        if (!Array.isArray(newProductsData)) {
            return res.status(400).json({ msg: "El campo 'products' debe ser un array." });
        }
        // Validar contenido de products
        for (const product of newProductsData) {
            if (!product.productId || product.quantity == null || product.quantity <= 0) {
                return res.status(400).json({ msg: "Cada producto debe tener 'productId' y 'quantity' (mayor que 0)." });
            }
        }

        if (discountApplied < 0 || netTotal < 0 || totalWithTax < 0) {
            return res.status(400).json({ message: "Los valores numéricos (discountApplied, netTotal, totalWithTax) deben ser positivos" });
        }

        const orderToUpdate = await Orders.findById(id);

        if (!orderToUpdate) {
            return res.status(404).json({ message: "Orden no encontrada" });
        }

        if (orderToUpdate.status !== "Pendiente") {
            return res.status(400).json({ message: "El pedido ya no se puede actualizar porque su estado no es 'Pendiente'" });
        }

        // --- Lógica de Actualización de Stock ---

        // 1. Crear mapas de cantidades antiguas y nuevas
        const oldQuantities = orderToUpdate.products.reduce((map, p) => {
            map[parseInt(p.productId)] = p.quantity;
            return map;
        }, {});
        const newQuantities = newProductsData.reduce((map, p) => {
            // Sumar cantidades si el mismo productId aparece varias veces en la entrada
            const pId = parseInt(p.productId);
            map[pId] = (map[pId] || 0) + p.quantity;
            return map;
        }, {});

        // 2. Obtener todos los IDs de productos involucrados (antiguos y nuevos)
        const allInvolvedProductIds = Array.from(new Set([
            ...Object.keys(oldQuantities).map(Number),
            ...Object.keys(newQuantities).map(Number)
        ]));

        // 3. Obtener el estado actual de los productos desde la BD
        const productsInDB = await Products.find({ id: { $in: allInvolvedProductIds } });
        const productsMap = productsInDB.reduce((acc, product) => {
            acc[product.id] = product; // Guardar el documento completo del producto
            return acc;
        }, {});

        // 4. Calcular el cambio neto de stock para cada producto y verificar disponibilidad
        const stockChanges = {}; // { productId: netChange }
        const bulkWriteOps = [];

        for (const productId of allInvolvedProductIds) {
            const productInDB = productsMap[productId];

            // Verificar si el producto existe en la BD (importante si se añade uno nuevo)
            if (!productInDB && newQuantities[productId] > 0) {
                return res.status(404).json({ message: `Producto con ID ${productId} no encontrado en la base de datos.` });
            }
            // Si el producto solo estaba en la orden original y no en la BD (caso raro), no hacer nada con su stock
            if (!productInDB) continue;


            const oldQty = oldQuantities[productId] || 0;
            const newQty = newQuantities[productId] || 0;
            const netChange = oldQty - newQty; // Positivo = devolver stock, Negativo = quitar stock

            if (netChange !== 0) {
                // Verificar si hay suficiente stock *antes* de preparar la operación
                // El stock final será: productInDB.stock + netChange
                if (productInDB.stock + netChange < 0) {
                    return res.status(400).json({
                        message: `Stock insuficiente para el producto ${productId}. Stock actual: ${productInDB.stock}, se intentarían quitar ${-netChange} unidades.`
                    });
                }
                // Añadir operación al bulkWrite
                bulkWriteOps.push({
                    updateOne: {
                        filter: { id: productId },
                        update: { $inc: { stock: netChange } }
                    }
                });
            }
        }

        // --- Ejecutar Actualizaciones ---

        // 5. Aplicar cambios de stock en la BD (si hay cambios)
        if (bulkWriteOps.length > 0) {
            await Products.bulkWrite(bulkWriteOps);
            console.log(`Stock actualizado para ${bulkWriteOps.length} productos.`);
        }

        // 6. Preparar los datos para actualizar la orden
        // Usar los datos validados y procesados de newQuantities para asegurar consistencia
        const finalProductsArray = Object.entries(newQuantities).map(([productId, quantity]) => ({
            productId: productId, // Asegurarse que sea string si el modelo lo espera así, o number si no. Asumiendo number basado en parseInt.
            quantity: quantity
        }));


        const filteredUpdates = {
            products: finalProductsArray, // Usar el array final procesado
            discountApplied: discountApplied,
            netTotal: netTotal,
            totalWithTax: totalWithTax,
            lastUpdate: new Date() // Actualizar fecha de modificación
        };

        if (comment !== null) { filteredUpdates.comment = comment; }
        // Si no se quiere actualizar el comentario, no lo incluimos en filteredUpdates

        // 7. Actualizar el documento de la orden
        const updatedOrder = await Orders.findByIdAndUpdate(id, filteredUpdates, { new: true }).lean().select("-__v -createdAt -updatedAt");

        res.status(200).json({
            msg: "Orden actualizada con éxito y stock ajustado",
            updatedOrder
        });

    } catch (error) {
        console.error('Error en updateOrder: ', error);
        // Detectar errores específicos si es posible (ej. CastError de Mongoose)
        if (error.name === 'CastError') {
            return res.status(400).json({ message: "ID de orden inválido." });
        }
        res.status(500).json({
            message: "Error interno del servidor al actualizar la orden",
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
            { status, lastUpdate: new Date(fechaActual.getTime() - fechaActual.getTimezoneOffset() * 60000) },
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

        // Solo permitir eliminar órdenes pendientes
        if (orderToDelete.status !== "Pendiente") {
            return res.status(400).json({ message: "Lo sentimos, solo se pueden eliminar órdenes con estado 'Pendiente'" });
        }

        // --- Preparar Restauración de Stock ---
        const bulkStockRestoreOps = [];
        const productIdsToFind = orderToDelete.products.map(p => parseInt(p.productId));
        const productsInDB = await Products.find({ id: { $in: productIdsToFind } });
        const productsMap = productsInDB.reduce((map, product) => {
            map[product.id] = product;
            return map;
        }, {});

        for (const product of orderToDelete.products) {
            const productId = parseInt(product.productId);
            const productInDB = productsMap[productId];

            if (productInDB) {
                bulkStockRestoreOps.push({
                    updateOne: {
                        filter: { id: productId },
                        // Incrementar el stock con la cantidad del producto en la orden
                        update: { $inc: { stock: product.quantity } }
                    }
                });
            } else {
                // Opcional: Registrar si un producto de la orden ya no existe
                console.warn(`Advertencia: Producto con ID ${productId} de la orden ${id} no encontrado en la colección de productos. No se restaurará su stock.`);
            }
        }

        // --- Ejecutar Operaciones ---

        // 1. Restaurar el stock (si hay operaciones)
        if (bulkStockRestoreOps.length > 0) {
            await Products.bulkWrite(bulkStockRestoreOps);
            console.log(`Stock restaurado para ${bulkStockRestoreOps.length} tipos de productos de la orden ${id}.`);
        }

        // 2. Eliminar la orden de la base de datos
        await Orders.findByIdAndDelete(id);

        res.status(200).json({
            msg: "Orden eliminada con éxito y stock reestablecido"
        });

    } catch (error) {
        console.error('Error en deleteOrder:', error);
        // Considerar si el error vino de bulkWrite o findByIdAndDelete para dar un mensaje más específico
        res.status(500).json({
            message: "Error al eliminar la orden",
            error: error.message
        });
    }
};




const SeeAllOrders = async (req, res) => {
    try {
        // --- Paginación ---
        const page = parseInt(req.query.page) || 1; // Página actual, default 1
        const limit = parseInt(req.query.limit) || 10; // Órdenes por página, default 10
        const skip = (page - 1) * limit; // Calcular cuántos documentos saltar

        // Obtener el total de órdenes para calcular el total de páginas
        const totalOrders = await Orders.countDocuments();

        if (totalOrders === 0) {
            return res.status(200).json({ // Cambiado a 200 OK, no es un error no tener órdenes
                message: "No se encontraron órdenes",
                orders: [],
                currentPage: 1,
                totalPages: 0,
                totalOrders: 0
            });
        }

        // Calcular el total de páginas
        const totalPages = Math.ceil(totalOrders / limit);

        // Validar si la página solicitada existe
        if (page > totalPages) {
            return res.status(404).json({ message: `Página no encontrada. Solo hay ${totalPages} páginas.` });
        }

        // Obtener las órdenes para la página actual, ordenadas por fecha de registro descendente
        const orders = await Orders.find()
            .sort({ registrationDate: -1 }) // Ordenar por más reciente primero
            .skip(skip)
            .limit(limit);

        // --- Obtener Detalles Relacionados (Solo para la página actual) ---

        // Obtener RUCs de clientes y IDs de vendedores únicos de las órdenes de esta página
        const customerRUCs = [...new Set(orders.map(order => order.customer))];
        const sellerIds = [...new Set(orders.map(order => order.seller))];
        // Obtener IDs de productos únicos de las órdenes de esta página
        const productIds = [...new Set(orders.flatMap(order =>
            order.products.map(product => parseInt(product.productId))
        ))];

        // Consultar detalles de clientes, vendedores y productos para esta página
        // Usar Promise.all para ejecutar consultas en paralelo
        const [clients, sellers, products] = await Promise.all([
            Clients.find({ Ruc: { $in: customerRUCs } }).select("Name Ruc Address telephone email credit state"), // Seleccionar campos
            Sellers.find({ _id: { $in: sellerIds } }).select("names lastNames numberID email SalesCity PhoneNumber"), // Seleccionar campos
            Products.find({ id: { $in: productIds } }).select("id product_name measure price") // Seleccionar campos (incluir 'id' para el mapeo)
        ]);


        // Crear mapas para acceso rápido
        const clientMap = clients.reduce((map, client) => {
            map[client.Ruc] = client.toObject(); // Convertir a objeto plano
            return map;
        }, {});

        const sellerMap = sellers.reduce((map, seller) => {
            map[seller._id.toString()] = seller.toObject(); // Convertir a objeto plano
            return map;
        }, {});

        const productMap = products.reduce((map, product) => {
            map[product.id] = product.toObject(); // Usar 'id' numérico como clave, convertir a objeto plano
            return map;
        }, {});

        // Formatear las órdenes con la información requerida
        const formattedOrders = orders.map(order => ({
            _id: order._id,
            // Usar .toObject() para obtener un objeto plano de la orden antes de modificarlo
            ...order.toObject(), // Incluir otros campos de la orden si es necesario
            customer: clientMap[order.customer] || null, // Usar el mapa de clientes
            seller: sellerMap[order.seller.toString()] || null, // Usar el mapa de vendedores
            products: order.products.map(p => ({
                productId: p.productId,
                quantity: p.quantity,
                // Buscar detalles del producto en el mapa usando el ID numérico
                productDetails: productMap[parseInt(p.productId)] || null
            }))
            // Eliminar campos no deseados si es necesario después de ...order.toObject()
            // delete formattedOrder.__v;
        }));

        // --- Respuesta Paginada ---
        res.status(200).json({
            orders: formattedOrders,
            currentPage: page,
            totalPages: totalPages,
            totalOrders: totalOrders,
            limit: limit
        });

    } catch (error) {
        console.error("Error en SeeAllOrders: ", error);
        res.status(500).json({
            message: "Error al obtener las órdenes con detalles",
            error: error.message
        });
    }
};



const SeeOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Buscar la orden principal y obtenerla como objeto plano
        const order = await Orders.findById(id).lean(); // Usar lean() para obtener objeto plano

        if (!order) {
            return res.status(404).json({ message: "Orden no encontrada" });
        }

        // 2. Obtener IDs relacionados
        const customerRuc = order.customer;
        const sellerId = order.seller;
        // Asegurarse de que productIds sean números para la consulta
        const productIds = order.products.map(product => parseInt(product.productId));

        // 3. Consultar detalles relacionados en paralelo y obtener objetos planos
        const [clientDetails, sellerDetails, productsDetails] = await Promise.all([
            Clients.findOne({ Ruc: customerRuc })
                .select("Name Ruc Address telephone email credit state") // Seleccionar campos necesarios
                .lean(), // Obtener objeto plano
            Sellers.findById(sellerId)
                .select("names lastNames numberID email SalesCity PhoneNumber") // Seleccionar campos necesarios
                .lean(), // Obtener objeto plano
            // Asegurarse de que la consulta use los IDs numéricos
            Products.find({ id: { $in: productIds } })
                .select("id product_name measure price") // Seleccionar campos necesarios (incluir 'id' para mapeo)
                .lean() // Obtener objetos planos
        ]);

        // 4. Crear mapa de productos (si se encontraron productos)
        const productMap = productsDetails ? productsDetails.reduce((map, product) => {
            // Usar el campo 'id' numérico como clave
            map[product.id] = product; // Ya es un objeto plano
            return map;
        }, {}) : {};

        // 5. Formatear la orden final (order ya es un objeto plano)
        const formattedOrder = {
            _id: order._id,
            customer: clientDetails, // Asignar directamente (ya es objeto plano o null)
            products: order.products.map(p => {
                const productIdNum = parseInt(p.productId); // Convertir a número para buscar en el mapa
                return {
                    productId: p.productId, // Mantener el string original si se prefiere
                    quantity: p.quantity,
                    // Buscar usando el ID numérico
                    productDetails: productMap[productIdNum] || null
                };
            }),
            discountApplied: order.discountApplied,
            netTotal: order.netTotal,
            totalWithTax: order.totalWithTax,
            status: order.status,
            comment: order.comment,
            seller: sellerDetails, // Asignar directamente (ya es objeto plano o null)
            // Incluir fechas si son necesarias en la respuesta
            registrationDate: order.registrationDate,
            lastUpdate: order.lastUpdate
        };

        // Eliminar campos que no se quieran explícitamente (si .lean() trajo alguno extra)
        // delete formattedOrder.__v; // Ejemplo

        res.status(200).json(formattedOrder);

    } catch (error) {
        console.error("Error en SeeOrderById: ", error);
        // Manejar CastError específicamente si findById falla por ID inválido (aunque ya validado)
        if (error.name === 'CastError') {
            return res.status(400).json({ message: "ID de orden inválido." });
        }
        res.status(500).json({
            message: "Error al obtener los detalles de la orden",
            error: error.message
        });
    }
};




export {
    createOrder,
    updateOrder,
    SeeAllOrders,
    SeeOrderById,
    updateStateOrder,
    deleteOrder

}
