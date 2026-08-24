const express = require("express");
const request = require("supertest");
const { describe, it, expect, vi, beforeEach } = require("vitest");
const { z } = require("zod");

const stockTakingService = require("../src/modules/stock-taking/stock-taking.service");

const app = express();

app.use(express.json());

const createStockTakingSchema = z.object({
  sessionNumber: z.string().min(1),
  storeId: z.string().min(1),
  countDate: z.string().min(1),
  notes: z.string().optional(),
  lines: z.array(
    z.object({
      itemId: z.string().min(1),
      systemQuantity: z.number().int().nonnegative(),
      physicalQuantity: z.number().int().nonnegative(),
      notes: z.string().optional()
    })
  ).min(1)
});

function permissionMiddleware(req, res, next) {
  const role = req.headers["x-role"];

  if (!role) {
    return res.status(403).json({
      success: false,
      error: "Permission denied"
    });
  }

  req.user = {
    id: "test-user-1",
    role
  };

  next();
}

app.post(
  "/api/stock-taking",
  permissionMiddleware,
  async (req, res) => {
    const validation = createStockTakingSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.error.issues
      });
    }

    try {
      const result = await stockTakingService.createSession(
        validation.data,
        req.user
      );

      return res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        error: error.message
      });
    }
  }
);

describe("Stock-Taking API Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a stock-taking session successfully", async () => {
    const fakeSession = {
      id: "session-1",
      sessionNumber: "ST-001",
      storeId: "store-1",
      status: "OPEN",
      lines: [
        {
          itemId: "item-1",
          systemQuantity: 100,
          physicalQuantity: 95,
          variance: -5
        }
      ]
    };

    vi.spyOn(
      stockTakingService,
      "createSession"
    ).mockResolvedValue(fakeSession);

    const response = await request(app)
      .post("/api/stock-taking")
      .set("x-role", "STOCK_TAKER")
      .send({
        sessionNumber: "ST-001",
        storeId: "store-1",
        countDate: "2026-08-24",
        lines: [
          {
            itemId: "item-1",
            systemQuantity: 100,
            physicalQuantity: 95
          }
        ]
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe("session-1");
  });

  it("should reject invalid request data", async () => {
    const response = await request(app)
      .post("/api/stock-taking")
      .set("x-role", "STOCK_TAKER")
      .send({
        sessionNumber: "",
        storeId: "",
        countDate: "invalid",
        lines: []
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Validation failed");
  });

  it("should deny access when permission is missing", async () => {
    const response = await request(app)
      .post("/api/stock-taking")
      .send({
        sessionNumber: "ST-001",
        storeId: "store-1",
        countDate: "2026-08-24",
        lines: [
          {
            itemId: "item-1",
            systemQuantity: 100,
            physicalQuantity: 95
          }
        ]
      });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Permission denied");
  });
});