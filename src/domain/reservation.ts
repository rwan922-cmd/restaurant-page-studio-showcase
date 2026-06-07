import { z } from "zod";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式必须为 YYYY-MM-DD");

const timeSchema = z
  .string()
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "时间格式必须为 HH:mm");

export const reservationStatusSchema = z.enum([
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
  "seated",
  "no-show"
]);

export const reservationRequestSchema = z
  .object({
    restaurantSlug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "餐厅标识无效"),
    date: dateSchema,
    time: timeSchema,
    partySize: z.number().int().min(1).max(50),
    seatingArea: z.enum(["hall", "private-room"]),
    guestName: z.string().trim().min(1).max(80),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().min(7).max(30).optional(),
    notificationPreference: z.enum(["email", "sms"]),
    notes: z.string().trim().max(500).optional(),
    idempotencyKey: z.string().uuid()
  })
  .superRefine((value, context) => {
    if (value.notificationPreference === "email" && !value.email) {
      context.addIssue({
        code: "custom",
        path: ["email"],
        message: "选择邮件通知时必须填写邮箱"
      });
    }
    if (value.notificationPreference === "sms" && !value.phone) {
      context.addIssue({
        code: "custom",
        path: ["phone"],
        message: "选择短信通知时必须填写手机号"
      });
    }
  });

const openingIntervalSchema = z.object({
  start: timeSchema,
  end: timeSchema
});

export const reservationConfigSchema = z.object({
  restaurantSlug: z.string().min(1),
  timezone: z.string().min(1),
  slotIntervalMinutes: z.number().int().min(15).max(120),
  minLeadMinutes: z.number().int().min(0).max(10080),
  maxAdvanceDays: z.number().int().min(1).max(365),
  maxPartySize: z.number().int().min(1).max(100),
  privateRoomMaxPartySize: z.number().int().min(1).max(100),
  hallCapacity: z.number().int().min(1).max(500).optional(),
  privateRoomCount: z.number().int().min(0).max(100).optional(),
  reservationDurationMinutes: z.number().int().min(30).max(480).optional(),
  openingHours: z.record(
    z.string().regex(/^[0-6]$/),
    z.array(openingIntervalSchema).max(4)
  ),
  closureDates: z.array(dateSchema)
});

export type ReservationRequest = z.infer<typeof reservationRequestSchema>;
export type ReservationStatus = z.infer<typeof reservationStatusSchema>;
export type ReservationConfig = z.infer<typeof reservationConfigSchema>;

export type ReservationRecord = ReservationRequest & {
  id: string;
  statusToken: string;
  status: ReservationStatus;
  assignedResource?: string;
  notificationStatus?: NotificationLog["status"];
  notificationError?: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicReservation = Pick<
  ReservationRecord,
  | "restaurantSlug"
  | "date"
  | "time"
  | "partySize"
  | "seatingArea"
  | "status"
  | "assignedResource"
  | "createdAt"
  | "updatedAt"
>;

export type NotificationLog = {
  id: string;
  reservationId: string;
  channel: "email" | "sms";
  event: "received" | "status-change";
  status: "sent" | "failed" | "skipped";
  error?: string;
  createdAt: string;
};

export type ReservationValidationResult =
  | { success: true }
  | { success: false; message: string };

function localParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-NZ", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

export function localDateString(date: Date, timezone: string) {
  const parts = localParts(date, timezone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function dayOfWeek(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function minutesFromTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function timeFromMinutes(total: number) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function timezoneOffsetMs(date: Date, timezone: string) {
  const parts = localParts(date, timezone);
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute)
  );
  return asUtc - date.getTime();
}

function zonedDateTime(date: string, time: string, timezone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  let offset = timezoneOffsetMs(new Date(guess), timezone);
  let result = guess - offset;
  const correctedOffset = timezoneOffsetMs(new Date(result), timezone);
  if (correctedOffset !== offset) {
    offset = correctedOffset;
    result = guess - offset;
  }
  return new Date(result);
}

function addDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + days));
  return value.toISOString().slice(0, 10);
}

export function getAvailableSlots(
  config: ReservationConfig,
  date: string,
  now = new Date()
) {
  if (config.closureDates.includes(date)) {
    return [];
  }

  const today = localDateString(now, config.timezone);
  if (date < today || date > addDays(today, config.maxAdvanceDays)) {
    return [];
  }

  const intervals = config.openingHours[String(dayOfWeek(date))] ?? [];
  const earliest = now.getTime() + config.minLeadMinutes * 60_000;
  const slots: string[] = [];

  for (const interval of intervals) {
    const start = minutesFromTime(interval.start);
    const end = minutesFromTime(interval.end);
    for (
      let minute = start;
      minute < end;
      minute += config.slotIntervalMinutes
    ) {
      const time = timeFromMinutes(minute);
      if (zonedDateTime(date, time, config.timezone).getTime() >= earliest) {
        slots.push(time);
      }
    }
  }

  return slots;
}

export function validateReservationRequest(
  input: unknown,
  config: ReservationConfig,
  now = new Date()
): ReservationValidationResult {
  const parsed = reservationRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "订位资料无效"
    };
  }

  const request = parsed.data;
  const today = localDateString(now, config.timezone);
  if (request.date < today) {
    return { success: false, message: "不能选择过去的日期 / Past dates are unavailable" };
  }
  if (request.date > addDays(today, config.maxAdvanceDays)) {
    return { success: false, message: "选择的日期超过可预订范围" };
  }
  if (request.partySize > config.maxPartySize) {
    return { success: false, message: "人数超过餐厅在线订位上限" };
  }
  if (
    request.seatingArea === "private-room" &&
    request.partySize > config.privateRoomMaxPartySize
  ) {
    return { success: false, message: "人数超过包间容量" };
  }
  if (!getAvailableSlots(config, request.date, now).includes(request.time)) {
    return {
      success: false,
      message: "所选时间不在营业或可预订时段 / Outside opening hours"
    };
  }

  return { success: true };
}
