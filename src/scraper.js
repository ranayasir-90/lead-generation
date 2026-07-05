const puppeteer = require("puppeteer");

const GOOGLE_MAPS_CARD_SELECTORS = [
  ".Nv2PK",
  'div[role="article"]',
  'div[jsaction*="mouseover:pane"]',
  'div[jsaction*="pane.place"]'
];

const GOOGLE_MAPS_CARD_COUNT_SELECTOR = GOOGLE_MAPS_CARD_SELECTORS.join(",");


class BusinessScraper {
  constructor() {
    this.browser = null;
    this.results = [];
    this.delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: true, // Set true untuk production
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    console.log("Browser initialized");
  }

  async getAllExistingLeads() {
    const existingLeads = {
      names: new Set(),
      phones: new Set(),
      websites: new Set()
    };

    try {
      const db = require('./db');
      const campaigns = await db.getCampaigns();
      
      for (const campaign of campaigns) {
        const leads = await db.getLeads(campaign.id);
        for (const lead of leads) {
          if (lead.name) {
            existingLeads.names.add(lead.name.toLowerCase().trim());
          }
          if (lead.phone) {
            const clean = lead.phone.replace(/\D/g, '');
            if (clean && clean.length >= 9) {
              existingLeads.phones.add(clean.substring(clean.length - 9));
            }
          }
          if (lead.website && lead.website !== 'N/A' && lead.website.trim() !== '') {
            existingLeads.websites.add(lead.website.toLowerCase().trim());
          }
        }
      }
    } catch (error) {
      console.error('Error loading existing leads from Supabase for deduplication:', error.message);
    }

    return existingLeads;
  }

