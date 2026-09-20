/**
 * Ajira Portal — the Tanzanian government's official recruitment portal
 * (Public Service Recruitment Secretariat / Sekretarieti ya Ajira katika
 * Utumishi wa Umma).
 *
 *   Listing : https://www.ajira.go.tz/recruitment_management
 *   Adverts : /baseattachments/advertisementattachments/<file>.pdf
 *
 * WHY THIS SOURCE EXISTS: this is the single most authoritative source of
 * Tanzanian vacancies that exists — every public-service post in the country
 * is advertised here first. Nothing else in the registry carries government
 * work, and for the Sumaiya user it is the one board where a Tanzanian
 * qualification is the qualifying credential rather than a liability.
 *
 * TERMS / PERMISSIONS: the portal publishes `User-agent: *` in robots.txt with
 * NO Disallow directives, so the listing path is explicitly crawlable. Only
 * the listing page's own advert links are read — no authenticated area, no
 * application submission, no rate abuse (one request per run).
 *
 * WHAT THE ROWS ACTUALLY ARE — stated plainly, because it changes how they
 * should be presented: Ajira publishes VACANCY ADVERTISEMENTS, not individual
 * postings. One announcement can cover dozens of positions across several
 * grades ("TANGAZO LA NAFASI ZA KAZI TAASISI MBALIMBALI ZA UMMA"). A row here
 * is therefore an announcement with its own PDF, not a single seat — and the
 * title is the source's own Swahili wording, kept verbatim rather than
 * machine-translated into something we did not receive.
 *
 * The page also carries interview invitations ("KUITWA KWENYE USAILI") and
 * deployment notices ("KUITWA KAZINI"). Those are not vacancies, so only
 * announcements naming a NAFASI (position) are imported; the rest are counted
 * and dropped rather than published as jobs.
 */
import type { JobSourceAdapter, RawJob } from "./types";
import { decodeEntities, fetchText } from "./shared";

const LISTING_URL = "https://www.ajira.go.tz/recruitment_management";
const ORIGIN = "https://www.ajira.go.tz";

/**
 * The advert anchors. The listing page marks them with the theme's own
 * `adv_color` class and serves the advert as a PDF under
 * /baseattachments/advertisementattachments/. Keying on BOTH the path and the
 * class is what keeps the parse off the page's navigation and news links.
 */
const ADVERT_RE =
  /<a\s[^>]*href="(\/baseattachments\/advertisementattachments\/[^"]+)"[^>]*class="[^"]*adv_color[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;

/** Trailing advert date, e.g. "… (NEEC) 19-09-2026". */
const TRAILING_DATE_RE = /\s+(\d{2})-(\d{2})-(\d{4})\s*$/;

/**
 * A NAFASI ("position") announcement is a vacancy. Without the word, the row is
 * an interview invitation or a deployment notice — real content, but not a job,
 * so it never enters the feed.
 */
const VACANCY_RE = /\bNAFASI\b/i;

/** "KUJITOLEA" = volunteering; the source's own word for the engagement. */
const VOLUNTEER_RE = /\bKUJITOLEA\b/i;

export interface AjiraAdvert {
  title: string;
  employer: string;
  postedAt: Date | null;
  applyUrl: string;
}

/**
 * The announcement's own prefix, stripped so the employer can be read out of
 * the remainder. Longest first, so the shorter forms cannot match early.
 */
const PREFIXES = [
  "TANGAZO LA NAFASI ZA KUJITOLEA",
  "TANGAZO LA NAFASI ZA KAZI",
  "TANGAZO LA NAFASI YA KAZI",
];

/** Absolute, minimally-escaped advert URL (the path really does contain spaces). */
export function advertUrl(href: string): string {
  if (/^https?:\/\//i.test(href)) return href;
  return `${ORIGIN}${encodeURI(href)}`;
}

/**
 * Parse the listing page into adverts. Pure and exported so the shape can be
 * tested against the portal's real markup without a network call.
 */
export function parseAjiraListing(html: string): { adverts: AjiraAdvert[]; skipped: number } {
  const adverts: AjiraAdvert[] = [];
  const seen = new Set<string>();
  let skipped = 0;

  ADVERT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ADVERT_RE.exec(html)) !== null) {
    // The href can carry entities (some filenames use &apos;); decode before
    // building the URL so a real advert never points at a literal "&apos;".
    const href = decodeEntities(m[1]);
    // The anchor wraps an <img> badge before the text — strip tags, then decode.
    const raw = decodeEntities(m[2].replace(/<[^>]*>/g, " "))
      .replace(/\s+/g, " ")
      .trim();
    if (!raw) continue;

    if (!VACANCY_RE.test(raw)) {
      skipped += 1; // interview / deployment notice — not a vacancy
      continue;
    }

    const url = advertUrl(href);
    if (seen.has(url)) continue;
    seen.add(url);

    // Split the trailing date off, then the announcement prefix off what is
    // left. Whatever remains is the employer, exactly as the source named it.
    let title = raw;
    let postedAt: Date | null = null;
    const date = TRAILING_DATE_RE.exec(title);
    if (date) {
      const [, dd, mm, yyyy] = date;
      const parsed = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
      if (!Number.isNaN(parsed.getTime())) postedAt = parsed;
      title = title.slice(0, date.index).trim();
    }

    let employer = title;
    for (const p of PREFIXES) {
      if (employer.toUpperCase().startsWith(p)) {
        employer = employer.slice(p.length).trim().replace(/^[:\-–]\s*/, "");
        break;
      }
    }

    adverts.push({ title, employer, postedAt, applyUrl: url });
  }

  return { adverts, skipped };
}

export const ajiraAdapter: JobSourceAdapter = {
  id: "ajira",
  name: "Ajira Portal (Tanzania Government)",
  enabled: () => true, // keyless
  async fetch(): Promise<RawJob[]> {
    const html = await fetchText(LISTING_URL);
    const { adverts, skipped } = parseAjiraListing(html);
    if (skipped > 0) {
      console.log(
        `[jobs] source ajira dropped ${skipped} non-vacancy notices (interview/deployment announcements)`,
      );
    }

    return adverts.map((a) => ({
      title: a.title,
      // The source names an employer; where it does not, the field stays empty
      // rather than repeating the title back as a company.
      company: a.employer === a.title ? "" : a.employer,
      // The portal is Tanzania's Public Service Recruitment Secretariat — this
      // is the board's own country, not an inference about the posting.
      location: "Tanzania",
      category: "Government",
      employmentType: VOLUNTEER_RE.test(a.title) ? "volunteer" : "full-time",
      // The advert's content lives in the linked PDF; we do not fetch or
      // transcribe it, so the description carries only what the listing page
      // published about this row.
      description: `${a.title}. Published by the Public Service Recruitment Secretariat (Sekretarieti ya Ajira katika Utumishi wa Umma), United Republic of Tanzania. Full vacancy details are in the linked official advertisement.`,
      applyUrl: a.applyUrl,
      sourceUrl: a.applyUrl,
      externalId: a.applyUrl,
      remote: false,
      postedAt: a.postedAt,
    }));
  },
};
