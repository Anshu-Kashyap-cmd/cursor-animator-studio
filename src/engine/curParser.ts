export interface CursorFrame {
  width: number;
  height: number;
  hotspotX: number;
  hotspotY: number;
  imageData: ImageData;
  dataUrl: string; // PNG representation
  durationMs: number;
}

/**
 * Loads an image URL into a Promise of HTMLImageElement
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error("Failed to load image: " + e));
    img.src = url;
  });
}

/**
 * Parses an ArrayBuffer containing a .cur or .ico file.
 * Returns an array of parsed CursorFrame objects.
 */
export async function parseCurFile(buffer: ArrayBuffer, defaultDurationMs = 300): Promise<CursorFrame[]> {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  if (buffer.byteLength < 6) {
    throw new Error("File too small to contain a valid cursor header.");
  }

  // 1. Read ICONDIR Header
  const reserved = view.getUint16(0, true);
  const type = view.getUint16(2, true);
  const count = view.getUint16(4, true);

  if (reserved !== 0) {
    throw new Error("This doesn't look like a valid cursor/icon file (reserved field must be 0).");
  }
  if (type !== 1 && type !== 2) {
    throw new Error("Unsupported file type. Must be CUR (2) or ICO (1).");
  }

  const frames: CursorFrame[] = [];

  // 2. Read ICONDIRENTRY records
  let offset = 6;
  for (let i = 0; i < count; i++) {
    if (offset + 16 > buffer.byteLength) {
      break;
    }

    const rawWidth = view.getUint8(offset);
    const rawHeight = view.getUint8(offset + 1);
    const colorCount = view.getUint8(offset + 2);
    const reservedEntry = view.getUint8(offset + 3);
    const hotspotX = view.getUint16(offset + 4, true); // Overlaps with color planes in ICO
    const hotspotY = view.getUint16(offset + 6, true); // Overlaps with bits per pixel in ICO
    const bytesInRes = view.getUint32(offset + 8, true);
    const imageOffset = view.getUint32(offset + 12, true);

    const width = rawWidth === 0 ? 256 : rawWidth;
    const height = rawHeight === 0 ? 256 : rawHeight;

    offset += 16;

    if (imageOffset + bytesInRes > buffer.byteLength) {
      continue; // Corrupt entry
    }

    // Extract raw image payload
    const rawImageBytes = bytes.subarray(imageOffset, imageOffset + bytesInRes);

    // Detect if PNG
    const isPng =
      rawImageBytes.length >= 8 &&
      rawImageBytes[0] === 0x89 &&
      rawImageBytes[1] === 0x50 &&
      rawImageBytes[2] === 0x4e &&
      rawImageBytes[3] === 0x47 &&
      rawImageBytes[4] === 0x0d &&
      rawImageBytes[5] === 0x0a &&
      rawImageBytes[6] === 0x1a &&
      rawImageBytes[7] === 0x0a;

    let blob: Blob;
    if (isPng) {
      blob = new Blob([rawImageBytes], { type: "image/png" });
    } else {
      // Reconstruct BMP by prepending 14-byte BITMAPFILEHEADER
      const bmpHeader = new Uint8Array(14);
      // bfType = 'BM'
      bmpHeader[0] = 0x42;
      bmpHeader[1] = 0x4D;

      const totalSize = 14 + rawImageBytes.length;
      // bfSize
      bmpHeader[2] = totalSize & 0xff;
      bmpHeader[3] = (totalSize >> 8) & 0xff;
      bmpHeader[4] = (totalSize >> 16) & 0xff;
      bmpHeader[5] = (totalSize >> 24) & 0xff;

      // bfReserved1, bfReserved2 = 0

      // bfOffBits (offset to pixel data)
      // Read the first 4 bytes of DIB which is biSize (typically 40)
      let biSize = 40;
      if (rawImageBytes.length >= 4) {
        biSize = rawImageBytes[0] | (rawImageBytes[1] << 8) | (rawImageBytes[2] << 16) | (rawImageBytes[3] << 24);
      }
      
      let biBitCount = 32;
      if (rawImageBytes.length >= 16) {
        biBitCount = rawImageBytes[14] | (rawImageBytes[15] << 8);
      }

      let paletteSize = 0;
      if (biBitCount <= 8) {
        paletteSize = (1 << biBitCount) * 4;
      }

      const pixelOffset = 14 + biSize + paletteSize;
      bmpHeader[10] = pixelOffset & 0xff;
      bmpHeader[11] = (pixelOffset >> 8) & 0xff;
      bmpHeader[12] = (pixelOffset >> 16) & 0xff;
      bmpHeader[13] = (pixelOffset >> 24) & 0xff;

      const fullBmpBytes = new Uint8Array(14 + rawImageBytes.length);
      fullBmpBytes.set(bmpHeader, 0);
      fullBmpBytes.set(rawImageBytes, 14);

      blob = new Blob([fullBmpBytes], { type: "image/bmp" });
    }

    const blobUrl = URL.createObjectURL(blob);
    try {
      const img = await loadImage(blobUrl);

      // Create canvas to extract ImageData and handle double biHeight DIBs
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Could not create off-screen canvas context.");
      }

      // If DIB height was doubled, the image height decoded by the browser will be 2 * height.
      // We crop and draw only the top half which represents the actual color image.
      if (!isPng && img.naturalHeight === height * 2) {
        ctx.drawImage(img, 0, 0, width, height, 0, 0, width, height);
      } else {
        ctx.drawImage(img, 0, 0, width, height);
      }

      const imageData = ctx.getImageData(0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/png");

      frames.push({
        width,
        height,
        hotspotX: type === 2 ? hotspotX : Math.floor(width / 2),
        hotspotY: type === 2 ? hotspotY : Math.floor(height / 2),
        imageData,
        dataUrl,
        durationMs: defaultDurationMs,
      });
    } catch (err) {
      console.error("Error decoding frame:", err);
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  }

  if (frames.length === 0) {
    throw new Error("No valid image frames could be parsed from this file.");
  }

  return frames;
}
