import {
  reservationConfigSchema,
  type NotificationLog,
  type ReservationConfig,
  type ReservationRecord,
  type ReservationStatus
} from "../domain/reservation";
import type { D1Database } from "./cloudflare-types";
import type { ReservationRepository } from "./reservation-service";

type ReservationRow = {
  id: string;
  restaurant_slug: string;
  status_token: string;
  idempotency_key: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  seating_area: "hall" | "private-room";
  guest_name: string;
  email: string | null;
  phone: string | null;
  notification_preference: "email" | "sms";
  notes: string | null;
  status: ReservationStatus;
  assigned_resource: string | null;
  notification_status: NotificationLog["status"] | null;
  notification_error: string | null;
  created_at: string;
  updated_at: string;
};

type ConfigRow = {
  restaurant_slug: string;
  timezone: string;
  slot_interval_minutes: number;
  min_lead_minutes: number;
  max_advance_days: number;
  max_party_size: number;
  private_room_max_party_size: number;
  hall_capacity: number | null;
  private_room_count: number | null;
  reservation_duration_minutes: number | null;
  opening_hours_json: string;
  closure_dates_json: string;
};

function mapReservation(row: ReservationRow): ReservationRecord {
  return {
    id: row.id,
    restaurantSlug: row.restaurant_slug,
    statusToken: row.status_token,
    idempotencyKey: row.idempotency_key,
    date: row.reservation_date,
    time: row.reservation_time,
    partySize: row.party_size,
    seatingArea: row.seating_area,
    guestName: row.guest_name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    notificationPreference: row.notification_preference,
    notes: row.notes ?? undefined,
    status: row.status,
    assignedResource: row.assigned_resource ?? undefined,
    notificationStatus: row.notification_status ?? undefined,
    notificationError: row.notification_error ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapConfig(row: ConfigRow): ReservationConfig {
  return reservationConfigSchema.parse({
    restaurantSlug: row.restaurant_slug,
    timezone: row.timezone,
    slotIntervalMinutes: row.slot_interval_minutes,
    minLeadMinutes: row.min_lead_minutes,
    maxAdvanceDays: row.max_advance_days,
    maxPartySize: row.max_party_size,
    privateRoomMaxPartySize: row.private_room_max_party_size,
    hallCapacity: row.hall_capacity ?? undefined,
    privateRoomCount: row.private_room_count ?? undefined,
    reservationDurationMinutes: row.reservation_duration_minutes ?? undefined,
    openingHours: JSON.parse(row.opening_hours_json),
    closureDates: JSON.parse(row.closure_dates_json)
  });
}

const reservationColumns = `
  id, restaurant_slug, status_token, idempotency_key, reservation_date,
  reservation_time, party_size, seating_area, guest_name, email, phone,
  notification_preference, notes, status, assigned_resource, created_at,
  updated_at, notification_status, notification_error
`;

export class D1ReservationRepository implements ReservationRepository {
  constructor(private readonly database: D1Database) {}

  async getConfig(restaurantSlug: string) {
    const row = await this.database
      .prepare("SELECT * FROM reservation_configs WHERE restaurant_slug = ?")
      .bind(restaurantSlug)
      .first<ConfigRow>();
    return row ? mapConfig(row) : null;
  }

  async findByIdempotencyKey(restaurantSlug: string, key: string) {
    const row = await this.database
      .prepare(
        `SELECT ${reservationColumns} FROM reservations
         WHERE restaurant_slug = ? AND idempotency_key = ?`
      )
      .bind(restaurantSlug, key)
      .first<ReservationRow>();
    return row ? mapReservation(row) : null;
  }

  async create(record: ReservationRecord) {
    await this.database
      .prepare(
        `INSERT INTO reservations (
          ${reservationColumns}
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        record.id,
        record.restaurantSlug,
        record.statusToken,
        record.idempotencyKey,
        record.date,
        record.time,
        record.partySize,
        record.seatingArea,
        record.guestName,
        record.email ?? null,
        record.phone ?? null,
        record.notificationPreference,
        record.notes ?? null,
        record.status,
        record.assignedResource ?? null,
        record.createdAt,
        record.updatedAt,
        record.notificationStatus ?? null,
        record.notificationError ?? null
      )
      .run();
    return record;
  }

  async findByStatusToken(token: string) {
    const row = await this.database
      .prepare(
        `SELECT ${reservationColumns} FROM reservations WHERE status_token = ?`
      )
      .bind(token)
      .first<ReservationRow>();
    return row ? mapReservation(row) : null;
  }

  async updateStatus(
    id: string,
    status: ReservationStatus,
    assignedResource?: string,
    restaurantSlug?: string
  ) {
    const updatedAt = new Date().toISOString();
    const tenantClause = restaurantSlug ? " AND restaurant_slug = ?" : "";
    const statement = this.database
      .prepare(
        `UPDATE reservations
         SET status = ?, assigned_resource = ?, updated_at = ?
         WHERE id = ?${tenantClause}`
      )
      .bind(
        status,
        assignedResource ?? null,
        updatedAt,
        id,
        ...(restaurantSlug ? [restaurantSlug] : [])
      );
    await statement.run();

    const row = await this.database
      .prepare(
        `SELECT ${reservationColumns} FROM reservations
         WHERE id = ?${tenantClause}`
      )
      .bind(id, ...(restaurantSlug ? [restaurantSlug] : []))
      .first<ReservationRow>();
    return row ? mapReservation(row) : null;
  }

  async addNotification(log: NotificationLog) {
    await this.database
      .prepare(
        `INSERT INTO notification_logs (
          id, reservation_id, channel, event, status, error, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        log.id,
        log.reservationId,
        log.channel,
        log.event,
        log.status,
        log.error ?? null,
        log.createdAt
      )
      .run();
    await this.database
      .prepare(
        `UPDATE reservations
         SET notification_status = ?, notification_error = ?
         WHERE id = ?`
      )
      .bind(log.status, log.error ?? null, log.reservationId)
      .run();
  }

  async purgeExpired(before: string) {
    await this.database
      .prepare(
        `DELETE FROM notification_logs
         WHERE reservation_id IN (
           SELECT id FROM reservations WHERE created_at < ?
         )`
      )
      .bind(before)
      .run();
    await this.database
      .prepare("DELETE FROM reservations WHERE created_at < ?")
      .bind(before)
      .run();
    await this.database
      .prepare("DELETE FROM login_attempts WHERE created_at < ?")
      .bind(before)
      .run();
  }

  async listReservations(
    restaurantSlug: string,
    scope: string,
    today: string
  ) {
    let condition = "reservation_date = ?";
    let value = today;
    if (scope === "pending") {
      condition = "status = ?";
      value = "pending";
    } else if (scope === "confirmed") {
      condition = "status = ?";
      value = "confirmed";
    } else if (scope === "history") {
      condition =
        "(reservation_date < ? OR status IN ('rejected', 'cancelled', 'seated', 'no-show'))";
    }

    const result = await this.database
      .prepare(
        `SELECT ${reservationColumns} FROM reservations
         WHERE restaurant_slug = ? AND ${condition}
         ORDER BY reservation_date DESC, reservation_time DESC
         LIMIT 250`
      )
      .bind(restaurantSlug, value)
      .all<ReservationRow>();
    return (result.results ?? []).map(mapReservation);
  }

  async updateConfig(config: ReservationConfig) {
    await this.database
      .prepare(
        `UPDATE reservation_configs SET
          timezone = ?, slot_interval_minutes = ?, min_lead_minutes = ?,
          max_advance_days = ?, max_party_size = ?,
          private_room_max_party_size = ?, hall_capacity = ?,
          private_room_count = ?, reservation_duration_minutes = ?,
          opening_hours_json = ?, closure_dates_json = ?,
          updated_at = ?
         WHERE restaurant_slug = ?`
      )
      .bind(
        config.timezone,
        config.slotIntervalMinutes,
        config.minLeadMinutes,
        config.maxAdvanceDays,
        config.maxPartySize,
        config.privateRoomMaxPartySize,
        config.hallCapacity ?? null,
        config.privateRoomCount ?? null,
        config.reservationDurationMinutes ?? null,
        JSON.stringify(config.openingHours),
        JSON.stringify(config.closureDates),
        new Date().toISOString(),
        config.restaurantSlug
      )
      .run();
    return config;
  }

  async countRecentLoginAttempts(
    restaurantSlug: string,
    ipAddress: string,
    since: string
  ) {
    const row = await this.database
      .prepare(
        `SELECT COUNT(*) AS count FROM login_attempts
         WHERE restaurant_slug = ? AND ip_address = ? AND created_at >= ?`
      )
      .bind(restaurantSlug, ipAddress, since)
      .first<{ count: number }>();
    return Number(row?.count ?? 0);
  }

  async addLoginAttempt(
    id: string,
    restaurantSlug: string,
    ipAddress: string,
    createdAt: string
  ) {
    await this.database
      .prepare(
        `INSERT INTO login_attempts (
          id, restaurant_slug, ip_address, created_at
        ) VALUES (?, ?, ?, ?)`
      )
      .bind(id, restaurantSlug, ipAddress, createdAt)
      .run();
  }

  async clearLoginAttempts(restaurantSlug: string, ipAddress: string) {
    await this.database
      .prepare(
        "DELETE FROM login_attempts WHERE restaurant_slug = ? AND ip_address = ?"
      )
      .bind(restaurantSlug, ipAddress)
      .run();
  }
}
