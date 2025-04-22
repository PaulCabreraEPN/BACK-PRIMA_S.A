import testServer from '../src/utils/testServer.js'
import products from '../src/routers/products_routes.js'
import admin from '../src/routers/admin_routes.js'
import { connectDB, disconnectDB } from '../src/config/database.js'
import dotenv from 'dotenv'

dotenv.config()

let ADMIN_TOKEN
const request1 = testServer(admin)

beforeAll(async () => {
    await connectDB()
    const response = await request1
    .post('/login-admin')
    .send({
        username: process.env.ADMIN_USER,
        password: process.env.ADMIN_PASSWORD
    })
    ADMIN_TOKEN = response.body.tokenJWT
})

afterAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    await disconnectDB()
    ADMIN_TOKEN = null
})

const request = testServer(products)

describe('[Products Registration / Routes]',() => {
    it('Should return 201 on creating a product',async () => {
        // Arrange
        const expected = 201
        // Act
        const response = await request
            .post('/products/register')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
            .field('id',44444)
            .field('product_name','APPLE')
            .field('measure','UND')
            .field('price',0.50)
            .field('stock',100)
            .attach('image','tests/testImages/fuji-red.jpg')
        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 400 on creating a product with an existing ID',async () => {
        // Arrange
        const expected = 400
        // Act
        const response = await request
            .post('/products/register')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
            .field('id',71071812)
            .field('product_name','APPLE')
            .field('measure','UND')
            .field('price',0.50)
            .field('stock',100)
            .attach('image','tests/testImages/fuji-red.jpg')
        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 400 on creating a product witout an image',async () => {
        // Arrange
        const expected = 400
        // Act
        const response = await request
            .post('/products/register')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
            .field('id',44445)
            .field('product_name','APPLE')
            .field('measure','UND')
            .field('price',0.50)
            .field('stock',100)
        // Assert
        expect(response.status).toEqual(expected)
    })
})

describe('[Products Search / Routes]',() => {
    it('Should return 200 on getting all products',async () => {
        // Arrange
        const expected = 200
        // Act
        const response = await request
            .get('/products')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 200 on getting a product by ID',async () => {
        // Arrange
        const expected = 200
        // Act
        const response = await request
            .get('/products/44444')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        // Assert
        expect(response.status).toEqual(expected)
    })
})

describe('[Products Update / Routes]',() => {
    it('Should return 200 on updating a product',async () => {
        // Arrange
        const expected = 200
        // Act
        const response = await request
            .patch('/products/update/44444')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
            .attach('image','tests/testImages/descarga.jpeg')
        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 404 on updating a product with unexisting ID',async () => {
        // Arrange
        const expected = 404
        // Act
        const response = await request
            .patch('/products/update/444446')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
            .attach('image','tests/testImages/descarga.jpeg')
        // Assert
        expect(response.status).toEqual(expected)
    })
})

describe('[Products Deletion / Routes]',() => {
    it('Should return 200 on deleting a product',async () => {
        // Arrange
        const expected = 200
        // Act
        const response = await request
            .delete('/products/delete/44444')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 404 on deleting a product with unexisting ID',async () => {
        // Arrange
        const expected = 404
        // Act
        const response = await request
            .delete('/products/delete/444446')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        // Assert
        expect(response.status).toEqual(expected)
    })
})