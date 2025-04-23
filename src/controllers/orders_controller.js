import Orders from '../models/orders.js'
import Clients from '../models/clients.js'
import Sellers from '../models/sellers.js'
import Products from '../models/products.js'
import mongoose from 'mongoose'

//* Crear Ordenes
const createOrder = async (req, res) => {
    let stockUpdated = false; // Bandera para saber si el stock se modificó
    let updateOperations = []; // Guardar las operaciones por si hay que revertir
    let stockUpdateDetails = {}; // Para guardar detalles de la actualización de stock

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
            stockUpdateDetails.attempted = bulkWriteOps.length; // Operaciones intentadas
            stockUpdateDetails.modified = bulkResult.modifiedCount; // Operaciones exitosas

            // Verificar si todas las operaciones esperadas modificaron el stock
            if (bulkResult.modifiedCount !== bulkWriteOps.length) {
                stockUpdateDetails.status = "Conflicto";
                stockUpdateDetails.message = `Conflicto de stock: Se intentaron actualizar ${bulkWriteOps.length} productos, pero solo ${bulkResult.modifiedCount} se modificaron. Inténtalo de nuevo.`;
                // Intentar revertir lo que se pudo haber modificado 
                const revertPartialOps = updateOperations.slice(0, bulkResult.modifiedCount).map(op => ({ // Solo revertir las que potencialmente se modificaron
                    updateOne: {
                        filter: { id: op.productId },
                        update: { $inc: { stock: op.quantity } }
                    }
                }));
                if (revertPartialOps.length > 0) {
                    try {
                        await Products.bulkWrite(revertPartialOps);
                        stockUpdateDetails.reversion = "Intento de reversión parcial realizado.";
                    } catch (revertError) {
                        stockUpdateDetails.reversion = `Error crítico al intentar reversión parcial: ${revertError.message}`;
                    }
                }
                return res.status(409).json({
                    message: stockUpdateDetails.message,
                    details: stockUpdateDetails
                });
            }
            stockUpdated = true; // Marcar que el stock se actualizó correctamente
            stockUpdateDetails.status = "Éxito";
            stockUpdateDetails.message = `Stock actualizado para ${bulkResult.modifiedCount} productos.`;
        } else {
            // Esto no debería ocurrir si las validaciones iniciales son correctas,
            // pero se mantiene por seguridad.
            return res.status(400).json({ message: "No se prepararon operaciones de stock válidas." });
        }


        // 4. Crear la Orden (Solo si la actualización de stock fue exitosa)
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

        // Incluir detalles de la actualización de stock en la respuesta exitosa
        res.status(201).json({
            msg: "Orden creada con éxito y stock actualizado",
            savedOrder: savedOrderResponse,
            stockUpdateInfo: stockUpdateDetails // Añadir la información aquí
        });

    } catch (error) {
        let errorDetails = {
            message: "Error al registrar la orden",
            detail: error.message,
            reversionStatus: "No aplica o falló"
        };

        // Intentar revertir el stock si ya se había actualizado (error ocurrió DESPUÉS de actualizar stock)
        if (stockUpdated && updateOperations.length > 0) {
            errorDetails.reversionStatus = "Intentando revertir stock...";
            const revertBulkOps = updateOperations.map(op => ({
                updateOne: {
                    filter: { id: op.productId },
                    // Incrementar el stock para revertir la disminución
                    update: { $inc: { stock: op.quantity } }
                }
            }));
            try {
                const revertResult = await Products.bulkWrite(revertBulkOps);
                errorDetails.reversionStatus = `Reversión de stock completada para ${revertResult.modifiedCount} productos.`;
            } catch (revertError) {
                errorDetails.reversionStatus = `¡Error Crítico! Falló la reversión del stock: ${revertError.message}`;
                // Loggear este error crítico internamente es importante
                console.error("¡Error Crítico! Falló la reversión del stock:", revertError);
            }
        } else if (stockUpdateDetails.status === "Conflicto") {
            errorDetails.reversionStatus = stockUpdateDetails.reversion || "Reversión manejada en conflicto de stock.";

        } else {
            errorDetails.reversionStatus = "No se requirió reversión de stock (fallo antes de la actualización).";
        }
        // Enviar respuesta de error 500
        res.status(500).json(errorDetails);
    }
}

