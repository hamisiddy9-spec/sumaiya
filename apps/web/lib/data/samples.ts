import type { SectionTemplate } from "@/types";
import type { BusinessCardData } from "@/types";

// ─── Section order presets ────────────────────────────────────────────────────

export const SECTION_TEMPLATES: SectionTemplate[] = [
  { name: "Creative",   label: "Creative",   order: ["summary", "skills", "experience", "education", "hobbies"] },
  { name: "Corporate",  label: "Corporate",  order: ["summary", "experience", "education", "certifications", "skills"] },
  { name: "Executive",  label: "Executive",  order: ["summary", "experience", "education", "certifications"] },
  { name: "Junior",     label: "Entry Level", order: ["summary", "education", "skills", "experience"] },
  { name: "Technical",  label: "Technical",  order: ["summary", "skills", "experience", "certifications", "education"] },
];

// ─── Business card preview samples ───────────────────────────────────────────

export const BUSINESS_CARD_SAMPLES: BusinessCardData[] = [
  { name: "Marcus Thorne",   title: "Chief Architect",     company: "Nebula Systems",   email: "m.thorne@nebula.io",      phone: "+1-555-0999",        website: "nebula.io",        address: "San Francisco, CA",  tagline: "Architecting tomorrow's infrastructure." },
  { name: "Elena Rodriguez", title: "Creative Director",   company: "Vivid Arts",       email: "elena@vivid.com",         phone: "+34-600-123",        website: "vivid.art",        address: "Madrid, Spain",      tagline: "Design with purpose." },
  { name: "David Osei",      title: "FinTech Analyst",     company: "PayStream",        email: "d.osei@paystream.tz",     phone: "+255 712 123 456",   website: "paystream.co.tz",  address: "Dar es Salaam, TZ",  tagline: "Simplifying digital payments." },
  { name: "Linda Kim",       title: "Legal Counsel",       company: "Kim & Associates", email: "linda@kimlaw.co",         phone: "+82-10-5555",        website: "kimlaw.co",        address: "Seoul, KR",          tagline: "Integrity in every brief." },
  { name: "Alex Pato",       title: "Product Manager",     company: "Innovate X",       email: "alex@innovatex.io",       phone: "+255 655 000 999",   website: "innovatex.io",     address: "Dodoma, TZ",         tagline: "Building products that matter." },
  { name: "Zuhura Mwanri",  title: "Head of Operations",  company: "Hisa Logistics",   email: "zuhura@hisa.tz",          phone: "+255 765 111 222",   website: "hisa.tz",          address: "Mwanza, TZ",         tagline: "Efficiency in motion." },
];
