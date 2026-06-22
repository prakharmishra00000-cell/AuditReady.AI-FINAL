/* ***********************************************************
   AuditReady.AI  - Admin Portal JS
   Auth &middot; Navigation &middot; Plan Editor &middot; System Setup &middot; API Keys
   All data persisted in localStorage, shared with main site
*********************************************************** */
"use strict";

/* ──────────────── CONSTANTS ──────────────── */
const ADMIN_EMAIL    = "prakharmishra00000@gmail.com";
const ADMIN_PASSWORD = "prakhar@2025";
const RESET_PIN      = "123";
const LS_AUTH        = "ar_admin_auth";
const LS_PLANS       = "ar_plans";
const LS_SETTINGS    = "ar_settings";
const LS_KEYS        = "ar_gemini_keys";
const LS_KEY_INDEX   = "ar_gemini_key_index";
const LS_CREDS       = "ar_credentials";
const LS_QUERIES     = "ar_support_queries";
const LS_PAYMENTS    = "ar_payments";

/* ──────────────── DEFAULT DATA ──────────────── */
const DEFAULT_PLANS = {
  growth: {
    id:"growth", name:"Growth", price:299, currency:"&#x20B9;", billing:"monthly",
    color:"#00e5ff", popular:false, visible:true,
    description:"Perfect for startups and small teams.",
    features:[
      "AI Audit Risk Scan (50 docs/month)",
      "SOC 2 & GDPR Compliance Scan",
      "Active Remediation  - AI Fix Generator",
      "Audit Evidence PDF Export",
      "Framework Rules Viewer",
      "Help & Support (48h response)"
    ]
  },
  scale: {
    id:"scale", name:"Scale", price:999, currency:"&#x20B9;", billing:"monthly",
    color:"#818cf8", popular:true, visible:true,
    description:"For growing companies needing full coverage.",
    features:[
      "Everything in Growth",
      "All 6 Compliance Frameworks",
      "DocuSign Integration  - Send Amendments",
      "Live Auditor Mode (Cryptographic Portal)",
      "Unlimited Document Scans",
      "Help & Support (4h response)"
    ]
  },
  enterprise: {
    id:"enterprise", name:"Enterprise", price:4999, currency:"&#x20B9;", billing:"monthly",
    color:"#f472b6", popular:false, visible:true,
    description:"Full compliance ecosystem for large organizations.",
    features:[
      "Everything in Scale",
      "Shadow Data Discovery (6 sources)",
      "CCM Monitor - 24/7 Continuous Alerts",
      "Dedicated Compliance Manager",
      "Custom Framework Rules Builder",
      "Help & Support (1h response SLA)"
    ]
  }
};

// Real user data comes from localStorage (ar_accounts key), populated automatically when users register on the main site.
// Real payment data comes from localStorage (ar_payments key), populated automatically when users submit UTR on the main site.
// Real support tickets come from localStorage (ar_support_queries key), populated automatically when users submit the Help & Support form.

// Audit log starts fresh — entries added by admin actions during this session
const AUDIT_LOG_DATA = [];


const FRAMEWORKS_DATA = [
  {id:"soc2",   name:"SOC 2 Type II",    desc:"Service Organization Control 2 for security and availability.", plans:"Growth+",     enabled:true},
  {id:"gdpr",   name:"GDPR Compliance",  desc:"EU General Data Protection Regulation for data privacy.",       plans:"Growth+",     enabled:true},
  {id:"iso",    name:"ISO 27001",         desc:"International standard for information security management.",    plans:"Growth+",     enabled:true},
  {id:"hipaa",  name:"HIPAA Rule",        desc:"US health data protection and privacy compliance.",              plans:"Scale+",      enabled:true},
  {id:"pci",    name:"PCI-DSS",          desc:"Payment Card Industry Data Security Standard.",                  plans:"Scale+",      enabled:true},
  {id:"ccpa",   name:"CCPA",             desc:"California Consumer Privacy Act for data rights.",               plans:"Enterprise",  enabled:true},
];

/* ──────────────── STATE ──────────────── */
let currentPanel   = "overview";
let currentPage    = 1;
const PAGE_SIZE    = 6;
let selectedQuery  = null;
let plans          = {};
let userPassword   = ADMIN_PASSWORD;
let sidebarOpen    = true;
let activeKeyIndex = parseInt(localStorage.getItem(LS_KEY_INDEX) || "0");

/* ******************************************************
   INIT
****************************************************** */

function updateActivityFeed() {
  var feed = document.getElementById('activity-feed');
  if (!feed) return;
  var items = [];
  // Pull from audit log
  try { var logs=JSON.parse(localStorage.getItem('ar_audit_log')||'[]'); logs.slice(0,5).forEach(function(l){ items.push({dot:'cyan',text:'<strong>Admin</strong> '+l.action,sub:new Date(l.ts).toLocaleTimeString('en-IN')}); }); } catch {}
  // Pull latest payment
  try { var pays=JSON.parse(localStorage.getItem('ar_payments')||'[]'); if(pays[0]){ items.unshift({dot:'green',text:'<strong>'+pays[0].user+'</strong> purchased '+pays[0].plan+' plan',sub:pays[0].time||'recently'}); } } catch {}
  // Pull latest support query
  try { var qs=JSON.parse(localStorage.getItem('ar_support_queries')||'[]'); if(qs[0]){ items.push({dot:'orange',text:'<strong>'+qs[0].name+'</strong> submitted support query',sub:qs[0].time||'recently'}); } } catch {}
  if (!items.length) return; // keep static placeholder if no real data
  feed.innerHTML = items.slice(0,5).map(function(it){ return '<li><span class="act-dot '+it.dot+'"></span><div>'+it.text+'<br><small>'+it.sub+'</small></div></li>'; }).join('');
}

function updateDonutChart() {
  var accs=[]; try{accs=JSON.parse(localStorage.getItem('ar_accounts')||'[]');}catch{}
  if (!accs.length) return;
  var counts={growth:0,scale:0,enterprise:0,free:0};
  accs.forEach(function(u){
    var pr=null; try{pr=JSON.parse(localStorage.getItem('ar_plan_'+u.email.toLowerCase())||'null');}catch{}
    var plan=(pr&&Date.now()<pr.expiry)?pr.plan:'free';
    counts[plan]=(counts[plan]||0)+1;
  });
  var total=accs.length;
  // Update legend numbers
  var el=document.querySelector('.legend-item:nth-child(1) strong'); if(el)el.textContent=counts.growth||0;
  el=document.querySelector('.legend-item:nth-child(2) strong'); if(el)el.textContent=counts.scale||0;
  el=document.querySelector('.legend-item:nth-child(3) strong'); if(el)el.textContent=counts.enterprise||0;
  el=document.querySelector('.legend-item:nth-child(4) strong'); if(el)el.textContent=counts.free||0;
  el=document.querySelector('.donut-label span'); if(el)el.textContent=total;
}
function adminInit() {
  if (typeof lucide !== 'undefined') lucide.createIcons();
  autoSeedDefaults();
  checkAuth();
  setupLoginHandlers();
  setupModalHandlers();
  loadPlans();
}

