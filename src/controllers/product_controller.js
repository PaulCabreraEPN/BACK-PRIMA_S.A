import { deleteImage } from '../helpers/claudinary.js';
import Products from '../models/products.js';

//* Crear Producto
const CreateProduct = async (req, res) => {
    let imageAction = "Ninguna"; // 'Subida', 'Eliminada (Duplicado)', 'Eliminada (Error)', 'Error al eliminar (Duplicado)', 'Error al eliminar (Error Creación)'
    let newImageUrl = req.imageUrl || null; // Guardar la URL si se subió una imagen

    try {
        //* Tomar los datos del body
        const { id, product_name, reference, price, stock,description } = req.body;

        // --- Validaciones ---
        if (!id || !product_name || !reference || price == null || stock == null || !description) {
            return res.status(400).json({
                status: "error",
                code: "MISSING_FIELD",
                msg: "Campos requeridos: id, product_name, reference, description, price, stock."
            });
        }
        if (isNaN(id) || isNaN(price) || isNaN(stock)) {
            return res.status(400).json({
                status: "error",
                code: "INVALID_FORMAT",
                msg: "Los campos id, price y stock deben ser numéricos."
            });
        }
        if (price < 0 || stock < 0) {
            return res.status(400).json({
                status: "error",
                code: "INVALID_FORMAT",
                msg: "Los campos price y stock no pueden ser negativos."
            });
        }

        //* Validar si el producto ya existe por ID
        const verifyProduct = await Products.findOne({ id: id });
        if (verifyProduct) {
            let info = { duplicateProductId: id };
            // Si se subió una imagen pero el producto ya existe, intentar eliminarla
            if (newImageUrl) {
                imageAction = "Intentando eliminar (Duplicado)";
                try {
                    await deleteImage(newImageUrl);
                    imageAction = "Eliminada (Duplicado)";
                    info.imageStatus = "Imagen duplicada eliminada de Cloudinary.";
                } catch (cloudinaryError) {
                    imageAction = "Error al eliminar (Duplicado)";
                    info.imageStatus = `Error al eliminar imagen duplicada de Cloudinary: ${cloudinaryError.message}`;
                    console.error(`Error al eliminar imagen duplicada ${newImageUrl}:`, cloudinaryError);
                }
            }
            return res.status(409).json({ // 409 Conflict
                status: "error",
                code: "RESOURCE_ALREADY_EXISTS",
                msg: `El producto con ID ${id} ya existe.`,
                info: info
            });
        }

        //* Crear el producto
        const productData = {
            id,
            product_name,
            reference,
            description,
            price,
            stock,
            imgUrl: newImageUrl || '' // Asignar URL si existe
        };

        if (newImageUrl) {
            imageAction = "Subida";
        }

        const newProduct = new Products(productData);
        const savedProduct = await newProduct.save();

        // Formatear respuesta
        const responseProduct = {
            id: savedProduct.id,
            product_name: savedProduct.product_name,
            reference: savedProduct.reference,
            description: savedProduct.description,
            price: savedProduct.price,
            stock: savedProduct.stock,
            imgUrl: savedProduct.imgUrl
        };

        return res.status(201).json({ // 201 Created
            status: "success",
            code: "PRODUCT_CREATED",
            msg: "Producto creado correctamente.",
            data: responseProduct,
            info: { imageAction: imageAction }
        });

    } catch (error) {
        console.error("Error en CreateProduct:", error); // Log interno
        let errorResponse = {
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al crear el producto. Intente de nuevo más tarde.",
            info: { detail: error.message, imageAction: imageAction }
        };

        // Si ocurre algún error DESPUÉS de subir una imagen, intentar eliminarla
        if (newImageUrl && imageAction === "Subida") { // Solo si se subió y el error fue después
            errorResponse.info.imageAction = "Intentando eliminar (Error Creación)";
            try {
                await deleteImage(newImageUrl);
                errorResponse.info.imageAction = "Eliminada (Error Creación)";
                errorResponse.info.imageStatus = "Imagen subida eliminada debido a error en creación.";
            } catch (cloudinaryError) {
                errorResponse.info.imageAction = "Error al eliminar (Error Creación)";
                errorResponse.info.imageStatus = `Error crítico: No se pudo eliminar la imagen ${newImageUrl} de Cloudinary tras error: ${cloudinaryError.message}`;
                console.error(`Error crítico al eliminar imagen ${newImageUrl} tras error en CreateProduct:`, cloudinaryError);
            }
        }
        return res.status(500).json(errorResponse);
    }
}