//* Actualizar Orden
const updateOrder = async (req, res) => {
    let stockAdjusted = false; // Bandera para saber si el stock se ajustó
    let stockAdjustmentOps = []; // Guardar las operaciones de ajuste de stock para posible reversión
    let stockUpdateDetails = {}; // Para guardar detalles del ajuste de stock

    try {
        const { id } = req.params;
        const { products: newProductsData, discountApplied, netTotal, totalWithTax, comment } = req.body;

        // --- Validaciones Iniciales ---
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID de orden inválido." });
        }
        if (!newProductsData || !Array.isArray(newProductsData) || discountApplied == null || netTotal == null || totalWithTax == null) {
            return res.status(400).json({ msg: "Campos requeridos: products (array), discountApplied, netTotal, totalWithTax." });
        }
        if (discountApplied < 0 || netTotal < 0 || totalWithTax < 0) {
            return res.status(400).json({ message: "Los valores numéricos (discountApplied, netTotal, totalWithTax) deben ser positivos." });
        }
        const productQuantities = {}; // Para validar y consolidar cantidades
        for (const product of newProductsData) {
            if (!product.productId || product.quantity == null || product.quantity <= 0) {
                return res.status(400).json({ msg: `Cada producto debe tener 'productId' y 'quantity' (mayor que 0). Error en: ${JSON.stringify(product)}` });
            }
            const pId = parseInt(product.productId);
            if (isNaN(pId)) {
                return res.status(400).json({ msg: `El productId '${product.productId}' no es un número válido.` });
            }
            productQuantities[pId] = (productQuantities[pId] || 0) + product.quantity;
        }

        // --- Obtener Orden Original ---
        const orderToUpdate = await Orders.findById(id);
        if (!orderToUpdate) {
            return res.status(404).json({ message: "Orden no encontrada" });
        }
        if (orderToUpdate.status !== "Pendiente") {
            return res.status(400).json({ message: "El pedido ya no se puede actualizar porque su estado no es 'Pendiente'" });
        }

        // --- Lógica de Actualización de Stock ---

        // 1. Crear mapas de cantidades antiguas y nuevas (usando las consolidadas)
        const oldQuantities = orderToUpdate.products.reduce((map, p) => {
            map[parseInt(p.productId)] = p.quantity;
            return map;
        }, {});
        // newQuantities ya está consolidado desde la validación

        // 2. Obtener todos los IDs de productos involucrados
        const allInvolvedProductIds = Array.from(new Set([
            ...Object.keys(oldQuantities).map(Number),
            ...Object.keys(productQuantities).map(Number) // Usar productQuantities
        ]));

        // 3. Obtener estado actual de productos desde BD
        const productsInDB = await Products.find({ id: { $in: allInvolvedProductIds } });
        const productsMap = productsInDB.reduce((acc, product) => {
            acc[product.id] = product;
            return acc;
        }, {});

        // 4. Calcular cambio neto y preparar operaciones bulk
        const bulkStockAdjustOps = [];
        stockAdjustmentOps = []; // Limpiar/inicializar

        for (const productId of allInvolvedProductIds) {
            const productInDB = productsMap[productId];
            const oldQty = oldQuantities[productId] || 0;
            const newQty = productQuantities[productId] || 0; // Usar productQuantities
            const netChange = oldQty - newQty; // Positivo = devolver stock, Negativo = quitar stock

            // Si se añade un producto que no existe en BD
            if (!productInDB && newQty > 0) {
                return res.status(404).json({ message: `Producto con ID ${productId} no encontrado en la base de datos.` });
            }
            // Si el producto solo estaba en la orden original y no en la BD, o si no hay cambio neto
            if (!productInDB || netChange === 0) continue;

            // Verificar si hay suficiente stock *después* del cambio neto
            // Si netChange es negativo (quitar stock), verificar si hay suficiente
            if (netChange < 0 && productInDB.stock < Math.abs(netChange)) {
                return res.status(400).json({
                    message: `Stock insuficiente para el producto ${productId}. Stock actual: ${productInDB.stock}, se intentarían quitar ${Math.abs(netChange)} unidades adicionales.`
                });
            }

            // Añadir operación al bulkWrite y guardar para posible reversión
            const operation = {
                updateOne: {
                    // Añadir condición de stock >= 0 para seguridad, aunque ya validamos antes
                    filter: { id: productId, stock: { $gte: (netChange < 0 ? Math.abs(netChange) : 0) } },
                    update: { $inc: { stock: netChange } }
                }
            };
            bulkStockAdjustOps.push(operation);
            stockAdjustmentOps.push({ productId, netChange }); // Guardar el cambio neto
        }

        // --- Ejecutar Actualizaciones ---

        // 5. Aplicar cambios de stock en la BD (si hay cambios)
        if (bulkStockAdjustOps.length > 0) {
            const bulkResult = await Products.bulkWrite(bulkStockAdjustOps);
            stockUpdateDetails.attempted = bulkStockAdjustOps.length;
            stockUpdateDetails.modified = bulkResult.modifiedCount;

            if (bulkResult.modifiedCount !== bulkStockAdjustOps.length) {
                stockUpdateDetails.status = "Conflicto";
                stockUpdateDetails.message = `Conflicto al ajustar stock: Se intentaron ${bulkStockAdjustOps.length} ajustes, pero solo ${bulkResult.modifiedCount} se completaron. Cambios revertidos.`;

                // Intentar revertir TODOS los ajustes intentados en esta operación
                const revertOps = stockAdjustmentOps.map(op => ({
                    updateOne: {
                        filter: { id: op.productId },
                        update: { $inc: { stock: -op.netChange } } // Revertir el cambio neto
                    }
                }));
                try {
                    await Products.bulkWrite(revertOps);
                    stockUpdateDetails.reversion = "Intento de reversión completa realizado.";
                } catch (revertError) {
                    stockUpdateDetails.reversion = `Error crítico al intentar reversión completa: ${revertError.message}`;
                    console.error("¡Error Crítico! Falló la reversión del stock en conflicto de updateOrder:", revertError);
                }
                return res.status(409).json({
                    message: stockUpdateDetails.message,
                    details: stockUpdateDetails
                });
            }
            stockAdjusted = true; // Marcar que el stock se ajustó correctamente
            stockUpdateDetails.status = "Éxito";
            stockUpdateDetails.message = `Stock ajustado para ${bulkResult.modifiedCount} productos.`;
        } else {
            stockUpdateDetails.status = "Sin cambios";
            stockUpdateDetails.message = "No se requirieron ajustes de stock.";
        }

        // 6. Preparar los datos para actualizar la orden
        const finalProductsArray = Object.entries(productQuantities).map(([productId, quantity]) => ({
            productId: productId, // Mantener como string o number según el modelo
            quantity: quantity
        }));

        const filteredUpdates = {
            products: finalProductsArray,
            discountApplied: discountApplied,
            netTotal: netTotal,
            totalWithTax: totalWithTax,
            lastUpdate: new Date()
        };
        if (comment !== undefined) { // Permitir actualizar a comentario vacío ""
            filteredUpdates.comment = comment;
        }

        // 7. Actualizar el documento de la orden
        const updatedOrderDoc = await Orders.findByIdAndUpdate(id, filteredUpdates, { new: true });

        // Formatear respuesta (similar a createOrder)
        const updatedOrderResponse = {
            _id: updatedOrderDoc._id,
            customer: updatedOrderDoc.customer,
            products: updatedOrderDoc.products.map(p => ({
                productId: p.productId,
                quantity: p.quantity
            })),
            discountApplied: updatedOrderDoc.discountApplied,
            netTotal: updatedOrderDoc.netTotal,
            totalWithTax: updatedOrderDoc.totalWithTax,
            status: updatedOrderDoc.status,
            comment: updatedOrderDoc.comment,
            registrationDate: updatedOrderDoc.registrationDate,
            lastUpdate: updatedOrderDoc.lastUpdate,
            seller: updatedOrderDoc.seller
        };


        res.status(200).json({
            msg: "Orden actualizada con éxito",
            updatedOrder: updatedOrderResponse,
            stockUpdateInfo: stockUpdateDetails // Incluir detalles del stock
        });

    } catch (error) {
        let errorDetails = {
            message: "Error al actualizar la orden",
            detail: error.message,
            reversionStatus: "No aplica o falló"
        };

        // Intentar revertir el stock si ya se había ajustado
        if (stockAdjusted && stockAdjustmentOps.length > 0) {
            errorDetails.reversionStatus = "Intentando revertir ajuste de stock...";
            const revertBulkOps = stockAdjustmentOps.map(op => ({
                updateOne: {
                    filter: { id: op.productId },
                    // Revertir el cambio neto aplicado
                    update: { $inc: { stock: -op.netChange } }
                }
            }));
            try {
                const revertResult = await Products.bulkWrite(revertBulkOps);
                errorDetails.reversionStatus = `Reversión de ajuste de stock completada para ${revertResult.modifiedCount} productos.`;
            } catch (revertError) {
                errorDetails.reversionStatus = `¡Error Crítico! Falló la reversión del ajuste de stock: ${revertError.message}`;
                console.error("¡Error Crítico! Falló la reversión del stock en catch de updateOrder:", revertError);
            }
        } else if (stockUpdateDetails.status === "Conflicto") {
            errorDetails.reversionStatus = stockUpdateDetails.reversion || "Reversión manejada en conflicto de stock.";
        }
        else {
            errorDetails.reversionStatus = "No se requirió reversión de stock (fallo antes del ajuste o no hubo ajustes).";
        }

        // Detectar errores específicos si es posible
        if (error.name === 'CastError') {
            errorDetails.message = "ID de orden inválido.";
            return res.status(400).json(errorDetails);
        }

        res.status(500).json(errorDetails);
    }
};

