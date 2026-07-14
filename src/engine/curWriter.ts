/**
 * Converts a PNG Data URL to a Uint8Array of bytes
 */
export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Creates a single static .cur file from a frame (either as DataURL or ImageData)
 */
export function writeCurFile(
  width: number,
  height: number,
  hotspotX: number,
  hotspotY: number,
  pngDataUrl: string
): Uint8Array {
  const pngBytes = dataUrlToBytes(pngDataUrl);

  const headerSize = 6;
  const entrySize = 16;
  const totalHeaderSize = headerSize + entrySize;
  const totalSize = totalHeaderSize + pngBytes.length;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // 1. Write ICONDIR Header
  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 2, true); // type (2 = cursor)
  view.setUint16(4, 1, true); // count (1 frame)

  // 2. Write ICONDIRENTRY
  view.setUint8(6, width >= 256 ? 0 : width);
  view.setUint8(7, height >= 256 ? 0 : height);
  view.setUint8(8, 0); // colorCount
  view.setUint8(9, 0); // reserved
  view.setUint16(10, hotspotX, true);
  view.setUint16(12, hotspotY, true);
  view.setUint32(14, pngBytes.length, true); // bytesInRes
  view.setUint32(18, totalHeaderSize, true); // imageOffset (starts right after headers)

  // 3. Write raw PNG bytes
  bytes.set(pngBytes, totalHeaderSize);

  return bytes;
}
