require('dotenv').config();
const { getClient, getModel } = require('./openaiClient');
const { getBusinessInfoForPrompt, getProfile } = require('./businessProfile');

class MarketingAI {
    constructor() {
        this.openai = getClient();
        this.industryTemplates = this.loadIndustryTemplates();
        this.pakistaniContext = this.loadPakistaniContext();
        this.englishContext = this.loadEnglishContext();
        this.marketData = this.loadRealMarketData();
    }


    loadIndustryTemplates() {
        return {
            restaurant: {
                industry: 'restaurant',
                painPoints: [
                    "Online orders are only 23% of total revenue (industry average is 45%)",
                    "Losing 67% of customers due to lack of a loyalty/retention program",
                    "Food waste of 15-20% due to manual inventory management",
                    "Customer acquisition costs increased by 156% on platform delivery (Foodpanda)",
                    "Profit margins decreased by 8-12% due to high platform commission fees"
                ],
                solutions: [
                    "Integrated POS system with direct online ordering (bypass 20-30% commissions)",
                    "AI-powered inventory management (reduce food waste by up to 40%)",
                    "Customer loyalty program with automated WhatsApp messaging",
                    "Social media marketing setup with transparent ROI tracking",
                    "Dynamic pricing and discount systems based on customer demand patterns"
                ],
                benefits: [
                    "Increase direct online orders by 67% within 3 months",
                    "Profit margins grow by 15-25% by reducing delivery platform dependency",
                    "Customer retention rate increases by 89% with automated loyalty setup",
                    "Reduce food waste by 35% with smart automated inventory tracking",
                    "Marketing ROI increases by 234% with targeted promotional campaigns"
                ],
                localContext: "Pakistan F&B and restaurant market with rapidly growing online food ordering weekly",
                urgency: "Restaurants with digital presence and direct WhatsApp ordering grow 150% faster, while non-digitized ones struggle",
                caseStudy: "A local restaurant in Lahore: Direct online orders grew by 189% in 6 months using custom ordering portal"
            },
            automotive: {
                industry: 'automotive',
                painPoints: [
                    "Manual booking and scheduling causes 43% missed business opportunities",
                    "Fleet downtime is 23% due to unscheduled vehicle maintenance",
                    "Customer churn rate is 56% because of slow support response times",
                    "Fuel costs overrun by 18% without proper route optimization",
                    "Average monthly revenue loss of Rs. 250,000 per vehicle due to inefficiencies"
                ],
                solutions: [
                    "Automated booking platform with real-time vehicle availability",
                    "Predictive maintenance scheduling and route planning tools",
                    "WhatsApp Business API integration for instant customer bookings and support",
                    "AI-driven route optimization to maximize fuel efficiency",
                    "Dynamic rental pricing based on demand and competitive market analysis"
                ],
                benefits: [
                    "Booking management efficiency increases by 78% with automated setup",
                    "Maintenance and fleet repair costs drop by 34% with proactive scheduling",
                    "Customer satisfaction score rises from 6.2 to 8.7 out of 10",
                    "Fuel costs reduced by 22% with optimized vehicle routing",
                    "Average monthly revenue per vehicle increases by Rs. 150,000"
                ],
                localContext: "Pakistan car rental and fleet management market, where 89% of operations are still manual",
                urgency: "Online ride-hailing services dominate urban mobility; traditional providers must digitize to survive",
                caseStudy: "A fleet rental company in Karachi: Vehicle utilization increased by 145% after implementing booking system"
            },
            retail: {
                industry: 'retail',
                painPoints: [
                    "In-store sales down 34% with online sales contributing minimal revenue",
                    "Inventory stockout rate of 28% due to manual stock tracking",
                    "Customer lifetime value dropped by 45% without personalization",
                    "Marketing budget waste is 67% due to lack of customer targeting",
                    "Losing 89% of potential buyers who visit social media but don't check out"
                ],
                solutions: [
                    "Omnichannel e-commerce setup with real-time inventory synchronization",
                    "AI-powered personalization for product and discount recommendations",
                    "Unified customer database tracking behavioral data and preferences",
                    "Automated WhatsApp marketing with segment-wise customer outreach",
                    "Social commerce integrations (Instagram Shop, TikTok Catalog, WhatsApp catalog)"
                ],
                benefits: [
                    "Online sales contribution grows to 67% of total revenue within 8 months",
                    "Inventory turnover rate improves by 156% with demand forecasting",
                    "Customer lifetime value increases by 234% via personalized marketing",
                    "Marketing ROI increases by 445% with targeted outreach campaigns",
                    "Conversion rate grows from 1.2% to 4.8% through catalog optimization"
                ],
                localContext: "Pakistan retail and clothing market, with e-commerce penetration growing rapidly in urban centers",
                urgency: "E-commerce giants and social sellers dominate B2C retail; independent brands must digitize to compete",
                caseStudy: "A clothing brand in Rawalpindi: Sales increased by 267% in 1 year using unified social e-commerce tools"
            },
            professional: {
                industry: 'professional',
                painPoints: [
                    "Client acquisition is 89% dependent on referrals, limiting annual growth to 12%",
                    "Proposal conversion rate is only 23% due to manual quote preparation",
                    "Time spent on administrative tasks takes up 45% of total billable hours",
                    "Average project value remains stagnant without digital value positioning",
                    "Client churn rate is 34% due to poor project updates and slow follow-ups"
                ],
                solutions: [
                    "Professional portfolio website with case studies and client testimonials",
                    "CRM system with automated lead tracking and client nurturing",
                    "Online booking integration with calendar management",
                    "Proposal automation with dynamic pricing templates",
                    "Content marketing setup to build brand authority and trust"
                ],
                benefits: [
                    "Lead generation increases by 289% with optimized web presence",
                    "Proposal win rate grows from 23% to 67% with modern proposals",
                    "Administrative overhead reduced by 56% with automated workflows",
                    "Average contract value increases by 134% due to premium branding",
                    "Client retention rate increases to 89% with systematic follow-ups"
                ],
                localContext: "Pakistan professional services market, where only 34% of services are fully digitized",
                urgency: "Freelancers and digital agencies are growing 400%+; traditional consultancies must digitize or lose clients",
                caseStudy: "A tax consultancy firm in Islamabad: Client base grew by 345% in 10 months via lead nurturing"
            },
            healthcare: {
                industry: 'healthcare',
                painPoints: [
                    "Patient no-show rate is 34% due to manual appointment booking",
                    "Average patient waiting time is 67 minutes, leading to poor satisfaction scores",
                    "Administrative overhead consumes 23% of revenue due to paper-based records",
                    "Patient follow-up rate is only 45% because of manual tracking",
                    "Monthly revenue loss of Rs. 300,000 due to clinic scheduling inefficiencies"
                ],
                solutions: [
                    "Online appointment scheduling system with automated SMS/WhatsApp reminders",
                    "Digital health records with secure cloud backup for quick access",
                    "Telemedicine portal configuration for virtual check-ups and follow-ups",
                    "WhatsApp API integration for instant patient inquiries and appointment booking",
                    "Practice management platform with digital billing and invoicing"
                ],
                benefits: [
                    "Patient no-show rate falls to 12% with automated appointment reminders",
                    "Patient satisfaction score rises to 8.9/10 with reduced wait times",
                    "Administrative and paperwork costs drop by 45% with digitized records",
                    "Patient follow-up rate increases to 89% with systematic database tracking",
                    "Clinic revenue grows by 67% due to streamlined scheduling efficiency"
                ],
                localContext: "Pakistan healthcare and private clinic market, with telemedicine adoption rising 300% in urban centers",
                urgency: "89% of patients expect online appointment booking; clinics without digital systems lose patients to modern clinics",
                caseStudy: "A dental clinic in Lahore: Patient volume increased by 178% after deploying appointment system"
            },
            education: {
                industry: 'education',
                painPoints: [
                    "Student retention is only 67% due to low classroom engagement and outdated systems",
                    "Administrative and enrollment workload consumes 56% of staff time",
                    "Course completion rate is 34% without proper student progress tracking",
                    "Revenue per student is stagnant without structured upselling of courses",
                    "Competition from online learning platforms causes 23% annual student enrollment loss"
                ],
                solutions: [
                    "Learning Management System (LMS) setup with student/parent portals",
                    "Automated registration, fee collection, and administrative workflows",
                    "Student progress tracking with automated certificates and performance cards",
                    "Hybrid learning platform supporting both live classes and recorded video lectures",
                    "Parent communication channel with automated progress and attendance reporting"
                ],
                benefits: [
                    "Student retention rises to 89% with interactive digital portal",
                    "Administrative work hours reduced by 67% via workflow automation",
                    "Course completion rate increases to 78% with structured tracking",
                    "Revenue per student increases by 145% with optional add-on courses",
                    "Strong competitive advantage with modern LMS offering"
                ],
                localContext: "Pakistan education and test prep academy market, with digital portals growing 25% annually",
                urgency: "Gen-Z students expect digital-first classrooms; academies without web portals lose 34% enrollments annually",
                caseStudy: "An academy in Islamabad: Student enrollment grew by 234% after launching customized LMS portal"
            },
            realestate: {
                industry: 'realestate',
                painPoints: [
                    "Lead conversion rate is only 8% due to manual follow-up delays",
                    "Property viewing no-show rate is 45% without automated meeting confirmations",
                    "Average property sales cycle is 8.5 months, far longer than competitors (5.2 months)",
                    "Marketing spend of 67% is unmeasured with no lead attribution",
                    "Property buyer database is unorganized, losing 56% of repeat commissions"
                ],
                solutions: [
                    "Property CRM implementation with automated lead scoring and nurturing",
                    "WhatsApp Business API integration for instant property catalogs and details",
                    "Virtual tour integration and 360-degree digital property showcases",
                    "Targeted local social media campaigns targeting prime housing societies (DHA, Bahria)",
                    "Organized buyer-seller database with automated follow-ups for repeat transactions"
                ],
                benefits: [
                    "Lead conversion rate increases to 34% with systematic follow-up",
                    "Property viewing show-up rate increases to 89% with instant reminders",
                    "Sales cycle reduced to 5.8 months due to digitized pipelines",
                    "Marketing ROI grows by 267% via target society campaigns",
                    "Repeat transaction volume increases by 178% with organized databases"
                ],
                localContext: "Pakistan real estate and housing society market, with PropTech adoption rising rapidly in urban areas",
                urgency: "99% of buyers search for properties online; independent agencies must digitize or lose clients",
                caseStudy: "A real estate agency in Karachi: Sales volume grew by 289% in 12 months using specialized CRM tools"
            }
        };
    }

