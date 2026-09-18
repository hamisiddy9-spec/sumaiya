import type {
  CampaignFunnelReport,
  CampaignSourceFunnel,
} from "@/lib/campaign/aggregate";
import type { CampaignFunnelStep } from "@/lib/analytics/events";

/**
 * The campaign funnel, rendered — everything the admin campaign page shows,
 * with the data passed in.
 *
 * Split from the page on purpose: the page owns the admin gate and the DB read,
 * this owns the presentation, so the funnel can be rendered against any report
 * (a fixture, a future export, the live rows) without a Supabase session. It is
 * a server component with no data access of its own — the only way it can lie
 * is if the report it is handed is wrong, and that report is computed by
 * lib/campaign/aggregate.ts.
 */

/** Step names in both languages — the label says what the step MEANS. */
const STEP_LABELS: Record<CampaignFunnelStep, { sw: string; en: string; note: string }> = {
  campaign_landing: {
    sw: "Walifika (scan)",
    en: "Landings",
    note: "QR ilipofungua ukurasa",
  },
  ats_checked: {
    sw: "Walikagua ATS",
    en: "ATS check",
    note: "ukurasa ulitumika",
  },
  sign_in_completed: {
    sw: "Walijiunga / waliingia",
    en: "Signed in",
    note: "wapo kwenye akaunti",
  },
  document_created: {
    sw: "Waliunda hati",
    en: "Document created",
    note: "CV au barua",
  },
};

function count(v: number): string {
  return v.toLocaleString("en-US");
}

/** null renders as an em dash — a rate with no denominator is absent, not 0. */
function rate(v: number | null): string {
  if (v === null) return "—";
  return `${v}%`;
}

function shortDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Metric({
  label,
  sw,
  value,
  accent,
}: {
  label: string;
  sw: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-card px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-text-muted">
        {label} · {sw}
      </p>
      <p className={`font-display font-extrabold text-3xl mt-1 tracking-tight ${accent ?? "text-espresso"}`}>
        {value}
      </p>
    </div>
  );
}

