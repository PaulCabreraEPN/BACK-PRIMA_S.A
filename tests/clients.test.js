import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import clientRouter from "../src/routers/clients_routes.js";
import Clients from "../src/models/clients.js";

// Mock de Clients
vi.mock("../src/models/clients.js");

// Mock del middleware de autenticación
vi.mock("../src/middlewares/JWT.js", () => ({
    verificarAutenticacion: vi.fn((req, res, next) => next())
}));

const app = express();
app.use(express.json());
app.use("/api", clientRouter);

describe("Client Routes", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("GET /api/clients", () => {
        it("should get all clients", async () => {
            const mockClients = [
                {
                    Ruc: 1234567890,
                    Name: "Client 1",
                    Address: "Address 1",
                    telephone: 123456789,
                    email: "email@example.com",
                    credit: "Good",
                    state: "Active",
                }
            ];

            // Mock del método find
            const mockSelect = vi.fn().mockResolvedValue(mockClients);
            const mockFind = vi.fn().mockReturnValue({ select: mockSelect });
            Clients.find = mockFind;

            const response = await request(app).get("/api/clients");

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockClients);
            expect(Clients.find).toHaveBeenCalled();
        });

        it("should handle errors when getting clients", async () => {
            // Mock del error
            Clients.find = vi.fn().mockRejectedValue(new Error("Error de base de datos"));

            const response = await request(app).get("/api/clients");

            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty("message", "Error al obtener los productos");
        });
    });

    describe("GET /api/clients/:ruc", () => {
        it("should get client by RUC", async () => {
            const mockClient = {
                _id: "123",
                Name: "Client 1",
                Ruc: 1234567890,
                Address: "Address 1",
                telephone: 123456789,
                email: "email@example.com",
                credit: "Good",
                state: "Active"
            };

            Clients.findOne = vi.fn().mockResolvedValue(mockClient);

            const response = await request(app).get("/api/clients/1234567890");

            expect(response.status).toBe(200);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.ruc).toBe(1234567890);
        });

        it("should return 500 when client not found", async () => {
            Clients.findOne = vi.fn().mockResolvedValue(null);

            const response = await request(app).get("/api/clients/1234567890");

            expect(response.status).toBe(404);
            expect(response.body.msg).toBe("Cliente no encontrado");
        });

        it("should handle invalid RUC parameter", async () => {
            const response = await request(app).get("/api/clients/");

            expect(response.status).toBe(500);
        });
    });
});