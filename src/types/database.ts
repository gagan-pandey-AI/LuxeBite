import type { ReservationStatus } from "@/types/reservations";
import type { ContactMessageStatus } from "@/types/contact";
import type { MenuCategory } from "@/types/menu";

export type ReservationRow = {
  id: string;
  booking_reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  reservation_date: string;
  reservation_time: string;
  guest_count: number;
  special_requests: string | null;
  status: ReservationStatus;
  created_at: string;
  updated_at: string;
};

export type ContactMessageRow = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  created_at: string;
};

export type AdminUserRow = {
  user_id: string;
  created_at: string;
};

export type MenuItemRow = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  image_url: string;
  image_storage_path: string | null;
  image_alt: string;
  ingredients: string[];
  is_vegetarian: boolean;
  is_bestseller: boolean;
  is_chef_recommended: boolean;
  is_featured: boolean;
  is_available: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type RestaurantSettingsRow = {
  id: string;
  restaurant_name: string;
  address: string;
  phone: string;
  email: string;
  opening_hours: string;
  time_zone: string;
  currency: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      reservations: {
        Row: ReservationRow;
        Insert: Omit<
          ReservationRow,
          "id" | "created_at" | "updated_at" | "status"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          status?: ReservationStatus;
        };
        Update: Partial<ReservationRow>;
        Relationships: [];
      };
      contact_messages: {
        Row: ContactMessageRow;
        Insert: Omit<ContactMessageRow, "id" | "created_at" | "status"> & {
          id?: string;
          created_at?: string;
          status?: ContactMessageStatus;
        };
        Update: Partial<ContactMessageRow>;
        Relationships: [];
      };
      admin_users: {
        Row: AdminUserRow;
        Insert: Omit<AdminUserRow, "created_at"> & { created_at?: string };
        Update: Partial<AdminUserRow>;
        Relationships: [];
      };
      menu_items: {
        Row: MenuItemRow;
        Insert: Omit<MenuItemRow, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<MenuItemRow>;
        Relationships: [];
      };
      restaurant_settings: {
        Row: RestaurantSettingsRow;
        Insert: Omit<RestaurantSettingsRow, "updated_at"> & {
          updated_at?: string;
        };
        Update: Partial<RestaurantSettingsRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      admin_reservation_activity: {
        Args: { p_from: string; p_to: string };
        Returns: {
          reservation_date: string;
          reservation_count: number;
          pending_count: number;
          confirmed_count: number;
          rejected_count: number;
          cancelled_count: number;
        }[];
      };
      admin_search_contact_messages: {
        Args: {
          p_search: string;
          p_status: string;
          p_page: number;
          p_page_size: number;
        };
        Returns: (ContactMessageRow & { total_count: number })[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
