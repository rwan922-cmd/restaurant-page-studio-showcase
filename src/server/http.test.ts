import { describe, expect, it } from "vitest";
import type {
  PublicReservation,
  ReservationRequest,
  ReservationStatus
} from "../domain/reservation";
import {
  ApiConfigurationError,
  createHttpHandler,
  type ApiOperations
} from "./http";

const requestBody: ReservationRequest = {
  restaurantSlug: "shu-xiang",
  date: "2026-06-12",
  time: "18:00",
  partySize: 4,
  seatingArea: "hall",
  guestName: "王小明",
  email: "guest@example.com",
  notificationPreference: "email",
  idempotencyKey: "746a6408-b7f0-43ce-9de5-270d91b74b0d"
};

const publicRecord: PublicReservation = {
  restaurantSlug: "shu-xiang",
  date: "2026-06-12",
  time: "18:00",
  partySize: 4,
  seatingArea: "hall",
  status: "pending",
  createdAt: "2026-06-06T00:00:00.000Z",
  updatedAt: "2026-06-06T00:00:00.000Z"
};

function operations(overrides: Partial<ApiOperations> = {}): ApiOperations {
  return {
    async availability() {
      return { slots: ["18:00", "18:30"], maxPartySize: 12 };
    },
    async createReservation() {
      return { reservation: publicRecord, statusToken: "status-token" };
    },
    async getReservation() {
      return publicRecord;
    },
    async login() {
      return { token: "session-token", role: "owner" };
    },
    async session() {
      return null;
    },
    async listReservations() {
      return [];
    },
    async updateReservation(
      _id: string,
      status: ReservationStatus,
      assignedResource?: string
    ) {
      return { ...publicRecord, status, assignedResource };
    },
    async getSettings() {
      return { restaurantSlug: "shu-xiang" };
    },
    async updateSettings() {
      return { restaurantSlug: "shu-xiang" };
    },
    ...overrides
  };
}

describe("reservation HTTP API", () => {
  it("creates a reservation without echoing guest contact details", async () => {
    const handler = createHttpHandler(operations());
    const response = await handler(
      new Request("https://example.com/api/v1/reservations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody)
      })
    );
    const body = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(201);
    expect(response.headers.get("location")).toBe(
      "/reservation/status-token"
    );
    expect(body.statusToken).toBe("status-token");
    expect(body).not.toHaveProperty("email");
    expect(body).not.toHaveProperty("phone");
    expect(body).not.toHaveProperty("guestName");
  });

  it("requires a merchant session for counter data", async () => {
    const handler = createHttpHandler(operations());
    const response = await handler(
      new Request("https://example.com/api/v1/counter/reservations")
    );

    expect(response.status).toBe(401);
  });

  it("rejects invalid reservation status updates", async () => {
    const handler = createHttpHandler(
      operations({
        async session() {
          return {
            restaurantSlug: "shu-xiang",
            role: "owner",
            expiresAt: 1_800_000_000
          };
        }
      })
    );
    const response = await handler(
      new Request(
        "https://example.com/api/v1/counter/reservations/reservation-1",
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status: "cooking" })
        }
      )
    );

    expect(response.status).toBe(400);
  });

  it("sets a secure session cookie after merchant login", async () => {
    const handler = createHttpHandler(operations());
    const response = await handler(
      new Request("https://example.com/api/v1/auth/owner", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          restaurantSlug: "shu-xiang",
          email: "owner@example.com",
          credential: "secret"
        })
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toMatch(
      /reservation_session=session-token.*HttpOnly.*Secure.*SameSite=Strict/i
    );
  });

  it("returns service unavailable when merchant auth is not configured", async () => {
    const handler = createHttpHandler(
      operations({
        async login() {
          throw new ApiConfigurationError("商家登录尚未配置");
        }
      })
    );
    const response = await handler(
      new Request("https://example.com/api/v1/auth/owner", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          restaurantSlug: "shu-xiang",
          email: "owner@example.com",
          credential: "secret"
        })
      })
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: "商家登录尚未配置"
    });
  });
});
