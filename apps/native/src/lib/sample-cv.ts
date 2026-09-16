import type { CV } from "@sumaiya/types";

/**
 * A realistic sample CV used to render template previews.
 *
 * Template galleries (Canva, Enhancv, Resume.io) all show designs filled with
 * a sample persona, not the user's own data: a full example shows every section
 * the template supports, keeps the comparison fair across designs, and never
 * leaks the user's real details into a public preview.
 */
export const SAMPLE_CV: CV = {
  id: "sample-preview",
  userId: "sample",
  templateId: "nakuru",
  title: "Amina Hassan",
  createdAt: new Date(0),
  updatedAt: new Date(0),
  data: {
    personalInfo: {
      fullName: "Amina Hassan",
      email: "amina@example.com",
      phone: "+255 712 345 678",
      location: "Dar es Salaam, Tanzania",
      headline: "Storekeeper & Operations Lead",
    },
    summary:
      "Detail-oriented storekeeper with 6+ years managing inventory, stock reconciliation and supplier coordination across retail and wholesale operations.",
    experience: [
      {
        id: "s1",
        title: "Senior Storekeeper",
        company: "Kilimanjaro Retail Ltd",
        startDate: "2021-03",
        endDate: "Present",
        description:
          "Managed a 2,000-SKU warehouse and cut stock variance from 4.1% to 1.2% through weekly cycle counts.",
        keyAchievements: ["Reduced stock variance by 70%", "Trained a team of 4 assistants"],
      },
      {
        id: "s2",
        title: "Storekeeper",
        company: "Zanzibar Trading Co",
        startDate: "2018-06",
        endDate: "2021-02",
        description:
          "Received, recorded and issued stock; kept accurate bin cards and daily stock reports.",
        keyAchievements: ["Introduced daily reconciliation reports"],
      },
    ],
    education: [
      {
        id: "e1",
        institution: "Dar es Salaam Institute of Technology",
        degree: "Diploma",
        field: "Procurement & Logistics",
        graduationDate: "2017",
      },
    ],
    skills: [
      { id: "k1", name: "Inventory Management", level: "expert" },
      { id: "k2", name: "Excel", level: "advanced" },
      { id: "k3", name: "Stock Reconciliation", level: "advanced" },
      { id: "k4", name: "Supplier Coordination", level: "intermediate" },
    ],
    certifications: [],
    languages: [
      { id: "l1", language: "Swahili", proficiency: "native" },
      { id: "l2", language: "English", proficiency: "fluent" },
    ],
  },
};
