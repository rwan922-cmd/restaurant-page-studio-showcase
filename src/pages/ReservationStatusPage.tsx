import { useEffect, useState } from "react";
import {
  reservationApi,
  type ReservationApi
} from "../api/reservations";
import type { PublicReservation } from "../domain/reservation";

type ReservationStatusPageProps = {
  statusToken: string;
  api?: ReservationApi;
};

const statusCopy = {
  pending: ["等待餐厅确认", "Waiting for confirmation"],
  confirmed: ["餐厅已确认", "Reservation confirmed"],
  rejected: ["餐厅暂时无法接受", "Reservation unavailable"],
  cancelled: ["订位已取消", "Reservation cancelled"],
  seated: ["已安排入座", "Guest seated"],
  "no-show": ["记录为未到店", "Marked as no-show"]
} as const;

export function ReservationStatusPage({
  statusToken,
  api = reservationApi
}: ReservationStatusPageProps) {
  const [reservation, setReservation] = useState<PublicReservation | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api
      .getReservation(statusToken)
      .then((result) => {
        if (active) {
          setReservation(result);
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : "无法读取订位状态"
          );
        }
      });
    return () => {
      active = false;
    };
  }, [api, statusToken]);

  if (error) {
    return (
      <main id="main-content" className="reservation-status-page">
        <section className="reservation-result">
          <h1>无法读取订位</h1>
          <p role="alert">{error}</p>
          <a className="button button--primary" href="/">
            返回首页
          </a>
        </section>
      </main>
    );
  }

  if (!reservation) {
    return (
      <main id="main-content" className="reservation-status-page">
        <p className="reservation-loading" role="status">
          正在读取订位状态 / Loading reservation
        </p>
      </main>
    );
  }

  const copy = statusCopy[reservation.status];
  return (
    <main id="main-content" className="reservation-status-page">
      <section className="reservation-result">
        <p>订位状态 / Reservation status</p>
        <h1>{copy[0]} <span>{copy[1]}</span></h1>
        <dl className="reservation-summary">
          <div><dt>日期 / Date</dt><dd>{reservation.date}</dd></div>
          <div><dt>时间 / Time</dt><dd>{reservation.time}</dd></div>
          <div><dt>人数 / Guests</dt><dd>{reservation.partySize}</dd></div>
          <div>
            <dt>区域 / Area</dt>
            <dd>
              {reservation.seatingArea === "private-room"
                ? "包间 / Private room"
                : "大厅 / Main dining room"}
            </dd>
          </div>
          {reservation.assignedResource && (
            <div>
              <dt>餐厅安排 / Assignment</dt>
              <dd>{reservation.assignedResource}</dd>
            </div>
          )}
        </dl>
        <p>
          页面不会显示姓名、邮箱或手机号。演示模式不会发送真实邮件或短信，请保存此专属查询链接。
        </p>
      </section>
    </main>
  );
}
