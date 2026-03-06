# BrowserGate — Complete Project Brief

Use this document as system context for a Claude project. It contains all verified facts, legal analysis, technical findings, and strategic context from prior research.

**Protagonist:** Steven Morell (legal name Jan-Jakob Liebling), founder/CEO of Teamfluence OÜ (Estonian company, registry 17381325), a B2B SaaS LinkedIn automation and social prospecting platform (~€28k MRR, ~230 paid workspaces). Also founder of Fairlinked e.V., a German nonprofit pursuing DMA enforcement against LinkedIn. Based in Freising, Germany.

**US entity:** Jaxx Technologies Inc. (Delaware C-Corp) — predecessor entity, still active for Stripe Capital loan obligations. Relevant as potential US class action plaintiff vehicle.

**Legal counsel:** Dr. Christian Karbaum, GMW (Glade Michel Wirtz) law firm — handling the DMA litigation track.

---

## 1. What is BrowserGate

LinkedIn (Microsoft) systematically scans every visitor's browser for installed Chrome extensions without consent or disclosure. As of December 2025, the scan covers 5,459 extensions with a cumulative user reach of ~405 million.

### 1.1 Scale and Growth

| Period | Extensions Scanned |
|--------|-------------------|
| 2017 | 38 |
| 2024 | ~461 |
| May 2025 | ~1,000 |
| December 2025 | 5,459 |

The 10x growth from 2024 to 2025 correlates with LinkedIn's designation as a DMA-regulated gatekeeper (September 2023). As LinkedIn was forced to allow third-party tools under the DMA, it massively expanded surveillance of those exact tools.

### 1.2 Technical Method — Three-Stage Detection

LinkedIn uses a fallback escalation chain in its JavaScript bundle:

1. **`externally_connectable` check** — Attempt direct communication with the extension via Chrome's messaging API. If the extension developer has disabled `externally_connectable` in their `manifest.json`, this fails.
2. **`web_accessible_resources` fallback** — Attempt to fetch a known resource from the extension. If the developer hasn't exposed any `web_accessible_resources`, this also fails.
3. **DOM mutation detection** — Monitor for DOM changes characteristic of specific extensions injecting elements into the page.
4. **Exfiltration** — Results sent via `fireTrackingPayload("AedEvent", ...)`

### 1.3 What LinkedIn Scans For

- **762** LinkedIn-specific tools
- **209** sales/prospecting competitors (Apollo, Lusha, ZoomInfo — 3.4M users)
- **509** job search extensions (1.4M users — reveals unemployment status)
- **VPNs, ad blockers, security tools** (Malwarebytes Browser Guard 10M users, KeepSolid VPN Unlimited, Zoho Vault, LinkedIn Profile Privacy Shield)
- **Religious extensions** — see §1.4
- **Political extensions** — see §1.4
- **Disability/neurodivergence tools** — see §1.4

### 1.4 GDPR Article 9 — Sensitive Personal Data Exposed

BrowserGate scanning reveals special category data under GDPR Article 9:

**Religious beliefs:**
- PordaAI — "Blur Haram objects in Images and Videos, Real-time AI for Islamic values" (5,000 users) → identifies Muslim users
- Deen Shield — "Blocks haram & distracting sites, Quran Home Tab" (12 users) → identifies practicing Muslims

**Political opinions:**
- Anti-woke — "The anti-wokeness extension. Shows warnings about woke companies"
- Anti-Zionist Tag — "Adds a tag to the LinkedIn profiles of Anti-Zionists"
- Vote With Your Money — "showing political contributions from executives and employees"
- No more Musk — "Hides digital noise related to Elon Musk" (19 users)
- Political Circus — "Politician → Clown AI Filter" (7 users)
- LinkedIn Political Content Blocker — "Blocks political posts on LinkedIn"
- NoPolitiLinked — "removes all political posts from your linkedin feed"

**Disability/neurodivergence:**
- "simplify" — described as "for neurodivergent users" (79 users)

**Employment status:**
- 509 job search extensions (1.4M users) reveal unemployment or job-seeking status on a professional platform where employers, recruiters, and current employers can see profiles.

### 1.5 Corporate Intelligence Angle

Because LinkedIn knows each user's name, employer, and role, BrowserGate aggregates to company-level profiles. LinkedIn can determine which companies use which software tools (e.g., which companies use Apollo, which use Lusha, which use Adobe products). This is competitive intelligence on enterprise tech stacks derived without consent.

