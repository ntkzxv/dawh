import { supabase } from "@/utils/supabase";

export interface CropArea {
  x: number; // percentage (0-100) or pixels
  y: number;
  width: number;
  height: number;
}

/**
 * Loads an image from a file object
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Crops, resizes (max 400x400), and converts an image to WebP format (quality 80%)
 * Returns a Blob ready for Supabase Storage upload
 */
export async function processAvatarImage(
  image: HTMLImageElement,
  cropBox: { x: number; y: number; size: number },
  targetSize: number = 400,
  quality: number = 0.8
): Promise<{ blob: Blob; sizeKB: number }> {
  const canvas = document.createElement("canvas");
  canvas.width = targetSize;
  canvas.height = targetSize;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas 2d context");
  }

  // Draw smooth cropped 1:1 square image
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    image,
    cropBox.x,
    cropBox.y,
    cropBox.size,
    cropBox.size,
    0,
    0,
    targetSize,
    targetSize
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas conversion to WebP failed"));
          return;
        }

        const sizeKB = Math.round(blob.size / 1024);
        if (sizeKB > 500) {
          reject(new Error(`ขนาดไฟล์หลังประมวลผล (${sizeKB} KB) เกินขีดจำกัด 500 KB`));
          return;
        }

        resolve({ blob, sizeKB });
      },
      "image/webp",
      quality
    );
  });
}

/**
 * Uploads an avatar image to Supabase Storage bucket 'avatars'
 * and updates avatar_url in the database (employees & profiles table)
 */
export async function uploadAvatarAndSyncDb(
  userId: string,
  blob: Blob
): Promise<{ publicUrl: string; error?: string }> {
  try {
    const fileName = `${userId}.webp`;
    const filePath = fileName;

    // 1. Upload to Supabase Storage bucket "avatars" with upsert: true
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, blob, {
        contentType: "image/webp",
        upsert: true,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.warn("Storage upload error:", uploadError);
      // If bucket doesn't exist or storage permission issue, fallback to base64 or report error
      throw uploadError;
    }

    // 2. Get Public URL with cache-busting timestamp
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    // 3. Update employees table in database
    const { error: empError } = await supabase
      .from("employees")
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (empError) {
      console.warn("Could not update employees table avatar_url:", empError);
    }

    // 4. Update profiles table if present
    try {
      await supabase
        .from("profiles")
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
    } catch {
      // Non-blocking
    }

    // 5. Update Supabase Auth user metadata
    try {
      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });
    } catch {
      // Non-blocking
    }

    // 6. Update localStorage cache
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("dawh_user_profile");
        if (cached) {
          const parsed = JSON.parse(cached);
          parsed.avatar_url = publicUrl;
          localStorage.setItem("dawh_user_profile", JSON.stringify(parsed));
        }
      } catch {
        // Non-blocking
      }
    }

    return { publicUrl };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return { publicUrl: "", error: message };
  }
}
