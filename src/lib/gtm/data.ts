// GTM Generator reference data. Static, no network. Market sizing is described as an
// approach only; no market-size figures appear anywhere in this file.

export type ChannelId = "search" | "social" | "programmatic" | "ctv" | "retail" | "content" | "events" | "crm";

export const CHANNELS: Record<ChannelId, { label: string; stack: string[] }> = {
  search: { label: "Paid search", stack: ["Google Ads", "Microsoft Advertising", "Search Ads 360"] },
  social: { label: "Paid social", stack: ["Meta Ads Manager", "LinkedIn Campaign Manager", "TikTok Ads"] },
  programmatic: { label: "Programmatic display", stack: ["The Trade Desk", "Google DV360", "IAS or DoubleVerify"] },
  ctv: { label: "CTV and online video", stack: ["YouTube (Google Ads)", "The Trade Desk CTV", "Amazon DSP"] },
  retail: { label: "Retail media", stack: ["Amazon Ads", "Walmart Connect", "Criteo"] },
  content: { label: "Content and SEO", stack: ["Webflow or WordPress", "Semrush or Ahrefs", "Google Search Console"] },
  events: { label: "Events and partnerships", stack: ["Partner portal (PRM)", "Event platform", "Co-marketing MDF tracking"] },
  crm: { label: "CRM and lifecycle", stack: ["HubSpot or Salesforce", "Braze or Klaviyo", "Customer data platform"] },
};

export const CHANNEL_IDS = Object.keys(CHANNELS) as ChannelId[];
/** Categorical colours for the channel bars and budget donut: eight distinct, colour-blind-checked hues. */
export const COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"];

type Weights = Record<ChannelId, number>;
const w = (search: number, social: number, programmatic: number, ctv: number, retail: number, content: number, events: number, crm: number): Weights => ({ search, social, programmatic, ctv, retail, content, events, crm });

export type Motion = "Product-led" | "Sales-led" | "Hybrid" | "Retail and channel-led";

export interface Kpi {
  label: string;
  target: string;
}

export interface Industry {
  id: string;
  label: string;
  buyer: string;
  motion: Motion;
  /** Relative channel weights before goal, geography and budget adjustments. */
  mix: Weights;
  /** 1 = crowded, 5 = open. */
  openness: number;
  /** 0 none, 1 moderate, 2 heavily regulated claims. */
  regulation: 0 | 1 | 2;
  committee: string[];
  whitespace: string;
  angle: string;
  pricing: string;
  pillars: [string, string, string];
  kpis: Kpi[];
}