//* Actualizar el estado de una Orden
const updateStateOrder = async (req, res) => {
    let updateDetails = { // Objeto para detalles de la operación
        statusChange: false,
        stockAffected: false, // El cambio de estado por sí solo no afecta el stock aquí
        message: ""
    };

    try {
        //* Paso 1 - Tomar Datos del Request
        const { id } = req.params; // ID de la orden a actualizar
        const { status } = req.body; // Estado a actualizar

        //* Paso 2 - Validar Datos
        if (!mongoose.Types.ObjectId.isValid(id)) {
            // Usar 400 Bad Request para ID inválido,
            return res.status(400).json({
                msg: `ID de orden inválido: ${id}.`
            });
        }

        if (!status) {
            return res.status(400).json({
                msg: "El campo 'status' es requerido para actualizar el estado."
            });
        }
        // --- Lógica de Actualización ---

        // Buscar la orden para verificar si existe antes de intentar actualizar
        const orderExists = await Orders.findById(id).select('_id status'); // Solo traer campos necesarios
        if (!orderExists) {
            return res.status(404).json({
                msg: `No se encontró la orden con el id ${id}.`
            });
        }

        // Opcional: Añadir lógica para prevenir ciertos cambios de estado si es necesario
        // Ejemplo: No permitir cambiar de 'Enviado' a 'Pendiente'
        if (orderExists.status === "Enviado" && status === "Pendiente") 
            {return res.status(400).json({ msg: "No se puede revertir una orden completada a pendiente." })}

        // Actualizar el estado y la fecha de última modificación
        const updatedOrder = await Orders.findByIdAndUpdate(
            id,
            { status, lastUpdate: new Date() }, // Usar new Date() directamente
            { new: true } // Devuelve el documento actualizado
        ).lean(); // Obtener objeto plano

        updateDetails.statusChange = true;
        updateDetails.message = `Estado de la orden actualizado a '${status}'.`;

        // Aquí devolvemos la orden actualizada como en el código original.
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
        };


        // Responder con el registro actualizado y los detalles de la operación
        return res.status(200).json({
            msg: updateDetails.message,
            updatedOrder: responseData, // Cambiado de 'data' a 'updatedOrder' por consistencia
            updateInfo: updateDetails // Incluir detalles de la operación
        });

    } catch (error) {
        // No hay operaciones de stock que revertir en esta función específica
        let errorDetails = {
            message: "Error interno del servidor al actualizar el estado de la orden.",
            detail: error.message,
            reversionStatus: "No aplica (solo cambio de estado)" // Indicar que no hubo stock involucrado
        };

        // Loggear el error internamente
        console.error("Error en updateStateOrder:", error);

        // Devolver error 500
        return res.status(500).json(errorDetails);
    }
};

