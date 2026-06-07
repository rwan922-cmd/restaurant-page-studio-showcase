import { useState, type FormEvent } from "react";
import {
  reservationApi,
  type ReservationApi
} from "../api/reservations";

type CounterLoginPageProps = {
  api?: ReservationApi;
  onAuthenticated?: () => void;
};

export function CounterLoginPage({
  api = reservationApi,
  onAuthenticated = () => window.location.assign("/counter/reservations")
}: CounterLoginPageProps) {
  const [mode, setMode] = useState<"owner" | "staff">("owner");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError("");
    try {
      await api.login(mode, {
        restaurantSlug: "shu-xiang",
        email:
          mode === "owner" ? String(form.get("email") ?? "") : undefined,
        credential: String(form.get("credential") ?? "")
      });
      onAuthenticated();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "登录失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main id="main-content" className="counter-login">
      <section className="counter-login__panel">
        <p>Restaurant Page Studio</p>
        <h1>商家订位工作台</h1>
        <p>店主使用邮箱和密码，员工可以使用餐厅 PIN 登录。</p>
        <div className="counter-login__modes" role="group" aria-label="登录方式">
          <button
            type="button"
            aria-pressed={mode === "owner"}
            onClick={() => setMode("owner")}
          >
            店主登录
          </button>
          <button
            type="button"
            aria-pressed={mode === "staff"}
            onClick={() => setMode("staff")}
          >
            员工 PIN
          </button>
        </div>
        <form onSubmit={submit}>
          {mode === "owner" && (
            <label>
              邮箱 / Email
              <input
                type="email"
                name="email"
                autoComplete="username"
                required
              />
            </label>
          )}
          <label>
            密码或员工 PIN
            <input
              type="password"
              name="credential"
              inputMode={mode === "staff" ? "numeric" : undefined}
              autoComplete="current-password"
              required
            />
          </label>
          {error && <p className="form-message form-message--error" role="alert">{error}</p>}
          <button
            className="button button--primary"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "正在登录" : "登录工作台 / Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
