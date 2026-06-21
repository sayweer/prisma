import { describe, it, expect } from "vitest";
import { formatEvent, bytesToInt } from "./events";

describe("formatEvent", () => {
  it("formats a treasury 'paid' event", () => {
    const r = formatEvent(["paid", 101n], ["GVENDOR", 50000000n]);
    expect(r.kind).toBe("paid");
    expect(r.label).toMatch(/Agent paid/);
  });

  it("formats an 'attested' event, decoding the 32-byte periodId", () => {
    const period = new Uint8Array(32);
    period[31] = 2; // big-endian 2
    const r = formatEvent(["attested"], [new Uint8Array(32), period]);
    expect(r.kind).toBe("attested");
    expect(r.label).toMatch(/period 2/);
  });
});

describe("bytesToInt", () => {
  it("reads a 32-byte big-endian value", () => {
    const b = new Uint8Array(32);
    b[31] = 7;
    expect(bytesToInt(b)).toBe("7");
  });
});
