// Application Copilot — the readiness checklist tying CV match + cover letter
// + interview prep + submission into one workspace.
//
// Deterministic and pure: given the application's real state it computes which
// steps are done. Everything is derived from existing records (no new schema):
//   - cv:          an application has an attached CV (cvId set)
//   - coverLetter: an application has a generated cover letter (coverLetterId)
//   - interview:   the user has started interview prep for this job
//                  (client-local marker — /interview?app=<id> is the entry)
//   - submit:      the application left the "draft" stage (applied or beyond)
//
// The UI never claims a step is done that isn't — the checklist reflects real
// state, and each undone step carries its action (attach/generate/start/submit).

export type CopilotStepId = "cv" | "coverLetter" | "interview" | "submit";

export interface CopilotStep {
  id: CopilotStepId;
  done: boolean;
}

export interface CopilotState {
  steps: CopilotStep[];
  doneCount: number;
  total: number;
  percent: number;
  /** Every step complete — ready to hit submit. */
  ready: boolean;
}

export interface CopilotInput {
  cvAttached: boolean;
  coverLetterAttached: boolean;
  interviewStarted: boolean;
  /** status != "draft" (applied/interviewing/offer) means submitted. */
  submitted: boolean;
}

export function buildCopilotState(input: CopilotInput): CopilotState {
  const steps: CopilotStep[] = [
    { id: "cv", done: input.cvAttached },
    { id: "coverLetter", done: input.coverLetterAttached },
    { id: "interview", done: input.interviewStarted },
    { id: "submit", done: input.submitted },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const total = steps.length;
  return {
    steps,
    doneCount,
    total,
    percent: Math.round((doneCount / total) * 100),
    ready: doneCount === total,
  };
}
