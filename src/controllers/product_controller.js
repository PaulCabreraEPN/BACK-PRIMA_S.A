import { deleteImage } from '../helpers/claudinary.js';
import Products from '../models/products.js';


const CreateProduct = async(req,res) => {
    try {
        //* Tomar los datos del body
        const {id, product_name, measure, price, stock} = req.body

        //* Validar datos
        const verifyProduct = await Products.findOne({id:id})
        if(verifyProduct){
            // Si se subió una imagen pero el producto ya existe, eliminarla de Cloudinary
            if(req.imageUrl) {
                try {
                    await deleteImage(req.imageUrl);
                    console.log('Imagen eliminada de Cloudinary (producto duplicado)');
                } catch (cloudinaryError) {
                    console.error('Error al eliminar la imagen de Cloudinary:', cloudinaryError);
                }
            }
            return res.status(400).json({message:"El producto ya existe"})
        }


        //* Crear el producto
        const product = {
            id,
            product_name,
            measure,
            price,
            stock,
            imgUrl:req.imageUrl || ''
        }

        const newProduct = new Products(product)
        await newProduct.save()
        res.status(201).json({message:"Producto creado correctamente",product})

    } catch (error) {
        // Si ocurre algún error y se subió una imagen, eliminarla
        if(req.imageUrl) {
            try {
                await deleteImage(req.imageUrl);
                console.log('Imagen eliminada de Cloudinary (error en crear producto)');
            } catch (cloudinaryError) {
                console.error('Error al eliminar la imagen de Cloudinary:', cloudinaryError);
            }
        }
        console.log(error)
        res.status(500).json({message:"Error al crear el producto"})
    }
}

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

const updatedProduct = async(req,res) => {
    try {
        const {id} = req.params

        const productExists = await Products.findOne({id:id})
        if(!productExists){
            return res.status(404).json({message:"Producto no encontrado"})
        }
        // Campos que se pueden actualizar
        const { product_name, measure, price, stock } = req.body;
        const updateData = {};

        if (product_name) updateData.product_name = product_name;
        if (measure) updateData.measure = measure;
        if (price) updateData.price = price;
        if (stock !== undefined) updateData.stock = stock;

         // Si hay una nueva imagen
        if (req.imageUrl) {
            // Si el producto ya tenía una imagen, eliminarla de Cloudinary
            if (productExists.imgUrl && productExists.imgUrl !== '') {
                try {
                    await deleteImage(productExists.imgUrl);
                    console.log('Imagen anterior eliminada de Cloudinary');
                } catch (cloudinaryError) {
                    console.error('Error al eliminar la imagen anterior:', cloudinaryError);
                }
            }
            updateData.imgUrl = req.imageUrl;
        }

        const updatedProduct = await Products.findOneAndUpdate({id:id},updateData,{new:true}).select("-_id")

        res.status(200).json({message:"Producto actualizado correctamente",updatedProduct})

    } catch (error) {
        // Si ocurrió algún error y se subió una nueva imagen, eliminarla
        if(req.imageUrl) {
            try {
                await deleteImage(req.imageUrl);
                console.log('Imagen eliminada de Cloudinary (error en actualizar)');
            } catch (cloudinaryError) {
                console.error('Error al eliminar la imagen de Cloudinary:', cloudinaryError);
            }
        }
        console.error(error)
        res.status(500).json({message:"Error al actualizar el producto",error:error.message})
    }
}


const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params

        const productExists = await Products.findOne({ id: id })
        if (!productExists) {
            return res.status(404).json({ message: "Producto no encontrado" })
        }

        // Si el producto tiene una imagen, eliminarla de Cloudinary
        if (productExists.imgUrl && productExists.imgUrl !== '') {
            try {
                await deleteImage(productExists.imgUrl);
                console.log('Imagen eliminada de Cloudinary');
            } catch (cloudinaryError) {
                console.error('Error al eliminar la imagen de Cloudinary:', cloudinaryError);
                // Continuamos con la eliminación del producto aunque falle la eliminación de la imagen
            }
        }

        await Products.findOneAndDelete({ id: id })
        res.status(200).json({ message: "Producto eliminado correctamente" })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al eliminar el producto", error: error.message })
    }
}



export {
    CreateProduct,
    getAllProducts,
    getProductsById,
    updatedProduct,
    deleteProduct
}
