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

        res.status(200).json({
            status: "success",
            code: "COUNTS_RETRIEVED", // Código específico para conteos
            msg: "Conteo de entidades obtenido exitosamente.",
            data: {
                products: productsCount,
                orders: ordersCount,
                sellers: sellersCount,
                clients: clientsCount
            }
        });

    } catch (error) {
        console.error("Error en getAllCount:", error); // Log interno
        res.status(500).json({
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al obtener el conteo. Intente de nuevo más tarde."
        });
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

        // Paso 2: Ordenar los datos de ventas de menor a mayor
        topSellersData.sort((a, b) => a.totalSales - b.totalSales); // Ordenar por totalSales en orden ascendente

        // Paso 3: Obtener los IDs de los vendedores que aparecen en el top
        const sellerIds = topSellersData.map(order => order._id);

        // Paso 4: Consultar la base de datos para obtener los detalles completos de los vendedores
        const sellerDetails = await sellers.find({ _id: { $in: sellerIds } });

        // Paso 5: Crear un mapa de vendedores para acceso rápido
        const sellerMap = sellerDetails.reduce((map, seller) => {
            map[seller._id.toString()] = seller;
            return map;
        }, {});

        // Paso 6: Crear los dos arreglos de resultados
        const sellerNames = topSellersData.map(order => {
            const seller = sellerMap[order._id.toString()];
            return seller ? `${seller.names} ${seller.lastNames}` : "Vendedor no encontrado";
        });

        const salesCounts = topSellersData.map(order => order.totalSales);

        // Responder con los dos arreglos: nombres y ventas
        res.status(200).json({
            status: "success",
            code: "TOP_SELLERS_FOUND", // Código específico para top vendedores
            msg: "Top 5 de vendedores obtenido exitosamente.",
            data: {
                sellerNames,
                salesCounts
            }
        });

    } catch (error) {
        console.error("Error en GetTopSellers:", error); // Log interno
        res.status(500).json({
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al obtener el top de vendedores. Intente de nuevo más tarde."
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
                $sort: { totalSales: 1 } // Ordenar por total de ventas en orden ascendente
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
        res.status(200).json({
            status: "success",
            code: "SALES_BY_SELLER_RETRIEVED", // Código específico para ventas por vendedor
            msg: "Ventas totales por vendedor obtenidas exitosamente.",
            data: {
                names,
                totalSales
            }
         });

    } catch (error) {
        console.error("Error en GetSalesBySeller:", error); // Log interno
        res.status(500).json({
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al obtener las ventas por vendedor. Intente de nuevo más tarde."
        });
    }
};

const getWeeklySales = async (req, res) => {
    try {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Primer día de la semana (Domingo)
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (6 - today.getDay())); // Último día de la semana (Sábado)
        endOfWeek.setHours(23, 59, 59, 999);

        // Obtener órdenes de la semana actual
        const weeklyOrders = await orders.find({
            createdAt: { $gte: startOfWeek, $lte: endOfWeek }
        });

        // Inicializar arrays para los días de la semana y las ventas
        const weekDays = [];
        const salesByDay = [];

        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            const formattedDay = day.toISOString().split("T")[0];

            weekDays.push(formattedDay);
            salesByDay.push(0); // Inicializa en 0
        }

        // Contar las ventas por día
        weeklyOrders.forEach(order => {
            const orderDate = order.createdAt.toISOString().split("T")[0];
            const index = weekDays.indexOf(orderDate);
            if (index !== -1) {
                salesByDay[index] += 1; // Incrementa ventas en ese día
            }
        });

        res.status(200).json({
            status: "success",
            code: "WEEKLY_SALES_RETRIEVED", // Código específico para ventas semanales
            msg: "Ventas semanales obtenidas exitosamente.",
            data: {
                weekDays,
                salesByDay
            }
        });
    } catch (error) {
        console.error("Error en getWeeklySales:", error); // Log interno
        res.status(500).json({
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al obtener las ventas semanales. Intente de nuevo más tarde."
         });
    }
};



export {
    getAllCount,
    GetTopSellers,
    GetSalesBySeller,
    getWeeklySales

}