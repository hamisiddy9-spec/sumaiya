jest.mock("@sumaiya/utils", () => ({ offlineStorage: {} }));
jest.mock("../lib/api-client", () => ({ apiClient: {} }));
jest.mock("../lib/cv-dedupe", () => ({ dedupe: jest.fn() }));
jest.mock("../contexts/auth-context", () => ({ useAuthContext: jest.fn() }));

import { cvsSafeToPersist, queueItemIdsToDropOnDelete } from "./use-cvs";
import type { CV, SyncQueueItem } from "@sumaiya/types";

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

function makeQueueItem(id: string, cvId: string): SyncQueueItem {
  return { id, cvId, operation: "update", data: null, timestamp: Date.now(), retries: 0 };
}

describe("queueItemIdsToDropOnDelete", () => {
  it("drops every queue item for the deleted CV", () => {
    // The bug this guards: an offline edit queues an update_cv for a CV, the
    // user then deletes it while online (bypassing the queue entirely on
    // success) — left alone, the stale queued update fires later and
    // resurrects the CV via the idempotent-by-clientId upsert.
    const queue = [makeQueueItem("q1", "cv-a"), makeQueueItem("q2", "cv-b"), makeQueueItem("q3", "cv-a")];
    expect(queueItemIdsToDropOnDelete(queue, "cv-a")).toEqual(["q1", "q3"]);
  });

  it("returns nothing when no queue item matches", () => {
    const queue = [makeQueueItem("q1", "cv-b")];
    expect(queueItemIdsToDropOnDelete(queue, "cv-a")).toEqual([]);
  });
});