    loadRealMarketData() {
        return {
            pakistan: {
                digitalAdoption: "85M+ internet users, 80%+ smartphone penetration in urban hubs",
                ecommerceGrowth: "Rapid expansion, expected to cross $7.5B by 2025",
                paymentMethods: "EasyPaisa (40%), JazzCash (35%), Bank Transfer (20%), Cash on Delivery dominates B2C",
                socialMedia: "WhatsApp Business 30M+, Facebook 45M+, Instagram 15M+ users",
                marketSize: {
                    restaurant: "$8.2B F&B and restaurant market in Pakistan, growing 10% annually",
                    automotive: "$12.5B transportation and rental market, ride-hailing $2.5B",
                    retail: "$22.3B retail market, e-commerce penetration 8%",
                    healthcare: "$15.4B healthcare and pharma market, digital health up 300%",
                    education: "$8.5B education market, EdTech and LMS penetration rising post-covid",
                    realestate: "$180B property and real estate market, PropTech penetration 15%",
                    professional: "$9.2B professional services, digital agency market growing 35% YoY"
                },
                trends: {
                    current: "AI automation adoption up 120%, digital invoicing 75%, local services focus",
                    emerging: "Social commerce, WhatsApp catalog shopping, automated customer support",
                    challenges: "Economic inflation, tax compliance, digital talent gap"
                }
            },
            global: {
                digitalTransformation: "70% of companies accelerated digital initiatives post-2020",
                aiAdoption: "35% of businesses use AI for customer engagement",
                mobileCommerce: "Mobile accounts for 54% of all e-commerce traffic",
                customerExpectations: "73% expect personalized experiences, 67% want instant responses",
                marketTrends: {
                    restaurant: "$4.2T global food service, 8.7% digital ordering growth",
                    automotive: "$2.9T automotive market, 23% EV adoption rate",
                    retail: "$26.7T global retail, 19.6% e-commerce penetration",
                    healthcare: "$8.3T healthcare market, 38% digital health adoption",
                    education: "$6.2T education market, 15.3% EdTech penetration",
                    realestate: "$3.7T real estate, 12% PropTech adoption",
                    professional: "$1.8T professional services, 42% automation rate"
                }
            }
        };
    }

