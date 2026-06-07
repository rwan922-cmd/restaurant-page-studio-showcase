export type D1Result<T = unknown> = {
  success: boolean;
  results?: T[];
  meta?: Record<string, unknown>;
};

export type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run<T = unknown>(): Promise<D1Result<T>>;
};

export type D1Database = {
  prepare(query: string): D1PreparedStatement;
};

export type CloudflareEnv = {
  DB: D1Database;
  AUTH_PEPPER: string;
  SESSION_SECRET: string;
  DEMO_OWNER_EMAIL: string;
  DEMO_OWNER_PASSWORD_HASH: string;
  DEMO_STAFF_PIN_HASH: string;
  NOTIFICATION_MODE?: "demo" | "live";
  NOTIFICATION_ALLOWLIST?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_FROM?: string;
};
