# Business Leads AI Automation - Complete Project Overview Roman Urdu Mein

Yeh file is project ka detailed overview hai. Is mein project ka maqsad, kaam karne ka tareeqa, folder structure, important files, web dashboard, CLI, AI features, configuration, output data, tests, aur current issues/limitations Roman Urdu mein explain kiye gaye hain.

## 1. Project ka short intro

Is project ka naam `Business Leads AI Automation` hai. Yeh Node.js based lead generation tool hai jo Google Maps se public business data scrape karta hai, phir us data ko AI ke zariye analyze/scoring karta hai, aur business outreach ke liye call pitch ya WhatsApp message templates generate karta hai.

Simple alfaaz mein:

- Aap search query dete hain, jaise `Dental Clinics`, `Academy`, `Restaurant Islamabad`.
- Project Google Maps se businesses nikalta hai.
- Har business ke liye name, address, phone, website, rating, source aur reference link save karta hai.
- Lead quality score calculate karta hai.
- AI se personalized pitch ya WhatsApp message banata hai.
- Results `output/` folder mein JSON/CSV files ki form mein save hotay hain.
- Web dashboard se campaigns, leads, pipeline boards, follow-up calendar, aur analytics dekhi ja sakti hain.

Yeh tool mostly B2B lead generation ke liye banaya gaya hai, khas taur par digital agency, marketing agency, web development agency, LMS/web solution seller, ya local business outreach ke use case ke liye.

## 2. Project ka main purpose

Project ka core purpose yeh hai ke manual lead hunting ko automate kiya jaye:

1. Google Maps par business search karna.
2. Business name, phone, address, rating, website waghera collect karna.
3. Duplicate leads avoid karna.
4. Har lead ko score dena ke yeh kitni valuable hai.
5. AI ke through Roman Urdu/English outreach scripts (Call script aur WhatsApp message) generate karna.
6. Dashboard mein campaigns, leads aur visual Kanban pipeline manage karna.
7. Next Follow-up scheduling calendar set karna aur vocal reminder alerts chalana.
8. Call notes history maintain karna har conversation ke liye.
9. Leads ko CSV/JSON/vCard style export karna.

Example use case:

Aap ClientMarkaz ke liye dental clinics ko website/chatbot/LMS ya digital marketing service sell karna chahte hain. Aap campaign create karte hain: `Dental Clinics`. Tool Google Maps se clinics collect karta hai, un ko score karta hai, aur phir har clinic ke liye call pitch ya WhatsApp message generate kar sakta hai.

## 3. Technology stack

Project Node.js/JavaScript mein bana hua hai.

Main dependencies:

- `express`: Web dashboard aur REST API server ke liye.
- `puppeteer`: Browser automation ke zariye Google Maps scrape karne ke liye.
- `openai`: OpenAI API se AI marketing content generate karne ke liye.
- `dotenv`: `.env` file se API keys aur settings load karne ke liye.
- `sqlite3`: Package dependency mein available hai, lekin current source code mein database ka active use nazar nahi aata.
- `nodemon`: Development mode mein auto-reload ke liye.

Runtime:

- `package.json` ke mutabiq Node.js `>=14.0.0` required hai.
- README mein Node.js 16+ mention hai.
- CONTRIBUTING mein Node.js 20+ mention hai.

Yani documentation mein Node version thora inconsistent hai. Practical taur par modern Node.js LTS use karna behtar hai.

## 4. Project ka folder/file structure

Important files aur folders:

```text
business-leads-ai-automation-main/
  index.js
  package.json
  package-lock.json
  README.md
  CONTRIBUTING.md
  DISCLAIMER.md
  business-profile.json
  user-preferences.json
  .env
  nodemon.json
  test.js
  docs/
    USER_GUIDE.md
    FEATURES.md
  src/
    cli.js
    scraper.js
    campaign.js
    marketing.js
    marketingAI.js
    leadIntelligence.js
    fileUtils.js
    businessProfile.js
    openaiClient.js
    setup.js
    web/
      server.js
      public/
        index.html
        css/
          dashboard.css
          components.css
        js/
          api.js
          components.js
          dashboard.js
  output/
    campaign_.../
      campaign_info.json
      leads_with_intelligence.json
```

