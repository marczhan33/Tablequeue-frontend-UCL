import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: result.error.errors
        });
      }
      req.body = result.data;
      next();
    } catch (error) {
      console.error("Validation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.params);
      if (!result.success) {
        return res.status(400).json({
          error: "Invalid parameters",
          details: result.error.errors
        });
      }
      req.params = result.data;
      next();
    } catch (error) {
      console.error("Parameter validation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({
          error: "Invalid query parameters",
          details: result.error.errors
        });
      }
      req.query = result.data;
      next();
    } catch (error) {
      console.error("Query validation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}