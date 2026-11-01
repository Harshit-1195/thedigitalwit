import data from "@/data/creative-specs.json";

export type CreativeSpec = {
  id: string;
  format: string;
  name: string;
  w?: number;
  h?: number;
  fileTypes: string;
  maxFileSize: string;
  duration: string;
  notes: string;
  source: string;
  /** Platform- or vendor-specific: check current specs before trafficking. */
  verify: boolean;
};

export const SPEC_FORMATS: string[] = data.formats;
export const CREATIVE_SPECS = data.specs as CreativeSpec[];
export const SPECS_LAST_REVIEWED: string = data.lastReviewed;

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** "6:5", "16:9", or "1.91:1" when the exact ratio is unwieldy. */
export function ratioLabel(w: number, h: number): string {
  const g = gcd(w, h);
  const [rw, rh] = [w / g, h / g];
  if (rw <= 21 && rh <= 21) return `${rw}:${rh}`;
  return w >= h ? `${(w / h).toFixed(2).replace(/\.?0+$/, "")}:1` : `1:${(h / w).toFixed(2).replace(/\.?0+$/, "")}`;
}
