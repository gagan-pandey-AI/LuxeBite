import { z } from "zod";
import { authorizationFailure } from "./http.ts";
import type { AdminAuthorizationResult } from "./authorization";

const categorySchema = z.enum([
  "Starters",
  "Main Course",
  "Chef Specials",
  "Desserts",
  "Beverages",
]);

const imageStoragePathSchema = z
  .string()
  .regex(/^items\/[0-9a-f-]{36}\.(jpg|png|webp)$/i);
const imageUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    if (value.startsWith("/") && !value.startsWith("//")) return true;
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  });

export const menuItemSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().min(3).max(300),
  price: z.number().int().min(1).max(1000000),
  category: categorySchema,
  image_url: imageUrlSchema,
  image_storage_path: imageStoragePathSchema.nullable(),
  image_alt: z.string().trim().min(3).max(240),
  ingredients: z.array(z.string().trim().min(1).max(60)).max(30),
  is_vegetarian: z.boolean(),
  is_bestseller: z.boolean(),
  is_chef_recommended: z.boolean(),
  is_featured: z.boolean(),
  is_available: z.boolean(),
  sort_order: z.number().int().min(-10000).max(100000),
});

export type MenuItemInput = z.infer<typeof menuItemSchema>;

const menuItemPatchSchema = menuItemSchema
  .omit({ id: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0);

interface MenuMutationDependencies<T> {
  authorize: () => Promise<AdminAuthorizationResult>;
  create?: (input: MenuItemInput) => Promise<T>;
  update?: (id: string, input: Partial<Omit<MenuItemInput, "id">>) => Promise<T | null>;
  remove?: (id: string) => Promise<{ imageStoragePath: string | null } | null>;
  cleanupImage?: (path: string) => Promise<void>;
}

function isMenuId(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 100;
}

async function readJson(request: Request): Promise<unknown | Response> {
  try {
    return await request.json();
  } catch {
    return Response.json(
      { error: { code: "INVALID_JSON", message: "The request could not be read." } },
      { status: 400 },
    );
  }
}

export function createMenuMutationHandler<T>(
  dependencies: MenuMutationDependencies<T>,
) {
  return async function handleMenuMutation(request: Request, id?: string) {
    const failure = authorizationFailure(await dependencies.authorize());
    if (failure) return failure;

    if (request.method === "POST") {
      if (!dependencies.create) {
        return Response.json(
          { error: { code: "METHOD_NOT_ALLOWED", message: "Create is not supported on this endpoint." } },
          { status: 405 },
        );
      }
      const payload = await readJson(request);
      if (payload instanceof Response) return payload;
      const parsed = menuItemSchema.safeParse(payload);
      if (!parsed.success) {
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message: "Review the menu item fields.", fields: parsed.error.flatten().fieldErrors } },
          { status: 400 },
        );
      }
      try {
        return Response.json({ item: await dependencies.create(parsed.data) }, { status: 201 });
      } catch {
        return Response.json(
          { error: { code: "CREATE_FAILED", message: "The menu item could not be created." } },
          { status: 500 },
        );
      }
    }

    if (!id || !isMenuId(id)) {
      return Response.json(
        { error: { code: "INVALID_ITEM", message: "The menu item could not be found." } },
        { status: 400 },
      );
    }

    if (request.method === "PATCH") {
      if (!dependencies.update) {
        return Response.json(
          { error: { code: "METHOD_NOT_ALLOWED", message: "Update is not supported on this endpoint." } },
          { status: 405 },
        );
      }
      const payload = await readJson(request);
      if (payload instanceof Response) return payload;
      const parsed = menuItemPatchSchema.safeParse(payload);
      if (!parsed.success) {
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message: "Review the menu item fields.", fields: parsed.error.flatten().fieldErrors } },
          { status: 400 },
        );
      }
      try {
        const item = await dependencies.update(id, parsed.data);
        if (!item) {
          return Response.json(
            { error: { code: "NOT_FOUND", message: "This menu item no longer exists." } },
            { status: 404 },
          );
        }
        return Response.json({ item });
      } catch {
        return Response.json(
          { error: { code: "UPDATE_FAILED", message: "The menu item could not be updated." } },
          { status: 500 },
        );
      }
    }

    if (request.method === "DELETE") {
      if (!dependencies.remove) {
        return Response.json(
          { error: { code: "METHOD_NOT_ALLOWED", message: "Delete is not supported on this endpoint." } },
          { status: 405 },
        );
      }
      try {
        const deleted = await dependencies.remove(id);
        if (!deleted) {
          return Response.json(
            { error: { code: "NOT_FOUND", message: "This menu item no longer exists." } },
            { status: 404 },
          );
        }
        let warning: string | undefined;
        if (deleted.imageStoragePath) {
          try {
            if (!dependencies.cleanupImage) {
              throw new Error("Image cleanup is unavailable.");
            }
            await dependencies.cleanupImage(deleted.imageStoragePath);
          } catch {
            console.error("A deleted menu item's image could not be removed from storage.");
            warning = "The menu item was deleted, but its stored image needs manual cleanup.";
          }
        }
        return Response.json({ deleted: true, warning });
      } catch {
        return Response.json(
          { error: { code: "DELETE_FAILED", message: "The menu item could not be deleted." } },
          { status: 500 },
        );
      }
    }

    return Response.json(
      { error: { code: "METHOD_NOT_ALLOWED", message: "This operation is not supported." } },
      { status: 405 },
    );
  };
}
