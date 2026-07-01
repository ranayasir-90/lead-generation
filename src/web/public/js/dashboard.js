// ═══════════════════════════════════════════════════════════
// Main Dashboard Application
// ═══════════════════════════════════════════════════════════

class Dashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.dashboardData = null;
        this.campaigns = [];
        this.currentCampaign = null;
        this.leadsTable = null;
        this.progressManager = null;
        this.eventSource = null;
        
        this.init();
    }

    async init() {
        this.initTheme();
        this.initSidebar();
        this.setupEventListeners();
        this.setupMobileNav();
        this.setupRealTimeUpdates();
        this.progressManager = new ProgressManager('campaignProgressModal');
        
        await this.loadDashboard();
        await this.loadCampaigns();
    }

    initSidebar() {
        const savedSidebarCollapsed = localStorage.getItem('sidebarCollapsed');
        if (savedSidebarCollapsed === 'true' && window.innerWidth > 1024) {
            document.body.classList.add('sidebar-collapsed');
        }
    }

    // ─── Theme Management ───────────────────────────────────
    initTheme() {
        const saved = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = saved || (prefersDark ? 'dark' : 'dark'); // default dark
        this.setTheme(theme);

        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.addEventListener('click', () => {
                const current = document.documentElement.getAttribute('data-theme');
                this.setTheme(current === 'light' ? 'dark' : 'light');
            });
        }
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        // Update theme-color meta
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            meta.content = theme === 'dark' ? '#0f1117' : '#f0f2f5';
        }

        // Toggle sun/moon icons
        const moon = document.querySelector('.icon-moon');
        const sun = document.querySelector('.icon-sun');
        if (moon && sun) {
            if (theme === 'light') {
                moon.style.display = 'none';
                sun.style.display = 'block';
            } else {
                moon.style.display = 'block';
                sun.style.display = 'none';
            }
        }
    }

    // ─── Mobile Navigation ──────────────────────────────────
    setupMobileNav() {
        const hamburger = document.getElementById('hamburgerBtn');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');

        if (hamburger) {
            hamburger.addEventListener('click', () => {
                if (window.innerWidth > 1024) {
                    document.body.classList.toggle('sidebar-collapsed');
                    const isCollapsed = document.body.classList.contains('sidebar-collapsed');
                    localStorage.setItem('sidebarCollapsed', isCollapsed ? 'true' : 'false');
                } else {
                    sidebar.classList.toggle('open');
                    overlay.classList.toggle('active');
                    hamburger.classList.toggle('open');
                }
            });
        }

        if (overlay) {
            overlay.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        }

        // Bottom nav items
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                if (section) this.showSection(section);
            });
        });
    }

    closeMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        const hamburger = document.getElementById('hamburgerBtn');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
        if (hamburger) hamburger.classList.remove('open');
    }

    // ─── Event Listeners ────────────────────────────────────
    setupEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.sidebar .nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                if (section) this.showSection(section);
            });
        });
    }

    // ─── Section Navigation ─────────────────────────────────
    showSection(sectionName) {
        this.currentSection = sectionName;

        // Update sidebar active state
        document.querySelectorAll('.sidebar .nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === sectionName);
        });

        // Update bottom nav active state
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === sectionName);
        });

        // Show/hide sections with animation
        document.querySelectorAll('.section').forEach(section => {
            const isTarget = section.id === `section-${sectionName}`;
            section.classList.toggle('active', isTarget);
            if (isTarget) {
                // Re-trigger animation
                section.style.animation = 'none';
                section.offsetHeight; // force reflow
                section.style.animation = '';
            }
        });

        // Close mobile menu
        this.closeMobileMenu();

        // Load section data
        if (sectionName === 'analytics') this.loadAnalytics();
        if (sectionName === 'leads') this.loadLeadsSection();
        if (sectionName === 'campaigns') this.loadCampaigns();
        if (sectionName === 'pipeline') this.loadPipelineSection();
    }

    // ─── Real-Time Updates (SSE) ────────────────────────────
    setupRealTimeUpdates() {
        try {
            this.eventSource = new EventSource('/api/events');

            this.eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleSSEEvent(data);
                } catch (e) { /* ignore parse errors */ }
            };

            this.eventSource.onerror = () => {
                setTimeout(() => this.setupRealTimeUpdates(), 5000);
            };
        } catch (e) {
            console.log('SSE not available');
        }
    }

    handleSSEEvent(data) {
        switch (data.type) {
            case 'campaign_started':
                showNotification('Campaign Started', data.message, 'info');
                break;
            case 'campaign_progress':
                if (this.progressManager) {
                    this.progressManager.updateProgress(data.progress, data.message);
                }
                break;
            case 'campaign_completed':
                showNotification('Campaign Complete', data.message, 'success');
                if (this.progressManager) {
                    this.progressManager.complete(data.results);
                }
                this.loadDashboard();
                this.loadCampaigns();
                break;
            case 'campaign_failed':
                showNotification('Campaign Failed', data.message, 'error');
                if (this.progressManager) {
                    this.progressManager.error(data.message);
                }
                break;
        }
    }

    // ═══════════════════════════════════════════════════════
    // DATA LOADING
    // ═══════════════════════════════════════════════════════

    async loadDashboard() {
        try {
            const data = await api.getDashboard();
            this.dashboardData = data;
            this.renderDashboard(data);
        } catch (error) {
            api.handleError(error, 'loading dashboard');
        }
    }

    async loadCampaigns() {
        try {
            const campaigns = await api.getCampaigns();
            this.campaigns = campaigns;
            this.renderCampaigns(campaigns);
            this.updateCampaignSelect(campaigns);
            
            // Update campaign count badge
            const badge = document.getElementById('campaignCount');
            if (badge) badge.textContent = campaigns.length;
        } catch (error) {
            api.handleError(error, 'loading campaigns');
        }
    }

    async loadLeadsSection() {
        // Just make sure the campaign select is populated
        if (this.campaigns.length === 0) {
            await this.loadCampaigns();
        }
    }

    async loadLeadsForCampaign(campaignId) {
        const searchInput = document.getElementById('leadSearchInput');
        if (searchInput) {
            searchInput.value = '';
            searchInput.style.display = campaignId ? 'block' : 'none';
        }

        if (!campaignId) {
            this.allLeads = [];
            const container = document.getElementById('leadsTableContainer');
            container.innerHTML = `
                <div class="card" style="text-align: center; padding: 3rem">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    width="48"
                    height="48"
                    style="opacity: 0.3; margin-bottom: 1rem"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <p class="empty-title">No Leads Loaded</p>
                  <p class="empty-message">
                    Select a campaign above to view its leads
                  </p>
                </div>
            `;
            return;
        }
        
        const container = document.getElementById('leadsTableContainer');
        container.innerHTML = '<div class="loading">Loading leads...</div>';

        try {
            const data = await api.getLeads(campaignId);
            this.currentCampaign = campaignId;
            this.allLeads = (data.leads || []).map((lead, idx) => {
                lead.originalIndex = idx;
                return lead;
            });
            this.renderLeadsTable(this.allLeads, campaignId);
        } catch (error) {
            api.handleError(error, 'loading leads');
            container.innerHTML = '<div class="card" style="text-align:center;padding:2rem"><p class="empty-title">Failed to load leads</p></div>';
        }
    }

    handleLeadSearch(query) {
        if (!this.allLeads) return;
        
        const lowercaseQuery = query.toLowerCase().trim();
        
        if (!lowercaseQuery) {
            this.renderLeadsTable(this.allLeads, this.currentCampaign);
            return;
        }
        
        const filteredLeads = this.allLeads.filter(lead => {
            const name = (lead.name || '').toLowerCase();
            const phone = (lead.phone || '').toLowerCase();
            const address = (lead.address || '').toLowerCase();
            const website = (lead.website || '').toLowerCase();
            const score = lead.intelligence && lead.intelligence.score ? String(lead.intelligence.score) : '';
            const status = (lead.status || 'New Lead').toLowerCase();
            
            return name.includes(lowercaseQuery) ||
                   phone.includes(lowercaseQuery) ||
                   address.includes(lowercaseQuery) ||
                   website.includes(lowercaseQuery) ||
                   score.includes(lowercaseQuery) ||
                   status.includes(lowercaseQuery);
        });
        
        this.renderLeadsTable(filteredLeads, this.currentCampaign);
    }

    async loadAnalytics() {
        try {
            const data = await api.getAnalytics();
            this.renderAnalytics(data);
        } catch (error) {
            api.handleError(error, 'loading analytics');
        }
    }

    // ═══════════════════════════════════════════════════════
    // RENDERING
    // ═══════════════════════════════════════════════════════

    renderDashboard(data) {
        const { overview, recentActivity } = data;

        // Stat cards
        const statsGrid = document.getElementById('statsGrid');
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Total Campaigns</span>
                    <div class="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>
                    </div>
                </div>
                <div class="stat-value">${api.formatNumber(overview.totalCampaigns)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Total Leads</span>
                    <div class="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                </div>
                <div class="stat-value">${api.formatNumber(overview.totalLeads)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">High Score Leads</span>
                    <div class="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    </div>
                </div>
                <div class="stat-value">${api.formatNumber(overview.totalHighScoreLeads)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Avg Score</span>
                    <div class="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    </div>
                </div>
                <div class="stat-value">${overview.averageScore}</div>
            </div>
        `;

        // Recent activity
        const activityList = document.getElementById('activityList');
        if (recentActivity && recentActivity.length > 0) {
            activityList.innerHTML = recentActivity.map(activity => `
                <div class="activity-item" onclick="dashboard.showCampaignDetail('${activity.id}')">
                    <div class="activity-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>
                    </div>
                    <div class="activity-info">
                        <div class="activity-name">${api.safeString(activity.name)}</div>
                        <div class="activity-meta">${api.safeString(activity.industry)} · ${api.formatDateSafe(activity.executedAt)}</div>
                    </div>
                    <div class="activity-stats">
                        <span class="activity-stat">${activity.totalLeads} leads</span>
                        <span class="activity-stat highlight">${activity.highScoreLeads} high score</span>
                    </div>
                </div>
            `).join('');
        } else {
            activityList.innerHTML = `
                <div class="card" style="text-align:center; padding:2rem">
                    <p class="empty-title">No campaigns yet</p>
                    <p class="empty-message">Create your first campaign to get started</p>
                </div>
            `;
        }
    }

    renderCampaigns(campaigns) {
        const grid = document.getElementById('campaignsGrid');

        if (!campaigns || campaigns.length === 0) {
            grid.innerHTML = `
                <div class="card" style="text-align:center; padding:3rem; grid-column:1/-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="48" height="48" style="opacity:0.3;margin-bottom:1rem"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>
                    <p class="empty-title">No Campaigns</p>
                    <p class="empty-message">Launch your first campaign to start generating leads</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = campaigns.map(campaign => {
            const status = campaign.results ? 'completed' : 'running';
            return `
                <div class="campaign-card" onclick="dashboard.showCampaignDetail('${campaign.id}')">
                    <div class="campaign-card-header">
                        <span class="campaign-card-title">${api.safeString(campaign.name)}</span>
                        <span class="campaign-card-badge ${status}">${status}</span>
                    </div>
                    <div class="campaign-card-meta">
                        <span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            ${api.formatDateSafe(campaign.executedAt)}
                        </span>
                        <span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                            ${api.safeString(campaign.industry)} · ${api.safeString(campaign.location || '')}
                        </span>
                    </div>
                    <div class="campaign-card-stats">
                        <div class="campaign-stat">
                            <div class="campaign-stat-value">${api.formatNumber(campaign.results?.totalLeads || 0)}</div>
                            <div class="campaign-stat-label">Leads</div>
                        </div>
                        <div class="campaign-stat">
                            <div class="campaign-stat-value">${api.formatNumber(campaign.results?.highScoreLeads || campaign.results?.priorityLeads || 0)}</div>
                            <div class="campaign-stat-label">High Score</div>
                        </div>
                        <div class="campaign-stat">
                            <div class="campaign-stat-value">${campaign.results?.averageScore || 0}</div>
                            <div class="campaign-stat-label">Avg Score</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderLeadsTable(leads, campaignId) {
        const container = document.getElementById('leadsTableContainer');

        if (!leads || leads.length === 0) {
            container.innerHTML = `
                <div class="card" style="text-align:center; padding:3rem">
                    <p class="empty-title">No leads found</p>
                    <p class="empty-message">This campaign has no leads data</p>
                </div>
            `;
            return;
        }

        this.leadsTable = new DataTable(container, {
            campaignId,
            columns: [
                { key: 'name', title: 'Business Name', type: 'text' },
                { key: 'phone', title: 'Phone', type: 'text' },
                { 
                    key: 'address', 
                    title: 'Address', 
                    type: 'text',
                    formatter: (value, rowData) => {
                        if (rowData.referenceLink) {
                            return `<a href="${rowData.referenceLink}" target="_blank" class="maps-link" style="color:var(--primary);text-decoration:underline">${api.safeString(value || 'View on Maps')}</a>`;
                        }
                        return api.safeString(value);
                    }
                },
                { 
                    key: 'website', 
                    title: 'Website Status', 
                    type: 'text',
                    formatter: (value, rowData) => {
                        if (value && value !== 'N/A' && value.trim() !== '') {
                            return `<a href="${value}" target="_blank" style="color:var(--primary);text-decoration:underline;font-weight:500">Website Available</a>`;
                        }
                        return `<span style="color:var(--text-muted);opacity:0.7">No Website</span>`;
                    }
                },
                { key: 'intelligence.score', title: 'Score', type: 'score' },
                { 
                    key: 'status', 
                    title: 'Status', 
                    type: 'text',
                    formatter: (value, rowData, rowIndex) => {
                        const status = dashboard.mapStatus(value);
                        const options = ['New', 'In Progress', 'Proposal Sent', 'Negotiation', 'Closed Won', 'Closed Lost'];
                        
                        return `
                            <select class="status-select" onchange="dashboard.updateLeadStatus('${campaignId}', ${rowData.originalIndex !== undefined ? rowData.originalIndex : rowIndex}, this.value)" style="padding:0.25rem 0.5rem;border-radius:4px;border:1px solid var(--border);background:var(--bg-card);color:var(--text);font-size:0.8rem;outline:none;cursor:pointer">
                                ${options.map(opt => `<option value="${opt}" ${opt === status ? 'selected' : ''}>${opt}</option>`).join('')}
                            </select>
                        `;
                    }
                }
            ],
            data: leads,
            pagination: true,
            pageSize: 10,
            sortable: true,
            onRowClick: (rowData, rowIndex) => {
                const leadIndex = rowData.originalIndex !== undefined ? rowData.originalIndex : rowIndex;
                this.showLeadDetail(rowData, campaignId, leadIndex);
            }
        });

        this.leadsTable.render();
    }

    renderAnalytics(data) {
        const { campaignTrends, industryStats, qualityDistribution } = data;

        // Trend cards
        const trendsContainer = document.getElementById('analyticsTrends');
        trendsContainer.innerHTML = `
            <div class="trend-card">
                <div class="trend-value">${api.formatNumber(campaignTrends.totalCampaigns)}</div>
                <div class="trend-label">Total Campaigns</div>
            </div>
            <div class="trend-card">
                <div class="trend-value">${api.formatNumber(campaignTrends.recentCampaigns)}</div>
                <div class="trend-label">Last 30 Days</div>
            </div>
            <div class="trend-card">
                <div class="trend-value">${api.formatNumber(campaignTrends.totalLeads)}</div>
                <div class="trend-label">All Leads</div>
            </div>
            <div class="trend-card">
                <div class="trend-value">${campaignTrends.avgQualityScore}</div>
                <div class="trend-label">Avg Quality</div>
            </div>
        `;

        // Industry chart
        const industryContent = document.getElementById('industryChartContent');
        const industryData = Object.entries(industryStats).map(([label, stats]) => ({
            label: label.charAt(0).toUpperCase() + label.slice(1),
            value: stats.totalLeads
        }));
        SimpleChart.createBarChart(industryContent, industryData, {
            title: '',
            color: '#6366f1'
        });

        // Quality distribution chart
        const qualityContent = document.getElementById('qualityChartContent');
        const qualityData = Object.entries(qualityDistribution).map(([label, value]) => ({
            label,
            value
        }));
        SimpleChart.createPieChart(qualityContent, qualityData, { title: '' });
    }

    // ═══════════════════════════════════════════════════════
    // CAMPAIGN ACTIONS
    // ═══════════════════════════════════════════════════════

    async createCampaign(event) {
        event.preventDefault();
        
        const form = document.getElementById('newCampaignForm');
        const formData = new FormData(form);
        const campaignData = Object.fromEntries(formData.entries());

        // Validate
        const missingFields = [];
        if (!campaignData.name) missingFields.push('Campaign Name');
        if (!campaignData.industry) missingFields.push('Target Industry');
        if (!campaignData.location) missingFields.push('Location');
        if (!campaignData.searchQuery) missingFields.push('Search Query');
        if (!campaignData.yourService) missingFields.push('Your Service Description');

        if (missingFields.length > 0) {
            showNotification('Validation Error', `Please fill in: ${missingFields.join(', ')}`, 'warning');
            console.warn("Validation failed. Missing fields:", missingFields, "Form data:", campaignData);
            return;
        }

        try {
            hideModal();
            
            // Show progress modal
            this.progressManager.show(campaignData.name);

            const result = await api.createCampaign(campaignData);
            
            if (result.success) {
                showNotification('Campaign Launched', `Campaign "${campaignData.name}" is running`, 'success');
                form.reset();
            }
        } catch (error) {
            api.handleError(error, 'creating campaign');
            if (this.progressManager) {
                this.progressManager.error(error.message);
            }
        }
    }

    async showCampaignDetail(campaignId) {
        const content = document.getElementById('campaignDetailContent');
        content.innerHTML = '<div class="loading">Loading campaign details...</div>';
        showModal('campaignDetailModal');

        try {
            const campaign = await api.getCampaignDetail(campaignId);
            const cacheCampaign = this.campaigns.find(c => c.id === campaignId);
            if (cacheCampaign) {
                cacheCampaign.leads = campaign.leads;
            }
            this.renderCampaignDetail(campaign);
        } catch (error) {
            content.innerHTML = '<p class="empty-title">Failed to load campaign details</p>';
            api.handleError(error, 'loading campaign details');
        }
    }

    renderCampaignDetail(campaign) {
        const content = document.getElementById('campaignDetailContent');
        
        content.innerHTML = `
            <div class="campaign-detail-grid">
                <div class="detail-item">
                    <div class="detail-label">Campaign Name</div>
                    <div class="detail-value">${api.safeString(campaign.name)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Industry</div>
                    <div class="detail-value">${api.safeString(campaign.industry)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Location</div>
                    <div class="detail-value">${api.safeString(campaign.location || 'N/A')}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Executed</div>
                    <div class="detail-value">${api.formatDateSafe(campaign.executedAt)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Total Leads</div>
                    <div class="detail-value">${api.formatNumber(campaign.results?.totalLeads || 0)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">High Score Leads</div>
                    <div class="detail-value">${api.formatNumber(campaign.results?.highScoreLeads || campaign.results?.priorityLeads || 0)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Avg Score</div>
                    <div class="detail-value">${campaign.results?.averageScore || 0}/100</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Pitches Ready</div>
                    <div class="detail-value">${(campaign.leads || []).filter(l => l.intelligence?.marketingContent).length} / ${(campaign.leads || []).length} leads</div>
                </div>
            </div>
            ${campaign.leads && campaign.leads.length > 0 ? `
                <h4 style="margin-bottom:var(--space-md);font-weight:600">Campaign Leads (${campaign.leads.length})</h4>
                ${campaign.leads.map((lead, index) => this.renderLeadCard(lead, campaign.id, index)).join('')}
            ` : ''}
        `;
    }

    renderLeadCard(lead, campaignId, index) {
        const score = lead.intelligence?.score || 0;
        const hasContent = lead.intelligence?.marketingContent;

        return `
            <div class="card lead-card-item" onclick="dashboard.showLeadDetailFromCampaign('${campaignId}', ${index}, event)" style="margin-bottom:var(--space-sm);padding:var(--space-md);cursor:pointer;transition:border-color var(--duration) var(--ease)">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-xs)">
                    <strong style="font-size:0.9rem">${api.safeString(lead.name)}</strong>
                    <div style="display:flex;gap:var(--space-xs);align-items:center">
                        <select class="status-select" onchange="dashboard.updateLeadStatus('${campaignId}', ${index}, this.value)" style="padding:0.1rem 0.3rem;border-radius:4px;border:1px solid var(--border);background:var(--bg-card);color:var(--text);font-size:0.75rem;outline:none;cursor:pointer">
                            ${['New', 'In Progress', 'Proposal Sent', 'Negotiation', 'Closed Won', 'Closed Lost'].map(opt => `<option value="${opt}" ${opt === dashboard.mapStatus(lead.status) ? 'selected' : ''}>${opt}</option>`).join('')}
                        </select>
                        <span class="score-badge" style="font-size: 0.8rem; padding: 0.15rem 0.5rem; border-radius: 4px; background: rgba(99, 102, 241, 0.15); color: #6366f1; font-weight: 600;">Score: ${score}</span>
                    </div>
                </div>
                <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:var(--space-sm)">
                    ${lead.phone ? `${api.safeString(lead.phone)} · ` : ''}
                    ${lead.referenceLink ? `
                        <a href="${lead.referenceLink}" target="_blank" class="maps-link" style="color:var(--text-muted);text-decoration:underline">${api.safeString(lead.address || 'View on Maps')}</a>
                    ` : api.safeString(lead.address || '')}
                </div>
                <div style="display:flex;gap:var(--space-xs);flex-wrap:wrap">
                    ${hasContent ? `
                        <button class="btn-vcard" onclick="dashboard.showMarketingContent(${JSON.stringify(lead.intelligence.marketingContent).replace(/"/g, '&quot;')}, '${api.safeString(lead.name).replace(/'/g, "\\'")}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            Content
                        </button>
                    ` : ''}
                    ${lead.phone ? `
                        <button class="btn-vcard" onclick="dashboard.openWhatsApp('${lead.phone}', ${hasContent ? JSON.stringify(lead.intelligence.marketingContent.whatsapp || '').replace(/"/g, '&quot;') : "''"})">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                            WhatsApp
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // ─── Marketing Content ──────────────────────────────────
    showMarketingContent(content, leadName) {
        const container = document.getElementById('marketingContent');
        
        const callPitch = content.callPitch || '';
        const whatsapp = content.whatsapp || content.whatsapp_message || '';

        container.innerHTML = `
            <h4 style="margin-bottom:var(--space-md);font-size:0.9rem;font-weight:600">Outreach for ${api.safeString(leadName)}</h4>
            ${callPitch ? `
                <div class="marketing-content" style="margin-bottom:var(--space-md)">
                    <div class="marketing-header"><h4>📞 Call Pitch (Roman Urdu)</h4></div>
                    <div class="marketing-body"><div class="content-preview" style="white-space:pre-wrap;line-height:1.7">${api.safeString(callPitch)}</div></div>
                    <div class="marketing-actions">
                        <button class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText(${JSON.stringify(callPitch).replace(/"/g, '&quot;')}).then(()=>showNotification('Copied','Call script copied!','success'))">
                            Copy Script
                        </button>
                    </div>
                </div>
            ` : ''}
            ${whatsapp ? `
                <div class="marketing-content" style="margin-bottom:var(--space-md)">
                    <div class="marketing-header"><h4>💬 WhatsApp (Roman Urdu)</h4></div>
                    <div class="marketing-body"><div class="content-preview" style="white-space:pre-wrap;line-height:1.7">${api.safeString(whatsapp)}</div></div>
                    <div class="marketing-actions">
                        <button class="btn btn-success btn-sm" onclick="navigator.clipboard.writeText(${JSON.stringify(whatsapp).replace(/"/g, '&quot;')}).then(()=>showNotification('Copied','Message copied!','success'))">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            Copy
                        </button>
                    </div>
                </div>
            ` : ''}
        `;

        showModal('marketingModal');
    }

    // ─── WhatsApp ───────────────────────────────────────────
    openWhatsApp(phone, message) {
        try {
            let cleanPhone = phone.replace(/[^0-9+]/g, '');
            if (cleanPhone.startsWith('0')) {
                cleanPhone = '92' + cleanPhone.substring(1);
            }
            const text = encodeURIComponent(message || '');
            const url = `https://wa.me/${cleanPhone}${text ? '?text=' + text : ''}`;
            window.open(url, '_blank');
            showNotification('WhatsApp', 'Opening WhatsApp...', 'success');
        } catch (error) {
            api.handleError(error, 'opening WhatsApp');
        }
    }


    async updateLeadStatus(campaignId, leadIndex, status) {
        try {
            const mapped = this.mapStatus(status);
            const result = await api.updateLeadDetails({
                campaignId,
                leadIndex,
                status: mapped
            });
            if (result.success) {
                if (this.allLeads && this.allLeads[leadIndex]) {
                    this.allLeads[leadIndex].status = mapped;
                }
                
                // Keep campaigns cache in sync
                const campaign = this.campaigns.find(c => c.id === campaignId);
                if (campaign && campaign.leads && campaign.leads[leadIndex]) {
                    campaign.leads[leadIndex].status = mapped;
                }
                
                showNotification('Status Updated', `Lead status updated to: ${mapped}`, 'success');
                
                // Rerender active tables to show the update
                if (this.leadsTable) {
                    this.leadsTable.render();
                }
                
                // Rerender active campaign details modal if open
                const detailModal = document.getElementById('campaignDetailModal');
                if (detailModal && detailModal.classList.contains('active') && campaign) {
                    this.renderCampaignDetail(campaign);
                }
                
                // Update select dropdown inside leadDetailModal if active and visible
                const leadDetailModal = document.getElementById('leadDetailModal');
                if (leadDetailModal && leadDetailModal.classList.contains('active')) {
                    const detailSelect = leadDetailModal.querySelector('.status-select');
                    if (detailSelect) {
                        detailSelect.value = mapped;
                    }
                }

                // If Kanban board is active, update it
                const pipelineSection = document.getElementById('section-pipeline');
                if (pipelineSection && pipelineSection.classList.contains('active') && campaign) {
                    this.renderKanbanBoard(campaign.leads, campaignId);
                }
            }
        } catch (error) {
            api.handleError(error, 'updating lead status');
        }
    }

    // Export functionality disabled

    // ─── Campaign Select ────────────────────────────────────
    updateCampaignSelect(campaigns) {
        const select = document.getElementById('campaignSelect');
        const pipelineSelect = document.getElementById('pipelineCampaignSelect');
        
        if (select) {
            const current = select.value;
            select.innerHTML = '<option value="">Select Campaign</option>' +
                campaigns.map(c => `<option value="${c.id}">${api.safeString(c.name)}</option>`).join('');
            if (current) select.value = current;
        }
        
        if (pipelineSelect) {
            const current = pipelineSelect.value;
            pipelineSelect.innerHTML = '<option value="">Select Campaign</option>' +
                campaigns.map(c => `<option value="${c.id}">${api.safeString(c.name)}</option>`).join('');
            if (current) pipelineSelect.value = current;
        }
    }

    // ─── Lead Details Modal Views ────────────────────────────
    showLeadDetail(lead, campaignId, leadIndex) {
        const content = document.getElementById('leadDetailContent');
        if (!content) return;
        content.innerHTML = '<div class="loading">Loading lead details...</div>';
        showModal('leadDetailModal');

        const score = lead.intelligence?.score || 0;
        const scoreColor = api.getScoreColor(score);
        const scoreCategory = lead.intelligence?.category || api.getScoreCategory(score);
        
        // Build rating stars
        let ratingHtml = '';
        if (lead.rating) {
            ratingHtml = `
                <div class="lead-rating" title="Rating: ${lead.rating}">
                    <svg viewBox="0 0 24 24" width="14" height="14"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <span>${lead.rating}</span>
                </div>
            `;
        }

        // Build contact list values
        const phoneVal = lead.phone ? api.safeString(lead.phone) : null;
        const isActualPhone = phoneVal && !/^[A-Z0-9]{4}\+[A-Z0-9]{3}/i.test(phoneVal); 
        
        let mapsLinkHtml = '';
        if (lead.referenceLink) {
            mapsLinkHtml = `<a href="${lead.referenceLink}" target="_blank" style="color:var(--primary);text-decoration:underline;display:inline-flex;align-items:center;gap:4px">${api.safeString(lead.address || 'View on Google Maps')} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>`;
        } else {
            mapsLinkHtml = api.safeString(lead.address);
        }

        let websiteLinkHtml = '';
        if (lead.website && lead.website !== 'N/A' && lead.website.trim() !== '') {
            websiteLinkHtml = `<a href="${lead.website}" target="_blank" style="color:var(--primary);text-decoration:underline;display:inline-flex;align-items:center;gap:4px">${api.safeString(lead.website)} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>`;
        } else {
            websiteLinkHtml = `<span style="color:var(--text-muted);opacity:0.7">No Website Available</span>`;
        }

        // Prepopulate service text from campaign definition
        const campaign = this.campaigns.find(c => c.id === campaignId);
        const defaultService = campaign ? campaign.yourService || '' : '';

        // Build status select dropdown
        const status = this.mapStatus(lead.status);
        const options = ['New', 'In Progress', 'Proposal Sent', 'Negotiation', 'Closed Won', 'Closed Lost'];
        const statusSelectHTML = `
            <select class="status-select" onchange="dashboard.updateLeadStatus('${campaignId}', ${leadIndex}, this.value)" style="padding:0.35rem 0.75rem;border-radius:var(--radius-md);border:1px solid var(--border);background:var(--bg-elevated);color:var(--text-primary);font-size:0.85rem;outline:none;cursor:pointer;font-weight:600">
                ${options.map(opt => `<option value="${opt}" ${opt === status ? 'selected' : ''}>${opt}</option>`).join('')}
            </select>
        `;

        // Outreach copywriting HTML
        const marketing = lead.intelligence?.marketingContent;
        let marketingHtml = '';
        if (marketing) {
            const callPitch = marketing.callPitch || '';
            const whatsapp = marketing.whatsapp || marketing.whatsapp_message || '';

            marketingHtml = `
                <div class="lead-detail-section">
                    <h4>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        AI Outreach Pitches & Objection Handling
                    </h4>
                    <div class="marketing-materials-box">
                        ${(callPitch || whatsapp) ? `
                            <div class="tabs" style="margin-bottom:var(--space-md)">
                                ${callPitch ? `<button class="tab active" onclick="dashboard.switchLeadDetailTab(this, 'call-pitch-tab')">📞 Call Pitch</button>` : ''}
                                ${whatsapp ? `<button class="tab ${!callPitch ? 'active' : ''}" onclick="dashboard.switchLeadDetailTab(this, 'whatsapp-tab')">💬 WhatsApp</button>` : ''}
                            </div>
                        ` : ''}

                        <div id="call-pitch-tab" class="tab-content-pane" style="display:${callPitch ? 'block' : 'none'}">
                            ${callPitch ? `
                                <div class="marketing-content">
                                    <div class="marketing-header" style="font-size:0.8rem;color:var(--text-muted);font-weight:600">📞 Call Script (Roman Urdu)</div>
                                    <div class="marketing-body" style="background:var(--bg-base);padding:var(--space-md);border-radius:var(--radius-md);margin-top:var(--space-xs);max-height:260px;overflow-y:auto;font-size:0.82rem;white-space:pre-wrap;border:1px solid var(--border);line-height:1.7">${api.safeString(callPitch)}</div>
                                    <div style="display:flex;gap:var(--space-sm);margin-top:var(--space-sm);flex-wrap:wrap">
                                        ${phoneVal && isActualPhone ? `
                                            <a href="tel:${phoneVal}" class="btn btn-primary btn-sm" style="text-decoration:none">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13" style="margin-right:4px"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.13 14.88a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 4.11h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                                Call Now
                                            </a>
                                        ` : ''}
                                        <button class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText(${JSON.stringify(callPitch).replace(/"/g, '&quot;')}).then(()=>showNotification('Copied','Call script copied to clipboard','success'))">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13" style="margin-right:4px"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                            Copy Script
                                        </button>
                                    </div>
                                </div>
                            ` : ''}
                        </div>

                        <div id="whatsapp-tab" class="tab-content-pane" style="display:${!callPitch && whatsapp ? 'block' : 'none'}">
                            ${whatsapp ? `
                                <div class="marketing-content">
                                    <div class="marketing-header" style="font-size:0.8rem;color:var(--text-muted);font-weight:600">💬 WhatsApp Message (Roman Urdu)</div>
                                    <div class="marketing-body" style="background:var(--bg-base);padding:var(--space-md);border-radius:var(--radius-md);margin-top:var(--space-xs);max-height:200px;overflow-y:auto;font-size:0.82rem;white-space:pre-wrap;border:1px solid var(--border);line-height:1.7">${api.safeString(whatsapp)}</div>
                                    <div style="display:flex;gap:var(--space-sm);margin-top:var(--space-sm);flex-wrap:wrap">
                                        ${phoneVal ? `
                                            <button class="btn btn-success btn-sm" onclick="dashboard.openWhatsApp('${phoneVal}', ${JSON.stringify(whatsapp).replace(/"/g, '&quot;')})">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13" style="margin-right:4px"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                                                Send on WhatsApp
                                            </button>
                                        ` : ''}
                                        <button class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText(${JSON.stringify(whatsapp).replace(/"/g, '&quot;')}).then(()=>showNotification('Copied','WhatsApp message copied','success'))">
                                            Copy Message
                                        </button>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }

        content.innerHTML = `
            <div class="lead-detail-header-card">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:var(--space-md)">
                    <div>
                        <h3 class="lead-detail-title">${api.safeString(lead.name)}</h3>
                        <div class="lead-detail-meta">
                            ${ratingHtml}
                            <span class="lead-score-gauge" style="color:${scoreColor};font-weight:700">
                                Score: ${score}/100 (${scoreCategory})
                            </span>
                        </div>
                    </div>
                    <div>
                        ${statusSelectHTML}
                    </div>
                </div>
            </div>
            
            <div class="lead-detail-section">
                <h4>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Contact & Address
                </h4>
                <div class="lead-info-list">
                    <div class="lead-info-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        <div class="info-label">Phone:</div>
                        <div class="info-value">
                            ${phoneVal ? `
                                <span>${phoneVal}</span>
                                ${isActualPhone ? `
                                    <button class="btn-vcard" style="margin-left:var(--space-sm)" onclick="dashboard.openWhatsApp('${phoneVal}', ${marketing ? JSON.stringify(marketing.whatsapp || '').replace(/"/g, '&quot;') : "''"})">WhatsApp</button>
                                ` : ''}
                            ` : `<span style="color:var(--text-muted)">N/A</span>`}
                        </div>
                    </div>
                    <div class="lead-info-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        <div class="info-label">Address:</div>
                        <div class="info-value">${mapsLinkHtml}</div>
                    </div>
                    <div class="lead-info-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                        <div class="info-label">Website:</div>
                        <div class="info-value">${websiteLinkHtml}</div>
                    </div>
                </div>
            </div>





            <div class="lead-detail-section">
                <h4>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Pitch Generator Settings
                </h4>
                <div class="pitch-generator-box">
                    <div class="form-group" style="margin-bottom:0">
                        <label for="pitchServiceInput" style="font-weight:600;margin-bottom:6px">What service do you want to offer this lead?</label>
                        <div class="pitch-generator-input-group">
                            <input type="text" id="pitchServiceInput" class="pitch-generator-input" placeholder="e.g., Website development & digital marketing" value="${api.safeString(defaultService)}" />
                            <button id="generatePitchBtn" class="btn btn-primary btn-sm" onclick="dashboard.generatePersonalizedPitch('${campaignId}', ${leadIndex})">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" style="margin-right:4px"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                                Generate Pitch
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            ${marketingHtml}
        `;
    }

    async generatePersonalizedPitch(campaignId, leadIndex) {
        const input = document.getElementById('pitchServiceInput');
        const btn = document.getElementById('generatePitchBtn');
        if (!input || !btn) return;

        const serviceText = input.value.trim();
        if (!serviceText) {
            showNotification('Validation Error', 'Please enter the service you want to offer.', 'warning');
            return;
        }

        // Set button loading state
        const originalBtnHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner" style="display:inline-block;width:12px;height:12px;border:2px solid currentColor;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin-right:6px"></span>Generating...';

        try {
            const result = await api.generateLeadPitch(campaignId, leadIndex, serviceText);
            if (result.success && result.lead) {
                showNotification('Pitch Generated', 'Personalized pitch generated successfully!', 'success');
                
                // Update local memory
                if (this.allLeads && this.allLeads[leadIndex]) {
                    this.allLeads[leadIndex] = result.lead;
                }
                const campaign = this.campaigns.find(c => c.id === campaignId);
                if (campaign && campaign.leads && campaign.leads[leadIndex]) {
                    campaign.leads[leadIndex] = result.lead;
                }

                // Re-render Lead Details Modal to display new copies
                this.showLeadDetail(result.lead, campaignId, leadIndex);
                
                // Keep the input value persistent in UI
                const newInput = document.getElementById('pitchServiceInput');
                if (newInput) newInput.value = serviceText;
                
                // Rerender active campaign details modal or DataTable to keep in sync
                if (this.leadsTable) {
                    this.leadsTable.render();
                }
                if (campaign) {
                    const detailModal = document.getElementById('campaignDetailModal');
                    if (detailModal && detailModal.classList.contains('active')) {
                        this.renderCampaignDetail(campaign);
                    }
                }
            }
        } catch (error) {
            api.handleError(error, 'generating personalized pitch');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalBtnHTML;
        }
    }

    showLeadDetailFromCampaign(campaignId, index, event) {
        if (event && event.target.closest('a, select, button, input, label')) {
            return;
        }
        const campaign = this.campaigns.find(c => c.id === campaignId);
        if (campaign && campaign.leads && campaign.leads[index]) {
            this.showLeadDetail(campaign.leads[index], campaignId, index);
        }
    }

    switchLeadDetailTab(buttonEl, tabPaneId) {
        const parent = buttonEl.parentNode;
        parent.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        buttonEl.classList.add('active');
        
        const container = parent.parentNode;
        container.querySelectorAll('.tab-content-pane').forEach(pane => pane.style.display = 'none');
        const activePane = document.getElementById(tabPaneId);
        if (activePane) activePane.style.display = 'block';
    }

    // ─── Pipeline (Kanban) and Sales Automation Helpers ──────

    mapStatus(status) {
        if (!status) return 'New';
        const s = status.trim();
        if (s === 'New Lead') return 'New';
        if (s === 'Contacted') return 'In Progress';
        if (s === 'Interested') return 'Negotiation';
        if (s === 'Not Interested') return 'Closed Lost';
        return s;
    }

    async loadPipelineSection() {
        if (this.campaigns.length === 0) {
            await this.loadCampaigns();
        }
    }

    async loadPipelineForCampaign(campaignId) {
        const board = document.getElementById('kanbanBoard');
        if (!board) return;

        if (!campaignId) {
            board.innerHTML = `
                <div class="card" style="text-align: center; padding: 3rem; width: 100%">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    width="48"
                    height="48"
                    style="opacity: 0.3; margin-bottom: 1rem"
                  >
                    <rect x="3" y="3" width="7" height="9" />
                    <rect x="14" y="3" width="7" height="9" />
                    <rect x="14" y="16" width="7" height="5" />
                    <rect x="3" y="16" width="7" height="5" />
                  </svg>
                  <p class="empty-title">No Pipeline Loaded</p>
                  <p class="empty-message">
                    Select a campaign above to view its pipeline board
                  </p>
                </div>
            `;
            return;
        }

        board.innerHTML = '<div class="loading">Loading pipeline...</div>';

        try {
            const campaign = await api.getCampaignDetail(campaignId);
            const cacheCampaign = this.campaigns.find(c => c.id === campaignId);
            if (cacheCampaign) {
                cacheCampaign.leads = campaign.leads;
            }
            const leads = (campaign.leads || []).map((lead, idx) => {
                lead.originalIndex = idx;
                return lead;
            });

            // Map old statuses to new pipeline stages
            leads.forEach(lead => {
                lead.status = this.mapStatus(lead.status);
            });

            this.renderKanbanBoard(leads, campaignId);
        } catch (error) {
            api.handleError(error, 'loading pipeline');
            board.innerHTML = '<div class="card" style="text-align:center;padding:2rem"><p class="empty-title">Failed to load pipeline</p></div>';
        }
    }

    renderKanbanBoard(leads, campaignId) {
        const board = document.getElementById('kanbanBoard');
        if (!board) return;

        const stages = ['New', 'In Progress', 'Proposal Sent', 'Negotiation', 'Closed Won', 'Closed Lost'];
        const stageColors = {
            'New': 'var(--primary)',
            'In Progress': 'var(--warning)',
            'Proposal Sent': '#8b5cf6',
            'Negotiation': 'var(--accent)',
            'Closed Won': 'var(--success)',
            'Closed Lost': 'var(--danger)'
        };

        // Group leads by stage
        const columnsData = {};
        stages.forEach(stage => {
            columnsData[stage] = [];
        });

        leads.forEach(lead => {
            const stage = lead.status || 'New';
            if (columnsData[stage]) {
                columnsData[stage].push(lead);
            } else {
                columnsData['New'].push(lead);
            }
        });

        board.innerHTML = stages.map(stage => {
            const stageLeads = columnsData[stage];
            const color = stageColors[stage] || 'var(--text-muted)';
            return `
                <div class="kanban-column" data-status="${stage}">
                    <div class="kanban-column-header" style="border-left: 3px solid ${color}; padding-left: var(--space-sm)">
                        <span class="column-title">${stage}</span>
                        <span class="column-count">${stageLeads.length}</span>
                    </div>
                    <div class="kanban-cards" data-status="${stage}">
                        ${stageLeads.map(lead => this.renderKanbanCard(lead, campaignId)).join('')}
                    </div>
                </div>
            `;
        }).join('');

        this.attachKanbanDragDropEvents(campaignId);
    }

    renderKanbanCard(lead, campaignId) {
        const score = lead.intelligence?.score || 0;
        const color = api.getScoreColor(score);
        const index = lead.originalIndex;

        return `
            <div class="kanban-card" draggable="true" data-index="${index}" onclick="dashboard.showLeadDetailFromCampaign('${campaignId}', ${index}, event)">
                <div class="kanban-card-title">${api.safeString(lead.name)}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:var(--space-sm)">
                    <span class="score-badge" style="background:${color}15;color:${color};font-size:0.7rem;padding:1px 6px">Score: ${score}</span>
                    <span style="font-size:0.7rem;color:var(--text-muted)">${lead.phone ? '📞 Yes' : '❌ No'}</span>
                </div>
            </div>
        `;
    }

    attachKanbanDragDropEvents(campaignId) {
        const cards = document.querySelectorAll('.kanban-card');
        const columns = document.querySelectorAll('.kanban-column');

        cards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    leadIndex: card.dataset.index,
                    campaignId: campaignId
                }));
                card.classList.add('dragging');
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });
        });

        columns.forEach(column => {
            const cardsContainer = column.querySelector('.kanban-cards');

            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                column.classList.add('drag-over');
            });

            column.addEventListener('dragleave', () => {
                column.classList.remove('drag-over');
            });

            column.addEventListener('drop', async (e) => {
                e.preventDefault();
                column.classList.remove('drag-over');

                try {
                    const dataStr = e.dataTransfer.getData('text/plain');
                    if (!dataStr) return;
                    const dragData = JSON.parse(dataStr);

                    const targetStatus = column.dataset.status;
                    const leadIndex = parseInt(dragData.leadIndex);

                    if (dragData.campaignId === campaignId && !isNaN(leadIndex)) {
                        // Update local cache first for instant feedback
                        const campaign = this.campaigns.find(c => c.id === campaignId);
                        if (campaign && campaign.leads && campaign.leads[leadIndex]) {
                            campaign.leads[leadIndex].status = targetStatus;
                        }

                        // Call backend API
                        await api.updateLeadDetails({
                            campaignId,
                            leadIndex,
                            status: targetStatus
                        });

                        // Re-render
                        if (campaign) {
                            this.renderKanbanBoard(campaign.leads, campaignId);
                        }
                        
                        showNotification('Status Updated', `Moved to ${targetStatus}`, 'success');
                    }
                } catch (err) {
                    api.handleError(err, 'moving lead stage');
                }
            });
        });
    }

}

// vCard functions disabled

// ─── Initialize ────────────────────────────────────────────
const dashboard = new Dashboard();