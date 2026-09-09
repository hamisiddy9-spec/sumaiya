/**
 * Turns an AttachSheet choice into Attachment objects for the composer.
 *
 * camera / photo / file resolve here. `link` (needs a text prompt) and `myDoc`
 * (needs the CV list) are handled by the screen. Classification + upload happen
 * server-side once /api/mobile/import ships — until then the attachment rides
 * along as context and Sumaiya is told what it is.
 */
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import type { Attachment, AttachmentKind } from "../components/chat/chat-types";

let counter = 0;
const id = () => `att-${Date.now()}-${++counter}`;

function fromImage(uri: string, name?: string): Attachment {
  return { id: id(), kind: "image", uri, name: name || "photo.jpg", mimeType: "image/jpeg", status: "ready" };
}

export async function pickFromCamera(): Promise<Attachment[] | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchCameraAsync({ quality: 0.85 });
  if (res.canceled || !res.assets?.length) return null;
  return res.assets.map((a) => fromImage(a.uri, a.fileName ?? undefined));
}

export async function pickFromLibrary(): Promise<Attachment[] | null> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.85,
    allowsMultipleSelection: true,
    selectionLimit: 5,
  });
  if (res.canceled || !res.assets?.length) return null;
  return res.assets.map((a) => fromImage(a.uri, a.fileName ?? undefined));
}

export async function pickDocument(): Promise<Attachment[] | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled || !res.assets?.length) return null;
  return res.assets.map((a) => ({
    id: id(),
    kind: "document" as const,
    uri: a.uri,
    name: a.name,
    mimeType: a.mimeType,
    size: a.size ?? undefined,
    status: "ready" as const,
  }));
}

export function linkAttachment(url: string): Attachment {
  return { id: id(), kind: "link", uri: url.trim(), name: url.trim(), status: "ready" };
}

export function cvAttachment(cvId: string, title: string): Attachment {
  return { id: id(), kind: "cv", uri: cvId, name: title, status: "ready" };
}

export async function resolveAttachment(kind: AttachmentKind | "camera" | "photo" | "file"): Promise<Attachment[] | null> {
  switch (kind) {
    case "camera":
      return pickFromCamera();
    case "photo":
      return pickFromLibrary();
    case "file":
      return pickDocument();
    default:
      return null;
  }
}

/** A short line telling Sumaiya what the user attached, prepended to the turn. */
export function describeAttachments(atts: Attachment[]): string {
  if (!atts.length) return "";
  const parts = atts.map((a) => {
    if (a.kind === "link") return `a job link (${a.uri})`;
    if (a.kind === "cv") return `my existing CV "${a.name}"`;
    if (a.kind === "document") return `a document (${a.name})`;
    return `a photo (${a.name})`;
  });
  return `[Attached: ${parts.join(", ")}]`;
}
