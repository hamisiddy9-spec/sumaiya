import { toNativeCvData, toStoredCvData, isEmptyCv, cvSections } from "@sumaiya/utils/cv-shape";

/**
 * The storage shape the web app (system of record) writes: `personal` +
 * `jobTitle`, experience keyed by `position`. Structure copied from a real
 * production row; values are synthetic.
 */
const WEB_SHAPE = {
  personal: {
    fullName: "Asha Mwinyi",
    jobTitle: "ICT Officer",
    email: "asha@example.com",
    phone: "0700000000",
    location: "Morogoro",
    linkedin: "linkedin.com/in/asha",
    website: "",
    photo: "data:image/png;base64,AAA",
  },
  summary: "Mtaalamu wa ICT mwenye uzoefu wa miaka miwili.",
  experience: [
    {
      id: "e1",
      company: "TANESCO",
      position: "ICT Officer",
      location: "Morogoro",
      startDate: "2023-01",
      endDate: "",
      current: true,
      description: "- Kurekebisha kompyuta\n- Kusimamia vifaa vya EFD",
    },
  ],
  education: [
    {
      id: "d1",
      institution: "Chuo cha NIT",
      degree: "Diploma",
      field: "ICT",
      startDate: "2014",
      endDate: "2017",
      grade: "Upper second class",
      description: "Diploma in ICT",
    },
  ],
  skills: [
    { id: "s1", name: "Ukarabati wa Kompyuta", level: 3 },
    { id: "s2", name: "Mashine za EFD", level: 3 },
  ],
  projects: [],
  languages: [
    { id: "l1", name: "Swahili", proficiency: "Native" },
    { id: "l2", name: "English", proficiency: "Fluent" },
  ],
  certifications: [
    { id: "c1", name: "CCNA", issuer: "Cisco", date: "2023-04", url: "" },
  ],
  referees: [],
  hobbies: "Napenda kujifunza vitu vipya.",
};

/** What the native app writes: `personalInfo` + `headline`, `title`. */
const NATIVE_SHAPE = {
  personalInfo: {
    fullName: "Asha Mwinyi",
    email: "asha@example.com",
    phone: "0700000000",
    location: "Morogoro",
    headline: "ICT Officer",
  },
  summary: "Mtaalamu wa ICT mwenye uzoefu wa miaka miwili.",
  experience: [
    {
      id: "e1",
      company: "TANESCO",
      title: "ICT Officer",
      startDate: "2023-01",
      endDate: "",
      current: true,
      description: "- Kurekebisha kompyuta",
      keyAchievements: [],
    },
  ],
  education: [
    {
      id: "d1",
      institution: "Chuo cha NIT",
      degree: "Diploma",
      field: "ICT",
      graduationDate: "2017",
    },
  ],
  skills: [{ id: "s1", name: "Ukarabati wa Kompyuta", level: "intermediate" }],
  certifications: [
    { id: "c1", name: "CCNA", issuer: "Cisco", issueDate: "2023-04", credentialUrl: "" },
  ],
  languages: [{ id: "l1", language: "Swahili", proficiency: "native" }],
};

describe("cv-shape: a web CV must not arrive empty in the app", () => {
  const native = toNativeCvData(WEB_SHAPE);

  it("reads contacts out of `personal`", () => {
    expect(native.personalInfo.fullName).toBe("Asha Mwinyi");
    expect(native.personalInfo.email).toBe("asha@example.com");
    expect(native.personalInfo.phone).toBe("0700000000");
    expect(native.personalInfo.location).toBe("Morogoro");
  });

  it("reads the headline from `jobTitle`", () => {
    expect(native.personalInfo.headline).toBe("ICT Officer");
  });

  it("reads jobs out of `position` (the ATS 'work experience' check)", () => {
    expect(native.experience).toHaveLength(1);
    expect(native.experience[0].title).toBe("ICT Officer");
    expect(native.experience[0].company).toBe("TANESCO");
  });

  it("keeps education, skills and certifications visible", () => {
    expect(native.education[0].institution).toBe("Chuo cha NIT");
    expect(native.education[0].graduationDate).toBe("2017");
    expect(native.skills[0].name).toBe("Ukarabati wa Kompyuta");
    expect(native.certifications[0].issueDate).toBe("2023-04");
    expect(native.languages[0].language).toBe("Swahili");
  });

  it("is not mistaken for an empty CV", () => {
    expect(isEmptyCv(WEB_SHAPE)).toBe(false);
    expect(cvSections(WEB_SHAPE)).toEqual({
      contacts: true,
      summary: true,
      experience: true,
      education: true,
      skills: true,
    });
  });
});

