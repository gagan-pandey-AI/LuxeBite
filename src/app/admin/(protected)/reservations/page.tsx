import type { Metadata } from "next";
import { ReservationManager } from "@/components/admin/reservation-manager";

export const metadata: Metadata = {
  title: "Reservations | LuxeBite Admin",
  robots: { index: false, follow: false },
};

export default function AdminReservationsPage() {
  return (
    <section className="admin-page">
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">GUEST JOURNEY</span>
          <h1>Reservations</h1>
          <p>Manage booking requests and guest details.</p>
        </div>
      </div>
      <ReservationManager />
    </section>
  );
}
