# LuxeBite administrator provisioning

Administrator access is an explicit server-checked allowlist. The application
does not expose public sign-up, and user-editable Auth metadata is not used to
grant administrator access.

## Configure and migrate

1. Copy `.env.example` to `.env.local` and set the Supabase project URL, anon
   key, and service-role key. Keep the service-role key in server-only
   environment configuration; never use a `NEXT_PUBLIC_` prefix for it.
2. Apply the existing reservation and contact migrations, followed by
   `20261120003500_create_admin_workspace.sql`, using the Supabase CLI or the
   Supabase SQL editor.
3. Confirm the migration created the `admin_users`, `menu_items`, and
   `restaurant_settings` tables and the `menu-images` storage bucket.

## Invite an administrator

1. In Supabase Dashboard → Authentication → Users, invite the person's
   work email. Do not enable public registration for this application.
2. After the invite creates the Auth user, copy that user's UUID from the
   Dashboard.
3. Using the Supabase SQL editor as a trusted project operator, insert only
   that UUID into the allowlist:

   ```sql
   insert into public.admin_users (user_id)
   values ('AUTH_USER_UUID')
   on conflict (user_id) do nothing;
   ```

4. The invited user can then sign in at `/admin/login`. The server verifies
   their Supabase Auth identity and checks `admin_users` before rendering
   protected pages or serving any admin API.

To revoke access, delete the matching row from `public.admin_users`. The
Auth account may then be disabled or removed separately in Supabase.

Do not grant access through `user_metadata`, client-side checks, or an
administrator-editable UI. The service-role key is used only by server code;
anonymous and authenticated roles have no table privileges on the private
reservation, contact, or administrator records. Contact and reservation data
must be tested against the configured project before treating the deployment
as live.

The login throttle uses the application's shared process-local limiter. It is
best-effort on a single server instance; configure a trusted shared edge or
distributed rate limiter for production deployments with multiple instances.
