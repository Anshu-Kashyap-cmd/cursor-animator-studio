import { writeCurFile } from "./curWriter.ts";

/**
 * Creates a RIFF chunk (4-byte ID, 4-byte size, data, optional padding byte)
 */
function createChunkBytes(id: string, data: Uint8Array): Uint8Array {
  const isOdd = data.length % 2 !== 0;
  const totalLength = 8 + data.length + (isOdd ? 1 : 0);
  const buffer = new ArrayBuffer(totalLength);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // Write Chunk ID
  for (let i = 0; i < 4; i++) {
    view.setUint8(i, id.charCodeAt(i));
  }
  // Write Chunk Size
  view.setUint32(4, data.length, true);
  // Write Chunk Data
  bytes.set(data, 8);
  // Write Padding Byte if odd
  if (isOdd) {
    bytes[totalLength - 1] = 0;
  }
  return bytes;
}

export interface AniFrameInput {
  width: number;
  height: number;
  hotspotX: number;
  hotspotY: number;
  pngDataUrl: string;
  durationMs: number;
}

/**
 * Assembles multiple frames into a spec-correct Windows .ani (Animated Cursor) file.
 */
export function writeAniFile(frames: AniFrameInput[], defaultDurationJiffies = 10): Uint8Array {
  const nFrames = frames.length;
  const nSteps = frames.length; // 1-to-1 mapping for simplicity

  if (nFrames === 0) {
    throw new Error("Cannot write an .ani file with 0 frames.");
  }

  // 1. Generate individual .cur files for each frame
  const curFilesBytes: Uint8Array[] = frames.map((f) =>
    writeCurFile(f.width, f.height, f.hotspotX, f.hotspotY, f.pngDataUrl)
  );

  // 2. Build the 'anih' (ANI Header) chunk (36 bytes payload)
  const anihPayload = new Uint8Array(36);
  const anihView = new DataView(anihPayload.buffer);

  anihView.setUint32(0, 36, true);                  // cbSizeOf
  anihView.setUint32(4, nFrames, true);             // nFrames
  anihView.setUint32(8, nSteps, true);              // nSteps
  anihView.setUint32(12, 0, true);                  // cx
  anihView.setUint32(16, 0, true);                  // cy
  anihView.setUint32(20, 0, true);                  // cBitCount
  anihView.setUint32(24, 0, true);                  // nPlanes
  anihView.setUint32(28, defaultDurationJiffies, true); // jifRate (default rate)
  anihView.setUint32(32, 0x03, true);               // flags (AF_ICON = 1, AF_SEQ = 2)

  const anihChunk = createChunkBytes("anih", anihPayload);

  // 3. Build the 'rate' chunk (one DWORD per step, duration in jiffies)
  // 1 jiffy = 1/60th of a second.
  const ratePayload = new Uint8Array(nSteps * 4);
  const rateView = new DataView(ratePayload.buffer);
  for (let i = 0; i < nSteps; i++) {
    const ms = frames[i].durationMs;
    // jiffies = ms / (1000 / 60)
    const jiffies = Math.max(1, Math.round(ms / (1000 / 60)));
    rateView.setUint32(i * 4, jiffies, true);
  }
  const rateChunk = createChunkBytes("rate", ratePayload);

  // 4. Build the 'seq ' chunk (one DWORD per step, frame indices)
  const seqPayload = new Uint8Array(nSteps * 4);
  const seqView = new DataView(seqPayload.buffer);
  for (let i = 0; i < nSteps; i++) {
    seqView.setUint32(i * 4, i, true);
  }
  const seqChunk = createChunkBytes("seq ", seqPayload);

  // 5. Build the LIST 'fram' chunk containing 'icon' sub-chunks
  const iconChunks: Uint8Array[] = curFilesBytes.map((curBytes) =>
    createChunkBytes("icon", curBytes)
  );

  const listPayloadLength = 4 + iconChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const listPayload = new Uint8Array(listPayloadLength);
  
  // Write 'fram'
  listPayload[0] = 102; // 'f'
  listPayload[1] = 114; // 'r'
  listPayload[2] = 97;  // 'a'
  listPayload[3] = 109; // 'm'

  let listOffset = 4;
  for (const chunk of iconChunks) {
    listPayload.set(chunk, listOffset);
    listOffset += chunk.length;
  }

  const listChunk = createChunkBytes("LIST", listPayload);

  // 6. Assemble RIFF container
  const riffPayloadLength = 4 + anihChunk.length + rateChunk.length + seqChunk.length + listChunk.length;
  const riffPayload = new Uint8Array(riffPayloadLength);

  // Write 'ACON'
  riffPayload[0] = 65; // 'A'
  riffPayload[1] = 67; // 'C'
  riffPayload[2] = 79; // 'O'
  riffPayload[3] = 78; // 'N'

  let riffOffset = 4;
  riffPayload.set(anihChunk, riffOffset);
  riffOffset += anihChunk.length;

  riffPayload.set(rateChunk, riffOffset);
  riffOffset += rateChunk.length;

  riffPayload.set(seqChunk, riffOffset);
  riffOffset += seqChunk.length;

  riffPayload.set(listChunk, riffOffset);

  const finalAniBytes = createChunkBytes("RIFF", riffPayload);

  return finalAniBytes;
}
