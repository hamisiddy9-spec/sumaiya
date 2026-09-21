// Definitive OTP-length probe: ask Supabase's Admin API to generate a session
// link for a throwaway address and print ONLY the length/shape of the OTP it
// returns. Then delete the probe user. No secret is printed.
// Why: the native app hard-codes 8 digits and the web form accepts 6, so one of
// them is wrong and only the server knows which.
import fs from "fs";

const env = Object.fromEntries(
  fs
    .readFileSync("C:/Users/hamis/projects/_hdd-data/env/supabase.env", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const base = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const probe = "otp-length-probe@sumaiya.app";

const res = await fetch(`${base}/auth/v1/admin/generate_link`, {
  method: "POST",
  headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json" },
  body: JSON.stringify({ type: "magiclink", email: probe }),
});
const json = await res.json();
console.log("HTTP:", res.status);
if (!res.ok) {
  console.log("ERROR BODY:", JSON.stringify(json).slice(0, 400));
} else {
  const otp = json.email_otp ?? json.properties?.email_otp;
  const userId = json.user?.id ?? json.id;
  console.log("email_otp present:", typeof otp === "string");
  console.log("email_otp LENGTH:", typeof otp === "string" ? otp.length : "n/a");
  console.log("email_otp shape:", typeof otp === "string" ? otp.replace(/\d/g, "D") : "n/a");
  console.log("user id:", userId);
  // Clean up the throwaway auth user.
  const del = await fetch(`${base}/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: { apikey: key, authorization: `Bearer ${key}` },
  });
  console.log("cleanup DELETE status:", del.status);
}
