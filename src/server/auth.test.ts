import { describe, expect, it } from "vitest";
import {
  createSessionToken,
  hashCredential,
  verifyCredential,
  verifySessionToken
} from "./auth";

describe("merchant authentication", () => {
  it("hashes and verifies passwords and staff PINs", async () => {
    const hash = await hashCredential("4286", "test-pepper");

    expect(hash).not.toContain("4286");
    expect(hash).toMatch(/^v1\$100000\$/);
    await expect(
      verifyCredential("4286", "test-pepper", hash)
    ).resolves.toBe(true);
    await expect(
      verifyCredential("0000", "test-pepper", hash)
    ).resolves.toBe(false);
  });

  it("signs sessions and rejects expired or modified tokens", async () => {
    const token = await createSessionToken(
      {
        restaurantSlug: "shu-xiang",
        role: "staff",
        expiresAt: 1_800_000_000
      },
      "session-secret"
    );

    await expect(
      verifySessionToken(token, "session-secret", 1_700_000_000)
    ).resolves.toMatchObject({
      restaurantSlug: "shu-xiang",
      role: "staff"
    });
    await expect(
      verifySessionToken(`${token}changed`, "session-secret", 1_700_000_000)
    ).resolves.toBeNull();
    await expect(
      verifySessionToken(token, "session-secret", 1_900_000_000)
    ).resolves.toBeNull();
  });
});
