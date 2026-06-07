import { describe, expect, it } from "vitest";
import type {
  NotificationLog,
  ReservationConfig,
  ReservationRecord,
  ReservationRequest,
  ReservationStatus
} from "../domain/reservation";
import {
  createReservationService,
  publicReservation
} from "./reservation-service";

const config: ReservationConfig = {
  restaurantSlug: "shu-xiang",
  timezone: "Pacific/Auckland",
  slotIntervalMinutes: 30,
  minLeadMinutes: 0,
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
  closureDates: []
};

const request: ReservationRequest = {
  restaurantSlug: "shu-xiang",
  date: "2026-06-12",
  time: "18:00",
  partySize: 4,
  seatingArea: "private-room",
  guestName: "王小明",
  email: "guest@example.com",
  notificationPreference: "email",
  notes: "需要儿童椅",
  idempotencyKey: "746a6408-b7f0-43ce-9de5-270d91b74b0d"
};

function createMemoryRepository() {
  const reservations: ReservationRecord[] = [];
  const notifications: NotificationLog[] = [];

  return {
    reservations,
    notifications,
    async getConfig() {
      return config;
    },
    async findByIdempotencyKey(restaurantSlug: string, key: string) {
      return (
        reservations.find(
          (item) =>
            item.restaurantSlug === restaurantSlug &&
            item.idempotencyKey === key
        ) ?? null
      );
    },
    async create(record: ReservationRecord) {
      reservations.push(record);
      return record;
    },
    async findByStatusToken(token: string) {
      return reservations.find((item) => item.statusToken === token) ?? null;
    },
    async updateStatus(
      id: string,
      status: ReservationStatus,
      assignedResource?: string
    ) {
      const record = reservations.find((item) => item.id === id);
      if (!record) {
        return null;
      }
      record.status = status;
      record.assignedResource = assignedResource;
      return record;
    },
    async addNotification(log: NotificationLog) {
      notifications.push(log);
    }
  };
}

describe("reservation service", () => {
  it("creates one pending reservation for duplicate submissions", async () => {
    const repository = createMemoryRepository();
    let sends = 0;
    const service = createReservationService({
      repository,
      notifier: {
        async send() {
          sends += 1;
          return "sent";
        }
      },
      now: () => new Date("2026-06-06T10:00:00+12:00"),
      createId: () => "reservation-1",
      createToken: () => "status-token-1"
    });

    const first = await service.create(request);
    const duplicate = await service.create(request);

    expect(first.id).toBe("reservation-1");
    expect(first.status).toBe("pending");
    expect(duplicate.id).toBe(first.id);
    expect(repository.reservations).toHaveLength(1);
    expect(sends).toBe(1);
  });

  it("keeps the reservation when a notification provider fails", async () => {
    const repository = createMemoryRepository();
    const service = createReservationService({
      repository,
      notifier: {
        async send() {
          throw new Error("provider unavailable");
        }
      },
      now: () => new Date("2026-06-06T10:00:00+12:00"),
      createId: () => "reservation-2",
      createToken: () => "status-token-2"
    });

    const result = await service.create(request);

    expect(result.status).toBe("pending");
    expect(repository.reservations).toHaveLength(1);
    expect(repository.notifications[0]).toMatchObject({
      reservationId: "reservation-2",
      status: "failed"
    });
  });

  it("records demo notifications as skipped", async () => {
    const repository = createMemoryRepository();
    const service = createReservationService({
      repository,
      notifier: {
        async send() {
          return "skipped" as const;
        }
      },
      now: () => new Date("2026-06-06T10:00:00+12:00"),
      createId: () => "reservation-demo",
      createToken: () => "status-token-demo"
    });

    const result = await service.create(request);

    expect(result.status).toBe("pending");
    expect(repository.notifications[0]).toMatchObject({
      reservationId: "reservation-demo",
      status: "skipped"
    });
  });

  it("returns a public status without guest contact details", () => {
    const publicRecord = publicReservation({
      ...request,
      id: "reservation-3",
      statusToken: "status-token-3",
      status: "confirmed",
      assignedResource: "包间 2",
      createdAt: "2026-06-06T00:00:00.000Z",
      updatedAt: "2026-06-06T00:00:00.000Z"
    });

    expect(publicRecord.status).toBe("confirmed");
    expect(publicRecord.assignedResource).toBe("包间 2");
    expect("email" in publicRecord).toBe(false);
    expect("phone" in publicRecord).toBe(false);
    expect("guestName" in publicRecord).toBe(false);
  });
});