Note: `node_modules/` bhi project mein present hai, lekin woh installed dependencies ka folder hai. Actual project logic `src/`, root config files, docs, aur `output/` mein hai.

## 5. NPM scripts

`package.json` mein yeh scripts defined hain:

```bash
npm run setup
npm run campaign
npm start
npm run dev
npm run web
npm run web:dev
npm test
npm run help
```

Inka kaam:

- `npm run setup`: Interactive setup wizard chalata hai.
- `npm run campaign`: Terminal based campaign builder chalata hai.
- `npm start`: `node index.js` run karta hai, jo CLI ko call karta hai.
- `npm run dev`: Nodemon ke saath CLI/dev mode.
- `npm run web`: Web dashboard server start karta hai.
- `npm run web:dev`: Nodemon ke saath web server.
- `npm test`: Custom unit tests chalata hai.
- `npm run help`: Available commands print karta hai.

Important note: README mein `npm run cli` ka zikr hai, lekin `package.json` mein `cli` script defined nahi hai.

## 6. Configuration files

### `.env`

`.env` mein API keys aur system settings hoti hain. Is file ko private rakhna chahiye. Is mein usually yeh values hoti hain:

```env
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=...
PRIMARY_INDUSTRY=...
CAMPAIGN_STYLE=...
OUTPUT_LANGUAGE=...
DELAY_BETWEEN_SCRAPES=...
MAX_RETRIES=...
OUTPUT_FORMAT=...
DEFAULT_RESULT_LIMIT=...
```

Is overview mein `.env` ki actual values intentionally include nahi ki gayi, kyun ke API key sensitive hoti hai.

### `business-profile.json`

Yeh project ka business profile hai. Current profile ke mutabiq business:

- Business name: `ClientMarkaz`
- Business type: `Digital Solutions Agency`
- Owner: `M. Yasir`
- Default search query: `Private Schools Islamabad`
- Default location: `Rawalpindi`
- Campaign style: `balanced`
- Language setting: `english`

Business services ka focus:

- Website development
- Branding
- Marketing
- AI-powered solutions
- Dental clinics aur businesses ke liye websites
- Schools/academies ke liye LMS
- AI chatbot setup
- Logo/brand identity
- Social media content creation

Target industries:

- Dental Clinics
- Healthcare
- Private Schools
- Academies
- Tuition Centers
- Coaching Centers
- Educational Institutions
- Training Institutes
- Small Businesses
- Startups
- Restaurants
- Retail Stores
- Clothing Brands
- Beauty Salons
- Professional Services
- Local Businesses
- E-commerce Businesses

### `user-preferences.json`

Current preferences:

- Primary industry: `education`
- Campaign style: `balanced`
- Language: `english`
- Setup date: `2026-06-13`
- Version: `2.0.0`

## 7. Entry point: `index.js`

Root `index.js` ka kaam simple hai:

- `src/cli.js` se `main` import karta hai.
- Agar file direct run ho, to CLI start karta hai.
- Backward compatibility ke liye `src/scraper.js` export karta hai.

Matlab `node index.js` actually CLI mode start karta hai.

## 8. CLI system: `src/cli.js`

CLI command line se lead scraping run karne ke liye hai.

Supported arguments:

```bash
node index.js -q "Restaurant Islamabad" -l 20
node index.js -q "Dental Clinics" -l 20 -m "Website development service" -c "Book free consultation"
node index.js -q "Academy Rawalpindi" -l 10 -L english
```

Options:

- `-q` ya `--query`: Google Maps search query.
- `-l` ya `--length`: Kitnay results scrape karne hain. Max 100.
- `-m` ya `--marketing`: AI marketing content generation enable karta hai.
- `-c` ya `--cta`: Call to action text.
- `-L` ya `--language`: Language option.
- `-h` ya `--help`: Help message.

CLI ka flow:

1. Arguments parse hotay hain.
2. Business profile load hota hai.
3. `BusinessScraper` Google Maps scraping karta hai.
4. Results process/clean hotay hain.
5. `FileUtils.saveToFile` CSV aur JSON save karta hai.
6. Agar `-m` use hua ho to `MarketingAutomation` AI marketing templates generate karta hai.

## 9. Scraping logic: `src/scraper.js`

Yeh project ka sab se important module hai. Is mein `BusinessScraper` class hai.

Main methods:

