import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Lang } from "@/lib/i18n/translations";
import { PAYMENTS_ENABLED } from "@/lib/features";
import { PLANS, isPlanId, type PlanId } from "@/lib/payments/plans";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan: planParam } = await searchParams;
  const plan: PlanId = isPlanId(planParam ?? "") ? (planParam as PlanId) : "week";

  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const h = await headers();
  const lang = (h.get("x-lang") ?? "sw") as Lang;

  if (!session?.user) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/checkout?plan=${plan}`)}`);
  }

  // Direct navigation while checkout is dark: tell the truth rather than 404.
  if (!PAYMENTS_ENABLED) {
    return (
      <div className="bg-sand min-h-screen">
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <h1 className="font-display font-extrabold text-2xl text-espresso mb-3">
            {lang === "sw" ? "Bure kwa sasa" : "Free for now"}
          </h1>
          <p className="text-text-muted">
            {lang === "sw"
              ? "Malipo bado hayajaanzishwa — kila kitu ni bure. Utaona bei hapa pindi mipango ya malipo itakapoanza."
              : "Payments aren't switched on yet — everything is free. You'll see pricing here once paid plans go live."}
          </p>
        </div>
      </div>
    );
  }

  const def = PLANS[plan];

  return (
    <div className="bg-sand min-h-screen">
      <div className="max-w-md mx-auto px-4 py-12">
        <h1 className="font-display font-extrabold text-2xl md:text-3xl tracking-tight text-espresso mb-2">
          {lang === "sw" ? "Lipia Premium" : "Get Premium"}
        </h1>
        <p className="text-text-muted mb-8">
          {lang === "sw"
            ? "Lipa kwa simu (M-Pesa, Airtel, Tigo, Halopesa). Utapokea ujumbe wa kuthibitisha kwenye simu yako."
            : "Pay with mobile money (M-Pesa, Airtel, Tigo, Halopesa). You'll get a confirmation prompt on your phone."}
        </p>

        <CheckoutForm
          lang={lang}
          plan={plan}
          planLabel={lang === "sw" ? def.labelSw : def.labelEn}
          priceTzs={def.amount.TZS}
          days={def.days}
        />
      </div>
    </div>
  );
}
