import Orders from '../models/orders.js'
import Clients from '../models/clients.js'
import Sellers from '../models/sellers.js'
import Products from '../models/products.js'
import mongoose from 'mongoose'

//* Crear Ordenes
const createOrder = async (req, res) => {
    let stockUpdated = false;
    let updateOperations = [];
    let stockUpdateDetails = {};

    try {
        const { customer, products: inputProducts, discountApplied, netTotal, totalWithTax, comment,credit } = req.body;

        // --- Validaciones Iniciales ---
        if (!customer || !inputProducts || !Array.isArray(inputProducts) || inputProducts.length === 0 || discountApplied == null || netTotal == null || totalWithTax == null) {
            return res.status(400).json({
                status: "error",
                code: "MISSING_FIELD",
                msg: "Campos requeridos: customer (RUC), products (array no vacío), discountApplied, netTotal, totalWithTax."
            });
        }

        if (discountApplied < 0 || netTotal < 0 || totalWithTax < 0) {
            return res.status(400).json({
                status: "error",
                code: "INVALID_FORMAT",
                msg: "Los valores numéricos (discountApplied, netTotal, totalWithTax) no pueden ser negativos."
            });
        }

        const productQuantities = {};
        for (const product of inputProducts) {
            if (!product.productId || !product.quantity || product.quantity <= 0) {
                return res.status(400).json({
                    status: "error",
                    code: "INVALID_FORMAT",
                    msg: `Cada producto debe tener 'productId' y 'quantity' (mayor que 0). Error en: ${JSON.stringify(product)}`
                });
            }
            const pId = parseInt(product.productId);
            if (isNaN(pId)) {
                return res.status(400).json({
                    status: "error",
                    code: "INVALID_FORMAT",
                    msg: `El productId '${product.productId}' no es un número válido.`
                });
            }
            productQuantities[pId] = (productQuantities[pId] || 0) + product.quantity;
        }
        const productIds = Object.keys(productQuantities).map(Number);

        // --- Operaciones ---

        // 1. Verificar Cliente
        const customerExists = await Clients.findOne({ Ruc: customer });
        if (!customerExists) {
            return res.status(404).json({
                status: "error",
                code: "NOT_FOUND",
                msg: `Cliente con RUC ${customer} no encontrado.`
            });
        }

        // 2. Obtener Productos y Verificar Stock
        const productsInDB = await Products.find({ id: { $in: productIds } });
        const productsMap = productsInDB.reduce((map, p) => {
            map[p.id] = p;
            return map;
        }, {});

        const bulkWriteOps = [];
        updateOperations = [];
        for (const productId of productIds) {
            const productInDB = productsMap[productId];
            const requestedQuantity = productQuantities[productId];

            if (!productInDB) {
                return res.status(404).json({
                    status: "error",
                    code: "NOT_FOUND",
                    msg: `Producto con ID ${productId} no encontrado.`
                });
            }

            if (productInDB.stock < requestedQuantity) {
                return res.status(400).json({
                    status: "error",
                    code: "INSUFFICIENT_STOCK", // Código específico
                    msg: `Stock insuficiente para el producto ${productId}. Stock actual: ${productInDB.stock}, Cantidad solicitada: ${requestedQuantity}`
                });
            }

            const operation = {
                updateOne: {
                    filter: { id: productId, stock: { $gte: requestedQuantity } },
                    update: { $inc: { stock: -requestedQuantity } }
                }
            };
            bulkWriteOps.push(operation);
            updateOperations.push({ productId, quantity: requestedQuantity });
        }

        // 3. Actualizar Stock
        if (bulkWriteOps.length > 0) {
            const bulkResult = await Products.bulkWrite(bulkWriteOps);
            stockUpdateDetails.attempted = bulkWriteOps.length;
            stockUpdateDetails.modified = bulkResult.modifiedCount;

            if (bulkResult.modifiedCount !== bulkWriteOps.length) {
                stockUpdateDetails.status = "Conflicto";
                stockUpdateDetails.message = `Conflicto de stock: Se intentaron actualizar ${bulkWriteOps.length} productos, pero solo ${bulkResult.modifiedCount} se modificaron. Inténtalo de nuevo.`;
                const revertPartialOps = updateOperations.slice(0, bulkResult.modifiedCount).map(op => ({
                    updateOne: { filter: { id: op.productId }, update: { $inc: { stock: op.quantity } } }
                }));
                if (revertPartialOps.length > 0) {
                    try {
                        await Products.bulkWrite(revertPartialOps);
                        stockUpdateDetails.reversion = "Intento de reversión parcial realizado.";
                    } catch (revertError) {
                        stockUpdateDetails.reversion = `Error crítico al intentar reversión parcial: ${revertError.message}`;
                        console.error("Error crítico al intentar reversión parcial en createOrder:", revertError);
                    }
                }
                return res.status(409).json({ // 409 Conflict
                    status: "error",
                    code: "STOCK_CONFLICT",
                    msg: stockUpdateDetails.message,
                    info: stockUpdateDetails
                });
            }
            stockUpdated = true;
            stockUpdateDetails.status = "Éxito";
            stockUpdateDetails.message = `Stock actualizado para ${bulkResult.modifiedCount} productos.`;
        } else {
            return res.status(400).json({
                status: "error",
                code: "INVALID_OPERATION",
                msg: "No se prepararon operaciones de stock válidas (posiblemente productos no encontrados o cantidades inválidas)."
            });
        }

        // 4. Crear la Orden
        const newOrder = new Orders({
            customer,
            products: Object.entries(productQuantities).map(([pId, qty]) => ({ productId: pId, quantity: qty })),
            discountApplied,
            netTotal,
            totalWithTax,
            comment,
            credit,
            seller: req.SellerBDD._id // Asumiendo que el middleware de autenticación lo añade
        });
        const savedDoc = await newOrder.save();

        // Formatear respuesta
        const savedOrderResponse = {
            _id: savedDoc._id,
            customer: savedDoc.customer,
            products: savedDoc.products.map(p => ({ productId: p.productId, quantity: p.quantity })),
            discountApplied: savedDoc.discountApplied,
            netTotal: savedDoc.netTotal,
            totalWithTax: savedDoc.totalWithTax,
            credit: savedDoc.credit,
            status: savedDoc.status,
            comment: savedDoc.comment,
            registrationDate: savedDoc.registrationDate,
            lastUpdate: savedDoc.lastUpdate,
            seller: savedDoc.seller
        };

        return res.status(201).json({ // 201 Created
            status: "success",
            code: "ORDER_CREATED",
            msg: "Orden creada con éxito y stock actualizado.",
            data: savedOrderResponse,
            info: { stockUpdateDetails }
        });

    } catch (error) {
        console.error("Error en createOrder:", error); // Log interno
        let errorResponse = {
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al registrar la orden. Intente de nuevo más tarde.",
            info: {
                detail: error.message,
                reversionStatus: "No aplica o falló"
            }
        };

        if (stockUpdated && updateOperations.length > 0) {
            errorResponse.info.reversionStatus = "Intentando revertir stock...";
            const revertBulkOps = updateOperations.map(op => ({
                updateOne: { filter: { id: op.productId }, update: { $inc: { stock: op.quantity } } }
            }));
            try {
                const revertResult = await Products.bulkWrite(revertBulkOps);
                errorResponse.info.reversionStatus = `Reversión de stock completada para ${revertResult.modifiedCount} productos.`;
            } catch (revertError) {
                errorResponse.info.reversionStatus = `¡Error Crítico! Falló la reversión del stock: ${revertError.message}`;
                console.error("¡Error Crítico! Falló la reversión del stock en catch de createOrder:", revertError);
            }
        } else if (stockUpdateDetails.status === "Conflicto") {
            errorResponse.info.reversionStatus = stockUpdateDetails.reversion || "Reversión manejada en conflicto de stock.";
        } else {
            errorResponse.info.reversionStatus = "No se requirió reversión de stock (fallo antes de la actualización).";
        }

        return res.status(500).json(errorResponse);
    }
}