- `init()`: Puppeteer browser start karta hai.
- `scrapeGoogleMaps(searchQuery, maxResults)`: Google Maps se data scrape karta hai.
- `scrollResults(page, maxResults)`: Google Maps result list scroll karta hai taake zyada cards load hon.
- `scrapeYellowPages(searchQuery, location)`: Yellow Pages scraping ka experimental/secondary method.
- `cleanPhoneNumber(phone)`: Phone number clean karta hai.
- `processResults()`: Results ko standard structure mein convert karta hai.
- `close()`: Browser close karta hai.

Google Maps extraction:

- Puppeteer headless browser open karta hai.
- URL banta hai: `https://www.google.com/maps/search/<query>`.
- Page load hota hai.
- Results scroll kiye jatay hain.
- DOM selector `.Nv2PK` se business cards find hotay hain.
- Har card se:
  - name
  - address
  - phone
  - rating
  - website
  - Google Maps reference link
  extract hota hai.

Deduplication:

Scraper `output/` folder ke puranay JSON files bhi scan karta hai. Is se:

- duplicate name skip hota hai
- duplicate phone suffix skip hota hai
- duplicate website skip hoti hai

Yeh achi feature hai kyun ke repeat campaigns mein same leads avoid hotay hain.

Important limitation:

- Google Maps ka DOM kabhi bhi change ho sakta hai. Ab scraper mein `.Nv2PK` ke saath multiple fallback selectors add kar diye gaye hain, lekin future Google UI changes phir bhi monitoring demand kar sakti hain.
- Phone cleaner ab Pakistan local format ke saath international aur landline-style numbers ko bhi better handle karta hai.

## 10. File handling: `src/fileUtils.js`

`FileUtils` data save/load aur phone format helpers provide karta hai.

Main features:

- `saveToFile(data, filename)`: Output folder mein CSV aur JSON save karta hai.
- `loadLeads(jsonFile)`: JSON leads load karta hai.
- `saveLeads(data, filename)`: Campaign leads CSV/JSON format mein save karta hai.
- `logActivity(activity)`: Marketing activity log karta hai.
- `formatPhoneNumber(phone)`: Pakistani phone format ko WhatsApp-friendly `92...` format mein convert karta hai.

Output files usually is tarah save hoti hain:

```text
output/<query>_leads_<date>.csv
output/<query>_leads_<date>.json
output/campaign_<name>_<timestamp>/campaign_info.json
output/campaign_<name>_<timestamp>/leads_with_intelligence.json
```

## 11. Business profile module: `src/businessProfile.js`

Yeh centralized configuration module hai. Project ke different parts ko business info isi se milti hai.

Main kaam:

- `business-profile.json` load karta hai.
- Defaults provide karta hai.
- Missing keys ko defaults se fill karta hai.
- Legacy `.env` vars se fallback support karta hai.
- Profile validation warnings generate karta hai.
- AI prompts ke liye flat business info object banata hai.

Yeh project ko hardcoded business data se bachata hai. Agar business name/service change karni ho to `business-profile.json` update karna enough hai.

## 12. OpenAI client: `src/openaiClient.js`

Yeh OpenAI API client ko centralize karta hai.

Features:

- `.env` se `OPENAI_API_KEY` load karta hai.
- Default model `gpt-4o-mini` hai.
- `OPENAI_BASE_URL` support karta hai, yani Azure/OpenRouter/local proxy jaisi custom endpoint use ho sakti hai.
- `getClient()`, `getModel()`, `isConfigured()` exports provide karta hai.

Important:

- Agar API key missing ho to AI features kaam nahi karenge.
- Scraping without AI phir bhi run ho sakti hai.

## 13. Marketing automation: `src/marketing.js`

`MarketingAutomation` generic marketing content generate karta hai.

Main features:

- Leads JSON load karta hai.
- OpenAI se WhatsApp content generate karta hai.
- Base template generate kar ke multiple leads par personalize kar sakta hai.
- Marketing templates CSV aur JSON mein save karta hai.
- Legacy methods include hain:
  - `sendWhatsApp`
  - `bulkOutreach`
  - `generateDailyReport`

Important note:

Actual email/WhatsApp sending simulated hai. Code console logs aur activity logs banata hai, lekin real email provider ya WhatsApp API integration active nahi hai.

