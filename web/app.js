/**
 * Caterpillar MCP – AI Dashboard Frontend
 * Handles tab switching, agent rendering, live query stream, and MCP tools display
 */

// ═══════════════════════════════════════════════════════════════
// DATA – Simulated AI agents connected to the Caterpillar MCP
// ═══════════════════════════════════════════════════════════════

const AI_AGENTS = [
    {
        id: 'agent-cat-fleet',
        name: 'Fleet Optimizer',
        avatar: '🚜',
        avatarBg: '#0f3460',
        status: 'connected',
        connectedSince: '2026-02-28T14:00:00Z',
        queriesResolved: 342,
        avgLatency: '38ms',
        lastQuery: '12s ago',
        queryTypes: ['Route Planning', 'Fuel Optimization', 'Maintenance Scheduling', 'Telemetry Analysis'],
        description: 'Manages autonomous fleet routing and fuel efficiency for mining operations.',
    },
    {
        id: 'agent-cat-safety',
        name: 'Safety Monitor',
        avatar: '🛡️',
        avatarBg: '#e94560',
        status: 'connected',
        connectedSince: '2026-02-28T08:00:00Z',
        queriesResolved: 518,
        avgLatency: '25ms',
        lastQuery: '3s ago',
        queryTypes: ['Hazard Detection', 'Compliance Check', 'Incident Reporting', 'Zone Monitoring'],
        description: 'Real-time safety compliance and hazard detection across all active job sites.',
    },
    {
        id: 'agent-cat-parts',
        name: 'Parts Advisor',
        avatar: '🔧',
        avatarBg: '#27ae60',
        status: 'processing',
        connectedSince: '2026-02-28T10:30:00Z',
        queriesResolved: 203,
        avgLatency: '52ms',
        lastQuery: 'now',
        queryTypes: ['Part Lookup', 'Inventory Check', 'Order Recommendation', 'Compatibility Verification'],
        description: 'Intelligent parts identification and inventory management for Cat® dealers.',
    },
    {
        id: 'agent-cat-diag',
        name: 'Diagnostics AI',
        avatar: '📊',
        avatarBg: '#f39c12',
        status: 'idle',
        connectedSince: '2026-02-28T16:45:00Z',
        queriesResolved: 184,
        avgLatency: '61ms',
        lastQuery: '2m ago',
        queryTypes: ['Fault Code Analysis', 'Predictive Maintenance', 'Performance Report', 'Sensor Calibration'],
        description: 'Analyzes engine diagnostics, fault codes, and predicts maintenance windows.',
    },
];

const QUERY_TYPES = [
    { name: 'Route Planning', icon: '🗺️', count: 312, max: 500 },
    { name: 'Fault Analysis', icon: '🔍', count: 287, max: 500 },
    { name: 'Parts Lookup', icon: '🔧', count: 203, max: 500 },
    { name: 'Safety Audit', icon: '🛡️', count: 198, max: 500 },
    { name: 'Telemetry', icon: '📡', count: 156, max: 500 },
    { name: 'Fuel Reports', icon: '⛽', count: 142, max: 500 },
    { name: 'Maintenance', icon: '🔩', count: 127, max: 500 },
    { name: 'Compliance', icon: '📋', count: 89, max: 500 },
];

const MCP_TOOLS = [
    {
        name: 'index_pages',
        description: 'Scan and index all Node.js pages in a target directory. Creates a .mcp/ context directory with structured metadata for routes, exports, dependencies, and framework detection.',
        params: [
            { name: 'directory', required: true },
        ],
    },
    {
        name: 'search_pages',
        description: 'Search indexed pages by query string, framework, or page type. Returns matching files with route and export details.',
        params: [
            { name: 'query', required: false },
            { name: 'framework', required: false },
            { name: 'type', required: false },
        ],
    },
    {
        name: 'get_page_detail',
        description: 'Get full metadata and a source code preview for a specific indexed page including routes, dependencies, and exports.',
        params: [
            { name: 'filePath', required: true },
        ],
    },
    {
        name: 'list_available_tools',
        description: 'List all tools this MCP server provides, with their descriptions and input schemas. Self-documenting endpoint.',
        params: [],
    },
];