    loadEnglishContext() {
        return {
            businessCulture: {
                relationship: "Professional relationships built on trust and reliability",
                communication: "Direct, clear, and results-oriented communication preferred",
                decision: "Data-driven decision making with ROI focus",
                trust: "Credibility established through proven results and testimonials",
                social: "LinkedIn recommendations and case studies drive credibility"
            },
            marketTrends: {
                digital: "Mobile-first approach with 54% of traffic from mobile devices",
                ecommerce: "19.6% of retail sales happen online, growing 14.3% annually",
                social: "LinkedIn for B2B, Instagram for B2C, WhatsApp for customer service",
                payment: "Credit cards, digital wallets, and BNPL solutions dominate",
                delivery: "Same-day delivery expected, sustainability increasingly important"
            },
            challenges: {
                competition: "Intense global competition requiring differentiation",
                technology: "Rapid tech evolution demands continuous adaptation",
                regulation: "GDPR, data privacy, and compliance requirements",
                talent: "Skills gap in digital marketing and technology"
            }
        };
    }

    loadPakistaniContext() {
        return {
            businessCulture: {
                relationship: "Personal relationships and trust are very important in Pakistani business",
                communication: "Polite, respectful, and relationship-driven communication preferred",
                decision: "Decision-making often involves business partners or family consensus",
                trust: "Establishing mutual trust and credibility is essential for successful deals",
                social: "LinkedIn, WhatsApp, and face-to-face meetings drive B2B credibility"
            },
            marketTrends: {
                digital: "Over 85% of urban Pakistani business owners use smartphones and WhatsApp",
                ecommerce: "E-commerce is growing rapidly with over $6B market size, driven by mobile shopping",
                social: "WhatsApp Business, Facebook, and LinkedIn are the main channels",
                payment: "EasyPaisa, JazzCash, Nayapay, and Bank Transfers are highly popular",
                delivery: "Fast logistics and cash-on-delivery (COD) are standard expectations"
            },
            challenges: {
                infrastructure: "Load shedding and varying internet connectivity across regions",
                education: "Varying levels of digital literacy among traditional business owners",
                regulation: "FBR tax regulations, registration, and digital audit compliance",
                competition: "Rising number of local digital service providers and agencies"
            }
        };
    }

