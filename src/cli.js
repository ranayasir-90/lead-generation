const BusinessScraper = require('./scraper');
const FileUtils = require('./fileUtils');
const { getProfile, isConfigured } = require('./businessProfile');
const db = require('./db');

// Parse command line arguments
function parseArguments() {
  const profile = getProfile();
  const defaultQuery = profile.preferences.defaultSearchQuery || '';

  const args = process.argv.slice(2);
  const options = {
    query: defaultQuery,
    maxResults: 20,
    generateMarketing: false,
    marketingContent: "",
    callToAction: "",
    language: profile.preferences.language || 'english'
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '-q':
      case '--query':
        options.query = args[i + 1];
        i++;
        break;
      case '-l':
      case '--length':
        const length = parseInt(args[i + 1]) || 20;
        options.maxResults = Math.min(length, 100); // Max 100 results
        i++;
        break;
      case '-m':
      case '--marketing':
        options.generateMarketing = true;
        options.marketingContent = args[i + 1] || "";
        i++;
        break;
      case '-c':
      case '--cta':
        options.callToAction = args[i + 1] || "";
        break;
      case '-L':
      case '--language':
        options.language = args[i + 1] || 'english';
        i++;
        break;
      case '-h':
      case '--help':
        const profileStatus = isConfigured()
          ? `✅ Business profile loaded: ${profile.business.name || '(name not set)'}`
          : '⚠️  No business profile found. Run: npm run setup';
        console.log(`
Usage: node src/cli.js [options]

${profileStatus}

Options:
  -q, --query <string>     Search query${defaultQuery ? ` (default: "${defaultQuery}")` : ' (set via npm run setup)'}
  -l, --length <number>    Number of results to scrape (default: 20, max: 100)
  -m, --marketing <text>   Marketing content + Generate AI marketing templates
  -c, --cta <text>         Call to action (required if -m is used)
  -L, --language <lang>    Output language: english (default: ${options.language})
  -h, --help               Show this help message

Examples:
  node index.js -q "Restaurant Lahore" -l 50
  node index.js -q "Software House Islamabad" -l 10 -m "Your marketing content here" -c "Schedule a Free Demo"
  node index.js -q "Clinic Karachi" -l 20
        `);
        process.exit(0);
        break;
    }
  }

  return options;
}

// Main CLI function
async function main() {
  await require('./businessProfile').initAsync();
  const options = parseArguments();

  if (!options.query) {
    console.log('❌ No search query specified.');
    console.log('   Use: node index.js -q "Your Search Query"');
    console.log('   Or run: npm run setup to configure default search query.');
    process.exit(1);
  }

  const scraper = new BusinessScraper();

  try {
    console.log(`Starting business scraper...`);
    console.log(`Query: "${options.query}"`);
    console.log(`Max Results: ${options.maxResults}`);
    console.log(`Language: ${options.language}`);
    console.log(`Generate Marketing: ${options.generateMarketing ? 'Yes' : 'No'}`);

    // Scrape with parameters
    await scraper.scrapeGoogleMaps(options.query, options.maxResults);

    // Process dan clean data
    const processedData = await scraper.processResults();

    // Save to Supabase
    console.log(`💾 Saving results to Supabase...`);
    const campaignId = `cli_scrape_${options.query.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`;
    const campaignInfo = {
        id: campaignId,
        name: `CLI Scrape: ${options.query}`,
        type: 'lead_generation',
        industry: 'professional',
        location: 'cli',
        searchQuery: options.query,
        maxResults: options.maxResults,
        results: {
            totalLeads: processedData.length,
            highQualityLeads: 0,
            priorityLeads: 0,
            averageScore: 0,
            enhancedAI: false
        },
        outputPath: `supabase/campaign_${campaignId}`
    };
    await db.saveCampaign(campaignInfo, processedData);

    console.log(
      `\nScraping completed! Found ${processedData.length} potential leads.`
    );
    console.log(`Target: ${options.maxResults}, Actual: ${processedData.length}`);
    console.log("Leads saved directly to Supabase!");

    // Generate marketing templates if requested
    if (options.generateMarketing) {
      console.log('\n🤖 Generating AI marketing templates...');
      
      if (!options.marketingContent) {
        console.log('❌ Error: Marketing content (-m) is required when using marketing feature');
        return;
      }
      
      const MarketingAutomation = require('./marketing');
      const marketing = new MarketingAutomation();
      
      const leads = processedData;
      
      if (leads && leads.length > 0) {
        console.log(`Processing ${leads.length} leads for marketing...`);
        console.log(`Marketing Content: ${options.marketingContent.substring(0, 100)}...`);
        console.log(`Call to Action: ${options.callToAction || 'Auto-generated by AI'}`);
        
        // Generate marketing templates with custom content
        const marketingData = await marketing.generateMarketingTemplatesWithContent(
          leads, 
          options.marketingContent, 
          options.callToAction
        );
        
        if (marketingData.length > 0) {
          console.log(`✅ Generated ${marketingData.length} marketing templates inside lead intelligence`);
        } else {
          console.log('⚠️ No WhatsApp templates generated (check OpenAI configuration)');
        }
      } else {
        console.log('❌ No leads found for marketing generation');
      }
    }
  } catch (error) {
    console.error("Error in main process:", error);
  } finally {
    await scraper.close();
  }
}

// Export for testing
module.exports = { main, parseArguments };

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}