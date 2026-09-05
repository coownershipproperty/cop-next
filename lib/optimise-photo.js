import sharp from "sharp";

/** Enforce photo dimensions and byte size before storage. @param {Buffer} input */
export async function optimisePhoto(input) {
  const metadata = await sharp(input, { limitInputPixels: 100000000 }).metadata();
  if (!metadata.width || !metadata.height) throw new Error("Invalid photo.");
  // Preserve compliant browser output without another lossy encoding pass.
  if (input.length < 500000 && Math.max(metadata.width, metadata.height) <= 2000 &&
      ["jpeg", "png", "webp"].includes(metadata.format) && (!metadata.orientation || metadata.orientation === 1) &&
      (!metadata.pages || metadata.pages === 1)) {
    return { buffer: input, width: metadata.width, height: metadata.height,
      ext: metadata.format === "jpeg" ? "jpg" : metadata.format,
      contentType: `image/${metadata.format}` };
  }
  for (let edge = 2000; edge >= 400; edge = Math.floor(edge * 0.8)) {
    for (const quality of [88, 78, 68, 58]) {
      const { data, info } = await sharp(input, { limitInputPixels: 100000000 }).rotate()
        .resize({ width: edge, height: edge, fit: "inside", withoutEnlargement: true })
        .webp({ quality }).toBuffer({ resolveWithObject: true });
      if (data.length < 500000) return { buffer: data, width: info.width, height: info.height, ext: "webp", contentType: "image/webp" };
    }
  }
  throw new Error("Could not compress photo below 500 KB.");
}
