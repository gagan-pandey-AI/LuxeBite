"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  Sun,
  UtensilsCrossed,
} from "lucide-react";
import type { ReservationRow, ContactMessageRow } from "@/types/database";
import type { ReservationStatus } from "@/types/reservations";

interface ActivityRow {
  reservation_date: string;
  reservation_count: number;
  pending_count: number;
  confirmed_count: number;
  rejected_count: number;
  cancelled_count: number;
}

interface DashboardData {
  from: string;
  to: string;
  totals: {
    reservations: number;
    pendingReservations: number;
    confirmedReservations: number;
    contactMessages: number;
    menuItems: number;
    todaysReservations: number;
  };
  activity: ActivityRow[];
  recentReservations: ReservationRow[];
  recentMessages: Pick<ContactMessageRow, "id" | "customer_name" | "subject" | "status" | "created_at">[];
}

const reservationStatusNames: Record<ReservationStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })
    .format(new Date(`${value}T12:00:00`));
}

function formatTime(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}

function activityBuckets(data: DashboardData) {
  const start = new Date(`${data.from}T00:00:00Z`);
  const end = new Date(`${data.to}T00:00:00Z`);
  const count = Math.max(1, Math.min(14, Math.floor((end.valueOf() - start.valueOf()) / 86400000) + 1));
  const buckets = Array.from({ length: count }, (_, index) => {
    const offset = count === 1 ? 0 : (end.valueOf() - start.valueOf()) / (count - 1);
    const date = new Date(start.valueOf() + Math.floor(index * offset))
      .toISOString()
      .slice(0, 10);
    return { label: formatShortDate(date), count: 0 };
  });
  const range = Math.max(1, end.valueOf() - start.valueOf() + 86400000);
  for (const row of data.activity) {
    const offset = new Date(`${row.reservation_date}T00:00:00Z`).valueOf() - start.valueOf();
    const index = Math.min(count - 1, Math.floor((offset / range) * count));
    buckets[index].count += row.reservation_count;
  }
  return buckets;
}

