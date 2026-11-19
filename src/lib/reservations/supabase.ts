import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ReservationInsert } from "./handler.ts";

export async function persistReservation(reservation: ReservationInsert) {
  const { error } = await getSupabaseAdminClient()
    .from("reservations")
    .insert({
      booking_reference: reservation.bookingReference,
      customer_name: reservation.customerName,
      customer_email: reservation.customerEmail,
      customer_phone: reservation.customerPhone,
      reservation_date: reservation.reservationDate,
      reservation_time: reservation.reservationTime,
      guest_count: reservation.guestCount,
      special_requests: reservation.specialRequests,
    });

  if (error) {
    throw new Error("The reservation could not be saved.");
  }
}
