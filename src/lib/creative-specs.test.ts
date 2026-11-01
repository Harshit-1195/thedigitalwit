import { describe, expect, it } from "vitest";
import { CREATIVE_SPECS, ratioLabel, SPEC_FORMATS } from "./creative-specs";

describe("creative-specs.json", () => {
  it("covers every format named in the spec", () => {
    expect(SPEC_FORMATS).toEqual(["Display", "Native", "Video", "Audio", "CTV", "DOOH", "Social", "Rich Media"]);
    for (const f of SPEC_FORMATS) expect(CREATIVE_SPECS.some((s) => s.format === f), f).toBe(true);
  });

  it("has unique ids, known formats and complete rows", () => {
    expect(new Set(CREATIVE_SPECS.map((s) => s.id)).size).toBe(CREATIVE_SPECS.length);
    for (const s of CREATIVE_SPECS) {
      expect(SPEC_FORMATS).toContain(s.format);
      for (const k of ["name", "fileTypes", "maxFileSize", "duration", "notes", "source"] as const) expect(s[k], `${s.id}.${k}`).toBeTruthy();
      expect(typeof s.verify).toBe("boolean");
      expect((s.w === undefined) === (s.h === undefined), `${s.id} w/h`).toBe(true);
    }
  });

  it("flags every Social spec for verification", () => {
    expect(CREATIVE_SPECS.filter((s) => s.format === "Social").every((s) => s.verify)).toBe(true);
  });
});

describe("ratioLabel", () => {
  it("reduces simple ratios", () => {
    expect(ratioLabel(300, 250)).toBe("6:5");
    expect(ratioLabel(1920, 1080)).toBe("16:9");
    expect(ratioLabel(1080, 1920)).toBe("9:16");
    expect(ratioLabel(1080, 1080)).toBe("1:1");
  });
  it("falls back to decimals for awkward ratios", () => {
    expect(ratioLabel(1200, 627)).toBe("1.91:1");
    expect(ratioLabel(300, 1050)).toBe("2:7");
    expect(ratioLabel(728, 90)).toBe("8.09:1");
  });
});
