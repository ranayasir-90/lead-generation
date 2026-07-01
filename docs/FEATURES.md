# 📋 Business Leads AI Automation — Features

> Pakistan ke B2B businesses ke liye Google Maps se leads scrape karo, score karo, aur AI se personalized Call Pitch + WhatsApp messages banao.

---

## 🌐 Web Dashboard

**URL:** `http://localhost:3000`  
**Start karo:** `npm run web`

### Dashboard Section
- Total Campaigns, Total Leads, High Score Leads, Average Score ka **live overview**
- Recent 5 campaigns ki activity list
- Har campaign par click karo → detail modal open hota hai

### Campaigns Section
- Sab campaigns cards mein dikhti hain (industry, location, date, leads count)
- Status badge: `completed` ya `running`
- Campaign card par click → puri detail + leads list

### Leads Section
- Kisi bhi campaign ke leads ko table mein dekho
- **Live search** — naam, phone, address, score se filter karo
- Sortable columns
- Har lead ka status dropdown: `New Lead`, `Contacted`, `Interested`, `Not Interested`
- Status save hota hai disk par
- Har lead par click → detailed modal

### Analytics Section
- **Bar Chart** — Industry-wise leads distribution
- **Pie Chart** — Lead quality distribution (HIGH / MEDIUM / LOW)
- Trend cards: Total Campaigns, Last 30 Days, All Leads, Avg Quality Score

---

## 🚀 Campaign Creation

**Web UI se:** Dashboard → "New Campaign" button  
**Terminal se:** `npm run campaign`

### Campaign Setup Steps:
1. **Campaign Name** — apna naam do
2. **Industry** — 7 options mein se choose karo:
   - 🍽️ Restaurant & Food Service
   - 🚗 Automotive (Rental, Workshop)
   - 🛍️ Retail & E-commerce
   - 💼 Professional Services
   - 🏥 Healthcare & Clinics
   - 🎓 Education & Training
   - 🏠 Real Estate & Property
3. **Location** — jis city mein dhundna hai (e.g., Islamabad, Lahore, Karachi)
4. **Search Query** — custom Google Maps search query
5. **Number of Leads** — kitne leads chahiye (default: 20)
6. **Your Service** — kya offer karna hai (AI prompts mein use hota hai)
7. **Campaign Style** — Conservative / Balanced / Aggressive
8. **Templates** — WhatsApp / Call Pitch / Dono

### Campaign Execution (Automatic):
- **Phase 1:** Google Maps se leads scrape
- **Phase 2:** Lead Intelligence scoring (0-100)
- **Phase 3:** AI content generation (HIGH + MEDIUM priority leads ke liye)
- **Phase 4:** Results save to `output/` folder

### Real-Time Progress:
- Web dashboard mein **live progress bar** dikhti hai (SSE — Server Sent Events)
- Campaign complete hone par automatic notification

---

## 🔍 Lead Scraping (Google Maps)

**File:** `src/scraper.js`

- Google Maps se businesses scrape karta hai Puppeteer browser se
- Extract karta hai:
  - Business Name
  - Address
  - Phone Number
  - Rating (stars)
  - Website URL
  - Google Maps Reference Link
- **Auto Deduplication:**
  - Pichle sab campaigns se compare karta hai
  - Name, phone (last 9 digits), website duplicate check
  - Duplicate leads skip ho jate hain
- **Auto Scroll** — page scroll karta hai zyada results laane ke liye

---

## 🧠 Lead Intelligence & Scoring

**File:** `src/leadIntelligence.js`

Har lead ko **0–100 score** milta hai 6 factors ke base par:

| Factor | Weight | Kya Check Hota Hai |
|---|---|---|
| Data Completeness | 20% | Name, address, phone, website, rating |
| Business Quality | 25% | Rating, name quality, address quality |
| Digital Presence | 15% | Website, social media mentions |
| Location Value | 15% | City (Islamabad > Karachi > Lahore) |
| Industry Potential | 15% | Industry-wise potential score |
| Contactability | 10% | Phone number, Pakistani format check |

### Priority Categories:
- 🔴 **HIGH** — Score ≥ 85 → Immediate outreach
- 🟡 **MEDIUM** — Score 65–84 → Standard campaign
- 🟢 **LOW** — Score < 65 → Minimal resources

### Lead Categories:
- `A+ (Excellent)` — 85+
- `A (High Quality)` — 75–84
- `B (Good)` — 65–74
- `C (Average)` — 55–64
- `D (Low Score)` — below 55

---

## 🤖 AI Content Generation (OpenAI GPT)

**File:** `src/marketingAI.js`

### Kya Generate Hota Hai:
1. **📞 Call Pitch Script** — 30-60 second Roman Urdu calling script
   - Assalam o Alaikum se shuru
   - Business ka naam + problem mention
   - Solution brief mein
   - Meeting/callback ka request
2. **💬 WhatsApp Message** — 3-5 line Roman Urdu message
   - Friendly opener
   - 1 key benefit
   - Clear call-to-action
   - Relevant emojis

### Pakistani Context:
- **Roman Urdu** mein content (Urdu written in English letters)
- Pakistani business culture ka context
- Real Pakistan market data include hota hai:
  - Pakistan digital adoption stats
  - Industry-wise market size (PKR mein)
  - Local case studies (Lahore, Karachi, Islamabad)
- `aap` address, `bharosa`, `rishta` jaise cultural elements

### Industry Templates (7 industries):
Har industry ke liye pre-defined:
- **Pain Points** — 5 common business problems
- **Solutions** — relevant digital solutions
- **Benefits** — ROI aur growth numbers
- **Local Case Study** — Pakistan-specific success story
- **Urgency** — market trend-based pressure

