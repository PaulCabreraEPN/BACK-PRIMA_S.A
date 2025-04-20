import express from 'express';
import supertest from 'supertest'

const testServer = (router) => {
    const app = express()
    app.use(express.json())
    app.use(router)
    return supertest(app)
}

export default testServer
