import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ContactMessageInsert } from "./handler.ts";

export async function persistContactMessage(
  contactMessage: ContactMessageInsert,
) {
  const { error } = await getSupabaseAdminClient()
    .from("contact_messages")
    .insert({
      customer_name: contactMessage.name,
      customer_email: contactMessage.email,
      customer_phone: contactMessage.phone,
      subject: contactMessage.subject,
      message: contactMessage.message,
    });

  if (error) {
    throw new Error("The contact message could not be saved.");
  }
}