//* Obtener todos los productos con paginación
const getAllProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const totalProducts = await Products.countDocuments();
        const totalPages = Math.ceil(totalProducts / limit);

        if (totalProducts === 0) {
            return res.status(200).json({
                status: "success",
                code: "NO_PRODUCTS_FOUND",
                msg: "No se encontraron productos registrados.",
                data: [],
                info: { currentPage: 1, totalPages: 0, totalProducts: 0, limit }
            });
        }

        if (page > totalPages && totalProducts > 0) {
            return res.status(404).json({
                status: "error",
                code: "NOT_FOUND",
                msg: `Página no encontrada. Solo hay ${totalPages} páginas.`
            });
        }

        const productsBDD = await Products.find()
            .select("id product_name reference description price stock imgUrl -_id")
            .sort({ id: 1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return res.status(200).json({
            status: "success",
            code: "PRODUCTS_FETCHED",
            msg: `Productos obtenidos para la página ${page}.`,
            data: productsBDD,
            info: { currentPage: page, totalPages, totalProducts, limit }
        });
    } catch (error) {
        console.error("Error en getAllProducts:", error);
        return res.status(500).json({
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al obtener los productos. Intente de nuevo más tarde."
        });
    }
}

//* Obtener producto por ID
const getProductsById = async (req, res) => {
    const { id } = req.params;

    // Validación del ID
    if (isNaN(id)) {
        return res.status(400).json({
            status: "error",
            code: "INVALID_FORMAT",
            msg: "El ID del producto debe ser un número válido."
        });
    }

    try {
        const productBDD = await Products.findOne({ id: Number(id) }).select("id product_name reference description price stock imgUrl -_id"); // Convertir id a número
        if (!productBDD) {
            return res.status(404).json({
                status: "error",
                code: "NOT_FOUND",
                msg: `Producto con ID ${id} no encontrado.`
            });
        }
        return res.status(200).json({
            status: "success",
            code: "PRODUCT_FOUND",
            msg: "Producto encontrado.",
            data: productBDD
        });
    } catch (error) {
        console.error("Error en getProductsById:", error); // Log interno
        return res.status(500).json({
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al obtener el producto. Intente de nuevo más tarde."
        });
    }
}

