import { Router, type Request, type Response } from "express";
import type { TrendService } from "./service.js";
import type { TrendResponse } from "./types.js";

export interface TrendResult {
  statusCode: number;
  body: TrendResponse;
}

export function createTrendRoutes(service: TrendService): Router {
  const router = Router();

  router.get("/api/v1/scam/trends", async (_request: Request, response: Response) => {
    const result = await handleTrendRequest(service);
    response.status(result.statusCode).json(result.body);
  });

  return router;
}

export async function handleTrendRequest(
  service: TrendService
): Promise<TrendResult> {
  return {
    statusCode: 200,
    body: await service.getTrends()
  };
}
