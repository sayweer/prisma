import { describe, it, expect } from "vitest";
import { connectErr, sendErr } from "./wallet-errors";

describe("connectErr", () => {
  it("maps a not-installed wallet", () => {
    expect(connectErr(new Error("Freighter is not installed"))).toMatch(/isn't installed/);
  });
  it("maps a user rejection / closed modal", () => {
    expect(connectErr(new Error("User rejected the request"))).toBe("Connection cancelled.");
  });
});

describe("sendErr", () => {
  it("maps insufficient balance (op_underfunded)", () => {
    const e = { response: { data: { extras: { result_codes: { operations: ["op_underfunded"] } } } } };
    expect(sendErr(e)).toMatch(/Insufficient balance/);
  });
  it("maps a signature rejection", () => {
    expect(sendErr(new Error("User declined to sign"))).toMatch(/Signature rejected/);
  });
});
