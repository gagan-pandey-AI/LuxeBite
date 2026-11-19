"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Mail, Search } from "lucide-react";
import type { ContactMessageRow } from "@/types/database";
import type { ContactMessageStatus } from "@/types/contact";
import { trapTabKey } from "@/components/admin/focus-trap";

interface MessageResponse {
  messages: ContactMessageRow[];
  total: number;
  page: number;
  pageSize: number;
}

const statusNames: Record<ContactMessageStatus, string> = {
  new: "New",
  read: "Read",
  replied: "Replied",
  archived: "Archived",
};

function formatMessageDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function MessageManager() {
  const [data, setData] = useState<MessageResponse | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<ContactMessageRow | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const loadMessages = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ search, status, page: String(page) });
    try {
      const response = await fetch(`/api/admin/messages?${params}`, {
        cache: "no-store",
        signal,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error?.message ?? "Messages could not be loaded.");
      }
      const loaded = result as MessageResponse;
      if (page > 1 && loaded.total > 0 && !loaded.messages.length) {
        setPage(Math.max(1, Math.ceil(loaded.total / loaded.pageSize)));
        return;
      }
      setData(loaded);
    } catch (loadError) {
      if (loadError instanceof Error && loadError.name === "AbortError") return;
      setError(loadError instanceof Error ? loadError.message : "Messages could not be loaded.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadMessages(controller.signal), search ? 220 : 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadMessages]);

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

  async function changeStatus(message: ContactMessageRow, next: ContactMessageStatus) {
    setUpdatingId(message.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/messages/${message.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error?.message ?? "Message status could not be updated.");
      }
      setNotice(`Message marked ${statusNames[next].toLowerCase()}.`);
      setSelected(result.message);
      await loadMessages();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Message status could not be updated.");
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
          <span className="sr-only">Search contact messages</span>
          <input
            maxLength={120}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Search name, email or subject"
            value={search}
          />
        </label>
        <label className="admin-filter-select">
          <span className="sr-only">Filter by message status</span>
          <select onChange={(event) => { setStatus(event.target.value); setPage(1); }} value={status}>
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>
      {notice && <p className="admin-inline-success" role="status">{notice}</p>}
      {error && (
        <div className="admin-inline-error" role="alert">
          <span>{error}</span>
          <button className="admin-text-button" onClick={() => void loadMessages()} type="button">Retry</button>
        </div>
      )}

      <div className="admin-table-card">
        {loading ? (
          <div aria-label="Loading contact messages" className="admin-table-skeleton" role="status">
            <span /><span /><span /><span /><span />
          </div>
        ) : !error && !data?.messages.length ? (
          <div className="admin-empty-state">
            <Mail aria-hidden="true" size={25} />
            <h2>Your inbox is clear</h2>
            <p>New contact enquiries will appear here. Try adjusting the filters.</p>
          </div>
        ) : !error && data ? (
          <>
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead><tr><th>From</th><th>Subject</th><th>Received</th><th>Status</th><th><span className="sr-only">Read message</span></th></tr></thead>
                <tbody>
                  {data.messages.map((message) => (
                    <tr key={message.id}>
                      <td><strong>{message.customer_name}</strong><small>{message.customer_email}</small></td>
                      <td className="admin-message-subject">{message.subject}</td>
                      <td>{formatMessageDate(message.created_at)}</td>
                      <td><span className={`admin-status-pill status-${message.status}`}>{statusNames[message.status]}</span></td>
                      <td><button aria-label={`Read message from ${message.customer_name}`} className="admin-icon-button" onClick={() => setSelected(message)} type="button"><Eye aria-hidden="true" size={17} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="admin-table-pagination">
              <span>{data.total} message{data.total === 1 ? "" : "s"}</span>
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
          <section aria-labelledby="message-details-title" aria-modal="true" className="admin-detail-modal" onKeyDown={trapTabKey} role="dialog">
            <button aria-label="Close message details" className="admin-modal-close" onClick={() => setSelected(null)} ref={closeButtonRef} type="button">×</button>
            <span className="admin-eyebrow">GUEST ENQUIRY</span>
            <h2 id="message-details-title">{selected.subject}</h2>
            <p className="admin-modal-reference">Received {formatMessageDate(selected.created_at)}</p>
            <dl className="admin-detail-list">
              <div><dt>From</dt><dd>{selected.customer_name}</dd></div>
              <div><dt>Email</dt><dd><a href={`mailto:${selected.customer_email}`}>{selected.customer_email}</a></dd></div>
              <div><dt>Phone</dt><dd><a href={`tel:${selected.customer_phone}`}>{selected.customer_phone}</a></dd></div>
              <div><dt>Status</dt><dd><span className={`admin-status-pill status-${selected.status}`}>{statusNames[selected.status]}</span></dd></div>
            </dl>
            <div className="admin-message-body">{selected.message}</div>
            <MessageActions message={selected} disabled={updatingId === selected.id} onChange={(next) => void changeStatus(selected, next)} />
          </section>
        </div>
      )}
    </div>
  );
}

function MessageActions({
  message,
  disabled,
  onChange,
}: {
  message: ContactMessageRow;
  disabled: boolean;
  onChange: (status: ContactMessageStatus) => void;
}) {
  const actions: Partial<Record<ContactMessageStatus, ContactMessageStatus[]>> = {
    new: ["read", "replied", "archived"],
    read: ["replied", "archived"],
    replied: ["read", "archived"],
    archived: ["read", "replied"],
  };
  return (
    <div className="admin-modal-actions">
      {actions[message.status]?.map((status) => (
        <button
          className={status === "archived" ? "admin-action-button" : "admin-primary-button"}
          disabled={disabled}
          key={status}
          onClick={() => onChange(status)}
          type="button"
        >
          {disabled ? "Saving…" : `Mark ${statusNames[status].toLowerCase()}`}
        </button>
      ))}
    </div>
  );
}
