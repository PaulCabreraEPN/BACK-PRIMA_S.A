# Ejemplos de Operaciones CRUD por Entidad

## Productos

### Listar Productos
```javascript
// products/list.js
const listProducts = async () => {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('http://localhost:3000/api/products', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const products = await response.json();
        
        // Ejemplo de manejo de datos
        products.forEach(product => {
            console.log(`${product.id}: ${product.product_name} - Stock: ${product.stock}`);
        });
        
        return products;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
}
```

### Buscar Producto
```javascript
// products/find.js
const findProduct = async (productId) => {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`http://localhost:3000/api/products/${productId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 404) {
            throw new Error('Producto no encontrado');
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const product = await response.json();
        return product;
    } catch (error) {
        console.error('Error finding product:', error);
        throw error;
    }
}
```

## Vendedores

### Crear Vendedor
```javascript
// sellers/create.js
const createSeller = async (sellerData) => {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sellerData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.msg || 'Error al crear vendedor');
        }
        
        return data;
    } catch (error) {
        console.error('Error creating seller:', error);
        throw error;
    }
}

// Ejemplo de uso
const newSeller = {
    names: "Juan Carlos",
    lastNames: "Pérez García",
    numberID: "1234567890",
    email: "juan.perez@prima-sa.com",
    SalesCity: "Quito",
    PhoneNumber: "0987654321",
    role: "Seller"
};

createSeller(newSeller)
    .then(result => console.log('Vendedor creado:', result))
    .catch(error => console.error('Error:', error));
```

### Actualizar Vendedor
```javascript
// sellers/update.js
const updateSeller = async (id, updateData) => {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`http://localhost:3000/api/updateSeller/${id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.msg || 'Error al actualizar vendedor');
        }
        
        return data;
    } catch (error) {
        console.error('Error updating seller:', error);
        throw error;
    }
}

// Ejemplo de uso
const updates = {
    email: "nuevo.email@prima-sa.com",
    PhoneNumber: "0987654321"
};

updateSeller('65f0e3b2c54a8c3b7c9d5678', updates)
    .then(result => console.log('Vendedor actualizado:', result))
    .catch(error => console.error('Error:', error));
```

### Eliminar Vendedor
```javascript
// sellers/delete.js
const deleteSeller = async (id) => {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`http://localhost:3000/api/deleteSellerinfo/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.msg || 'Error al eliminar vendedor');
        }
        
        return data;
    } catch (error) {
        console.error('Error deleting seller:', error);
        throw error;
    }
}
```

## Órdenes

### Crear Orden
```javascript
// orders/create.js
const createOrder = async (orderData) => {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('http://localhost:3000/api/orders/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.msg || 'Error al crear orden');
        }
        
        return data;
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
}

// Ejemplo de uso
const newOrder = {
    customer: 1234567890001,
    products: [
        {
            productId: "1001",
            quantity: 5
        }
    ],
    discountApplied: 10,
    netTotal: 100.50,
    totalWithTax: 112.56
};

createOrder(newOrder)
    .then(result => console.log('Orden creada:', result))
    .catch(error => console.error('Error:', error));
```

### Actualizar Estado de Orden
```javascript
// orders/updateStatus.js
const updateOrderStatus = async (orderId, newStatus) => {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`http://localhost:3000/api/orders/update/state/${orderId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.msg || 'Error al actualizar estado');
        }
        
        return data;
    } catch (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
}

// Ejemplo de uso
updateOrderStatus('65f0e3b2c54a8c3b7c9d1234', 'En proceso')
    .then(result => console.log('Estado actualizado:', result))
    .catch(error => console.error('Error:', error));
```

## Clientes

### Buscar Cliente por RUC
```javascript
// clients/find.js
const findClientByRuc = async (ruc) => {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`http://localhost:3000/api/clients/${ruc}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 404) {
            throw new Error('Cliente no encontrado');
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error finding client:', error);
        throw error;
    }
}

// Ejemplo de uso
findClientByRuc('1234567890001')
    .then(result => console.log('Cliente encontrado:', result))
    .catch(error => console.error('Error:', error));
```

### Listar Clientes
```javascript
// clients/list.js
const listClients = async () => {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('http://localhost:3000/api/clients', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const clients = await response.json();
        return clients;
    } catch (error) {
        console.error('Error listing clients:', error);
        throw error;
    }
}
```