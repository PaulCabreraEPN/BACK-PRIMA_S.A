import clients from "../models/clients.js";
import orders from "../models/orders.js";
import products from "../models/products.js";
import sellers from "../models/sellers.js";

const getAllCount = async (req, res) => {
    try {
        // Usar countDocuments para obtener el número de registros
        const productsCount = await products.countDocuments();
        const ordersCount = await orders.countDocuments();
        const sellersCount = await sellers.countDocuments({ status: true });
        const clientsCount = await clients.countDocuments();

        res.status(200).json({ products: productsCount,
            orders: ordersCount,
            sellers: sellersCount,
            clients: clientsCount
         });

    } catch (error) {
        res.status(500).json({ message: "Error al obtener el conteo de productos", error: error.message });
    }
};

export {
    getAllCount
}