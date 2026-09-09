import { TEMPLATES, BUSINESS_CARD_TEMPLATES, LETTER_TEMPLATES } from "@/types";

export const metadata = { title: "Templates · Admin" };

function Catalog({ title, items }: { title: string; items: { id: string; name: string; previewColor: string; popular?: boolean; description?: string }[] }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-3">
        <h2 className="font-display font-bold text-lg text-espresso">{title}</h2>
        <span className="font-mono text-xs text-text-muted">{items.length}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((t) => (
          <div key={t.id} className="bg-card border border-border rounded-card p-4 flex items-start gap-3">
            <span className="w-8 h-8 rounded-lg shrink-0 mt-0.5 border border-border" style={{ background: t.previewColor }} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-espresso text-sm truncate">{t.name}</p>
                {t.popular && <span className="text-[9px] font-bold uppercase tracking-wider bg-ember-tint text-ember-hover px-1.5 py-0.5 rounded-pill">Popular</span>}
              </div>
              {t.description && <p className="text-[11px] text-text-muted leading-snug mt-0.5 line-clamp-2">{t.description}</p>}
              <p className="font-mono text-[10px] text-text-muted/70 mt-1">{t.id}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminTemplates() {
  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[2px] text-ember-hover">Catalog</p>
        <h1 className="font-display font-extrabold text-3xl text-espresso tracking-tight mt-1">Templates</h1>
        <p className="text-sm text-text-muted mt-1">The built-in template catalog. Editing metadata, popularity and ordering is a follow-up (needs a persisted overrides table).</p>
      </div>
      <Catalog title="CV templates" items={TEMPLATES as unknown as { id: string; name: string; previewColor: string; popular?: boolean; description?: string }[]} />
      <Catalog title="Business card templates" items={BUSINESS_CARD_TEMPLATES as unknown as { id: string; name: string; previewColor: string; popular?: boolean; description?: string }[]} />
      <Catalog title="Letter templates" items={LETTER_TEMPLATES as unknown as { id: string; name: string; previewColor: string; popular?: boolean; description?: string }[]} />
    </div>
  );
}