/* Auto-seed safe defaults on first visit — only fills missing keys */
function autoSeedDefaults() {
  var settings = {};
  try { settings = JSON.parse(localStorage.getItem('ar_settings') || '{}' ); } catch {}
  var sc = false;
  if (!settings.upi_id)      { settings.upi_id      = '6372843175@kotakbank';          sc = true; }
  if (!settings.upi_name)    { settings.upi_name    = 'AuditReady.AI';                 sc = true; }
  if (!settings.admin_email) { settings.admin_email = 'prakharmishra00000@gmail.com';  sc = true; }
  if (sc) localStorage.setItem('ar_settings', JSON.stringify(settings));

  var creds = {};
  try { creds = JSON.parse(localStorage.getItem('ar_credentials') || '{}' ); } catch {}
  var cc = false;
  if (!creds.UPI_ID)      { creds.UPI_ID      = '6372843175@kotakbank';          cc = true; }
  if (!creds.UPI_NAME)    { creds.UPI_NAME    = 'AuditReady.AI';                 cc = true; }
  if (!creds.ADMIN_EMAIL) { creds.ADMIN_EMAIL = 'prakharmishra00000@gmail.com';  cc = true; }
  if (cc) localStorage.setItem('ar_credentials', JSON.stringify(creds));
}
// Run immediately — DOM already parsed since script at bottom of body
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', adminInit);
} else {
  adminInit();
}


/* ******************************************************
   AUTH
****************************************************** */
function checkAuth() {
  const auth = sessionStorage.getItem(LS_AUTH);
  if (auth === "1") bootAdminApp();
}

function setupLoginHandlers() {
  // Google Sign-In — show a proper modal (prompt() is blocked on HTTPS/Netlify)
  document.getElementById("google-login-btn").addEventListener("click", () => {
    // Create inline google login modal
    let existing = document.getElementById('g-admin-modal');
    if (existing) existing.remove();
    const m = document.createElement('div');
    m.id = 'g-admin-modal';
    m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:99999;display:flex;align-items:center;justify-content:center;padding:1rem';
    m.innerHTML = `<div style="background:#1a1f2e;border:1px solid rgba(255,255,255,0.12);border-radius:16px;padding:2rem;width:100%;max-width:360px;position:relative">
      <button onclick="document.getElementById('g-admin-modal').remove()" style="position:absolute;top:.75rem;right:.75rem;background:none;border:none;color:#aaa;font-size:1.3rem;cursor:pointer">&#x2715;</button>
      <h3 style="color:#fff;margin-bottom:1.25rem;font-size:1.1rem">Admin Google Sign-In</h3>
      <input id="gadmin-email" type="email" placeholder="prakharmishra00000@gmail.com"
        style="width:100%;padding:.75rem 1rem;background:#0f1322;border:1px solid rgba(255,255,255,0.15);border-radius:10px;color:#fff;font-size:.95rem;box-sizing:border-box;outline:none;margin-bottom:1rem">
      <p id="gadmin-err" style="color:#f87171;font-size:.83rem;margin-bottom:.75rem;display:none"></p>
      <button onclick="doAdminGoogleLogin()" style="width:100%;padding:.8rem;background:linear-gradient(135deg,#06b6d4,#3b82f6);border:none;border-radius:10px;color:#fff;font-size:1rem;font-weight:700;cursor:pointer">Continue</button>
    </div>`;
    document.body.appendChild(m);
    document.getElementById('gadmin-email').focus();
  });

  // Email / Password
  document.getElementById("email-login-btn").addEventListener("click", doEmailLogin);
  document.getElementById("login-form").addEventListener("keydown", e => { if (e.key === "Enter") doEmailLogin(); });

  // Toggle password visibility
  document.getElementById("toggle-pw-btn").addEventListener("click", () => {
    const pw = document.getElementById("login-password");
    const icon = document.getElementById("eye-icon");
    if (pw.type === "password") {
      pw.type = "text";
      icon.setAttribute("data-lucide", "eye-off");
    } else {
      pw.type = "password";
      icon.setAttribute("data-lucide", "eye");
    }
    (typeof lucide!=='undefined'&&lucide.createIcons());
  });

  // Forgot password
  document.getElementById("forgot-link").addEventListener("click", e => {
    e.preventDefault();
    openModal("forgot-modal");
  });

  // Logout buttons
  document.getElementById("logout-btn").addEventListener("click", logout);
  document.getElementById("sidebar-logout-btn").addEventListener("click", logout);

  // Admin user pill dropdown
  document.getElementById("admin-user-pill").addEventListener("click", () => {
    document.getElementById("user-dropdown").classList.toggle("hidden");
  });
  document.addEventListener("click", e => {
    if (!e.target.closest("#admin-user-pill")) {
      document.getElementById("user-dropdown").classList.add("hidden");
    }
  });

  // Topbar buttons
  document.getElementById("main-site-btn").addEventListener("click", () => {
    window.open(window.location.origin + "/", "_blank");
  });
  document.getElementById("sidebar-toggle-btn").addEventListener("click", toggleSidebar);
}

function doEmailLogin() {
  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const pw    = document.getElementById("login-password").value;
  if (!email || !pw) { showLoginError("Please enter your email and password."); return; }
  if (email !== ADMIN_EMAIL.toLowerCase()) { showLoginError("Access Denied. Only the authorized admin email can sign in."); return; }
  if (pw !== userPassword) { showLoginError("Incorrect password. Please try again."); return; }
  loginSuccess(email);
}

// Called by the inline Google admin login modal
window.doAdminGoogleLogin = function() {
  const email = document.getElementById('gadmin-email')?.value.trim().toLowerCase();
  const errEl = document.getElementById('gadmin-err');
  if (!email || !email.includes('@')) {
    if (errEl) { errEl.textContent = 'Please enter your email.'; errEl.style.display = 'block'; }
    return;
  }
  if (email !== ADMIN_EMAIL.toLowerCase()) {
    if (errEl) { errEl.textContent = 'Access Denied. Only ' + ADMIN_EMAIL + ' can access this portal.'; errEl.style.display = 'block'; }
    return;
  }
  document.getElementById('g-admin-modal')?.remove();
  loginSuccess(email);
};

function loginSuccess(email) {
  sessionStorage.setItem(LS_AUTH, "1");
  document.getElementById("login-error").classList.remove("show");
  document.getElementById("login-screen").classList.add("hidden");
  bootAdminApp(email);
}

function showLoginError(msg) {
  const el = document.getElementById("login-error");
  el.textContent = msg;
  el.classList.add("show");
}

function logout() {
  sessionStorage.removeItem(LS_AUTH);
  document.getElementById("admin-app").classList.add("hidden");
  document.getElementById("login-screen").classList.remove("hidden");
  document.getElementById("login-password").value = "";
}

function bootAdminApp(email = ADMIN_EMAIL) {
  const name = email.split("@")[0];
  document.getElementById("admin-name-display").textContent = name.charAt(0).toUpperCase() + name.slice(1);
  document.getElementById("admin-avatar").textContent = name.charAt(0).toUpperCase();
  document.getElementById("admin-app").classList.remove("hidden");

  setupNav();
  setupSidebar();
  buildRevenueChart();
  buildVisitorChart();
  buildUsersTable();
  buildPlansEditor();
  buildSupportInbox();
  buildApiKeyGrid();
  buildGeminiKeySlots();
  buildFrameworksGrid();
  buildPaymentsTable();
  buildAuditLog();
  loadCredentialFields();
  loadWebsiteSettings();
  syncSupportBadge();
  logAction("Admin Login", "Auth System");
  updateKPIs();
  updateActivityFeed();
  updateDonutChart();
  showToast("Welcome back, Admin!", "success");
}

