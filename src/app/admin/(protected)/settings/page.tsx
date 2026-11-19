import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = {
  title: "Settings | LuxeBite Admin",
  robots: { index: false, follow: false },
};

export default function AdminSettingsPage() {
  return (
    <section className="admin-page">
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">PREFERENCES</span>
          <h1>Settings</h1>
          <p>Restaurant configuration and administrator account.</p>
        </div>
      </div>
      <SettingsForm />
    </section>
  );
}