const LOG_MESSAGES = [
    { agent: 'Fleet Optimizer', tool: 'search_pages', message: 'Searching routes for /api/fleet/optimize endpoint', status: 'success' },
    { agent: 'Safety Monitor', tool: 'get_page_detail', message: 'Inspecting safety-middleware.ts for compliance hooks', status: 'success' },
    { agent: 'Parts Advisor', tool: 'index_pages', message: 'Re-indexing /services/parts-catalog/ directory', status: 'pending' },
    { agent: 'Diagnostics AI', tool: 'search_pages', message: 'Finding fault-code handlers matching "engine-overtemp"', status: 'success' },
    { agent: 'Safety Monitor', tool: 'search_pages', message: 'Querying zone-monitor routes for active geofences', status: 'success' },
    { agent: 'Fleet Optimizer', tool: 'get_page_detail', message: 'Reading telemetry-ingest.ts for sensor data schema', status: 'success' },
    { agent: 'Parts Advisor', tool: 'search_pages', message: 'Looking up compatibility-check.ts for model 390F', status: 'success' },
    { agent: 'Diagnostics AI', tool: 'get_page_detail', message: 'Analyzing predictive-model.ts maintenance thresholds', status: 'success' },
    { agent: 'Fleet Optimizer', tool: 'list_available_tools', message: 'Refreshing available tool call inventory', status: 'success' },
    { agent: 'Safety Monitor', tool: 'index_pages', message: 'Full re-index after deployment of incident-report v2.3', status: 'success' },
    { agent: 'Parts Advisor', tool: 'get_page_detail', message: 'Checking inventory-service.ts stock level logic', status: 'pending' },
    { agent: 'Diagnostics AI', tool: 'search_pages', message: 'Searching calibration routines for pressure sensors', status: 'success' },
];


// ═══════════════════════════════════════════════════════════════
// TAB SWITCHING
// ═══════════════════════════════════════════════════════════════

const navAI = document.getElementById('nav-ai');
const heroSection = document.getElementById('hero-section');
const homeContent = document.getElementById('home-content');
const aiDashboard = document.getElementById('ai-dashboard');
const heroCta = document.getElementById('hero-cta');

function showTab(tab) {
    if (tab === 'ai') {
        heroSection.classList.add('hidden');
        homeContent.classList.add('hidden');
        aiDashboard.classList.remove('hidden');
        navAI.classList.add('active');
    } else {
        heroSection.classList.remove('hidden');
        homeContent.classList.remove('hidden');
        aiDashboard.classList.add('hidden');
        navAI.classList.remove('active');
    }
}

// Nav click handlers
document.querySelectorAll('[data-tab]').forEach(el => {
    el.addEventListener('click', (e) => {
        e.preventDefault();
        showTab(el.dataset.tab);
    });
});

// Logo goes home
document.getElementById('logo').addEventListener('click', () => showTab('home'));


// ═══════════════════════════════════════════════════════════════
// RENDER AGENTS
// ═══════════════════════════════════════════════════════════════

function renderAgents(filter = 'all') {
    const grid = document.getElementById('agents-grid');
    const filtered = filter === 'all'
        ? AI_AGENTS
        : AI_AGENTS.filter(a => a.status === filter);

    grid.innerHTML = filtered.map(agent => `
        <div class="agent-card status-${agent.status}" id="${agent.id}">
            <div class="agent-top">
                <div class="agent-info">
                    <div class="agent-avatar" style="background: ${agent.avatarBg}">
                        ${agent.avatar}
                    </div>
                    <div>
                        <div class="agent-name">${agent.name}</div>
                        <div class="agent-id">${agent.id}</div>
                    </div>
                </div>
                <div class="agent-status ${agent.status}">
                    <span class="agent-status-dot"></span>
                    ${agent.status}
                </div>
            </div>
            <p style="color: var(--cat-gray-600); font-size: 13px; margin-bottom: 16px;">${agent.description}</p>
            <div class="agent-meta">
                <div class="meta-item">
                    <div class="meta-label">Queries</div>
                    <div class="meta-value">${agent.queriesResolved}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Latency</div>
                    <div class="meta-value">${agent.avgLatency}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Last Query</div>
                    <div class="meta-value">${agent.lastQuery}</div>
                </div>
            </div>
            <div class="agent-queries">
                ${agent.queryTypes.map(q => `<span class="query-tag">${q}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

// Filter buttons
document.getElementById('agents-filter').addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        renderAgents(e.target.dataset.filter);
    }
});


