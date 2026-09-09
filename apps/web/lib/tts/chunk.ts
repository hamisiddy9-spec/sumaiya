// TTS chunking — sentence-aware text splitting for speech synthesis.
//
// Browser speechSynthesis (Chrome especially) cuts off long utterances
// (~15s), so any text bound for TTS must be split into short speakable
// chunks. Chunking here is deterministic and testable: it splits on sentence
// boundaries first, then commas, then words — never mid-word.
//
// NOTE: no regex lookbehind here — esbuild lowers regexes for the ES2017
// target and lookbehind breaks silently under vitest.

export interface ChunkOptions {
  /** Soft maximum chunk length in characters (default 200). */
  maxLen?: number;
}

/** Split text into speakable chunks, preferring sentence boundaries. */
export function chunkText(text: string, opts: ChunkOptions = {}): string[] {
  const maxLen = opts.maxLen ?? 200;
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const chunks: string[] = [];
  let buffer = "";

  const push = (piece: string) => {
    const p = piece.trim();
    if (!p) return;
    if (buffer && buffer.length + p.length + 1 > maxLen) {
      chunks.push(buffer);
      buffer = p;
    } else {
      buffer = buffer ? `${buffer} ${p}` : p;
    }
  };

  // Sentence-ish boundaries first (punctuation kept attached).
  const sentences = clean.match(/[^.!?;:]+[.!?;:]*(?:\s+|$)/g) ?? [clean];
  for (const rawSentence of sentences) {
    const sentence = rawSentence.trim();
    if (!sentence) continue;
    if (sentence.length <= maxLen) {
      push(sentence);
      continue;
    }
    // Long sentence: try comma boundaries.
    const parts = sentence.match(/[^,]+(?:,|\s+|$)/g) ?? [sentence];
    for (const rawPart of parts) {
      const part = rawPart.trim();
      if (!part) continue;
      if (part.length <= maxLen) {
        push(part);
        continue;
      }
      // Still too long: split on words, never mid-word.
      const words = part.split(/\s+/);
      let piece = "";
      for (const word of words) {
        if (piece && piece.length + word.length + 1 > maxLen) {
          push(piece);
          piece = word;
        } else {
          piece = piece ? `${piece} ${word}` : word;
        }
      }
      if (piece) push(piece);
    }
  }
  if (buffer) chunks.push(buffer);
  return chunks;
}
