const MAX_BYTES = 500000;

/** Resize and compress a photo before sending it to the server. @param {File} file */
export async function compressPhoto(file) {
  if (!file.size) throw new Error(`Empty image: ${file.name}`);
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(`Cannot read ${file.name}. Please use a JPG, PNG or WebP photo.`);
  }
  try {
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    let width = Math.max(1, Math.round(bitmap.width * scale));
    let height = Math.max(1, Math.round(bitmap.height * scale));
    // Keep already-small photos intact instead of recompressing them needlessly.
    if (file.size < MAX_BYTES && scale === 1 && /image\/(jpeg|png|webp)/.test(file.type)) return file;
    const canvas = document.createElement("canvas");
    for (let attempt = 0; attempt < 8; attempt++) {
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Image compression is unavailable in this browser.");
      context.drawImage(bitmap, 0, 0, width, height);
      for (const quality of [0.88, 0.78, 0.68, 0.58]) {
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
        if (blob && blob.size < MAX_BYTES) {
          const ext = blob.type === "image/webp" ? "webp" : "png";
          return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.${ext}`, { type: blob.type });
        }
      }
      width = Math.max(1, Math.round(width * 0.8));
      height = Math.max(1, Math.round(height * 0.8));
    }
    throw new Error(`Could not compress ${file.name} below 500 KB. Please choose another image.`);
  } finally {
    bitmap.close();
  }
}