### Campaign Styles:
- **Conservative** — respectful, trust-building, long-term
- **Balanced** — professional friendliness (default)
- **Aggressive** — direct, urgent, immediate action

### AI Generate Kab Hota Hai:
- **Campaign run pe:** HIGH + MEDIUM priority leads ke liye batch generation
- **On-Demand (Lead Detail Modal):** Kisi bhi lead ke liye manually "Generate Pitch" button se

---

## 👤 Lead Detail Modal

Har lead par click karo ya campaign detail mein lead card click karo:

- **Business info:** Name, Rating, Score/Category
- **Contact:** Phone number (clickable → call), Address (Google Maps link), Website
- **Status Dropdown:** New Lead / Contacted / Interested / Not Interested
- **Pitch Generator Box:**
  - Service input field
  - "Generate Pitch" button → AI se real-time content banao
- **AI Outreach Pitches:**
  - 📞 Call Pitch tab — Call script copy button + "Call Now" link
  - 💬 WhatsApp tab — Message copy + "Send on WhatsApp" button

---

## 📱 WhatsApp Integration

- Lead card aur detail modal mein **"WhatsApp" button**
- Button click → `https://wa.me/<phone>?text=<message>` URL khulta hai
- Pakistani phone format auto-convert (`03xx` → `923xx`)
- Pre-filled message (AI generated content)

---

## 📤 Export Features

### vCard Export:
- **Single Lead vCard:** Lead detail → `.vcf` file download
- **Campaign vCard Bundle:** Sab leads ek `.vcf` file mein (contacts app mein import)

### File Outputs (output/ folder):
- `leads_with_intelligence.json` — sab leads + scores
- `leads_with_intelligence.csv` — spreadsheet ke liye
- `priority_callpitch_scripts.txt` — HIGH priority call scripts
- `priority_whatsapp_templates.txt` — HIGH priority WhatsApp messages
- `medium_callpitch_scripts.txt` — MEDIUM priority scripts
- `medium_whatsapp_templates.txt` — MEDIUM priority messages
- `intelligence_report.json` — detailed scoring analysis
- `campaign_info.json` — campaign summary

---

## ⚙️ Setup & Configuration

**Command:** `npm run setup`

### Setup Wizard Steps:
1. **OpenAI API Key** configure karo (validate hota hai)
2. **Optional Custom Base URL** — Azure, OpenRouter, local LLM support
3. **Business Profile:**
   - Business Name, Type, Phone, Website
   - Description (AI prompts mein use hota hai)
   - Value Propositions
   - Target Industries
4. **Owner Info:** Name, Phone
5. **Preferences:** Language (English), Default location, Campaign style
6. **Industry Focus** — primary target industry
7. **Connection Test** — API verify
8. **Sample Campaign** — optional demo run

### Configuration Files:
- `.env` — API keys aur settings
- `business-profile.json` — business profile data
- `user-preferences.json` — user preferences

---

## 🏢 Business Profile System

**File:** `src/businessProfile.js`

- Central profile store — poore project mein ek jagah se data
- AI prompts mein automatically business info inject hoti hai:
  - Business Name, Phone, Website
  - Owner Name, Owner Phone
  - Business Type, Description
  - Value Propositions
- Environment variables se fallback support
- Profile validate karta hai — missing fields warning deta hai

---

## 🖥️ CLI Mode

**Command:** `npm start` ya `node index.js`

```bash
# Basic scraping
node index.js -q "Restaurant Lahore" -l 50

# With WhatsApp marketing generation
node index.js -q "Clinic Islamabad" -l 20 -m "We build appointment systems" -c "Get Free Demo"
```

### Options:
| Flag | Kya Karta Hai |
|---|---|
| `-q` / `--query` | Search query |
| `-l` / `--length` | Number of results (max 100) |
| `-m` / `--marketing` | Marketing content for WhatsApp templates |
| `-c` / `--cta` | Call to action text |
| `-h` / `--help` | Help message |

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| **Web Scraping** | Puppeteer (Headless Chrome) |
| **AI Generation** | OpenAI GPT-4o-mini (configurable) |
| **Web Server** | Express.js |
| **Frontend** | Vanilla HTML, CSS, JavaScript |
| **Real-time Updates** | Server-Sent Events (SSE) |
| **Data Storage** | JSON files (output/ folder) |
| **Runtime** | Node.js ≥ 14 |

---

## 🔌 API Endpoints

| Method | Endpoint | Kya Karta Hai |
|---|---|---|
| `GET` | `/api/dashboard` | Dashboard stats + recent activity |
| `GET` | `/api/campaigns` | Sab campaigns list |
| `POST` | `/api/campaigns` | Naya campaign shuru karo |
| `GET` | `/api/campaigns/:id` | Campaign detail + leads |
| `GET` | `/api/campaigns/:id/leads` | Paginated leads (filter by score) |
| `GET` | `/api/campaigns/:id/export/vcard` | vCard bundle download |
| `POST` | `/api/leads/status` | Lead status update karo |
| `POST` | `/api/leads/generate-pitch` | On-demand AI pitch generate |
| `GET` | `/api/leads/:cId/:idx/vcard` | Single lead vCard |
| `GET` | `/api/events` | SSE real-time updates stream |
| `GET` | `/api/health` | Server health check |
| `GET` | `/api/analytics` | Analytics data |

---

## 📦 NPM Commands

| Command | Kya Karta Hai |
|---|---|
| `npm run setup` | First-time setup wizard |
| `npm run web` | Web dashboard start karo |
| `npm run web:dev` | Web dashboard (auto-reload) |
| `npm run campaign` | Terminal-based campaign builder |
| `npm start` | CLI scraping tool |
| `npm run dev` | CLI (auto-reload) |
| `npm test` | Tests chalao |
