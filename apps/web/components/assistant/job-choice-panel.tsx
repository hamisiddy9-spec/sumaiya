"use client";

/**
 * The chat's job picker — "lenga kwenye kazi" must not assume which job.
 *
 * The owner's words: *"also the lenga kwenye kazi in chat box iwe na option ya
 * kuchagua kazi ya user yani atoe source au achague zetu"*. Two paths, one
 * place, in his terms:
 *
 *   1. **Chagua kutoka kwenye kazi zetu** — the live feed we actually have,
 *      with a search box. Titles and companies only (the server projects them:
 *      `?light=1`), and the chosen advert is fetched by id afterwards. Nothing
 *      is hardcoded and nothing is invented: if the feed is empty the path is
 *      not offered at all, and a listing with no advert text says so instead of
 *      handing the engine an empty job.
 *   2. **Weka kazi yako mwenyewe** — hands the user to the composer, where both
 *      ways of bringing a job already work and are already tested: pasting the
 *      advert text, and pasting the link (the composer routes a bare URL to
 *      /api/ai/read-url, which is not an AI call and never charges AI quota).
 *
 * COST. Opening the panel: **zero requests** — it is local DOM, and the
 * composer stays usable. Choosing "ours" is one request for the short list
 * (~1–2 KB, no descriptions). Choosing a job is one more request for that
 * single advert. Nothing is fetched on typing: the search is debounced.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Briefcase, Link2, Search, X } from "lucide-react";
import {
  buildPickListUrl,
  buildPickRowUrl,
  jobChoiceModel,
  jobToJd,
  isUsableJd,
  parsePickDetail,
  parsePickResponse,
  type JobPickRow,
} from "@sumaiya/api-client";

const SEARCH_DEBOUNCE_MS = 350;

interface Props {
  sw: boolean;
  /** One of OUR listings was chosen: hand the real advert text to the thread. */
  onPickOurJob: (jd: string, label: string) => void;
  /** The user will bring their own job: focus the composer and say what to paste. */
  onOwnSource: () => void;
  onClose: () => void;
}

type Phase = "idle" | "loading" | "ready" | "empty" | "error";

