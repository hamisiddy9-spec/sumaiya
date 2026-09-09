// Feature flags. Marketplace is OFF by default so the submit flow and gallery
// stay hidden until the owner runs the 0003_marketplace migration and opts in
// (set NEXT_PUBLIC_MARKETPLACE_ENABLED=true). NEXT_PUBLIC_ so the client can
// read it to show/hide the "Submit as template" action.
export const MARKETPLACE_ENABLED =
  process.env.NEXT_PUBLIC_MARKETPLACE_ENABLED === "true";
