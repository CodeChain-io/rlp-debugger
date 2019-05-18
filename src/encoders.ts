import BN from "bn.js";

export function numberEncoder(string: string): Buffer | null {
  if (isNaN(+string)) {
    return null;
  }
  try {
    const bn = new BN(+string);
    const hexString = bn.toString("hex");
    return Buffer.from(hexString.length % 2 === 1 ? "0" + hexString : hexString, "hex");
  } catch (e) {
    return null;
  }
}

export function hexEncoder(string: string): Buffer | null {
  try {
    return Buffer.from(
      string.slice(2).length % 2 === 1 ? "0" + string.slice(2) : string.slice(2),
      "hex",
    );
  } catch (_) {
    return null;
  }
}

export function stringEncoder(string: string): Buffer | null {
  try {
    return Buffer.from(string, "utf-8");
  } catch (_) {
    return null;
  }
}

export function timestampEncoder(string: string): Buffer | null {
  try {
    let timestamp = Date.parse(string) / 1000;
    return Buffer.from(timestamp.toString(16));
  } catch (_) {
    return null;
  }
}
