"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/context";

export function SignOutButton() {
  const router = useRouter();
  const lang = useLang();
  const label = lang === "sw" ? "Toka" : "Sign out";

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-1.5 text-sm text-text-muted hover:text-red-600 transition"
      title={label}
      aria-label={label}
    >
      <LogOut className="w-4 h-4" />
    </button>
  );
}