//* Actualizar producto
const updatedProduct = async (req, res) => {
    let imageAction = "Ninguna"; // 'Reemplazada', 'Añadida', 'Eliminada (Error)', 'Error al eliminar anterior', 'Eliminada (Producto No Encontrado)', 'Error al eliminar (Producto No Encontrado)'
    let oldImageUrl = null;
    let newImageUrl = req.imageUrl || null; // Guardar la nueva URL si existe
    let updateInfo = {}; // Para detalles adicionales

    try {
        const { id } = req.params;

        // Validación del ID
        if (isNaN(id)) {
            return res.status(400).json({
                status: "error",
                code: "INVALID_FORMAT",
                msg: "El ID del producto debe ser un número válido."
            });
        }

        const productExists = await Products.findOne({ id: id });
        if (!productExists) {
            updateInfo.productStatus = "No encontrado";
            // Si se subió una imagen para un producto que no existe, eliminarla
            if (newImageUrl) {
                imageAction = "Intentando eliminar (Producto No Encontrado)";
                try {
                    await deleteImage(newImageUrl);
                    imageAction = "Eliminada (Producto No Encontrado)";
                    updateInfo.imageStatus = "Imagen subida eliminada porque el producto no existe.";
                } catch (cloudinaryError) {
                    imageAction = "Error al eliminar (Producto No Encontrado)";
                    updateInfo.imageStatus = `Error al eliminar imagen ${newImageUrl} subida para producto no encontrado: ${cloudinaryError.message}`;
                    console.error(`Error al eliminar imagen ${newImageUrl} para producto no encontrado ${id}:`, cloudinaryError);
                }
            }
            return res.status(404).json({
                status: "error",
                code: "NOT_FOUND",
                msg: `Producto con ID ${id} no encontrado.`,
                info: updateInfo
            });
        }
        oldImageUrl = productExists.imgUrl; // Guardar URL anterior

        // Campos que se pueden actualizar y validaciones
        const { product_name, reference,description, price, stock } = req.body;
        const updateData = {};
        const fieldsUpdated = [];

        if (price !== undefined) {
            if (isNaN(price) || price < 0) {
                return res.status(400).json({ status: "error", code: "INVALID_FORMAT", msg: "El campo price debe ser un número no negativo." });
            }
            updateData.price = price;
            fieldsUpdated.push('price');
        }
        if (stock !== undefined) {
            if (isNaN(stock) || stock < 0) {
                return res.status(400).json({ status: "error", code: "INVALID_FORMAT", msg: "El campo stock debe ser un número no negativo." });
            }
            updateData.stock = stock;
            fieldsUpdated.push('stock');
        }
        if (product_name !== undefined) { updateData.product_name = product_name; fieldsUpdated.push('product_name'); }
        if (reference !== undefined) { updateData.reference = reference; fieldsUpdated.push('reference'); }
        if (description !== undefined) { updateData.description = description; fieldsUpdated.push('description'); }

        // Procesar imagen si existe
        if (newImageUrl) {
            imageAction = "Añadida";
            // Si había una imagen anterior diferente, eliminarla
            if (oldImageUrl && oldImageUrl !== '' && oldImageUrl !== newImageUrl) {
                imageAction = "Intentando reemplazar";
                try {
                    await deleteImage(oldImageUrl);
                    imageAction = "Reemplazada";
                    updateInfo.oldImageStatus = "Imagen anterior eliminada.";
                } catch (cloudinaryError) {
                    imageAction = "Error al eliminar anterior";
                    updateInfo.oldImageStatus = `No se pudo eliminar la imagen anterior ${oldImageUrl}: ${cloudinaryError.message}`;
                    console.error(`Error al eliminar imagen anterior ${oldImageUrl} para producto ${id}:`, cloudinaryError);
                    // Continuar de todos modos
                }
            }
            updateData.imgUrl = newImageUrl;
            fieldsUpdated.push('imgUrl');
        }

        // Verificar si hay datos para actualizar
        if (Object.keys(updateData).length === 0) {
            return res.status(200).json({ // 200 OK, pero sin cambios efectivos
                status: "success", // O 'warning' si se prefiere indicar que no hubo cambios
                code: "NO_CHANGES_DETECTED",
                msg: "No se proporcionaron datos nuevos para actualizar.",
                info: { imageAction: imageAction, fieldsAttempted: fieldsUpdated }
            });
        }

        // Ejecutar la actualización
        const updatedProductDoc = await Products.findOneAndUpdate({ id: id }, updateData, { new: true }).select("id product_name reference description price stock imgUrl -_id").lean();

        updateInfo.fieldsUpdated = fieldsUpdated;
        updateInfo.imageAction = imageAction;

        return res.status(200).json({
            status: "success",
            code: "PRODUCT_UPDATED",
            msg: "Producto actualizado correctamente.",
            data: updatedProductDoc,
            info: updateInfo
        });

    } catch (error) {
        console.error("Error en updatedProduct:", error); // Log interno
        let errorResponse = {
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al actualizar el producto. Intente de nuevo más tarde.",
            info: { detail: error.message, imageAction: imageAction }
        };

        // Si ocurrió algún error DESPUÉS de subir una nueva imagen, intentar eliminarla
        if (newImageUrl && (imageAction === "Añadida" || imageAction === "Reemplazada" || imageAction === "Intentando reemplazar")) {
            errorResponse.info.imageAction = "Intentando eliminar (Error Actualización)";
            try {
                await deleteImage(newImageUrl);
                errorResponse.info.imageAction = "Eliminada (Error Actualización)";
                errorResponse.info.imageStatus = "Imagen nueva eliminada debido a error en actualización.";
            } catch (cloudinaryError) {
                errorResponse.info.imageAction = "Error al eliminar (Error Actualización)";
                errorResponse.info.imageStatus = `Error crítico: No se pudo eliminar la imagen nueva ${newImageUrl} de Cloudinary tras error: ${cloudinaryError.message}`;
                console.error(`Error crítico al eliminar imagen ${newImageUrl} tras error en updatedProduct:`, cloudinaryError);
            }
        }
        return res.status(500).json(errorResponse);
    }
}