function updateKPIs() {
  // Read real data from localStorage
  let users    = [];
  let payments = [];
  let support  = [];
  try { users    = JSON.parse(localStorage.getItem('ar_accounts') || '[]'); } catch {}
  try { payments = JSON.parse(localStorage.getItem('ar_payments') || '[]'); } catch {}
  try { support  = JSON.parse(localStorage.getItem('ar_support_queries') || '[]'); } catch {}

  const totalUsers   = users.length;
  const activePlans  = users.filter(function(u){ var pr=null; try{pr=JSON.parse(localStorage.getItem('ar_plan_'+u.email.toLowerCase())||'null');}catch{} return pr && pr.plan && pr.plan!=='free' && Date.now()<pr.expiry; }).length;
  const openTickets  = support.filter(function(q){ return q.status === 'open'; }).length;

  // Revenue today: sum payments from last 24h
  const today = new Date();
  const todayRevenue = payments
    .filter(p => p.status === 'completed' && p.date && (today - new Date(p.date)) < 86400000)
    .reduce((sum, p) => sum + (parseFloat((p.amount || '0').replace(/[^0-9.]/g,'')) || 0), 0);

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('kpi-users',         totalUsers);
  set('kpi-plans',         activePlans);
  set('kpi-revenue',       '\u20B9' + todayRevenue.toLocaleString('en-IN'));
  set('kpi-tickets',       openTickets);
  set('kpi-users-delta',   totalUsers   ? totalUsers + ' registered'   : 'No users yet');
  set('kpi-plans-delta',   activePlans  ? activePlans + ' paid plans'  : 'No active plans');
  set('kpi-revenue-delta', todayRevenue ? 'Today\'s earnings'         : 'No payments today');
  set('kpi-tickets-delta', openTickets  ? openTickets + ' need reply'  : 'All clear');
}

/* ******************************************************
   FORGOT PASSWORD
****************************************************** */
function setupModalHandlers() {
  // Close buttons
  document.querySelectorAll(".close-modal-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;
      if (target) closeModal(target);
    });
  });
  // Close on backdrop click
  document.querySelectorAll(".modal-overlay").forEach(m => {
    m.addEventListener("click", e => { if (e.target === m) closeModal(m.id); });
  });

  // PIN digit auto-advance
  const pinDigits = document.querySelectorAll(".pin-digit");
  pinDigits.forEach((d, i) => {
    d.addEventListener("input", () => {
      if (d.value && i < pinDigits.length - 1) pinDigits[i+1].focus();
    });
    d.addEventListener("keydown", e => {
      if (e.key === "Backspace" && !d.value && i > 0) pinDigits[i-1].focus();
    });
  });

  // Verify PIN
  document.getElementById("verify-pin-btn").addEventListener("click", () => {
    const pin = ["pin1","pin2","pin3"].map(id => document.getElementById(id).value).join("");
    if (pin === RESET_PIN) {
      document.getElementById("forgot-step-1").classList.add("hidden");
      document.getElementById("forgot-step-2").classList.remove("hidden");
      document.getElementById("pin-error").textContent ="";
    } else {
      document.getElementById("pin-error").textContent = "Incorrect PIN. Please try again.";
      ["pin1","pin2","pin3"].forEach(id => { document.getElementById(id).value =""; });
      document.getElementById("pin1").focus();
    }
  });

  // Save new password
  document.getElementById("save-new-pw-btn").addEventListener("click", () => {
    const np = document.getElementById("new-password").value;
    const cp = document.getElementById("confirm-password").value;
    if (!np || np.length < 6) { document.getElementById("pw-error").textContent = "Password must be at least 6 characters."; return; }
    if (np !== cp)             { document.getElementById("pw-error").textContent = "Passwords do not match."; return; }
    userPassword = np;
    closeModal("forgot-modal");
    showToast("Password updated successfully!", "success");
    // Reset modal state
    document.getElementById("forgot-step-1").classList.remove("hidden");
    document.getElementById("forgot-step-2").classList.add("hidden");
    document.getElementById("new-password").value = "";
    document.getElementById("confirm-password").value = "";
    ["pin1","pin2","pin3"].forEach(id => { document.getElementById(id).value =""; });
  });

  // Confirm modal
  document.getElementById("confirm-ok-btn").addEventListener("click", () => {
    if (window._confirmCallback) { window._confirmCallback(); window._confirmCallback = null; }
    closeModal("confirm-modal");
  });
}

function openModal(id)  { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }

function confirmAction(title, msg, cb) {
  document.getElementById("confirm-title").textContent = title;
  document.getElementById("confirm-msg").textContent = msg;
  window._confirmCallback = cb;
  openModal("confirm-modal");
}

/* ******************************************************
   NAVIGATION
****************************************************** */
function setupNav() {
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
      const panel = item.dataset.panel;
      if (panel) showPanel(panel);
    });
  });
}

function showPanel(name) {
  // Hide all panels
  document.querySelectorAll(".panel").forEach(p => {
    p.classList.remove("active");
    p.classList.add("hidden");
  });
  // Show target panel
  const target = document.getElementById(`panel-${name}`);
  if (target) { target.classList.remove("hidden"); target.classList.add("active"); }

  // Update sidebar active
  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.toggle("active", item.dataset.panel === name);
  });

  currentPanel = name;

  // On mobile: collapse sidebar after nav
  if (window.innerWidth < 900) {
    document.getElementById("admin-sidebar").classList.remove("open");
  }
}

function setupSidebar() {
  document.getElementById("sidebar-toggle-btn").addEventListener("click", toggleSidebar);
}

function toggleSidebar() {
  const sidebar = document.getElementById("admin-sidebar");
  const main    = document.getElementById("admin-main");
  if (window.innerWidth < 900) {
    sidebar.classList.toggle("open");
  } else {
    sidebarOpen = !sidebarOpen;
    sidebar.classList.toggle("collapsed", !sidebarOpen);
    main.classList.toggle("expanded", !sidebarOpen);
  }
}

/* ******************************************************
   CHARTS
****************************************************** */
function buildRevenueChart() {
  // Revenue data — read from localStorage payments, default to zeros until real data arrives
  const stored = JSON.parse(localStorage.getItem('ar_payments') || '[]');
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const data   = days.map(() => 0);  // real data will populate as payments come in
  const labels = days;
  const max    = Math.max(...data) || 1;
  const wrap   = document.getElementById("revenue-chart");
  if (!wrap) return;
  wrap.innerHTML ="";
  if (!max || max === 1) { wrap.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-dim);font-size:.85rem">No payment data yet</div>'; return; }
  data.forEach((val, i) => {
    const bar = document.createElement("div");
    bar.className = "mini-bar";
    bar.style.height = `${(val/max)*100}%`;
    bar.title = `${labels[i]}: &#x20B9;${val.toLocaleString()}`;
    const lbl = document.createElement("span");
    lbl.className = "mini-bar-label";
    lbl.textContent = labels[i];
    bar.appendChild(lbl);
    wrap.appendChild(bar);
  });
}

function buildVisitorChart() {
  const wrap   = document.getElementById("visitor-chart");
  const labels = document.getElementById("visitor-labels");
  if (!wrap) return;
  const data = Array.from({length:30}, () => 0); // zeros until real visitor analytics configured
  const max  = Math.max(...data) || 1;
  wrap.innerHTML ="";
  if (labels) labels.innerHTML ="";
  if (max === 1) { wrap.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-dim);font-size:.85rem">Connect analytics to see visitor data</div>'; return; }
  data.forEach((val, i) => {
    const bar = document.createElement("div");
    bar.className = "bar-lg";
    bar.style.height = `${(val/max)*100}%`;
    bar.title = `Day ${i+1}: ${val} visitors`;
    wrap.appendChild(bar);
    const lbl = document.createElement("span");
    lbl.textContent = i % 5 === 0 ? `D${i+1}` :"";
    labels.appendChild(lbl);
  });
}