//* Actualizar Orden
const updateOrder = async (req, res) => {
    let stockAdjusted = false;
    let stockAdjustmentOps = [];
    let stockUpdateDetails = {};

    try {
        const { id } = req.params;
        const { products: newProductsData, discountApplied, netTotal, totalWithTax, comment, credit } = req.body;

        // --- Validaciones Iniciales ---
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: "error",
                code: "INVALID_FORMAT",
                msg: `ID de orden inválido: ${id}.`
            });
        }
        if (!newProductsData || !Array.isArray(newProductsData) || discountApplied == null || netTotal == null || totalWithTax == null) {
            return res.status(400).json({
                status: "error",
                code: "MISSING_FIELD",
                msg: "Campos requeridos: products (array), discountApplied, netTotal, totalWithTax."
            });
        }
        if (discountApplied < 0 || netTotal < 0 || totalWithTax < 0) {
            return res.status(400).json({
                status: "error",
                code: "INVALID_FORMAT",
                msg: "Los valores numéricos (discountApplied, netTotal, totalWithTax) no pueden ser negativos."
            });
        }
        const productQuantities = {};
        for (const product of newProductsData) {
            if (!product.productId || product.quantity == null || product.quantity <= 0) {
                return res.status(400).json({
                    status: "error",
                    code: "INVALID_FORMAT",
                    msg: `Cada producto debe tener 'productId' y 'quantity' (mayor que 0). Error en: ${JSON.stringify(product)}`
                });
            }
            const pId = parseInt(product.productId);
            if (isNaN(pId)) {
                return res.status(400).json({
                    status: "error",
                    code: "INVALID_FORMAT",
                    msg: `El productId '${product.productId}' no es un número válido.`
                });
            }
            productQuantities[pId] = (productQuantities[pId] || 0) + product.quantity;
        }

        // --- Obtener Orden Original ---
        const orderToUpdate = await Orders.findById(id);
        if (!orderToUpdate) {
            return res.status(404).json({
                status: "error",
                code: "NOT_FOUND",
                msg: `Orden con ID ${id} no encontrada.`
            });
        }

        // Solo permitir que el vendedor actualice sus propias órdenes
        if (
            req.SellerBDD &&
            req.SellerBDD.role === 'Seller' &&
            orderToUpdate.seller.toString() !== req.SellerBDD._id.toString()
        ) {
            return res.status(403).json({
                status: "error",
                code: "FORBIDDEN",
                msg: "No tienes permisos para actualizar esta orden. Solo puedes modificar tus propias órdenes."
            });
        }

        if (orderToUpdate.status !== "Pendiente") {
            return res.status(400).json({ // O 403 Forbidden si es por permisos
                status: "error",
                code: "INVALID_OPERATION",
                msg: `La orden con estado '${orderToUpdate.status}' no puede ser actualizada.`
            });
        }

        // --- Lógica de Actualización de Stock ---
        const oldQuantities = orderToUpdate.products.reduce((map, p) => { map[parseInt(p.productId)] = p.quantity; return map; }, {});
        const allInvolvedProductIds = Array.from(new Set([...Object.keys(oldQuantities).map(Number), ...Object.keys(productQuantities).map(Number)]));
        const productsInDB = await Products.find({ id: { $in: allInvolvedProductIds } });
        const productsMap = productsInDB.reduce((acc, product) => { acc[product.id] = product; return acc; }, {});

        const bulkStockAdjustOps = [];
        stockAdjustmentOps = [];
        for (const productId of allInvolvedProductIds) {
            const productInDB = productsMap[productId];
            const oldQty = oldQuantities[productId] || 0;
            const newQty = productQuantities[productId] || 0;
            const netChange = oldQty - newQty;

            if (!productInDB && newQty > 0) {
                return res.status(404).json({
                    status: "error",
                    code: "NOT_FOUND",
                    msg: `Producto con ID ${productId} no encontrado en la base de datos.`
                });
            }
            if (!productInDB || netChange === 0) continue;

            if (netChange < 0 && productInDB.stock < Math.abs(netChange)) {
                return res.status(400).json({
                    status: "error",
                    code: "INSUFFICIENT_STOCK",
                    msg: `Stock insuficiente para el producto ${productId}. Stock actual: ${productInDB.stock}, se intentarían quitar ${Math.abs(netChange)} unidades adicionales.`
                });
            }

            const operation = {
                updateOne: {
                    filter: { id: productId, stock: { $gte: (netChange < 0 ? Math.abs(netChange) : 0) } },
                    update: { $inc: { stock: netChange } }
                }
            };
            bulkStockAdjustOps.push(operation);
            stockAdjustmentOps.push({ productId, netChange });
        }

        // --- Ejecutar Actualizaciones ---
        if (bulkStockAdjustOps.length > 0) {
            const bulkResult = await Products.bulkWrite(bulkStockAdjustOps);
            stockUpdateDetails.attempted = bulkStockAdjustOps.length;
            stockUpdateDetails.modified = bulkResult.modifiedCount;

            if (bulkResult.modifiedCount !== bulkStockAdjustOps.length) {
                stockUpdateDetails.status = "Conflicto";
                stockUpdateDetails.message = `Conflicto al ajustar stock: Se intentaron ${bulkStockAdjustOps.length} ajustes, pero solo ${bulkResult.modifiedCount} se completaron. Cambios revertidos.`;
                const revertOps = stockAdjustmentOps.map(op => ({
                    updateOne: { filter: { id: op.productId }, update: { $inc: { stock: -op.netChange } } }
                }));
                try {
                    await Products.bulkWrite(revertOps);
                    stockUpdateDetails.reversion = "Intento de reversión completa realizado.";
                } catch (revertError) {
                    stockUpdateDetails.reversion = `Error crítico al intentar reversión completa: ${revertError.message}`;
                    console.error("¡Error Crítico! Falló la reversión del stock en conflicto de updateOrder:", revertError);
                }
                return res.status(409).json({ // 409 Conflict
                    status: "error",
                    code: "STOCK_CONFLICT",
                    msg: stockUpdateDetails.message,
                    info: stockUpdateDetails
                });
            }
            stockAdjusted = true;
            stockUpdateDetails.status = "Éxito";
            stockUpdateDetails.message = `Stock ajustado para ${bulkResult.modifiedCount} productos.`;
        } else {
            stockUpdateDetails.status = "Sin cambios";
            stockUpdateDetails.message = "No se requirieron ajustes de stock.";
        }

        const finalProductsArray = Object.entries(productQuantities).map(([productId, quantity]) => ({ productId, quantity }));
        const filteredUpdates = {
            products: finalProductsArray,
            discountApplied,
            netTotal,
            totalWithTax,
            credit,
            lastUpdate: new Date()
        };
        if (comment !== undefined) { filteredUpdates.comment = comment; }

        const updatedOrderDoc = await Orders.findByIdAndUpdate(id, filteredUpdates, { new: true }).lean(); // Usar lean

        const updatedOrderResponse = {
            _id: updatedOrderDoc._id,
            customer: updatedOrderDoc.customer,
            products: updatedOrderDoc.products.map(p => ({ productId: p.productId, quantity: p.quantity })),
            discountApplied: updatedOrderDoc.discountApplied,
            netTotal: updatedOrderDoc.netTotal,
            totalWithTax: updatedOrderDoc.totalWithTax,
            status: updatedOrderDoc.status,
            comment: updatedOrderDoc.comment,
            credit: updatedOrderDoc.credit,
            registrationDate: updatedOrderDoc.registrationDate,
            lastUpdate: updatedOrderDoc.lastUpdate,
            seller: updatedOrderDoc.seller
        };

        return res.status(200).json({
            status: "success",
            code: "ORDER_UPDATED",
            msg: "Orden actualizada con éxito.",
            data: updatedOrderResponse,
            info: { stockUpdateDetails }
        });

    } catch (error) {
        console.error("Error en updateOrder:", error); // Log interno
        let errorResponse = {
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al actualizar la orden. Intente de nuevo más tarde.",
            info: {
                detail: error.message,
                reversionStatus: "No aplica o falló"
            }
        };

        if (error.name === 'CastError') {
            errorResponse.code = "INVALID_FORMAT";
            errorResponse.msg = `ID de orden inválido: ${req.params.id}.`;
            return res.status(400).json(errorResponse);
        }

        if (stockAdjusted && stockAdjustmentOps.length > 0) {
            errorResponse.info.reversionStatus = "Intentando revertir ajuste de stock...";
            const revertBulkOps = stockAdjustmentOps.map(op => ({
                updateOne: { filter: { id: op.productId }, update: { $inc: { stock: -op.netChange } } }
            }));
            try {
                const revertResult = await Products.bulkWrite(revertBulkOps);
                errorResponse.info.reversionStatus = `Reversión de ajuste de stock completada para ${revertResult.modifiedCount} productos.`;
            } catch (revertError) {
                errorResponse.info.reversionStatus = `¡Error Crítico! Falló la reversión del ajuste de stock: ${revertError.message}`;
                console.error("¡Error Crítico! Falló la reversión del stock en catch de updateOrder:", revertError);
            }
        } else if (stockUpdateDetails.status === "Conflicto") {
            errorResponse.info.reversionStatus = stockUpdateDetails.reversion || "Reversión manejada en conflicto de stock.";
        } else {
            errorResponse.info.reversionStatus = "No se requirió reversión de stock (fallo antes del ajuste o no hubo ajustes).";
        }

        return res.status(500).json(errorResponse);
    }
};

