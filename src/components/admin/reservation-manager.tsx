"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Eye, Search } from "lucide-react";
import type { ReservationRow } from "@/types/database";
import type { ReservationStatus } from "@/types/reservations";
import { trapTabKey } from "@/components/admin/focus-trap";

interface ReservationResponse {
  reservations: ReservationRow[];
  total: number;
  page: number;
  pageSize: number;
}

const statusLabels: Record<ReservationStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTime(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function ReservationManager() {
  const [data, setData] = useState<ReservationResponse | null>(null);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<ReservationRow | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const loadReservations = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ search, status, page: String(page) });
    if (date) params.set("date", date);

    try {
      const response = await fetch(`/api/admin/reservations?${params}`, {
        cache: "no-store",
        signal,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error?.message ?? "Reservations could not be loaded.");
      }
      const loaded = result as ReservationResponse;
      if (page > 1 && loaded.total > 0 && !loaded.reservations.length) {
        setPage(Math.max(1, Math.ceil(loaded.total / loaded.pageSize)));
        return;
      }
      setData(loaded);
    } catch (loadError) {
      if (loadError instanceof Error && loadError.name === "AbortError") return;
      setError(loadError instanceof Error ? loadError.message : "Reservations could not be loaded.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [date, page, search, status]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void loadReservations(controller.signal);
    }, search ? 220 : 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadReservations]);

  useEffect(() => {
    if (!selected) return;
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [selected]);

  async function changeStatus(reservation: ReservationRow, nextStatus: ReservationStatus) {
    const action = nextStatus === "confirmed"
      ? "confirm"
      : nextStatus === "rejected"
        ? "reject"
        : "cancel";
    if (!window.confirm(`Are you sure you want to ${action} booking ${reservation.booking_reference}?`)) {
      return;
    }

    setUpdatingId(reservation.id);
    setNotice("");
    setError("");
    try {
      const response = await fetch(`/api/admin/reservations/${reservation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error?.message ?? "The reservation could not be updated.");
      }
      setNotice(`Booking ${reservation.booking_reference} marked ${statusLabels[nextStatus].toLowerCase()}.`);
      await loadReservations();
      if (selected?.id === reservation.id) setSelected(result.reservation);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "The reservation could not be updated.");
    } finally {
      setUpdatingId("");
    }
  }

  const pageCount = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 25)));

  return (
    <div className="admin-manager">
      <div className="admin-filter-bar">
        <label className="admin-search-field">
          <Search aria-hidden="true" size={16} />
          <span className="sr-only">Search reservations by customer name</span>
          <input
            maxLength={100}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search guest name"
            value={search}
          />
        </label>
        <label className="admin-filter-select">
          <span className="sr-only">Filter by reservation status</span>
          <select onChange={(event) => { setStatus(event.target.value); setPage(1); }} value={status}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label className="admin-date-field">
          <CalendarDays aria-hidden="true" size={16} />
          <span className="sr-only">Filter by reservation date</span>
          <input onChange={(event) => { setDate(event.target.value); setPage(1); }} type="date" value={date} />
        </label>
        {date && <button className="admin-text-button" onClick={() => setDate("")} type="button">Clear date</button>}
      </div>

      {notice && <p className="admin-inline-success" role="status">{notice}</p>}
      {error && (
        <div className="admin-inline-error" role="alert">
          <span>{error}</span>
          <button className="admin-text-button" onClick={() => void loadReservations()} type="button">Retry</button>
        </div>
      )}

      <div className="admin-table-card">
        {loading ? (
          <div aria-label="Loading reservations" className="admin-table-skeleton" role="status">
            <span /><span /><span /><span /><span />
          </div>
        ) : !error && !data?.reservations.length ? (
          <div className="admin-empty-state">
            <CalendarDays aria-hidden="true" size={25} />
            <h2>No reservations found</h2>
            <p>New booking requests will appear here. Try adjusting the filters.</p>
          </div>
        ) : !error && data ? (
          <>
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr><th>Guest</th><th>Reservation</th><th>Guests</th><th>Reference</th><th>Status</th><th><span className="sr-only">Details</span></th></tr>
                </thead>
                <tbody>
                  {data.reservations.map((reservation) => (
                    <tr key={reservation.id}>
                      <td><strong>{reservation.customer_name}</strong><small>{reservation.customer_email}</small></td>
                      <td>{formatDate(reservation.reservation_date)}<small>{formatTime(reservation.reservation_time)}</small></td>
                      <td>{reservation.guest_count}</td>
                      <td><code>{reservation.booking_reference}</code></td>
                      <td><span className={`admin-status-pill status-${reservation.status}`}>{statusLabels[reservation.status]}</span></td>
                      <td><button aria-label={`View ${reservation.customer_name}'s reservation`} className="admin-icon-button" onClick={() => setSelected(reservation)} type="button"><Eye aria-hidden="true" size={17} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="admin-table-pagination">
              <span>{data.total} reservation{data.total === 1 ? "" : "s"}</span>
              <div>
                <button aria-label="Previous page" className="admin-icon-button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} type="button"><ChevronLeft size={17} /></button>
                <span>Page {page} of {pageCount}</span>
                <button aria-label="Next page" className="admin-icon-button" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)} type="button"><ChevronRight size={17} /></button>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {selected && (
        <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <section aria-labelledby="reservation-details-title" aria-modal="true" className="admin-detail-modal" onKeyDown={trapTabKey} role="dialog">
            <button aria-label="Close reservation details" className="admin-modal-close" onClick={() => setSelected(null)} ref={closeButtonRef} type="button">×</button>
            <span className="admin-eyebrow">BOOKING DETAILS</span>
            <h2 id="reservation-details-title">{selected.customer_name}</h2>
            <p className="admin-modal-reference">{selected.booking_reference}</p>
            <dl className="admin-detail-list">
              <div><dt>Email</dt><dd><a href={`mailto:${selected.customer_email}`}>{selected.customer_email}</a></dd></div>
              <div><dt>Phone</dt><dd><a href={`tel:${selected.customer_phone}`}>{selected.customer_phone}</a></dd></div>
              <div><dt>Date &amp; time</dt><dd>{formatDate(selected.reservation_date)} at {formatTime(selected.reservation_time)}</dd></div>
              <div><dt>Party size</dt><dd>{selected.guest_count} guests</dd></div>
              <div><dt>Special requests</dt><dd>{selected.special_requests || "None provided"}</dd></div>
              <div><dt>Status</dt><dd><span className={`admin-status-pill status-${selected.status}`}>{statusLabels[selected.status]}</span></dd></div>
            </dl>
            <ReservationActions reservation={selected} disabled={updatingId === selected.id} onChange={(next) => void changeStatus(selected, next)} />
          </section>
        </div>
      )}
    </div>
  );
}

function ReservationActions({
  reservation,
  disabled,
  onChange,
}: {
  reservation: ReservationRow;
  disabled: boolean;
  onChange: (status: ReservationStatus) => void;
}) {
  if (reservation.status === "pending") {
    return (
      <div className="admin-modal-actions">
        <button className="admin-action-button" disabled={disabled} onClick={() => onChange("rejected")} type="button">Reject</button>
        <button className="admin-primary-button" disabled={disabled} onClick={() => onChange("confirmed")} type="button">{disabled ? "Saving…" : "Confirm reservation"}</button>
      </div>
    );
  }
  if (reservation.status === "confirmed") {
    return <div className="admin-modal-actions"><button className="admin-action-button" disabled={disabled} onClick={() => onChange("cancelled")} type="button">{disabled ? "Saving…" : "Cancel reservation"}</button></div>;
  }
  return null;
}
