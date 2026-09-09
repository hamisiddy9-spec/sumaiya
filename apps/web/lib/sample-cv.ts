import { createEmptyCVData, type CVData } from "@/types";
import type { Lang } from "@/lib/i18n/translations";

/**
 * A complete, realistic sample CV used for the "Start from an example" flow, so
 * a first-time user sees a finished CV in a beautiful template instead of a
 * blank form. East-Africa flavoured (Zuri Fintech, M-Pesa, University of Nairobi)
 * to match the audience. No photo is included on purpose — the example is about
 * the content, and users add their own portrait.
 *
 * Localised: Swahili users get a Swahili example, so it reads as *their* CV.
 */
function sampleEn(): CVData {
  return {
    ...createEmptyCVData(),
    personal: {
      fullName: "Amara Osei",
      jobTitle: "Software Engineer",
      email: "amara.osei@gmail.com",
      phone: "+254 722 987 654",
      location: "Nairobi, Kenya",
      linkedin: "linkedin.com/in/amaraosei",
      website: "amaraosei.dev",
      photo: "",
    },
    summary:
      "Software engineer with 6+ years building and shipping scalable web applications for fintech and telecoms. Strong in React, Node.js and cloud infrastructure. Led a team of 6 engineers on products used by more than a million people worldwide.",
    experience: [
      {
        id: "_x1",
        company: "Zuri Fintech",
        position: "Software Engineer",
        location: "Nairobi, Kenya",
        startDate: "2020-05",
        endDate: "",
        current: true,
        description:
          "Shipped key features for a nationwide mobile-money platform serving millions of users.\nCut API response times by 55% through caching and query optimisation.\nMentored 4 junior engineers and championed test-driven development.",
      },
      {
        id: "_x2",
        company: "Kito Labs",
        position: "Full-Stack Developer",
        location: "Remote",
        startDate: "2017-08",
        endDate: "2020-04",
        current: false,
        description:
          "Built React frontends and Node.js APIs for enterprise SaaS clients in the US and Europe.\nRaised test coverage from 38% to 90%.\nWorked with distributed teams across three time zones to hit tight release dates.",
      },
    ],
    education: [
      {
        id: "_ed1",
        institution: "University of Nairobi",
        degree: "B.Sc.",
        field: "Computer Science",
        startDate: "2013-09",
        endDate: "2017-06",
        grade: "First Class Honours",
        description: "",
      },
    ],
    skills: [
      { id: "_s1", name: "React / Next.js", level: 5 },
      { id: "_s2", name: "Node.js", level: 5 },
      { id: "_s3", name: "TypeScript", level: 4 },
      { id: "_s4", name: "PostgreSQL", level: 4 },
      { id: "_s5", name: "AWS / GCP", level: 4 },
    ],
    languages: [
      { id: "_l1", name: "English", proficiency: "Native" },
      { id: "_l2", name: "Swahili", proficiency: "Native" },
    ],
    certifications: [
      { id: "_c1", name: "AWS Solutions Architect", issuer: "Amazon Web Services", date: "2023-04", url: "" },
    ],
    hobbies: "Open source, mentoring, chess, trail running",
  };
}

function sampleSw(): CVData {
  const base = sampleEn();
  return {
    ...base,
    personal: { ...base.personal, jobTitle: "Mhandisi wa Programu" },
    summary:
      "Mhandisi wa programu mwenye uzoefu wa zaidi ya miaka 6 katika kujenga na kuzindua mifumo ya wavuti inayoweza kupanuka kwa sekta za fedha na mawasiliano. Nina ujuzi wa React, Node.js na miundombinu ya wingu. Niliongoza timu ya wahandisi 6 kwenye bidhaa zinazotumiwa na zaidi ya watu milioni moja duniani kote.",
    experience: [
      {
        ...base.experience[0],
        position: "Mhandisi wa Programu",
        description:
          "Nilizindua vipengele muhimu vya jukwaa la kitaifa la pesa za simu linalohudumia mamilioni ya watumiaji.\nNilipunguza muda wa majibu ya API kwa 55% kupitia caching na uboreshaji wa query.\nNiliwalea wahandisi 4 wachanga na kuhimiza utamaduni wa kupima programu (TDD).",
      },
      {
        ...base.experience[1],
        position: "Msanidi Programu Kamili",
        description:
          "Nilijenga sehemu za mbele za React na API za Node.js kwa wateja wa SaaS Marekani na Ulaya.\nNiliongeza ufunikaji wa majaribio kutoka 38% hadi 90%.\nNilifanya kazi na timu za maeneo tofauti katika saa tatu za dunia kufikia tarehe za kuzindua.",
      },
    ],
    education: [
      { ...base.education[0], degree: "Shahada ya Kwanza (B.Sc.)", field: "Sayansi ya Kompyuta", grade: "Daraja la Kwanza" },
    ],
    hobbies: "Programu huria, ulezi, chess, mbio za mlimani",
  };
}

export function getSampleCV(lang: Lang = "en"): CVData {
  return lang === "sw" ? sampleSw() : sampleEn();
}