    async generateIndustrySpecificContent(lead, industry, yourService, campaignStyle = 'balanced', language = null) {
        if (!this.openai) {
            throw new Error('OpenAI not configured');
        }

        // Always enforce English
        language = 'english';

        const template = this.industryTemplates[industry];
        if (!template) {
            throw new Error(`Industry template not found: ${industry}`);
        }

        const prompt = this.buildIndustryPrompt(lead, template, yourService, campaignStyle, language);
        
        try {
            const completion = await this.openai.chat.completions.create({
                model: getModel(),
                messages: [
                    {
                        role: "system",
                        content: this.getSystemPrompt(industry, campaignStyle, language)
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 3000,
                temperature: 0.6
            });

            return this.parseIndustryResponse(completion.choices[0].message.content);
        } catch (error) {
            console.error('Error generating industry-specific content:', error);
            return null;
        }
    }

    getSystemPrompt(industry, campaignStyle, language = 'english') {
        const styleInstructions = {
            conservative: "Respectful, trust-building tone. Focus on long-term relationship development.",
            balanced: "Balanced professionalism with warmth and approachability.",
            aggressive: "Direct, urgent, focus on immediate action and competitive advantage."
        };

        const marketData = this.marketData.pakistan;

        return `You are an expert Pakistani B2B sales specialist for the ${industry} sector.
You generate CALL PITCHES and WHATSAPP messages in Roman Urdu — the natural mix of Urdu written in English letters that Pakistani business owners speak and understand.

CULTURE & TONE:
- Pakistani business owners respond to respect ("aap"), warmth, relationship, and clear economic benefit (ROI).
- Avoid corporate jargon or robotic translations (like "digital transformation aapki madad karegi").
- Use highly practical, conversational, street-smart sales language that a real Business Development (BD) representative would use in Pakistan.
- Use natural business terms: "galla barhana", "counter sale", "direct customer check-in", "competitor aagay nikal raha hai", "yeh kharcha nahi investment hai", "bina risk ke trust", "milestone payment / installments".

STYLE: ${styleInstructions[campaignStyle] || styleInstructions.balanced}

REAL PAKISTAN MARKET DATA:
- Digital Adoption: ${marketData.digitalAdoption}
- E-commerce Growth: ${marketData.ecommerceGrowth}
- Payment: ${marketData.paymentMethods}
- Social: ${marketData.socialMedia}
- ${industry} Market Size: ${marketData.marketSize[industry]}

OUTPUT FORMAT:
Generate two sections: CALL PITCH TEMPLATE and WHATSAPP TEMPLATE.

CALL PITCH TEMPLATE rules:
- 30-60 seconds spoken script (as if you are calling them right now)
- Roman Urdu throughout
- Start with greeting + intro (naam + company)
- Mention their specific business problem
- Offer your solution briefly
- Ask for a follow-up time ("kya aap kal 10 baje free hain?")
- DO NOT be salesy or pushy — be helpful

WHATSAPP MESSAGE rules:
- Roman Urdu throughout
- Short, 3-5 lines max
- Friendly opener + one key benefit + CTA
- Use 1-2 relevant emojis
- End with your contact number or name`;
    }

    buildIndustryPrompt(lead, template, yourService, campaignStyle, language = 'english') {
        const marketData = this.marketData.pakistan;
        const biz = getBusinessInfoForPrompt();

        const bizInfoSection = `YOUR BUSINESS INFO:
- Business Name: ${biz.name}
- Business Type: ${biz.type}
- Description: ${biz.description}
- Phone: ${biz.phone}
- Website: ${biz.website}
${biz.valuePropositions.length > 0 ? `- Value Propositions: ${biz.valuePropositions.join(', ')}` : ''}`;

        return `Generate a personalized CALL PITCH and WHATSAPP MESSAGE in Roman Urdu for this Pakistani ${template.industry} business:

TARGET BUSINESS:
- Name: ${lead.name}
- Address: ${lead.address}
- Phone: ${lead.phone}
- Rating: ${lead.rating || 'N/A'}
- Website: ${lead.website || 'No website'}

SERVICE TO OFFER: ${yourService || biz.description}

${bizInfoSection}

INDUSTRY PAIN POINTS (use 1-2 in pitch):
${template.painPoints.slice(0, 3).join('\n')}

SOLUTIONS YOU PROVIDE (mention briefly):
${template.solutions.slice(0, 2).join('\n')}

KEY BENEFITS TO HIGHLIGHT:
${template.benefits.slice(0, 2).join('\n')}

LOCAL CASE STUDY: ${template.caseStudy}
URGENCY: ${template.urgency}
MARKAT DATA: ${marketData.marketSize[template.industry] || marketData.marketSize.professional}

Campaign Style: ${campaignStyle}

NOW GENERATE:

CALL PITCH TEMPLATE:
[Write a 30-60 second call script in Roman Urdu, starting with Assalam o Alaikum, then your name/company intro, then mention their specific business situation, then your solution, then ask for meeting/callback time]

WHATSAPP TEMPLATE:
[Write a short 3-5 line WhatsApp message in Roman Urdu with emojis, be friendly and helpful, end with a clear CTA]

ALL sections must be in Roman Urdu (Urdu written in English letters). Make them feel personal, practical, and highly persuasive for a B2B sale.`;
    }

    parseIndustryResponse(response) {
        // Try to split on section headers
        const callMatch = response.match(/CALL PITCH TEMPLATE[:\s]*([\/\S\s]*?)(?=WHATSAPP TEMPLATE|$)/i);
        const waMatch = response.match(/WHATSAPP TEMPLATE[:\s]*([\/\S\s]*?)$/i);

        let callPitch = callMatch ? callMatch[1].trim() : '';
        let whatsappContent = waMatch ? waMatch[1].trim() : '';

        // Fallback line-by-line parser
        if (!callPitch && !whatsappContent) {
            const lines = response.split('\n');
            let currentSection = '';
            for (const line of lines) {
                const lower = line.toLowerCase();
                if (lower.includes('call pitch')) { currentSection = 'call'; continue; }
                if (lower.includes('whatsapp')) { currentSection = 'whatsapp'; continue; }
                
                if (currentSection === 'call' && line.trim()) callPitch += line + '\n';
                if (currentSection === 'whatsapp' && line.trim()) whatsappContent += line + '\n';
            }
        }

        return {
            callPitch: this.cleanTemplate(callPitch),
            whatsapp: this.cleanTemplate(whatsappContent),
            objections: [],
            industry: true,
            generated: new Date().toISOString()
        };
    }

    cleanTemplate(content) {
        return content
            .replace(/^[^\w\n]*/, '')
            .replace(/CALL PITCH TEMPLATE:?/gi, '')
            .replace(/WHATSAPP TEMPLATE:?/gi, '')
            .trim();
    }

    async generateMultiTouchSequence(lead, industry, yourService, language = 'english') {
        language = 'english';
        const sequences = {
            whatsapp1: await this.generateIndustrySpecificContent(lead, industry, yourService, 'conservative', language),
            whatsapp2: await this.generateIndustrySpecificContent(lead, industry, yourService, 'balanced', language),
            whatsapp3: await this.generateIndustrySpecificContent(lead, industry, yourService, 'aggressive', language)
        };

        return sequences;
    }


    getIndustryInsights(industry) {
        const template = this.industryTemplates[industry];
        if (!template) return null;

        return {
            painPoints: template.painPoints,
            solutions: template.solutions,
            benefits: template.benefits,
            localContext: template.localContext,
            urgency: template.urgency,
            marketSize: this.getMarketSize(industry)
        };
    }

    getMarketSize(industry, language = 'english') {
        const marketData = {
            pakistan: {
                restaurant: "PKR 1.2 Trillion F&B and restaurant market, growing 10% annually",
                automotive: "PKR 2.8 Trillion transport and rental market, ride-hailing $2.5B",
                retail: "PKR 4.5 Trillion retail and clothing market, e-commerce growth 15% YoY",
                professional: "PKR 1.5 Trillion professional services, digital agency market up 35% YoY",
                healthcare: "PKR 2.5 Trillion healthcare and clinic sector, digital adoption up 300%",
                education: "PKR 1.4 Trillion education market, LMS and online training growing 25% YoY",
                realestate: "PKR 30 Trillion property and real estate market, PropTech adoption 15%"
            },
            global: {
                restaurant: "$4.2T global food service market, 8.7% digital ordering growth",
                automotive: "$2.9T automotive market, 23% EV adoption rate",
                retail: "$26.7T global retail, 19.6% e-commerce penetration",
                healthcare: "$8.3T healthcare market, 38% digital health adoption",
                education: "$6.2T education market, 15.3% EdTech penetration",
                realestate: "$3.7T real estate market, 12% PropTech adoption"
            }
        };

        const langData = marketData.pakistan;
        return langData[industry] || "Growing market opportunity in Pakistan";
    }

    // New method to get available languages
    getAvailableLanguages() {
        return [
            { code: 'english', name: 'English', flag: '🇺🇸' }
        ];
    }

    // New method to get campaign styles with descriptions
    getCampaignStyles(language = 'english') {
        return [
            {
                code: 'conservative',
                name: 'Conservative',
                description: 'Respectful, professional, gradual trust building'
            },
            {
                code: 'balanced',
                name: 'Balanced',
                description: 'Standard business approach with professional friendliness'
            },
            {
                code: 'aggressive',
                name: 'Aggressive',
                description: 'Direct, urgent, immediate action focused'
            }
        ];
    }

    // Enhanced method to get industry list with descriptions
    getAvailableIndustries(language = 'english') {
        const industries = Object.keys(this.industryTemplates);
        
        const descriptions = {
            english: {
                restaurant: 'Restaurant & F&B',
                automotive: 'Automotive & Transportation',
                retail: 'Retail & E-commerce',
                professional: 'Professional Services',
                healthcare: 'Healthcare & Clinics',
                education: 'Education & Training',
                realestate: 'Real Estate & Property'
            }
        };

        const langDesc = descriptions.english;
        
        return industries.map(industry => ({
            code: industry,
            name: langDesc[industry] || industry,
            marketSize: this.getMarketSize(industry, language)
        }));
    }

    // Method to validate and enhance lead data
    validateAndEnhanceLead(lead) {
        const enhanced = {
            name: lead.name || 'Business Owner',
            address: lead.address || 'Pakistan',
            phone: lead.phone || 'N/A',
            rating: lead.rating || 'N/A',
            website: lead.website || null,
            // Add enhancement based on available data
            businessSize: this.estimateBusinessSize(lead),
            digitalMaturity: this.assessDigitalMaturity(lead),
            urgencyScore: this.calculateUrgencyScore(lead)
        };

        return enhanced;
    }

    estimateBusinessSize(lead) {
        // Simple heuristic based on available data
        if (lead.website && lead.rating > 4.0) return 'medium-large';
        if (lead.website || lead.rating > 3.5) return 'small-medium';
        return 'small';
    }

    assessDigitalMaturity(lead) {
        let score = 0;
        if (lead.website) score += 3;
        if (lead.rating && lead.rating > 4.0) score += 2; // Good online presence
        if (lead.phone && lead.phone.includes('WhatsApp')) score += 1;
        
        if (score >= 4) return 'high';
        if (score >= 2) return 'medium';
        return 'low';
    }

    calculateUrgencyScore(lead) {
        let urgency = 5; // Base urgency
        
        // Increase urgency for businesses that need digital transformation
        if (!lead.website) urgency += 3;
        if (lead.rating && lead.rating < 3.5) urgency += 2;
        
        return Math.min(urgency, 10); // Cap at 10
    }
}

module.exports = MarketingAI;