  async scrapeGoogleMaps(searchQuery, maxResults = 50) {
    if (!this.browser) await this.init();

    const page = await this.browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    try {
      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(
        searchQuery
      )}`;
      console.log(`Searching: ${searchUrl}`);

      await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 60000 });
      await this.delay(3000);
      await page.waitForFunction(
        (selectors) => selectors.some((selector) => document.querySelector(selector)),
        { timeout: 10000 },
        GOOGLE_MAPS_CARD_SELECTORS
      ).catch(() => {
        console.log("No known Google Maps result cards detected yet; continuing with fallback extraction.");
      });

      const existing = await this.getAllExistingLeads();
      console.log(`Loaded ${existing.names.size} existing unique names, ${existing.phones.size} phones, and ${existing.websites.size} websites from history for deduplication.`);

      let uniqueNewLeads = [];
      let targetResults = maxResults;
      let noChangeAttempts = 0;
      let lastExtractedCount = 0;
      const maxScrollAttempts = 15;
      let attempt = 0;

      while (uniqueNewLeads.length < maxResults && attempt < maxScrollAttempts) {
        attempt++;
        console.log(`\n🔄 Scrape Attempt ${attempt}/${maxScrollAttempts} (Current unique new leads: ${uniqueNewLeads.length}/${maxResults}, target scroll size: ${targetResults})`);

        // Scroll untuk load lebih banyak results
        await this.scrollResults(page, targetResults);

        // Extract business data directly from the list without clicking
        const businesses = await page.evaluate((cardSelectors) => {
          const results = [];

          const getBusinessCards = () => {
            const cards = [];
            const seen = new Set();

            for (const selector of cardSelectors) {
              document.querySelectorAll(selector).forEach((card) => {
                if (!seen.has(card)) {
                  seen.add(card);
                  cards.push(card);
                }
              });
            }

            if (cards.length > 0) return cards;

            document.querySelectorAll('a[href*="/maps/place/"], a[href*="google.com/maps/place"]').forEach((link) => {
              const card = link.closest('div[role="article"], div[jsaction], div');
              if (card && !seen.has(card)) {
                seen.add(card);
                cards.push(card);
              }
            });

            return cards;
          };

          const businessCards = getBusinessCards();

          const isLikelyAddress = (text) => {
            if (!text) return false;
            const t = text.toLowerCase().trim();

            if (t.length < 3) return false;

            if (t.match(/^\d\.\d/) || t.includes('(') || t.includes(')')) {
              const hasAddressKeyword = t.includes('street') || t.includes('road') || t.includes('sector') || t.includes('house') || t.includes('plot');
              if (!hasAddressKeyword) return false;
            }

            if (t.includes('open') || t.includes('closed') || t.includes('opens') || t.includes('closes') || t.includes('hours') || t.includes('day')) {
              return false;
            }

            if (t.match(/\d{5,}/) && (t.includes('+') || t.startsWith('0') || t.includes('-'))) {
              const cleanDigits = t.replace(/\D/g, '');
              if (cleanDigits.length >= 8 && !t.includes('street') && !t.includes('road') && !t.includes('sector') && !t.includes('plot') && !t.includes('house')) {
                return false;
              }
            }

            if (t === '$$' || t === '$$$' || t === '$$$$' || t.includes('rp')) return false;

            const addressKeywords = [
              'street', 'st.', 'road', 'rd.', 'no.', 'no ', 'sector', 'phase', 'plot', 'house', 'h#',
              'flat', 'bazar', 'market', 'markaz', 'town', 'colony', 'chowk', 'avenue', 'ave', 'block', 'building',
              'mall', 'plaza', 'center', 'centre', 'floor', 'suite', 'city', 'district', 'province', 'state',
              'g-', 'i-', 'f-', 'h-', 'e-', 'k-', 'dha', 'bahria', 'gulberg', 'johar', 'cantt', 'main', 'near',
              'opposite', 'opp', 'beside', 'behind', 'islamabad', 'rawalpindi', 'lahore', 'karachi', 'pakistan'
            ];

            for (const keyword of addressKeywords) {
              if (t.includes(keyword)) return true;
            }

            if (t.length > 15 && t.includes(' ')) return true;

            return false;
          };

          for (let i = 0; i < businessCards.length; i++) {
            const card = businessCards[i];

            // Extract business name
            const nameElement = card.querySelector('.qBF1Pd.fontHeadlineSmall, .qBF1Pd, .fontHeadlineSmall, [role="heading"]');
            const nameFromLink = card.querySelector('a[href*="/maps/place/"], a[href*="google.com/maps/place"]')?.getAttribute('aria-label') || '';
            const name = nameElement ? nameElement.textContent.trim() : nameFromLink.trim();

            // Extract address
            let address = '';
            const allSpans = card.querySelectorAll('span');
            for (const span of allSpans) {
              const text = span.textContent.trim();
              if (isLikelyAddress(text)) {
                address = text.replace(/^[·•]\s*/, '');
                break;
              }
            }

            // Extract phone
            let phone = '';
            for (const span of allSpans) {
              const text = span.textContent.trim();
              if (text.match(/\d{3,}/) && (text.includes('+') || text.startsWith('0') || text.includes('-'))) {
                phone = text.replace(/^[·•]\s*/, '');
                break;
              }
            }

            // Extract rating
            let rating = '';
            const ratingElement = card.querySelector('.MW4etd, span[aria-label*="stars"], span[aria-label*="star"]');
            if (ratingElement) {
              const ratingText = ratingElement.textContent.trim() || ratingElement.getAttribute('aria-label') || '';
              const ratingMatch = ratingText.match(/\d+(\.\d+)?/);
              rating = ratingMatch ? ratingMatch[0] : ratingText;
            }

            // Extract website
            let website = '';
            let referenceLink = '';
            const websiteLinks = card.querySelectorAll('a');
            for (const link of websiteLinks) {
              const href = link.href;
              if (!href) continue;

              if (href.includes('google.com/maps') || href.includes('maps.google.com')) {
                referenceLink = href;
                continue;
              }

              const hrefLower = href.toLowerCase();
              const isSocialMedia = hrefLower.includes('facebook.com') ||
                hrefLower.includes('instagram.com') ||
                hrefLower.includes('twitter.com') ||
                hrefLower.includes('x.com') ||
                hrefLower.includes('linkedin.com') ||
                hrefLower.includes('youtube.com') ||
                hrefLower.includes('tiktok.com') ||
                hrefLower.includes('pinterest.com') ||
                hrefLower.includes('fb.me') ||
                hrefLower.includes('fb.com') ||
                hrefLower.includes('t.co');

              if (isSocialMedia) continue;

              // Check if it's a Google redirect link and clean it
              let targetUrl = href;
              if (hrefLower.includes('google.com/url')) {
                try {
                  const urlParams = new URLSearchParams(href.split('?')[1]);
                  targetUrl = urlParams.get('q') || href;
                } catch (e) {
                  // ignore
                }
              }

              const targetUrlLower = targetUrl.toLowerCase();
              const hasDomainExtension = targetUrlLower.includes('.com') ||
                targetUrlLower.includes('.net') ||
                targetUrlLower.includes('.org') ||
                targetUrlLower.includes('.edu') ||
                targetUrlLower.includes('.gov') ||
                targetUrlLower.includes('.pk') ||
                targetUrlLower.includes('.co') ||
                targetUrlLower.includes('.biz') ||
                targetUrlLower.includes('.info') ||
                targetUrlLower.includes('.io') ||
                targetUrlLower.includes('.ai') ||
                targetUrlLower.includes('.me') ||
                targetUrlLower.includes('.app');

              if (targetUrl && targetUrl.startsWith('http') && hasDomainExtension) {
                website = targetUrl;
              }
            }

            if (name) {
              results.push({
                name,
                address: address || 'Islamabad, Pakistan',
                phone,
                rating,
                website,
                referenceLink,
                hasWebsite: !!website
              });
            }
          }

          return results;
        }, GOOGLE_MAPS_CARD_SELECTORS);

        // Filter duplicates and collect unique new leads
        uniqueNewLeads = [];
        for (const biz of businesses) {
          const nameLower = biz.name.toLowerCase().trim();

          // 1. Local duplicate check
          const isLocalDuplicate = uniqueNewLeads.some(
            (b) => b.name.toLowerCase().trim() === nameLower
          );
          if (isLocalDuplicate) continue;

          // 2. Global name check
          if (existing.names.has(nameLower)) {
            continue;
          }

          // 3. Global phone check (matching last 9 digits)
          if (biz.phone) {
            const cleanPhone = this.cleanPhoneNumber(biz.phone);
            const cleanDigits = cleanPhone.replace(/\D/g, '');
            if (cleanDigits && cleanDigits.length >= 9) {
              const phoneSuffix = cleanDigits.substring(cleanDigits.length - 9);
              if (existing.phones.has(phoneSuffix)) {
                continue;
              }
            }
          }

          // 4. Global website check
          if (biz.website && biz.website !== 'N/A' && biz.website.trim() !== '') {
            const webLower = biz.website.toLowerCase().trim();
            if (existing.websites.has(webLower)) {
              continue;
            }
          }

          // Clean phone number before returning
          uniqueNewLeads.push({
            ...biz,
            phone: this.cleanPhoneNumber(biz.phone)
          });
        }

        console.log(`Found ${uniqueNewLeads.length} unique new leads out of ${businesses.length} total visible items.`);

        if (uniqueNewLeads.length >= maxResults) {
          console.log(`Successfully found target of ${maxResults} unique new leads!`);
          break;
        }

        // If the total number of visible elements did not increase compared to last loop, it means we reached the end of Google Maps
        if (businesses.length === lastExtractedCount) {
          noChangeAttempts++;
          console.log(`No new items loaded from scroll. Attempt ${noChangeAttempts}/5`);
          if (noChangeAttempts >= 5) {
            console.log("Reached end of search results feed, stopping.");
            break;
          }
        } else {
          noChangeAttempts = 0;
        }

        lastExtractedCount = businesses.length;
        targetResults += Math.max(maxResults, 20);

        if (targetResults > 500) {
          console.log("Reached maximum search limit of 500 visible items, stopping.");
          break;
        }
      }

      const finalLeads = uniqueNewLeads.slice(0, maxResults);
      console.log(`Successfully filtered down to ${finalLeads.length} unique new leads.`);

      // Phase 2: Click each card to extract website from detail panel
      if (finalLeads.length > 0) {
        await this.enrichLeadsWithWebsites(page, finalLeads);
      }

      this.results = [...this.results, ...finalLeads];

      await page.close();
      return finalLeads;
    } catch (error) {
      console.error("Error scraping Google Maps:", error);
      if (!page.isClosed()) {
        await page.close();
      }
      return [];
    }
  }

  async scrollResults(page, maxResults = 20) {
    console.log(`Scrolling to load more results (target: ${maxResults})...`);

    try {
      // Try multiple scroll containers
      const scrollSelectors = [
        '[role="feed"]',
        '.m6QErb.DxyBCb.kA9KIf.dS8AEf.XiKgde.ecceSd',
        '[role="main"]',
        '.section-layout',
        '.section-scrollbox',
        '.scrollable-y',
        '[data-role="region"]'
      ];

      let scrollContainer = null;
      for (const selector of scrollSelectors) {
        scrollContainer = await page.$(selector);
        if (scrollContainer) {
          console.log(`Found scroll container: ${selector}`);
          break;
        }
      }

      if (!scrollContainer) {
        console.log("No scroll container found, trying alternative method");
        // Try scrolling the page itself
        for (let i = 0; i < 10; i++) {
          await page.evaluate(() => {
            window.scrollBy(0, 1000);
          });
          await this.delay(2000);
          console.log(`Page scroll ${i + 1}/10`);
        }
        return;
      }

      // Scroll until we reach maxResults or can't load more
      let previousCount = await page.evaluate((selector) => {
        return document.querySelectorAll(selector).length;
      }, GOOGLE_MAPS_CARD_COUNT_SELECTOR);
      let noChangeCount = 0;
      const maxScrollAttempts = 50; // Prevent infinite scrolling

      for (let i = 0; i < maxScrollAttempts; i++) {
        // Scroll up slightly first
        await page.evaluate((container) => {
          container.scrollTop = Math.max(0, container.scrollTop - 200);
        }, scrollContainer);

        await this.delay(100);

        // Scroll to the bottom
        await page.evaluate((container) => {
          container.scrollTop = container.scrollHeight;
        }, scrollContainer);

        await this.delay(2000);

        // Check current results count
        const resultCount = await page.evaluate((selector) => {
          return document.querySelectorAll(selector).length;
        }, GOOGLE_MAPS_CARD_COUNT_SELECTOR);

        console.log(`Scroll ${i + 1}/${maxScrollAttempts} - Current results: ${resultCount}`);

        // If we've reached target, stop
        if (resultCount >= maxResults) {
          console.log(`Reached target of ${maxResults} results (actual: ${resultCount}), stopping scroll`);
          break;
        }

        // If no new results after 3 attempts, stop
        if (resultCount === previousCount) {
          noChangeCount++;
          if (noChangeCount >= 3) {
            console.log(`No new results after ${noChangeCount} attempts, stopping scroll`);
            break;
          }
        } else {
          noChangeCount = 0;
        }

        previousCount = resultCount;
      }
    } catch (error) {
      console.log("Scroll completed with minor issues:", error.message);
    }
  }

  /**
   * Clicks each business card to open its detail panel and extract the website URL.
   * Google Maps only shows website links in the detail view, not in list cards.
   */
  async enrichLeadsWithWebsites(page, leads) {
    console.log(`\n🌐 Enriching ${leads.length} leads with website data from detail panels...`);

    let enrichedCount = 0;
    let alreadyHadWebsite = 0;

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];

      // Skip if lead already has a valid website
      if (lead.website && lead.website.trim() !== '' && lead.website !== 'N/A') {
        alreadyHadWebsite++;
        enrichedCount++;
        continue;
      }

      try {
        console.log(`  🔍 [${i + 1}/${leads.length}] Clicking "${lead.name}" for website...`);

        // Find the matching card by name and click it
        const clicked = await page.evaluate((targetName, cardSelectors) => {
          const cards = [];
          const seen = new Set();
          for (const selector of cardSelectors) {
            document.querySelectorAll(selector).forEach(card => {
              if (!seen.has(card)) {
                seen.add(card);
                cards.push(card);
              }
            });
          }

          for (const card of cards) {
            const nameEl = card.querySelector(
              '.qBF1Pd.fontHeadlineSmall, .qBF1Pd, .fontHeadlineSmall, [role="heading"]'
            );
            const ariaLabel =
              card.querySelector('a[aria-label]')?.getAttribute('aria-label') || '';
            const cardName = nameEl ? nameEl.textContent.trim() : ariaLabel.trim();

            if (cardName === targetName) {
              const clickable =
                card.querySelector('a[href*="/maps/place/"]') || nameEl || card;
              clickable.click();
              return true;
            }
          }
          return false;
        }, lead.name, GOOGLE_MAPS_CARD_SELECTORS);

        if (!clicked) {
          console.log(`    ⚠️  Card not found, skipping`);
          continue;
        }

        // Wait for detail panel to load
        await this.delay(3000);

        // Extract website (and phone) from the detail panel
        const details = await page.evaluate(() => {
          let website = '';
          let phone = '';

          // --- Website ---
          // Primary: data-item-id="authority" is Google's internal attribute for website links
          const authorityEl = document.querySelector('a[data-item-id="authority"]');
          if (authorityEl) {
            let href = authorityEl.href || '';
            // Unwrap Google redirect URLs
            if (href.includes('google.com/url')) {
              try {
                const params = new URLSearchParams(href.split('?')[1]);
                href = params.get('q') || href;
              } catch (_) { /* ignore */ }
            }
            if (href && href.startsWith('http') && !href.includes('google.com/maps')) {
              website = href;
            }
          }

          // Fallback: aria-label containing "website"
          if (!website) {
            const allLinks = document.querySelectorAll('a[aria-label]');
            for (const link of allLinks) {
              const label = (link.getAttribute('aria-label') || '').toLowerCase();
              if (label.includes('website') || label.includes('web site')) {
                let href = link.href || '';
                if (href.includes('google.com/url')) {
                  try {
                    const params = new URLSearchParams(href.split('?')[1]);
                    href = params.get('q') || href;
                  } catch (_) { /* ignore */ }
                }
                if (href && href.startsWith('http') && !href.includes('google.com/maps')) {
                  website = href;
                  break;
                }
              }
            }
          }

          // --- Phone (bonus: extract if not found from list) ---
          const phoneEl = document.querySelector(
            'button[data-item-id^="phone:tel:"], a[data-item-id^="phone:tel:"]'
          );
          if (phoneEl) {
            const itemId = phoneEl.getAttribute('data-item-id') || '';
            const match = itemId.match(/phone:tel:(.+)/);
            if (match) phone = match[1];
          }

          return { website, phone };
        });

        if (details.website) {
          lead.website = details.website;
          lead.hasWebsite = true;
          enrichedCount++;
          console.log(`    ✅ Website: ${details.website}`);
        } else {
          console.log(`    ❌ No website listed`);
        }

        // Fill in phone if it was missing from the list view
        if (details.phone && !lead.phone) {
          lead.phone = this.cleanPhoneNumber(details.phone);
          console.log(`    📞 Phone: ${lead.phone}`);
        }

        // Navigate back to the list view
        const wentBack = await page.evaluate(() => {
          const backBtn = document.querySelector(
            'button[aria-label="Back"], button[jsaction*="pane.action.back"]'
          );
          if (backBtn) { backBtn.click(); return true; }
          return false;
        });

        if (!wentBack) {
          await page.goBack().catch(() => {});
        }

        // Wait for list view to re-render
        await this.delay(2000);

      } catch (error) {
        console.log(`    ⚠️  Error: ${error.message}`);
        // Attempt recovery: go back to list
        try {
          await page.evaluate(() => {
            const b = document.querySelector('button[aria-label="Back"]');
            if (b) b.click();
          });
          await this.delay(1500);
        } catch (_) { /* ignore */ }
      }
    }

    if (alreadyHadWebsite > 0) {
      console.log(`  ℹ️  ${alreadyHadWebsite} leads already had websites from list view`);
    }
    console.log(`🌐 Enrichment complete: ${enrichedCount}/${leads.length} leads have websites\n`);
    return leads;
  }

  async scrapeYellowPages(searchQuery, location = "Islamabad") {
    if (!this.browser) await this.init();

    const page = await this.browser.newPage();

    try {
      // Example for business directories in Pakistan
      const searchUrl = `https://www.yellowpages.com.pk/search?q=${encodeURIComponent(
        searchQuery
      )}&location=${encodeURIComponent(location)}`;
      console.log(`Searching Yellow Pages: ${searchUrl}`);

      await page.goto(searchUrl, { waitUntil: "networkidle2" });
      await this.delay(2000);

      const businesses = await page.evaluate(() => {
        const results = [];
        const businessElements = document.querySelectorAll(
          ".listing-item, .business-item"
        );

        businessElements.forEach((element) => {
          const nameElement = element.querySelector(
            "h3, .business-name, .listing-name"
          );
          const addressElement = element.querySelector(
            ".address, .business-address"
          );
          const phoneElement = element.querySelector(".phone, .business-phone");

          const business = {
            name: nameElement?.textContent?.trim() || "",
            address: addressElement?.textContent?.trim() || "",
            phone: phoneElement?.textContent?.trim() || "",
            source: "YellowPages",
          };

          if (business.name && business.address) {
            results.push(business);
          }
        });

        return results;
      });

      console.log(`Found ${businesses.length} businesses from Yellow Pages`);
      this.results = [...this.results, ...businesses];

      await page.close();
      return businesses;
    } catch (error) {
      console.error("Error scraping Yellow Pages:", error);
      await page.close();
      return [];
    }
  }

  cleanPhoneNumber(phone) {
    if (!phone) return "";

    const raw = String(phone)
      .trim()
      .replace(/(?:ext\.?|extension|x)\s*\d+$/i, "");
    const startsWithPlus = raw.startsWith("+");
    let digits = raw.replace(/\D/g, "");

    if (!digits || digits.length < 7 || digits.length > 15) {
      return "";
    }

    if (digits.startsWith("0092")) {
      return "0" + digits.substring(4);
    }

    if (digits.startsWith("00")) {
      const internationalDigits = digits.substring(2);
      return internationalDigits.length >= 7 ? `+${internationalDigits}` : "";
    }

    // Keep Pakistani numbers in local format for existing outreach helpers.
    if (digits.startsWith("92") && digits.length >= 11 && digits.length <= 12) {
      return "0" + digits.substring(2);
    }

    if (startsWithPlus) {
      return `+${digits}`;
    }

    return digits;
  }


  normalizeWebsiteUrl(website) {
    if (!website || website === "N/A") return "";

    const trimmed = String(website).trim();
    if (!trimmed) return "";

    try {
      const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      const url = new URL(withProtocol);
      if (!url.hostname.includes(".")) return "";
      return url.toString();
    } catch {
      return "";
    }
  }


  async processResults() {
    console.log("Processing and cleaning results...");

    const processedResults = this.results.map((business, index) => {
      const cleanPhone = this.cleanPhoneNumber(business.phone);

      return {
        id: index + 1,
        name: business.name,
        address: business.address,
        phone: cleanPhone,
        website: business.website || "",
        referenceLink: business.referenceLink || "",
        rating: business.rating || "N/A",
        source: business.source || "Google Maps",
        scrapedAt: new Date().toISOString(),
      };
    });

    // Remove duplicates based on name and address
    const uniqueResults = processedResults.filter(
      (business, index, self) =>
        index ===
        self.findIndex(
          (b) =>
            b.name.toLowerCase() === business.name.toLowerCase() &&
            b.address.toLowerCase() === business.address.toLowerCase()
        )
    );

    console.log(`Processed ${uniqueResults.length} unique businesses`);
    return uniqueResults;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log("Browser closed");
    }
  }
}

module.exports = BusinessScraper; 
