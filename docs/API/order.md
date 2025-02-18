# API de Órdenes

## Endpoints

### Crear Orden
```http
POST /api/orders/create
```

**Request Body:**
```json
{
    "customer": 1234567890001,
    "products": [
        {
            "productId": "1001",
            "quantity": 5
        }
    ],
    "discountApplied": 10,
    "netTotal": 100,
    "totalWithTax": 112
}
```

### Listar Órdenes
```http
GET /api/orders
```

**Query Parameters:**
- status: Estado de la orden
- startDate: Fecha inicial
- endDate: Fecha final
- page: Número de página
- limit: Límite por página

### Obtener Orden por ID
```http
GET /api/orders/:id
```

### Actualizar Estado
```http
PATCH /api/orders/update/state/:id
```

**Request Body:**
```json
{
    "status": "En proceso"
}
```

### Actualizar Orden
```http
PUT /api/orders/update/:id
```

### Eliminar Orden
```http
DELETE /api/orders/delete/:id
```

## Estados de Orden

- Pendiente
- En proceso
- Enviado
- Cancelado

## Validaciones

- Cliente existente
- Productos existentes
- Stock suficiente
- Descuento válido (0-100%)
- Totales correctos
- Estado válido

## Cálculos Automáticos

- Verificación de stock
- Cálculo de descuentos
- Cálculo de impuestos
- Actualización de inventario

## Respuestas de Error

- 400: Datos inválidos o stock insuficiente
- 401: No autorizado
- 404: Orden no encontrada
- 500: Error del servidor
