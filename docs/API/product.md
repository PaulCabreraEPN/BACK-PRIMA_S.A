# API de Productos

## Índice
- [Descripción General](#descripción-general)
- [Endpoints](#endpoints)
- [Modelo de Datos](#modelo-de-datos)
- [Ejemplos](#ejemplos)
- [Consideraciones](#consideraciones)

## Descripción General
El módulo de productos gestiona el catálogo de productos disponibles en el sistema. Incluye información sobre stock, precios y medidas.

## Endpoints

### Listar Productos
`GET /api/products`

Obtiene la lista completa de productos disponibles.

#### Headers Requeridos
```
Authorization: Bearer <token>
```

#### Respuesta Exitosa (200)
```json
[
    {
        "id": 1001,
        "product_name": "Cemento Holcim",
        "measure": "50kg",
        "price": 8.50,
        "stock": 100,
        "imgUrl": "https://ejemplo.com/cemento.jpg"
    }
]
```

### Obtener Producto por ID
`GET /api/products/:id`

Obtiene los detalles de un producto específico.

#### Headers Requeridos
```
Authorization: Bearer <token>
```

#### Parámetros URL
- `id`: ID numérico del producto

#### Respuesta Exitosa (200)
```json
{
    "id": 1001,
    "product_name": "Cemento Holcim",
    "measure": "50kg",
    "price": 8.50,
    "stock": 100,
    "imgUrl": "https://ejemplo.com/cemento.jpg"
}
```

#### Respuestas de Error
```json
// 400 - ID Inválido
{
    "msg": "El ID debe ser un número válido"
}

// 404 - No Encontrado
{
    "msg": "Producto no encontrado"
}
```

## Modelo de Datos

### Producto
```typescript
{
    id: number;           // ID único del producto
    product_name: string; // Nombre del producto
    measure: string;      // Unidad de medida
    price: number;        // Precio unitario (sin IVA)
    stock: number;        // Cantidad disponible
    imgUrl: string;      // URL de la imagen
}
```

### Unidades de Medida Disponibles
- `kg`: Kilogramos
- `g`: Gramos
- `l`: Litros
- `ml`: Mililitros
- `unidad`: Unidad individual
- `docena`: Conjunto de 12 unidades
- `m`: Metros
- `m²`: Metros cuadrados
- `m³`: Metros cúbicos
- `galón`: Galones

## Ejemplos

### Obtener Lista de Productos
```javascript
const getProducts = async () => {
    try {
        const response = await fetch('/api/products', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const products = await response.json();
        return products;
    } catch (error) {
        console.error('Error:', error);
    }
};
```

### Buscar Producto
```javascript
const getProductById = async (productId) => {
    try {
        const response = await fetch(`/api/products/${productId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const product = await response.json();
        return product;
    } catch (error) {
        console.error('Error:', error);
    }
};
```

## Consideraciones

### Control de Stock
- El stock se actualiza automáticamente al procesar órdenes
- No puede ser negativo
- Se recomienda implementar alertas cuando baje de cierto nivel

### Precios
- No incluyen IVA
- Deben ser mayores a 0
- Se almacenan con 2 decimales máximo

### Imágenes
- La URL debe ser válida y accesible
- Se recomienda usar CDN para almacenamiento
- Formatos soportados: JPG, PNG, WebP

### Rendimiento
- Los productos se cachean en el cliente por 5 minutos
- Se recomienda implementar paginación para grandes catálogos
- Las imágenes deben estar optimizadas