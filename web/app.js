/* Caterpillar Agentic Marketplace — Simulation Engine */

const PRODUCTS = [
    { id: 'cat-d6', name: 'Cat® D6 Dozer', emoji: '🚜', cat: 'Earthmoving', price: 250000, img: '🏗️' },
    { id: 'cat-320', name: 'Cat® 320 Excavator', emoji: '⛏️', cat: 'Excavation', price: 320000, img: '⛏️' },
    { id: 'cat-745', name: 'Cat® 745 Articulated Truck', emoji: '🚛', cat: 'Hauling', price: 580000, img: '🚛' },
    { id: 'cat-950', name: 'Cat® 950 Wheel Loader', emoji: '🏭', cat: 'Loading', price: 290000, img: '🏭' },
    { id: 'cat-390f', name: 'Cat® 390F Hydraulic Excavator', emoji: '🔧', cat: 'Mining', price: 890000, img: '⚙️' },
    { id: 'cat-777g', name: 'Cat® 777G Off-Highway Truck', emoji: '🪨', cat: 'Mining', price: 1200000, img: '🪨' },
    { id: 'cat-cs56', name: 'Cat® CS56 Vibratory Soil Compactor', emoji: '🛞', cat: 'Compaction', price: 175000, img: '🛞' },
    { id: 'cat-cb7', name: 'Cat® CB7 Asphalt Compactor', emoji: '🛣️', cat: 'Paving', price: 210000, img: '🛣️' },
];

const AGENTS = [
    { id: 'minebot-alpha', name: 'MineBot Alpha', emoji: '⛏️', bg: '#0f3460', role: 'Mining Procurement', budget: '$2.5M', status: 'active' },
    { id: 'buildcorp-ai', name: 'BuildCorp AI', emoji: '🏗️', bg: '#e94560', role: 'Construction Buyer', budget: '$1.8M', status: 'negotiating' },
    { id: 'terrafleet', name: 'TerraFleet Agent', emoji: '🚛', bg: '#27ae60', role: 'Fleet Manager', budget: '$4.0M', status: 'active' },
    { id: 'govprocure', name: 'GovProcure Bot', emoji: '🏛️', bg: '#f39c12', role: 'Government Buyer', budget: '$3.2M', status: 'active' },
    { id: 'energyops', name: 'EnergyOps AI', emoji: '⚡', bg: '#a855f7', role: 'Energy Sector', budget: '$1.5M', status: 'negotiating' },
];

const CAT_SALES = { name: 'CatSales™ AI', emoji: '🐱' };

const STAGES = ['browsing', 'negotiating', 'compliance', 'purchased'];

let deals = [
    { id: 1, product: PRODUCTS[0], agent: AGENTS[0], stage: 'negotiating', qty: 3, discount: 8, origPrice: 250000, curPrice: 230000, region: 'APAC', progress: 60 },
    { id: 2, product: PRODUCTS[4], agent: AGENTS[0], stage: 'compliance', qty: 1, discount: 5, origPrice: 890000, curPrice: 845500, region: 'APAC', progress: 85 },
    { id: 3, product: PRODUCTS[1], agent: AGENTS[1], stage: 'browsing', qty: 5, discount: 0, origPrice: 320000, curPrice: 320000, region: 'NAM', progress: 20 },
    { id: 4, product: PRODUCTS[2], agent: AGENTS[2], stage: 'purchased', qty: 8, discount: 12, origPrice: 580000, curPrice: 510400, region: 'EMEA', progress: 100 },
    { id: 5, product: PRODUCTS[5], agent: AGENTS[3], stage: 'negotiating', qty: 2, discount: 6, origPrice: 1200000, curPrice: 1128000, region: 'NAM', progress: 50 },
    { id: 6, product: PRODUCTS[3], agent: AGENTS[4], stage: 'browsing', qty: 4, discount: 0, origPrice: 290000, curPrice: 290000, region: 'LATAM', progress: 15 },
];

let dealIdCounter = 7;