//* Actualizar el estado de una Orden
const updateStateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: "error",
                code: "INVALID_FORMAT",
                msg: `ID de orden inválido: ${id}.`
            });
        }

        if (!status) {
            return res.status(400).json({
                status: "error",
                code: "MISSING_FIELD",
                msg: "El campo 'status' es requerido para actualizar el estado."
            });
        }
        // Validar que el status sea uno de los permitidos por el enum del modelo
        const allowedStatus = Orders.schema.path('status').enumValues;
        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                status: "error",
                code: "INVALID_FORMAT",
                msg: `Estado inválido: '${status}'. Los estados permitidos son: ${allowedStatus.join(', ')}.`
            });
        }

        const orderExists = await Orders.findById(id).select('_id status seller customer products discountApplied netTotal totalWithTax comment registrationDate lastUpdate');
        if (!orderExists) {
            return res.status(404).json({
                status: "error",
                code: "NOT_FOUND",
                msg: `No se encontró la orden con el id ${id}.`
            });
        }

        // Solo permitir que el vendedor actualice sus propias órdenes
        if (
            req.SellerBDD &&
            req.SellerBDD.role === 'Seller' &&
            orderExists.seller.toString() !== req.SellerBDD._id.toString()
        ) {
            return res.status(403).json({
                status: "error",
                code: "FORBIDDEN",
                msg: "No tienes permisos para actualizar el estado de esta orden. Solo puedes modificar tus propias órdenes."
            });
        }

        // Lógica de negocio para cambios de estado (ejemplo)
        if (orderExists.status === "Enviado" && status === "Pendiente") {
            return res.status(400).json({
                status: "error",
                code: "INVALID_OPERATION",
                msg: "No se puede revertir una orden 'Enviado' a 'Pendiente'."
            });
        }
        if (orderExists.status === "Cancelado") {
            return res.status(400).json({
                status: "error",
                code: "INVALID_OPERATION",
                msg: "No se puede cambiar el estado de una orden 'Cancelado'."
            });
        }

        const updatedOrder = await Orders.findByIdAndUpdate(
            id,
            { status, lastUpdate: new Date() },
            { new: true }
        ).lean();

        const responseData = {
            _id: updatedOrder._id,
            customer: updatedOrder.customer,
            products: updatedOrder.products,
            discountApplied: updatedOrder.discountApplied,
            netTotal: updatedOrder.netTotal,
            totalWithTax: updatedOrder.totalWithTax,
            status: updatedOrder.status,
            comment: updatedOrder.comment,
            registrationDate: updatedOrder.registrationDate,
            lastUpdate: updatedOrder.lastUpdate,
            seller: updatedOrder.seller // Incluir seller si es relevante
        };

        return res.status(200).json({
            status: "success",
            code: "ORDER_STATUS_UPDATED",
            msg: `Estado de la orden actualizado a '${status}'.`,
            data: responseData
        });

    } catch (error) {
        console.error("Error en updateStateOrder:", error); // Log interno
        return res.status(500).json({
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al actualizar el estado de la orden. Intente de nuevo más tarde.",
            info: { detail: error.message }
        });
    }
};