describe("cv-shape: a CV made in the app must not arrive empty on the web", () => {
  const stored = toStoredCvData(NATIVE_SHAPE) as Record<string, any>;

  it("writes contacts as `personal` with jobTitle", () => {
    expect(stored.personal.fullName).toBe("Asha Mwinyi");
    expect(stored.personal.jobTitle).toBe("ICT Officer");
    expect(stored.personal.email).toBe("asha@example.com");
  });

  it("writes jobs as `position`", () => {
    expect(stored.experience[0].position).toBe("ICT Officer");
    expect(stored.experience[0].title).toBe("ICT Officer");
  });

  it("writes education/log cert fields the web templates render", () => {
    expect(stored.education[0].endDate).toBe("2017");
    expect(stored.certifications[0].date).toBe("2023-04");
    expect(stored.languages[0].name).toBe("Swahili");
  });
});

describe("cv-shape: lossless and idempotent", () => {
  it("keeps fields the other side doesn't know about", () => {
    const stored = toStoredCvData(WEB_SHAPE) as Record<string, any>;
    expect(stored.hobbies).toBe("Napenda kujifunza vitu vipya.");
    expect(stored.personal.photo).toBe(WEB_SHAPE.personal.photo);
    expect(stored.education[0].grade).toBe("Upper second class");
    expect(stored.experience[0].description).toBe(WEB_SHAPE.experience[0].description);
  });

  it("survives a native -> stored -> native round trip unchanged", () => {
    const back = toNativeCvData(toStoredCvData(NATIVE_SHAPE));
    expect(back.personalInfo.fullName).toBe(NATIVE_SHAPE.personalInfo.fullName);
    expect(back.personalInfo.headline).toBe(NATIVE_SHAPE.personalInfo.headline);
    expect(back.experience[0].title).toBe(NATIVE_SHAPE.experience[0].title);
    expect(back.education[0].graduationDate).toBe(NATIVE_SHAPE.education[0].graduationDate);
    expect(back.languages[0].language).toBe(NATIVE_SHAPE.languages[0].language);
  });

  it("running it twice changes nothing", () => {
    expect(toNativeCvData(toNativeCvData(WEB_SHAPE))).toEqual(toNativeCvData(WEB_SHAPE));
    expect(toStoredCvData(toStoredCvData(NATIVE_SHAPE))).toEqual(toStoredCvData(NATIVE_SHAPE));
  });
});

describe("cv-shape: empty CV detection (the 22/100 screen)", () => {
  it("flags a name-only CV as empty", () => {
    const bare = {
      personalInfo: { fullName: "Asha Mwinyi", email: "", phone: "", location: "" },
      summary: "",
      experience: [],
      education: [],
      skills: [],
      certifications: [],
      languages: [],
    };
    expect(isEmptyCv(bare)).toBe(true);
  });

  it("does not flag a CV that has only work history", () => {
    expect(isEmptyCv({ summary: "", experience: [{ company: "X", title: "Dev" }] })).toBe(false);
  });

  it("tolerates missing blocks entirely", () => {
    expect(isEmptyCv({})).toBe(true);
    expect(isEmptyCv(null)).toBe(true);
    expect(isEmptyCv(undefined)).toBe(true);
  });
});
