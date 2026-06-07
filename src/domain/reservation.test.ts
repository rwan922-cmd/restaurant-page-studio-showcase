import { describe, expect, it } from "vitest";
import {
  getAvailableSlots,
  reservationRequestSchema,
  validateReservationRequest,
  type ReservationConfig
} from "./reservation";

const config: ReservationConfig = {
  restaurantSlug: "shu-xiang",
  timezone: "Pacific/Auckland",
  slotIntervalMinutes: 30,
  minLeadMinutes: 60,
  maxAdvanceDays: 60,
  maxPartySize: 12,
  privateRoomMaxPartySize: 10,
  openingHours: {
    0: [{ start: "16:00", end: "22:00" }],
    1: [{ start: "16:00", end: "22:00" }],
    2: [{ start: "16:00", end: "22:00" }],
    3: [{ start: "16:00", end: "22:00" }],
    4: [{ start: "16:00", end: "22:00" }],
    5: [{ start: "16:00", end: "23:00" }],
    6: [{ start: "16:00", end: "23:00" }]
  },
  closureDates: ["2026-06-19"]
};

const request = {
  restaurantSlug: "shu-xiang",
  date: "2026-06-12",
  time: "18:00",
  partySize: 4,
  seatingArea: "hall" as const,
  guestName: "王小明",
  email: "guest@example.com",
  notificationPreference: "email" as const,
  notes: "需要儿童椅",
  idempotencyKey: "746a6408-b7f0-43ce-9de5-270d91b74b0d"
};

describe("reservationRequestSchema", () => {
  it("accepts a bilingual-site reservation request with email contact", () => {
    expect(reservationRequestSchema.parse(request)).toMatchObject({
      restaurantSlug: "shu-xiang",
      partySize: 4,
      seatingArea: "hall"
    });
  });

  it("requires the selected notification contact method", () => {
    const result = reservationRequestSchema.safeParse({
      ...request,
      email: undefined,
      phone: "+64 21 555 0123",
      notificationPreference: "email"
    });

    expect(result.success).toBe(false);
  });
});

describe("reservation availability", () => {
  const now = new Date("2026-06-06T10:00:00+12:00");

  it("rejects past dates in Pacific/Auckland", () => {
    const result = validateReservationRequest(
      { ...request, date: "2026-06-05" },
      config,
      now
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toMatch(/过去|past/i);
    }
  });

  it("rejects times outside restaurant opening hours", () => {
    const result = validateReservationRequest(
      { ...request, time: "23:30" },
      config,
      now
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toMatch(/营业|opening/i);
    }
  });

  it("enforces restaurant and private-room party limits", () => {
    expect(
      validateReservationRequest(
        { ...request, partySize: 13 },
        config,
        now
      ).success
    ).toBe(false);
    expect(
      validateReservationRequest(
        {
          ...request,
          partySize: 11,
          seatingArea: "private-room"
        },
        config,
        now
      ).success
    ).toBe(false);
  });

  it("returns configured slots and removes closure dates", () => {
    expect(getAvailableSlots(config, "2026-06-12", now)).toContain("16:00");
    expect(getAvailableSlots(config, "2026-06-12", now)).toContain("22:30");
    expect(getAvailableSlots(config, "2026-06-19", now)).toEqual([]);
  });
});
