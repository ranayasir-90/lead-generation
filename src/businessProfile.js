/**
 * Centralized Business Profile Configuration (Supabase-backed)
 */

const db = require('./db');

let cachedProfile = null;

/**
 * Returns the default empty profile structure.
 * Used as fallback when no config file exists.
 */
function getDefaults() {
    return {
        business: {
            name: '',
            type: '',
            phone: '',
            website: '',
            description: '',
            valuePropositions: [],
            targetIndustries: []
        },
        owner: {
            name: '',
            phone: '',
            email: ''
        },
        preferences: {
            language: 'english',
            campaignStyle: 'balanced',
            defaultSearchQuery: 'Private Schools Islamabad',
            defaultLocation: 'Islamabad',
            outputFormat: 'csv'
        }
    };
}

/**
 * Deep merges source into target, filling in any missing keys with defaults.
 */
function deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(result[key] || {}, source[key]);
        } else if (result[key] === undefined || result[key] === null) {
            result[key] = source[key];
        }
    }
    return result;
}

/**
 * Validates the profile object. Returns an array of warning messages.
 */
function validate(profile) {
    const warnings = [];

    if (!profile.business?.name) {
        warnings.push('Business name is not set. Run: npm run setup');
    }
    if (!profile.business?.type) {
        warnings.push('Business type is not set.');
    }
    if (!profile.business?.description) {
        warnings.push('Business description is not set. Marketing content may be generic.');
    }
    if (!profile.owner?.name) {
        warnings.push('Owner name is not set.');
    }
    if (!profile.business?.phone && !profile.owner?.phone) {
        warnings.push('No contact phone number is set.');
    }

    return warnings;
}

/**
 * Asynchronously initializes the cached profile from Supabase.
 */
async function initAsync() {
    try {
        const defaults = getDefaults();
        const dbProfile = await db.getProfile();
        cachedProfile = deepMerge(dbProfile || {}, defaults);
    } catch (error) {
        console.warn('⚠️ Could not load profile from Supabase, using defaults:', error.message);
        cachedProfile = getDefaults();
    }
}

/**
 * Returns the cached profile.
 */
function getProfile() {
    if (!cachedProfile) {
        cachedProfile = getDefaults();
    }
    return cachedProfile;
}

/**
 * Saves the profile object to Supabase.
 */
async function save(profile) {
    try {
        await db.saveProfile(profile);
        cachedProfile = profile;
        return true;
    } catch (error) {
        console.error('❌ Error saving profile to Supabase:', error.message);
        return false;
    }
}

/**
 * Checks if a business profile is configured.
 */
function isConfigured() {
    return cachedProfile && cachedProfile.business && cachedProfile.business.name !== '';
}

/**
 * Resets the cached profile.
 */
function resetCache() {
    cachedProfile = null;
}

/**
 * Helper: get business info object for prompt building.
 */
function getBusinessInfoForPrompt() {
    const p = getProfile();
    return {
        name: p.business.name || 'Your Business',
        phone: p.business.phone || p.owner.phone || '',
        website: p.business.website || '',
        ownerName: p.owner.name || '',
        ownerPhone: p.owner.phone || '',
        type: p.business.type || '',
        description: p.business.description || '',
        valuePropositions: p.business.valuePropositions || [],
        targetIndustries: p.business.targetIndustries || [],
        language: p.preferences.language || 'english',
        campaignStyle: p.preferences.campaignStyle || 'balanced'
    };
}

module.exports = {
    initAsync,
    getProfile,
    getDefaults,
    save,
    validate,
    isConfigured,
    resetCache,
    getBusinessInfoForPrompt
};