const NEGOTIATION_SCRIPTS = [
    { buyer: 'We need pricing for {qty}× {product}. Volume discount available?', seller: 'For {qty} units I can offer {discount}% off list — bringing it to {price} per unit.' },
    { buyer: 'Can we negotiate extended warranty terms on the {product}?', seller: 'Absolutely. With Cat® Care we can include 5yr/10K-hour coverage at 2% premium.' },
    { buyer: 'We require MSHA compliance documentation for {product}.', seller: 'MSHA certification package is ready. I\'ll attach Form 7000-1 and safety data sheets.' },
    { buyer: 'What\'s your delivery timeline for {qty} {product} units to {region}?', seller: 'Estimated 6-8 weeks from dealer stock for {region}. Express can cut to 4 weeks at +3%.' },
    { buyer: 'Requesting final quote review. Budget approval needed at {price}.', seller: 'Final quote locked: {qty}× {product} @ {price}/unit. {discount}% volume discount applied. Ready to close.' },
    { buyer: 'Our compliance team flagged environmental regs for {region}. Status?', seller: 'All {product} units meet EPA Tier 4 Final / EU Stage V standards. Documentation attached.' },
    { buyer: 'We\'re comparing against Komatsu. Can you improve on {price}?', seller: 'I can offer an additional 2% loyalty discount for existing Cat® customers, plus free first-year maintenance.' },
    { buyer: 'Deal approved. Proceeding with purchase order for {qty}× {product}.', seller: 'Purchase confirmed! 🎉 Order #{dealId} processed. Delivery scheduled for {region} hub.' },
];

// ═══ TAB SWITCHING ═══
const heroSection = document.getElementById('hero-section');
const homeContent = document.getElementById('home-content');
const aiDashboard = document.getElementById('ai-dashboard');
const navAI = document.getElementById('nav-ai');

