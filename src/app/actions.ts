"use server";

import { z } from "zod";
import { generateImageTags } from "@/ai/flows/generate-image-tags";

const GenerateTagsInputSchema = z.object({
  dataUri: z.string().min(1, "Data URI is required."),
});

export async function generateTagsAction(input: { dataUri: string }) {
  try {
    const { dataUri } = GenerateTagsInputSchema.parse(input);
    const { tags } = await generateImageTags({ photoDataUri: dataUri });
    return { success: true as const, tags };
  } catch (error) {
    console.error("Tag generation failed:", error);
    return {
      success: false as const,
      error: "Failed to generate tags. Please try again.",
    };
  }
}

const FetchImageFromUrlSchema = z.object({
  url: z.string().url("A valid URL is required."),
});

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export async function fetchImageFromUrlAction(input: { url: string }) {
  try {
    const { url } = FetchImageFromUrlSchema.parse(input);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return {
        success: false as const,
        error: `Failed to fetch image: ${res.status}`,
      };
    }

    const contentType = res.headers.get("content-type")?.toLowerCase() || "";
    const isJpeg =
      contentType.includes("image/jpeg") || contentType.includes("image/jpg");
    const isPng = contentType.includes("image/png");
    if (!isJpeg && !isPng) {
      return {
        success: false as const,
        error: "URL must point to a PNG or JPEG image.",
      };
    }

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_FILE_SIZE_BYTES) {
      return {
        success: false as const,
        error: "File is too large. Maximum size is 2MB.",
      };
    }

    const extension = isPng ? "png" : "jpg";
    const urlObj = new URL(url);
    const lastPath = urlObj.pathname.split("/").pop() || `image.${extension}`;
    const lastDot = lastPath.lastIndexOf(".");
    const baseNameRaw = lastDot > 0 ? lastPath.slice(0, lastDot) : lastPath;
    const safeBaseName =
      baseNameRaw.replace(/[\\/:*?"<>|]/g, "").trim() || "image";
    const fileName = `${safeBaseName}.${extension}`;

    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUri = `data:${contentType};base64,${base64}`;

    return { success: true as const, dataUri, fileName };
  } catch (error) {
    console.error("Fetch image from URL failed:", error);
    return { success: false as const, error: "Failed to load image from URL." };
  }
}
