import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock modules before importing the real ones
vi.mock('../src/models/sellers.js', () => ({
  default: vi.fn(() => ({
    encryptPassword: vi.fn().mockResolvedValue('hashedPassword'),
    createToken: vi.fn().mockReturnValue('mockToken'),
    save: vi.fn().mockResolvedValue(true),
    email: 'test@test.com'
  }))
}));

vi.mock('../src/config/nodemailer.js', () => ({
  SendMailCredentials: vi.fn().mockResolvedValue(true)
}));

vi.mock('../src/middlewares/JWT.js', () => ({
  default: vi.fn().mockReturnValue('mockToken'),
  verificarAutenticacion: vi.fn().mockImplementation((req, res, next) => next())
}));

// Now import the modules
import sellerRouter from '../src/routers/admin_routes.js';
import { registerSeller, loginSeller } from '../src/controllers/Seller_controller.js';
import Sellers from '../src/models/sellers.js';
import { SendMailCredentials } from '../src/config/nodemailer.js';
import generarJWT from '../src/middlewares/JWT.js';

const app = express();
app.use(express.json());
app.use('/api', sellerRouter);

describe('Seller Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Sellers mock implementation for each test
    Sellers.mockImplementation(() => ({
      encryptPassword: vi.fn().mockResolvedValue('hashedPassword'),
      createToken: vi.fn().mockReturnValue('mockToken'),
      save: vi.fn().mockResolvedValue(true),
      email: 'test@test.com'
    }));
  });

  describe('POST /register', () => {
    it('should register a new seller successfully', async () => {
      Sellers.findOne = vi.fn().mockResolvedValue(null);

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
      Sellers.findOne = vi.fn().mockResolvedValue({ email: 'test@test.com' });

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

      expect(response.status).toBe(400);
      expect(response.body.msg).toBe('Ya se encuentra registrado el email');
    });

    it('should return error if numberID already exists', async () => {
      Sellers.findOne = vi.fn()
        .mockResolvedValueOnce(null) // Para la verificación del email
        .mockResolvedValueOnce({ numberID: 1234567890 }); // Para la verificación del numberID

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

      expect(response.status).toBe(400);
      expect(response.body.msg).toBe('Número de cédula ya se encuentra registrado');
    });

    it('should return error if required fields are missing', async () => {
      Sellers.findOne = vi.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/api/register')
        .send({
          names: '',
          email: 'test@test.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.msg).toBe('Lo sentimos, debes llenar todos los campos');
    });
  });

  describe('POST /login', () => {
    it('should login successfully', async () => {
      const mockSeller = {
        _id: 'mockId',
        username: 'testuser',
        confirmEmail: true,
        matchPassword: vi.fn().mockResolvedValue(true)
      };

      Sellers.findOne = vi.fn().mockResolvedValue(mockSeller);

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
      Sellers.findOne = vi.fn().mockResolvedValue(null);

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

      Sellers.findOne = vi.fn().mockResolvedValue(null);
      Sellers.mockImplementation(() => mockSeller);

      await registerSeller(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Vendedor registrado exitosamente'
      });
    });
  });
});