import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import sellerRouter from '../src/routers/admin_routes.js';
import { registerSeller, loginSeller } from '../src/controllers/Seller_controller.js';
import Sellers from '../src/models/sellers.js';
import { SendMailCredentials } from '../src/config/nodemailer.js';
import generarJWT from '../src/middlewares/JWT.js';

// Mock todas las dependencias
vi.mock('../src/models/sellers.js');
vi.mock('../src/config/nodemailer.js');
vi.mock('../src/middlewares/JWT.js');

const app = express();
app.use(express.json());
app.use('/api', sellerRouter);

describe('Seller Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /register', () => {
    it('should register a new seller successfully', async () => {
      // Mock de las funciones necesarias
      const mockSeller = {
        _id: 'mockId',
        encryptPassword: vi.fn().mockResolvedValue('hashedPassword'),
        createToken: vi.fn().mockReturnValue('mockToken'),
        save: vi.fn().mockResolvedValue(true),
        email: 'test@test.com'
      };

      Sellers.findOne.mockResolvedValue(null);
      Sellers.mockImplementation(() => mockSeller);
      SendMailCredentials.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/register')
        .send({
          names: 'John',
          lastNames: 'Doe',
          numberID: 1234567890,
          email: 'test@test.com',
          SalesCity: 'Test City',
          PhoneNumber: 1234567890,
          role: 'seller',
          password: 'securePassword'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('msg', 'Vendedor registrado exitosamente');
    });

    it('should return error if email already exists', async () => {
      Sellers.findOne.mockResolvedValue({ email: 'test@test.com' });

      const response = await request(app)
        .post('/api/register')
        .send({
          names: 'John',
          email: 'test@test.com',
          numberID: 1234567890
        });

      expect(response.status).toBe(400);
      expect(response.body.msg).toBe('Ya se encuentra registrado el email');
    });
  });

  describe('POST /login', () => {
    it('should login successfully', async () => {
      const mockSeller = {
        _id: 'mockId',
        username: 'testuser',
        matchPassword: vi.fn().mockResolvedValue(true)
      };

      Sellers.findOne.mockResolvedValue(mockSeller);
      generarJWT.mockReturnValue('mockToken');

      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tokenJWT');
    });

    it('should return error with invalid credentials', async () => {
      Sellers.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'wronguser',
          password: 'wrongpass'
        });

      expect(response.status).toBe(400);
      expect(response.body.msg).toBe('Usuario no encontrado');
    });
  });
});

describe('Seller Controllers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerSeller', () => {
    it('should register seller successfully', async () => {
      const req = {
        body: {
          names: 'John',
          lastNames: 'Doe',
          numberID: 1234567890,
          email: 'test@test.com',
          SalesCity: 'Test City',
          PhoneNumber: 1234567890,
          role: 'seller',
          password: 'securePassword'
        }
      };

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      const mockSeller = {
        encryptPassword: vi.fn().mockResolvedValue('hashedPassword'),
        createToken: vi.fn().mockReturnValue('mockToken'),
        save: vi.fn().mockResolvedValue(true)
      };

      Sellers.findOne.mockResolvedValue(null);
      Sellers.mockImplementation(() => mockSeller);
      SendMailCredentials.mockResolvedValue(true);

      await registerSeller(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Vendedor registrado exitosamente'
      });
    });
  });
});
