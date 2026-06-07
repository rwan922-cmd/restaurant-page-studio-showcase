import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReservationApiError,
  reservationApi,
  type ReservationApi
} from "../api/reservations";
import type {
  ReservationConfig,
  ReservationRecord,
  ReservationStatus
} from "../domain/reservation";

type CounterReservationsPageProps = {
  api?: ReservationApi;
};

const scopes = [
  ["today", "今日"],
  ["pending", "待确认"],
  ["confirmed", "已确认"],
  ["history", "历史"]
] as const;

const statusLabels: Record<ReservationStatus, string> = {
  pending: "待确认",
  confirmed: "已确认",
  rejected: "已拒绝",
  cancelled: "已取消",
  seated: "已入座",
  "no-show": "未到店"
};

export function CounterReservationsPage({
  api = reservationApi
}: CounterReservationsPageProps) {
  const [scope, setScope] = useState("today");
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [settings, setSettings] = useState<ReservationConfig | null>(null);
  const [openingHoursText, setOpeningHoursText] = useState("");
  const [view, setView] = useState<"reservations" | "settings">("reservations");
  const [error, setError] = useState("");
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const knownPending = useRef(new Set<string>());
  const hasLoaded = useRef(false);
  const audioContext = useRef<AudioContext | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  function playAlert() {
    const context = audioContext.current;
    if (!context || context.state !== "running") {
      return;
    }
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.35);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.38);
  }

  const loadReservations = useCallback(async () => {
    try {
      const result = await api.listReservations(scope);
      const nextPending = new Set(
        result.filter((item) => item.status === "pending").map((item) => item.id)
      );
      if (
        hasLoaded.current &&
        soundEnabled &&
        [...nextPending].some((id) => !knownPending.current.has(id))
      ) {
        playAlert();
      }
      setReservations(result);
      setLastSynced(new Date());
      setError("");
      knownPending.current = nextPending;
      hasLoaded.current = true;
    } catch (reason) {
      if (reason instanceof ReservationApiError && reason.status === 401) {
        setError("登录已过期，请重新登录。");
      } else {
        setError(
          reason instanceof Error ? reason.message : "无法同步订位资料"
        );
      }
    }
  }, [api, scope, soundEnabled]);

  async function enableSound() {
    const BrowserAudioContext =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!BrowserAudioContext) {
      setError("当前浏览器不支持工作台提示音。");
      return;
    }
    audioContext.current ??= new BrowserAudioContext();
    await audioContext.current.resume();
    setSoundEnabled(true);
    playAlert();
  }

  useEffect(() => {
    void loadReservations();
    const interval = window.setInterval(() => {
      void loadReservations();
    }, 2_500);
    return () => window.clearInterval(interval);
  }, [loadReservations]);

  async function changeStatus(
    reservation: ReservationRecord,
    status: ReservationStatus
  ) {
    const input = document.querySelector<HTMLInputElement>(
      `[data-assignment="${reservation.id}"]`
    );
    await api.updateReservation(
      reservation.id,
      status,
      input?.value.trim() || undefined
    );
    await loadReservations();
  }

  async function openSettings() {
    setView("settings");
    if (!settings) {
      try {
        const result = await api.getSettings();
        setSettings(result);
        setOpeningHoursText(JSON.stringify(result.openingHours, null, 2));
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "无法读取设置");
      }
    }
  }

  async function saveSettings() {
    if (!settings) {
      return;
    }
    try {
      const openingHours = JSON.parse(openingHoursText);
      const result = await api.updateSettings({ ...settings, openingHours });
      setSettings(result);
      setOpeningHoursText(JSON.stringify(result.openingHours, null, 2));
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "设置保存失败");
    }
  }

  return (
    <main id="main-content" className="counter-page">
      <header className="counter-header">
        <div>
          <p>蜀香小馆 · Shu Xiang</p>
          <h1>订位工作台</h1>
        </div>
        <nav aria-label="工作台导航">
          <button
            type="button"
            aria-current={view === "reservations" ? "page" : undefined}
            onClick={() => setView("reservations")}
          >
            订位
          </button>
          <button
            type="button"
            aria-current={view === "settings" ? "page" : undefined}
            onClick={openSettings}
          >
            设置
          </button>
        </nav>
      </header>

      {error && (
        <div className="counter-alert" role="alert">
          <span>{error}</span>
          {error.includes("登录") && <a href="/counter/login">重新登录</a>}
        </div>
      )}

      {view === "reservations" ? (
        <>
          <section className="counter-toolbar">
            <div className="counter-tabs" role="tablist" aria-label="订位筛选">
              {scopes.map(([value, label]) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={scope === value}
                  onClick={() => setScope(value)}
                  key={value}
                >
                  {label}
                </button>
              ))}
            </div>
            <p role="status">
              {lastSynced
                ? `刚刚同步 / Last synced ${lastSynced.toLocaleTimeString("en-NZ", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                  })}`
                : "正在同步 / Syncing"}
            </p>
            <button
              type="button"
              className="sound-toggle"
              aria-pressed={soundEnabled}
              onClick={() => void enableSound()}
            >
              {soundEnabled ? "提示音已开启" : "开启新订位提示音"}
            </button>
          </section>

          <section className="reservation-queue" aria-live="polite">
            {reservations.length ? (
              reservations.map((reservation) => (
                <article className="reservation-ticket" key={reservation.id}>
                  <div className="reservation-ticket__time">
                    <strong>{reservation.time}</strong>
                    <span>{reservation.date}</span>
                  </div>
                  <div className="reservation-ticket__guest">
                    <h2>{reservation.guestName}</h2>
                    <p>
                      {reservation.partySize} 人 ·{" "}
                      {reservation.seatingArea === "private-room"
                        ? "包间"
                        : "大厅"}
                    </p>
                    <p>{reservation.email ?? reservation.phone}</p>
                    {reservation.notes && <p>{reservation.notes}</p>}
                    {reservation.notificationStatus === "failed" && (
                      <p className="reservation-ticket__warning" role="alert">
                        通知发送失败，请人工联系 / Notification failed
                      </p>
                    )}
                    {reservation.notificationStatus === "skipped" && (
                      <p className="reservation-ticket__demo-note">
                        演示模式，未发送通知 / Demo notification skipped
                      </p>
                    )}
                  </div>
                  <div className="reservation-ticket__status">
                    <span data-status={reservation.status}>
                      {statusLabels[reservation.status]}
                    </span>
                    <label>
                      桌号或包间
                      <input
                        data-assignment={reservation.id}
                        defaultValue={reservation.assignedResource}
                        placeholder="例如：包间 2"
                      />
                    </label>
                  </div>
                  <div className="reservation-ticket__actions">
                    {reservation.status === "pending" && (
                      <>
                        <button
                          type="button"
                          className="button button--primary"
                          onClick={() =>
                            void changeStatus(reservation, "confirmed")
                          }
                        >
                          确认订位
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void changeStatus(reservation, "rejected")
                          }
                        >
                          拒绝
                        </button>
                      </>
                    )}
                    {reservation.status === "confirmed" && (
                      <>
                        <button
                          type="button"
                          onClick={() => void changeStatus(reservation, "seated")}
                        >
                          标记入座
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void changeStatus(reservation, "no-show")
                          }
                        >
                          未到店
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <div className="counter-empty">
                <h2>当前没有订位</h2>
                <p>新订位会在这里自动出现，无需手动刷新。</p>
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="counter-settings">
          <div>
            <h2>订位规则</h2>
            <p>修改后会影响顾客可以选择的日期、时间和人数。</p>
          </div>
          {settings ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void saveSettings();
              }}
            >
              <label>
                订位间隔（分钟）
                <input
                  type="number"
                  min="15"
                  max="120"
                  value={settings.slotIntervalMinutes}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      slotIntervalMinutes: Number(event.target.value)
                    })
                  }
                />
              </label>
              <label>
                最少提前（分钟）
                <input
                  type="number"
                  min="0"
                  value={settings.minLeadMinutes}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      minLeadMinutes: Number(event.target.value)
                    })
                  }
                />
              </label>
              <label>
                最远可订（天）
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={settings.maxAdvanceDays}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      maxAdvanceDays: Number(event.target.value)
                    })
                  }
                />
              </label>
              <label>
                最大到店人数
                <input
                  type="number"
                  min="1"
                  value={settings.maxPartySize}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      maxPartySize: Number(event.target.value)
                    })
                  }
                />
              </label>
              <label>
                包间人数上限
                <input
                  type="number"
                  min="1"
                  value={settings.privateRoomMaxPartySize}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      privateRoomMaxPartySize: Number(event.target.value)
                    })
                  }
                />
              </label>
              <label>
                大厅总容量
                <input
                  type="number"
                  min="1"
                  value={settings.hallCapacity ?? ""}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      hallCapacity: Number(event.target.value) || undefined
                    })
                  }
                />
              </label>
              <label>
                包间数量
                <input
                  type="number"
                  min="0"
                  value={settings.privateRoomCount ?? ""}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      privateRoomCount:
                        event.target.value === ""
                          ? undefined
                          : Number(event.target.value)
                    })
                  }
                />
              </label>
              <label className="counter-settings__wide">
                营业时段 JSON
                <textarea
                  rows={10}
                  value={openingHoursText}
                  onChange={(event) => {
                    setOpeningHoursText(event.target.value);
                    setError("");
                  }}
                />
              </label>
              <label className="counter-settings__wide">
                暂停订位日期（每行一个 YYYY-MM-DD）
                <textarea
                  rows={5}
                  value={settings.closureDates.join("\n")}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      closureDates: event.target.value
                        .split("\n")
                        .map((value) => value.trim())
                        .filter(Boolean)
                    })
                  }
                />
              </label>
              <button className="button button--primary" type="submit">
                保存订位规则
              </button>
            </form>
          ) : (
            <p role="status">正在读取设置</p>
          )}
        </section>
      )}
    </main>
  );
}