export const INDUSTRIES: Industry[] = [
  {
    id: "saas", label: "B2B SaaS", buyer: "operations and functional leaders at mid-market and enterprise companies", motion: "Hybrid",
    mix: w(24, 20, 6, 4, 0, 22, 12, 12), openness: 2, regulation: 0,
    committee: ["Economic buyer (VP or C-level)", "Champion (team lead who feels the pain)", "Technical evaluator (IT or security)", "Procurement and legal"],
    whitespace: "Most competitors sell features; few prove time-to-value in the first 30 days.",
    angle: "Lead with a measurable outcome and a fast onboarding promise, then let a free trial or sandbox do the convincing.",
    pricing: "Tiered seats or usage, with an annual discount; keep a self-serve entry tier so the trial converts without sales.",
    pillars: ["Proof of value in weeks, not quarters", "Fits the stack you already run", "Security and admin controls from day one"],
    kpis: [{ label: "CAC payback", target: "under 18 months" }, { label: "Trial-to-paid conversion", target: "15–25%" }, { label: "Pipeline from marketing", target: "40–60% of new pipeline" }, { label: "Net revenue retention", target: "100–120%" }],
  },
  {
    id: "cpg", label: "Consumer packaged goods", buyer: "household shoppers choosing between familiar brands at shelf and online", motion: "Retail and channel-led",
    mix: w(8, 20, 12, 20, 24, 6, 4, 6), openness: 2, regulation: 1,
    committee: ["Shopper (decides at shelf or in the basket)", "Retail category buyer", "Trade marketing and key-account team", "Brand and finance (sign-off on trade spend)"],
    whitespace: "Category leaders own the shelf; challengers win with a sharp occasion or need-state the leaders ignore.",
    angle: "Own one occasion clearly, build reach on video, and convert where the shopper already buys through retail media.",
    pricing: "Price to the shelf set: a trial pack or price-off at launch, then hold list price and fund promotions from trade budget.",
    pillars: ["Made for a moment the big brands miss", "Visible proof on pack and on screen", "Easy to find wherever you shop"],
    kpis: [{ label: "Brand awareness lift", target: "+3 to +8 points" }, { label: "Retail media ROAS", target: "3–5×" }, { label: "Trial rate in launch markets", target: "5–12% of category buyers" }, { label: "Repeat purchase", target: "25–40% within 90 days" }],
  },
  {
    id: "retail", label: "Retail and e-commerce", buyer: "online shoppers comparing price, delivery and returns", motion: "Product-led",
    mix: w(24, 24, 10, 6, 10, 8, 2, 16), openness: 2, regulation: 0,
    committee: ["Shopper", "Merchandising lead", "Performance marketing lead", "Finance (contribution margin owner)"],
    whitespace: "Generalists compete on price; specialists win on curation, speed and service.",
    angle: "Make the shopping promise specific (range, speed or service) and prove it in every ad and product page.",
    pricing: "Protect margin with bundles and free-shipping thresholds rather than blanket discounts.",
    pillars: ["The right range, curated", "Fast, reliable delivery", "Returns without the hassle"],
    kpis: [{ label: "Blended ROAS", target: "3–6×" }, { label: "Conversion rate", target: "2–4%" }, { label: "Customer acquisition cost", target: "below first-order margin" }, { label: "90-day repeat rate", target: "20–35%" }],
  },
  {
    id: "finance", label: "Financial services", buyer: "consumers and small businesses choosing a bank, card, insurer or investment app", motion: "Hybrid",
    mix: w(26, 18, 8, 10, 0, 18, 4, 16), openness: 2, regulation: 2,
    committee: ["Customer", "Product owner", "Compliance and legal (approves every claim)", "Risk and fraud"],
    whitespace: "Incumbents compete on trust; challengers compete on rate. Few combine both with a clear, simple product.",
    angle: "Earn trust first (regulation, security, reviews), then make one product benefit unmistakable.",
    pricing: "Show the full cost clearly (fees, rates, representative examples); hidden-fee perception kills conversion.",
    pillars: ["Clear about what it costs", "Secure and properly regulated", "Built around how you actually use money"],
    kpis: [{ label: "Cost per funded account", target: "set against 12-month customer value" }, { label: "Application completion", target: "35–60%" }, { label: "Approval rate", target: "track by channel; aim for stability" }, { label: "12-month retention", target: "70–85%" }],
  },
  {
    id: "health", label: "Healthcare and pharma", buyer: "patients, caregivers and healthcare professionals", motion: "Sales-led",
    mix: w(26, 12, 12, 12, 0, 20, 10, 8), openness: 3, regulation: 2,
    committee: ["Patient or caregiver", "Healthcare professional (prescriber or referrer)", "Medical, legal and regulatory review", "Payer or procurement"],
    whitespace: "Most brands talk to prescribers; few give patients and caregivers clear, trustworthy guidance.",
    angle: "Lead with credible education, keep claims within the approved label, and support the professional conversation.",
    pricing: "Address access and affordability early (insurance coverage, co-pay support, public funding) where rules allow.",
    pillars: ["Clear, approved information", "Support at every step of care", "Backed by evidence"],
    kpis: [{ label: "Qualified HCP reach", target: "60–80% of target list" }, { label: "Patient education engagement", target: "track completion, not clicks" }, { label: "Cost per qualified enquiry", target: "benchmark per market" }, { label: "Medical review cycle time", target: "under 10 working days" }],
  },
  {
    id: "auto", label: "Automotive", buyer: "in-market car buyers comparing models, dealers and finance", motion: "Retail and channel-led",
    mix: w(22, 16, 12, 22, 0, 10, 10, 8), openness: 2, regulation: 1,
    committee: ["Buyer and household", "Dealer or retailer", "Regional sales operations", "Finance partner"],
    whitespace: "Spec-sheet battles dominate; ownership cost and electrification confidence are under-served.",
    angle: "Win consideration with video, then hand off cleanly to dealers with tracked test-drive and finance leads.",
    pricing: "Lead with monthly cost and total cost of ownership; coordinate offers with dealers so prices match.",
    pillars: ["Confidence to switch", "Real cost of ownership, upfront", "A test drive in two clicks"],
    kpis: [{ label: "Test-drive bookings", target: "track cost per booking by region" }, { label: "Lead-to-sale rate", target: "8–15%" }, { label: "Consideration lift", target: "+2 to +5 points" }, { label: "Dealer lead response time", target: "under 1 hour" }],
  },
  {
    id: "travel", label: "Travel and hospitality", buyer: "leisure and business travellers planning and booking trips", motion: "Product-led",
    mix: w(28, 20, 10, 10, 0, 10, 4, 18), openness: 2, regulation: 0,
    committee: ["Traveller", "Trip planner or travel manager", "Revenue management", "Distribution and OTA partners"],
    whitespace: "Online travel agencies own price comparison; direct brands can own experience and loyalty.",
    angle: "Inspire early with video and social, capture intent on search, and reward direct booking.",
    pricing: "Make the best rate direct; use loyalty benefits instead of deeper discounts.",
    pillars: ["Experiences worth the trip", "Best value when you book direct", "Rewarded every time you return"],
    kpis: [{ label: "Direct booking share", target: "+5 to +10 points year on year" }, { label: "ROAS on search", target: "6–10×" }, { label: "Look-to-book rate", target: "1–3%" }, { label: "Loyalty sign-up at booking", target: "20–40%" }],
  },
  {
    id: "telecom", label: "Telecom and connectivity", buyer: "households and businesses choosing mobile, broadband or connectivity plans", motion: "Hybrid",
    mix: w(22, 18, 14, 16, 0, 8, 6, 16), openness: 1, regulation: 1,
    committee: ["Account holder", "Household decision makers", "Retail store and partner channel", "Network and coverage team"],
    whitespace: "Plans look identical; service, coverage proof and bundle simplicity are under-communicated.",
    angle: "Prove coverage and service, simplify the bundle, and make switching easy.",
    pricing: "Simple bundles with clear price-rise terms; avoid teaser pricing that drives early churn.",
    pillars: ["Coverage you can count on", "One simple bill", "Switching made easy"],
    kpis: [{ label: "Cost per gross add", target: "benchmark by plan type" }, { label: "Port-in share of sales", target: "30–50%" }, { label: "First-90-day churn", target: "under 3%" }, { label: "Online sales share", target: "track; aim to grow each quarter" }],
  },
  {
    id: "gaming", label: "Gaming and entertainment", buyer: "players and viewers discovering new games, apps and shows", motion: "Product-led",
    mix: w(10, 30, 12, 20, 0, 10, 8, 10), openness: 2, regulation: 1,
    committee: ["Player or viewer", "Community and creators", "Platform and store partners", "Monetisation team"],
    whitespace: "Launch noise is constant; sustained community and creator programmes are rare.",
    angle: "Seed creators and community before launch, then convert with short-form video and store optimisation.",
    pricing: "Free entry with fair monetisation, or a clear premium price with launch bundles.",
    pillars: ["Made with the community", "Something new every season", "Fair to play, fun to stay"],
    kpis: [{ label: "Cost per install", target: "benchmark by platform and genre" }, { label: "Day-7 retention", target: "15–25%" }, { label: "Creator-driven installs", target: "20–40% of launch volume" }, { label: "Wishlist or pre-registration", target: "track weekly before launch" }],
  },
  {
    id: "education", label: "Education and e-learning", buyer: "learners, parents and institutions choosing courses or platforms", motion: "Hybrid",
    mix: w(26, 22, 8, 8, 0, 18, 6, 12), openness: 3, regulation: 1,
    committee: ["Learner", "Parent or sponsor", "Institution or L&D buyer", "Admissions or enrolment team"],
    whitespace: "Course catalogues compete on volume; outcome-based programmes with proof are scarce.",
    angle: "Sell the outcome (job, grade or skill), prove it with alumni stories, and make enrolment simple.",
    pricing: "Instalments or employer-sponsored options lower the barrier; make refund terms visible.",
    pillars: ["Outcomes you can show", "Learn on your schedule", "Support until you finish"],
    kpis: [{ label: "Cost per enrolment", target: "below first-term margin" }, { label: "Lead-to-enrolment", target: "5–12%" }, { label: "Completion rate", target: "50–80%" }, { label: "Referral share", target: "10–20% of enrolments" }],
  },
];

