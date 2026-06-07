import {
  validateReservationRequest,
  type NotificationLog,
  type PublicReservation,
  type ReservationConfig,
  type ReservationRecord,
  type ReservationRequest,
  type ReservationStatus
} from "../domain/reservation";

export type ReservationRepository = {
  getConfig(restaurantSlug: string): Promise<ReservationConfig | null>;
  findByIdempotencyKey(
    restaurantSlug: string,
    key: string
  ): Promise<ReservationRecord | null>;
  create(record: ReservationRecord): Promise<ReservationRecord>;
  findByStatusToken(token: string): Promise<ReservationRecord | null>;
  updateStatus(
    id: string,
    status: ReservationStatus,
    assignedResource?: string,
    restaurantSlug?: string
  ): Promise<ReservationRecord | null>;
  addNotification(log: NotificationLog): Promise<void>;
  purgeExpired?(before: string): Promise<void>;
};

export type ReservationNotifier = {
  send(
    reservation: ReservationRecord,
    event: NotificationLog["event"]
  ): Promise<"sent" | "skipped">;
};

type ReservationServiceDependencies = {
  repository: ReservationRepository;
  notifier: ReservationNotifier;
  now?: () => Date;
  createId?: () => string;
  createToken?: () => string;
};

function randomToken() {
  return crypto.randomUUID().replaceAll("-", "");
}

export function publicReservation(
  reservation: ReservationRecord
): PublicReservation {
  return {
    restaurantSlug: reservation.restaurantSlug,
    date: reservation.date,
    time: reservation.time,
    partySize: reservation.partySize,
    seatingArea: reservation.seatingArea,
    status: reservation.status,
    assignedResource: reservation.assignedResource,
    createdAt: reservation.createdAt,
    updatedAt: reservation.updatedAt
  };
}

export function createReservationService({
  repository,
  notifier,
  now = () => new Date(),
  createId = () => crypto.randomUUID(),
  createToken = randomToken
}: ReservationServiceDependencies) {
  async function recordNotification(
    reservation: ReservationRecord,
    event: NotificationLog["event"]
  ) {
    const createdAt = now().toISOString();
    try {
      const status = await notifier.send(reservation, event);
      await repository.addNotification({
        id: createId(),
        reservationId: reservation.id,
        channel: reservation.notificationPreference,
        event,
        status,
        createdAt
      });
    } catch (error) {
      await repository.addNotification({
        id: createId(),
        reservationId: reservation.id,
        channel: reservation.notificationPreference,
        event,
        status: "failed",
        error: error instanceof Error ? error.message : "notification failed",
        createdAt
      });
    }
  }

  return {
    async create(input: ReservationRequest) {
      const config = await repository.getConfig(input.restaurantSlug);
      if (!config) {
        throw new Error("该餐厅尚未开放在线订位");
      }

      const validation = validateReservationRequest(input, config, now());
      if (!validation.success) {
        throw new Error(validation.message);
      }

      await repository.purgeExpired?.(
        new Date(now().getTime() - 90 * 24 * 60 * 60_000).toISOString()
      );

      const existing = await repository.findByIdempotencyKey(
        input.restaurantSlug,
        input.idempotencyKey
      );
      if (existing) {
        return existing;
      }

      const timestamp = now().toISOString();
      const reservation = await repository.create({
        ...input,
        id: createId(),
        statusToken: createToken(),
        status: "pending",
        createdAt: timestamp,
        updatedAt: timestamp
      });
      await recordNotification(reservation, "received");
      return reservation;
    },

    async getPublicStatus(token: string) {
      const reservation = await repository.findByStatusToken(token);
      return reservation ? publicReservation(reservation) : null;
    },

    async updateStatus(
      id: string,
      status: ReservationStatus,
      assignedResource?: string,
      restaurantSlug?: string
    ) {
      const reservation = await repository.updateStatus(
        id,
        status,
        assignedResource,
        restaurantSlug
      );
      if (!reservation) {
        return null;
      }
      await recordNotification(reservation, "status-change");
      return reservation;
    }
  };
}
