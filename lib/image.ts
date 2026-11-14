// Browser only: shrink a screenshot before sending it to /api/read-plan,
// so the upload is small and the model answers inside the 10 s budget.

const MAX_SIDE = 1280;

/** Returns the JPEG as base64 (no "data:" prefix). */
export async function shrinkImage(file: File, maxSide = MAX_SIDE, quality = 0.82): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", quality).split(",")[1];
}