//* Eliminar una orden (Cancelar y restaurar stock)
const deleteOrder = async (req, res) => {
    let stockRestored = false;
    let stockRestoreDetails = {};
    let orderCancelled = false; // Cambiamos la lógica a cancelar en lugar de eliminar

    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: "error",
                code: "INVALID_FORMAT",
                msg: `ID de orden inválido: ${id}.`
            });
        }

        const orderToCancel = await Orders.findById(id); // No usar lean aquí para poder usar .save() si es necesario

        if (!orderToCancel) {
            return res.status(404).json({
                status: "error",
                code: "NOT_FOUND",
                msg: `Orden con ID ${id} no encontrada.`
            });
        }

        // Solo permitir cancelar órdenes pendientes
        if (orderToCancel.status !== "Pendiente") {
            return res.status(400).json({
                status: "error",
                code: "INVALID_OPERATION",
                msg: `Solo se pueden cancelar órdenes con estado 'Pendiente'. Estado actual: '${orderToCancel.status}'.`
            });
        }

        // --- Preparar Restauración de Stock ---
        const bulkStockRestoreOps = [];
        const productIdsToFind = orderToCancel.products.map(p => parseInt(p.productId));
        let productsMap = {};
        if (productIdsToFind.length > 0) {
            const productsInDB = await Products.find({ id: { $in: productIdsToFind } }).lean();
            productsMap = productsInDB.reduce((map, product) => { map[product.id] = product; return map; }, {});
        }

        let productsNotFound = [];
        for (const product of orderToCancel.products) {
            const productId = parseInt(product.productId);
            const productInDB = productsMap[productId];
            if (productInDB) {
                bulkStockRestoreOps.push({
                    updateOne: { filter: { id: productId }, update: { $inc: { stock: product.quantity } } }
                });
            } else {
                productsNotFound.push(productId);
                console.warn(`Advertencia al cancelar orden ${id}: Producto con ID ${productId} no encontrado. No se restaurará su stock.`);
            }
        }
        stockRestoreDetails.productsNotFound = productsNotFound;

        // --- Ejecutar Operaciones ---
        if (bulkStockRestoreOps.length > 0) {
            stockRestoreDetails.attempted = bulkStockRestoreOps.length;
            try {
                const bulkResult = await Products.bulkWrite(bulkStockRestoreOps);
                stockRestoreDetails.modified = bulkResult.modifiedCount;
                stockRestoreDetails.status = "Éxito";
                stockRestoreDetails.message = `Intento de restauración de stock para ${stockRestoreDetails.attempted} tipos de producto completado. Modificados: ${stockRestoreDetails.modified}.`;
                stockRestored = true;
            } catch (stockError) {
                stockRestoreDetails.status = "Error";
                stockRestoreDetails.message = `Error al restaurar stock: ${stockError.message}`;
                stockRestored = false;
                // Lanzar error para detener la cancelación
                throw new Error(`Fallo al restaurar stock: ${stockError.message}`);
            }
        } else {
            stockRestoreDetails.status = "No requerido";
            stockRestoreDetails.message = "No se requirió restauración de stock.";
            stockRestored = true; // No había nada que hacer, se considera éxito para proceder
        }

        // Cambiar estado a 'Cancelado' en lugar de eliminar
        orderToCancel.status = "Cancelado";
        orderToCancel.lastUpdate = new Date();
        await orderToCancel.save();
        orderCancelled = true;

        return res.status(200).json({
            status: "success",
            code: "ORDER_CANCELLED",
            msg: "Orden cancelada con éxito y stock restaurado (si aplica).",
            data: { // Devolver la orden cancelada
                _id: orderToCancel._id,
                status: orderToCancel.status,
                lastUpdate: orderToCancel.lastUpdate
            },
            info: { stockRestoreDetails }
        });

    } catch (error) {
        console.error('Error en deleteOrder (cancelar):', error); // Log interno
        let errorResponse = {
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al cancelar la orden. Intente de nuevo más tarde.",
            info: {
                detail: error.message,
                orderCancelled: orderCancelled,
                stockRestoreStatus: stockRestoreDetails.status || "No intentado",
                stockRestoreMessage: stockRestoreDetails.message || "No aplica"
            }
        };

        if (error.name === 'CastError') {
            errorResponse.code = "INVALID_FORMAT";
            errorResponse.msg = `ID de orden inválido: ${req.params.id}.`;
            return res.status(400).json(errorResponse);
        }
        // Si el error fue por fallo en restauración de stock, ya se lanzó antes
        if (error.message.startsWith('Fallo al restaurar stock')) {
            errorResponse.code = "STOCK_RESTORATION_FAILED";
            errorResponse.msg = "Error crítico al intentar restaurar el stock. La orden no fue cancelada.";
        }

        return res.status(500).json(errorResponse);
    }
};


