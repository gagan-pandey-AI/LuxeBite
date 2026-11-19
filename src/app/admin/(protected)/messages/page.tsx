import type { Metadata } from "next";
import { MessageManager } from "@/components/admin/message-manager";

export const metadata: Metadata = {
  title: "Contact Messages | LuxeBite Admin",
  robots: { index: false, follow: false },
};

export default function AdminMessagesPage() {
  return (
    <section className="admin-page">
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">INBOX</span>
          <h1>Contact messages</h1>
          <p>Thoughtful replies begin with thoughtful listening.</p>
        </div>
      </div>
      <MessageManager />
    </section>
  );
}
