import { test } from "node:test";
import assert from "node:assert/strict";
import { extractTextMessages, verifyChallenge, History } from "./handler.mjs";

test("extractTextMessages pulls text bodies, drops non-text", () => {
  const body = {
    entry: [
      {
        changes: [
          {
            value: {
              messages: [
                { id: "wamid.1", from: "255700000001", type: "text", text: { body: "Habari" } },
                { id: "wamid.2", from: "255700000001", type: "image", image: {} },
                { id: "wamid.3", from: "255700000002", type: "text", text: { body: "  " } },
              ],
            },
          },
        ],
      },
    ],
  };
  const out = extractTextMessages(body);
  assert.equal(out.length, 1);
  assert.deepEqual(out[0], { id: "wamid.1", from: "255700000001", text: "Habari" });
});

test("extractTextMessages tolerates junk", () => {
  assert.deepEqual(extractTextMessages(null), []);
  assert.deepEqual(extractTextMessages({}), []);
  assert.deepEqual(extractTextMessages({ entry: "nope" }), []);
});

test("verifyChallenge echoes only on a correct token", () => {
  const good = new URLSearchParams({
    "hub.mode": "subscribe",
    "hub.verify_token": "s3cret",
    "hub.challenge": "12345",
  });
  assert.equal(verifyChallenge(good, "s3cret"), "12345");

  const bad = new URLSearchParams({
    "hub.mode": "subscribe",
    "hub.verify_token": "wrong",
    "hub.challenge": "12345",
  });
  assert.equal(verifyChallenge(bad, "s3cret"), null);
});

test("History dedups by message id and bounds turns", () => {
  const h = new History(4);
  assert.equal(h.isNew("a", "m1"), true);
  assert.equal(h.isNew("a", "m1"), false);
  assert.equal(h.isNew("a", "m2"), true);

  for (let i = 0; i < 6; i++) h.push("a", "user", `t${i}`);
  assert.equal(h.get("a").length, 4);
  assert.equal(h.get("a")[0].content, "t2");
});
