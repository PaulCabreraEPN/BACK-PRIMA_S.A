import testServer from '../src/utils/testServer.js'
import admin from '../src/routers/admin_routes.js'
import { connectDB, disconnectDB } from '../src/config/database.js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()
beforeAll(async () => {
    await connectDB()
})

afterAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    await disconnectDB()
})

const request = testServer(admin)

describe('[Admin Login / Routes]', ()=>{
    it('Should return 200 on successful login', async () => {
        // Arrange
        const expected = 200
        
        // Act
        const response = await request
            .post('/login-admin')
            .send({
                username: process.env.ADMIN_USER,
                password: process.env.ADMIN_PASSWORD
            })
        
        // Assert
        expect(response.status).toEqual(expected)
    })

    it('Should return 400 on invalid login', async () => {
        // Arrange
        const expected = 400
        
        // Act
        const response = await request
            .post('/login-admin')
            .send({
                username: process.env.ADMIN_USER,
                password: 'wrong_password'
            })
        
        // Assert
        expect(response.status).toEqual(expected)
    })

    it('Should return 400 on empty fields', async () => {
        // Arrange
        const expected = 400
        
        // Act
        const response = await request
            .post('/login-admin')
            .send({
                username: '',
                password: ''
            })
        
        // Assert
        expect(response.status).toEqual(expected)
    })

    it('Should return 400 on non-existent user', async () => {
        // Arrange
        const expected = 400
        
        // Act
        const response = await request
            .post('/login-admin')
            .send({
                username: 'nonexistent_user',
                password: 'any_password'
            })
        
        // Assert
        expect(response.status).toEqual(expected)
    })

    it('Should return 400 on blocked account', async () => {
        // Arrange
        const expected = 400
        
        // Act
        const response = await request
            .post('/login-admin')
            .send({
                username: 'blocked_user',
                password: 'any_password'
            })
        
        // Assert
        expect(response.status).toEqual(expected)
    })

    it('Should return 200 on successful password recovery', async () => {
        //Arrange
        const expected = 200
        // Act
        const response = await request
            .post('/recovery-password-admin')
            .send({
                username: process.env.ADMIN_USERNAME_RECOVERY
            })
        // Assert
        expect(response.status).toEqual(expected)
        await new Promise(resolve => setTimeout(resolve, 1000))
    },100000)

    it('Should return 400 on empty username field', async () => {
        // Arrange
        const expected = 400
        
        // Act
        const response = await request
            .post('/recovery-password-admin')
            .send({
                username: ''
            })
        
        // Assert
        expect(response.status).toEqual(expected)
    })


})

let ADMIN_TOKEN
let SellerID

beforeAll(async () => {
    const response = await request
        .post('/login-admin')
        .send({
            username: process.env.ADMIN_USER,
            password: process.env.ADMIN_PASSWORD
        })
    ADMIN_TOKEN = response.body.tokenJWT
})

afterAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    ADMIN_TOKEN = null
    SellerID = null
})

describe('[Seller Registration / Routes]', () => {
    it('Should return 200 on successful registration', async () => {
        // Arrange
        const expected = 201
        // Act
        
        const response = await request
            .post('/register')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
            .send({
                "names": "Carlos Alberto",
                "lastNames": "González Suarez",
                "numberID": 1713175873,
                "email": "xiditi6286@insfou.com",
                "SalesCity": "Barcelona",
                "PhoneNumber": 593987654321,
                "role": "Seller",
                "status": false
            })
        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 400 on empty fields', async () => {
        // Arrange
        const expected = 400
        
        // Act
        const response = await request
            .post('/register')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
            .send({
                "names": "",
                "lastNames": "",
                "numberID": "",
                "email": "",
                "SalesCity": "",
                "PhoneNumber": "",
                "role": "",
                "status": ""
            })
        
        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 400 on exist email',async () =>{
        // Arrange
        const expected = 400
        // Act
        const response = await request
            .post('/register')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
            .send({
                "names": "Carlos Alberto",
                "lastNames": "González Suarez",
                "numberID": 1713175873,
                "email": "xiditi6286@insfou.com",
                "SalesCity": "Barcelona",
                "PhoneNumber": 593987654321,
                "role": "Seller",
                "status": false
            })
        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 400 on exist numberID',async () =>{
        // Arrange
        const expected = 400
        // Act
        const response = await request
            .post('/register')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
            .send({
                "names": "Carlos Alberto",
                "lastNames": "González Suarez",
                "numberID": 1713175873,
                "email": "xiditi6286@insfou.com",
                "SalesCity": "Barcelona",
                "PhoneNumber": 593987654321,
                "role": "Seller",
                "status": false
            })
        // Assert
        expect(response.status).toEqual(expected)
    })
})

