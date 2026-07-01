const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const db = require('../db');

// Import existing components
const BusinessScraper = require('../scraper');
const MarketingAutomation = require('../marketing');
const MarketingAI = require('../marketingAI');
const LeadIntelligence = require('../leadIntelligence');
const CampaignBuilder = require('../campaign');

const app = express();
const PORT = process.env.PORT || process.env.WEB_PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Store for active campaigns and SSE connections
const activeCampaigns = new Map();
const sseConnections = new Set();



// SSE endpoint for real-time updates
app.get('/api/events', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    // Add connection to active connections
    sseConnections.add(res);

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to real-time updates' })}\n\n`);

    // Handle client disconnect
    req.on('close', () => {
        sseConnections.delete(res);
    });
});

// Function to broadcast SSE message to all connected clients
function broadcastSSE(data) {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    sseConnections.forEach(res => {
        try {
            res.write(message);
        } catch (error) {
            sseConnections.delete(res);
        }
    });
}

// API Routes

// Dashboard overview
app.get('/api/dashboard', async (req, res) => {
    try {
        const campaigns = await db.getCampaigns();
        const userPrefs = await db.getUserPreferences();
        
        // Calculate overview statistics
        const totalCampaigns = campaigns.length;
        const totalLeads = campaigns.reduce((sum, campaign) => 
            sum + (campaign.results?.totalLeads || 0), 0);
        const totalHighScoreLeads = campaigns.reduce((sum, campaign) => 
            sum + (campaign.results?.highScoreLeads || campaign.results?.priorityLeads || 0), 0);
        const averageScore = campaigns.length > 0 ? 
            Math.round(campaigns.reduce((sum, campaign) => 
                sum + (campaign.results?.averageScore || 0), 0) / campaigns.length) : 0;

        // Recent activity (last 5 campaigns)
        const recentActivity = campaigns.slice(0, 5).map(campaign => ({
            id: campaign.id,
            name: campaign.name,
            type: campaign.type,
            industry: campaign.industry,
            executedAt: campaign.executedAt,
            totalLeads: campaign.results?.totalLeads || 0,
            highScoreLeads: campaign.results?.highScoreLeads || campaign.results?.priorityLeads || 0
        }));

        res.json({
            overview: {
                totalCampaigns,
                totalLeads,
                totalHighScoreLeads,
                averageScore,
                primaryIndustry: userPrefs?.industry || 'professional'
            },
            recentActivity,
            userPreferences: userPrefs
        });
    } catch (error) {
        console.error('Error getting dashboard data:', error);
        res.status(500).json({ error: 'Failed to load dashboard data' });
    }
});

// Get all campaigns
app.get('/api/campaigns', async (req, res) => {
    try {
        const campaigns = await db.getCampaigns();
        res.json(campaigns);
    } catch (error) {
        console.error('Error getting campaigns:', error);
        res.status(500).json({ error: 'Failed to load campaigns' });
    }
});

// Get specific campaign details
app.get('/api/campaigns/:id', async (req, res) => {
    try {
        const campaign = await db.getCampaignDetails(req.params.id);
        res.json(campaign);
    } catch (error) {
        console.error('Error getting campaign details:', error);
        res.status(500).json({ error: 'Failed to load campaign details' });
    }
});

// Get leads for a specific campaign
app.get('/api/campaigns/:id/leads', async (req, res) => {
    try {
        const leads = await db.getLeads(req.params.id);
        const { page = 1, limit = 20, minScore } = req.query;
        
        let filteredLeads = leads;
        
        // Apply filters
        if (minScore) {
            filteredLeads = filteredLeads.filter(lead => 
                (lead.intelligence?.score || 0) >= parseInt(minScore)
            );
        }

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

        res.json({
            leads: paginatedLeads,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: filteredLeads.length,
                totalPages: Math.ceil(filteredLeads.length / limit)
            }
        });
    } catch (error) {
        console.error('Error getting leads:', error);
        res.status(500).json({ error: 'Failed to load leads' });
    }
});