/* ******************************************************
   USERS TABLE
****************************************************** */
function buildUsersTable(filter ="", planFilter ="") {
  const tbody = document.getElementById("users-tbody");
  if (!tbody) return;
  // Read real users from localStorage (written by main site sign-up)
  let stored = []; try { stored = JSON.parse(localStorage.getItem('ar_accounts') || '[]'); } catch {}
  // Enrich with plan data
  let users = stored.map(function(u) {
    var planRaw = null; try { planRaw = JSON.parse(localStorage.getItem('ar_plan_' + u.email.toLowerCase()) || 'null'); } catch {}
    return { name: u.name || u.email.split('@')[0], email: u.email, plan: planRaw ? planRaw.plan : 'free',
             joined: u.created ? new Date(u.created).toLocaleDateString('en-IN') : '--',
             expiry: planRaw && planRaw.expiry ? new Date(planRaw.expiry).toLocaleDateString('en-IN') : '--',
             status: u.suspended ? 'suspended' : (planRaw && Date.now() < planRaw.expiry ? 'active' : (planRaw ? 'expired' : 'free')), id: u.email };
  });
  if (filter)     users = users.filter(u => u.name.toLowerCase().includes(filter) || u.email.toLowerCase().includes(filter));
  if (planFilter) users = users.filter(u => u.plan === planFilter.toLowerCase());

  const pages  = Math.ceil(users.length / PAGE_SIZE);
  const paged  = users.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE);

  document.getElementById("page-indicator").textContent = `Page ${currentPage} of ${pages || 1}`;
  document.getElementById("prev-page-btn").disabled = currentPage <= 1;
  document.getElementById("next-page-btn").disabled = currentPage >= pages;

  if (!paged.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2.5rem;color:var(--text-muted);font-size:.9rem">
      <i data-lucide="users" style="width:32px;height:32px;margin-bottom:.75rem;display:block;margin-inline:auto;opacity:.4"></i>
      No users yet. Users will appear here once they register on the main site.
    </td></tr>`;
    (typeof lucide!=='undefined'&&lucide.createIcons());
    return;
  }
  tbody.innerHTML = paged.map((u, i) => `
    <tr>
      <td><div class="user-cell">
        <div class="user-avatar-sm">${u.name.charAt(0)}</div>
        <div class="user-cell-info"><span>${u.name}</span><small>${u.email}</small></div>
      </div></td>
      <td><span class="plan-pill ${u.plan}">${u.plan.charAt(0).toUpperCase()+u.plan.slice(1)}</span></td>
      <td>${u.joined}</td>
      <td>${u.expiry}</td>
      <td><span class="status-pill ${u.status}">${u.status}</span></td>
      <td><div class="action-btns">
        <button class="btn-xs cyan" onclick="upgradeUser(${i})">Upgrade</button>
        <button class="btn-xs orange" onclick="suspendUser(${i},'${u.email}')">${u.status==='suspended'?'Unsuspend':'Suspend'}</button>
        <button class="btn-xs red" onclick="deleteUser(${i},'${u.name}')">Delete</button>
      </div></td>
    </tr>`).join("");
  (typeof lucide!=='undefined'&&lucide.createIcons());

  document.getElementById("user-search").oninput = e => { currentPage=1; buildUsersTable(e.target.value, document.getElementById("user-plan-filter").value); };
  document.getElementById("user-plan-filter").onchange = e => { currentPage=1; buildUsersTable(document.getElementById("user-search").value, e.target.value); };
  document.getElementById("prev-page-btn").onclick = () => { if (currentPage>1){ currentPage--; buildUsersTable(); }};
  document.getElementById("next-page-btn").onclick = () => { if (currentPage<pages){ currentPage++; buildUsersTable(); }};
}

function upgradeUser(i) {
  var accs=[]; try{accs=JSON.parse(localStorage.getItem('ar_accounts')||'[]');}catch{}
  var u=accs[i]; if(!u){showToast("User not found.","error");return;}
  var planOrder=['free','growth','scale','enterprise'];
  var pr=null; try{pr=JSON.parse(localStorage.getItem('ar_plan_'+u.email.toLowerCase())||'null');}catch{}
  var curr=(pr&&pr.plan)||'free'; var idx=planOrder.indexOf(curr.toLowerCase());
  var next=planOrder[Math.min(idx+1,planOrder.length-1)];
  if(next===curr){showToast("User is already on the highest plan.","info");return;}
  var expiry=Date.now()+30*24*60*60*1000;
  localStorage.setItem('ar_plan_'+u.email.toLowerCase(), JSON.stringify({plan:next,expiry:expiry,utr:'admin-upgrade'}));
  buildUsersTable(); updateKPIs();
  logAction("User Upgraded",""+u.email+" → "+next);
  showToast(u.email+" upgraded to "+next.charAt(0).toUpperCase()+next.slice(1)+"!","success");
}
function suspendUser(i, email) {
  var accs=[]; try{accs=JSON.parse(localStorage.getItem('ar_accounts')||'[]');}catch{}
  var u = accs.find(function(a){ return a.email.toLowerCase()===email.toLowerCase(); });
  var isSuspended = !!(u && u.suspended);
  var actionText = isSuspended ? "Unsuspend User" : "Suspend User";
  var promptMsg = isSuspended ? `Restore access for ${email}?` : `Suspend access for ${email}?`;

  confirmAction(actionText, promptMsg, () => {
    if (u) {
      u.suspended = !isSuspended;
      localStorage.setItem('ar_accounts', JSON.stringify(accs));
    }
    buildUsersTable();
    logAction(isSuspended ? "User Unsuspended" : "User Suspended", email);
    showToast(`${email} has been ${isSuspended ? 'unsuspended' : 'suspended'}.`, isSuspended ? "success" : "warning");
  });
}
function deleteUser(i, name) {
  confirmAction("Delete User", `Permanently delete ${name}? This cannot be undone.`, () => {
    var accs=[]; try{accs=JSON.parse(localStorage.getItem('ar_accounts')||'[]');}catch{}
    accs.splice(i, 1);
    localStorage.setItem('ar_accounts', JSON.stringify(accs));
    buildUsersTable();
    logAction("User Deleted", name);
    showToast(`${name} deleted.`, "error");
  });
}

/* ******************************************************
   PLANS EDITOR
****************************************************** */
function loadPlans() {
  const stored = localStorage.getItem(LS_PLANS);
  plans = stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(DEFAULT_PLANS));
}

function buildPlansEditor() {
  const grid = document.getElementById("plans-editor-grid");
  if (!grid) return;
  grid.innerHTML = Object.values(plans).map(plan => `
    <div class="plan-editor-card" id="editor-${plan.id}">
      <div class="plan-card-header">
        <div style="display:flex;align-items:center;gap:.6rem">
          <div class="plan-color-dot" style="background:${plan.color}"></div>
          <input type="text" class="admin-input" style="width:auto;flex:1;font-weight:700;font-size:1rem" value="${plan.name}" data-plan="${plan.id}" data-field="name">
        </div>
        <div style="display:flex;align-items:center;gap:.75rem">
          <span class="plan-badge" style="background:${plan.color}22;color:${plan.color}">${plan.popular?"POPULAR":""}</span>
          <label class="toggle"><input type="checkbox" ${plan.visible?"checked":""} data-plan="${plan.id}" data-field="visible"><span class="slider"></span></label>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:.75rem"><label>Price (&#x20B9; / month)</label>
        <input type="number" class="admin-input" value="${plan.price}" data-plan="${plan.id}" data-field="price">
      </div>
      <div class="form-group" style="margin-bottom:.75rem"><label>Description</label>
        <input type="text" class="admin-input" value="${plan.description}" data-plan="${plan.id}" data-field="description">
      </div>
      <div class="form-group" style="margin-bottom:.75rem"><label>Accent Color</label>
        <input type="color" value="${plan.color}" data-plan="${plan.id}" data-field="color" style="width:100%;height:38px;border-radius:6px;border:1px solid var(--border);background:transparent;cursor:pointer">
      </div>
      <label style="font-size:.78rem;font-weight:600;color:var(--text-muted);display:block;margin-bottom:.5rem">Features</label>
      <div id="features-${plan.id}">
        ${plan.features.map((f,fi) => `
          <div class="plan-feature-item">
            <input type="text" value="${f}" data-plan="${plan.id}" data-feat="${fi}">
            <button class="del-feat-btn" onclick="deleteFeat('${plan.id}',${fi})"><i data-lucide="x" style="width:12px;height:12px"></i></button>
          </div>`).join("")}
      </div>
      <button class="add-feat-btn" onclick="addFeat('${plan.id}')">+ Add Feature</button>
    </div>`).join("");

  // Live bind inputs
  grid.querySelectorAll("input[data-plan][data-field]").forEach(input => {
    input.addEventListener("input", e => {
      const {plan: pid, field} = e.target.dataset;
      plans[pid][field] = field==="price" ? Number(e.target.value) : (e.target.type==="checkbox" ? e.target.checked : e.target.value);
    });
  });
  grid.querySelectorAll("input[data-plan][data-feat]").forEach(input => {
    input.addEventListener("input", e => {
      const {plan: pid, feat} = e.target.dataset;
      plans[pid].features[parseInt(feat)] = e.target.value;
    });
  });

  // Save plans btn
  document.getElementById("save-plans-btn").onclick = savePlans;
  (typeof lucide!=='undefined'&&lucide.createIcons());
}

function addFeat(planId) {
  plans[planId].features.push("New feature");
  buildPlansEditor();
}
function deleteFeat(planId, idx) {
  plans[planId].features.splice(idx, 1);
  buildPlansEditor();
}
function savePlans() {
  localStorage.setItem(LS_PLANS, JSON.stringify(plans));
  logAction("Plans Updated", "Plan Editor");
  showToast("Plans saved! Main site will reflect changes instantly.", "success");
}

/* ******************************************************
   SUPPORT INBOX
****************************************************** */
function buildSupportInbox() {
  // Read real queries from localStorage (written by main site support form)
  let allQueries = [];
  try { allQueries = JSON.parse(localStorage.getItem(LS_QUERIES) || "[]"); } catch(e){}

  const inbox = document.getElementById("support-inbox");
  if (!inbox) return;
  if (!allQueries.length) {
    inbox.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:3rem;color:var(--text-dim);text-align:center;gap:.75rem"><i data-lucide="inbox" style="width:40px;height:40px;opacity:.3"></i><p style="font-size:.9rem">No support queries yet.<br>Queries from users will appear here.</p></div>`;
    (typeof lucide!=='undefined'&&lucide.createIcons());
    syncSupportBadge();
    return;
  }
  inbox.innerHTML = allQueries.map(q => `
    <div class="support-item ${selectedQuery===q.id?"active":""}" data-id="${q.id}" onclick="openQuery(${q.id})">
      <div class="support-item-header">
        <span class="support-sender">${q.name}</span>
        <span class="support-time">${q.time}</span>
      </div>
      <div class="support-subject">${q.subject.charAt(0).toUpperCase()+q.subject.slice(1)}</div>
      <div class="support-preview">${q.msg}</div>
    </div>`).join("");
  syncSupportBadge();
}

