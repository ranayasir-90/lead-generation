-- Supabase Database Schema
-- Paste this script into the Supabase SQL Editor and run it to set up the tables.

-- 1. Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    industry TEXT NOT NULL,
    location TEXT NOT NULL,
    search_query TEXT,
    max_results INTEGER,
    your_service TEXT,
    content_style TEXT,
    template_types TEXT[],
    results JSONB DEFAULT '{}'::jsonb,
    output_path TEXT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
    lead_index INTEGER NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    website TEXT,
    rating TEXT,
    source TEXT,
    status TEXT DEFAULT 'New' NOT NULL,
    follow_up_date TEXT,
    follow_up_time TEXT,
    notes JSONB DEFAULT '[]'::jsonb,
    intelligence JSONB DEFAULT '{}'::jsonb,
    possible_emails TEXT[],
    reference_link TEXT,
    scraped_at TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE (campaign_id, lead_index)
);

-- 3. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY DEFAULT 'default',
    business_profile JSONB DEFAULT '{}'::jsonb,
    user_preferences JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
