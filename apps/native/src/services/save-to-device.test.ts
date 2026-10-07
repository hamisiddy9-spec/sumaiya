const mockRequestDir = jest.fn();
const mockCreateFile = jest.fn();
const mockWrite = jest.fn();
const mockRead = jest.fn();

jest.mock("expo-file-system/legacy", () => ({
  EncodingType: { UTF8: "utf8", Base64: "base64" },
  StorageAccessFramework: {
    requestDirectoryPermissionsAsync: (...a: unknown[]) => mockRequestDir(...a),
    createFileAsync: (...a: unknown[]) => mockCreateFile(...a),
    writeAsStringAsync: (...a: unknown[]) => mockWrite(...a),
  },
  readAsStringAsync: (...a: unknown[]) => mockRead(...a),
}));

// Platform.OS is much easier to steer than to fake the whole RN module.
jest.mock("react-native", () => ({ Platform: { OS: "android" } }));

import { fileNameFromUri, saveToPhone, shouldOfferShare } from "./save-to-device";
import { Platform } from "react-native";

describe("fileNameFromUri", () => {
  it("takes the readable name the export already gave the file", () => {
    // renamePdf gives the printed PDF a real name, so 'Pakua' must not save it
    // as 'a1b2c3d4-....pdf' (the defect the letter path was fixed for).
    expect(fileNameFromUri("file:///data/user/0/pro.sumaiya.app/cache/Amina Yusuf - Storekeeper CV.pdf")).toBe(
      "Amina Yusuf - Storekeeper CV.pdf",
    );
  });

  it("decodes a percent-encoded name and strips a query", () => {
    expect(fileNameFromUri("file:///cache/Amina%20Yusuf%20CV.pdf?x=1")).toBe("Amina Yusuf CV.pdf");
  });

  it("does not crash on a literal % and still guarantees a .pdf extension", () => {
    expect(fileNameFromUri("file:///cache/100% CV.pdf")).toBe("100% CV.pdf");
    expect(fileNameFromUri("file:///cache/CV")).toBe("CV.pdf");
  });

  it("never returns an empty name", () => {
    expect(fileNameFromUri("file:///cache/")).toBe("document.pdf");
  });
});

describe("saveToPhone — 'Pakua' writes a file the user can find", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Platform as { OS: string }).OS = "android";
    mockRead.mockResolvedValue("QUJD");
    mockCreateFile.mockResolvedValue("content://com.android.providers.downloads/document/42");
    mockWrite.mockResolvedValue(undefined);
    mockRequestDir.mockResolvedValue({
      granted: true,
      directoryUri: "content://com.android.externalstorage.documents/tree/downloads",
    });
  });

  it("writes the PDF into the folder the user picked", async () => {
    const out = await saveToPhone("file:///cache/CV.pdf", "CV.pdf");
    expect(out).toEqual({ status: "saved", fileName: "CV.pdf" });
    // The bytes written are the bytes read — a copy, not a re-render.
    expect(mockRead).toHaveBeenCalledWith("file:///cache/CV.pdf", { encoding: "base64" });
    expect(mockCreateFile).toHaveBeenCalledWith(
      "content://com.android.externalstorage.documents/tree/downloads",
      "CV.pdf",
      "application/pdf",
    );
    expect(mockWrite).toHaveBeenCalledWith(
      "content://com.android.providers.downloads/document/42",
      "QUJD",
      { encoding: "base64" },
    );
  });

  it("treats a dismissed folder picker as a cancelled action, not a failure", async () => {
    mockRequestDir.mockResolvedValue({ granted: false, directoryUri: null });
    expect(await saveToPhone("file:///cache/CV.pdf", "CV.pdf")).toEqual({ status: "cancelled" });
    // Nothing was created in a folder the user never chose.
    expect(mockCreateFile).not.toHaveBeenCalled();
    expect(mockWrite).not.toHaveBeenCalled();
  });

  it("fails before creating an empty file when the source cannot be read", async () => {
    mockRead.mockRejectedValue(new Error("no such file"));
    await expect(saveToPhone("file:///cache/gone.pdf", "gone.pdf")).rejects.toThrow("no such file");
    // A zero-byte PDF in Downloads that opens fine is worse than an error.
    expect(mockCreateFile).not.toHaveBeenCalled();
  });

  it("reports 'unsupported' where SAF does not exist, so the caller can share instead", async () => {
    (Platform as { OS: string }).OS = "ios";
    expect(await saveToPhone("file:///cache/CV.pdf", "CV.pdf")).toEqual({ status: "unsupported" });
    (Platform as { OS: string }).OS = "android";
    mockRequestDir.mockRejectedValue(new Error("no SAF"));
    expect(await saveToPhone("file:///cache/CV.pdf", "CV.pdf")).toEqual({ status: "unsupported" });
  });

  it("falls through to the next anchor when the first one throws before the picker opens", async () => {
    // An OEM content-provider that rejects the Documents anchor outright must
    // not be treated the same as "no SAF at all" — Download (or the bare
    // picker) may still work.
    mockRequestDir
      .mockRejectedValueOnce(new Error("Documents anchor unsupported on this ROM"))
      .mockResolvedValueOnce({
        granted: true,
        directoryUri: "content://com.android.externalstorage.documents/tree/download",
      });
    const out = await saveToPhone("file:///cache/CV.pdf", "CV.pdf");
    expect(out).toEqual({ status: "saved", fileName: "CV.pdf" });
    expect(mockRequestDir).toHaveBeenCalledTimes(2);
    expect(mockCreateFile).toHaveBeenCalledWith(
      "content://com.android.externalstorage.documents/tree/download",
      "CV.pdf",
      "application/pdf",
    );
  });

  it("is only unsupported once every anchor candidate has thrown", async () => {
    mockRequestDir.mockRejectedValue(new Error("no SAF anywhere"));
    expect(await saveToPhone("file:///cache/CV.pdf", "CV.pdf")).toEqual({ status: "unsupported" });
    // Documents, Download, and the bare picker were all tried before giving up.
    expect(mockRequestDir).toHaveBeenCalledTimes(3);
  });
});

describe("shouldOfferShare — the one place that decides the silent-failure question", () => {
  it("is false only when the file actually landed somewhere", () => {
    expect(shouldOfferShare({ status: "saved", fileName: "CV.pdf" })).toBe(false);
  });

  it("is true for a dismissed folder picker, so 'cancelled' is never left silent", () => {
    expect(shouldOfferShare({ status: "cancelled" })).toBe(true);
  });

  it("is true where SAF is unsupported, so sharing is still offered", () => {
    expect(shouldOfferShare({ status: "unsupported" })).toBe(true);
  });
});