## 14. Advanced AI marketing: `src/marketingAI.js`

Yeh module industry-specific AI outreach ke liye hai. Is mein Pakistani business context ka kaafi detailed data hardcoded hai.

Supported industries:

- restaurant
- automotive
- retail
- professional
- healthcare
- education
- realestate

Har industry ke liye:

- pain points
- solutions
- benefits
- local context
- urgency
- case study
- market size

AI output:

- Call pitch
- WhatsApp message

(B2B objections aur rebuttals generation features ko simplify aur remove kar diya gaya hai taake call script aur WhatsApp pitch generate karne par focus kiya jaye).

System prompt Pakistani B2B context use karta hai aur Roman Urdu mein outreach generate karne ko kehta hai.

Important behavior:

- Function arguments mein language option hota hai, lekin code aksar language ko force karke `english` set karta hai.
- Industry prompt ke andar phir bhi Roman Urdu output demand ki jati hai.
- Is liye actual pitch generation ka best use Roman Urdu call/WhatsApp scripts ke liye hai.

## 15. Lead scoring/intelligence: `src/leadIntelligence.js`

`LeadIntelligence` har lead ko score deta hai.

Score factors:

- Data completeness
- Business quality
- Digital presence
- Location value
- Industry potential
- Contactability

Weighted scoring:

- Data completeness: 20%
- Business quality: 25%
- Digital presence: 15%
- Location value: 15%
- Industry potential: 15%
- Contactability: 10%

Score categories:

- 85+: `A+ (Excellent)`
- 75-84: `A (High Quality)`
- 65-74: `B (Good)`
- 55-64: `C (Average)`
- below 55: `D (Low Score)`

Locations ke liye Pakistan cities ka score:

- Islamabad
- Karachi
- Lahore
- Rawalpindi
- Peshawar
- default

Important issue:

Priority bug fix ho chuka hai. Ab `scoreLeads()` har lead ke `intelligence` object mein `priority` field set karta hai:

- Score `85+`: `HIGH`
- Score `65-84`: `MEDIUM`
- Score `<65`: `LOW`

Is se `getLeadsByPriority(scoredLeads, 'HIGH')`, campaign builder aur priority exports properly kaam kar sakte hain.

## 16. Campaign builder: `src/campaign.js`

Yeh terminal based interactive campaign builder hai.

Run:

```bash
npm run campaign
```

Flow:

1. Campaign type select hota hai:
   - lead generation
   - market research
   - competitor analysis
   - follow-up
2. Industry select hoti hai.
3. Location aur search query set hoti hai.
4. Number of leads set hota hai.
5. Campaign name aur goal set hota hai.
6. Service description aur content style set hota hai.
7. WhatsApp template type select hota hai.
8. Scraping run hoti hai.
9. Lead scoring hoti hai.
10. AI content generate hota hai.
11. Output campaign folder mein save hota hai.

Output files:

- `leads_with_intelligence.csv`
- `leads_with_intelligence.json`
- `priority_leads.csv`
- `priority_whatsapp_templates.txt`
- `medium_whatsapp_templates.txt`
- `intelligence_report_<date>.json`
- `campaign_info.json`

Priority leads ka logic ab `intelligence.priority` field use karta hai, aur yeh field scoring ke waqt set hoti hai. Is liye `priority_leads.csv` aur high/medium priority content generation zyada reliable ho gaye hain.

## 17. Setup wizard: `src/setup.js`

Run:

```bash
npm run setup
```

Setup wizard yeh cheezen leta hai:

- OpenAI API key
- Optional OpenAI base URL
- Business name/type/phone/website
- Business description
- Value propositions
- Target industries
- Owner/contact info
- Default search query
- Default location
- Primary industry
- Campaign style

Phir yeh files save karta hai:

- `.env`
- `business-profile.json`
- `user-preferences.json`

Important note:

`runSampleCampaign()` naam ka method sample campaign ka progress dikhata hai, lekin actual scraping run nahi karta. Yeh demo/progress simulation jaisa hai.

## 18. Web dashboard: `src/web/server.js`

Run:

```bash
npm run web
```

Default URL:

```text
http://localhost:3000
```

Server Express par based hai. Static frontend `src/web/public/` se serve hota hai.

Web dashboard features:

