// Item 2 probe entry — run the app's OWN parseCVData over a 9-skill fixture
// whose `level` varies, and print how many skills survive + the whole-CV effect.
import { parseCVData } from "@/types/index";

const skills = (level: unknown) =>
  ["TypeScript", "React", "Node.js", "PostgreSQL", "Docker", "AWS", "GraphQL", "Kubernetes", "Terraform"]
    .map((name, i) => (level === "__missing__" ? { id: `s${i}`, name } : { id: `s${i}`, name, level }));

const cv = (level: unknown) => ({
  personal: { fullName: "Amina Joseph Mwakasege", jobTitle: "Software Engineer", email: "a@b.co", phone: "0712", location: "Dar es Salaam" },
  summary: "Software engineer with 6 years building payment platforms.",
  experience: [{ id: "e1", company: "Acme", position: "Engineer", startDate: "2020", endDate: "2024", current: false, description: "Built things." }],
  education: [{ id: "d1", institution: "UDSM", degree: "BSc", field: "CS", startDate: "2014", endDate: "2018" }],
  skills: skills(level),
  languages: [{ id: "l1", name: "Swahili", proficiency: "Native" }],
  certifications: [{ id: "c1", name: "AWS SAA", issuer: "Amazon", date: "2023" }],
  referees: [{ id: "r1", name: "Baraka Mushi", title: "CTO", company: "PayCo", email: "b@c.co", phone: "0713" }],
  hobbies: "Long-distance running.",
});

const cases: Array<[string, unknown]> = [
  ["level:3 (all valid)", 3],
  ["level missing", "__missing__"],
  ["level:'3' (string)", "3"],
  ["level:0", 0],
  ["level:7", 7],
];

const out: Record<string, unknown> = {};
for (const [label, level] of cases) {
  const parsed = parseCVData(cv(level));
  out[label] = {
    skillsIn: 9,
    skillsOut: parsed.skills.length,
    skillNamesOut: parsed.skills.map((s) => s.name),
    levelsOut: parsed.skills.map((s) => s.level),
    experienceOut: parsed.experience.length,
    educationOut: parsed.education.length,
    certificationsOut: parsed.certifications.length,
    languagesOut: parsed.languages.length,
    refereesOut: parsed.referees.length,
    fullName: parsed.personal.fullName,
  };
}
console.log(JSON.stringify(out, null, 1));
