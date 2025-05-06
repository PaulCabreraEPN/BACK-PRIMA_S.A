import testServer from '../src/utils/testServer.js'
import admin from '../src/routers/admin_routes.js'
import stadistics from '../src/routers/statics_routes.js'
import { connectDB, disconnectDB } from '../src/config/database.js'
import dotenv from 'dotenv'

dotenv.config()

let ADMIN_TOKEN
const request = testServer(stadistics)

beforeAll(async () => {
    await connectDB()
    // Get admin token
    const adminRequest = testServer(admin)
    const response = await adminRequest
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
})

describe('[STATICS] GET /statics/count', () => {
    it('should return 200 and entity counts', async () => {
        const expected = 200
        const response = await request
            .get('/statics/count')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        expect(response.status).toEqual(expected)
        expect(response.body.data).toHaveProperty('products')
        expect(response.body.data).toHaveProperty('orders')
        expect(response.body.data).toHaveProperty('sellers')
        expect(response.body.data).toHaveProperty('clients')
    })

    it('should return 401 if no token is provided', async () => {
        const expected = 401
        const response = await request.get('/statics/count')
        expect(response.status).toEqual(expected)
    })
})

describe('[STATICS] GET /statics/top-sellers', () => {
    it('should return 200 and top sellers', async () => {
        const expected = 200
        const response = await request
            .get('/statics/top-sellers')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        expect(response.status).toEqual(expected)
        expect(response.body.data).toHaveProperty('sellerNames')
        expect(response.body.data).toHaveProperty('salesCounts')
    })

    it('should return 401 if no token is provided', async () => {
        const expected = 401
        const response = await request.get('/statics/top-sellers')
        expect(response.status).toEqual(expected)
    })
})

describe('[STATICS] GET /statics/sales-by-seller', () => {
    it('should return 200 and sales by seller', async () => {
        const expected = 200
        const response = await request
            .get('/statics/sales-by-seller')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        expect(response.status).toEqual(expected)
        expect(response.body.data).toHaveProperty('names')
        expect(response.body.data).toHaveProperty('totalSales')
    })

    it('should return 401 if no token is provided', async () => {
        const expected = 401
        const response = await request.get('/statics/sales-by-seller')
        expect(response.status).toEqual(expected)
    })
})

describe('[STATICS] GET /statics/orders-by-week', () => {
    it('should return 200 and weekly sales', async () => {
        const expected = 200
        const response = await request
            .get('/statics/orders-by-week')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        expect(response.status).toEqual(expected)
        expect(response.body.data).toHaveProperty('weekDays')
        expect(response.body.data).toHaveProperty('salesByDay')
    })

    it('should return 401 if no token is provided', async () => {
        const expected = 401
        const response = await request.get('/statics/orders-by-week')
        expect(response.status).toEqual(expected)
    })
})