---

## 2. Connection to Teamfluence

LinkedIn used BrowserGate surveillance to identify Teamfluence customers. On December 10, 2025, LinkedIn sent an enforcement email threatening Teamfluence users for violating ToS Section 8.2.2 (blanket ban on all third-party tools).

The enforcement action was enabled by evidence obtained through BrowserGate scanning — the "fruit of the poisonous tree" argument.

---

## 3. The Voyager API Disparity

### 3.1 Andrea Yoon's Statements

At the June 20, 2025 DMA Enforcement Workshop, Andrea Yoon (LinkedIn) stated:

- Member Data Portability API (Art. 6.9): 1,900 applications, 921,000 total API calls
- Pages Data Portability API (Art. 6.10): 750 applications, 2,000,000 total API calls
- Total: 2,650 applications, ~2.9 million API calls over ~15.5 months (March 2024 – June 2025)

Her defenses for slow performance:
- "In terms of the response rates being low, I think it's helpful to just contextualize the sheer volume and the complexity of the data involved"
- "We have to monitor and ensure that this API program is sustainable. We want to make sure that our system is not overwhelmed by certain high volume of requests"

### 3.2 The Math

| Metric | Voyager (Internal) | DMA APIs (External) |
|--------|-------------------|---------------------|
| API calls per day | ~14.1 billion | ~6,280 |
| API calls per second | ~163,000 | ~0.07 |
| **Ratio** | **2.25 million : 1** |

The DMA APIs handle 0.00004% of internal API traffic. Yoon claimed "system overwhelm" concerns while Voyager handles 163,000 calls/second internally.

### 3.3 Legal Significance

- DMA Article 6(10) requires "effective, high-quality, continuous and real-time access"
- DMA Article 13(4) prohibits technical measures that undermine compliance
- Yoon's statements to the EU Commission constitute a material misrepresentation about LinkedIn's technical capabilities

---

## 4. Legal Correspondence Timeline

1. **December 10, 2025** — LinkedIn sends enforcement email to Teamfluence customers, threatening action for violating clause 8.2.2
2. **December 22, 2025** — GMW (Dr. Karbaum) sends letter to LinkedIn demanding: cease-and-desist from threatening Teamfluence/customers, amend clause 8.2.2, provide effective API with equal performance to Voyager
3. **January 5, 2026** — LinkedIn responds: requests "further details" about Voyager knowledge, reframes Teamfluence as the violator ("systematically violated the User Agreement's prohibition on automation and scraping"), reserves all rights. Does NOT withdraw threat, commit to amending 8.2.2, or address API disparity.

LinkedIn's January 5 response is a non-response. They did not deny Voyager's existence or performance. They asked Steven to explain his "knowledge and use" of it.

---

## 5. German Criminal Law — BrowserGate

### 5.1 Applicable Statutes

| Statute | Offense | Application |
|---------|---------|-------------|
| § 202a StGB | Ausspähen von Daten (unauthorized data access) | Scanning installed extensions. When developers disable `externally_connectable`, that's "besondere Sicherung" (special security measure). LinkedIn's three-stage fallback chain proves deliberate circumvention. BGH 5 StR 614/19: even quickly circumvented security measures qualify. |
| § 202b StGB | Abfangen von Daten (interception of data) | Transmitting extension list to LinkedIn servers via `fireTrackingPayload` |
| § 202c StGB | Vorbereiten des Ausspähens (preparation of data espionage) | The fingerprinting system itself |
| § 240 StGB | Nötigung (coercion) | Using illegally obtained data to threaten tool vendors and their customers |
| § 23 GeschGehG | Trade secret theft | Each extension vendor's customer base is a trade secret. LinkedIn maps which users use which competitor tools. Potentially 5,459 separate offenses. |

### 5.2 TTDSG § 25

Browser extension scanning = accessing information stored on user's terminal device. Requires explicit consent under § 25 TTDSG (same legal basis as cookie consent). Penalty: up to €300,000.

### 5.3 Personnel Link

Melanie Kiser — Senior Counsel Competition & Regulatory at LinkedIn. Likely oversees both enforcement actions against tool vendors and the BrowserGate surveillance program. This connects the criminal statutes: systematic surveillance (§202a) → identification of targets → coercive enforcement action (§240) = organized Wirtschaftskriminalität.

---

## 6. GDPR Violations