- Dashboard overview (saath mein "Today's Follow-up Calendar" widget jo aaj ke scheduled calls aur follow-ups dikhata hai)
- Collapsible Sidebar navigation (desktop view par default icons show hotay hain, mouse hover par full labels panel expand hota hai layout jump ko avoid karte hue)
- Lead Stage Pipeline (Trello-style drag & drop Kanban board: stages include: New, In Progress, Proposal Sent, Negotiation, Closed Won, Closed Lost)
- Lead details modal (jahan Call script, WhatsApp preview, notes history logger, aur next follow-up scheduler input settings available hain)
- Background follow-up checking interval loop jo auto-voice reminder call alerts generate karta hai ("Is client [naam] ko aaj [time] call karni hai.") via Web Speech API
- Lead status updates aur real-time saves
- AI pitch generation per lead
- Analytics dashboard
- Real-time campaign progress via Server-Sent Events (SSE)
- vCard export endpoints
- Health check API

## 19. Web API endpoints

Important API routes:

```text
GET  /api/health
GET  /api/events
GET  /api/dashboard
GET  /api/campaigns
GET  /api/campaigns/:id
GET  /api/campaigns/:id/leads
POST /api/campaigns
GET  /api/campaigns/:id/status
POST /api/leads/status
POST /api/leads/update
GET  /api/leads/followups
POST /api/leads/generate-pitch
GET  /api/analytics
GET  /api/leads/:campaignId/:leadIndex/vcard
GET  /api/campaigns/:id/export/vcard
```

Campaign creation API background mein scraping run karta hai:

1. Campaign active map mein store hoti hai.
2. SSE se start/progress event bheja jata hai.
3. Google Maps scrape hota hai.
4. Leads score hoti hain.
5. `output/<campaignId>/campaign_info.json` aur `leads_with_intelligence.json` save hoti hain.
6. Completion event frontend ko milta hai.

Important note:

Web campaign creation abhi automatic AI pitch har lead ke liye generate nahi karta. Lead detail modal mein user manually service text de kar `Generate Pitch` button se per-lead AI pitch generate karta hai.

## 20. Frontend files

### `src/web/public/index.html`

Main dashboard UI structure:

- Header
- Sidebar navigation
- Bottom mobile navigation
- Dashboard section
- Campaigns section
- Leads section
- Analytics section
- New campaign modal
- Campaign detail modal
- Lead detail modal
- Campaign progress modal
- Marketing content modal

### `src/web/public/js/api.js`

Frontend API client. Is mein:

- backend calls
- error handling
- formatting helpers
- score category/color helpers

### `src/web/public/js/components.js`

Reusable frontend utilities:

- notification system
- modal manager
- simple charts
- data table
- progress manager

### `src/web/public/js/dashboard.js`

Main dashboard app logic:

- theme toggle
- sidebar/mobile nav
- SSE real-time updates
- dashboard data loading
- campaigns loading/rendering
- leads loading/rendering
- search/filter
- analytics render
- lead detail modal
- pitch generation
- WhatsApp/copy actions

### CSS files

- `dashboard.css`: Layout, theme, dashboard styling.
- `components.css`: Components, modals, tables, notifications etc.

## 21. Output folder mein currently kya hai

Current `output/` folder mein 7 saved campaigns nazar aa rahi hain:

1. `campaign_Academies_1781358712690`
   - Name: Academies
   - Industry: education
   - Search query: Academy
   - Total leads: 7
   - High quality leads: 2
   - Average score: 60

2. `campaign_Academies_1781358872676`
   - Name: Academies
   - Industry: education
   - Search query: Academy
   - Total leads: 7
   - High quality leads: 2
   - Average score: 60

3. `campaign_academies_1781359141260`
   - Name: academies
   - Industry: education
   - Search query: Academy
   - Total leads: 20
   - High quality leads: 14
   - Average score: 71

4. `campaign_academies_1781364281349`
   - Name: academies
   - Industry: education
   - Search query: Academy
   - Total leads: 2
   - High quality leads: 2
   - Average score: 70

5. `campaign_academies_1781372248197`
   - Name: academies
   - Industry: education
   - Search query: Academy
   - Total leads: 1
   - High quality leads: 1
   - Average score: 81

