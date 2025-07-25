import testServer from '../src/utils/testServer.js'
import orders from '../src/routers/order_routes.js'
import admin from '../src/routers/admin_routes.js'
import { connectDB, disconnectDB } from '../src/config/database.js'
import dotenv from 'dotenv'

dotenv.config()

let ADMIN_TOKEN
let SELLER_TOKEN
let ORDER_ID
const request1 = testServer(admin)

beforeAll(async () => {
    await connectDB()
    const response = await request1
        .post('/login-admin')
        .send({
            username: process.env.ADMIN_USER,
            password: process.env.ADMIN_PASSWORD
        })
    const response2 = await request1
        .post('/login')
        .send({
            username: process.env.SELLER_USER,
            password: process.env.SELLER_PASSWORD
        })
    SELLER_TOKEN = response2.body.data.token
    ADMIN_TOKEN = response.body.data.token
})

afterAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    await disconnectDB()
    ADMIN_TOKEN = null
    SELLER_TOKEN = null
    ORDER_ID = null
})

const request = testServer(orders)

describe('[Orders Registration / Routes]', () => {
    it('Should return 201 on creating an order', async () => {
        // Arrange
        const expected = 201
        // Act
        const response = await request
            .post('/orders/create')
            .set('Authorization', `Bearer ${SELLER_TOKEN}`)
            .send({
                "customer": "1792829654001", 
                "products": [
                    {
                        "productId": "55005",
                        "quantity": 1
                    },
                    {
                        "productId": "55002",
                        "quantity": 5
                    }
                ],
                "discountApplied": 10.5,
                "netTotal": 7.79,
                "totalWithTax": 10.67,
                "credit": "Contado 1 día"
            })
        ORDER_ID = response.body.data._id
        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 400 on creating an order with empty body', async () => {
        // Arrange
        const expected = 400
        // Act
        const response = await request
            .post('/orders/create')
            .set('Authorization', `Bearer ${SELLER_TOKEN}`)
            .send({})

        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 400 on creating an order with negative values (discountApplied,netTotal,totalWithTax)', async () => {
        // Arrange
        const expected = 400
        // Act
        const response = await request
            .post('/orders/create')
            .set('Authorization', `Bearer ${SELLER_TOKEN}`)
            .send({
                "customer": 1767890123001,
                "products": [
                    {
                        "productId": "55055012",
                        "quantity": -1
                    },
                    {
                        "productId": "55055025",
                        "quantity": -5
                    }
                ],
                "discountApplied": -10.5,
                "netTotal": -7.79,
                "totalWithTax": -10.67,
                "credit": "Contado 15 días"
            })

        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 400 on creating an order without products valid', async () => {
        // Arrange
        const expected = 400
        // Act
        const response = await request
            .post('/orders/create')
            .set('Authorization', `Bearer ${SELLER_TOKEN}`)
            .send({
                "customer": 1767890123001,
                "products": [
                    {
                        "productId": "",
                        "quantity": 1
                    },
                    {
                        "productId": "",
                        "quantity": 5
                    }
                ],
                "discountApplied": 10.5,
                "netTotal": 7.79,
                "totalWithTax": 10.67,
                "credit": "Contado 15 días"
            })

        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 400 on creating an order with products with negative quantity', async () => {
        // Arrange
        const expected = 400
        // Act
        const response = await request
            .post('/orders/create')
            .set('Authorization', `Bearer ${SELLER_TOKEN}`)
            .send({
                "customer": 1767890123001,
                "products": [
                    {
                        "productId": "55055012",
                        "quantity": -1
                    },
                    {
                        "productId": "55055025",
                        "quantity": -5
                    }
                ],
                "discountApplied": 10.5,
                "netTotal": 7.79,
                "totalWithTax": 10.67,
                "credit": "Contado 15 días"
            })

        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 400 on creating an order with costumer not valid', async () => {
        // Arrange
        const expected = 404
        // Act
        const response = await request
            .post('/orders/create')
            .set('Authorization', `Bearer ${SELLER_TOKEN}`)
            .send({
                "customer": "1240188373001",
                "products": [
                    {
                        "productId": "55055012",
                        "quantity": 1
                    },
                    {
                        "productId": "55055025",
                        "quantity": 5
                    }
                ],
                "discountApplied": 10.5,
                "netTotal": 7.79,
                "totalWithTax": 10.67,
                "credit": "Contado 1 día"
            })
        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 404 on creating an order with product not exist', async () => {
        // Arrange
        const expected = 404
        // Act
        const response = await request
            .post('/orders/create')
            .set('Authorization', `Bearer ${SELLER_TOKEN}`)
            .send({
                "customer": 1767890123001,
                "products": [
                    {
                        "productId": "521055012",
                        "quantity": 1
                    },
                    {
                        "productId": "5504555025",
                        "quantity": 5
                    }
                ],
                "discountApplied": 10.5,
                "netTotal": 7.79,
                "totalWithTax": 10.67,
                "credit": "Contado 1 día"
            })

        // Assert
        expect(response.status).toEqual(expected)
    })
})

