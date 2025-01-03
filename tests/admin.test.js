import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import adminRouter from '../src/routers/admin_routes.js';
import { login_admin, recovery_pass_admin } from '../src/controllers/admin_controller.js';
import admins from '../src/models/admins.js';

// Mock completo del modelo
vi.mock('../src/models/admins.js', () => ({
  default: {
    findOne: vi.fn()
  }
}));

const app = express();
app.use(express.json());
app.use('/api', adminRouter);

describe('Admin Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should login an admin successfully', async () => {
    const mockAdmin = {
      _id: 'mock-id',
      username: 'admin',
      role: 'admin',
      status: true,
      chances: 3,
      createdAt: new Date(),
      matchPassword: vi.fn().mockResolvedValue(true),
      save: vi.fn().mockResolvedValue(true)
    };

    admins.findOne.mockResolvedValue(mockAdmin);

    const response = await request(app)
      .post('/api/login-admin')
      .send({
        username: 'admin',
        password: 'password'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('tokenJWT');
    expect(response.body).toHaveProperty('inf');
    expect(response.body.inf).toHaveProperty('username', 'admin');
  });

  it('should handle invalid login credentials', async () => {
    const mockAdmin = {
      username: 'admin',
      status: true,
      chances: 3,
      matchPassword: vi.fn().mockResolvedValue(false),
      save: vi.fn().mockResolvedValue(true)
    };

    admins.findOne.mockResolvedValue(mockAdmin);

    const response = await request(app)
      .post('/api/login-admin')
      .send({
        username: 'admin',
        password: 'wrongpassword'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('msg');
  });
});

describe('Admin Controllers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle admin login successfully', async () => {
    const req = {
      body: {
        username: 'admin',
        password: 'password'
      }
    };
    
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const mockAdmin = {
      _id: 'mock-id',
      username: 'admin',
      role: 'admin',
      status: true,
      chances: 3,
      createdAt: new Date(),
      lastLogin: new Date(),
      matchPassword: vi.fn().mockResolvedValue(true),
      save: vi.fn().mockResolvedValue(true)
    };

    admins.findOne.mockResolvedValue(mockAdmin);

    await login_admin(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenJWT: expect.any(String),
        inf: expect.objectContaining({
          _id: expect.any(String),
          username: expect.any(String),
          role: expect.any(String)
        })
      })
    );
  });

  it('should handle password recovery successfully', async () => {
    const req = {
      body: { username: 'admin' }
    };
    
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const mockAdmin = {
      username: 'admin',
      encryptPassword: vi.fn().mockResolvedValue('hashedpassword'),
      save: vi.fn().mockResolvedValue(true)
    };

    admins.findOne.mockResolvedValue(mockAdmin);

    await recovery_pass_admin(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Nueva Contraseña generada, REVISA EL CORREO DE LA EMPRESA'
    });
  });

  
});