export interface Geo {
  id: string;
  label: string;
  /** 1 = hard to enter, 5 = straightforward for a foreign brand. */
  ease: number;
  /** Currency risk for USD-based budgets: none, moderate or high. */
  fx: "none" | "moderate" | "high";
  localisation: string;
  /** True where an in-market lead is needed to run the plan. */
  inMarketLead: boolean;
  /** Channel weight multipliers, e.g. search below 1 where search is fragmented. */
  adjust?: Partial<Record<ChannelId, number>>;
  /** Local platforms replacing the default stack, by channel. */
  stack?: Partial<Record<ChannelId, string[]>>;
  compliance: string[];
  note: string;
}

export const GEOS: Geo[] = [
  {
    id: "na", label: "North America", ease: 4, fx: "none", localisation: "English, with Spanish and French-Canadian where relevant", inMarketLead: false,
    compliance: ["US state privacy laws (California CCPA/CPRA and others): opt-out of sale and sharing, honour Global Privacy Control", "CAN-SPAM for email; TCPA consent for SMS and calls", "FTC rules on endorsements, reviews and influencer disclosure", "Canada: PIPEDA and Quebec Law 25; CASL for commercial email"],
    note: "Large, competitive and expensive to reach; segment tightly.",
  },
  {
    id: "latam", label: "Latin America", ease: 3, fx: "high", localisation: "Spanish and Brazilian Portuguese, adapted by country", inMarketLead: false, adjust: { social: 1.2, retail: 0.8 },
    stack: { retail: ["Mercado Ads", "Amazon Ads (Brazil, Mexico)", "Criteo"] },
    compliance: ["Brazil LGPD: lawful basis, data subject rights, DPO", "Mexico federal data protection law and privacy notice rules", "Consumer protection codes on pricing and promotions (instalment pricing must be clear)"],
    note: "Mobile- and social-first; WhatsApp is a primary customer channel.",
  },
  {
    id: "uk", label: "UK and Ireland", ease: 4, fx: "moderate", localisation: "UK English", inMarketLead: false,
    compliance: ["UK GDPR and the Data Protection Act; Irish GDPR enforcement for Ireland", "PECR: consent for cookies and marketing email and SMS", "ASA CAP and BCAP codes for ad claims, influencers and pricing", "FCA financial promotions regime for any financial product"],
    note: "Mature, measurement-savvy market; close to North American buying habits.",
  },
  {
    id: "eu", label: "Continental Europe", ease: 3, fx: "moderate", localisation: "Per-country language (German, French, Spanish, Italian, Dutch and more)", inMarketLead: false, adjust: { search: 1.1, retail: 0.8 },
    compliance: ["GDPR: lawful basis, consent records, data processing agreements", "ePrivacy rules: prior consent for cookies and tracking (consent management platform needed)", "Digital Services Act transparency on targeted ads", "Country advertising rules (e.g. comparative advertising, language laws in France)"],
    note: "Many markets, not one; launch country by country.",
  },
  {
    id: "mena", label: "Middle East (GCC)", ease: 3, fx: "none", localisation: "Arabic and English, with culturally adapted creative", inMarketLead: false, adjust: { social: 1.2, programmatic: 0.9 },
    stack: { retail: ["Amazon Ads (UAE, KSA)", "noon Ads", "Talabat or Careem ads"] },
    compliance: ["UAE and Saudi personal data protection laws (PDPL)", "UAE media regulation: licence for paid influencer content", "Content standards on culture, religion and imagery; Arabic disclosures where required"],
    note: "Young, mobile, high social use; Ramadan and national days shape the calendar.",
  },
  {
    id: "india", label: "India", ease: 3, fx: "moderate", localisation: "English and Hindi, with regional languages for reach", inMarketLead: false, adjust: { social: 1.2, ctv: 1.1, programmatic: 0.8 },
    stack: { retail: ["Amazon Ads India", "Flipkart Ads", "Swiggy Instamart or Zepto ads"] },
    compliance: ["Digital Personal Data Protection Act 2023: notice, consent and data principal rights", "ASCI advertising code, including influencer disclosure", "Sector rules (RBI for payments and lending, CDSCO for health products)"],
    note: "Price-sensitive and mobile-first; vernacular content widens reach.",
  },
  {
    id: "sea", label: "Southeast Asia", ease: 3, fx: "moderate", localisation: "English, Bahasa, Thai and Vietnamese by market", inMarketLead: false, adjust: { social: 1.25, retail: 1.1 },
    stack: { retail: ["Shopee Ads", "Lazada Sponsored Solutions", "Grab ads"] },
    compliance: ["Singapore PDPA and the Do Not Call registry", "Indonesia Personal Data Protection Law; Thailand PDPA", "Halal and cultural content considerations by market"],
    note: "Marketplace- and social-commerce-led; live selling matters.",
  },
  {
    id: "china", label: "Greater China", ease: 1, fx: "high", localisation: "Simplified Chinese (mainland) and Traditional Chinese (Hong Kong, Taiwan), built locally", inMarketLead: true,
    adjust: { search: 0.7, social: 1.3, retail: 1.3, programmatic: 0.6 },
    stack: {
      search: ["Baidu Ads", "360 Search", "Sogou"],
      social: ["WeChat (Tencent Ads)", "Douyin (Ocean Engine)", "Xiaohongshu (RED)"],
      programmatic: ["Tencent Ads network", "Ocean Engine network", "Local verification partner"],
      ctv: ["Tencent Video", "iQIYI", "Youku"],
      retail: ["Tmall and Taobao (Alimama)", "JD.com ads", "Douyin e-commerce"],
      crm: ["WeChat official account and mini-program", "Local SCRM (e.g. WeCom-based)", "Mainland-hosted CDP"],
    },
    compliance: ["Personal Information Protection Law (PIPL): separate consent, data stays in-country, cross-border transfer rules", "Advertising Law: no absolute claims (\"best\", \"No. 1\"), approval needed for regulated categories", "ICP licence for websites hosted in mainland China", "Platform rules on livestream selling and influencer disclosure"],
    note: "Separate digital ecosystem: global platforms are unavailable on the mainland.",
  },
  {
    id: "jk", label: "Japan and South Korea", ease: 2, fx: "moderate", localisation: "Japanese and Korean, native copywriting (not translation)", inMarketLead: true, adjust: { search: 1.1, social: 1.1 },
    stack: { search: ["Yahoo! JAPAN Ads", "Google Ads", "Naver Search Ads"], social: ["LINE Ads", "KakaoTalk ads (Kakao Moment)", "X and Instagram"], retail: ["Rakuten Ads", "Amazon Ads Japan", "Coupang Ads"] },
    compliance: ["Japan APPI and Korea PIPA: consent and cross-border transfer rules", "Japan stealth marketing ban (2023): label all paid endorsements", "Korea Fair Labeling and Advertising Act; KFTC influencer guidelines"],
    note: "High expectations on quality and local nuance; local platforms lead.",
  },
];