// Update lead status
app.post('/api/leads/status', async (req, res) => {
    try {
        const { campaignId, leadIndex, status } = req.body;
        
        if (!campaignId || leadIndex === undefined || !status) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const lead = await db.updateLeadStatus(campaignId, parseInt(leadIndex), status);
        res.json({ success: true, message: 'Status updated successfully', lead });
    } catch (error) {
        console.error('Error updating lead status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// Update lead details (status)
app.post('/api/leads/update', async (req, res) => {
    try {
        const { campaignId, leadIndex, status } = req.body;
        
        if (!campaignId || leadIndex === undefined) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const lead = await db.updateLeadStatus(campaignId, parseInt(leadIndex), status);
        res.json({ success: true, message: 'Lead updated successfully', lead });
    } catch (error) {
        console.error('Error updating lead details:', error);
        res.status(500).json({ error: 'Failed to update lead details' });
    }
});

// Generate dynamic personalized pitch for a single lead
app.post('/api/leads/generate-pitch', async (req, res) => {
    try {
        const { campaignId, leadIndex, serviceText } = req.body;
        
        if (!campaignId || leadIndex === undefined || !serviceText) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const campaignInfo = await db.getCampaignDetails(campaignId);
        const leads = campaignInfo.leads || [];
        const index = parseInt(leadIndex);
        const lead = leads.find(l => l.originalIndex === index);

        if (!lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        const industry = campaignInfo.industry || 'professional';
        const campaignStyle = campaignInfo.contentStyle || 'balanced';
        const language = campaignInfo.language || 'english';

        // Call marketingAI to generate content
        const marketingAI = new MarketingAI();
        const content = await marketingAI.generateIndustrySpecificContent(
            lead,
            industry,
            serviceText,
            campaignStyle,
            language
        );

        if (!content) {
            return res.status(500).json({ error: 'Failed to generate personalized content' });
        }

        // Save generated content back into lead
        if (!lead.intelligence) {
            lead.intelligence = {};
        }
        lead.intelligence.marketingContent = content;

        // Save updated lead intelligence to Supabase
        await db.updateLeadIntelligence(campaignId, index, lead.intelligence);

        res.json({ success: true, content, lead });
    } catch (error) {
        console.error('Error generating pitch:', error);
        res.status(500).json({ error: error.message || 'Failed to generate pitch' });
    }
});

// Analytics endpoint
app.get('/api/analytics', async (req, res) => {
    try {
        const campaigns = await db.getCampaigns();
        
        // Industry distribution
        const industryStats = {};
        campaigns.forEach(campaign => {
            const industry = campaign.industry || 'unknown';
            if (!industryStats[industry]) {
                industryStats[industry] = { campaigns: 0, totalLeads: 0, avgScore: 0 };
            }
            industryStats[industry].campaigns++;
            industryStats[industry].totalLeads += campaign.results?.totalLeads || 0;
            industryStats[industry].avgScore += campaign.results?.averageScore || 0;
        });

        // Calculate averages
        Object.keys(industryStats).forEach(industry => {
            industryStats[industry].avgScore = Math.round(
                industryStats[industry].avgScore / industryStats[industry].campaigns
            );
        });

        // Lead quality distribution
        const qualityDistribution = { HIGH: 0, MEDIUM: 0, LOW: 0 };
        for (const campaign of campaigns) {
            const leads = await db.getLeads(campaign.id);
            leads.forEach(lead => {
                const score = lead.intelligence?.score || 0;
                if (score >= 85) {
                    qualityDistribution.HIGH++;
                } else if (score >= 65) {
                    qualityDistribution.MEDIUM++;
                } else {
                    qualityDistribution.LOW++;
                }
            });
        }

        // Campaign performance over time (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentCampaigns = campaigns.filter(campaign => 
            new Date(campaign.executedAt) >= thirtyDaysAgo
        );

        res.json({
            industryStats,
            qualityDistribution,
            campaignTrends: {
                totalCampaigns: campaigns.length,
                recentCampaigns: recentCampaigns.length,
                totalLeads: campaigns.reduce((sum, c) => sum + (c.results?.totalLeads || 0), 0),
                avgQualityScore: campaigns.length > 0 ? 
                    Math.round(campaigns.reduce((sum, c) => sum + (c.results?.averageScore || 0), 0) / campaigns.length) : 0
            }
        });
    } catch (error) {
        console.error('Error getting analytics:', error);
        res.status(500).json({ error: 'Failed to load analytics' });
    }
});

// vCard generation utility function
function generateVCard(lead) {
    const name = lead.name || 'Unknown Business';
    const phone = lead.phone || '';
    const address = lead.address || '';
    const website = lead.website || '';
    const rating = lead.rating || '';
    
    // Clean phone number for vCard format
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    
    const vcard = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${name}`,
        `ORG:${name}`,
        cleanPhone ? `TEL:${cleanPhone}` : '',
        address ? `ADR:;;${address};;;;` : '',
        website ? `URL:${website}` : '',
        rating ? `NOTE:Google Rating: ${rating} stars` : '',
        lead.intelligence ? `NOTE:Lead Score: ${lead.intelligence.score}/100 - Category: ${lead.intelligence.category}` : '',
        'END:VCARD'
    ].filter(line => line !== '').join('\r\n');
    
    return vcard;
}

// Export single lead as vCard
app.get('/api/leads/:campaignId/:leadIndex/vcard', async (req, res) => {
    try {
        const { campaignId, leadIndex } = req.params;
        const leads = await db.getLeads(campaignId);
        const index = parseInt(leadIndex);
        const lead = leads.find(l => l.originalIndex === index);
        
        if (!lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }
        
        const vcard = generateVCard(lead);
        const filename = `${(lead.name || 'contact').replace(/[^a-zA-Z0-9]/g, '_')}.vcf`;
        
        res.setHeader('Content-Type', 'text/vcard');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(vcard);
        
    } catch (error) {
        console.error('Error generating vCard:', error);
        res.status(500).json({ error: 'Failed to generate vCard' });
    }
});

// Export all leads from campaign as vCard bundle
app.get('/api/campaigns/:id/export/vcard', async (req, res) => {
    try {
        const leads = await db.getLeads(req.params.id);
        const campaign = await db.getCampaignDetails(req.params.id);
        
        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        
        // Generate combined vCard file
        const vcards = leads.map(lead => generateVCard(lead)).join('\r\n\r\n');
        const filename = `${campaign.name.replace(/[^a-zA-Z0-9]/g, '_')}_contacts.vcf`;
        
        res.setHeader('Content-Type', 'text/vcard');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(vcards);
        
    } catch (error) {
        console.error('Error generating vCard bundle:', error);
        res.status(500).json({ error: 'Failed to generate vCard bundle' });
    }
});

// Create new campaign endpoint
app.post('/api/campaigns', async (req, res) => {
    try {
        const { name, industry, location, searchQuery, maxResults, yourService, contentStyle, language } = req.body;
        
        // Validate required fields
        if (!name || !location || !searchQuery) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const campaignId = `campaign_${name.replace(/\s+/g, '_')}_${Date.now()}`;
        
        // Store campaign in active campaigns
        activeCampaigns.set(campaignId, {
            id: campaignId,
            name,
            type: 'lead_generation',
            industry: industry || 'professional',
            location,
            searchQuery,
            maxResults: parseInt(maxResults) || 20,
            yourService: yourService || '',
            contentStyle: contentStyle || 'balanced',
            language: language || 'english',
            status: 'starting',
            progress: 0,
            startedAt: new Date().toISOString()
        });

        // Broadcast campaign start
        broadcastSSE({
            type: 'campaign_started',
            campaignId,
            message: `Campaign "${name}" started`
        });

        // Start campaign execution in background
        executeCampaignAsync(campaignId);

        res.json({ 
            success: true, 
            campaignId,
            message: 'Campaign started successfully'
        });

    } catch (error) {
        console.error('Error creating campaign:', error);
        res.status(500).json({ error: 'Failed to create campaign' });
    }
});

// Get active campaign status
app.get('/api/campaigns/:id/status', (req, res) => {
    const campaign = activeCampaigns.get(req.params.id);
    if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json(campaign);
});

// Async campaign execution function
async function executeCampaignAsync(campaignId) {
    const campaign = activeCampaigns.get(campaignId);
    if (!campaign) return;

    try {
        const scraper = new BusinessScraper();
        const marketingAI = new MarketingAI();
        const intelligence = new LeadIntelligence();

        // Update progress: Starting
        campaign.status = 'scraping';
        campaign.progress = 10;
        broadcastSSE({
            type: 'campaign_progress',
            campaignId,
            progress: 10,
            message: 'Starting lead discovery...'
        });

        // Phase 1: Lead Discovery
        const rawLeads = await scraper.scrapeGoogleMaps(campaign.searchQuery, campaign.maxResults);
        
        campaign.progress = 40;
        broadcastSSE({
            type: 'campaign_progress',
            campaignId,
            progress: 40,
            message: `Found ${rawLeads.length} raw leads`
        });

        // Phase 2: Lead Intelligence
        campaign.status = 'analyzing';
        const scoredLeads = await intelligence.scoreLeads(rawLeads, campaign.industry);
        
        campaign.progress = 70;
        broadcastSSE({
            type: 'campaign_progress',
            campaignId,
            progress: 70,
            message: 'Analyzing lead intelligence...'
        });

        campaign.progress = 90;
        broadcastSSE({
            type: 'campaign_progress',
            campaignId,
            progress: 90,
            message: 'Finalizing results...'
        });

        // Phase 4: Save Results
        const campaignInfo = {
            ...campaign,
            executedAt: new Date().toISOString(),
            results: {
                totalLeads: scoredLeads.length,
                highQualityLeads: scoredLeads.filter(lead => lead.intelligence.score >= 65).length,
                highScoreLeads: scoredLeads.filter(lead => lead.intelligence.score >= 85).length,
                averageScore: Math.round(scoredLeads.reduce((sum, lead) => sum + lead.intelligence.score, 0) / scoredLeads.length),
                enhancedAI: true
            },
            outputPath: `supabase/campaign_${campaignId}`
        };

        await db.saveCampaign(campaignInfo, scoredLeads);

        // Complete campaign
        campaign.status = 'completed';
        campaign.progress = 100;
        campaign.completedAt = new Date().toISOString();
        campaign.results = campaignInfo.results;

        broadcastSSE({
            type: 'campaign_completed',
            campaignId,
            progress: 100,
            message: `Campaign completed! Generated ${scoredLeads.length} leads`,
            results: campaignInfo.results
        });

        // Clean up
        await scraper.close();
        
        // Remove from active campaigns after 5 minutes
        setTimeout(() => {
            activeCampaigns.delete(campaignId);
        }, 5 * 60 * 1000);

    } catch (error) {
        console.error(`Campaign ${campaignId} failed:`, error);
        
        campaign.status = 'failed';
        campaign.error = error.message;
        
        broadcastSSE({
            type: 'campaign_failed',
            campaignId,
            message: `Campaign failed: ${error.message}`
        });
    }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    const { isConfigured, getModel } = require('../openaiClient');
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        openai: {
            configured: isConfigured(),
            model: getModel(),
            baseUrl: process.env.OPENAI_BASE_URL || 'default'
        },
        activeCampaigns: activeCampaigns.size,
        sseConnections: sseConnections.size
    });
});

// Serve main dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', async () => {
    try {
        await require('../businessProfile').initAsync();
        console.log('✅ Business profile pre-cached from Supabase');
    } catch (e) {
        console.warn('⚠️ Warning: Failed to pre-cache profile:', e.message);
    }
    console.log(`🚀 Business Leads AI Web Dashboard running on http://0.0.0.0:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`🔌 API: http://localhost:${PORT}/api`);
    console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
function gracefulShutdown(signal) {
    console.log(`\n⏹️  ${signal} received. Shutting down gracefully...`);
    
    // Close SSE connections
    sseConnections.forEach(res => {
        try { res.end(); } catch (e) { /* ignore */ }
    });
    sseConnections.clear();

    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error('❌ Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = app;