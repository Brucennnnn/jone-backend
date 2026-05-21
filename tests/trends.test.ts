import { describe, expect, it } from "vitest";
import { handleTrendRequest } from "../src/trends/http.js";
import { createStaticTrendService } from "../src/trends/staticTrendService.js";

describe("trend endpoint", () => {
  it("returns scam type and common phrase trends", async () => {
    const result = await callTrendRoute();

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      scamTypes: expect.arrayContaining([
        { category: "call_center", count: expect.any(Number) },
        { category: "romance_scam", count: expect.any(Number) }
      ]),
      commonPhrases: expect.arrayContaining([
        { phrase: "โอนด่วน", count: expect.any(Number) },
        { phrase: "ตรวจสอบ 2 ชั้น", count: expect.any(Number) }
      ])
    });
  });

  it("returns a fresh trend object for each service call", async () => {
    const service = createStaticTrendService();
    const first = await service.getTrends();
    first.scamTypes[0].count = 0;

    const second = await service.getTrends();

    expect(second.scamTypes[0]).toEqual({
      category: "call_center",
      count: 45
    });
  });
});

async function callTrendRoute(): Promise<{ statusCode: number; body: any }> {
  return handleTrendRequest(createStaticTrendService());
}