6. `campaign_academies_1781373147720`
   - Name: academies
   - Industry: education
   - Search query: Academy
   - Total leads: 27
   - High quality leads: 16
   - Average score: 66

7. `campaign_dental_Clinic_1781373869333`
   - Name: dental Clinic
   - Industry: healthcare
   - Search query: Dental Clinics
   - Total leads: 20
   - High quality leads: 15
   - Average score: 70

Total saved leads across these campaign summaries: 84.

## 22. Tests: `test.js`

Project mein custom test runner hai. Run:

```bash
npm test
```

Tests cover karte hain:

- OpenAI client config
- Business profile module
- FileUtils helpers
- LeadIntelligence scoring
- Scraper processing
- CLI argument parsing
- Marketing template personalization
- MarketingAI content generation

Important:

Yeh Jest/Mocha nahi use karta. `test.js` mein apna lightweight test runner implemented hai.

## 23. Documentation files

### `README.md`

General project intro, installation, setup, CLI usage, web dashboard, features, limitations aur roadmap explain karta hai.

### `docs/USER_GUIDE.md`

User guide hai jo setup, dashboard, campaign creation, leads management, vCard export aur troubleshooting explain karta hai.

### `DISCLAIMER.md`

Legal/ethical disclaimer:

- Public data only
- Rate limits respect karna
- Spam ke liye use na karna
- Privacy/data protection laws follow karna
- Google/OpenAI terms ka khayal rakhna

### `CONTRIBUTING.md`

Contribution guide:

- Bug fixes
- Feature improvements
- Documentation
- Testing
- Security/accessibility improvements

Important note:

README kuch docs ka link deta hai jo current workspace mein nazar nahi aaye:

- `docs/WEB_DASHBOARD_GUIDE.md`
- `docs/DEPLOYMENT_GUIDE.md`
- `docs/API.md`

Current `docs/` folder mein sirf `USER_GUIDE.md` available hai.

## 24. Legal aur ethical angle

Yeh project scraping aur outreach dono karta hai, is liye responsible use zaroori hai.

Recommended practices:

- Sirf public business data use karein.
- Google Maps ya target websites ko overload na karein.
- Reasonable delays use karein.
- Mass spam na karein.
- Opt-out requests respect karein.
- Sensitive/personal data secure rakhein.
- Local anti-spam aur privacy laws follow karein.
- Marketing claims truthful hon.

## 25. Current limitations aur issues

Project ka idea strong hai, lekin kuch technical limitations hain:

1. Google Maps selector fragile hai.
   - Scraper mein ab multiple fallback selectors hain, lekin Google Maps ka DOM future mein change ho to extraction phir bhi update karni par sakti hai.

2. Email finding basic level par implemented hai.
   - Website available ho to homepage/contact/about/support pages scan hotay hain.
   - Lekin advanced discovery, DNS validation, contact form detection, ya social profile scanning abhi missing hai.

3. Priority field bug fix ho chuka hai.
   - Ab `LeadIntelligence` score/category ke saath `HIGH/MEDIUM/LOW` priority bhi set karta hai.

4. Phone validation improve ho chuki hai.
   - Pakistan local numbers ke saath international aur landline numbers bhi handle hotay hain.
   - Dedicated phone parsing library, jaise `libphonenumber-js`, future mein aur accurate validation de sakti hai.

5. README aur actual scripts mein mismatch hai.
   - README `npm run cli` mention karta hai, lekin script nahi hai.

6. README mein kuch docs referenced hain jo repo mein missing hain.

7. `sqlite3` dependency installed hai, lekin current app files mein database actively use nahi ho raha.

8. Web campaign automatic AI content generation nahi karta.
   - Web flow lead scoring save karta hai.
   - Pitch per lead manually generate hoti hai.

9. Setup sample campaign actual scraping nahi chalata.
   - Sirf progress simulation show karta hai.

10. Logs/source comments mein kuch emoji encoding mojibake nazar aati hai.
    - Functionality par zaroori nahi asar ho, lekin console/readability affected hai.

## 26. Project ka data flow end-to-end

### CLI flow

```text
User command
  -> src/cli.js
  -> src/scraper.js
  -> Google Maps scrape
  -> processResults()
  -> src/fileUtils.js
  -> output CSV/JSON
  -> optional src/marketing.js
  -> AI marketing templates
```