// ═══════════════════════════════════════════════════════════════
// RENDER QUERY TYPES
// ═══════════════════════════════════════════════════════════════

function renderQueryTypes() {
    const grid = document.getElementById('query-types-grid');
    grid.innerHTML = QUERY_TYPES.map(qt => `
        <div class="query-type-card">
            <div class="query-type-icon">${qt.icon}</div>
            <div class="query-type-name">${qt.name}</div>
            <div class="query-type-count">${qt.count}</div>
            <div class="query-type-bar">
                <div class="query-type-bar-fill" style="width: ${(qt.count / qt.max * 100).toFixed(0)}%"></div>
            </div>
        </div>
    `).join('');
}


// ═══════════════════════════════════════════════════════════════
// RENDER MCP TOOLS
// ═══════════════════════════════════════════════════════════════

function renderTools() {
    const grid = document.getElementById('tools-grid');
    grid.innerHTML = MCP_TOOLS.map(tool => `
        <div class="tool-card">
            <div class="tool-name">${tool.name}</div>
            <div class="tool-desc">${tool.description}</div>
            <div class="tool-params">
                ${tool.params.length === 0
            ? '<span class="tool-param">no parameters</span>'
            : tool.params.map(p => `<span class="tool-param ${p.required ? 'required' : ''}">${p.name}${p.required ? ' *' : ''}</span>`).join('')
        }
            </div>
        </div>
    `).join('');
}


// ═══════════════════════════════════════════════════════════════
// LIVE QUERY STREAM (Simulated)
// ═══════════════════════════════════════════════════════════════

let logIndex = 0;

function addLogEntry() {
    const log = document.getElementById('activity-log');
    const entry = LOG_MESSAGES[logIndex % LOG_MESSAGES.length];
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour12: false });

    const el = document.createElement('div');
    el.className = 'log-entry';
    el.innerHTML = `
        <span class="log-time">${time}</span>
        <span class="log-agent">${entry.agent}</span>
        <span class="log-tool">${entry.tool}</span>
        <span class="log-message">${entry.message}</span>
        <span class="log-status ${entry.status}">${entry.status === 'success' ? '✓' : entry.status === 'pending' ? '⏳' : '✗'}</span>
    `;

    log.insertBefore(el, log.firstChild);
    logIndex++;

    // Keep max 50 entries
    while (log.children.length > 50) {
        log.removeChild(log.lastChild);
    }

    // Update stats
    updateStats();
}

function updateStats() {
    const totalQueries = parseInt(document.getElementById('stat-queries').textContent.replace(',', '')) + 1;
    document.getElementById('stat-queries').textContent = totalQueries.toLocaleString();

    // Randomize latency slightly
    const latency = 35 + Math.floor(Math.random() * 25);
    document.getElementById('stat-latency').textContent = `${latency}ms`;
}

// Start the live stream
function startLiveStream() {
    // Pre-populate with a few entries
    for (let i = 0; i < 6; i++) {
        addLogEntry();
    }

    // Add new entries periodically (every 3-7 seconds)
    function scheduleNext() {
        const delay = 3000 + Math.random() * 4000;
        setTimeout(() => {
            addLogEntry();
            scheduleNext();
        }, delay);
    }
    scheduleNext();
}


// ═══════════════════════════════════════════════════════════════
// INITIALIZE
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    renderAgents();
    renderQueryTypes();
    renderTools();
    startLiveStream();

    // Start on AI tab by default to showcase the dashboard
    showTab('ai');
});
