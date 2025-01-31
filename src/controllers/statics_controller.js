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

const GetTopSellers = async (req, res) => {
    try {
        // Paso 1: Obtener el top 5 de vendedores con más ventas mediante agregación
        const topSellersData = await orders.aggregate([
            {
                $group: {
                    _id: "$seller",  // Agrupar por ID de vendedor
                    totalSales: { $sum: 1 },  // Contar cuántas ventas realizó cada vendedor
                }
            },
            {
                $sort: { totalSales: -1 }  // Ordenar por el total de ventas en orden descendente
            },
            {
                $limit: 5  // Limitar a los 5 vendedores con más ventas
            }
        ]);

        // Paso 2: Obtener los IDs de los vendedores que aparecen en el top
        const sellerIds = topSellersData.map(order => order._id);

        // Paso 3: Consultar la base de datos para obtener los detalles completos de los vendedores
        const sellerDetails = await sellers.find({ _id: { $in: sellerIds } });

        // Paso 4: Crear un mapa de vendedores para acceso rápido
        const sellerMap = sellerDetails.reduce((map, seller) => {
            map[seller._id.toString()] = seller;
            return map;
        }, {});

        // Paso 5: Crear los dos arreglos de resultados
        const sellerNames = topSellersData.map(order => {
            const seller = sellerMap[order._id.toString()];
            return seller ? `${seller.names} ${seller.lastNames}` : "Vendedor no encontrado";
        });

        const salesCounts = topSellersData.map(order => order.totalSales);

        // Responder con los dos arreglos: nombres y ventas
        res.status(200).json({
            sellerNames,
            salesCounts
        });

    } catch (error) {
        console.error("Error en GetTopSellers: ", error);
        res.status(500).json({
            message: "Error al obtener el top de vendedores",
            error: error.message
        });
    }
};

const GetSalesBySeller = async (req, res) => {
    try {
        // Paso 1: Obtener las órdenes y agrupar por vendedor
        const salesBySeller = await orders.aggregate([
            {
                $group: {
                    _id: "$seller", // Agrupar por el ID del vendedor
                    totalSales: { $sum: "$totalWithTax" }, // Sumar el totalWithTax de cada pedido
                }
            },
            {
                $sort: { totalSales: -1 } // Ordenar por total de ventas en orden descendente
            }
        ]);

        // Paso 2: Obtener los IDs de los vendedores que aparecen en las órdenes
        const sellerIds = salesBySeller.map(order => order._id);

        // Paso 3: Consultar los detalles completos de los vendedores
        const sellersData = await sellers.find({ _id: { $in: sellerIds } });

        // Paso 4: Crear un mapa de vendedores para acceso rápido
        const sellerMap = sellersData.reduce((map, seller) => {
            map[seller._id.toString()] = seller.names; // Solo guardamos el nombre del vendedor
            return map;
        }, {});

        // Paso 5: Crear dos arreglos con los nombres de los vendedores y las ventas totales
        const names = salesBySeller.map(order => sellerMap[order._id.toString()] || "Desconocido");
        const totalSales = salesBySeller.map(order => order.totalSales);

        // Responder con los dos arreglos: nombres y totalSales
        res.status(200).json({ names, totalSales });

    } catch (error) {
        console.error("Error en GetSalesBySeller: ", error);
        res.status(500).json({
            message: "Error al obtener las ventas por vendedor",
            error: error.message
        });
    }
};





export {
    getAllCount,
    GetTopSellers,
    GetSalesBySeller

}