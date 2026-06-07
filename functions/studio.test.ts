import { describe, expect, it } from "vitest";
import { onRequest } from "./studio";

describe("production Studio route", () => {
  it("always returns not found", async () => {
    const response = await onRequest();

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
