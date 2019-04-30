import BN from "bn.js";

export function numberDecoder(buffer: Buffer): string | null {
  if (buffer.length > 8) {
    return null;
  }
  try {
    const bn = new BN(buffer);
    return bn.toString(10);
  } catch (e) {
    return null;
  }
}

export function hexDecoder(buffer: Buffer, groupBytes = 4): string[] | null {
  let result = [];
  for (let i = 0; i < buffer.length; i += groupBytes) {
    result.push(buffer.slice(i, Math.min(i + groupBytes, buffer.length)).toString("hex"));
  }
  return result;
}

export function stringDecoder(bytes: Buffer, noControlChars = true): string | null {
  function getTrailingByte(index: number) {
    if ((bytes[index] & 0xc0) !== 0x80) throw new Error("Invalid utf8 sequence");
    return bytes[index] & 0x3f;
  }

  try {
    let result = "";
    for (let i = 0; i < bytes.length; i++) {
      const byte1 = bytes[i];
      let cp;
      if (byte1 < 0x80) {
        cp = byte1;
      } else if ((byte1 & 0xe0) === 0xc0) {
        const byte2 = getTrailingByte(++i);
        cp = ((byte1 & 0x1f) << 6) | byte2;
      } else if ((byte1 & 0xf0) === 0xe0) {
        const byte2 = getTrailingByte(++i);
        const byte3 = getTrailingByte(++i);
        cp = ((byte1 & 0x0f) << 12) | (byte2 << 6) | byte3;
      } else if ((byte1 & 0xf8) === 0xf0) {
        const byte2 = getTrailingByte(++i);
        const byte3 = getTrailingByte(++i);
        const byte4 = getTrailingByte(++i);
        cp = ((byte1 & 0x07) << 0x12) | (byte2 << 0x0c) | (byte3 << 0x06) | byte4;
      } else {
        throw new Error("Invalid utf8 sequence");
      }

      if (noControlChars === true) {
        // https://en.wikipedia.org/wiki/C0_and_C1_control_codes
        const c0 = cp >= 0x0000 && cp <= 0x001f;
        const whitespace = cp === 0x09 || cp === 0x0a || cp === 0x0d;
        const c1 = cp >= 0x0080 && cp <= 0x009f;
        if ((c0 && !whitespace) || c1) {
          return null; // control characters
        }
      }
      result += String.fromCodePoint(cp);
    }

    return result;
  } catch (_) {
    return null;
  }
}

export function timestampDecoder(buffer: Buffer): string | null {
  if (buffer.length > 4) {
    return null;
  }
  const timestamp = buffer.reduce((accum, byte) => (accum << 8) + byte);
  return new Date(timestamp * 1000).toISOString();
}
