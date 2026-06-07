import type { ReservationRecord } from "../domain/reservation";
import type { CloudflareEnv } from "./cloudflare-types";
import type { ReservationNotifier } from "./reservation-service";

function statusText(status: ReservationRecord["status"]) {
  const labels = {
    pending: "等待餐厅确认",
    confirmed: "餐厅已确认",
    rejected: "餐厅暂时无法接受",
    cancelled: "订位已取消",
    seated: "顾客已入座",
    "no-show": "未到店"
  };
  return labels[status];
}

function allowedRecipient(env: CloudflareEnv, recipient: string) {
  const allowlist = env.NOTIFICATION_ALLOWLIST?.split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return !allowlist?.length || allowlist.includes(recipient.toLowerCase());
}

async function sendEmail(
  env: CloudflareEnv,
  reservation: ReservationRecord,
  message: string
) {
  if (!reservation.email || !env.RESEND_API_KEY || !env.RESEND_FROM) {
    throw new Error("邮件服务尚未配置");
  }
  if (!allowedRecipient(env, reservation.email)) {
    throw new Error("演示环境禁止向白名单之外的邮箱发送通知");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from: env.RESEND_FROM,
      to: [reservation.email],
      subject: `订位状态：${statusText(reservation.status)}`,
      text: message
    })
  });
  if (!response.ok) {
    throw new Error(`邮件发送失败 (${response.status})`);
  }
}

async function sendSms(
  env: CloudflareEnv,
  reservation: ReservationRecord,
  message: string
) {
  if (
    !reservation.phone ||
    !env.TWILIO_ACCOUNT_SID ||
    !env.TWILIO_AUTH_TOKEN ||
    !env.TWILIO_FROM
  ) {
    throw new Error("短信服务尚未配置");
  }
  if (!allowedRecipient(env, reservation.phone)) {
    throw new Error("演示环境禁止向白名单之外的手机号发送通知");
  }

  const form = new URLSearchParams({
    To: reservation.phone,
    From: env.TWILIO_FROM,
    Body: message
  });
  const credentials = btoa(
    `${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`
  );
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        authorization: `Basic ${credentials}`,
        "content-type": "application/x-www-form-urlencoded"
      },
      body: form
    }
  );
  if (!response.ok) {
    throw new Error(`短信发送失败 (${response.status})`);
  }
}

export function createNotifier(env: CloudflareEnv): ReservationNotifier {
  return {
    async send(reservation) {
      if (env.NOTIFICATION_MODE !== "live") {
        return "skipped";
      }

      const message = [
        `订位状态：${statusText(reservation.status)}`,
        `${reservation.date} ${reservation.time}`,
        `${reservation.partySize} 人`,
        reservation.seatingArea === "private-room" ? "包间" : "大厅",
        reservation.assignedResource
          ? `餐厅安排：${reservation.assignedResource}`
          : "",
        `查询：https://restaurant-page-studio.pages.dev/reservation/${reservation.statusToken}`
      ]
        .filter(Boolean)
        .join("\n");

      if (reservation.notificationPreference === "email") {
        await sendEmail(env, reservation, message);
      } else {
        await sendSms(env, reservation, message);
      }
      return "sent";
    }
  };
}
