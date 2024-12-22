import Orders from '../models/orders.js'
import Clients from '../models/clients.js'
import Products from '../models/products.js'
import Sellers from '../models/sellers.js'


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


export{
    createOrder,
}