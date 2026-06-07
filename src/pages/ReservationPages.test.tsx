import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ReservationApi } from "../api/reservations";
import { restaurants } from "../data/restaurants";
import type {
  PublicReservation,
  ReservationRecord
} from "../domain/reservation";
import { PortfolioLanguageProvider } from "../i18n/portfolioLanguage";
import { CounterReservationsPage } from "./CounterReservationsPage";
import { ReservationStatusPage } from "./ReservationStatusPage";
import { ReservePage } from "./ReservePage";

const publicReservation: PublicReservation = {
  restaurantSlug: "shu-xiang",
  date: "2026-06-12",
  time: "18:00",
  partySize: 4,
  seatingArea: "private-room",
  status: "pending",
  createdAt: "2026-06-06T00:00:00.000Z",
  updatedAt: "2026-06-06T00:00:00.000Z"
};

function createApi(overrides: Partial<ReservationApi> = {}): ReservationApi {
  return {
    async availability() {
      return {
        slots: ["18:00", "18:30"],
        maxPartySize: 12,
        privateRoomMaxPartySize: 10
      };
    },
    async createReservation() {
      return { ...publicReservation, statusToken: "status-token" };
    },
    async getReservation() {
      return publicReservation;
    },
    async login() {
      return { role: "owner" };
    },
    async logout() {},
    async listReservations() {
      return [];
    },
    async updateReservation() {
      return publicReservation;
    },
    async getSettings() {
      return {
        restaurantSlug: "shu-xiang",
        timezone: "Pacific/Auckland",
        slotIntervalMinutes: 30,
        minLeadMinutes: 60,
        maxAdvanceDays: 60,
        maxPartySize: 12,
        privateRoomMaxPartySize: 10,
        openingHours: {},
        closureDates: []
      };
    },
    async updateSettings(settings) {
      return settings;
    },
    ...overrides
  };
}

describe("customer reservation pages", () => {
  it("loads available times and creates a pending reservation request", async () => {
    const user = userEvent.setup();
    const createReservation = vi.fn(async () => ({
      ...publicReservation,
      statusToken: "status-token"
    }));
    render(
      <PortfolioLanguageProvider path="/p/shu-xiang/reserve">
        <ReservePage
          profile={restaurants["shu-xiang"]}
          api={createApi({ createReservation })}
        />
      </PortfolioLanguageProvider>
    );

    expect(
      screen.getByText(/demo mode does not send real emails or SMS messages/i)
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Date.*日期/i), "2026-06-12");
    await screen.findByRole("option", { name: "18:00" });
    await user.selectOptions(screen.getByLabelText(/Time.*时间/i), "18:00");
    await user.type(screen.getByLabelText(/Guests.*人数/i), "4");
    await user.type(screen.getByLabelText(/Name.*姓名/i), "王小明");
    await user.type(
      screen.getByLabelText(/Email.*邮箱/i),
      "guest@example.com"
    );
    await user.click(
      screen.getByRole("button", { name: /Request reservation/i })
    );

    expect(createReservation).toHaveBeenCalledWith(
      expect.objectContaining({
        date: "2026-06-12",
        time: "18:00",
        partySize: 4
      })
    );
    expect(
      await screen.findByRole("heading", { name: /Request received/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/does not send real emails or SMS messages/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /View reservation status/i })
    ).toHaveAttribute("href", "/reservation/status-token");
  });

  it("shows a customer-safe reservation status", async () => {
    render(
      <ReservationStatusPage
        statusToken="status-token"
        api={createApi()}
      />
    );

    expect(
      await screen.findByRole("heading", { name: /等待餐厅确认/i })
    ).toBeInTheDocument();
    expect(screen.getByText("2026-06-12")).toBeInTheDocument();
    expect(screen.queryByText("guest@example.com")).not.toBeInTheDocument();
  });
});

describe("merchant reservation dashboard", () => {
  it("shows guest contact details only inside the authenticated counter view", async () => {
    const reservation: ReservationRecord = {
      ...publicReservation,
      id: "reservation-1",
      statusToken: "status-token",
      idempotencyKey: "746a6408-b7f0-43ce-9de5-270d91b74b0d",
      guestName: "王小明",
      email: "guest@example.com",
      notificationPreference: "email"
    };
    render(
      <CounterReservationsPage
        api={createApi({
          async listReservations() {
            return [reservation];
          }
        })}
      />
    );

    expect(await screen.findByText("王小明")).toBeInTheDocument();
    expect(screen.getByText("guest@example.com")).toBeInTheDocument();
    expect(screen.getAllByText(/包间/i).length).toBeGreaterThan(0);
    await waitFor(() =>
      expect(screen.getByText(/刚刚同步|Last synced/i)).toBeInTheDocument()
    );
  });

  it("shows a manual follow-up warning when a notification fails", async () => {
    const reservation: ReservationRecord = {
      ...publicReservation,
      id: "reservation-2",
      statusToken: "status-token",
      idempotencyKey: "846a6408-b7f0-43ce-9de5-270d91b74b0d",
      guestName: "李小华",
      phone: "+64210000000",
      notificationPreference: "sms",
      notificationStatus: "failed",
      notificationError: "SMS provider unavailable"
    };

    render(
      <CounterReservationsPage
        api={createApi({
          async listReservations() {
            return [reservation];
          }
        })}
      />
    );

    expect(
      await screen.findByText(/通知发送失败，请人工联系/i)
    ).toBeInTheDocument();
    expect(screen.getByText("+64210000000")).toBeInTheDocument();
  });
});
