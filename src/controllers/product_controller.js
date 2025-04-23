import { deleteImage } from '../helpers/claudinary.js';
import Products from '../models/products.js';

//* Crear Producto
const CreateProduct = async (req, res) => {
    let creationDetails = { // Objeto para detalles de la operación
        status: "Iniciado",
        message: "Iniciando creación de producto.",
        productCreated: false,
        imageHandled: false, // Indica si se procesó una imagen (subida o intento fallido)
        imageAction: "Ninguna" // 'Subida', 'Eliminada (Duplicado)', 'Eliminada (Error)'
    };

    try {
        //* Tomar los datos del body
        const { id, product_name, measure, price, stock } = req.body;

        // --- Validaciones ---
        if (!id || !product_name || !measure || price == null || stock == null) {
            creationDetails.status = "Error de Validación";
            creationDetails.message = "Campos requeridos: id, product_name, measure, price, stock.";
            return res.status(400).json({ message: creationDetails.message, creationInfo: creationDetails });
        }
        if (isNaN(id) || isNaN(price) || isNaN(stock)) {
            creationDetails.status = "Error de Validación";
            creationDetails.message = "Los campos id, price y stock deben ser numéricos.";
            return res.status(400).json({ message: creationDetails.message, creationInfo: creationDetails });
        }
        if (price < 0 || stock < 0) {
            creationDetails.status = "Error de Validación";
            creationDetails.message = "Los campos price y stock no pueden ser negativos.";
            return res.status(400).json({ message: creationDetails.message, creationInfo: creationDetails });
        }


        //* Validar si el producto ya existe por ID
        const verifyProduct = await Products.findOne({ id: id });
        if (verifyProduct) {
            creationDetails.status = "Conflicto";
            creationDetails.message = `El producto con ID ${id} ya existe.`;
            // Si se subió una imagen pero el producto ya existe, eliminarla de Cloudinary
            if (req.imageUrl) {
                creationDetails.imageHandled = true;
                try {
                    await deleteImage(req.imageUrl);
                    creationDetails.imageAction = "Eliminada (Duplicado)";
                    console.log('Imagen eliminada de Cloudinary (producto duplicado)');
                } catch (cloudinaryError) {
                    creationDetails.imageAction = "Error al eliminar (Duplicado)";
                    console.error('Error al eliminar la imagen de Cloudinary:', cloudinaryError);
                    // No detenemos el flujo, pero registramos el fallo en la eliminación
                    creationDetails.message += " Error al intentar eliminar la imagen subida.";
                }
            }
            return res.status(409).json({ // Cambiado a 409 Conflict
                message: creationDetails.message,
                creationInfo: creationDetails
            });
        }

        creationDetails.message = "Validaciones completadas. Creando producto...";

        //* Crear el producto
        const productData = {
            id,
            product_name,
            measure,
            price,
            stock,
            imgUrl: req.imageUrl || '' // Asignar URL si existe
        };

        if (req.imageUrl) {
            creationDetails.imageHandled = true;
            creationDetails.imageAction = "Subida";
        }

        const newProduct = new Products(productData);
        const savedProduct = await newProduct.save();
        creationDetails.productCreated = true;
        creationDetails.status = "Completado";
        creationDetails.message = "Producto creado correctamente.";

        // Formatear respuesta (opcional, si quieres excluir _id, __v)
        const responseProduct = {
            id: savedProduct.id,
            product_name: savedProduct.product_name,
            measure: savedProduct.measure,
            price: savedProduct.price,
            stock: savedProduct.stock,
            imgUrl: savedProduct.imgUrl
        };

        res.status(201).json({
            message: creationDetails.message,
            product: responseProduct,
            creationInfo: creationDetails // Incluir detalles de la creación
        });

    } catch (error) {
        creationDetails.status = "Error Interno";
        creationDetails.message = "Error al crear el producto.";
        creationDetails.detail = error.message;

        // Si ocurre algún error DESPUÉS de subir una imagen, intentar eliminarla
        if (req.imageUrl) {
            creationDetails.imageHandled = true; // Se intentó manejar una imagen
            try {
                await deleteImage(req.imageUrl);
                creationDetails.imageAction = "Eliminada (Error Creación)";
                //console.log('Imagen eliminada de Cloudinary (error en crear producto)');
            } catch (cloudinaryError) {
                creationDetails.imageAction = "Error al eliminar (Error Creación)";
                //console.error('Error al eliminar la imagen de Cloudinary tras error:', cloudinaryError);
                creationDetails.message += " Error adicional al intentar eliminar la imagen subida.";
            }
        }
        console.error("Error en CreateProduct:", error); // Loggear el error completo
        res.status(500).json({
            message: creationDetails.message,
            error: creationDetails.detail,
            creationInfo: creationDetails // Incluir detalles incluso en error
        });
    }
}

