# API de Vendedores

## Endpoints

### Listar Vendedores
```http
GET /api/sellers
```

**Headers requeridos:**
```
Authorization: Bearer <token>
```

**Response Success (200):**
```json
[
    {
        "_id": "65f0e3b2c54a8c3b7c9d5678",
        "names": "Juan Carlos",
        "lastNames": "Pérez García",
        "numberID": 1234567890,
        "email": "juan.perez@empresa.com",
        "username": "jperez2024",
        "PhoneNumber": 987654321,
        "SalesCity": "Quito",
        "role": "seller",
        "status": true
    }
]
```

### Registrar Vendedor
```http
POST /api/register
```

**Request Body:**
```json
{
    "names": "Juan Carlos",
    "lastNames": "Pérez García",
    "numberID": 1234567890,
    "email": "juan.perez@empresa.com",
    "SalesCity": "Quito",
    "PhoneNumber": 987654321,
    "role": "Seller"
}
```

### Buscar Vendedor por ID
```http
GET /api/sellers/:id
```

### Actualizar Vendedor
```http
PATCH /api/updateSeller/:id
```

**Request Body:**
```json
{
    "email": "nuevo.email@empresa.com",
    "PhoneNumber": 987654321,
    "SalesCity": "Guayaquil"
}
```

### Actualizar Vendedor Completo
```http
PUT /api/updateAllSellerinfo/:id
```

### Eliminar Vendedor
```http
DELETE /api/deleteSellerinfo/:id
```

## Validaciones

- Cédula ecuatoriana válida
- Email único y válido
- Teléfono ecuatoriano válido
- Nombres y apellidos completos
- Ciudad de venta válida

## Respuestas de Error

- 400: Datos inválidos
- 401: No autorizado
- 404: Vendedor no encontrado
- 409: Conflicto (email/cédula duplicada)
- 500: Error del servidor