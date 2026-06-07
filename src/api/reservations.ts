import type {
  PublicReservation,
  ReservationConfig,
  ReservationRecord,
  ReservationRequest,
  ReservationStatus
} from "../domain/reservation";

export class ReservationApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

type Availability = {
  slots: string[];
  maxPartySize: number;
  privateRoomMaxPartySize?: number;
};

type CreatedReservation = PublicReservation & {
  statusToken: string;
};

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers
    }
  });
  const body = await response.json() as { error?: string };
  if (!response.ok) {
    throw new ReservationApiError(
      body.error ?? "请求失败，请稍后重试",
      response.status
    );
  }
  return body as T;
}

export type ReservationApi = {
  availability(restaurantSlug: string, date: string): Promise<Availability>;
  createReservation(input: ReservationRequest): Promise<CreatedReservation>;
  getReservation(statusToken: string): Promise<PublicReservation>;
  login(
    mode: "owner" | "staff",
    input: {
      restaurantSlug: string;
      email?: string;
      credential: string;
    }
  ): Promise<{ role: "owner" | "staff" }>;
  logout(): Promise<void>;
  listReservations(scope: string): Promise<ReservationRecord[]>;
  updateReservation(
    id: string,
    status: ReservationStatus,
    assignedResource?: string
  ): Promise<PublicReservation>;
  getSettings(): Promise<ReservationConfig>;
  updateSettings(settings: ReservationConfig): Promise<ReservationConfig>;
};

export const reservationApi: ReservationApi = {
  availability(restaurantSlug, date) {
    const params = new URLSearchParams({ date });
    return requestJson(
      `/api/v1/restaurants/${encodeURIComponent(restaurantSlug)}/availability?${params}`
    );
  },

  createReservation(input) {
    return requestJson("/api/v1/reservations", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  getReservation(statusToken) {
    return requestJson(
      `/api/v1/reservations/${encodeURIComponent(statusToken)}`
    );
  },

  login(mode, input) {
    return requestJson(`/api/v1/auth/${mode}`, {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  async logout() {
    await requestJson("/api/v1/auth/logout", { method: "POST" });
  },

  listReservations(scope) {
    const params = new URLSearchParams({ scope });
    return requestJson(`/api/v1/counter/reservations?${params}`);
  },

  updateReservation(id, status, assignedResource) {
    return requestJson(
      `/api/v1/counter/reservations/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ status, assignedResource })
      }
    );
  },

  getSettings() {
    return requestJson("/api/v1/counter/settings");
  },

  updateSettings(settings) {
    return requestJson("/api/v1/counter/settings", {
      method: "PATCH",
      body: JSON.stringify(settings)
    });
  }
};
