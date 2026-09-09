import { redirect } from "next/navigation";

// Sumaiya uses passwordless magic-link / Google sign-in, so there is no
// separate sign-up flow — the same screen creates the account on first login.
// This route existed only as a dead link ("Create a free account") that 404'd;
// forward it to the single auth screen instead.
export const dynamic = "force-dynamic";

export default function SignUpPage() {
  redirect("/sign-in");
}
