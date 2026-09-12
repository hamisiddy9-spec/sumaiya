jest.mock("@sumaiya/utils", () => ({ offlineStorage: {} }));
jest.mock("../lib/api-client", () => ({ apiClient: {} }));
jest.mock("../lib/cv-dedupe", () => ({ dedupe: jest.fn() }));
jest.mock("../contexts/auth-context", () => ({ useAuthContext: jest.fn() }));

import { cvsSafeToPersist } from "./use-cvs";
import type { CV } from "@sumaiya/types";

function makeCv(id: string): CV {
  return {
    id,
    userId: "me",
    templateId: "t1",
    title: "CV",
    data: {} as CV["data"],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("cvsSafeToPersist", () => {
  it("keeps every server CV when nothing is queued", () => {
    const server = [makeCv("a"), makeCv("b")];
    expect(cvsSafeToPersist(server, new Set())).toEqual(server);
  });

  it("drops a CV whose id has a pending, unsynced queue entry", () => {
    // This is the exact scenario that used to overwrite a just-made local
    // edit with the server's stale pre-edit copy on a screen-focus refresh.
    const server = [makeCv("a"), makeCv("b")];
    const result = cvsSafeToPersist(server, new Set(["b"]));
    expect(result.map((cv) => cv.id)).toEqual(["a"]);
  });

  it("drops all server CVs when all are queued", () => {
    const server = [makeCv("a"), makeCv("b")];
    expect(cvsSafeToPersist(server, new Set(["a", "b"]))).toEqual([]);
  });

  it("ignores queued ids that don't match any server CV", () => {
    const server = [makeCv("a")];
    expect(cvsSafeToPersist(server, new Set(["not-in-list"]))).toEqual(server);
  });
});