//* Obtener todos los productos
const getAllProducts = async (req, res) => {
    try {
        const productsBDD = await Products.find().select("-_id")
        res.status(200).json(productsBDD);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los productos", error: error.message })
    }
}

//* Obtener producto por ID
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
        res.status(500).json({ message: "Error al obtener el producto", error: error.message })
    }
}

//* Actualizar producto
const updatedProduct = async (req, res) => {
    let updateDetails = { // Objeto para detalles de la operación
        status: "Iniciado",
        message: "Iniciando actualización de producto.",
        productFound: false,
        fieldsUpdated: [], // Campos que se intentaron actualizar
        imageAction: "Ninguna", // 'Reemplazada', 'Añadida', 'Eliminada (Error)', 'Error al eliminar anterior'
        oldImageDeleted: false,
        newImageUploaded: false, // Indica si se proporcionó una nueva imagen en la solicitud
        newImageDeletedOnError: false
    };
    let oldImageUrl = null; // Para guardar la URL de la imagen anterior
    let newImageUrl = req.imageUrl || null; // Guardar la nueva URL si existe

    try {
        const { id } = req.params;

        // Validación del ID (aunque ya se hace en getProductsById, es bueno tenerla aquí también)
        if (isNaN(id)) {
            updateDetails.status = "Error de Validación";
            updateDetails.message = "El ID debe ser un número válido.";
            return res.status(400).json({ message: updateDetails.message, updateInfo: updateDetails });
        }

        const productExists = await Products.findOne({ id: id });
        if (!productExists) {
            updateDetails.status = "No Encontrado";
            updateDetails.message = "Producto no encontrado.";
            // Si se subió una imagen para un producto que no existe, eliminarla
            if (newImageUrl) {
                updateDetails.newImageUploaded = true;
                try {
                    await deleteImage(newImageUrl);
                    updateDetails.imageAction = "Eliminada (Producto No Encontrado)";
                    updateDetails.newImageDeletedOnError = true; // Se eliminó por error
                } catch (cloudinaryError) {
                    updateDetails.imageAction = "Error al eliminar (Producto No Encontrado)";
                    console.error('Error al eliminar imagen subida para producto no encontrado:', cloudinaryError);
                    updateDetails.message += " Error adicional al intentar eliminar la imagen subida.";
                }
            }
            return res.status(404).json({ message: updateDetails.message, updateInfo: updateDetails });
        }
        updateDetails.productFound = true;
        oldImageUrl = productExists.imgUrl; // Guardar URL anterior

        // Campos que se pueden actualizar
        const { product_name, measure, price, stock } = req.body;
        const updateData = {};
        updateDetails.fieldsUpdated = []; // Reiniciar por si acaso

        // Validaciones de datos de entrada (opcional pero recomendado)
        if (price !== undefined && (isNaN(price) || price < 0)) {
            updateDetails.status = "Error de Validación";
            updateDetails.message = "El campo price debe ser un número no negativo.";
            // Considerar eliminar newImageUrl si falla la validación aquí también
            return res.status(400).json({ message: updateDetails.message, updateInfo: updateDetails });
        }
        if (stock !== undefined && (isNaN(stock) || stock < 0)) {
            updateDetails.status = "Error de Validación";
            updateDetails.message = "El campo stock debe ser un número no negativo.";
            // Considerar eliminar newImageUrl si falla la validación aquí también
            return res.status(400).json({ message: updateDetails.message, updateInfo: updateDetails });
        }


        if (product_name !== undefined) { updateData.product_name = product_name; updateDetails.fieldsUpdated.push('product_name'); }
        if (measure !== undefined) { updateData.measure = measure; updateDetails.fieldsUpdated.push('measure'); }
        if (price !== undefined) { updateData.price = price; updateDetails.fieldsUpdated.push('price'); }
        if (stock !== undefined) { updateData.stock = stock; updateDetails.fieldsUpdated.push('stock'); }

        updateDetails.message = "Datos validados. Procesando imagen si existe...";

        // Si hay una nueva imagen
        if (newImageUrl) {
            updateDetails.newImageUploaded = true;
            updateDetails.imageAction = "Añadida"; // Acción inicial
            // Si el producto ya tenía una imagen diferente, eliminarla de Cloudinary
            if (oldImageUrl && oldImageUrl !== '' && oldImageUrl !== newImageUrl) {
                try {
                    await deleteImage(oldImageUrl);
                    updateDetails.oldImageDeleted = true;
                    updateDetails.imageAction = "Reemplazada"; // Se reemplazó la anterior
                    console.log('Imagen anterior eliminada de Cloudinary');
                } catch (cloudinaryError) {
                    updateDetails.imageAction = "Error al eliminar anterior";
                    console.error('Error al eliminar la imagen anterior:', cloudinaryError);
                    // Continuar de todos modos, pero registrar el fallo
                    updateDetails.message += " No se pudo eliminar la imagen anterior.";
                }
            }
            updateData.imgUrl = newImageUrl;
            updateDetails.fieldsUpdated.push('imgUrl');
        }

        // Verificar si hay datos para actualizar
        if (Object.keys(updateData).length === 0) {
            updateDetails.status = "Sin Cambios";
            updateDetails.message = "No se proporcionaron datos para actualizar.";
            // Si se subió una imagen pero no había otros datos, ¿debería guardarse?
            // Por ahora, asumimos que si solo se sube imagen, se actualiza.
            // Si no se subió imagen y no hay datos, retornar.
            if (!newImageUrl) {
                return res.status(200).json({ // 200 OK, pero sin cambios
                    message: updateDetails.message,
                    updateInfo: updateDetails
                });
            }
        }


        updateDetails.message = `Actualizando campos: ${updateDetails.fieldsUpdated.join(', ')}...`;

        // Ejecutar la actualización
        const updatedProductDoc = await Products.findOneAndUpdate({ id: id }, updateData, { new: true }).lean(); // Usar lean

        updateDetails.status = "Completado";
        updateDetails.message = "Producto actualizado correctamente.";

        // Formatear respuesta
        const responseProduct = {
            id: updatedProductDoc.id,
            product_name: updatedProductDoc.product_name,
            measure: updatedProductDoc.measure,
            price: updatedProductDoc.price,
            stock: updatedProductDoc.stock,
            imgUrl: updatedProductDoc.imgUrl
        };

        res.status(200).json({
            message: updateDetails.message,
            updatedProduct: responseProduct,
            updateInfo: updateDetails // Incluir detalles de la actualización
        });

    } catch (error) {
        updateDetails.status = "Error Interno";
        updateDetails.message = "Error al actualizar el producto.";
        updateDetails.detail = error.message;

        // Si ocurrió algún error DESPUÉS de subir una nueva imagen, intentar eliminarla
        if (newImageUrl) {
            updateDetails.newImageUploaded = true; // Se intentó manejar una nueva imagen
            try {
                await deleteImage(newImageUrl);
                updateDetails.imageAction = "Eliminada (Error Actualización)";
                updateDetails.newImageDeletedOnError = true;
                console.log('Imagen nueva eliminada de Cloudinary (error en actualizar)');
            } catch (cloudinaryError) {
                updateDetails.imageAction = "Error al eliminar (Error Actualización)";
                console.error('Error al eliminar la imagen nueva de Cloudinary tras error:', cloudinaryError);
                updateDetails.message += " Error adicional al intentar eliminar la imagen nueva subida.";
            }
        }
        console.error("Error en updatedProduct:", error); // Loggear el error completo
        res.status(500).json({
            message: updateDetails.message,
            error: updateDetails.detail,
            updateInfo: updateDetails // Incluir detalles incluso en error
        });
    }
}

