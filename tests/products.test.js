import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import productRouter from '../src/routers/products_routes.js';
import { getAllProducts, getProductsById } from '../src/controllers/product_controller.js';
import Products from '../src/models/products.js';
import { verificarAutenticacion } from '../src/middlewares/JWT.js';

// Mock de módulos
vi.mock('../src/models/products.js', () => ({
  default: {
    find: vi.fn(),
    findOne: vi.fn(),
  }
}));

vi.mock('../src/middlewares/JWT.js', () => ({
  verificarAutenticacion: vi.fn((req, res, next) => next())
}));

// Configuración de la app
const app = express();
app.use(express.json());
app.use('/api', productRouter);

describe('Product Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should get all products successfully', async () => {
      // Mock de los datos
      const mockProducts = [
        { id: 1, product_name: 'Product 1', measure: 'unit', price: 100, stock: 10, imgUrl: 'url1' },
        { id: 2, product_name: 'Product 2', measure: 'kg', price: 200, stock: 20, imgUrl: 'url2' }
      ];
      
      Products.find.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockProducts)
      });

      const response = await request(app)
        .get('/api/products')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockProducts);
      expect(Products.find).toHaveBeenCalled();
    });

    it('should handle errors when getting all products', async () => {
      Products.find.mockReturnValue({
        select: vi.fn().mockRejectedValue(new Error('Database error'))
      });

      const response = await request(app)
        .get('/api/products')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toHaveProperty('message', 'Error al obtener los productos');
    });
  });

  describe('GET /api/products/:id', () => {
    it('should get a product by ID successfully', async () => {
      const mockProduct = {
        id: 1,
        product_name: 'Product 1',
        measure: 'unit',
        price: 100,
        stock: 10,
        imgUrl: 'url1'
      };

      Products.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockProduct)
      });

      const response = await request(app)
        .get('/api/products/1')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockProduct);
      expect(Products.findOne).toHaveBeenCalledWith({ id: 1 });
    });

    it('should return 404 when product is not found', async () => {
      Products.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(null)
      });

      const response = await request(app)
        .get('/api/products/999')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('msg', 'Producto no encontrado');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/products/invalid')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('msg', 'El ID debe ser un número válido');
    });
  });
});

describe('Product Controllers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllProducts', () => {
    it('should return all products successfully', async () => {
      const mockProducts = [
        { id: 1, product_name: 'Product 1' },
        { id: 2, product_name: 'Product 2' }
      ];

      Products.find.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockProducts)
      });

      const req = {};
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      await getAllProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockProducts);
    });
  });

  describe('getProductsById', () => {
    it('should return a product by ID successfully', async () => {
      const mockProduct = { id: 1, product_name: 'Product 1' };

      Products.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockProduct)
      });

      const req = { params: { id: '1' } };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      await getProductsById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockProduct);
    });
  });
});