function showTab(tab) {
    if (tab === 'ai') { heroSection.classList.add('hidden'); homeContent.classList.add('hidden'); aiDashboard.classList.remove('hidden'); navAI.classList.add('active'); }
    else { heroSection.classList.remove('hidden'); homeContent.classList.remove('hidden'); aiDashboard.classList.add('hidden'); navAI.classList.remove('active'); }
}
document.querySelectorAll('[data-tab]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); showTab(el.dataset.tab); }));
document.getElementById('logo').addEventListener('click', () => showTab('home'));

// ═══ RENDER PIPELINE ═══
function renderPipeline() {
    STAGES.forEach(stage => {
        const col = document.getElementById('cards-' + stage);
        const stageDeals = deals.filter(d => d.stage === stage);
        col.innerHTML = stageDeals.map(d => {
            const colors = { browsing: 'var(--cat-blue)', negotiating: 'var(--cat-orange)', compliance: 'var(--cat-purple)', purchased: 'var(--cat-green)' };
            return `<div class="deal-card" id="deal-${d.id}">
                <div class="deal-product">${d.product.emoji} ${d.product.name}</div>
                <div class="deal-agent">${d.agent.emoji} ${d.agent.name}</div>
                <div><span class="deal-price">$${d.curPrice.toLocaleString()}</span>${d.discount ? `<span class="deal-orig-price">$${d.origPrice.toLocaleString()}</span>` : ''}</div>
                <div class="deal-meta">
                    <span class="deal-tag qty">×${d.qty}</span>
                    ${d.discount ? `<span class="deal-tag discount">-${d.discount}%</span>` : ''}
                    <span class="deal-tag region">${d.region}</span>
                </div>
                <div class="deal-progress"><div class="deal-progress-fill" style="width:${d.progress}%;background:${colors[d.stage]}"></div></div>
            </div>`;
        }).join('');
    });
}

// ═══ RENDER CATALOG ═══
function renderCatalog() {
    const grid = document.getElementById('catalog-grid');
    grid.innerHTML = PRODUCTS.map(p => {
        const interested = deals.filter(d => d.product.id === p.id).length;
        return `<div class="product-card">
            <div class="product-img">${p.emoji}</div>
            <div class="product-body">
                <div class="product-name">${p.name}</div>
                <div class="product-cat">${p.cat}</div>
                <div class="product-price">$${p.price.toLocaleString()}</div>
                ${interested ? `<div class="product-interest"><span class="product-interest-dot"></span>${interested} agent${interested > 1 ? 's' : ''} interested</div>` : ''}
            </div>
        </div>`;
    }).join('');
}

// ═══ RENDER AGENTS ═══
function renderAgents() {
    const roster = document.getElementById('agents-roster');
    roster.innerHTML = AGENTS.map(a => {
        const agentDeals = deals.filter(d => d.agent.id === a.id);
        const totalVal = agentDeals.reduce((s, d) => s + d.curPrice * d.qty, 0);
        return `<div class="roster-card">
            <div class="roster-avatar" style="background:${a.bg}">${a.emoji}</div>
            <div class="roster-name">${a.name}</div>
            <div class="roster-role">${a.role}</div>
            <div class="roster-stat"><strong>${agentDeals.length}</strong> deals · <strong>$${(totalVal / 1000).toFixed(0)}K</strong></div>
            <div class="roster-status ${a.status}"><span style="width:5px;height:5px;border-radius:50%;background:currentColor"></span>${a.status}</div>
        </div>`;
    }).join('');
}

// ═══ NEGOTIATION CHAT ═══
function addChatMessage(type, name, text, dealRef) {
    const feed = document.getElementById('negotiation-feed');
    const now = new Date().toLocaleTimeString('en-US', { hour12: false });
    const el = document.createElement('div');
    el.className = 'chat-msg';
    el.innerHTML = `
        <div class="chat-avatar ${type}">${type === 'buyer' ? '🤖' : type === 'seller' ? '🐱' : '📋'}</div>
        <div class="chat-body">
            <div class="chat-name ${type}">${name}${dealRef ? `<span class="chat-deal-tag">${dealRef}</span>` : ''}</div>
            <div class="chat-text">${text}</div>
        </div>
        <div class="chat-time">${now}</div>`;
    feed.insertBefore(el, feed.firstChild);
    while (feed.children.length > 40) feed.removeChild(feed.lastChild);
}

function fillTemplate(tmpl, deal) {
    return tmpl.replace('{qty}', deal.qty).replace('{product}', deal.product.name).replace('{discount}', deal.discount)
        .replace('{price}', '$' + deal.curPrice.toLocaleString()).replace('{region}', deal.region).replace('{dealId}', deal.id);
}

// ═══ SIMULATION ENGINE ═══
function simulateActivity() {
    const action = Math.random();

    if (action < 0.35) {
        // Negotiation message
        const activeDeals = deals.filter(d => d.stage === 'negotiating');
        if (activeDeals.length) {
            const deal = activeDeals[Math.floor(Math.random() * activeDeals.length)];
            const script = NEGOTIATION_SCRIPTS[Math.floor(Math.random() * NEGOTIATION_SCRIPTS.length)];
            addChatMessage('buyer', deal.agent.name, fillTemplate(script.buyer, deal), deal.product.name);
            setTimeout(() => {
                addChatMessage('seller', CAT_SALES.name, fillTemplate(script.seller, deal), deal.product.name);
            }, 1500 + Math.random() * 2000);
        }
    } else if (action < 0.55) {
        // Move deal forward
        const movable = deals.filter(d => d.stage !== 'purchased');
        if (movable.length) {
            const deal = movable[Math.floor(Math.random() * movable.length)];
            const idx = STAGES.indexOf(deal.stage);
            if (idx < STAGES.length - 1) {
                deal.stage = STAGES[idx + 1];
                deal.progress = Math.min(100, deal.progress + 25);
                if (deal.stage === 'negotiating' && deal.discount === 0) {
                    deal.discount = 5 + Math.floor(Math.random() * 10);
                    deal.curPrice = Math.round(deal.origPrice * (1 - deal.discount / 100));
                }
                const stageLabels = { negotiating: 'entered negotiation', compliance: 'is under compliance review', purchased: '✅ DEAL CLOSED' };
                addChatMessage('system', 'Marketplace', `${deal.agent.name}'s deal for ${deal.qty}× ${deal.product.name} ${stageLabels[deal.stage]}`, deal.stage === 'purchased' ? '$' + (deal.curPrice * deal.qty).toLocaleString() : '');
                renderPipeline();
                updateStats();
            }
        }
    } else if (action < 0.7) {
        // New deal
        const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)];
        const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
        const qty = 1 + Math.floor(Math.random() * 6);
        const newDeal = { id: dealIdCounter++, product, agent, stage: 'browsing', qty, discount: 0, origPrice: product.price, curPrice: product.price, region: ['NAM', 'EMEA', 'APAC', 'LATAM'][Math.floor(Math.random() * 4)], progress: 10 };
        deals.push(newDeal);
        addChatMessage('buyer', agent.name, `Browsing ${product.name} — comparing specs and pricing for ${qty} units`, product.name);
        renderPipeline();
        renderCatalog();
        updateStats();
    } else if (action < 0.85) {
        // Compliance message
        const complianceDeals = deals.filter(d => d.stage === 'compliance');
        if (complianceDeals.length) {
            const deal = complianceDeals[Math.floor(Math.random() * complianceDeals.length)];
            const msgs = [
                `Verifying EPA Tier 4 Final certification for ${deal.product.name}`,
                `Reviewing OSHA safety compliance documentation — ${deal.qty} units`,
                `Cross-referencing ${deal.region} import regulations for ${deal.product.name}`,
                `Anti-corruption due diligence check passed for ${deal.agent.name}`,
                `Insurance & liability review complete for $${(deal.curPrice * deal.qty).toLocaleString()} order`,
            ];
            addChatMessage('system', 'Compliance Bot', msgs[Math.floor(Math.random() * msgs.length)], deal.product.name);
        }
    } else {
        // Price update during negotiation
        const nego = deals.filter(d => d.stage === 'negotiating');
        if (nego.length) {
            const deal = nego[Math.floor(Math.random() * nego.length)];
            const extra = 1 + Math.floor(Math.random() * 3);
            deal.discount = Math.min(20, deal.discount + extra);
            deal.curPrice = Math.round(deal.origPrice * (1 - deal.discount / 100));
            deal.progress = Math.min(90, deal.progress + 10);
            addChatMessage('seller', CAT_SALES.name, `Updated offer: ${deal.discount}% off → $${deal.curPrice.toLocaleString()}/unit for ${deal.qty}× ${deal.product.name}`, `Save $${(deal.origPrice - deal.curPrice).toLocaleString()}`);
            renderPipeline();
        }
    }
}