//* Eliminar producto
//* Eliminar producto
const deleteProduct = async (req, res) => {
    let deletionDetails = { // Objeto para detalles de la operación
        status: "Iniciado",
        message: "Iniciando eliminación de producto.",
        productFound: false,
        productDeleted: false,
        imageAction: "Ninguna", // 'Eliminada', 'No Requerida', 'Error al eliminar'
        imageDeleted: false
    };
    let imageUrlToDelete = null; // Para guardar la URL de la imagen a eliminar

    try {
        const { id } = req.params;

        // Validación del ID
        if (isNaN(id)) {
            deletionDetails.status = "Error de Validación";
            deletionDetails.message = "El ID debe ser un número válido.";
            return res.status(400).json({ message: deletionDetails.message, deletionInfo: deletionDetails });
        }

        const productExists = await Products.findOne({ id: id });
        if (!productExists) {
            deletionDetails.status = "No Encontrado";
            deletionDetails.message = "Producto no encontrado.";
            return res.status(404).json({ message: deletionDetails.message, deletionInfo: deletionDetails });
        }
        deletionDetails.productFound = true;
        imageUrlToDelete = productExists.imgUrl; // Guardar URL si existe

        deletionDetails.message = "Producto encontrado. Procesando eliminación de imagen si existe...";

        // Si el producto tiene una imagen, intentar eliminarla de Cloudinary
        if (imageUrlToDelete && imageUrlToDelete !== '') {
            deletionDetails.imageAction = "Intentando eliminar";
            try {
                await deleteImage(imageUrlToDelete);
                deletionDetails.imageAction = "Eliminada";
                deletionDetails.imageDeleted = true;
                //console.log('Imagen eliminada de Cloudinary');
            } catch (cloudinaryError) {
                deletionDetails.imageAction = "Error al eliminar";
                //console.error('Error al eliminar la imagen de Cloudinary:', cloudinaryError);
                // Continuamos con la eliminación del producto aunque falle la eliminación de la imagen
                deletionDetails.message += " No se pudo eliminar la imagen asociada de Cloudinary.";
            }
        } else {
            deletionDetails.imageAction = "No Requerida";
        }

        deletionDetails.message = "Eliminando producto de la base de datos...";

        // Eliminar el producto de la base de datos
        await Products.findOneAndDelete({ id: id });
        deletionDetails.productDeleted = true;
        deletionDetails.status = "Completado";
        deletionDetails.message = "Producto eliminado correctamente.";

        // Si la imagen no se pudo eliminar, el mensaje final lo refleja
        if (deletionDetails.imageAction === "Error al eliminar") {
            deletionDetails.message = "Producto eliminado de la base de datos, pero ocurrió un error al eliminar la imagen asociada de Cloudinary.";
        }


        res.status(200).json({
            message: deletionDetails.message,
            deletionInfo: deletionDetails // Incluir detalles de la eliminación
        });

    } catch (error) {
        deletionDetails.status = "Error Interno";
        deletionDetails.message = "Error al eliminar el producto.";
        deletionDetails.detail = error.message;

        // Loggear el error completo
        //console.error("Error en deleteProduct:", error);

        res.status(500).json({
            message: deletionDetails.message,
            error: deletionDetails.detail,
            deletionInfo: deletionDetails // Incluir detalles incluso en error
        });
    }
}



export {
    CreateProduct,
    getAllProducts,
    getProductsById,
    updatedProduct,
    deleteProduct
}
