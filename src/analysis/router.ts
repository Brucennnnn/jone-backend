import { Router, type Request, type Response } from "express";
import type { AppConfig } from "../config.js";
import { parseAndValidate } from "./intake.js";

export function createAnalysisRouter(config: AppConfig): Router {
  const router = Router();

  router.post("/", (request: Request, response: Response) => {
    const result = parseAndValidate(request.body, config);

    if (!result.ok) {
      response.status(400).json({
        error: "validation_error",
        field: result.failure.field,
        message: result.failure.message
      });
      return;
    }

    // TODO: hand off to analysis service (issue #4)
    response.status(202).json({ status: "accepted" });
  });

  return router;
}
