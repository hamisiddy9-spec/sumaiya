import { describe, expect, it } from "vitest";
import {
  EVENTS,
  ACTIVATION_EVENTS,
  isKnownEvent,
  type AnalyticsEventName,
} from "./events";

describe("analytics event catalog", () => {
  it("EVENTS maps every name to itself (no typos)", () => {
    for (const [k, v] of Object.entries(EVENTS)) {
      expect(v).toBe(k);
    }
  });

  it("isKnownEvent recognises catalogued names and rejects others", () => {
    expect(isKnownEvent("export_completed")).toBe(true);
    expect(isKnownEvent(EVENTS.ats_checked)).toBe(true);
    expect(isKnownEvent("export-complete")).toBe(false);
    expect(isKnownEvent("random_event")).toBe(false);
  });

  it("every activation event exists in the catalog", () => {
    for (const e of ACTIVATION_EVENTS) {
      expect(isKnownEvent(e)).toBe(true);
    }
  });

  it("EVENTS is frozen so a name cannot be mutated at runtime", () => {
    expect(Object.isFrozen(EVENTS)).toBe(true);
  });

  it("keeps the events the current codebase already fires", () => {
    // Guardrail: these are live call sites in the editor / ATS checker. If one
    // is renamed here without updating the call site, the funnel breaks.
    const live: AnalyticsEventName[] = [
      "sample_cv_loaded",
      "wizard_started",
      "wizard_step_completed",
      "first_name_entered",
      "document_created",
      "cv_editor_opened",
      "template_changed",
      "ats_checked",
      "export_started",
      "export_completed",
      "export_failed",
      "document_exported",
      "guest_download_wall",
      "job_target_sample_jd_used",
    ];
    for (const e of live) expect(isKnownEvent(e)).toBe(true);
  });
});