export interface Goal {
  id: string;
  label: string;
  /** Channel weight multipliers. */
  shift: Partial<Record<ChannelId, number>>;
  focus: string;
  quickWin: string;
}

export const GOALS: Goal[] = [
  { id: "awareness", label: "Brand awareness", shift: { ctv: 1.6, social: 1.3, programmatic: 1.2, search: 0.6, crm: 0.5 }, focus: "reach and memorability in the target audience", quickWin: "Run a pre-launch brand-lift baseline survey, so every later result has something to beat." },
  { id: "demand", label: "Demand generation", shift: { search: 1.3, social: 1.1, content: 1.2, ctv: 0.7 }, focus: "qualified pipeline and cost per opportunity", quickWin: "Audit conversion tracking end to end (ad click to CRM record) and fix the first broken step." },
  { id: "expansion", label: "Market expansion", shift: { social: 1.2, events: 1.4, search: 1.1, crm: 0.6 }, focus: "a beachhead segment in the new market and local proof points", quickWin: "Interview five target customers in-market and test whether your top message translates." },
  { id: "retention", label: "Retention", shift: { crm: 2.2, content: 1.2, search: 0.6, ctv: 0.5, programmatic: 0.6 }, focus: "repeat purchase, expansion revenue and lower churn", quickWin: "Segment customers by last purchase or login and send a win-back message to the lapsed group." },
];

