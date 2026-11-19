"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import type { RestaurantSettingsRow } from "@/types/database";

interface SettingsResponse {
  settings: RestaurantSettingsRow;
  profile: { email: string | null };
}

export function SettingsForm() {
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [draft, setDraft] = useState({
    restaurant_name: "",
    address: "",
    phone: "",
    email: "",
    opening_hours: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  async function loadSettings() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/settings", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message ?? "Settings could not be loaded.");
      const loaded = result as SettingsResponse;
      setSettings(loaded);
      setDraft({
        restaurant_name: loaded.settings.restaurant_name,
        address: loaded.settings.address,
        phone: loaded.settings.phone,
        email: loaded.settings.email,
        opening_hours: loaded.settings.opening_hours,
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Settings could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadSettings(); }, []);

  function setField(key: keyof typeof draft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message ?? "Settings could not be saved.");
      setSettings((current) => current ? { ...current, settings: result.settings } : current);
      setNotice("Restaurant settings saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Settings could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    setError("");
    setLoggingOut(true);
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result?.error?.message ?? "Sign-out could not be completed.");
      }
      router.replace("/admin/login");
      router.refresh();
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "Sign-out could not be completed.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="admin-settings-layout">
      {notice && <p className="admin-inline-success" role="status">{notice}</p>}
      {error && (
        <div className="admin-inline-error" role="alert">
          <span>{error}</span>
          <button className="admin-text-button" onClick={() => void loadSettings()} type="button">Retry</button>
        </div>
      )}
      {loading ? (
        <div aria-label="Loading settings" className="admin-settings-skeleton" role="status"><span /><span /><span /><span /></div>
      ) : settings ? (
        <>
          <section aria-labelledby="admin-account-title" className="admin-panel admin-account-panel">
            <div className="admin-panel-heading">
              <div><span className="admin-eyebrow">ACCOUNT</span><h2 id="admin-account-title">Administrator profile</h2></div>
            </div>
            <div className="admin-account-detail">
              <span className="admin-avatar" aria-hidden="true">{settings.profile.email?.slice(0, 1).toUpperCase() ?? "A"}</span>
              <span><strong>{settings.profile.email ?? "Verified administrator"}</strong><small>Supabase Auth account · Permissions are managed server-side</small></span>
              <button className="admin-action-button admin-account-logout" disabled={loggingOut} onClick={() => void logout()} type="button">
                <LogOut aria-hidden="true" size={14} />{loggingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </section>
          <section aria-labelledby="restaurant-settings-title" className="admin-panel">
            <div className="admin-panel-heading">
              <div><span className="admin-eyebrow">RESTAURANT PROFILE</span><h2 id="restaurant-settings-title">Restaurant configuration</h2></div>
            </div>
            <form className="admin-settings-form" onSubmit={(event) => void saveSettings(event)}>
              <label className="admin-form-field">Restaurant name
                <input maxLength={100} minLength={2} onChange={(event) => setField("restaurant_name", event.target.value)} required value={draft.restaurant_name} />
              </label>
              <label className="admin-form-field">Contact email
                <input autoComplete="email" maxLength={254} onChange={(event) => setField("email", event.target.value)} required type="email" value={draft.email} />
              </label>
              <label className="admin-form-field">Phone
                <input autoComplete="tel" maxLength={30} onChange={(event) => setField("phone", event.target.value)} required type="tel" value={draft.phone} />
              </label>
              <label className="admin-form-field">Address
                <input maxLength={300} onChange={(event) => setField("address", event.target.value)} required value={draft.address} />
              </label>
              <label className="admin-form-field admin-form-wide">Opening hours
                <textarea maxLength={500} minLength={3} onChange={(event) => setField("opening_hours", event.target.value)} required rows={3} value={draft.opening_hours} />
              </label>
              <div className="admin-settings-meta">
                <span>Currency: {settings.settings.currency}</span>
                <span>Time zone: {settings.settings.time_zone}</span>
              </div>
              <div className="admin-settings-submit">
                <p>Administrator access and roles cannot be changed here.</p>
                <button className="admin-primary-button" disabled={saving} type="submit">{saving ? "Saving…" : "Save settings"}</button>
              </div>
            </form>
          </section>
        </>
      ) : !error ? (
        <div className="admin-empty-state"><h2>Settings are not configured</h2><p>Apply the admin workspace migration to create restaurant settings.</p></div>
      ) : null}
    </div>
  );
}