describe('[Orders Get All / Routes]', () => {
    it('Should return 200 on getting all orders', async () => {
        // Arrange
        const expected = 200
        // Act
        const response = await request
            .get('/orders')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)

        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 401 on getting all orders without token', async () => {
        // Arrange
        const expected = 401
        // Act
        const response = await request.get('/orders')

        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 200 on getting order by id', async () => {
        // Arrange
        const expected = 200
        // Act
        const response = await request
            .get('/orders/683cfaaa6c0c4f69b2a255aa')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 404 on getting order by id with invalid id', async () => {
        // Arrange
        const expected = 404
        // Act
        const response = await request
            .get('/orders/6808382f9ab87e70de1573b6')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 400 on getting order by id with invalid id format', async () => {
        // Arrange
        const expected = 400
        // Act
        const response = await request
            .get('/orders/6808583b4d09064b2cc9f291123456789')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        // Assert
        expect(response.status).toEqual(expected)
    })


})

describe('[Orders Update / Routes]', () => {
    it('Should return 200 on updating an order', async () => {
        // Arrange
        const expected = 200
        // Act
        const response = await request
            .patch('/orders/update/683cfaaa6c0c4f69b2a255aa')
            .set('Authorization', `Bearer ${SELLER_TOKEN}`)
            .send({
                "products": [
                    {
                        "productId": 55002,
                        "quantity": 1
                    },
                    {
                        "productId": 55005,
                        "quantity": 5
                    }
                ],
                "discountApplied": 10.5,
                "netTotal": 7.8,
                "totalWithTax": 8.97,
                "comment": "Nueva Actualizacion",
                "credit": "Contado 1 día"
            })

        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 400 on updating an order with empty body', async () => {
        // Arrange
        const expected = 400
        // Act
        const response = await request
            .patch('/orders/update/6808583b4d09064b2cc9f291')
            .set('Authorization', `Bearer ${SELLER_TOKEN}`)
            .send({})

        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 400 on updating an order without products array', async () => {
        // Arrange
        const expected = 400
        // Act
        const response = await request
            .patch('/orders/update/6808583b4d09064b2cc9f291')
            .set('Authorization', `Bearer ${SELLER_TOKEN}`)
            .send({
                "products": "",
                "discountApplied": 10.5,
                "netTotal": 7.8,
                "totalWithTax": 8.97,
                "comment": "Nueva Actualizacion",
                "credit": "Contado 15 días"
            })

        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 400 on updating an order with products incomplete', async () => {
        // Arrange
        const expected = 400
        // Act
        const response = await request
            .patch('/orders/update/6808583b4d09064b2cc9f291')
            .set('Authorization', `Bearer ${SELLER_TOKEN}`)
            .send({
                "products": [
                    {
                        "productId": 55005,
                        "quantity": 1
                    },
                    {
                        "productId": 55002,
                    }
                ],
                "discountApplied": 10.5,
                "netTotal": 7.8,
                "totalWithTax": 8.97,
                "comment": "Nueva Actualizacion",
                "credit": "Contado 15 días"
            })

        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 400 on updating an order with products with negative values', async () => {
        // Arrange
        const expected = 400
        // Act
        const response = await request
            .patch('/orders/update/6808583b4d09064b2cc9f291')
            .set('Authorization', `Bearer ${SELLER_TOKEN}`)
            .send({
                "products": [
                    {
                        "productId": 55005,
                        "quantity": 5
                    },
                    {
                        "productId": 55002,
                        "quantity": 55
                    }
                ],
                "discountApplied": -10.5,
                "netTotal": -7.8,
                "totalWithTax": -8.97,
                "comment": "Nueva Actualizacion",
                "credit": "Contado 15 días"
            })

        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 404 on updating an order with invalid id', async () => {
        // Arrange
        const expected = 404
        // Act
        const response = await request
            .patch('/orders/update/6808382f9ab87e70de1573b6')
            .set('Authorization', `Bearer ${SELLER_TOKEN}`)
            .send({
                "products": [
                    {
                        "productId": 55002,
                        "quantity": 1
                    },
                    {
                        "productId": 55005,
                        "quantity": 5
                    }
                ],
                "discountApplied": 10.5,
                "netTotal": 7.8,
                "totalWithTax": 8.97,
                "comment": "Nueva Actualizacion",
                "credit": "Contado 1 día"
            })

        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 200 on updating an order status', async () => {
        // Arrange
        const expected = 200
        // Act
        const response = await request
            .patch('/orders/update/state/683cfaaa6c0c4f69b2a255aa')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
            .send({
                "status": "En proceso"
            })

        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 400 on updating an order with invalid status', async () => {
        // Arrange
        const expected = 400
        // Act
        const response = await request
            .patch('/orders/update/683cfaaa6c0c4f69b2a255aa')
            .set('Authorization', `Bearer ${SELLER_TOKEN}`)
            .send({
                "products": [
                    {
                        "productId": 55002,
                        "quantity": 1
                    },
                    {
                        "productId": 55005,
                        "quantity": 5
                    }
                ],
                "discountApplied": 10.5,
                "netTotal": 7.8,
                "totalWithTax": 8.97,
                "comment": "Nueva Actualizacion",
                "credit": "Contado 15 días"
            })

        await request
            .patch('/orders/update/state/683cfaaa6c0c4f69b2a255aa')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
            .send({
                "status": "Pendiente"
            })

            
        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 400 on updating an order without stock', async () => {
        // Arrange
        const expected = 400
        // Act
        const response = await request
            .patch('/orders/update/683cfaaa6c0c4f69b2a255aa')
            .set('Authorization', `Bearer ${SELLER_TOKEN}`)
            .send({
                "products": [
                    {
                        "productId": 55005,
                        "quantity": 1000000
                    },
                    {
                        "productId": 55002,
                        "quantity": 1000000
                    }
                ],
                "discountApplied": 10.5,
                "netTotal": 7.8,
                "totalWithTax": 8.97,
                "comment": "Nueva Actualizacion",
                "credit": "Contado 15 días"
            })

        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 404 on updating an order status with non exist id', async () => {
        // Arrange
        const expected = 404
        // Act
        const response = await request
            .patch('/orders/update/state/6808382f9ab87e70de1573b6')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
            .send({
                "status": "En proceso"
            })
        // Assert
        expect(response.status).toEqual(expected)
    })
})

describe('[Orders Delete / Routes]', () => {
    it('Should return 200 on deleting an order', async () => {
        // Arrange
        const expected = 200
        // Act
        const response = await request
            .delete(`/orders/delete/${ORDER_ID}`)
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        // Assert  
        expect(response.status).toEqual(expected)
    })
    it('Should return 404 on deleting an order with invalid id', async () => {
        // Arrange
        const expected = 404
        // Act
        const response = await request
            .delete('/orders/delete/6808382f9ab87e70de1573b6')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)

        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 400 on deleting an order without status Pendiente', async () => {
        // Arrange
        const expected = 400
        // Act
        const response = await request
            .delete('/orders/delete/683cfab66c0c4f69b2a255b0')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)

        // Assert
        expect(response.status).toEqual(expected)
    })
})