export interface Stage {
  id: string;
  label: string;
  /** Motion override; null keeps the industry's own motion. */
  motion: Motion | null;
  org: string[];
  governance: string;
  /** Extra weeks for set-up before the first gate. */
  setupWeeks: number;
  /** Added to the budget-fit score: smaller organisations stretch a budget further. */
  fit: number;
  /** Channel weight multipliers, e.g. self-funded companies lean on owned channels. */
  shift?: Partial<Record<ChannelId, number>>;
}

export const STAGES: Stage[] = [
  {
    id: "bootstrapped", label: "Bootstrapped (self-funded, standalone)", motion: null, setupWeeks: 0, fit: 1,
    shift: { content: 1.4, crm: 1.4, search: 1.2, ctv: 0.4, events: 0.6, programmatic: 0.6 },
    org: ["Founder or owner sets the message and closes the first customers", "One generalist (or the founder) runs search, content and email", "Freelancers by the project; no retained agency"],
    governance: "Spend only what revenue can pay back: review cash, payback period and pipeline every week, and fund the next month of media from this month's sales.",
  },
  { id: "startup", label: "Startup (seed to Series A)", motion: null, setupWeeks: 0, fit: 1, org: ["Founder owns the message and the first deals", "One growth marketer runs paid channels and tracking", "Freelance creative and a specialist agency for one channel at most"], governance: "Weekly founder review of spend, pipeline and learning; kill or double down every two weeks." },
  { id: "growth", label: "Growth (Series B to D)", motion: null, setupWeeks: 1, fit: 0, org: ["Head of growth accountable for pipeline or revenue targets", "Channel owners for paid, lifecycle and content", "RevOps or marketing ops owns data, attribution and the stack"], governance: "Weekly business review on leading indicators; monthly budget reallocation across channels." },
  { id: "enterprise", label: "Established enterprise", motion: "Sales-led", setupWeeks: 2, fit: -1, org: ["CMO-led steering committee with sales, finance and legal", "Regional marketing leads with local budgets", "Central centre of excellence for media, data and brand standards"], governance: "Quarterly steering committee sets budget; monthly regional reviews; formal gate reviews with finance." },
];

export interface Budget {
  id: string;
  label: string;
  /** Maximum channels worth funding at this level. */
  maxChannels: number;
  /** Share of total budget: working media, creative and content, data and tools, measurement, team and agency. */
  split: [number, number, number, number, number];
}

export const BUDGETS: Budget[] = [
  { id: "b1", label: "Under $250k", maxChannels: 3, split: [62, 16, 8, 4, 10] },
  { id: "b2", label: "$250k–$1M", maxChannels: 4, split: [64, 14, 9, 5, 8] },
  { id: "b3", label: "$1M–$5M", maxChannels: 6, split: [66, 13, 9, 6, 6] },
  { id: "b4", label: "$5M+", maxChannels: 8, split: [68, 12, 8, 7, 5] },
];

export const BUDGET_LINES = ["Working media", "Creative and content", "Data and tools", "Measurement and research", "Team and agency"] as const;
