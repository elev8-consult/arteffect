import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { getTrustedClientAddress } from "../lib/security/client-address.ts";

describe("trusted client address resolution", () => {
  test("ignores proxy headers when no proxy is trusted", () => {
    const headers = new Headers({
      "x-forwarded-for": "198.51.100.9",
      "x-real-ip": "198.51.100.10"
    });

    assert.equal(getTrustedClientAddress(headers, 0), undefined);
  });

  test("selects addresses from the trusted end of a forwarded chain", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.200, 198.51.100.20, 192.0.2.30"
    });

    assert.equal(getTrustedClientAddress(headers, 1), "192.0.2.30");
    assert.equal(getTrustedClientAddress(headers, 2), "198.51.100.20");
  });

  test("rejects malformed, missing, and oversized address values", () => {
    assert.equal(
      getTrustedClientAddress(new Headers({ "x-forwarded-for": "attacker-controlled" }), 1),
      undefined
    );
    assert.equal(
      getTrustedClientAddress(new Headers({ "x-forwarded-for": "198.51.100.5" }), 2),
      undefined
    );
    assert.equal(
      getTrustedClientAddress(new Headers({ "x-forwarded-for": "1".repeat(1_025) }), 1),
      undefined
    );
  });

  test("uses a validated real-IP header only behind a trusted proxy", () => {
    const headers = new Headers({ "x-real-ip": "2001:db8::5" });

    assert.equal(getTrustedClientAddress(headers, 1), "2001:db8::5");
    assert.equal(getTrustedClientAddress(headers, 0), undefined);
  });
});
