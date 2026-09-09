// The single source of truth for Sumaiya's core AI guardrail.
//
// The platform's promise: AI may improve HOW something is written — grammar,
// wording, structure, clarity, keyword phrasing — but it must NEVER invent WHAT
// is true about the user. Every concrete fact on a document has to come from the
// person themselves. This is what keeps an AI-built CV honest and safe to send to
// an employer.
//
// Every content-generating prompt embeds this exact string so the rule is
// identical everywhere and can be asserted in tests (see the AI test suite).
export const TRUTH_CONSTRAINT =
  "TRUTH CONSTRAINT (absolute): never invent facts about the candidate — no employers, job titles, dates, numbers, percentages, metrics, achievements, skills, certifications or qualifications they did not actually provide. You may fix grammar, sharpen wording, restructure content and suggest relevant keywords, but every concrete fact must come from what the user gave you. Where a measurable result would strengthen a point but none was provided, use a concrete qualitative outcome instead of a fabricated figure.";