function SourceCard({ source }: { source: CampaignSourceFunnel }) {
  return (
    <div className="bg-card border border-border-input rounded-xl p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-mono font-semibold text-espresso text-base">src={source.src}</h2>
        <p className="text-xs text-text-muted">
          Tukio {count(source.events)} · mwisho {shortDate(source.lastSeenAt)} · mwanzo{" "}
          {shortDate(source.firstSeenAt)}
        </p>
      </div>

      <div className="flex flex-wrap gap-4 mt-3 text-xs">
        <span className="text-text-body">
          <strong className="text-espresso text-sm">{count(source.landings)}</strong> walifika
        </span>
        <span className="text-text-body">
          <strong className="text-espresso text-sm">{count(source.newAccounts)}</strong> akaunti
          mpya <span className="text-amber-700">*</span>
        </span>
      </div>

      <div className="mt-4 divide-y divide-border">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 pb-2 text-[10px] font-mono uppercase tracking-[1.5px] text-text-muted">
          <span>Hatua · Step</span>
          <span className="text-right">Wageni · Visitors</span>
          <span className="text-right w-24">Kupungua · Drop-off</span>
        </div>
        {source.steps.map((step, i) => {
          const label = STEP_LABELS[step.step];
          const prevStep = i > 0 ? source.steps[i - 1].step : null;
          return (
            <div key={step.step} className="grid grid-cols-[1fr_auto_auto] gap-3 py-2 items-baseline">
              <div className="min-w-0">
                <p className="text-sm text-espresso truncate">
                  {label.sw} <span className="text-text-muted">/ {label.en}</span>
                </p>
                <p className="text-[11px] text-text-muted">{label.note}</p>
              </div>
              <p className="text-right font-display font-extrabold text-lg text-espresso tabular-nums">
                {count(step.visitors)}
              </p>
              <p className="text-right w-24 text-sm text-text-body tabular-nums">
                {rate(step.dropOffRate)}
                {step.incomplete && (
                  <span className="block text-[10px] text-amber-700">
                    hatua ya awali haijakamilika
                  </span>
                )}
                {!step.incomplete && step.comparedTo && step.comparedTo !== prevStep && (
                  <span className="block text-[10px] text-text-muted">
                    vs {STEP_LABELS[step.comparedTo].sw}
                  </span>
                )}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CampaignFunnelView({ report }: { report: CampaignFunnelReport }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[2px] text-ember-hover">
          Poster campaigns
        </p>
        <h1 className="font-display font-extrabold text-3xl text-espresso tracking-tight mt-1">
          Kampeni — bango limetoa nani?
        </h1>
        <p className="text-sm text-text-body mt-2 max-w-3xl">
          Kila bango/kilato chenye QR chenye{" "}
          <code className="font-mono text-xs bg-sand px-1 py-0.5 rounded">?src=</code> hurekodiwa
          hapa. Namba zinatoka kwenye{" "}
          <code className="font-mono text-xs bg-sand px-1 py-0.5 rounded">campaign_event</code> —
          hifadhidata yetu, si dashboard ya mtu mwingine.
        </p>
        <p className="text-xs text-text-muted mt-1">
          Window: siku {report.windowDays} zilizopita · kutoka {shortDate(report.since)} hadi{" "}
          {shortDate(report.generatedAt)} · Rows: {count(report.totals.events)}
        </p>
      </div>

      {/* ── What these numbers are, and are not ─────────────────────────── */}
      <div className="bg-sand border border-border-input rounded-xl p-5">
        <h2 className="text-sm font-semibold text-espresso mb-2">
          Namba hizi zinasema nini (na hazisemi nini)
        </h2>
        <ul className="space-y-1.5 text-xs text-text-body">
          <li>
            <strong>Zilizopimwa (measured):</strong> kila hatua ni idadi ya <em>vivinjari tofauti</em>{" "}
            (visitorId) vilivyofika hatua hiyo — si idadi ya page views. Mtu mmoja anaye-refresh mara
            tano ni mmoja.
          </li>
          <li>
            <strong>Imetolewa kwa hesabu (derived):</strong> asilimia ya kupungua (drop-off) kati ya
            hatua mbili zilizopimwa. Inapimwa dhidi ya hatua ya mwisho iliyokuwa na watu — hatua tupu
            katikati haifuti namba ya kampeni. Hakuna denominator →{" "}
            <span className="font-mono">—</span>, kamwe si 0%.
          </li>
          <li>
            <strong>Imeripotiwa na kivinjari (client-reported):</strong> hatua za baada ya kuwasili
            zinatoka kwenye browser — hifadhi yetu inazithibitisha kama zilivyoripotiwa, si zaidi.
            Akaunti mpya pia inatoka kwenye bendera ya <code className="font-mono">isNew</code> ya
            mteja.
          </li>
          <li>
            <strong>Haipatikani:</strong> chanzo cha <code className="font-mono">src</code> kwenye
            rekodi ya akaunti yenyewe — mtu anayesajili kwenye kifaa kingine (au baada ya kufuta
            storage) hawezi kuunganishwa na bango alilo-scan.
          </li>
        </ul>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric label="Campaigns" sw="Kampeni" value={count(report.totals.sources)} />
        <Metric label="Landings" sw="Walifika" value={count(report.totals.landings)} accent="text-ember" />
        <Metric
          label="New accounts"
          sw="Akaunti mpya"
          value={count(report.totals.newAccounts)}
          accent="text-pine"
        />
        <Metric label="Events" sw="Matukio" value={count(report.totals.events)} />
      </div>

      {/* ── A failed read is NOT an empty campaign ───────────────────────── */}
      {/* The empty state further down asserts "nothing was recorded, and that
          is a real answer". When the read threw, that assertion is false and
          the same zeros mean "we could not look" — so the two can never be
          rendered from the same condition. */}
      {report.coverage.readFailed && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-espresso mb-2">
            Hatukuweza kusoma data · Could not read the campaign data
          </h2>
          <p className="text-sm text-text-body">
            Ombi la hifadhidata lilishindwa, kwa hivyo namba zote hapa chini{" "}
            <strong>hazipimwi</strong>. Hii <em>si</em> &ldquo;bango halikuleta mtu&rdquo; —
            ni kwamba hatukuweza kuangalia. Sasisha ukurasa; kama kunaendelea, angalia kumbukumbu
            za seva kwa{" "}
            <code className="font-mono text-xs bg-sand px-1 py-0.5 rounded">
              campaign_event read failed
            </code>
            .
          </p>
        </div>
      )}

      {!report.coverage.readFailed &&
        (report.sources.length === 0 ? (
        <div className="bg-card border border-border-input rounded-xl p-6">
          <h2 className="text-sm font-semibold text-espresso mb-2">
            Hakuna ushahidi wa bango bado · No poster traffic recorded yet
          </h2>
          <p className="text-sm text-text-body">
            Kwenye siku {report.windowDays} zilizopita hakuna tukio lililofika kwenye kampeni yoyote.
            Hii ni hali halali, si hitilafu: ufuatiliaji huu ulianza kuandika siku ambayo{" "}
            <code className="font-mono text-xs bg-sand px-1 py-0.5 rounded">campaign_event</code>{" "}
            iliwekwa, na scan zilizofanyika kabla ya hapo hazikuwa zikirekodiwa mahali popote
            server-side.
          </p>
          <ul className="mt-3 space-y-1.5 text-xs text-text-muted list-disc pl-5">
            <li>
              Bango halisi lina QR ya{" "}
              <code className="font-mono">/ats-checker?src=poster</code> — fungua link hiyo kwenye
              simu, kagua ATS, kisha ujiunge, na bango litaonekana hapa.
            </li>
            <li>
              Kama bango linaonekana kwenye mitaa lakini hapa ni tupu, basi hakuna mtu aliyescan (au
              hakuna aliyefika): <em>hilo ndilo jibu</em>, na ni la kweli.
            </li>
            <li>
              <code className="font-mono">?src=</code> haipo kwenye QR → mtu hahesabiwi kwa kampeni
              yoyote. Angalia URL iliyochapishwa.
            </li>
          </ul>
        </div>
      ) : (
        <div className="space-y-5">
          {report.sources.map((s) => (
            <SourceCard key={s.src} source={s} />
          ))}
        </div>
      ))}

      <div className="space-y-1 text-xs text-text-muted">
        {report.coverage.truncated && (
          <p className="text-amber-700">
            Rows zilizosomwa zimefika kikomo cha ukurasa — namba hizi ni za chini kabisa (floor),
            si jumla. Punguza dirisha (siku) au ongeza kikomo.
          </p>
        )}
        {report.totals.newAccounts > 0 && (
          <p>
            * Akaunti mpya: imeripotiwa na kivinjari (<code className="font-mono">isNew</code>),
            haiwezi kuthibitishwa na seva.
          </p>
        )}
        {report.totals.unusableRows > 0 && (
          <p className="text-amber-700">
            Rows {count(report.totals.unusableRows)} hazikuwa na src/visitorId halali —
            hazijahesabiwa.
          </p>
        )}
        {report.totals.unrecognizedEvents > 0 && (
          <p className="text-amber-700">
            Rows {count(report.totals.unrecognizedEvents)} zina jina la tukio lisilotambulika —
            hazijahesabiwa kwenye hatua.
          </p>
        )}
        <p>
          Chanzo: jedwali <code className="font-mono">campaign_event</code> · ingest{" "}
          <code className="font-mono">POST /api/campaign/event</code> · imetengenezwa{" "}
          {shortDate(report.generatedAt)}
        </p>
      </div>
    </div>
  );
}
