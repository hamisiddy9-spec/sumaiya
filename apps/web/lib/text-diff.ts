// Word-level diff — the "what changed" view for an AI rewrite (blueprint H8:
// the user always sees exactly what the AI touched). Pure, no deps.
//
// Tokenises on whitespace (keeping the trailing space with each token so the
// reassembled text is identical), runs an LCS, and emits a run list the UI
// paints: unchanged text plain, insertions highlighted, deletions struck.

export type DiffPart = { type: "same" | "add" | "del"; text: string };

function tokenize(s: string): string[] {
  // keep separators attached so join("") round-trips
  return s.match(/\S+\s*|\s+/g) ?? [];
}

export function wordDiff(before: string, after: string): DiffPart[] {
  const a = tokenize(before);
  const b = tokenize(after);
  const n = a.length;
  const m = b.length;

  // LCS length table
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        a[i].trim() === b[j].trim() && a[i].trim() !== ""
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const parts: DiffPart[] = [];
  const push = (type: DiffPart["type"], text: string) => {
    if (!text) return;
    const last = parts[parts.length - 1];
    if (last && last.type === type) last.text += text;
    else parts.push({ type, text });
  };

  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i].trim() === b[j].trim() && a[i].trim() !== "") {
      push("same", b[j]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push("del", a[i]);
      i++;
    } else {
      push("add", b[j]);
      j++;
    }
  }
  while (i < n) push("del", a[i++]);
  while (j < m) push("add", b[j++]);
  return parts;
}

/** Rough "how much of the text is new" — 0..1. Drives the summary line. */
export function changeRatio(parts: DiffPart[]): number {
  let changed = 0;
  let total = 0;
  for (const p of parts) {
    const len = p.text.trim().length;
    total += len;
    if (p.type !== "same") changed += len;
  }
  return total ? changed / total : 0;
}
