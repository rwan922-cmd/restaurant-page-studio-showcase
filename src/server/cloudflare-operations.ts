import {
  getAvailableSlots,
  localDateString,
  reservationConfigSchema,
  type ReservationConfig,
  type ReservationStatus
} from "../domain/reservation";
import {
  createSessionToken,
  verifyCredential,
  verifySessionToken
} from "./auth";
import type { CloudflareEnv } from "./cloudflare-types";
import { D1ReservationRepository } from "./d1-repository";
import { ApiConfigurationError, type ApiOperations } from "./http";
import { createNotifier } from "./notifications";
import {
  createReservationService,
  publicReservation
} from "./reservation-service";

function cookieValue(request: Request, name: string) {
  const cookie = request.headers.get("cookie") ?? "";
  for (const entry of cookie.split(";")) {
    const [key, ...value] = entry.trim().split("=");
    if (key === name) {
      return value.join("=");
    }
  }
  return null;
}

export function createCloudflareOperations(env: CloudflareEnv): ApiOperations {
  const repository = new D1ReservationRepository(env.DB);
  const service = createReservationService({
    repository,
    notifier: createNotifier(env)
  });

  return {
    async availability(restaurantSlug, date) {
      const config = await repository.getConfig(restaurantSlug);
      if (!config) {
        return null;
      }
      return {
        slots: getAvailableSlots(config, date),
        maxPartySize: config.maxPartySize,
        privateRoomMaxPartySize: config.privateRoomMaxPartySize
      };
    },

    async createReservation(input) {
      const reservation = await service.create(input);
      return {
        reservation: publicReservation(reservation),
        statusToken: reservation.statusToken
      };
    },

    async getReservation(token) {
      return service.getPublicStatus(token);
    },

    async login(mode, body, request) {
      const restaurantSlug =
        typeof body.restaurantSlug === "string" ? body.restaurantSlug : "";
      const credential =
        typeof body.credential === "string" ? body.credential : "";
      const email =
        typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      if (!restaurantSlug || !credential) {
        return null;
      }

      const expectedHash =
        mode === "owner"
          ? env.DEMO_OWNER_PASSWORD_HASH
          : env.DEMO_STAFF_PIN_HASH;
      if (
        !env.AUTH_PEPPER ||
        !env.SESSION_SECRET ||
        !expectedHash ||
        (mode === "owner" && !env.DEMO_OWNER_EMAIL)
      ) {
        throw new ApiConfigurationError("商家登录尚未配置");
      }

      const ipAddress =
        request.headers.get("cf-connecting-ip") ??
        request.headers.get("x-forwarded-for") ??
        "unknown";
      const now = new Date();
      const since = new Date(now.getTime() - 15 * 60_000).toISOString();
      if (
        (await repository.countRecentLoginAttempts(
          restaurantSlug,
          ipAddress,
          since
        )) >= 5
      ) {
        return { rateLimited: true };
      }

      const identityMatches =
        mode === "staff" ||
        email === env.DEMO_OWNER_EMAIL.trim().toLowerCase();
      const credentialMatches =
        identityMatches &&
        (await verifyCredential(credential, env.AUTH_PEPPER, expectedHash));

      if (!credentialMatches) {
        await repository.addLoginAttempt(
          crypto.randomUUID(),
          restaurantSlug,
          ipAddress,
          now.toISOString()
        );
        return null;
      }

      await repository.clearLoginAttempts(restaurantSlug, ipAddress);
      const role = mode === "owner" ? "owner" : "staff";
      const token = await createSessionToken(
        {
          restaurantSlug,
          role,
          expiresAt: Math.floor(now.getTime() / 1000) + 8 * 60 * 60
        },
        env.SESSION_SECRET
      );
      return { token, role };
    },

    async session(request) {
      if (!env.SESSION_SECRET) {
        return null;
      }
      const token = cookieValue(request, "reservation_session");
      return token
        ? verifySessionToken(token, env.SESSION_SECRET)
        : null;
    },

    async listReservations(session, scope) {
      const config = await repository.getConfig(session.restaurantSlug);
      const timezone = config?.timezone ?? "Pacific/Auckland";
      return repository.listReservations(
        session.restaurantSlug,
        scope,
        localDateString(new Date(), timezone)
      );
    },

    async updateReservation(id, status, assignedResource, session) {
      const reservation = await service.updateStatus(
        id,
        status as ReservationStatus,
        assignedResource,
        session.restaurantSlug
      );
      return reservation ? publicReservation(reservation) : null;
    },

    async getSettings(session) {
      return repository.getConfig(session.restaurantSlug);
    },

    async updateSettings(session, body) {
      const current = await repository.getConfig(session.restaurantSlug);
      if (!current) {
        throw new Error("找不到餐厅订位设置");
      }
      const config = reservationConfigSchema.parse({
        ...current,
        ...body,
        restaurantSlug: session.restaurantSlug
      }) as ReservationConfig;
      return repository.updateConfig(config);
    }
  };
}
