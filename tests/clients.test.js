import testServer from '../src/utils/testServer.js'
import client from '../src/routers/clients_routes.js'
import admin from '../src/routers/admin_routes.js'
import { connectDB, disconnectDB } from '../src/config/database.js'
import dotenv from 'dotenv'

dotenv.config()

let ADMIN_TOKEN
let CLIENT_ID
const request1 = testServer(admin)

beforeAll(async () => {
    await connectDB()
    const response = await request1
    .post('/login-admin')
    .send({
        username: process.env.ADMIN_USER,
        password: process.env.ADMIN_PASSWORD
    })
    ADMIN_TOKEN = response.body.data.token
})

afterAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    await disconnectDB()
    ADMIN_TOKEN = null
    CLIENT_ID = null
})

const request = testServer(client)

describe('[Clients Registration / Routes]',() => {
    it('Should return 201 on creating a client',async () => {
        //Arrange
        const expected = 201
        // Act
        const response = await request
            .post('/clients/register')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
            .send({
                "Ruc":1790012345001,
                "telephone": 593987654321,
                "email": "ventas@solucionesec.com",
                "credit": "Contado",
                "state": "al día",
                "Address": "Av. Amazonas y Patria, Quito",
                "Name": "Soluciones Ecuador"
            })
        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 400 on creating if clients Ruc exist',async () => {
        // Arrange
        const expected = 400
        // Act
        const response = await request
            .post('/clients/register')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
            .send({
                "Name": "Juan Pérez",
                "Ruc": 4987654321001,
                "Address": "Av. Principal 123, Quito",
                "telephone": 987654321,
                "email": "valeria.sanchezs@gmail.com",
                "credit": "Rechazado",
                "state": "Falto"
            })
        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 400 on creating if clients email exist',async () => {
        // Arrange
        const expected = 400
        // Act
        const response = await request
            .post('/clients/register')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
            .send({
                "Name": "Juan Pérez",
                "Ruc": 4987784321001,
                "Address": "Av. Principal 123, Quito",
                "telephone": 987654321,
                "email": "valeria.sanchez@gmail.com",
                "credit": "Rechazado",
                "state": "Falto"
            })
        // Assert
        expect(response.status).toEqual(expected)
    })
})

describe('[Clients Search / Routes]',() => {
    it('Should return 200 on getting all clients',async () => {
        // Arrange
        const expected = 200
        // Act
        const response = await request
            .get('/clients')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 200 on getting a client by Ruc',async () => {
        // Arrange
        const expected = 200
        // Act
        const response = await request
            .get('/clients/1790012345001')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        // Assert
        expect(response.status).toEqual(expected)
        CLIENT_ID = response.body.data._id
    })
})

describe('[Clients Update / Routes]',() => {
    it('Should return 200 on updating a client',async () => {
        // Arrange
        const expected = 200

        // Act
        const response = await request
            .patch('/clients/update/1790012345001')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
            .send({
                "credit": "Credito",
                "state": "en deuda",
                "Address": "Mall del Sur, Guayaquil",
                "Name": "TechStore S.A."
            })

        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 400 on updating a client if email exist',async () => {
        // Arrange
        const expected = 400

        // Act
        const response = await request
            .patch('/clients/update/1790012345001')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
            .send({
                "credit": "Credito",
                "state": "Mora",
                "Address": "Mall del Sur, Guayaquil",
                "Name": "TechStore S.A.",
                "email": "ventas@solucionesec.com"
            })
        // Assert
    })
    it('Should return 400 on updating a client if updates not exist',async () => {
        // Arrange
        const expected = 400

        // Act
        const response = await request
            .patch('/clients/update/1790012345001')
            .set(`Authorization`, `Bearer ${ADMIN_TOKEN}`)
            .send({
                "Ruc":1790012543001,
            })
        
        // Assert
        expect(response.status).toEqual(expected)
    })
})

describe('[Clients Delete / Routes]', () => {
    it('Should return 200 on deleting a client',async () => {
        // Arrange
        const expected = 200

        // Act
        const response = await request
            .delete(`/clients/delete/${CLIENT_ID}`)
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)

        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 400 on deleting a client if id not exist',async () => {
        // Arrange
        const expected = 404

        // Act
        const response = await request
            .delete('/clients/delete/675e2579ba2681aeff5e5e1c')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)

        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 400 on deleting a client if id not valid',async () => {
        // Arrange
        const expected = 400

        // Act
        const response = await request
            .delete('/clients/delete/123')

            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        
        // Assert
        expect(response.status).toEqual(expected)
    })
})

