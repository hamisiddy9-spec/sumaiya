import * as Sharing from "expo-sharing";
import { dialog } from "../components/ui";
import type { CV } from "@sumaiya/types";

export async function shareCV(cv: CV, pdfUri: string): Promise<void> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      dialog.alert("Not Available", "Sharing is not available on your device");
      return;
    }

    const name = cv.data.personalInfo?.fullName?.trim();
    await Sharing.shareAsync(pdfUri, {
      mimeType: "application/pdf",
      dialogTitle: name ? `Share ${name}'s CV` : "Share your CV",
      UTI: "com.adobe.pdf",
    });
  } catch (error) {
    console.error("Share failed:", error);
    dialog.alert("Error", "Failed to share CV");
  }
}

export async function openPDFPreview(pdfUri: string): Promise<void> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      dialog.alert("Not Available", "PDF preview not available on your device");
      return;
    }

    await Sharing.shareAsync(pdfUri, {
      mimeType: "application/pdf",
      dialogTitle: "View CV",
    });
  } catch (error) {
    console.error("PDF preview failed:", error);
    dialog.alert("Error", "Failed to open PDF preview");
  }
}
