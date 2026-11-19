import { randomUUID } from "node:crypto";
import { authorizeAdmin } from "@/lib/admin/guard";
import { authorizationFailure } from "@/lib/admin/http";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const maximumImageSize = 5 * 1024 * 1024;

async function matchesImageType(file: File, extension: string) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (extension === "jpg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (extension === "png") {
    return bytes.length >= 8 &&
      bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
      bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  }
  return bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
}

export async function POST(request: Request) {
  const failure = authorizationFailure(await authorizeAdmin());
  if (failure) return failure;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { error: { code: "INVALID_UPLOAD", message: "Choose an image to upload." } },
      { status: 400 },
    );
  }

  const file = formData.get("image");
  if (!(file instanceof File)) {
    return Response.json(
      { error: { code: "INVALID_UPLOAD", message: "Choose an image to upload." } },
      { status: 400 },
    );
  }
  const extension = allowedTypes.get(file.type);
  if (
    !extension ||
    file.size === 0 ||
    file.size > maximumImageSize ||
    !(await matchesImageType(file, extension))
  ) {
    return Response.json(
      { error: { code: "INVALID_IMAGE", message: "Use a JPEG, PNG, or WebP image under 5 MB." } },
      { status: 400 },
    );
  }

  const path = `items/${randomUUID()}.${extension}`;
  try {
    const { data, error } = await getSupabaseAdminClient()
      .storage.from("menu-images")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;

    const { data: publicUrl } = getSupabaseAdminClient()
      .storage.from("menu-images")
      .getPublicUrl(data.path);
    return Response.json(
      { path: data.path, imageUrl: publicUrl.publicUrl },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: { code: "UPLOAD_FAILED", message: "The image could not be uploaded." } },
      { status: 500 },
    );
  }
}