function updateStats() {
    document.getElementById('stat-deals').textContent = deals.filter(d => d.stage !== 'purchased').length;
    document.getElementById('stat-closed').textContent = deals.filter(d => d.stage === 'purchased').length;
    const vol = deals.reduce((s, d) => s + d.curPrice * d.qty, 0);
    document.getElementById('stat-volume').textContent = '$' + (vol / 1e6).toFixed(1) + 'M';
    document.getElementById('ai-deal-count').textContent = deals.filter(d => d.stage !== 'purchased').length;
}

// ═══ INIT ═══
document.addEventListener('DOMContentLoaded', () => {
    renderPipeline();
    renderCatalog();
    renderAgents();
    updateStats();

    // Seed initial chat
    addChatMessage('system', 'Marketplace', 'Agentic marketplace online. 5 buyer agents connected.', '');
    addChatMessage('buyer', AGENTS[0].name, 'Evaluating Cat® D6 Dozer fleet deal — need volume pricing for 3 units to APAC', PRODUCTS[0].name);
    addChatMessage('seller', CAT_SALES.name, 'Welcome MineBot Alpha! For 3× D6 Dozers I can start with 8% volume discount — $230,000/unit', PRODUCTS[0].name);
    addChatMessage('buyer', AGENTS[3].name, 'Requesting compliance docs for 777G Off-Highway Truck, government procurement rules apply', PRODUCTS[5].name);

    // Start simulation
    function tick() {
        simulateActivity();
        setTimeout(tick, 3000 + Math.random() * 5000);
    }
    setTimeout(tick, 2000);

    showTab('ai');
});
