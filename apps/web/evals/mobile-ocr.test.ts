import { describe, it, expect } from "vitest";
import {
  sniffImageMime,
  stripDataUrl,
  base64DecodedBytes,
  isOcrTextUsable,
} from "../lib/api/routes/mobile-ocr";

// Pure guards for the native OCR route — no tesseract, no network.

describe("sniffImageMime", () => {
  it("accepts jpeg/png/webp data URLs", () => {
    expect(sniffImageMime("data:image/jpeg;base64,abc")).toBe("image/jpeg");
    expect(sniffImageMime("data:image/png;base64,abc")).toBe("image/png");
    expect(sniffImageMime("data:image/webp;base64,abc")).toBe("image/webp");
  });
  it("rejects non-images and bare base64", () => {
    expect(sniffImageMime("data:text/plain;base64,abc")).toBeNull();
    expect(sniffImageMime("abc")).toBeNull();
    expect(sniffImageMime("")).toBeNull();
  });
});

describe("stripDataUrl", () => {
  it("strips the prefix and keeps base64", () => {
    expect(stripDataUrl("data:image/jpeg;base64,QUJD")).toBe("QUJD");
  });
  it("returns null for malformed input", () => {
    expect(stripDataUrl("not-a-data-url")).toBeNull();
  });
});

describe("base64DecodedBytes", () => {
  it("computes decoded length including padding", () => {
    // "QUJD" decodes to 3 bytes
    expect(base64DecodedBytes("QUJD")).toBe(3);
    // 4-char groups: 3 bytes each
    expect(base64DecodedBytes("QUJDQUJD")).toBe(6);
  });
});

describe("isOcrTextUsable", () => {
  it("accepts real CV-like text", () => {
    expect(isOcrTextUsable("Juma Mushi\nSoftware Engineer\nDar es Salaam, Tanzania\njuma@example.com\n\nFive years building fintech products across East Africa.")).toBe(true);
  });
  it("rejects very short output", () => {
    expect(isOcrTextUsable("hi")).toBe(false);
    expect(isOcrTextUsable("")).toBe(false);
  });
  it("rejects symbol soup with few letters", () => {
    expect(isOcrTextUsable("### $$$ +++ ~~~ --- === 1234567890")).toBe(false);
  });
});
