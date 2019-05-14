import BN from "bn.js";

export function numberEncoder(string: string): Buffer | null {
  if (isNaN(+string)) {
    return null;
  }
  try {
    const bn = new BN(+string);
    return Buffer.from(bn.toString("hex"), "hex");
  } catch (e) {
    return null;
  }
}

export function hexEncoder(string: string): Buffer | null {
  try {
    return Buffer.from(string, "hex");
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
