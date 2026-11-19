import type { Metadata } from "next";
import { DashboardOverview } from "@/components/admin/dashboard-overview";

export const metadata: Metadata = {
  title: "Overview | LuxeBite Admin",
  robots: { index: false, follow: false },
};

export default function AdminDashboardPage() {
  return (
    <section className="admin-page">
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">YOUR RESTAURANT, AT A GLANCE</span>
          <h1>Restaurant overview</h1>
          <p>A considered view of bookings, guests, and the menu.</p>
        </div>
      </div>
      <DashboardOverview />
    </section>
  );
}