//* Ver todas las órdenes (con detalles relacionados)
const SeeAllOrders = async (req, res) => {
    try {
        let filter = {};
        // Si es vendedor, solo puede ver sus propias órdenes
        if (req.SellerBDD && req.SellerBDD.role === 'Seller') {
            filter.seller = req.SellerBDD._id;
        }
        const orders = await Orders.find(filter)
            .sort({ registrationDate: -1 })
            .lean(); // Usar lean para mejor rendimiento

        if (orders.length === 0) {
            return res.status(200).json({
                status: "success",
                code: "NO_ORDERS_FOUND",
                msg: "No se encontraron órdenes registradas.",
                data: []
            });
        }

        const customerRUCs = [...new Set(orders.map(order => order.customer))];
        const sellerIds = [...new Set(orders.map(order => order.seller))];
        const productIds = [...new Set(orders.flatMap(order => order.products.map(product => parseInt(product.productId))))];

        const [clients, sellers, products] = await Promise.all([
            Clients.find({ Ruc: { $in: customerRUCs } }).select("Name Ruc Address telephone email credit state ComercialName").lean(),
            Sellers.find({ _id: { $in: sellerIds } }).select("names lastNames numberID email SalesCity PhoneNumber").lean(),
            Products.find({ id: { $in: productIds } }).select("id product_name reference description price").lean()
        ]);

        const clientMap = clients.reduce((map, client) => { map[client.Ruc] = client; return map; }, {});
        const sellerMap = sellers.reduce((map, seller) => { map[seller._id.toString()] = seller; return map; }, {});
        const productMap = products.reduce((map, product) => { map[product.id] = product; return map; }, {});

        const formattedOrders = orders.map(order => ({
            ...order, // Incluir todos los campos de la orden
            customer: clientMap[order.customer] || { Ruc: order.customer, Name: "Cliente no encontrado" }, // Proveer fallback
            seller: sellerMap[order.seller.toString()] || { _id: order.seller, names: "Vendedor no encontrado" }, // Proveer fallback
            products: order.products.map(p => {
                const productIdNum = parseInt(p.productId);
                return {
                    productId: p.productId,
                    quantity: p.quantity,
                    productDetails: productMap[productIdNum] || { id: productIdNum, product_name: "Producto no encontrado" } // Proveer fallback
                };
            })
        }));

        return res.status(200).json({
            status: "success",
            code: "ORDERS_FETCHED",
            msg: "Órdenes obtenidas correctamente.",
            data: formattedOrders
        });

    } catch (error) {
        console.error("Error en SeeAllOrders:", error); // Log interno
        return res.status(500).json({
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al obtener las órdenes. Intente de nuevo más tarde.",
            info: { detail: error.message }
        });
    }
};

