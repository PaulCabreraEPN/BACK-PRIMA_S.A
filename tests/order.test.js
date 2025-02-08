import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';

// Mock de mongoose
vi.mock('mongoose', () => ({
  default: {
    Schema: class {},
    model: vi.fn(),
    Types: {
      ObjectId: {
        isValid: vi.fn().mockReturnValue(true)
      }
    }
  },
  Schema: class {},
  Types: {
    ObjectId: class ObjectId {
      constructor() {
        return 'mockObjectId';
      }
      toString() {
        return 'mockObjectId';
      }
    }
  }
}));

// Mock de los modelos
vi.mock('../src/models/orders.js', () => {
  const MockOrders = function() {
    return {
      save: vi.fn().mockResolvedValue({
        _id: 'mockOrderId',
        customer: 1234567890,
        seller: 'mockSellerId',
        products: [{ productId: '1', quantity: 2 }],
        discountApplied: 10,
        netTotal: 100,
        totalWithTax: 118,
        status: 'Pendiente'
      })
    };
  };
  
  return {
    default: Object.assign(MockOrders, {
      findById: vi.fn(),
      find: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      findByIdAndDelete: vi.fn()
    })
  };
});

vi.mock('../src/models/clients.js', () => ({
  default: {
    findOne: vi.fn(),
    find: vi.fn()
  }
}));

vi.mock('../src/models/products.js', () => ({
  default: {
    findOne: vi.fn(),
    find: vi.fn(),
    findOneAndUpdate: vi.fn()
  }
}));

vi.mock('../src/models/sellers.js', () => ({
  default: {
    find: vi.fn(),
    findById: vi.fn()
  }
}));

// Mock del middleware de autenticación
vi.mock('../src/middlewares/JWT.js', () => ({
  verificarAutenticacion: (req, res, next) => {
    req.SellerBDD = {
      _id: 'mockSellerId',
      names: 'Test Seller',
      lastNames: 'Test LastName',
      email: 'seller@test.com'
    };
    next();
  }
}));

// Importaciones después de los mocks
import orderRouter from '../src/routers/order_routes.js';
import Orders from '../src/models/orders.js';
import Clients from '../src/models/clients.js';
import Products from '../src/models/products.js';
import Sellers from '../src/models/sellers.js';

const app = express();
app.use(express.json());
app.use('/api', orderRouter);

describe('Orders API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /orders/create', () => {
    it('should create an order successfully', async () => {
      const mockOrder = {
        customer: 1234567890,
        products: [{
          productId: '1',
          quantity: 2
        }],
        discountApplied: 10,
        netTotal: 100,
        totalWithTax: 118
      };

      Clients.findOne.mockResolvedValue({ Ruc: 1234567890 });
      Products.findOne.mockResolvedValue({ id: 1, stock: 10 });
      Products.findOneAndUpdate.mockResolvedValue({ id: 1, stock: 8 });

      const response = await request(app)
        .post('/api/orders/create')
        .send(mockOrder);

      expect(response.status).toBe(201);
      expect(response.body.msg).toBe('Orden creada con éxito');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/orders/create')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Todos los campos son requeridos');
    });
  });

  describe('GET /orders', () => {
    it('should return all orders', async () => {
      Orders.find.mockResolvedValue([{
        _id: 'orderId1',
        customer: 1234567890,
        seller: 'mockSellerId',
        products: [{ productId: '1', quantity: 2 }],
        status: 'Pendiente'
      }]);

      Clients.find.mockResolvedValue([{
        _id: 'clientId1',
        Ruc: 1234567890,
        Name: 'Test Client'
      }]);

      Products.find.mockResolvedValue([{
        _id: 'productId1',
        id: '1',
        product_name: 'Test Product'
      }]);

      Sellers.find.mockResolvedValue([{
        _id: 'mockSellerId',
        names: 'Test Seller'
      }]);

      const response = await request(app)
        .get('/api/orders');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 404 if no orders found', async () => {
      Orders.find.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/orders');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('No se encontraron órdenes');
    });
  });

  describe('GET /orders/:id', () => {
    it('should return an order by id', async () => {
      const mockOrder = {
        _id: 'mockObjectId',
        customer: 1234567890,
        seller: 'mockSellerId',
        products: [{ productId: '1', quantity: 2 }],
        status: 'Pendiente'
      };

      const mockClient = {
        Ruc: 1234567890,
        Name: 'Test Client'
      };

      const mockProduct = [{
        id: '1',
        product_name: 'Test Product'
      }];

      Orders.findById.mockResolvedValue(mockOrder);
      Clients.findOne.mockResolvedValue(mockClient);
      Products.find.mockResolvedValue(mockProduct);
      Sellers.findById.mockResolvedValue({
        _id: 'mockSellerId',
        names: 'Test Seller'
      });

      const response = await request(app)
        .get('/api/orders/mockObjectId');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id');
    });

    it('should return 404 if order not found', async () => {
      Orders.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/orders/mockObjectId');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Orden no encontrada');
    });
  });

  describe('PATCH /orders/update/state/:id', () => {
    it('should update order status successfully', async () => {
      const updatedOrder = {
        _id: 'mockObjectId',
        status: 'En proceso',
        lastUpdate: new Date()
      };

      Orders.findByIdAndUpdate.mockResolvedValue(updatedOrder);

      const response = await request(app)
        .patch('/api/orders/update/state/mockObjectId')
        .send({ status: 'En proceso' });

      expect(response.status).toBe(200);
      expect(response.body.msg).toBe('Estado de la proforma actualizado correctamente.');
    });
  });

  describe('DELETE /orders/delete/:id', () => {
    it('should delete order successfully', async () => {
      Orders.findById.mockResolvedValue({
        _id: 'orderId1',
        status: 'Pendiente',
        products: [{ productId: '1', quantity: 2 }]
      });

      Products.find.mockResolvedValue([{ id: 1, stock: 8 }]);
      Products.findOneAndUpdate.mockResolvedValue({ id: 1, stock: 10 });
      Orders.findByIdAndDelete.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/orders/delete/orderId1');

      expect(response.status).toBe(200);
      expect(response.body.msg).toBe('Orden eliminada con éxito y stock reestablecido');
    });

    it('should return error if order not in Pending status', async () => {
      Orders.findById.mockResolvedValue({
        _id: 'orderId1',
        status: 'Enviado'
      });

      const response = await request(app)
        .delete('/api/orders/delete/orderId1');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Lo sentimos, la orden ya fué procesada');
    });
  });
});