import type { Metadata } from "next";
import { MenuManager } from "@/components/admin/menu-manager";

export const metadata: Metadata = {
  title: "Menu Management | LuxeBite Admin",
  robots: { index: false, follow: false },
};

export default function AdminMenuPage() {
  return (
    <section className="admin-page">
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">THE OFFERING</span>
          <h1>Menu management</h1>
          <p>Keep the public menu current and beautifully considered.</p>
        </div>
      </div>
      <MenuManager />
    </section>
  );
}