//* Eliminar una orden
const deleteOrder = async (req, res) => {
    let stockRestored = false; // Bandera para saber si el stock se intentó restaurar
    let stockRestoreDetails = {}; // Para guardar detalles de la restauración de stock
    let orderDeleted = false; // Bandera para saber si la orden se eliminó

    try {
        // Toma de datos desde la solicitud
        const { id } = req.params;

        // Validar ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID de orden inválido." });
        }

        // Verificar si la orden existe
        const orderToDelete = await Orders.findById(id).lean(); // Usar lean para obtener objeto plano

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

        // Solo buscar productos si la orden tiene productos
        let productsMap = {};
        if (productIdsToFind.length > 0) {
            const productsInDB = await Products.find({ id: { $in: productIdsToFind } }).lean();
            productsMap = productsInDB.reduce((map, product) => {
                map[product.id] = product;
                return map;
            }, {});
        }

        let productsNotFound = []; // Para registrar productos no encontrados
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
                // Registrar si un producto de la orden ya no existe
                productsNotFound.push(productId);
                // console.warn(`Advertencia: Producto con ID ${productId} de la orden ${id} no encontrado. No se restaurará su stock.`);
            }
        }
        stockRestoreDetails.productsNotFound = productsNotFound; // Guardar IDs no encontrados

        // --- Ejecutar Operaciones ---

        // 1. Restaurar el stock (si hay operaciones)
        if (bulkStockRestoreOps.length > 0) {
            stockRestoreDetails.attempted = bulkStockRestoreOps.length;
            try {
                const bulkResult = await Products.bulkWrite(bulkStockRestoreOps);
                stockRestoreDetails.modified = bulkResult.modifiedCount; // Guardar cuántos se modificaron realmente
                // No se considera conflicto aquí
                stockRestoreDetails.status = "Éxito";
                stockRestoreDetails.message = `Intento de restauración de stock para ${stockRestoreDetails.attempted} tipos de producto completado. Modificados: ${stockRestoreDetails.modified}.`;
                stockRestored = true; // Marcar que se intentó y (al menos parcialmente) completó
            } catch (stockError) {
                // Error durante la restauración de stock
                stockRestoreDetails.status = "Error";
                stockRestoreDetails.message = `Error al restaurar stock: ${stockError.message}`;
                stockRestored = false; // Marcar que falló
                // Lanzar el error para que lo capture el catch principal y detenga la eliminación de la orden
                throw new Error(`Fallo al restaurar stock: ${stockError.message}`);
            }
        } else {
            stockRestoreDetails.status = "No requerido";
            stockRestoreDetails.message = "No se requirió restauración de stock (orden sin productos válidos encontrados).";
            stockRestored = true; // Considerar como 'éxito' en el sentido de que no había nada que hacer
        }

        // 2. Eliminar la orden de la base de datos (Solo si la restauración de stock fue exitosa o no requerida)
        await Orders.findByIdAndDelete(id);
        orderDeleted = true; // Marcar que la orden se eliminó

        res.status(200).json({
            msg: "Orden eliminada con éxito y stock reestablecido (si aplica)",
            deletionInfo: {
                orderDeleted: true,
                stockRestoreDetails: stockRestoreDetails
            }
        });

    } catch (error) {
        // Loggear el error internamente
        console.error('Error en deleteOrder:', error);

        let errorDetails = {
            message: "Error al eliminar la orden",
            detail: error.message,
            orderDeleted: orderDeleted, // Indicar si la orden llegó a eliminarse
            stockRestoreStatus: stockRestoreDetails.status || "No intentado", // Estado de la restauración
            stockRestoreMessage: stockRestoreDetails.message || "No aplica"
        };

        // Si el error fue específicamente por ID inválido (aunque ya validado arriba)
        if (error.name === 'CastError') {
            errorDetails.message = "ID de orden inválido.";
            return res.status(400).json(errorDetails);
        }
        res.status(500).json(errorDetails);
    }
};

//* Ver todas las órdenes (con paginación y detalles relacionados)
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

//* Ver una orden por ID (con detalles relacionados)
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
            registrationDate: order.registrationDate,
            lastUpdate: order.lastUpdate
        };


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