function openQuery(id) {
  var allQueries = []; try { allQueries = JSON.parse(localStorage.getItem('ar_support_queries') || '[]'); } catch {}
  const q = allQueries.find(x => x.id === id);
  if (!q) return;
  selectedQuery = id;
  const viewer = document.getElementById("support-viewer");
  viewer.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;flex-wrap:wrap;gap:.75rem">
      <div>
        <h4 style="font-size:1rem;font-weight:700;margin-bottom:.2rem">${q.name} <span style="font-weight:400;color:var(--text-muted)"><${q.email}></span></h4>
        <div style="font-size:.8rem;color:var(--text-dim)">${q.time} &middot; Subject: <strong style="color:var(--cyan)">${q.subject}</strong></div>
      </div>
      <div style="display:flex;gap:.5rem">
        <span class="badge-${q.status==="open"?"cyan":"green"}">${q.status}</span>
        <button class="btn-xs green" onclick="resolveQuery(${q.id})">Mark Resolved</button>
      </div>
    </div>
    <div style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:8px;padding:1rem;margin-bottom:1rem;font-size:.9rem;line-height:1.6;color:var(--text-muted)">${q.msg}</div>
    ${q.attachments.length ? `<div style="margin-bottom:1rem"><strong style="font-size:.8rem;color:var(--text-muted)">ATTACHMENTS</strong><div style="display:flex;gap:.5rem;margin-top:.4rem">${q.attachments.map(a=>`<span style="background:rgba(0,229,255,.08);border:1px solid rgba(0,229,255,.2);border-radius:6px;padding:3px 10px;font-size:.8rem;color:var(--cyan)">${a}</span>`).join("")}</div></div>` : ""}
    
    ${q.replies && q.replies.length ? `
      <div style="margin-bottom:1rem">
        <strong style="font-size:.8rem;color:var(--text-muted)">CONVERSATION THREAD</strong>
        <div style="margin-top:.4rem;display:flex;flex-direction:column;gap:.5rem">
          ${q.replies.map(r => `
            <div style="background:rgba(0,229,255,.03);border:1px solid rgba(0,229,255,.1);border-radius:8px;padding:.75rem;margin-left:1.5rem">
              <div style="display:flex;justify-content:space-between;font-size:.75rem;color:var(--text-dim);margin-bottom:.25rem">
                <strong>${r.sender}</strong>
                <span>${r.time}</span>
              </div>
              <div style="font-size:.85rem;color:var(--text-primary);line-height:1.5">${r.text}</div>
            </div>
          `).join("")}
        </div>
      </div>
    ` : ""}

    <div class="form-group"><label>Reply to ${q.email}</label><textarea class="admin-textarea" rows="4" id="reply-msg" placeholder="Type your reply..."></textarea></div>
    <div style="display:flex;gap:.75rem;margin-top:.75rem">
      <button class="btn-action green" onclick="sendReply(${q.id})"><i data-lucide="send"></i> Send Reply</button>
      <button class="btn-action red" onclick="deleteQuery(${q.id})"><i data-lucide="trash-2"></i> Delete</button>
    </div>`;
  (typeof lucide!=='undefined'&&lucide.createIcons());
  buildSupportInbox();
}

function resolveQuery(id) {
  var queries = []; try { queries = JSON.parse(localStorage.getItem('ar_support_queries') || '[]'); } catch {}
  var q = queries.find(function(x) { return x.id === id; });
  if (q) { q.status = "resolved"; localStorage.setItem('ar_support_queries', JSON.stringify(queries)); buildSupportInbox(); openQuery(id); showToast("Query marked as resolved.", "success"); }
}
function sendReply(id) {
  const msg = document.getElementById("reply-msg")?.value;
  if (!msg?.trim()) { showToast("Please enter a reply message.", "error"); return; }
  
  var allQueries = [];
  try { allQueries = JSON.parse(localStorage.getItem('ar_support_queries') || '[]'); } catch {}
  
  var q = allQueries.find(x => x.id === id);
  if (q) {
    if (!q.replies) q.replies = [];
    q.replies.push({
      sender: 'Admin',
      text: msg,
      time: new Date().toLocaleString('en-IN')
    });
    q.status = 'resolved';
    localStorage.setItem('ar_support_queries', JSON.stringify(allQueries));
    
    showToast(`Reply sent to ${q.email}!`, "success");
    document.getElementById("reply-msg").value = "";
    
    buildSupportInbox();
    openQuery(id);
  } else {
    showToast("Support query not found.", "error");
  }
}
function deleteQuery(id) {
  confirmAction("Delete Query", "Remove this support query permanently?", function() {
    var qdel=[]; try{qdel=JSON.parse(localStorage.getItem('ar_support_queries')||'[]');}catch{}
    qdel = qdel.filter(function(x){return x.id !== id;});
    localStorage.setItem('ar_support_queries', JSON.stringify(qdel));
    selectedQuery = null;
    document.getElementById("support-viewer").innerHTML = `<div class="empty-support-state"><i data-lucide="inbox"></i><p>Select a query to view</p></div>`;
    buildSupportInbox();
    showToast("Query deleted.", "info");
    (typeof lucide!=='undefined'&&lucide.createIcons());
  });
}
function syncSupportBadge() {
  var allQ=[]; try{allQ=JSON.parse(localStorage.getItem('ar_support_queries')||'[]');}catch{}
  const open = allQ.filter(function(q){return q.status === "open";}).length;
  const badge = document.getElementById("support-badge");
  if (badge) badge.textContent = open;
}

/* ******************************************************
   API KEY MANAGER (9 SLOTS)
****************************************************** */
function buildApiKeyGrid() {
  const grid = document.getElementById("api-key-grid");
  if (!grid) return;
  let keys = getGeminiKeys();
  grid.innerHTML = Array.from({length:9}, (_,i) => {
    const usage = [34,0,0,0,0,0,0,0,0][i];
    const level = usage < 40 ? "low" : usage < 75 ? "med" : "high";
    return `
    <div class="api-key-slot ${i===activeKeyIndex?"active-slot":""}" id="key-slot-${i}">
      <div class="slot-header">
        <span class="slot-label">Key #${i+1}</span>
        ${i===activeKeyIndex?'<span class="slot-active-badge">ACTIVE</span>':""}
      </div>
      <div class="slot-input-wrap">
        <input type="password" class="slot-input" id="slot-input-${i}" placeholder="AIzaSy... (Gemini API key)" value="${keys[i]||""}">
      </div>
      <div class="slot-usage"><span>Usage today</span><span>${usage ? usage*15+" / 1500" : "0 / 1500"} req</span></div>
      <div class="usage-bar-wrap"><div class="usage-bar-fill ${level}" style="width:${usage}%"></div></div>
    </div>`;
  }).join("");

  document.getElementById("current-key-display").value = `Key #${activeKeyIndex+1}`;

  document.getElementById("save-keys-btn").onclick = saveApiKeys;
  document.getElementById("force-rotate-btn").onclick = forceRotate;
  (typeof lucide!=='undefined'&&lucide.createIcons());
}

