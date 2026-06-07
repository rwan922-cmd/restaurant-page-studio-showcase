CREATE TABLE IF NOT EXISTS reservation_configs (
  restaurant_slug TEXT PRIMARY KEY,
  timezone TEXT NOT NULL,
  slot_interval_minutes INTEGER NOT NULL,
  min_lead_minutes INTEGER NOT NULL,
  max_advance_days INTEGER NOT NULL,
  max_party_size INTEGER NOT NULL,
  private_room_max_party_size INTEGER NOT NULL,
  hall_capacity INTEGER,
  private_room_count INTEGER,
  reservation_duration_minutes INTEGER,
  opening_hours_json TEXT NOT NULL,
  closure_dates_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  restaurant_slug TEXT NOT NULL,
  status_token TEXT NOT NULL UNIQUE,
  idempotency_key TEXT NOT NULL,
  reservation_date TEXT NOT NULL,
  reservation_time TEXT NOT NULL,
  party_size INTEGER NOT NULL,
  seating_area TEXT NOT NULL CHECK (seating_area IN ('hall', 'private-room')),
  guest_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notification_preference TEXT NOT NULL CHECK (notification_preference IN ('email', 'sms')),
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'seated', 'no-show')),
  assigned_resource TEXT,
  notification_status TEXT CHECK (notification_status IN ('sent', 'failed', 'skipped')),
  notification_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (restaurant_slug, idempotency_key),
  FOREIGN KEY (restaurant_slug) REFERENCES reservation_configs(restaurant_slug)
);

CREATE INDEX IF NOT EXISTS reservations_restaurant_date
  ON reservations (restaurant_slug, reservation_date, reservation_time);
CREATE INDEX IF NOT EXISTS reservations_restaurant_status
  ON reservations (restaurant_slug, status, updated_at);

CREATE TABLE IF NOT EXISTS notification_logs (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  event TEXT NOT NULL CHECK (event IN ('received', 'status-change')),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
  error TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id TEXT PRIMARY KEY,
  restaurant_slug TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS login_attempt_lookup
  ON login_attempts (restaurant_slug, ip_address, created_at);

INSERT OR IGNORE INTO reservation_configs (
  restaurant_slug,
  timezone,
  slot_interval_minutes,
  min_lead_minutes,
  max_advance_days,
  max_party_size,
  private_room_max_party_size,
  hall_capacity,
  private_room_count,
  reservation_duration_minutes,
  opening_hours_json,
  closure_dates_json,
  updated_at
) VALUES (
  'shu-xiang',
  'Pacific/Auckland',
  30,
  60,
  60,
  12,
  10,
  48,
  4,
  120,
  '{"0":[{"start":"16:00","end":"22:00"}],"1":[{"start":"16:00","end":"22:00"}],"2":[{"start":"16:00","end":"22:00"}],"3":[{"start":"16:00","end":"22:00"}],"4":[{"start":"16:00","end":"22:00"}],"5":[{"start":"16:00","end":"23:00"}],"6":[{"start":"16:00","end":"23:00"}]}',
  '[]',
  CURRENT_TIMESTAMP
);