export function JobChoicePanel({ sw, onPickOurJob, onOwnSource, onClose }: Props) {
  const model = jobChoiceModel();
  const [openPath, setOpenPath] = useState<"ours" | "own" | null>(null);
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<JobPickRow[] | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const reqRef = useRef(0);

  const load = useCallback(async (query: string) => {
    const seq = ++reqRef.current;
    setPhase("loading");
    setNotice("");
    try {
      const res = await fetch(buildPickListUrl({ q: query }));
      const json = await res.json().catch(() => null);
      if (seq !== reqRef.current) return; // a newer search won — drop this answer
      if (!res.ok) {
        setPhase("error");
        setRows(null);
        return;
      }
      const list = parsePickResponse(json);
      setRows(list);
      setPhase(list.length ? "ready" : "empty");
    } catch {
      if (seq !== reqRef.current) return;
      setPhase("error");
      setRows(null);
    }
  }, []);

  // Only the "ours" branch fetches, and only when it is actually opened.
  useEffect(() => {
    if (openPath !== "ours") return;
    void load(q);
    // The first load is on open; later loads come from the debounced search
    // effect below, which owns `q`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openPath]);

  useEffect(() => {
    if (openPath !== "ours") return;
    const id = setTimeout(() => { void load(q); }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const choose = async (row: JobPickRow) => {
    if (busyId) return;
    setBusyId(row.id);
    setNotice("");
    try {
      const res = await fetch(buildPickRowUrl(row.id));
      const json = await res.json().catch(() => null);
      const detail = res.ok ? parsePickDetail(json) : null;
      const jd = detail ? jobToJd(detail) : "";
      if (!isUsableJd(jd)) {
        // The listing exists but carries no usable advert. Say so — never run
        // the engine on a title, and never invent the missing text.
        setNotice(
          sw
            ? "Tangazo hili halina maandishi ya kutosha. Bandika maandishi yenyewe."
            : "This listing has no advert text. Paste the text yourself.",
        );
        return;
      }
      onPickOurJob(jd, [row.title, row.company].filter(Boolean).join(" · "));
    } catch {
      setNotice(sw ? "Imeshindwa kupakia tangazo. Jaribu tena." : "Couldn't load the advert. Try again.");
    } finally {
      setBusyId(null);
    }
  };

  const oursFirst = model.paths[0] === "ours";

  return (
    <section
      aria-label={sw ? "Chagua kazi ya kulenga" : "Choose the job to aim at"}
      className="mb-2 rounded-card-lg border border-border-input bg-card p-3 shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold text-espresso">
          {sw ? "Unataka kulenga kazi ipi?" : "Which job do you want to aim at?"}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label={sw ? "Funga" : "Close"}
          className="shrink-0 text-text-muted hover:text-espresso transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {oursFirst && (
          <button
            type="button"
            aria-expanded={openPath === "ours"}
            onClick={() => { setOpenPath(openPath === "ours" ? null : "ours"); setNotice(""); }}
            className={`flex items-start gap-2.5 text-left rounded-card-lg border p-3 transition ${
              openPath === "ours"
                ? "border-ember bg-ember-tint/50"
                : "border-ember/50 bg-ember-tint/25 hover:border-ember hover:bg-ember-tint/40"
            }`}
          >
            <span className="shrink-0 w-8 h-8 rounded-xl bg-ember text-cream flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-bold text-espresso leading-tight">
                {sw ? "Chagua kutoka kwenye kazi zetu" : "Choose one of our listings"}
              </span>
              <span className="block text-[11px] text-text-body mt-0.5 leading-snug">
                {sw ? "Nafasi za kazi zilizopo sasa." : "Real openings we have right now."}
              </span>
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => { setOpenPath("own"); onOwnSource(); }}
          className="flex items-start gap-2.5 text-left rounded-card-lg border border-border-input p-3 hover:border-ember hover:bg-ember-tint/20 transition"
        >
          <span className="shrink-0 w-8 h-8 rounded-xl bg-sand-2 text-espresso flex items-center justify-center">
            <Link2 className="w-4 h-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-bold text-espresso leading-tight">
              {sw ? "Weka kazi yako mwenyewe" : "Use your own job"}
            </span>
            <span className="block text-[11px] text-text-body mt-0.5 leading-snug">
              {sw ? "Bandika tangazo, au kiungo chake." : "Paste the advert, or its link."}
            </span>
          </span>
        </button>
      </div>

      {openPath === "ours" && (
        <div className="mt-2.5">
          <label className="relative block">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={sw ? "Tafuta — cheo, kampuni au mahali" : "Search — role, company or place"}
              className="w-full pl-8 pr-3 py-2 text-[13px] rounded-input border border-border-input bg-cream text-espresso placeholder:text-text-muted focus:outline-none focus:border-ember"
            />
          </label>

          <div aria-live="polite" className="mt-2 max-h-56 overflow-y-auto">
            {phase === "loading" && (
              <p className="px-1 py-2 text-[12px] text-text-muted">{sw ? "Inatafuta…" : "Searching…"}</p>
            )}
            {phase === "error" && (
              <p className="px-1 py-2 text-[12px] text-text-body">
                {sw ? "Imeshindwa kupakia kazi. Angalia mtandao wako kisha ujaribu tena." : "Couldn't load the jobs. Check your connection and try again."}{" "}
                <button type="button" onClick={() => void load(q)} className="font-semibold text-ember hover:text-ember-hover">
                  {sw ? "Jaribu tena" : "Try again"}
                </button>
              </p>
            )}
            {phase === "empty" && (
              <p className="px-1 py-2 text-[12px] text-text-body">
                {rows === null || q.trim()
                  ? (sw ? `Hakuna kazi inayolingana na “${q.trim()}”. Jaribu neno lingine, au weka kazi yako mwenyewe.` : `Nothing matches “${q.trim()}”. Try another word, or use your own job.`)
                  : (sw ? "Hakuna nafasi za kazi zilizoorodheshwa sasa. Weka kazi yako mwenyewe." : "No openings are listed right now. Use your own job.")}
                {/* The escape hatch, not just the words for it: a search that
                    finds nothing must never dead-end. */}
                <button
                  type="button"
                  onClick={() => { setOpenPath("own"); onOwnSource(); }}
                  className="ml-1 font-semibold text-ember hover:text-ember-hover underline"
                >
                  {sw ? "Weka kazi yako mwenyewe" : "Use your own job"}
                </button>
              </p>
            )}
            {phase === "ready" && rows?.map((row) => (
              <button
                key={row.id}
                type="button"
                disabled={busyId !== null}
                onClick={() => void choose(row)}
                className="w-full text-left px-2 py-2 rounded-lg hover:bg-ember-tint/40 disabled:opacity-50 transition border-b border-border/60 last:border-0"
              >
                <span className="block text-[13px] font-semibold text-espresso leading-tight">{row.title}</span>
                <span className="block text-[11px] text-text-muted mt-0.5">
                  {[row.company, row.location].filter(Boolean).join(" · ")}
                </span>
              </button>
            ))}
          </div>
          {notice && <p className="mt-1 px-1 text-[11px] font-medium text-amber-900">{notice}</p>}
        </div>
      )}
    </section>
  );
}
