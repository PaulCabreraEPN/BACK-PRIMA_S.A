# API de Clientes

## Endpoints

### Listar Clientes
```http
GET /api/clients
```

**Headers requeridos:**
```
Authorization: Bearer <token>
```

**Response Success (200):**
```json
[
    {
        "Name": "Ferretería El Constructor",
        "Ruc": 1234567890001,
        "Address": "Av. Principal 123",
        "telephone": 987654321,
        "email": "contacto@ferreteria.com",
        "credit": "A",
        "state": "Activo"
    }
]
```

### Obtener Cliente por RUC
```http
GET /api/clients/:ruc
```

**Response Success (200):**
```json
{
    "data": {
        "_id": "65f0e3b2c54a8c3b7c9d1234",
        "Name": "Ferretería El Constructor",
        "Ruc": 1234567890001,
        "Address": "Av. Principal 123",
        "telephone": 987654321,
        "email": "contacto@ferreteria.com",
        "credit": "A",
        "state": "Activo"
    }
}
```

## Validaciones

- RUC válido ecuatoriano
- Email válido
- Teléfono válido
- Dirección no vacía
- Estado válido (Activo/Inactivo)
- Categoría de crédito válida (A/B/C)

## Campos

| Campo     | Tipo    | Descripción                    |
|-----------|---------|--------------------------------|
| Name      | String  | Nombre del cliente/empresa     |
| Ruc       | Number  | RUC (13 dígitos)              |
| Address   | String  | Dirección física              |
| telephone | Number  | Teléfono de contacto          |
| email     | String  | Correo electrónico            |
| credit    | String  | Categoría de crédito (A/B/C)  |
| state     | String  | Estado del cliente            |

## Respuestas de Error

- 400: RUC inválido
- 401: No autorizado
- 404: Cliente no encontrado
- 500: Error del servidor