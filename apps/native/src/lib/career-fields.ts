/**
 * The preset taxonomy the first-run wizard offers instead of a blank text box.
 *
 * Tuned for the East-African job market (Kenya / Tanzania). Every field maps to
 * a real cluster of jobs people apply for, and each carries a short list of
 * skills people in that field actually list — so the wizard can pre-seed the
 * skills step from what they picked.
 *
 * Bilingual. Kept colloquial, not dictionary Swahili.
 */

export interface CareerField {
  id: string;
  label: { en: string; sw: string };
  /** Skills we offer as tappable chips once this field is chosen. */
  skills: string[];
}

export const CAREER_FIELDS: CareerField[] = [
  {
    id: "sales-retail",
    label: { en: "Sales & Retail", sw: "Mauzo na Duka" },
    skills: ["Customer service", "POS / cashiering", "Stock control", "Merchandising", "Upselling", "Sales targets"],
  },
  {
    id: "customer-service",
    label: { en: "Customer Service & Support", sw: "Huduma kwa Wateja" },
    skills: ["Phone support", "Complaint handling", "CRM", "Live chat", "Client relations", "English & Kiswahili"],
  },
  {
    id: "admin-office",
    label: { en: "Admin & Office", sw: "Utawala na Ofisi" },
    skills: ["MS Office", "Filing & records", "Scheduling", "Reception", "Data entry", "Minute-taking"],
  },
  {
    id: "finance-accounting",
    label: { en: "Finance & Accounting", sw: "Fedha na Uhasibu" },
    skills: ["Bookkeeping", "QuickBooks", "Excel", "Bank reconciliation", "Tax / KRA", "Payroll", "Audit"],
  },
  {
    id: "healthcare",
    label: { en: "Health & Care", sw: "Afya na Uuguzi" },
    skills: ["Patient care", "Records", "Pharmacy", "First aid", "Lab work", "Community health", "Infection control"],
  },
  {
    id: "education",
    label: { en: "Education & Training", sw: "Elimu na Mafunzo" },
    skills: ["Lesson planning", "Classroom management", "Curriculum", "Assessment", "Tutoring", "Report writing"],
  },
  {
    id: "it-software",
    label: { en: "IT & Software", sw: "TEHAMA na Programu" },
    skills: ["Support / helpdesk", "Networking", "JavaScript", "Python", "SQL", "Web dev", "Troubleshooting"],
  },
  {
    id: "engineering",
    label: { en: "Engineering", sw: "Uhandisi" },
    skills: ["AutoCAD", "Maintenance", "Quality control", "Project support", "Site work", "Safety / HSE"],
  },
  {
    id: "construction-trades",
    label: { en: "Construction & Trades", sw: "Ujenzi na Ufundi" },
    skills: ["Masonry", "Plumbing", "Electrical wiring", "Welding", "Carpentry", "Site supervision", "Reading drawings"],
  },
  {
    id: "logistics-transport",
    label: { en: "Logistics & Transport", sw: "Usafirishaji na Uchukuzi" },
    skills: ["Driving", "Route planning", "Fleet records", "Warehouse", "Dispatch", "Inventory", "Clearing & forwarding"],
  },
  {
    id: "hospitality-food",
    label: { en: "Hospitality & Food", sw: "Ukarimu na Chakula" },
    skills: ["Front desk", "Housekeeping", "Cooking", "Waiting / service", "Barista", "Food safety", "Events"],
  },
  {
    id: "agriculture",
    label: { en: "Agriculture & Agribusiness", sw: "Kilimo na Biashara ya Kilimo" },
    skills: ["Crop management", "Livestock", "Irrigation", "Farm records", "Agro-dealer", "Extension", "Value addition"],
  },
  {
    id: "security",
    label: { en: "Security", sw: "Usalama" },
    skills: ["Guarding", "Access control", "CCTV monitoring", "Patrols", "Incident reports", "Crowd control"],
  },
  {
    id: "marketing-comms",
    label: { en: "Marketing & Communications", sw: "Masoko na Mawasiliano" },
    skills: ["Social media", "Content writing", "Graphic design", "Campaigns", "Brand", "Community management", "SEO"],
  },
  {
    id: "manufacturing",
    label: { en: "Manufacturing & Production", sw: "Uzalishaji Viwandani" },
    skills: ["Machine operation", "Quality control", "Packing", "Line supervision", "Safety", "Maintenance"],
  },
  {
    id: "hr-people",
    label: { en: "HR & People", sw: "Rasilimali Watu" },
    skills: ["Recruitment", "Onboarding", "Payroll", "Employee relations", "Records", "Training coordination"],
  },
  {
    id: "beauty-wellness",
    label: { en: "Beauty & Wellness", sw: "Urembo na Afya" },
    skills: ["Hairdressing", "Nails", "Skincare", "Massage", "Salon management", "Product knowledge", "Client care"],
  },
  {
    id: "driving",
    label: { en: "Driving", sw: "Udereva" },
    skills: ["Valid licence (BCE)", "Defensive driving", "Vehicle checks", "Route knowledge", "Logbook", "Customer courtesy"],
  },
  {
    id: "general-labour",
    label: { en: "General Work & Manual", sw: "Kazi za Mikono" },
    skills: ["Loading & offloading", "Cleaning", "Groundwork", "Packing", "Machine assist", "Teamwork", "Reliability"],
  },
  {
    id: "business-owner",
    label: { en: "I run my own business", sw: "Nina biashara yangu" },
    skills: ["Stock & suppliers", "Cash management", "Customer base", "Staff supervision", "Pricing", "M-Pesa / records"],
  },
];

export interface ExperienceLevel {
  id: string;
  label: { en: string; sw: string };
}

export const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  { id: "new", label: { en: "Just starting out", sw: "Ndio naanza" } },
  { id: "1-3", label: { en: "1–3 years", sw: "Miaka 1–3" } },
  { id: "3-7", label: { en: "3–7 years", sw: "Miaka 3–7" } },
  { id: "7+", label: { en: "7+ years", sw: "Zaidi ya miaka 7" } },
  { id: "self", label: { en: "Running my own thing", sw: "Ninajiendesha mwenyewe" } },
];

/** Skills to offer for the fields the user picked (deduped, capped). */
export function skillsForFields(fieldIds: string[], limit = 12): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of fieldIds) {
    const f = CAREER_FIELDS.find((x) => x.id === id);
    if (!f) continue;
    for (const s of f.skills) {
      const k = s.toLowerCase();
      if (!seen.has(k)) {
        seen.add(k);
        out.push(s);
        if (out.length >= limit) return out;
      }
    }
  }
  return out;
}

export function fieldLabels(fieldIds: string[], lang: "en" | "sw"): string {
  return fieldIds
    .map((id) => CAREER_FIELDS.find((x) => x.id === id)?.label[lang])
    .filter(Boolean)
    .join(" · ");
}

export function experienceLabel(id: string, lang: "en" | "sw"): string {
  return EXPERIENCE_LEVELS.find((x) => x.id === id)?.label[lang] ?? "";
}
