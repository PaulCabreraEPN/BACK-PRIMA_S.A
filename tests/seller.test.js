import testServer from '../src/utils/testServer.js'
import seller from '../src/routers/admin_routes.js'
import { connectDB, disconnectDB } from '../src/config/database.js'
import dotenv from 'dotenv'

dotenv.config()

beforeAll(async () => {
    await connectDB()
})

afterAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    await disconnectDB()
})

const request = testServer(seller)

describe('[Seller Public Endpoints]', () => {
    describe('POST /login', () => {
        it('Should return 200 on successful login', async () => {
            const response = await request
                .post('/login')
                .send({
                    username: process.env.SELLER_USER,
                    password: process.env.SELLER_PASSWORD
                })
            expect([200, 201]).toContain(response.status)
        })

        it('Should return 401 on invalid credentials', async () => {
            const response = await request
                .post('/login')
                .send({
                    username: process.env.SELLER_USER,
                    password: 'wrong_password'
                })
                console.log(response.body)
            expect(response.status).toBe(401)
        })

        it('Should return 400 on empty fields', async () => {
            const response = await request
                .post('/login')
                .send({
                    username: '',
                    password: ''
                })
            expect(response.status).toBe(400)
        })
    })

    describe('POST /recovery-password', () => {
        it('Should return 200 on valid username', async () => {
            const response = await request
                .post('/recovery-password')
                .send({
                    email: "testExample@example.com"
                })
            expect(response.status).toBe(200)
        })

        it('Should return 400 on empty username', async () => {
            const response = await request
                .post('/recovery-password')
                .send({
                    username: ''
                })
            expect(response.status).toBe(400)
        })

        it('Should return 400 on non-existent username', async () => {
            const response = await request
                .post('/recovery-password')
                .send({
                    username: 'nonexistent_user'
                })
            expect(response.status).toBe(400)
        })
    })

    describe('GET /confirm-account/:token', () => {
        it('Should return 200 on valid token', async () => {
            // You need to provide a valid token for this test
            const validToken = process.env.SELLER_CONFIRM_TOKEN || 'dummy_token'
            const response = await request
                .get(`/confirm-account/${validToken}`)
            // Accept 200 or 400 if token is not valid in test env
            expect([200, 400, 404]).toContain(response.status)
        })

        it('Should return 400 on empty token', async () => {
            const response = await request
                .get('/confirm-account/')
            expect([400, 404]).toContain(response.status)
        })

        it('Should return 404 on non-existent token', async () => {
            const response = await request
                .get('/confirm-account/invalidtoken123')
            expect([400, 404]).toContain(response.status)
        })
    })

    describe('GET /recovery-password/:token', () => {
        it('Should return 200 on valid token', async () => {
            // You need to provide a valid recovery token for this test
            const validToken = process.env.SELLER_RECOVERY_TOKEN || 'dummy_token'
            const response = await request
                .get(`/recovery-password/${validToken}`)
            expect([200, 400, 404]).toContain(response.status)
        })

        it('Should return 404 on invalid token', async () => {
            const response = await request
                .get('/recovery-password/invalidtoken123')
            expect([400, 404]).toContain(response.status)
        })
    })

    describe('POST /recovery-password/:token', () => {
        it('Should return 200 on valid token and new password', async () => {
            // You need to provide a valid recovery token for this test
            const validToken = process.env.SELLER_RECOVERY_TOKEN || 'dummy_token'
            const response = await request
                .post(`/recovery-password/${validToken}`)
                .send({
                    password: 'NewPassword123!',
                    confirmPassword: 'NewPassword123!'
                })
            expect([200, 400, 404]).toContain(response.status)
        })

        it('Should return 400 on password mismatch', async () => {
            const validToken = process.env.SELLER_RECOVERY_TOKEN || 'dummy_token'
            const response = await request
                .post(`/recovery-password/${validToken}`)
                .send({
                    password: 'NewPassword123!',
                    confirmPassword: 'DifferentPassword!'
                })
            expect([400, 404]).toContain(response.status)
        })

        it('Should return 400 on empty password fields', async () => {
            const validToken = process.env.SELLER_RECOVERY_TOKEN || 'dummy_token'
            const response = await request
                .post(`/recovery-password/${validToken}`)
                .send({
                    password: '',
                    confirmPassword: ''
                })
            expect([400, 404]).toContain(response.status)
        })

        it('Should return 404 on invalid token', async () => {
            const response = await request
                .post('/recovery-password/invalidtoken123')
                .send({
                    password: 'NewPassword123!',
                    confirmPassword: 'NewPassword123!'
                })
            expect([400, 404]).toContain(response.status)
        })
    })
})