function getGeminiKeys() {
  try { return JSON.parse(localStorage.getItem(LS_KEYS) || "[]"); } catch { return []; }
}
function saveApiKeys() {
  const keys = Array.from({length:9}, (_,i) => document.getElementById(`slot-input-${i}`)?.value || "");
  localStorage.setItem(LS_KEYS, JSON.stringify(keys));
  logAction("API Keys Saved", "Key Manager");
  showToast("API keys saved! Rotation pool active.", "success");
}
function forceRotate() {
  const keys = getGeminiKeys().filter(k => k.trim());
  if (keys.length <= 1) { showToast("Add more keys to rotate!", "error"); return; }
  activeKeyIndex = (activeKeyIndex + 1) % keys.length;
  localStorage.setItem(LS_KEY_INDEX, activeKeyIndex);
  buildApiKeyGrid();
  logAction(`API Key Rotated -> Key #${activeKeyIndex+1}`, "Key Manager");
  showToast(`Rotated to Key #${activeKeyIndex+1}`, "info");
}

// AUTO-ROTATION LOGIC: Main site calls this before every AI request
function getActiveGeminiKey() {
  const keys = getGeminiKeys().filter(k => k.trim());
  if (!keys.length) return null;
  const idx = parseInt(localStorage.getItem(LS_KEY_INDEX) || "0") % keys.length;
  return keys[idx];
}
window.AR_getActiveGeminiKey = getActiveGeminiKey;

/* ******************************************************
   GEMINI KEY SLOTS IN SYSTEM SETUP
****************************************************** */
function buildGeminiKeySlots() {
  const grid = document.getElementById("gemini-keys-grid");
  if (!grid) return;
  const keys = getGeminiKeys();
  grid.innerHTML = Array.from({length:9}, (_,i) => `
    <div class="gemini-slot ${i===activeKeyIndex?"active":""}">
      <div class="gemini-slot-header">
        <span class="gem-label">KEY #${i+1}</span>
        ${i===activeKeyIndex?'<span class="gem-active">&#9679; ACTIVE</span>':""}
      </div>
      <input type="password" class="admin-input" id="gem-key-${i}" placeholder="AIzaSy..." value="${keys[i]|| ""}">
    </div>`).join("");
}

/* ******************************************************
   FRAMEWORKS GRID
****************************************************** */
function buildFrameworksGrid() {
  const grid = document.getElementById("frameworks-grid");
  if (!grid) return;
  grid.innerHTML = FRAMEWORKS_DATA.map(fw => `
    <div class="framework-card ${fw.enabled?"enabled":""}">
      <div class="fw-header">
        <span class="fw-name">${fw.name}</span>
        <label class="toggle"><input type="checkbox" ${fw.enabled?"checked":""} onchange="toggleFw('${fw.id}',this.checked)"><span class="slider"></span></label>
      </div>
      <p class="fw-desc">${fw.desc}</p>
      <div class="fw-plans">Available on: <strong>${fw.plans}</strong></div>
    </div>`).join("");
}
function toggleFw(id, val) {
  const fw = FRAMEWORKS_DATA.find(f => f.id === id);
  if (fw) { fw.enabled = val; buildFrameworksGrid(); showToast(`${fw.name} ${val?"enabled":"disabled"}.`, "info"); }
}
function saveFrameworks() {
  localStorage.setItem("ar_frameworks", JSON.stringify(FRAMEWORKS_DATA));
  showToast("Framework settings saved.", "success");
}

