const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

class Database {
    async getCampaigns() {
        const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .order('executed_at', { ascending: false });
        if (error) {
            console.error('Error fetching campaigns from Supabase:', error.message);
            throw error;
        }
        return data.map(c => ({
            id: c.id,
            name: c.name,
            type: c.type,
            industry: c.industry,
            location: c.location,
            searchQuery: c.search_query,
            maxResults: c.max_results,
            yourService: c.your_service,
            contentStyle: c.content_style,
            templateTypes: c.template_types,
            results: c.results,
            outputPath: c.output_path,
            executedAt: c.executed_at
        }));
    }

    async getCampaignDetails(campaignId) {
        const { data: campaign, error: cError } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', campaignId)
            .single();
        if (cError) {
            console.error(`Error fetching campaign details for ${campaignId}:`, cError.message);
            throw cError;
        }

        const leads = await this.getLeads(campaignId);
        
        return {
            id: campaign.id,
            name: campaign.name,
            type: campaign.type,
            industry: campaign.industry,
            location: campaign.location,
            searchQuery: campaign.search_query,
            maxResults: campaign.max_results,
            yourService: campaign.your_service,
            contentStyle: campaign.content_style,
            templateTypes: campaign.template_types,
            results: campaign.results,
            outputPath: campaign.output_path,
            executedAt: campaign.executed_at,
            leads
        };
    }

    async getLeads(campaignId) {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('lead_index', { ascending: true });
        if (error) {
            console.error(`Error fetching leads for campaign ${campaignId}:`, error.message);
            throw error;
        }
        return data.map(l => ({
            name: l.name,
            address: l.address,
            phone: l.phone,
            website: l.website,
            rating: l.rating,
            source: l.source,
            status: l.status,
            intelligence: l.intelligence,
            possibleEmails: l.possible_emails,
            referenceLink: l.reference_link,
            scrapedAt: l.scraped_at,
            originalIndex: l.lead_index
        }));
    }

    async saveCampaign(campaignInfo, scoredLeads) {
        // 1. Insert/Upsert Campaign
        const { error: cError } = await supabase
            .from('campaigns')
            .upsert({
                id: campaignInfo.id,
                name: campaignInfo.name,
                type: campaignInfo.type || 'lead_generation',
                industry: campaignInfo.industry,
                location: campaignInfo.location || '',
                search_query: campaignInfo.searchQuery || '',
                max_results: campaignInfo.maxResults || 0,
                your_service: campaignInfo.yourService || '',
                content_style: campaignInfo.contentStyle || 'balanced',
                template_types: campaignInfo.templateTypes || [],
                results: campaignInfo.results || {},
                output_path: campaignInfo.outputPath || '',
                executed_at: campaignInfo.executedAt || new Date().toISOString()
            });
        if (cError) {
            console.error('Error inserting campaign to Supabase:', cError.message);
            throw cError;
        }

        // 2. Insert Leads
        const leadsToInsert = scoredLeads.map((lead, idx) => ({
            campaign_id: campaignInfo.id,
            lead_index: lead.originalIndex !== undefined ? lead.originalIndex : idx,
            name: lead.name,
            address: lead.address || '',
            phone: lead.phone || '',
            website: lead.website || '',
            rating: lead.rating || 'N/A',
            source: lead.source || 'Google Maps',
            status: lead.status || 'New',
            intelligence: lead.intelligence || {},
            possible_emails: lead.possibleEmails || [],
            reference_link: lead.referenceLink || '',
            scraped_at: lead.scrapedAt || new Date().toISOString()
        }));

        const { error: lError } = await supabase
            .from('leads')
            .upsert(leadsToInsert);
        if (lError) {
            console.error('Error inserting leads to Supabase:', lError.message);
            throw lError;
        }

        return true;
    }

    async updateLeadStatus(campaignId, leadIndex, status) {
        const { error } = await supabase
            .from('leads')
            .update({ status })
            .eq('campaign_id', campaignId)
            .eq('lead_index', leadIndex);
        if (error) {
            console.error(`Error updating status for lead ${leadIndex} in campaign ${campaignId}:`, error.message);
            throw error;
        }
        
        // Fetch and return updated lead
        const { data, error: fetchError } = await supabase
            .from('leads')
            .select('*')
            .eq('campaign_id', campaignId)
            .eq('lead_index', leadIndex)
            .single();
        if (fetchError) throw fetchError;
        
        return {
            name: data.name,
            address: data.address,
            phone: data.phone,
            website: data.website,
            rating: data.rating,
            source: data.source,
            status: data.status,
            intelligence: data.intelligence,
            possibleEmails: data.possible_emails,
            referenceLink: data.reference_link,
            scrapedAt: data.scraped_at,
            originalIndex: data.lead_index
        };
    }

    async updateLeadIntelligence(campaignId, leadIndex, intelligence) {
        const { error } = await supabase
            .from('leads')
            .update({ intelligence })
            .eq('campaign_id', campaignId)
            .eq('lead_index', leadIndex);
        if (error) {
            console.error(`Error updating intelligence for lead ${leadIndex} in campaign ${campaignId}:`, error.message);
            throw error;
        }
        return true;
    }

    async getProfile() {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', 'default')
            .maybeSingle();
        
        if (error) {
            console.error('Error getting profile from Supabase:', error.message);
            throw error;
        }

        if (!data) {
            return {
                business: { name: "", type: "", phone: "", email: "", website: "", description: "", valuePropositions: [], targetIndustries: [] },
                owner: { name: "", phone: "", email: "" },
                preferences: { language: "english", campaignStyle: "balanced" }
            };
        }
        return data.business_profile;
    }

    async saveProfile(profile) {
        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: 'default',
                business_profile: profile,
                updated_at: new Date().toISOString()
            });
        if (error) {
            console.error('Error saving profile to Supabase:', error.message);
            throw error;
        }
        return true;
    }

    async getUserPreferences() {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', 'default')
            .maybeSingle();
        
        if (error) {
            console.error('Error getting preferences from Supabase:', error.message);
            throw error;
        }

        if (!data) {
            return { industry: "education", campaignStyle: "balanced", language: "english" };
        }
        return data.user_preferences;
    }

    async saveUserPreferences(prefs) {
        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: 'default',
                user_preferences: prefs,
                updated_at: new Date().toISOString()
            });
        if (error) {
            console.error('Error saving preferences to Supabase:', error.message);
            throw error;
        }
        return true;
    }
}

module.exports = new Database();