describe('[Seller Search / Routes]',() => {
    it('Should return 200 on successful search all Sellers', async () => {
        // Arrange
        const expected = 200
        
        // Act
        const response = await request
            .get('/sellers/')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        
        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 200 on successful search by number ID', async () => {
        // Arrange
        const expected = 200
        
        // Act
        const response = await request
            .get('/sellers-numberid/1713175873')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        SellerID = response.body.msg._id
        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 400 on empty number ID', async () => {
        // Arrange
        const expected = 400
        
        // Act
        const response = await request
            .get('/sellers-numberid/2')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        
        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 400 on invalid number ID', async () => {
        // Arrange
        const expected = 400
        
        // Act
        const response = await request
            .get('/sellers-numberid/171317587')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        
        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 404 on non-existent number ID', async () => {
        // Arrange
        const expected = 404
        
        // Act
        const response = await request
            .get('/sellers-numberid/0926145335')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        
        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 200 on successful search by ID', async () => {
        // Arrange
        const expected = 200
        
        // Act
        const response = await request
            .get('/sellers/67c72d19c13895987c94c478')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        
        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 404 on empty ID', async () => {
        // Arrange
        const expected = 400
        
        // Act
        const response = await request
            .get('/sellers/2')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        
        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 404 on non-existent ID', async () => {
        // Arrange
        const expected = 404
        
        // Act
        const response = await request
            .get('/sellers/6805787f420062e52b0aa675')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        
        // Assert
        expect(response.status).toEqual(expected)
    })
})

describe('[Seller Update / Routes]',() => {
    it('Should return 200 on successful update', async () =>{
        // Arange
        const expected = 200
        // Act
        const response = await request
            .patch('/updateSeller/67c72d19c13895987c94c478')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
            .send({
                "names": "Diaz Ariel"
            })
        
        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 400 on empty fields', async () => {
        // Arrange
        const expected = 400
        
        // Act
        const response = await request
            .patch('/updateSeller/67c72d19c13895987c94c478')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
            .send({
                "names": "",
                "lastNames": "",
                "numberID": "",
                "email": "",
                "SalesCity": "",
                "PhoneNumber": "",
                "role": "",
                "status": ""
            })
        
        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 400 on invalid ID', async () => {
        // Arrange
        const expected = 400
        
        // Act
        const response = await request
            .patch('/updateSeller/67c72d19c13895987c9479')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
            .send({
                "names": "Diaz Ariel"
            })
        
        // Assert
        expect(response.status).toEqual(expected)
    })
})

describe('[Seller Deletion / Routes]',() => {
    it('Should return 200 on successful deletion', async () => {
        // Arrange
        const expected = 200
        
        // Act
        const response = await request
            .delete(`/deleteSellerinfo/${SellerID}`)
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        
        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 400 on empty ID', async () => {
        // Arrange
        const expected = 400
        
        // Act
        const response = await request
            .delete('/deleteSellerinfo/2')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        
        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 404 on non-existent ID', async () => {
        // Arrange
        const expected = 400
        
        // Act
        const response = await request
            .delete('/deleteSellerinfo/4')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        
        // Assert
        expect(response.status).toEqual(expected)
    })
    it('Should return 400 on invalid ID', async () => {
        // Arrange
        const expected = 400
        
        // Act
        const response = await request
            .delete('/deleteSellerinfo/67c72d19c13895987c9479')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        
        // Assert
        expect(response.status).toEqual(expected)
    })
})

