/**
 * Shrink a photo in the browser before upload (phone cameras give 3–8 MB images).
 * Keeps the camera's rotation, fits inside maxDim × maxDim and returns a JPEG data URL.
 */
export async function compressImageFile(
 file: File,
 { maxDim = 1600, quality = 0.82 }: { maxDim?: number; quality?: number } = {}
): Promise<string> {
 if (!file.type.startsWith("image/")) throw new Error("Please choose a photo (JPG or PNG).");

 const source = await loadImageSource(file);
 const scale = Math.min(1, maxDim / Math.max(source.width, source.height));
 const w = Math.max(1, Math.round(source.width * scale));
 const h = Math.max(1, Math.round(source.height * scale));

 const canvas = document.createElement("canvas");
 canvas.width = w;
 canvas.height = h;
 const ctx = canvas.getContext("2d");
 if (!ctx) throw new Error("This browser cannot process photos.");
 ctx.fillStyle = "#ffffff";
 ctx.fillRect(0, 0, w, h);
 ctx.drawImage(source.image, 0, 0, w, h);
 source.cleanup();
 return canvas.toDataURL("image/jpeg", quality);
}

type LoadedImage = { image: CanvasImageSource; width: number; height: number; cleanup: () => void };

async function loadImageSource(file: File): Promise<LoadedImage> {
 if (typeof createImageBitmap === "function") {
  try {
   const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
   return { image: bmp, width: bmp.width, height: bmp.height, cleanup: () => bmp.close() };
  } catch {
   // Fall through to <img> (older Safari)
  }
 }
 const url = URL.createObjectURL(file);
 try {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
   const el = new Image();
   el.onload = () => resolve(el);
   el.onerror = () => reject(new Error("Could not read this photo. Try taking it again."));
   el.src = url;
  });
  return { image: img, width: img.naturalWidth, height: img.naturalHeight, cleanup: () => URL.revokeObjectURL(url) };
 } catch (e) {
  URL.revokeObjectURL(url);
  throw e;
 }
}
