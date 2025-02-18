# Ejemplos de Autenticación

## Índice
- [Ejemplos de Autenticación](#ejemplos-de-autenticación)
  - [Índice](#índice)
  - [Login de Administrador](#login-de-administrador)
    - [Usando Fetch](#usando-fetch)
    - [Usando Axios](#usando-axios)
  - [Login de Vendedor](#login-de-vendedor)
    - [Formulario Completo](#formulario-completo)
    - [HTML Correspondiente](#html-correspondiente)
  - [Registro de Vendedor](#registro-de-vendedor)
    - [Desde Panel de Administrador](#desde-panel-de-administrador)
  - [Recuperación de Contraseña](#recuperación-de-contraseña)
    - [Solicitud de Recuperación](#solicitud-de-recuperación)
    - [Cambio de Contraseña](#cambio-de-contraseña)
  - [Manejo de Tokens](#manejo-de-tokens)
    - [Clase de Gestión de Token](#clase-de-gestión-de-token)

## Login de Administrador

### Usando Fetch
```javascript
// adminLogin.js
const loginAdmin = async (username, password) => {
    try {
        const response = await fetch('http://localhost:3000/api/login-admin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.msg);
        }

        // Guardar token
        localStorage.setItem('token', data.tokenJWT);
        return data;
    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    }
};

// Uso
loginAdmin('admin2024', 'Admin123*')
    .then(data => console.log('Login exitoso:', data))
    .catch(error => console.error('Error en login:', error));
```

### Usando Axios
```javascript
// adminLoginAxios.js
import axios from 'axios';

const loginAdmin = async (username, password) => {
    try {
        const { data } = await axios.post('http://localhost:3000/api/login-admin', {
            username,
            password
        });

        localStorage.setItem('token', data.tokenJWT);
        return data;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data.msg);
        }
        throw error;
    }
};
```

## Login de Vendedor

### Formulario Completo
```javascript
// sellerLogin.js
const sellerLoginForm = document.getElementById('seller-login-form');

sellerLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.msg);
        }

        // Guardar token y redireccionar
        localStorage.setItem('token', data.tokenJWT);
        window.location.href = '/dashboard';
    } catch (error) {
        showError(error.message);
    }
});

const showError = (message) => {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
};
```

### HTML Correspondiente
```html
<!-- sellerLogin.html -->
<form id="seller-login-form">
    <div class="form-group">
        <label for="username">Usuario:</label>
        <input type="text" id="username" required>
    </div>
    
    <div class="form-group">
        <label for="password">Contraseña:</label>
        <input type="password" id="password" required>
    </div>
    
    <div id="error-message" style="display: none; color: red;"></div>
    
    <button type="submit">Iniciar Sesión</button>
</form>
```

## Registro de Vendedor

### Desde Panel de Administrador
```javascript
// registerSeller.js
const registerSeller = async (sellerData) => {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(sellerData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.msg);
        }

        return data;
    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    }
};

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

registerSeller(newSeller)
    .then(data => console.log('Vendedor registrado:', data))
    .catch(error => console.error('Error en registro:', error));
```

## Recuperación de Contraseña

### Solicitud de Recuperación
```javascript
// passwordRecovery.js
const requestPasswordRecovery = async (email) => {
    try {
        const response = await fetch('http://localhost:3000/api/recovery-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.msg);
        }

        return data;
    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    }
};
```

### Cambio de Contraseña
```javascript
// passwordReset.js
const resetPassword = async (token, newPassword, confirmPassword) => {
    try {
        const response = await fetch(`http://localhost:3000/api/recovery-password/${token}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                password: newPassword,
                confirmpassword: confirmPassword
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.msg);
        }

        return data;
    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    }
};
```

## Manejo de Tokens

### Clase de Gestión de Token
```javascript
// tokenManager.js
class TokenManager {
    static getToken() {
        return localStorage.getItem('token');
    }

    static setToken(token) {
        localStorage.setItem('token', token);
    }

    static removeToken() {
        localStorage.removeItem('token');
    }

    static isTokenValid() {
        const token = this.getToken();
        if (!token) return false;

        // Decodificar token (sin verificar firma)
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 > Date.now();
        } catch {
            return false;
        }
    }

    static async verifyToken() {
        try {
            const response = await fetch('http://localhost:3000/api/verify-token', {
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });

            if (!response.ok) {
                this.removeToken();
                return false;
            }

            return true;
        } catch {
            this.removeToken();
            return false;
        }
    }
}

// Uso
if (!TokenManager.isTokenValid()) {
    // Redireccionar a login
    window.location.href = '/login';
}
```