### Terminal campaign flow

```text
npm run campaign
  -> src/campaign.js
  -> interactive questions
  -> src/scraper.js
  -> src/leadIntelligence.js
  -> src/marketingAI.js
  -> output/campaign_<name>_<timestamp>/
```

### Web dashboard flow

```text
npm run web
  -> src/web/server.js
  -> serves frontend from src/web/public
  -> frontend calls /api/*
  -> backend reads/writes output/
  -> campaign creation runs scraper in background
  -> SSE sends progress to browser
```

## 27. Is project ko run karne ka practical tareeqa

Fresh setup:

```bash
npm install
npm run setup
```

Web dashboard:

```bash
npm run web
```

Browser:

```text
http://localhost:3000
```

CLI scraping:

```bash
node index.js -q "Dental Clinics Rawalpindi" -l 20
```

CLI scraping plus marketing template:

```bash
node index.js -q "Private Schools Islamabad" -l 20 -m "LMS aur school website development service" -c "Free consultation book karein"
```

Interactive campaign:

```bash
npm run campaign
```

Tests:

```bash
npm test
```

## 28. Project ka best use case

ClientMarkaz jaise digital solutions agency ke liye yeh project useful hai:

- Schools/academies ki list banana
- Dental clinics ki list banana
- Local businesses jinke paas weak/no website ho un ko target karna
- Business ko score karna
- Roman Urdu call pitch generate karna
- WhatsApp message generate karna
- Campaign results dashboard mein track karna

Example strategy:

1. Search query: `Private Schools Rawalpindi`
2. Leads scrape karein.
3. Score 65+ wale leads filter karein.
4. Har lead ke detail modal mein service likhein:
   `School LMS, admission website, parent portal aur AI chatbot setup`
5. Generate Pitch click karein.
6. Call script aur WhatsApp message preview check/copy karein.
7. Modal mein conversation update notes logs compile karein aur call status check/schedule update karein.
8. Sidebar navigation se Kanban Board (Pipeline) par jayein aur lead ko dynamic stages (e.g., In Progress, Proposal Sent, Negotiation, Closed Won) par drag & drop kar ke update karein.
9. Dashboard check followups widget aur voice speech notifications ke daily follow-up callbacks manage karein.

## 29. Suggested improvements

Project ko aur strong banane ke liye yeh improvements useful hon gi:

1. Lead priority system ko aur enhance karein:
   - Basic `HIGH/MEDIUM/LOW` priority add ho chuki hai.
   - Next step: priority ko industry, city, website availability aur contactability ke saath aur smart banaya ja sakta hai.

2. README scripts fix karein:
   - Ya `npm run cli` add karein
   - Ya README se remove karein

3. Missing docs add karein:
   - Web dashboard guide
   - Deployment guide
   - API docs

4. Email discovery ko advanced banayein.
   - Basic website scan add ho chuka hai.
   - Next step: deeper contact page crawling, DNS validation, social links aur confidence score.

5. Phone validation ko dedicated library se aur accurate banayein.
   - Basic international handling add ho chuki hai.
   - Next step: country detection aur `libphonenumber-js` style validation.

6. Web campaign mein optional automatic AI content generation add karein.

7. Google Maps scraping selectors ko continuously monitor karein.
   - Multiple fallback selectors add ho chuke hain.
   - Next step: fallback extraction ko screenshots/debug dumps ke saath aur observable banana.

8. Output ko database mein store karne ka option add karein.

9. Campaign duplication aur history management improve karein.

10. Real WhatsApp Business API/email provider integration add karein, with consent/compliance safeguards.

## 30. Final summary

Yeh project ek complete AI-assisted lead generation system hai. Is mein scraping, lead scoring, campaign management, web dashboard, AI outreach generation aur export features included hain. Current business profile ClientMarkaz ke digital agency use case ke liye configured hai, aur existing output mein education/healthcare campaigns saved hain.

Project ka core idea kaafi practical hai: local businesses ko find karo, un ka data structure karo, AI se pitch banao, aur outreach process ko organized rakho. Recent fixes ke baad lead priority, basic email discovery, phone validation aur scraper fallback selectors improve ho chuke hain. Ab sab se important next risks Google Maps DOM changes, outreach compliance, aur production-grade data storage hain.
