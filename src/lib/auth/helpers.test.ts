import { describe, expect, it } from "vitest";
import { classifyAuthError, cooldownFrom, enabledProviders, isValidEmail, RESEND_COOLDOWN_SECONDS, safeNext } from "./helpers";

describe("safeNext", () => {
  it("keeps same-site paths", () => {
    expect(safeNext("/buy-side/calculators/cpm?restore=pending")).toBe("/buy-side/calculators/cpm?restore=pending");
  });
  it("blocks open redirects and loops", () => {
    for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "/login", "/login?next=/x", "/auth/callback", "", null, undefined])
      expect(safeNext(bad as string)).toBe("/saved");
  });
});

describe("classifyAuthError", () => {
  it("recognises expired links", () => {
    expect(classifyAuthError("otp_expired")).toBe("link_expired");
    expect(classifyAuthError(null, "Email link is invalid or has expired")).toBe("link_expired");
  });
  it("recognises rate limits", () => {
    expect(classifyAuthError("over_email_send_rate_limit")).toBe("rate_limited");
    expect(classifyAuthError(null, "For security purposes, you can only request this after 37 seconds.")).toBe("rate_limited");
  });
  it("recognises bad codes, cancelled OAuth and the rest", () => {
    expect(classifyAuthError(null, "Token has invalid format")).toBe("invalid_code");
    expect(classifyAuthError("access_denied")).toBe("access_denied");
    expect(classifyAuthError("weird")).toBe("unknown");
  });
  it("recognises a failed email send", () => {
    expect(classifyAuthError("unexpected_failure", "Error sending confirmation email")).toBe("email_failed");
    expect(classifyAuthError("unexpected_failure", "Error sending magic link email")).toBe("email_failed");
  });
});

describe("enabledProviders", () => {
  it("reads the switched-on providers", () => {
    expect(enabledProviders({ external: { email: true, google: true, azure: false } })).toEqual({ google: true, azure: false });
  });
  it("treats missing or odd settings as off", () => {
    expect(enabledProviders(null)).toEqual({ google: false, azure: false });
    expect(enabledProviders({ external: { google: "yes" } })).toEqual({ google: false, azure: false });
  });
});

describe("cooldownFrom", () => {
  it("reads the server's wait time, defaulting to 60s", () => {
    expect(cooldownFrom("you can only request this after 37 seconds.")).toBe(37);
    expect(cooldownFrom("nope")).toBe(RESEND_COOLDOWN_SECONDS);
  });
});

describe("isValidEmail", () => {
  it("accepts normal addresses and rejects junk", () => {
    expect(isValidEmail("a.person@outlook.com")).toBe(true);
    expect(isValidEmail(" someone@example.co.uk ")).toBe(true);
    for (const bad of ["", "nope", "a@b", "a @b.com", "a@b.c"]) expect(isValidEmail(bad)).toBe(false);
  });
});
