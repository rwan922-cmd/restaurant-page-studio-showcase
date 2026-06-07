import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  reservationApi,
  type ReservationApi
} from "../api/reservations";
import { MobileActionDock } from "../components/MobileActionDock";
import type { RestaurantProfile } from "../domain/restaurant";
import { localDateString } from "../domain/reservation";
import {
  LanguageToggle,
  usePortfolioLanguage
} from "../i18n/portfolioLanguage";

type ReservePageProps = {
  profile: RestaurantProfile;
  api?: ReservationApi;
};

function idempotencyKey() {
  return crypto.randomUUID?.() ??
    `${Date.now()}-0000-4000-8000-${Math.random().toString(16).slice(2)}`;
}

export function ReservePage({
  profile,
  api = reservationApi
}: ReservePageProps) {
  const { language } = usePortfolioLanguage();
  const isEnglish = language === "en";
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [limits, setLimits] = useState({
    maxPartySize: 12,
    privateRoomMaxPartySize: 10
  });
  const [seatingArea, setSeatingArea] = useState<"hall" | "private-room">(
    "hall"
  );
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notificationPreference, setNotificationPreference] = useState<
    "email" | "sms"
  >("email");
  const [error, setError] = useState("");
  const [statusToken, setStatusToken] = useState("");
  const idempotency = useRef(idempotencyKey());
  const today = localDateString(new Date(), "Pacific/Auckland");

  useEffect(() => {
    if (!date) {
      setSlots([]);
      return;
    }

    let active = true;
    setLoadingSlots(true);
    setError("");
    api
      .availability(profile.slug, date)
      .then((result) => {
        if (active) {
          setSlots(result.slots);
          setLimits({
            maxPartySize: result.maxPartySize,
            privateRoomMaxPartySize:
              result.privateRoomMaxPartySize ?? result.maxPartySize
          });
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setSlots([]);
          setError(
            reason instanceof Error
              ? reason.message
              : isEnglish
                ? "Reservation times are unavailable right now."
                : "暂时无法读取可订时间"
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoadingSlots(false);
        }
      });

    return () => {
      active = false;
    };
  }, [api, date, isEnglish, profile.slug]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);

    try {
      const result = await api.createReservation({
        restaurantSlug: profile.slug,
        date: String(form.get("date") ?? ""),
        time: String(form.get("time") ?? ""),
        partySize: Number(form.get("partySize")),
        seatingArea,
        guestName: String(form.get("guestName") ?? ""),
        email:
          notificationPreference === "email"
            ? String(form.get("email") ?? "")
            : undefined,
        phone:
          notificationPreference === "sms"
            ? String(form.get("phone") ?? "")
            : undefined,
        notificationPreference,
        notes: String(form.get("notes") ?? "") || undefined,
        idempotencyKey: idempotency.current
      });
      setStatusToken(result.statusToken);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : isEnglish
            ? "The reservation request could not be submitted. Please try again."
            : "订位提交失败，请稍后重试"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (statusToken) {
    return (
      <main
        id="main-content"
        className={`reservation-page theme-${profile.theme}`}
      >
        <section className="reservation-result" role="status">
          <LanguageToggle />
          <p>{isEnglish ? profile.nameEn : `${profile.nameZh} · ${profile.nameEn}`}</p>
          <h1>
            {isEnglish ? "Request received" : "等待餐厅确认"}
            <span>{isEnglish ? "等待餐厅确认" : "Request received"}</span>
          </h1>
          <p>
            {isEnglish
              ? "The reservation request has been saved. This safe demo does not send real emails or SMS messages. Use the private link below to check the status."
              : "订位请求已经保存。这是安全演示，不会发送真实邮件或短信，请使用下方链接查询状态。"}
          </p>
          <a
            className="button button--primary"
            href={`/reservation/${statusToken}`}
          >
            {isEnglish ? "View reservation status" : "查看订位状态"}
          </a>
        </section>
        <MobileActionDock profile={profile} current="reserve" />
      </main>
    );
  }

  return (
    <main
      id="main-content"
      className={`reservation-page theme-${profile.theme}`}
    >
      <header className="reservation-hero">
        <div className="reservation-hero__toolbar">
          <LanguageToggle />
        </div>
        <a href={`/p/${profile.slug}`}>
          {isEnglish ? "Back to restaurant home" : "返回餐厅主页"}
        </a>
        <p>{isEnglish ? profile.nameEn : `${profile.nameZh} · ${profile.nameEn}`}</p>
        <h1>
          {isEnglish ? "Reserve a table" : "预定座位"}
          <span>{isEnglish ? "预定座位" : "Reserve a table"}</span>
        </h1>
        <p>
          {isEnglish
            ? "The restaurant confirms each request manually. Your table is not held until confirmation."
            : "提交后由餐厅确认。收到确认通知前，座位尚未保留。"}
        </p>
      </header>

      <form className="reservation-form" onSubmit={submit}>
        <div className="reservation-form__grid">
          <label>
            {isEnglish ? "Date / 日期" : "日期 / Date"}
            <input
              name="date"
              type="date"
              min={today}
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </label>
          <label>
            {isEnglish ? "Time / 时间" : "时间 / Time"}
            <select
              name="time"
              required
              defaultValue=""
              disabled={!date || loadingSlots}
            >
              <option value="" disabled>
                {loadingSlots
                  ? isEnglish
                    ? "Loading available times"
                    : "正在读取可订时间"
                  : slots.length
                    ? isEnglish
                      ? "Choose a time"
                      : "选择时间"
                    : isEnglish
                      ? "Choose a date first"
                      : "先选择日期"}
              </option>
              {slots.map((slot) => (
                <option value={slot} key={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </label>
          <label>
            {isEnglish ? "Guests / 人数" : "人数 / Guests"}
            <input
              name="partySize"
              type="number"
              min="1"
              max={
                seatingArea === "private-room"
                  ? limits.privateRoomMaxPartySize
                  : limits.maxPartySize
              }
              required
            />
          </label>
          <label>
            {isEnglish ? "Seating area / 就餐区域" : "就餐区域 / Seating area"}
            <select
              name="seatingArea"
              value={seatingArea}
              onChange={(event) =>
                setSeatingArea(
                  event.target.value as "hall" | "private-room"
                )
              }
            >
              <option value="hall">
                {isEnglish ? "Main dining room / 大厅" : "大厅 / Main dining room"}
              </option>
              <option value="private-room">
                {isEnglish ? "Private room / 包间" : "包间 / Private room"}
              </option>
            </select>
          </label>
          <label>
            {isEnglish ? "Name / 姓名" : "姓名 / Name"}
            <input name="guestName" autoComplete="name" required />
          </label>
          <label>
            {isEnglish ? "Notification / 通知方式" : "通知方式 / Notification"}
            <select
              name="notificationPreference"
              value={notificationPreference}
              onChange={(event) =>
                setNotificationPreference(event.target.value as "email" | "sms")
              }
            >
              <option value="email">
                {isEnglish ? "Email / 电子邮件" : "电子邮件 / Email"}
              </option>
              <option value="sms">
                {isEnglish ? "SMS / 手机短信" : "手机短信 / SMS"}
              </option>
            </select>
          </label>
          {notificationPreference === "email" ? (
            <label>
              {isEnglish ? "Email / 邮箱" : "邮箱 / Email"}
              <input name="email" type="email" autoComplete="email" required />
            </label>
          ) : (
            <label>
              {isEnglish ? "Mobile / 手机号" : "手机号 / Mobile"}
              <input name="phone" type="tel" autoComplete="tel" required />
            </label>
          )}
          <label className="reservation-form__wide">
            {isEnglish ? "Notes / 备注" : "备注 / Notes"}
            <textarea
              name="notes"
              rows={4}
              maxLength={500}
              placeholder={
                isEnglish
                  ? "Allergies, child seats or other arrival needs"
                  : "过敏信息、儿童椅或其他到店需求"
              }
            />
          </label>
        </div>
        {error && <p className="form-message form-message--error" role="alert">{error}</p>}
        <p className="reservation-form__notice">
          {isEnglish
            ? "This is an anonymous concept demo. It does not receive real bookings for an unauthorized merchant, and demo mode does not send real emails or SMS messages."
            : "这是匿名概念演示，不会替未授权商家接收真实订位。演示模式不会发送真实邮件或短信。"}
        </p>
        <button
          type="submit"
          className="button button--primary"
          disabled={!slots.length || submitting}
        >
          {submitting
            ? isEnglish
              ? "Submitting"
              : "正在提交"
            : isEnglish
              ? "Request reservation"
              : "提交订位请求"}
        </button>
      </form>

      <MobileActionDock profile={profile} current="reserve" />
    </main>
  );
}
