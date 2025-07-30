import request from "supertest";
import express from "express";
import session from "express-session";
import { AuthController } from "../controllers/auth-controller.js";

// Mock dependencies
jest.mock("../storage.js");
jest.mock("../auth.js");
jest.mock("../lib/firebase-admin.js");

const app = express();
app.use(express.json());
app.use(session({
  secret: "test-secret",
  resave: false,
  saveUninitialized: false
}));

// Setup routes
app.post("/auth/login", AuthController.login);
app.post("/auth/register", AuthController.register);
app.post("/auth/google", AuthController.googleAuth);
app.post("/auth/logout", AuthController.logout);
app.get("/auth/status", AuthController.getStatus);

describe("AuthController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /auth/login", () => {
    it("should return 400 for invalid input", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it("should return 401 for invalid credentials", async () => {
      const { storage } = require("../storage.js");
      storage.getUserByUsername.mockResolvedValue(null);

      const response = await request(app)
        .post("/auth/login")
        .send({
          username: "testuser",
          password: "testpass"
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid credentials");
    });
  });

  describe("POST /auth/register", () => {
    it("should return 400 for invalid input", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({
          username: "ab", // Too short
          password: "123", // Too short
          phone: "123" // Too short
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it("should return 400 if username already exists", async () => {
      const { storage } = require("../storage.js");
      storage.getUserByUsername.mockResolvedValue({ id: 1, username: "existing" });

      const response = await request(app)
        .post("/auth/register")
        .send({
          username: "existing",
          password: "password123",
          phone: "1234567890"
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Username already exists");
    });
  });

  describe("GET /auth/status", () => {
    it("should return unauthenticated status when no session", async () => {
      const response = await request(app)
        .get("/auth/status");

      expect(response.status).toBe(200);
      expect(response.body.isAuthenticated).toBe(false);
      expect(response.body.user).toBeNull();
    });
  });
});