export function DashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(start = "", end = "") {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (start) params.set("from", start);
    if (end) params.set("to", end);
    try {
      const response = await fetch(`/api/admin/dashboard${params.size ? `?${params}` : ""}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message ?? "Dashboard information could not be loaded.");
      const dashboard = result as DashboardData;
      setData(dashboard);
      setFrom(dashboard.from);
      setTo(dashboard.to);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Dashboard information could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-dashboard-content">
      <form className="admin-date-range" onSubmit={(event) => { event.preventDefault(); void load(from, to); }}>
        <label>From <input onChange={(event) => setFrom(event.target.value)} required type="date" value={from} /></label>
        <label>To <input onChange={(event) => setTo(event.target.value)} required type="date" value={to} /></label>
        <button className="admin-primary-button" disabled={loading} type="submit">{loading ? "Loading…" : "Apply range"}</button>
      </form>

      {error && (
        <div className="admin-inline-error" role="alert">
          <span>{error}</span>
          <button className="admin-text-button" onClick={() => void load(from, to)} type="button">Retry</button>
        </div>
      )}

      {loading && !data ? (
        <div aria-label="Loading dashboard" className="admin-dashboard-skeleton" role="status"><span /><span /><span /><span /><span /><span /></div>
      ) : data ? (
        <>
          <div className="admin-kpi-grid" aria-busy={loading}>
            <KpiCard icon={<CalendarDays size={18} />} label="Total reservations" value={data.totals.reservations} note="In selected date range" />
            <KpiCard icon={<Clock3 size={18} />} label="Pending reservations" value={data.totals.pendingReservations} note="Awaiting a decision" />
            <KpiCard icon={<CheckCircle2 size={18} />} label="Confirmed reservations" value={data.totals.confirmedReservations} note="In selected date range" />
            <KpiCard icon={<Mail size={18} />} label="Contact messages" value={data.totals.contactMessages} note="All messages received" />
            <KpiCard icon={<UtensilsCrossed size={18} />} label="Menu items" value={data.totals.menuItems} note="Available and hidden items" />
            <KpiCard icon={<Sun size={18} />} label="Today's reservations" value={data.totals.todaysReservations} note="Restaurant local date" />
          </div>

          <div className="admin-analytics-grid">
            <section aria-labelledby="activity-chart-title" className="admin-panel admin-chart-panel">
              <div className="admin-panel-heading">
                <div><span className="admin-eyebrow">BOOKINGS</span><h2 id="activity-chart-title">Reservation activity</h2></div>
                <span className="admin-chart-range">{formatShortDate(data.from)} – {formatShortDate(data.to)}</span>
              </div>
              {data.totals.reservations ? (
                <ActivityChart data={data} />
              ) : (
                <div className="admin-chart-empty">No reservations in this date range.</div>
              )}
            </section>
            <section aria-labelledby="status-chart-title" className="admin-panel admin-status-panel">
              <div className="admin-panel-heading">
                <div><span className="admin-eyebrow">BOOKING STATUS</span><h2 id="status-chart-title">At a glance</h2></div>
              </div>
              <StatusChart rows={data.activity} total={data.totals.reservations} />
            </section>
          </div>

          <div className="admin-analytics-grid admin-lower-grid">
            <section aria-labelledby="recent-reservations-title" className="admin-panel">
              <div className="admin-panel-heading">
                <div><span className="admin-eyebrow">GUEST JOURNEY</span><h2 id="recent-reservations-title">Recent reservations</h2></div>
                <Link className="admin-panel-link" href="/admin/reservations">View all</Link>
              </div>
              {data.recentReservations.length ? (
                <div className="admin-compact-list">
                  {data.recentReservations.map((reservation) => (
                    <div className="admin-compact-row" key={reservation.id}>
                      <span className="admin-compact-avatar">{reservation.customer_name.slice(0, 1).toUpperCase()}</span>
                      <span className="admin-compact-main"><strong>{reservation.customer_name}</strong><small>{formatShortDate(reservation.reservation_date)} · {formatTime(reservation.reservation_time)}</small></span>
                      <span className={`admin-status-pill status-${reservation.status}`}>{reservationStatusNames[reservation.status]}</span>
                    </div>
                  ))}
                </div>
              ) : <div className="admin-panel-empty">No reservations in this date range.</div>}
            </section>
            <section aria-labelledby="recent-messages-title" className="admin-panel">
              <div className="admin-panel-heading">
                <div><span className="admin-eyebrow">INBOX</span><h2 id="recent-messages-title">Recent enquiries</h2></div>
                <Link className="admin-panel-link" href="/admin/messages">Open inbox</Link>
              </div>
              {data.recentMessages.length ? (
                <div className="admin-compact-list">
                  {data.recentMessages.map((message) => (
                    <div className="admin-compact-row" key={message.id}>
                      <span className="admin-compact-avatar">{message.customer_name.slice(0, 1).toUpperCase()}</span>
                      <span className="admin-compact-main"><strong>{message.subject}</strong><small>{message.customer_name} · {formatShortDate(message.created_at.slice(0, 10))}</small></span>
                      <span className={`admin-status-pill status-${message.status}`}>{message.status}</span>
                    </div>
                  ))}
                </div>
              ) : <div className="admin-panel-empty">No customer enquiries have been received.</div>}
            </section>
          </div>
          <p className="admin-demo-disclaimer">Metrics reflect records currently stored in the LuxeBite database. No business data is generated for this dashboard.</p>
        </>
      ) : null}
    </div>
  );
}

function KpiCard({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: number; note: string }) {
  return (
    <article className="admin-kpi-card">
      <div className="admin-kpi-top"><span className="admin-kpi-icon">{icon}</span><span className="admin-kpi-note">{note}</span></div>
      <p>{label}</p>
      <strong>{value.toLocaleString("en-IN")}</strong>
    </article>
  );
}

function ActivityChart({ data }: { data: DashboardData }) {
  const buckets = activityBuckets(data);
  const max = Math.max(...buckets.map((bucket) => bucket.count), 1);
  return (
    <div aria-label="Reservation activity by date" className="admin-bar-chart" role="list">
      {buckets.map((bucket, index) => (
        <div
          aria-label={`${bucket.label}: ${bucket.count} reservation${bucket.count === 1 ? "" : "s"}`}
          className="admin-bar-column"
          key={`${bucket.label}-${index}`}
          role="listitem"
          title={`${bucket.label}: ${bucket.count} reservations`}
        >
          <span className="admin-bar-value">{bucket.count || ""}</span>
          <div className="admin-bar-track"><span style={{ height: `${bucket.count ? Math.max(5, bucket.count / max * 100) : 0}%` }} /></div>
          <span className="admin-bar-label">{bucket.label}</span>
        </div>
      ))}
    </div>
  );
}

function StatusChart({ rows, total }: { rows: ActivityRow[]; total: number }) {
  const counts = [
    { key: "pending", label: "Pending", count: rows.reduce((sum, row) => sum + row.pending_count, 0) },
    { key: "confirmed", label: "Confirmed", count: rows.reduce((sum, row) => sum + row.confirmed_count, 0) },
    { key: "rejected", label: "Rejected", count: rows.reduce((sum, row) => sum + row.rejected_count, 0) },
    { key: "cancelled", label: "Cancelled", count: rows.reduce((sum, row) => sum + row.cancelled_count, 0) },
  ];
  return (
    <div className="admin-status-chart">
      {total ? (
        <>
          <div aria-label={`${total} total reservations`} className="admin-status-total"><strong>{total}</strong><span>Bookings</span></div>
          <div className="admin-status-legend">
            {counts.map((item) => (
              <div key={item.key}>
                <span className={`admin-status-dot status-${item.key}`} />
                <span>{item.label}</span><strong>{item.count}</strong>
              </div>
            ))}
          </div>
        </>
      ) : <div className="admin-chart-empty">No booking status data for this range.</div>}
    </div>
  );
}