//* Ver una orden por ID (con detalles relacionados)
const SeeOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: "error",
                code: "INVALID_FORMAT",
                msg: `ID de orden inválido: ${id}.`
            });
        }

        const order = await Orders.findById(id).lean();

        if (!order) {
            return res.status(404).json({
                status: "error",
                code: "NOT_FOUND",
                msg: `Orden con ID ${id} no encontrada.`
            });
        }

        // Solo permitir ver la orden si es admin o el vendedor dueño
        if (
            req.SellerBDD &&
            req.SellerBDD.role === 'Seller' &&
            order.seller.toString() !== req.SellerBDD._id.toString()
        ) {
            return res.status(403).json({
                status: "error",
                code: "FORBIDDEN",
                msg: "No tienes ordenes para ver. Solo puedes ver tus propias órdenes."
            });
        }

        const customerRuc = order.customer;
        const sellerId = order.seller;
        const productIds = order.products.map(product => parseInt(product.productId));

        const [clientDetails, sellerDetails, productsDetails] = await Promise.all([
            Clients.findOne({ Ruc: customerRuc }).select("Name Ruc Address telephone email credit state ComercialName").lean(),
            Sellers.findById(sellerId).select("names lastNames numberID email SalesCity PhoneNumber").lean(),
            Products.find({ id: { $in: productIds } }).select("id product_name reference description price").lean()
        ]);

        const productMap = productsDetails ? productsDetails.reduce((map, product) => { map[product.id] = product; return map; }, {}) : {};

        const formattedOrder = {
            ...order, // Incluir todos los campos de la orden
            customer: clientDetails || { Ruc: order.customer, Name: "Cliente no encontrado" }, // Proveer fallback
            seller: sellerDetails || { _id: order.seller, names: "Vendedor no encontrado" }, // Proveer fallback
            products: order.products.map(p => {
                const productIdNum = parseInt(p.productId);
                return {
                    productId: p.productId,
                    quantity: p.quantity,
                    productDetails: productMap[productIdNum] || { id: productIdNum, product_name: "Producto no encontrado" } // Proveer fallback
                };
            })
        };

        return res.status(200).json({
            status: "success",
            code: "ORDER_DETAILS_FETCHED",
            msg: "Detalles de la orden obtenidos correctamente.",
            data: formattedOrder
        });

    } catch (error) {
        console.error("Error en SeeOrderById:", error); // Log interno
        let errorResponse = {
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al obtener los detalles de la orden. Intente de nuevo más tarde.",
            info: { detail: error.message }
        };
        if (error.name === 'CastError') { // Redundante por la validación inicial, pero seguro
            errorResponse.code = "INVALID_FORMAT";
            errorResponse.msg = `ID de orden inválido: ${req.params.id}.`;
            return res.status(400).json(errorResponse);
        }
        return res.status(500).json(errorResponse);
    }
};

export {
    createOrder,
    updateOrder,
    SeeAllOrders,
    SeeOrderById,
    updateStateOrder,
    deleteOrder // Ahora representa la cancelación
}
