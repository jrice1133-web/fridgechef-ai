const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.82;
const COMPRESS_THRESHOLD_BYTES = 400 * 1024;

/**
 * Compress large photos client-side before upload (mobile-friendly).
 * Returns original file when compression is unnecessary or unsupported.
 */
export async function compressImageForUpload(file) {
  if (!file?.type?.startsWith("image/")) {
    return file;
  }

  if (file.size < COMPRESS_THRESHOLD_BYTES && file.type === "image/jpeg") {
    return file;
  }

  if (typeof createImageBitmap !== "function" && typeof Image === "undefined") {
    return file;
  }

  try {
    const bitmap = await loadImageSource(file);
    const { width, height } = fitDimensions(bitmap.width, bitmap.height, MAX_DIMENSION);

    if (
      width === bitmap.width &&
      height === bitmap.height &&
      file.size < COMPRESS_THRESHOLD_BYTES
    ) {
      bitmap.close?.();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close?.();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error("Compression failed"))),
        "image/jpeg",
        JPEG_QUALITY
      );
    });

    const baseName = file.name.replace(/\.[^.]+$/, "") || "scan";
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

async function loadImageSource(file) {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function fitDimensions(width, height, max) {
  if (width <= max && height <= max) {
    return { width, height };
  }
  const ratio = Math.min(max / width, max / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}
