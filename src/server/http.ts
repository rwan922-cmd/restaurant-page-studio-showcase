import {
  reservationRequestSchema,
  reservationStatusSchema,
  type PublicReservation,
  type ReservationRequest,
  type ReservationStatus
} from "../domain/reservation";
import type { StaffSession } from "./auth";

export class ApiConfigurationError extends Error {}

type AvailabilityResponse = {
  slots: string[];
  maxPartySize: number;
  privateRoomMaxPartySize?: number;
};

type LoginResponse =
  | { token: string; role: StaffSession["role"] }
  | { rateLimited: true }
  | null;

export type ApiOperations = {
  availability(
    restaurantSlug: string,
    date: string
  ): Promise<AvailabilityResponse | null>;
  createReservation(input: ReservationRequest): Promise<{
    reservation: PublicReservation;
    statusToken: string;
  }>;
  getReservation(token: string): Promise<PublicReservation | null>;
  login(
    mode: "owner" | "staff",
    body: Record<string, unknown>,
    request: Request
  ): Promise<LoginResponse>;
  session(request: Request): Promise<StaffSession | null>;
  listReservations(
    session: StaffSession,
    scope: string
  ): Promise<unknown[]>;
  updateReservation(
    id: string,
    status: ReservationStatus,
    assignedResource: string | undefined,
    session: StaffSession
  ): Promise<PublicReservation | null>;
  getSettings(session: StaffSession): Promise<unknown>;
  updateSettings(
    session: StaffSession,
    body: Record<string, unknown>
  ): Promise<unknown>;
};

function json(
  value: unknown,
  init: ResponseInit & { headers?: HeadersInit } = {}
) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(value), { ...init, headers });
}

async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    throw new Error("请求必须使用 JSON 格式");
  }
  return await request.json() as Record<string, unknown>;
}

function sessionCookie(token: string, maxAge = 28_800) {
  return [
    `reservation_session=${token}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "HttpOnly",
    "Secure",
    "SameSite=Strict"
  ].join("; ");
}

export function createHttpHandler(operations: ApiOperations) {
  return async function handle(request: Request) {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);

    try {
      if (
        request.method === "GET" &&
        parts[0] === "api" &&
        parts[1] === "v1" &&
        parts[2] === "restaurants" &&
        parts[4] === "availability" &&
        parts.length === 5
      ) {
        const date = url.searchParams.get("date");
        if (!date) {
          return json({ error: "缺少日期" }, { status: 400 });
        }
        const result = await operations.availability(parts[3], date);
        return result
          ? json(result)
          : json({ error: "该餐厅尚未开放在线订位" }, { status: 404 });
      }

      if (
        request.method === "POST" &&
        url.pathname === "/api/v1/reservations"
      ) {
        const parsed = reservationRequestSchema.safeParse(
          await readJson(request)
        );
        if (!parsed.success) {
          return json(
            {
              error: parsed.error.issues[0]?.message ?? "订位资料无效"
            },
            { status: 400 }
          );
        }
        const result = await operations.createReservation(parsed.data);
        return json(
          {
            ...result.reservation,
            statusToken: result.statusToken
          },
          {
            status: 201,
            headers: {
              location: `/reservation/${result.statusToken}`
            }
          }
        );
      }

      if (
        request.method === "GET" &&
        parts[0] === "api" &&
        parts[1] === "v1" &&
        parts[2] === "reservations" &&
        parts.length === 4
      ) {
        const reservation = await operations.getReservation(parts[3]);
        return reservation
          ? json(reservation)
          : json({ error: "找不到这个订位记录" }, { status: 404 });
      }

      if (
        request.method === "POST" &&
        parts[0] === "api" &&
        parts[1] === "v1" &&
        parts[2] === "auth" &&
        ["owner", "staff"].includes(parts[3])
      ) {
        const result = await operations.login(
          parts[3] as "owner" | "staff",
          await readJson(request),
          request
        );
        if (result && "rateLimited" in result) {
          return json(
            { error: "登录尝试过多，请稍后再试" },
            { status: 429 }
          );
        }
        if (!result) {
          return json({ error: "登录资料不正确" }, { status: 401 });
        }
        return json(
          { role: result.role },
          {
            headers: {
              "set-cookie": sessionCookie(result.token)
            }
          }
        );
      }

      if (
        request.method === "POST" &&
        url.pathname === "/api/v1/auth/logout"
      ) {
        return json(
          { ok: true },
          {
            headers: {
              "set-cookie": sessionCookie("", 0)
            }
          }
        );
      }

      if (url.pathname.startsWith("/api/v1/counter/")) {
        const session = await operations.session(request);
        if (!session) {
          return json({ error: "请先登录商家工作台" }, { status: 401 });
        }

        if (
          request.method === "GET" &&
          url.pathname === "/api/v1/counter/reservations"
        ) {
          const scope = url.searchParams.get("scope") ?? "today";
          return json(await operations.listReservations(session, scope));
        }

        if (
          request.method === "PATCH" &&
          parts[3] === "reservations" &&
          parts.length === 5
        ) {
          const body = await readJson(request);
          const status = reservationStatusSchema.safeParse(body.status);
          if (!status.success) {
            return json({ error: "订位状态无效" }, { status: 400 });
          }
          const assignedResource =
            typeof body.assignedResource === "string"
              ? body.assignedResource.trim().slice(0, 80) || undefined
              : undefined;
          const reservation = await operations.updateReservation(
            parts[4],
            status.data,
            assignedResource,
            session
          );
          return reservation
            ? json(reservation)
            : json({ error: "找不到这个订位记录" }, { status: 404 });
        }

        if (
          request.method === "GET" &&
          url.pathname === "/api/v1/counter/settings"
        ) {
          return json(await operations.getSettings(session));
        }

        if (
          request.method === "PATCH" &&
          url.pathname === "/api/v1/counter/settings"
        ) {
          if (session.role !== "owner") {
            return json({ error: "只有店主可以修改订位设置" }, { status: 403 });
          }
          return json(
            await operations.updateSettings(session, await readJson(request))
          );
        }
      }

      return json({ error: "API route not found" }, { status: 404 });
    } catch (error) {
      return json(
        {
          error: error instanceof Error ? error.message : "服务器暂时无法处理请求"
        },
        { status: error instanceof ApiConfigurationError ? 503 : 400 }
      );
    }
  };
}