| Article | Violation |
|---------|-----------|
| Art. 5 | No transparency about extension scanning |
| Art. 6 | No legal basis for processing |
| Art. 9 | Processing sensitive data (religion, politics, health) without explicit consent |
| Art. 13/14 | No disclosure in privacy policy (confirmed: LinkedIn's privacy policy contains zero mention of extension scanning) |
| Art. 83(5) | For Art. 9 violations: fines up to €20M or 4% of annual worldwide turnover |

Art. 9(2)(e) ("manifestly made public") does NOT apply — installed browser extensions are private data, not publicly disclosed by the user.

---

## 7. DMA Violations

| Article | Violation |
|---------|-----------|
| Art. 6(10) | Failure to provide effective, high-quality, continuous and real-time API access (2.25M:1 disparity) |
| Art. 5(6) | Anti-retaliation — threatening users who exercise DMA rights |
| Art. 13(4) | Anti-circumvention — technical measures (BrowserGate) to detect and punish users of competing/interoperating services |
| Art. 13(6) | Anti-retaliation — degrading conditions for users exercising DMA rights |

LinkedIn's ToS clause 8.2.2 (blanket ban on all third-party tools) directly contradicts DMA Article 6(10).

---

## 8. BrowserGate as Monopoly Maintenance Tool

**The chain:**

1. LinkedIn holds monopoly in professional sales intelligence (Sales Navigator ~$1B/yr revenue)
2. Competitors use Chrome extensions + LinkedIn's Voyager API to offer alternatives
3. LinkedIn needs to identify which users run competitor tools
4. → BrowserGate scans 5,459 extensions
5. LinkedIn identifies users of competitor tools
6. LinkedIn restricts/suspends accounts, threatens customers

**EU DMA angle:** The pending LG München I case (via GMW/Dr. Karbaum) challenges clause 8.2.2 as violating DMA Articles 6(10) and 5(6). If the EU ruling forces LinkedIn to amend 8.2.2, it proves LinkedIn CAN allow these tools — meaning the US ban exists purely for anti-competitive reasons. This becomes evidence in US antitrust proceedings.

---

## 9. US Legal Claims

### 9.1 Viable Claims (via Jaxx Technologies Inc., Delaware C-Corp)

**Sherman Act § 2 — Monopolization:**
- BrowserGate is the monopoly maintenance tool
- LinkedIn has monopoly (Sales Navigator ~$1B/yr) → competitors use extensions + Voyager API → BrowserGate identifies them → accounts/customers targeted
- Treble damages + attorney fees
- EU DMA ruling as evidence: proves LinkedIn CAN allow tools, meaning US ban is purely anticompetitive
- Standing: LinkedIn detected Teamfluence extension → identified customers → enforcement action → lost customers/revenue = concrete competitive injury

**Defend Trade Secrets Act (18 USC 1836):**
- Extension scanning reveals Teamfluence's customer list (who has the extension installed)
- Trade secret obtained through improper means
- Minimum $1,000 statutory damages + punitive damages if willful

**Lanham Act § 43(a) — False Advertising / Unfair Competition:**
- LinkedIn publicly claims privacy compliance while conducting covert mass surveillance
- Competitive injury to Teamfluence and other tool vendors

### 9.2 CIPA — California Invasion of Privacy Act

- $5,000 per violation statutory damages, no need to prove actual harm
- Requires California nexus (resident or interception occurred in California)
- Steven cannot be plaintiff (not California resident)
- Millions of California LinkedIn users can be plaintiffs
- Largest damages pool: 50M+ US users × $5,000 = $250B theoretical exposure
- Steven's role: evidence provider + plaintiff funnel operator
- Caveat: CIPA requires interception of communications or pen register/trap-and-trace. LinkedIn is probing for installed software, not intercepting communications. Fit is debatable — needs careful legal framing.

### 9.3 Ruled Out

| Statute | Why It Doesn't Fit |
|---------|-------------------|
| CFAA (18 USC 1030) | Post-Van Buren (2021) too narrow. LinkedIn isn't accessing "areas off-limits." |
| Stored Communications Act (18 USC 2701) | Browser isn't a "facility" under case law |
| Wiretap Act (18 USC 2511) | Not intercepting communications between two parties |

### 9.4 Target US Law Firms (Contingency, 20-40%)

| Firm | Relevant Experience |
|------|-------------------|
| Hausfeld LLP | Helena World Chronicle v. Google — Sherman Act §§ 1, 2, 3 class action |
| Hagens Berman | De Coster v. Amazon antitrust, first Intel § 2 monopolization consumer class action, $340B+ total settlements |
| Milberg LLP | Google antitrust class action steering committee, $50B+ total recoveries |
| Quinn Emanuel | Amazon antitrust, Facebook antitrust, Law360 Antitrust Practice Group of the Year |
| Keller Lenkner | Co-Lead in De Coster v. Amazon, Facebook antitrust |
| Lanier Law Firm | Lead counsel Texas v. Google (15+ states, ad-tech antitrust) |

---

## 10. Netherlands WAMCA Class Action

### 10.1 Structure

Plaintiff must be a Dutch foundation (stichting). Individuals cannot bring class actions directly. Requirements: articles of association defining purpose, independent governance, sufficient funding, compliance with Claim Code 2019.

**Proposed structure:**
- Fairlinked e.V. (Germany) founds Stichting BrowserGate NL (Netherlands)
- Stichting is the plaintiff in the WAMCA action
- Fairlinked appoints initial board
- Setup: Dutch notary, €1-3k, 2-4 weeks

### 10.2 Scope

- Dutch residents: automatic (opt-out mechanism)
- All other EU citizens: must actively join (opt-in)
- Precedent: Converium case — Amsterdam court accepted 12,000 non-US parties, only 200 were Dutch

### 10.3 Claims in NL

1. **GDPR Article 82** — Damages for unlawful processing (scanning = processing personal data without consent/transparency/legal basis)
2. **Dutch Telecommunications Act (Telecommunicatiewet)** — Accessing information on user's device without consent (ePrivacy Directive transposition)
3. **Dutch Competition Act Art. 24 (mirrors EU Art. 102)** — Abuse of dominant position, using surveillance to identify and block competitors
4. **Unfair Commercial Practices (Wet oneerlijke handelspraktijken)** — Deceptive conduct, users not informed

### 10.4 Expected Damages

- Per person: €100-500 (based on EU GDPR case law; €1,500 awarded in one Dutch case involving highly sensitive medical data)
- CJEU has clarified Art. 82 is compensatory, not punitive
- Value is in scale: 10M Dutch users × €300 = €3B; 50M EU opt-ins × €300 = €15B
- No Dutch GDPR class action has reached a damages award yet (TikTok case still live as of Oct 2025; Oracle/Salesforce dismissed on admissibility, not merits; Facebook got declaratory judgment but no damages under pre-WAMCA regime)

### 10.5 Budget Estimate

- Year 1 (pre-litigation + filing): €400-700k
- Years 2-5 (litigation): €400-650k/year
- Total: €2-4 million over 4-5 years
- Adverse costs if you lose: ~€50-100k (not millions)

### 10.6 Unclaimed Funds

Typical claim rates: 5-20%. Unclaimed funds: court decides — additional distribution, cy-près to related cause, or back to stichting for activities in furtherance of its purpose. Fairlinked or a service provider can be compensated at market rates for real services rendered.

---

## 11. UK Class Action (Separate Track)

Potential claims under Competition Act 1998, UK GDPR, and Computer Misuse Act 1990. Separate from EU DMA but parallel framework possible.

---

## 12. Plaintiff Recruitment Funnel — Evidence Tool

### 12.1 Architecture

```
[Browser Extension - runs at document_start, before LinkedIn scripts]
       |
       v
[Intercept: window.fetch + XMLHttpRequest for chrome-extension:// URLs]
       |
       v
[Log: {timestamp, extension_id_probed, page_url, user_agent}]
       |
       v
[Create JSON evidence packet with metadata]
       |
       v
[SHA-512 hash of packet]
       |
       v
[Send hash to TSA (FreeTSA.org primary, DigiCert/Sectigo fallback)]
       |
       v
[Receive signed .tsr timestamp token (RFC 3161)]
       |
       v
[Bundle: evidence.json + evidence.tsr + hash.txt]
       |
       v
[Open browsergate.com/join → form + document signing + bundle upload]
       |
       v
[Submit to law firm endpoint]
```

### 12.2 Signup Flow

1. Plugin captures evidence → creates JSON + .tsr
2. Opens browsergate.com/join
3. Form collects: name, email, address, California residency attestation (for CIPA)
4. User signs (ESIGN/UETA compliant — intent + consent + record retention):
   - Litigation Funding Assignment Agreement (10% of recovery to Teamfluence/Fairlinked)
   - Retainer Agreement (authorizes law firm)
   - Class Action Participation Consent
5. Evidence package + signed docs submitted to law firm

### 12.3 Technical Considerations

- Manifest V3 restrictions — may need `declarativeNetRequest` or `document_start` injection
- Plugin must run BEFORE LinkedIn's detection code
- Hash mismatch = self-policing tamper evidence (user can't modify JSON without invalidating timestamp)
- Public IP: call external service (api.ipify.org) or log server-side on upload
- Multiple TSAs for redundancy

---

## 13. Monetization Structure

Steven's revenue paths:

1. **10% assignment** from each plaintiff's recovery (via assignment agreement signed at signup)
2. **Sherman Act claim** via Delaware C-Corp (direct competitive damages × 3 treble damages)
3. **Consultant/expert fees** from law firm
4. **Service agreements** with stichting (NL) for evidence delivery, technical expertise, EU coordination
5. **NOT litigation funding** — Steven doesn't have capital for that structure

---

## 14. Campaign

- **Name:** BrowserGate
- **Domain:** browsergate.eu
- **Logo concept:** Stop-hand merged with LinkedIn "in" logo
- **Donation vehicle:** Fairlinked e.V.

**Target press outlets:**
- netzpolitik.org (German, privacy-focused)
- The Markup (US, algorithmic accountability)
- Wired, Ars Technica (tech mainstream)
- Financial Times, Bloomberg (business angle: Microsoft antitrust)
- Politico EU (regulatory angle)

**Narrative:** LinkedIn could have built an app marketplace — like Salesforce, like HubSpot. Instead, they chose to ban all tools and enforce that ban through mass surveillance of billions of users. The EU said no (DMA). LinkedIn's response: lie about their capabilities and escalate the surveillance.

---

## 15. Strategic Sequencing

As established in prior conversations, the optimal sequencing:

1. **Legal track:** Respond to LinkedIn's Jan 5 letter with full Voyager evidence, demand non-enforcement commitment with short deadline. If refused → file Hauptsacheklage (permanent injunction on 8.2.2) + Commission complaint simultaneously.
2. **Criminal track:** Strafanzeige with Staatsanwaltschaft for §202a/§202b StGB (BrowserGate) + §240 StGB (Nötigung based on illegally obtained evidence).
3. **Press track:** BrowserGate goes public. Coordinate timing with legal filings. Once a journalist commits, announce filings same day/next day.
4. **Coalition track:** Fairlinked e.V. organizes affected tool providers. NDA-based working group. Shared costs/pressure.
5. **Class action track:** Netherlands WAMCA via stichting. US class action via contingency-fee firm. Plaintiff recruitment via evidence plugin.

The press coverage is the air cover. The legal actions are the ground game. LinkedIn blinks when they withdraw the December 10 threat in writing.

---

## 16. Key Chat References

- Main technical analysis: https://claude.ai/chat/634533bb-baa0-46ad-9ef6-2c79fb01efd7
- Naming/campaign: https://claude.ai/chat/b318af8b-66e8-4c20-9b37-83b437fdf95d
- Legal analysis overview: https://claude.ai/chat/0092bcf1-cf6d-49e9-93bb-992b879798ea
- EU DMA → Sherman Act link: https://claude.ai/chat/8b4cbe7c-5dc3-495e-a30a-08c798b33879
- Sherman Act + CIPA deep dive: https://claude.ai/chat/0fc66c32-6976-4d5f-b101-daa7c175e250
- Law firm list: https://claude.ai/chat/b4b3b0e1-6ab0-4eff-b81a-e56cd5e516b8
- Deal structuring + settlement %: https://claude.ai/chat/74b9413c-a388-49f2-b021-d5385a9d2f28
- UK class action analysis: https://claude.ai/chat/9ea9dc1d-c2fe-447b-92a7-49677025876d
- US class action brief: https://claude.ai/chat/a4ce4e78-14f9-48dd-9608-d9d331f74909
- Voyager API analysis: https://claude.ai/chat/fd4cd8f4-0215-484a-8353-e1ceb3383749
- Art. 9 sensitive data analysis: https://claude.ai/chat/8ac83aa3-465f-4747-b9e6-73cf78095741
- BrowserGate context brief: https://claude.ai/chat/bca17ce1-0e85-400a-a68b-682faf30ae4f