/* ******************************************************
   PAYMENTS TABLE
****************************************************** */
function buildPaymentsTable() {
  let stored = [];
  try { stored = JSON.parse(localStorage.getItem(LS_PAYMENTS) || "[]"); } catch {}
  const all = stored;
  const tbody = document.getElementById("payments-tbody");
  if (!tbody) return;
  if (!all.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2.5rem;color:var(--text-muted);font-size:.9rem">
      <i data-lucide="credit-card" style="width:32px;height:32px;margin-bottom:.75rem;display:block;margin-inline:auto;opacity:.4"></i>
      No payments yet. Transactions will appear here once users purchase plans.
    </td></tr>`;
    return;
  }
  tbody.innerHTML = all.map(p => `
    <tr>
      <td>${p.user}</td>
      <td><span class="plan-pill ${p.plan.toLowerCase()}">${p.plan}</span></td>
      <td style="color:var(--green);font-weight:700">${p.amount}</td>
      <td style="font-size:.78rem;color:var(--text-dim);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${p.ref}">${p.ref}</td>
      <td>${p.time}</td>
      <td><span class="badge-${p.status==="completed"?"green":p.status==="pending"?"yellow":"red"}">${p.status}</span></td>
      <td><div class="action-btns">
        ${p.status==="pending"?`<button class="btn-xs green" onclick="approvePay('${p.ref}')">Approve</button>`:""}
        <button class="btn-xs red" onclick="refundPay('${p.ref}')">Refund</button>
      </div></td>
    </tr>`).join("");
  (typeof lucide!=='undefined'&&lucide.createIcons());
}
function approvePay(ref) {
  let payments = [];
  try { payments = JSON.parse(localStorage.getItem(LS_PAYMENTS) || "[]"); } catch {}
  let payRecord = payments.find(p => p.ref === ref);
  if (payRecord) {
    payRecord.status = 'completed';
    localStorage.setItem(LS_PAYMENTS, JSON.stringify(payments));
    
    // Activate user plan
    const userEmail = payRecord.user;
    const planName = payRecord.plan.toLowerCase();
    const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
    localStorage.setItem('ar_plan_' + userEmail.toLowerCase(), JSON.stringify({
      plan: planName,
      expiry: expiry,
      utr: ref
    }));
    
    logAction("Payment Approved", "User: " + userEmail + ", Plan: " + payRecord.plan);
    showToast(`Payment approved for ${userEmail}. Plan activated!`, "success");
    
    buildPaymentsTable();
    updateKPIs();
    updateDonutChart();
    updateActivityFeed();
  } else {
    showToast("Payment transaction reference not found.", "error");
  }
}

function refundPay(ref) {
  let payments = [];
  try { payments = JSON.parse(localStorage.getItem(LS_PAYMENTS) || "[]"); } catch {}
  let payRecord = payments.find(p => p.ref === ref);
  if (payRecord) {
    confirmAction("Process Refund / Reject", `Issue a refund or reject payment (UTR: ${ref})?`, () => {
      payRecord.status = 'refunded';
      localStorage.setItem(LS_PAYMENTS, JSON.stringify(payments));
      
      // Remove user plan
      const userEmail = payRecord.user;
      localStorage.removeItem('ar_plan_' + userEmail.toLowerCase());
      
      logAction("Payment Refunded/Rejected", "User: " + userEmail);
      showToast(`Refund processed for ${userEmail}. Plan revoked.`, "warning");
      
      buildPaymentsTable();
      updateKPIs();
      updateDonutChart();
      updateActivityFeed();
    });
  } else {
    showToast("Payment transaction reference not found.", "error");
  }
}
function exportPayments() {
  var payments=[]; try{payments=JSON.parse(localStorage.getItem('ar_payments')||'[]');}catch{}
  const csv = ["User,Plan,Amount,Reference,Time,Status", ...payments.map(function(p){return `${p.user},${p.plan},${p.amount},"${p.ref||''}",${ p.time||''  },${p.status||''}`; })].join("\n");
  downloadFile("payments.csv", csv, "text/csv");
  showToast("Payments CSV exported.", "success");
}

/* ******************************************************
   WEBSITE SETTINGS
****************************************************** */
(function initWebsiteSettings() {
  const saveSettingsBtn = document.getElementById("save-settings-btn");
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener("click", () => {
      const settings = {};
      document.querySelectorAll("[data-key]").forEach(el => {
        settings[el.dataset.key] = el.type === "checkbox" ? el.checked : el.value;
      });
      settings.hero_title_1  = document.getElementById("hero-title-1")?.value;
      settings.hero_title_2  = document.getElementById("hero-title-2")?.value;
      settings.hero_subtitle = document.getElementById("hero-subtitle")?.value;
      settings.upi_id        = document.getElementById("upi-id-setting")?.value;
      settings.upi_name      = document.getElementById("upi-name-setting")?.value;
      localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
      logAction("Settings Saved", "Website Settings");
      showToast("Website settings saved! Changes applied to main site.", "success");
    });
  }
})();

/* ******************************************************
   SYSTEM SETUP  - SAVE ALL CREDENTIALS
****************************************************** */
(function initSystemSetup() {
  const initBtn = document.getElementById("init-system-btn");
  const initBig = document.getElementById("init-big-btn");
  [initBtn, initBig].forEach(btn => {
    if (btn) btn.addEventListener("click", initializeSystem);
  });
})();


function loadWebsiteSettings() {
  try {
    const s = JSON.parse(localStorage.getItem("ar_settings") || "{}");
    const setVal = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
    const setChk = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.checked = val; };
    setVal("hero-title-1",    s.hero_title_1);
    setVal("hero-title-2",    s.hero_title_2);
    setVal("hero-subtitle",   s.hero_subtitle);
    setVal("upi-id-setting",  s.upi_id   || "6372843175@kotakbank");
    setVal("upi-name-setting",s.upi_name || "AuditReady.AI");
    setVal("admin-email-setting", s.admin_email || "prakharmishra00000@gmail.com");
    setChk("maintenance-toggle", s.maintenance_mode);
    // Restore all data-key fields
    document.querySelectorAll("[data-key]").forEach(el => {
      const key = el.dataset.key;
      if (s[key] !== undefined) {
        if (el.type === "checkbox") el.checked = s[key];
        else if (!el.value) el.value = s[key]; // don't overwrite cred fields already set
      }
    });
    console.log("[AR Admin] Website settings restored from localStorage");
  } catch(e) { console.warn("[AR Admin] Could not restore settings:", e); }
}

function loadCredentialFields() {
  let creds = {};
  try { creds = JSON.parse(localStorage.getItem(LS_CREDS) || "{}"); } catch {}
  document.querySelectorAll(".cred-input").forEach(input => {
    const key = input.dataset.key;
    if (creds[key] !== undefined) input.value = creds[key];
  });
  // Sync gemini keys from cred store
  const keys = getGeminiKeys();
  Array.from({length:9}, (_,i) => {
    const el = document.getElementById(`gem-key-${i}`);
    if (el && keys[i]) el.value = keys[i];
  });
}

function initializeSystem() {
  const creds = {};
  document.querySelectorAll(".cred-input").forEach(input => {
    if (input.value.trim()) creds[input.dataset.key] = input.value.trim();
  });

  // Save Gemini keys to rotation pool
  const geminiKeys = Array.from({length:9}, (_,i) => document.getElementById(`gem-key-${i}`)?.value.trim() || "").filter(Boolean);
  // Also check api-key-grid slots
  Array.from({length:9}, (_,i) => {
    const el = document.getElementById(`slot-input-${i}`);
    if (el?.value.trim() && !geminiKeys[i]) geminiKeys.push(el.value.trim());
  });
  if (geminiKeys.length) localStorage.setItem(LS_KEYS, JSON.stringify(geminiKeys));

  // Also save UPI and admin email to ar_credentials so main site reads them
  const upiId   = document.getElementById('upi-id-setting')?.value.trim();
  const upiName = document.getElementById('upi-name-setting')?.value.trim();
  const adminEmail = document.getElementById('admin-email-setting')?.value.trim();
  if (upiId)    creds['UPI_ID']    = upiId;
  if (upiName)  creds['UPI_NAME']  = upiName;
  if (adminEmail) creds['ADMIN_EMAIL'] = adminEmail;

  localStorage.setItem(LS_CREDS, JSON.stringify(creds));
  localStorage.setItem("ar_system_initialized", "1");
  localStorage.setItem("ar_system_init_time", new Date().toISOString());

  // Update status bar
  const bar = document.getElementById("setup-status-bar");
  if (bar) {
    bar.className = "setup-status-bar success";
    bar.innerHTML = `<i data-lucide="check-circle"></i> System Initialized - ${Object.keys(creds).length} credentials loaded. Main site is now fully configured. Last updated: ${new Date().toLocaleString()}`;
    (typeof lucide!=='undefined'&&lucide.createIcons());
  }

  logAction("System Initialized", `${Object.keys(creds).length} credentials saved`);
  buildApiKeyGrid();
  showToast(`System initialized! ${Object.keys(creds).length} credentials saved and applied.`, "success");
}

function clearAllCredentials() {
  confirmAction("Clear All Credentials", "This will remove all stored credentials. Are you sure?", () => {
    localStorage.removeItem(LS_CREDS);
    localStorage.removeItem(LS_KEYS);
    document.querySelectorAll(".cred-input").forEach(i => { if (!i.dataset.key?.includes("UPI") && !i.dataset.key?.includes("DOCUSIGN_BASE_URL")) i.value =""; });
    buildGeminiKeySlots();
    showToast("All credentials cleared.", "error");
  });
}

function testAllConnections() {
  const creds = JSON.parse(localStorage.getItem(LS_CREDS) || '{}');
  const gemKey = getActiveGeminiKey();
  if (!gemKey) {
    showToast('No Gemini API key found. Add one in System Setup.', 'error');
    return;
  }
  showToast('Testing Gemini API connection...', 'info');
  fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${gemKey}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({contents:[{parts:[{text:'Reply with exactly: OK'}]}]})
  }).then(r => r.json()).then(d => {
    const reply = d?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (reply.includes('OK') || reply.length > 0) {
      showToast('✅ Gemini API connected and working!', 'success');
    } else {
      showToast('⚠️ Gemini responded but unexpectedly. Check API key.', 'info');
    }
  }).catch(() => showToast('❌ Gemini API connection failed. Check your key.', 'error'));
  // Check Worker URL
  const workerUrl = creds.CLOUDFLARE_WORKER_URL || creds.WORKER_URL;
  if (workerUrl) {
    setTimeout(() => showToast('✅ Worker URL is configured.', 'success'), 500);
  }
}

function generateJWT() {
  const chars = "0123456789abcdef";
  const jwt = Array.from({length:128}, () => chars[Math.floor(Math.random()*16)]).join("");
  const el = document.getElementById("jwt-secret-input");
  if (el) { el.value = jwt; el.type = "text"; setTimeout(() => { el.type="password"; }, 3000); }
  showToast("JWT secret generated! Will hide in 3 seconds.", "info");
}

/* ******************************************************
   AUDIT LOG
****************************************************** */
let auditLog = [...AUDIT_LOG_DATA];

function buildAuditLog() {
  const tbody = document.getElementById("audit-log-tbody");
  if (!tbody) return;
  if (!auditLog.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2.5rem;color:var(--text-muted);font-size:.9rem">
      <i data-lucide="shield" style="width:32px;height:32px;margin-bottom:.75rem;display:block;margin-inline:auto;opacity:.4"></i>
      No actions recorded yet. Every admin action is logged here automatically.
    </td></tr>`;
    (typeof lucide!=='undefined'&&lucide.createIcons());
    return;
  }
  tbody.innerHTML = auditLog.map(l => `
    <tr>
      <td style="color:var(--text-primary)">${l.action}</td>
      <td>${l.admin}</td>
      <td>${l.target}</td>
      <td>${l.ip}</td>
      <td>${l.ts}</td>
    </tr>`).join("");
}

