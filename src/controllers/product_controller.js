import Products from '../models/products.js';

const getAllProducts = async (req, res) => {
    try {
        const productsBDD = await Products.find().select("-_id")
        res.status(200).json(productsBDD);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los productos", error: error.message })
    }
}

const getProductsById = async (req, res) => {
    const { id } = req.params;

    // Validación del ID
    if (isNaN(id)) {
        return res.status(400).json({ msg: "El ID debe ser un número válido" })
    }

    try {
        const productsBDD = await Products.findOne({ id: Number(id) }).select("-_id") // Convertir id a número
        if (!productsBDD) {
            return res.status(404).json({ msg: "Producto no encontrado" })
        }
        res.status(200).json(productsBDD)
    } catch (error) {
        console.error("Error al obtener el producto:", error)
        res.status(500).json({ message: "Error al obtener el producto", error: error.message })
    }
}

export {
    getAllProducts,
    getProductsById
}