//* Eliminar producto
const deleteProduct = async (req, res) => {
    let imageAction = "Ninguna"; // 'Eliminada', 'No Requerida', 'Error al eliminar'
    let imageUrlToDelete = null;
    let deletionInfo = {};

    try {
        const { id } = req.params;

        // Validación del ID
        if (isNaN(id)) {
            return res.status(400).json({
                status: "error",
                code: "INVALID_FORMAT",
                msg: "El ID del producto debe ser un número válido."
            });
        }

        const productExists = await Products.findOne({ id: id });
        if (!productExists) {
            return res.status(404).json({
                status: "error",
                code: "NOT_FOUND",
                msg: `Producto con ID ${id} no encontrado.`
            });
        }
        imageUrlToDelete = productExists.imgUrl; // Guardar URL si existe

        // Intentar eliminar la imagen de Cloudinary si existe
        if (imageUrlToDelete && imageUrlToDelete !== '') {
            imageAction = "Intentando eliminar";
            try {
                await deleteImage(imageUrlToDelete);
                imageAction = "Eliminada";
                deletionInfo.imageStatus = "Imagen asociada eliminada de Cloudinary.";
            } catch (cloudinaryError) {
                imageAction = "Error al eliminar";
                deletionInfo.imageStatus = `Error al eliminar imagen ${imageUrlToDelete} de Cloudinary: ${cloudinaryError.message}`;
                console.error(`Error al eliminar imagen ${imageUrlToDelete} para producto ${id}:`, cloudinaryError);
                // Continuamos con la eliminación del producto aunque falle la eliminación de la imagen
            }
        } else {
            imageAction = "No Requerida";
            deletionInfo.imageStatus = "No había imagen asociada para eliminar.";
        }

        // Eliminar el producto de la base de datos
        await Products.findOneAndDelete({ id: id });

        deletionInfo.imageAction = imageAction;

        // Determinar el estado final y mensaje
        let finalStatus = "success";
        let finalCode = "PRODUCT_DELETED";
        let finalMsg = "Producto eliminado correctamente.";
        let finalStatusCode = 200;

        if (imageAction === "Error al eliminar") {
            finalStatus = "warning"; // La operación principal (borrado DB) fue exitosa, pero la secundaria (borrado imagen) falló
            finalCode = "PRODUCT_DELETED_WITH_IMAGE_ERROR";
            finalMsg = "Producto eliminado de la base de datos, pero ocurrió un error al eliminar la imagen asociada de Cloudinary.";
            // Mantenemos 200 OK porque el recurso principal fue eliminado
        }

        return res.status(finalStatusCode).json({
            status: finalStatus,
            code: finalCode,
            msg: finalMsg,
            info: deletionInfo
        });

    } catch (error) {
        console.error("Error en deleteProduct:", error); // Log interno
        return res.status(500).json({
            status: "error",
            code: "SERVER_ERROR",
            msg: "Ha ocurrido un error inesperado al eliminar el producto. Intente de nuevo más tarde.",
            info: { detail: error.message, imageAction: imageAction }
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