function logAction(action, target) {
  // Also persist to localStorage for activity feed
  try {
    var logs=[]; try{logs=JSON.parse(localStorage.getItem('ar_audit_log')||'[]');}catch{}
    logs.unshift({action:action,target:target||'',ts:Date.now()});
    if(logs.length>100) logs=logs.slice(0,100);
    localStorage.setItem('ar_audit_log', JSON.stringify(logs));
  } catch {}
  auditLog.unshift({ action, admin: ADMIN_EMAIL, target, ip:"192.168.1.1", ts: new Date().toLocaleTimeString() });
  if (auditLog.length > 100) auditLog.pop();
  buildAuditLog();
}

function exportLog() {
  const csv = ["Action,Admin,Target,IP,Timestamp", ...auditLog.map(l=>`"${l.action}",${l.admin},"${l.target}",${l.ip},${l.ts}`)].join("\n");
  downloadFile("audit_log.csv", csv, "text/csv");
  showToast("Audit log exported.", "success");
}

/* ******************************************************
   REPORTS
****************************************************** */
function exportCSV(type) {
  let csv ="";
  switch(type) {
    case "users": {
      var udata=[]; try{udata=JSON.parse(localStorage.getItem('ar_accounts')||'[]');}catch{}
      var enriched = udata.map(function(u){ var pr=null; try{pr=JSON.parse(localStorage.getItem('ar_plan_'+u.email.toLowerCase())||'null');}catch{} return {name:u.name||u.email.split('@')[0],email:u.email,plan:pr?pr.plan:'free',joined:u.created?new Date(u.created).toLocaleDateString('en-IN'):'--',expiry:pr&&pr.expiry?new Date(pr.expiry).toLocaleDateString('en-IN'):'--',status:u.suspended?'suspended':(pr&&Date.now()<pr.expiry?'active':(pr?'expired':'free'))}; });
      csv = ["Name,Email,Plan,Joined,Expiry,Status",...enriched.map(u=>`${u.name},${u.email},${u.plan},${u.joined},${u.expiry},${u.status}`)].join("\n");
      break;
    }
    case "payments": {
      var pdata=[]; try{pdata=JSON.parse(localStorage.getItem('ar_payments')||'[]');}catch{}
      csv = ["User,Plan,Amount,Reference,Time,Status",...pdata.map(p=>`${p.user},${p.plan},${p.amount},"${p.ref||''}",${p.time||''},${p.status||''}`)].join("\n");
      break;
    }
    case "support": {
      var sdata=[]; try{sdata=JSON.parse(localStorage.getItem('ar_support_queries')||'[]');}catch{}
      csv = ["Name,Email,Subject,Status,Time",...sdata.map(q=>`${q.name},${q.email},${q.subject},${q.status},${q.time}`)].join("\n");
      break;
    }
    default:
      csv = "No data";
  }
  downloadFile(`${type}_report.csv`, csv, "text/csv");
  showToast(`${type.charAt(0).toUpperCase()+type.slice(1)} report downloaded!`, "success");
}

/* ******************************************************
   UTILITIES
****************************************************** */
function showToast(msg, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  const icons = {success:"check-circle", error:"x-circle", warning:"alert-triangle", info:"info"};
  toast.innerHTML = `<i data-lucide="${icons[type]||"info"}" style="width:16px;height:16px;flex-shrink:0"></i> ${msg}`;
  container.appendChild(toast);
  (typeof lucide!=='undefined'&&lucide.createIcons());
  setTimeout(() => {
    toast.style.opacity = "0"; toast.style.transform = "translateX(100%)"; toast.style.transition = "all .3s";
    setTimeout(() => toast.remove(), 350);
  }, 4000);
}

function downloadFile(name, content, mime) {
  const blob = new Blob([content], {type: mime});
  const a    = document.createElement("a");
  a.href     = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Expose showPanel globally (used in HTML onclick)
window.showPanel         = showPanel;
window.showToast         = showToast;
window.addFeat           = addFeat;
window.deleteFeat        = deleteFeat;
window.upgradeUser       = upgradeUser;
window.suspendUser       = suspendUser;
window.deleteUser        = deleteUser;
window.openQuery         = openQuery;
window.resolveQuery      = resolveQuery;
window.sendReply         = sendReply;
window.deleteQuery       = deleteQuery;
window.approvePay        = approvePay;
window.refundPay         = refundPay;
window.exportPayments    = exportPayments;
window.exportCSV         = exportCSV;
window.exportLog         = exportLog;
window.toggleFw          = toggleFw;
window.saveFrameworks    = saveFrameworks;
window.clearAllCredentials = clearAllCredentials;
window.testAllConnections  = testAllConnections;
window.generateJWT       = generateJWT;
window.forceRotate       = forceRotate;



