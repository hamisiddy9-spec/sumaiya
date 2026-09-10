import { reportError, setReporter } from "./reporting";

describe("reporting", () => {
  afterEach(() => setReporter(null));

  it("is a no-op (never throws) when no reporter is registered", () => {
    expect(() => reportError(new Error("boom"), { scope: "test" })).not.toThrow();
  });

  it("forwards the error and context to a registered reporter", () => {
    const seen: unknown[] = [];
    setReporter((err, ctx) => seen.push([err, ctx]));
    const e = new Error("kaboom");
    reportError(e, { scope: "sync", cvId: "m_1" });
    expect(seen).toEqual([[e, { scope: "sync", cvId: "m_1" }]]);
  });

  it("swallows a throwing reporter", () => {
    setReporter(() => {
      throw new Error("reporter is broken");
    });
    expect(() => reportError(new Error("x"))).not.toThrow();
  });

  it("stops reporting after the reporter is cleared", () => {
    const calls: number[] = [];
    setReporter(() => calls.push(1));
    reportError("a");
    setReporter(null);
    reportError("b");
    expect(calls).toHaveLength(1);
  });
});
