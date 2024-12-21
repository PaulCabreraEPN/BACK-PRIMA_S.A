import Orders from '../models/orders.js'
import Clients from '../models/clients.js'
import Products from '../models/products.js'
import Sellers from '../models/sellers.js'


const createOrder= async(req,res)=>{
    try {
        //* Paso 1 -Tomar Datos del Request
        const { customer, seller, products, discountApplied, netTotal, totalWithTax } = req.body;
        //* Paso 2 - Validar Datos
        if (!customer || !seller || !products || !discountApplied || !netTotal || !totalWithTax) {
            return res.status(400).json({ message: "Todos los campos son requeridos" });
        }

        if (discountApplied < 0 || netTotal < 0 || totalWithTax < 0) {
            return res.status(400).json({ message: "Los valores numéricos deben ser positivos" });
        }

        const customerExists = await Clients.findOne({Ruc: customer});
        
        if (!customerExists) {
            return res.status(404).json({ message: "Cliente no encontrado" });
        }

        const sellerExists = await Sellers.findById(seller);
        if (!sellerExists) {
            return res.status(404).json({ message: "Vendedor no encontrado" });
        }

        for (let product of products) {
            const productExists = await Products.findOne({id:product});
            if (!productExists) {
                return res.status(404).json({ message: `Producto no encontrado: ${product}` });
            }
        }
        //* Paso 3 - Interactuar con BDD
        const newOrder = new Orders(req.body);

        newOrder.seller = req.SellerBDD._id;
        await newOrder.save()

        const savedOrder = await newOrder.save();
        res.status(201).json({msg:"Orden creada con éxito",savedOrder});
    } catch (error) {
        res.status(500).json({message:"Error al registrar la orden",error:error.message})
    }
}


export{
    createOrder,
}