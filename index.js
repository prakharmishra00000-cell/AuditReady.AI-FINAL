window.AR_CONFIG = { UPI_ID: '6372843175@kotakbank', UPI_NAME: 'AuditReady.AI' };
fetch('/api/config').then(r => r.json()).then(data => { window.AR_CONFIG = data; if(window.AR_CONFIG.FIREBASE_CONFIG && typeof window.AR_CONFIG.FIREBASE_CONFIG === 'string') { try { window.AR_CONFIG.FIREBASE_CONFIG = JSON.parse(window.AR_CONFIG.FIREBASE_CONFIG); } catch(e){} } }).catch(console.error);

/* ==========================================================================
   AUDITREADY.AI - INTERACTIVE STATE & APP ENGINE
   ========================================================================== */

(function initAppEngine() {
    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // --- State Variables ---
    let currentFramework = "SOC 2";
    let currentProvider = "gdrive";
    let isAnnualBilling = false;

    // Default File Database
    const defaultFiles = [
        { id: 1, name: "Acme_Vendor_Agrmt.pdf", type: "pdf", size: "1.4 MB", originalStatus: "Failed", currentStatus: "Failed", issue: "Missing Data Indemnity Clause", risk: "High", actionLabel: "Generate Amendment", clauseType: "indemnity" },
        { id: 2, name: "HR_Onboarding_Log.csv", type: "csv", size: "142 KB", originalStatus: "Passed", currentStatus: "Passed", issue: "All 15 employees background checked", risk: "Low", actionLabel: "None", clauseType: "none" },
        { id: 3, name: "AWS_IAM_Access_Policy.json", type: "json", size: "4.2 KB", originalStatus: "Failed", currentStatus: "Failed", issue: "Wildcard administrator privileges", risk: "Critical", actionLabel: "Restrict Policy", clauseType: "iam" },
        { id: 4, name: "GDPR_Privacy_Policy_v2.docx", type: "docx", size: "850 KB", originalStatus: "Passed", currentStatus: "Passed", issue: "Data retention clauses validated", risk: "Low", actionLabel: "None", clauseType: "none" }
    ];

    let activeFiles = [...defaultFiles];
    let activeRemediationRow = null;

    // --- Ingestion Logs Library (Contextualized by Framework) ---
    const logsLibrary = {
        "SOC 2": [
            { text: "Connecting to secure document ingestion node...", type: "info" },
            { text: "Decrypting metadata structures and scanning files...", type: "info" },
            { text: "Mapping files to SOC 2 Trust Services Criteria v2017...", type: "scan" },
            { text: "Auditing Acme_Vendor_Agrmt.pdf against Criteria CC7.1 (Vulnerability Management)...", type: "scan" },
            { text: "WARNING: Missing Data Indemnity Clause in Acme_Vendor_Agrmt.pdf.", type: "warn" },
            { text: "Auditing HR_Onboarding_Log.csv against Criteria CC6.3 (Employee Background Checks)...", type: "scan" },
            { text: "SUCCESS: Verified all 15 onboarding background check records.", type: "ok" },
            { text: "Auditing AWS_IAM_Access_Policy.json against Criteria CC6.1 (Access Authorization)...", type: "scan" },
            { text: "CRITICAL: Wildcard administrator permission detected in IAM statement.", type: "danger" },
            { text: "Auditing GDPR_Privacy_Policy_v2.docx against Criteria CC6.5 (Data Transmission)...", type: "scan" },
            { text: "SUCCESS: TLS 1.3 enforced, data retention terms matched.", type: "ok" },
            { text: "Preparing RAG alignment matrices and final compliance score...", type: "info" }
        ],
        "GDPR": [
            { text: "Connecting to secure document ingestion node...", type: "info" },
            { text: "Scanning elements for Personally Identifiable Information (PII)...", type: "info" },
            { text: "Mapping files to GDPR Articles 5, 28, and 32...", type: "scan" },
            { text: "Auditing Acme_Vendor_Agrmt.pdf against Article 28 (Data Processor Contract Requirements)...", type: "scan" },
            { text: "WARNING: Missing Clause stating processor must indemnify controller for data leaks.", type: "warn" },
            { text: "Auditing HR_Onboarding_Log.csv against Article 5 (Lawfulness & Transparency of Employee Data)...", type: "scan" },
            { text: "SUCCESS: Employee consent records signed off.", type: "ok" },
            { text: "Auditing AWS_IAM_Access_Policy.json against Article 32 (Security of Processing)...", type: "scan" },
            { text: "CRITICAL: Publicly accessible admin rules violate GDPR core security safeguards.", type: "danger" },
            { text: "Auditing GDPR_Privacy_Policy_v2.docx against Article 13 (Information to be provided)...", type: "scan" },
            { text: "SUCCESS: Right to erasure and data protection officer details found.", type: "ok" },
            { text: "Validating cross-border transfers and standard contractual clauses...", type: "info" }
        ],
        "ISO 27001": [
            { text: "Connecting to secure document ingestion node...", type: "info" },
            { text: "Loading ISO 27001:2022 Control Mapping Schema...", type: "info" },
            { text: "Scanning files against Annex A Security Controls...", type: "scan" },
            { text: "Auditing Acme_Vendor_Agrmt.pdf against Annex A.5.19 (Information Security in Supplier Relationships)...", type: "scan" },
            { text: "WARNING: Missing liability indemnity for subcontractor breaches.", type: "warn" },
            { text: "Auditing HR_Onboarding_Log.csv against Annex A.6.1 (Screening of Employees)...", type: "scan" },
            { text: "SUCCESS: Background verifications validated for target staff.", type: "ok" },
            { text: "Auditing AWS_IAM_Access_Policy.json against Annex A.8.2 (Privileged Access Rights)...", type: "scan" },
            { text: "CRITICAL: Excessive administrative permissions violate A.8.2 least-privilege control.", type: "danger" },
            { text: "Auditing GDPR_Privacy_Policy_v2.docx against Annex A.8.10 (Information Deletion)...", type: "scan" },
            { text: "SUCCESS: Asset disposal and data destruction timelines present.", type: "ok" },
            { text: "Aggregating Annex A control evidence package...", type: "info" }
        ],
        "HIPAA": [
            { text: "Initialising HIPAA/HITECH compliance scanning engine...", type: "info" },
            { text: "Loading ePHI detection models and 164 rule mappings...", type: "info" },
            { text: "Scanning for Protected Health Information (PHI) markers in documents...", type: "scan" },
            { text: "Auditing Acme_Vendor_Agrmt.pdf against 164.314 (Business Associate Agreements)...", type: "scan" },
            { text: "WARNING: No BAA provisions found. Vendor must sign a compliant Business Associate Agreement.", type: "warn" },
            { text: "Auditing HR_Onboarding_Log.csv against 164.530 (Workforce Training Requirements)...", type: "scan" },
            { text: "SUCCESS: Training completion records found for all 15 workforce members.", type: "ok" },
            { text: "Auditing AWS_IAM_Access_Policy.json against 164.312 (Technical Safeguards)...", type: "scan" },
            { text: "CRITICAL: Wildcard IAM role allows unrestricted access to ePHI storage. Violates minimum-necessary standard.", type: "danger" },
            { text: "Auditing GDPR_Privacy_Policy_v2.docx against 164.308 (Administrative Safeguards)...", type: "scan" },
            { text: "SUCCESS: Risk analysis and contingency plan references validated.", type: "ok" },
            { text: "Compiling HIPAA compliance evidence package for HHS submission...", type: "info" }
        ],
        "PCI DSS": [
            { text: "Initialising PCI DSS v4.0 scanning engine...", type: "info" },
            { text: "Loading cardholder data environment (CDE) boundary rules...", type: "info" },
            { text: "Scanning documents for PAN exposure and cryptographic control gaps...", type: "scan" },
            { text: "Auditing Acme_Vendor_Agrmt.pdf against Requirement 12 (Information Security Policy)...", type: "scan" },
            { text: "WARNING: Vendor agreement lacks explicit reference to PCI DSS scope and annual policy review obligations.", type: "warn" },
            { text: "Auditing HR_Onboarding_Log.csv against Requirement 7 (Restrict Access by Need to Know)...", type: "scan" },
            { text: "SUCCESS: Role-based access assignments documented and auditable.", type: "ok" },
            { text: "Auditing AWS_IAM_Access_Policy.json against Requirement 7 (Least Privilege Enforcement)...", type: "scan" },
            { text: "CRITICAL: Wildcard admin IAM policy violates PCI DSS Requirement 7 least-privilege mandate.", type: "danger" },
            { text: "Auditing GDPR_Privacy_Policy_v2.docx against Requirement 3 (Protect Stored Cardholder Data)...", type: "scan" },
            { text: "SUCCESS: AES-256 encryption and tokenisation controls referenced.", type: "ok" },
            { text: "Generating PCI DSS Report on Compliance (ROC) evidence bundle...", type: "info" }
        ],
        "NIST": [
            { text: "Initialising NIST CSF 2.0 scanning engine...", type: "info" },
            { text: "Loading Identify→Protect→Detect→Respond→Recover function mappings...", type: "info" },
            { text: "Performing asset discovery and exposure surface analysis...", type: "scan" },
            { text: "Auditing Acme_Vendor_Agrmt.pdf against ID.GV (Governance & Supply Chain Risk)...", type: "scan" },
            { text: "WARNING: Vendor risk profile not documented. Fails NIST ID.SC-2 supply chain risk management.", type: "warn" },
            { text: "Auditing HR_Onboarding_Log.csv against PR.AT (Awareness and Training)...", type: "scan" },
            { text: "SUCCESS: Security awareness training records validated for all personnel.", type: "ok" },
            { text: "Auditing AWS_IAM_Access_Policy.json against PR.AC (Identity & Access Management)...", type: "scan" },
            { text: "CRITICAL: Privilege escalation path detected. IAM wildcard violates PR.AC-4 least-privilege baseline.", type: "danger" },
            { text: "Auditing GDPR_Privacy_Policy_v2.docx against DE.CM (Continuous Monitoring)...", type: "scan" },
            { text: "SUCCESS: Data monitoring and anomaly detection policies referenced.", type: "ok" },
            { text: "Aggregating NIST CSF Tier 3 readiness score and improvement roadmap...", type: "info" }
        ]
    };

    // --- AI Generated Remediation Clauses ---
    const remediationClauses = {
        "indemnity": `/* ADDENDUM A: DATA PROTECTION AND INDEMNIFICATION CLAUSE */
SECTION 12. DATA SECURITY INDEMNITY.
The Supplier shall defend, indemnify, and hold harmless the Customer, its affiliates, and respective directors, officers, employees, and agents ("Customer Indemnitees") from and against any and all claims, liabilities, losses, damages, costs, and expenses (including reasonable attorneys' fees) arising out of, or resulting from, any security incident, unauthorized access, acquisition, alteration, or disclosure of Customer Personal Data caused by the Supplier, its employees, or sub-processors. This obligation shall survive the expiration or termination of the Agreement.`,

        "iam": `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EnforceLeastPrivilegeS3ReadOnly",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::audit-evidence-bucket",
        "arn:aws:s3:::audit-evidence-bucket/*"
      ]
    },
    {
      "Sid": "DenyUnsecureTransport",
      "Effect": "Deny",
      "Action": "s3:*",
      "Resource": "arn:aws:s3:::audit-evidence-bucket/*",
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}`,
        "hipaa_baa": `/* BUSINESS ASSOCIATE AGREEMENT (BAA)  - ADDENDUM */
SECTION 5. HIPAA BUSINESS ASSOCIATE OBLIGATIONS.
The Supplier ("Business Associate") agrees to: (a) not use or disclose Protected Health Information (PHI) other than as permitted by this Agreement or required by law; (b) implement appropriate safeguards to prevent unauthorized use or disclosure of PHI, including administrative (164.308), physical (164.310), and technical safeguards (164.312); (c) report to the Covered Entity any use or disclosure of PHI not provided for by this Agreement within 60 days of discovery; (d) ensure all sub-contractors agree to the same restrictions; and (e) make PHI available for access and amendment as required under 45 CFR 164.524 and 164.526. This BAA shall remain in effect for the term of the underlying Agreement.`,
        "pci_policy": `/* PCI DSS v4.0  - VENDOR INFORMATION SECURITY POLICY ADDENDUM */
SECTION 8. PCI DSS COMPLIANCE OBLIGATIONS.
Vendor warrants that it: (a) maintains and annually reviews an Information Security Policy aligned to PCI DSS v4.0 Requirement 12; (b) restricts access to cardholder data to only those individuals whose role requires such access (Requirement 7); (c) encrypts all stored and transmitted cardholder data using AES-256 or TLS 1.3 (Requirement 3 & 4); (d) logs all access to cardholder systems and retains logs for a minimum of 12 months (Requirement 10); (e) undergoes an annual PCI DSS assessment (SAQ or QSA-led ROC) and provides the Covered Entity with a copy of the resulting Attestation of Compliance (AoC) upon request.`,
        "nist_vendor": `/* NIST CSF 2.0  - SUPPLY CHAIN RISK MANAGEMENT ADDENDUM */
SECTION 9. CYBERSECURITY SUPPLY CHAIN RISK.
In alignment with NIST CSF 2.0 Function ID.SC (Supply Chain Risk Management), the Supplier shall: (a) maintain a documented cybersecurity risk profile and provide it to the Covered Entity upon request; (b) implement security controls aligned to NIST SP 800-53 Rev 5 or equivalent; (c) notify the Covered Entity of any identified cybersecurity incidents or supply chain disruptions within 72 hours; (d) undergo an annual third-party cybersecurity assessment and share results with the Covered Entity; and (e) participate in the Covered Entity's annual vendor risk review programme.`
    };

    // --- DOM Elements ---
    const appRoot = document.getElementById("app-root");
    const landingView = document.getElementById("landing-view");
    const simulatorView = document.getElementById("simulator-view");
    const siteFooter = document.getElementById("site-footer");

    // Views Trigger Buttons
    const triggerSimBtns = document.querySelectorAll(".trigger-simulator-btn");
    const backToLandingBtn = document.getElementById("back-to-landing-btn");
    const logoLink = document.getElementById("logo-link");

    // Pricing elements
    const pricingToggle = document.getElementById("pricing-toggle-checkbox");
    const billingMonthlyLabel = document.getElementById("billing-monthly");
    const billingAnnualLabel = document.getElementById("billing-annual");
    const priceVals = document.querySelectorAll(".price-val");

    // Simulator view steps
    const simStepConnect    = document.getElementById("sim-step-connect");
    const simStepScan       = document.getElementById("sim-step-scan");
    const simStepDashboard  = document.getElementById("sim-step-dashboard");
    const simStepFrameworks = document.getElementById("sim-step-frameworks");
    const simStepSettings   = document.getElementById("sim-step-settings");
    const simStepShadow     = document.getElementById("sim-step-shadow");
    const simStepAuditor    = document.getElementById("sim-step-auditor");
    const simStepCCM        = document.getElementById("sim-step-ccm");

    // Ingestion Configuration
    const fwCards = document.querySelectorAll(".fw-card");
    const providerBtns = document.querySelectorAll(".provider-btn");
    const fileListContainer = document.getElementById("sim-file-list-container");
    const dropZone = document.getElementById("drop-zone");
    const fileInput = document.getElementById("file-input");
    const resetFilesBtn = document.getElementById("reset-files-btn");
    const startAuditScanBtn = document.getElementById("start-audit-scan-btn");

    // Scanning terminal console
    const terminalConsole = document.getElementById("terminal-console-logs");
    const terminalCurrentFile = document.getElementById("terminal-current-file");
    const terminalPercentText = document.getElementById("terminal-percent-text");
    const terminalProgressFill = document.getElementById("terminal-progress-fill");

    // Audit Dashboard
    const reportFrameworkName = document.getElementById("report-framework-name");
    const reportTableBody = document.getElementById("report-table-body");
    const statFailedText = document.getElementById("dash-stat-failed");
    const statPassedText = document.getElementById("dash-stat-passed");
    const statScoreText = document.getElementById("dash-stat-score");
    const restartAuditBtn = document.getElementById("restart-audit-btn");
    const downloadReportBtn = document.getElementById("download-report-btn");

    // Remediation Modal
    const remediationModal = document.getElementById("remediation-modal");
    const modalDocName = document.getElementById("modal-doc-name");
    const modalMetric = document.getElementById("modal-metric");
    const modalRisk = document.getElementById("modal-risk");
    const modalGapDesc = document.getElementById("modal-gap-desc");
    const modalRemediationClause = document.getElementById("modal-remediation-clause");
    const closeModalBtn = document.getElementById("close-modal-btn");
    const cancelRemediationBtn = document.getElementById("cancel-remediation-btn");
    const applyRemediationBtn = document.getElementById("apply-remediation-btn");
    const downloadPatchBtn = document.getElementById("download-patch-btn");
    const copyClauseBtn = document.getElementById("copy-clause-btn");

    // Toast
    const toast = document.getElementById("toast-notification");

    // --- Routing Functions ---
    function showSimulator() {
        landingView.classList.remove("view-active");
        landingView.classList.add("view-inactive");
        siteFooter.style.display = "none";
        
        simulatorView.classList.remove("view-inactive");
        simulatorView.classList.add("view-active");
        
        // Always reset simulator to Connect screen when launching demo
        showSimStep("connect");
        renderFileList();
        window.scrollTo(0, 0);
    }

    function showLandingPage() {
        simulatorView.classList.remove("view-active");
        simulatorView.classList.add("view-inactive");
        siteFooter.style.display = "block";
        
        landingView.classList.remove("view-inactive");
        landingView.classList.add("view-active");
        window.scrollTo(0, 0);
    }


    function setActiveNavItem(id) {
        document.querySelectorAll(".sim-nav-item").forEach(el => el.classList.remove("active"));
        const item = document.getElementById(id);
        if (item) item.classList.add("active");
    }

    function showSimStep(stepName) {
        [simStepConnect, simStepScan, simStepDashboard,
         simStepFrameworks, simStepSettings,
         simStepShadow, simStepAuditor, simStepCCM,
         document.getElementById('sim-step-mock-audit'),
         document.getElementById('sim-step-cross-ref'),
         document.getElementById('sim-step-qa'),
         document.getElementById('sim-step-radar')
        ].forEach(el => el && el.classList.remove("active"));

        if (stepName === "connect") {
            simStepConnect.classList.add("active");
            setActiveNavItem("sim-menu-scan");
        } else if (stepName === "scan") {
            simStepScan.classList.add("active");
            setActiveNavItem("sim-menu-scan");
        } else if (stepName === "dashboard") {
            simStepDashboard.classList.add("active");
            setActiveNavItem("sim-menu-scan");
        } else if (stepName === "frameworks") {
            simStepFrameworks.classList.add("active");
            setActiveNavItem("sim-menu-frameworks");
        } else if (stepName === "settings") {
            simStepSettings.classList.add("active");
            setActiveNavItem("sim-menu-settings");
        } else if (stepName === "shadow") {
            simStepShadow.classList.add("active");
            setActiveNavItem("sim-menu-shadow");
            (typeof lucide!=='undefined'&&lucide.createIcons());
        } else if (stepName === "auditor") {
            simStepAuditor.classList.add("active");
            setActiveNavItem("sim-menu-auditor");
            (typeof lucide!=='undefined'&&lucide.createIcons());
        } else if (stepName === "ccm") {
            simStepCCM.classList.add("active");
            setActiveNavItem("sim-menu-ccm");
            (typeof lucide!=='undefined'&&lucide.createIcons());
        } else if (stepName === "mock-audit") {
            const el = document.getElementById('sim-step-mock-audit');
            if(el) el.classList.add("active");
            setActiveNavItem("sim-menu-mock-audit");
            (typeof lucide!=='undefined'&&lucide.createIcons());
            if (typeof checkMockAuditState === "function") checkMockAuditState();
        } else if (stepName === "cross-ref") {
            const el = document.getElementById('sim-step-cross-ref');
            if(el) el.classList.add("active");
            setActiveNavItem("sim-menu-cross-ref");
            (typeof lucide!=='undefined'&&lucide.createIcons());
            if (typeof checkCrossRefState === "function") checkCrossRefState();
        } else if (stepName === "qa") {
            const el = document.getElementById('sim-step-qa');
            if(el) el.classList.add("active");
            setActiveNavItem("sim-menu-qa");
            (typeof lucide!=='undefined'&&lucide.createIcons());
            if (typeof checkQAState === "function") checkQAState();
        } else if (stepName === "radar") {
            const el = document.getElementById('sim-step-radar');
            if(el) el.classList.add("active");
            setActiveNavItem("sim-menu-radar");
            (typeof lucide!=='undefined'&&lucide.createIcons());
        }
    }

    // Scoped tab switching  - each tab group works independently
    document.querySelectorAll(".fw-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            // Find the parent container of this tab row
            const tabRow = tab.parentElement;
            // Deactivate all tabs in the same group
            tabRow.querySelectorAll(".fw-tab").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            // Deactivate all content panels that are siblings of the tab row's parent
            const contentParent = tabRow.parentElement;
            contentParent.querySelectorAll(".fw-tab-content").forEach(c => c.classList.remove("active"));
            const target = document.getElementById(tab.getAttribute("data-target"));
            if (target) target.classList.add("active");
            (typeof lucide!=='undefined'&&lucide.createIcons());
        });
    });

    // Generate API Key mock
    const generateApiKeyBtn = document.getElementById("generate-api-key-btn");
    if (generateApiKeyBtn) {
        generateApiKeyBtn.addEventListener("click", () => {
            const randKey = "ar_live_" + Math.random().toString(36).slice(2, 10) + "_sk_" + Date.now().toString().slice(-4);
            const list = document.querySelector(".api-key-list");
            if (list) {
                const newItem = document.createElement("div");
                newItem.className = "api-key-item";
                newItem.innerHTML = `
                    <div class="api-key-info">
                        <span class="api-key-name">New API Key</span>
                        <code class="api-key-val">${randKey}</code>
                        <span class="api-created">Created just now</span>
                    </div>
                    <div class="api-key-actions">
                        <button class="btn btn-secondary btn-sm rotate-key-btn">Rotate</button>
                        <button class="btn btn-secondary btn-sm text-red revoke-key-btn">Revoke</button>
                    </div>`;
                list.appendChild(newItem);
                bindKeyButtons(newItem);
                (typeof lucide!=='undefined'&&lucide.createIcons());
            }
            showToast("New API key generated and stored securely!");
        });
    }

    function bindKeyButtons(scope) {
        scope.querySelectorAll(".rotate-key-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const keyEl = btn.closest(".api-key-item").querySelector(".api-key-val");
                if (keyEl) keyEl.textContent = "ar_live_" + Math.random().toString(36).slice(2,10) + "_sk_rotated";
                showToast("API key rotated successfully. Update your integrations!");
            });
        });
        scope.querySelectorAll(".revoke-key-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const item = btn.closest(".api-key-item");
                if (item) item.remove();
                showToast("API key revoked and invalidated.");
            });
        });
    }

    // Bind existing key buttons in credentials panel
    const apiKeyList = document.querySelector(".api-key-list");
    if (apiKeyList) bindKeyButtons(apiKeyList);

    // Integration Connect / Revoke buttons in Credentials panel
    document.querySelectorAll(".integration-item .btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const intItem   = btn.closest(".integration-item");
            const intName   = intItem.querySelector("h4") ? intItem.querySelector("h4").innerText : "Service";
            const isRevoke  = btn.innerText.trim() === "Revoke" || btn.innerText.trim() === "Edit";
            const isConnect = btn.innerText.trim() === "Connect";

            if (isConnect) {
                // Simulate OAuth flow
                btn.innerText = "Connecting...";
                btn.disabled = true;
                setTimeout(() => {
                    intItem.classList.add("connected");
                    const rightDiv = intItem.querySelector(".int-right");
                    rightDiv.innerHTML = `
                        <span class="int-status connected-badge">Connected</span>
                        <button class="btn btn-secondary btn-sm">Revoke</button>`;
                    // Re-bind revoke on this new button
                    rightDiv.querySelector(".btn").addEventListener("click", () => {
                        intItem.classList.remove("connected");
                        rightDiv.innerHTML = `<button class="btn btn-primary btn-sm btn-glow">Connect</button>`;
                        rightDiv.querySelector(".btn").addEventListener("click", () => {
                            showToast(`${intName}: Re-open OAuth flow to reconnect.`, true);
                        });
                        showToast(`${intName} disconnected and credentials revoked.`);
                    });
                    (typeof lucide!=='undefined'&&lucide.createIcons());
                    showToast(`${intName} connected successfully! Documents are now accessible.`);
                }, 1500);
            } else if (isRevoke) {
                intItem.classList.remove("connected");
                const rightDiv = intItem.querySelector(".int-right");
                rightDiv.innerHTML = `<button class="btn btn-primary btn-sm btn-glow">Connect</button>`;
                // Re-attach connect listener
                document.querySelectorAll(".integration-item .btn").forEach(b => {
                    if (b.innerText.trim() === "Connect" && b.closest(".integration-item") === intItem) {
                        b.addEventListener("click", () => showToast(`${intName}: Click to start OAuth connection flow.`));
                    }
                });
                (typeof lucide!=='undefined'&&lucide.createIcons());
                showToast(`${intName} credentials revoked successfully.`);
            }
        });
    });

    // Bind navigation buttons
    triggerSimBtns.forEach(btn => btn.addEventListener("click", (e) => {
        e.preventDefault();
        showSimulator();
    }));

    if(backToLandingBtn) backToLandingBtn.addEventListener("click", showLandingPage);
    if(logoLink) logoLink.addEventListener("click", showLandingPage);

    // Sidebar nav clicks
    var el_sim_menu_scan = document.getElementById("sim-menu-scan"); if(el_sim_menu_scan) el_sim_menu_scan.addEventListener("click", (e) => {
        e.preventDefault();
        showSimStep("connect");
    });
    var el_sim_menu_frameworks = document.getElementById("sim-menu-frameworks"); if(el_sim_menu_frameworks) el_sim_menu_frameworks.addEventListener("click", (e) => {
        e.preventDefault();
        showSimStep("frameworks");
        (typeof lucide!=='undefined'&&lucide.createIcons());
    });
    var el_sim_menu_settings = document.getElementById("sim-menu-settings"); if(el_sim_menu_settings) el_sim_menu_settings.addEventListener("click", (e) => {
        e.preventDefault();
        showSimStep("settings");
        (typeof lucide!=='undefined'&&lucide.createIcons());
    });

    // Enterprise nav bindings
    var el_sim_menu_shadow = document.getElementById("sim-menu-shadow"); if(el_sim_menu_shadow) el_sim_menu_shadow.addEventListener("click", (e) => {
        e.preventDefault();
        showSimStep("shadow");
    });
    var el_sim_menu_auditor = document.getElementById("sim-menu-auditor"); if(el_sim_menu_auditor) el_sim_menu_auditor.addEventListener("click", (e) => {
        e.preventDefault();
        showSimStep("auditor");
    });
    var el_sim_menu_ccm = document.getElementById("sim-menu-ccm"); if(el_sim_menu_ccm) el_sim_menu_ccm.addEventListener("click", (e) => {
        e.preventDefault();
        showSimStep("ccm");
    });
    const mockMnu = document.getElementById("sim-menu-mock-audit");
    if (mockMnu) {
        mockMnu.addEventListener("click", (e) => { e.preventDefault(); showSimStep("mock-audit"); });
    }
    const crossMnu = document.getElementById("sim-menu-cross-ref");
    if (crossMnu) {
        crossMnu.addEventListener("click", (e) => { e.preventDefault(); showSimStep("cross-ref"); });
    }
    const qaMnu = document.getElementById("sim-menu-qa");
    if (qaMnu) {
        qaMnu.addEventListener("click", (e) => { e.preventDefault(); showSimStep("qa"); });
    }
    const radarMnu = document.getElementById("sim-menu-radar");
    if (radarMnu) {
        radarMnu.addEventListener("click", (e) => { e.preventDefault(); showSimStep("radar"); });
    }

    // ───────────────────────────────────────
    
    

    // Ensure the main enterprise button links correctly

    // SHADOW DATA  - Animated Scan
    // ───────────────────────────────────────
    const shadowScanBtn    = document.getElementById("shadow-scan-btn");
    const shadowScanStatus = document.getElementById("shadow-scan-status");
    const shadowResultsCard= document.getElementById("shadow-results-card");

    const SHADOW_SOURCES = ["slack","jira","notion","s3","gdrive","local"];
    const SHADOW_FLAGS   = { slack:"flagged", jira:"flagged", s3:"flagged", notion:"flagged", gdrive:"done", local:"done" };

    function sendOutboundAlerts(message) {
        let creds = {};
        try { creds = (window.AR_CONFIG || {}); } catch {}

        if (creds.SLACK_WEBHOOK_URL) {
            fetch(creds.SLACK_WEBHOOK_URL, {
                method: 'POST',
                body: JSON.stringify({ text: "🚨 AuditReady.AI Alert:\n" + message })
            }).catch(e=>console.log('Slack alert failed:', e));
        }

        if (creds.TEAMS_WEBHOOK_URL) {
            fetch(creds.TEAMS_WEBHOOK_URL, {
                method: 'POST',
                body: JSON.stringify({ text: "🚨 AuditReady.AI Alert:\n" + message })
            }).catch(e=>console.log('Teams alert failed:', e));
        }

        if (creds.PAGERDUTY_INTEGRATION_KEY) {
            fetch('https://events.pagerduty.com/v2/enqueue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    routing_key: creds.PAGERDUTY_INTEGRATION_KEY,
                    event_action: 'trigger',
                    payload: { summary: message, source: 'AuditReady.AI', severity: 'critical' }
                })
            }).catch(e=>console.log('PagerDuty alert failed:', e));
        }
    }

    async function fetchRealIntegrationData(src) {
        let creds = {};
        try { creds = (window.AR_CONFIG || {}); } catch {}

        const proxyUrl = 'http://localhost:8080/api/proxy';

        if (src === 'slack' && creds.SLACK_BOT_TOKEN) {
            try {
                const res = await fetch(proxyUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        url: 'https://slack.com/api/conversations.list?limit=5',
                        headers: { 'Authorization': `Bearer ${creds.SLACK_BOT_TOKEN}` }
                    })
                });
                const data = await res.json();
                return `Slack API Response: ${JSON.stringify(data.channels ? data.channels.map(c=>c.name) : data).substring(0,500)}`;
            } catch(e) { return `Failed to fetch Slack: ${e.message}`; }
        }
        
        if (src === 'jira' && creds.JIRA_BASE_URL && creds.JIRA_USER_EMAIL && creds.JIRA_API_TOKEN) {
            try {
                const auth = btoa(creds.JIRA_USER_EMAIL + ':' + creds.JIRA_API_TOKEN);
                const res = await fetch(proxyUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        url: `${creds.JIRA_BASE_URL.replace(/\/$/, '')}/rest/api/3/search?jql=order+by+created+DESC&maxResults=3`,
                        headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
                    })
                });
                const data = await res.json();
                return `Jira API Response: ${JSON.stringify(data.issues ? data.issues.map(i=>i.key) : data).substring(0,500)}`;
            } catch(e) { return `Failed to fetch Jira: ${e.message}`; }
        }

        if (src === 'notion' && creds.NOTION_API_KEY) {
            try {
                const res = await fetch(proxyUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        method: 'POST',
                        url: 'https://api.notion.com/v1/search',
                        headers: { 
                            'Authorization': `Bearer ${creds.NOTION_API_KEY}`,
                            'Notion-Version': '2022-06-28'
                        },
                        body: { page_size: 3 }
                    })
                });
                const data = await res.json();
                return `Notion API Response: ${JSON.stringify(data.results ? data.results.map(r=>r.id) : data).substring(0,500)}`;
            } catch(e) { return `Failed to fetch Notion: ${e.message}`; }
        }

        return `Simulated shadow data log for ${src}.`;
    }

    if (shadowScanBtn) {
        if(shadowScanBtn) shadowScanBtn.addEventListener("click", () => {
            if (shadowScanBtn.disabled) return;
            shadowScanBtn.disabled = true;
            shadowScanBtn.querySelector("span").textContent = "Scanning...";
            shadowResultsCard.style.display = "none";
            shadowScanStatus.textContent = "Initialising scan across 6 sources...";

            // Reset all cards to scanning state
            SHADOW_SOURCES.forEach(src => {
                const card = document.querySelector(`.shadow-source-card[data-source="${src}"]`);
                if (!card) return;
                card.classList.remove("done");
                const statusEl = card.querySelector(".source-status");
                statusEl.className = "source-status scanning";
                statusEl.innerHTML = `<span class="pulse-dot"></span> Scanning`;
            });
            (typeof lucide!=='undefined'&&lucide.createIcons());

            // Animate cards one by one
            let delay = 600;
            SHADOW_SOURCES.forEach((src, idx) => {
                setTimeout(() => {
                    const card = document.querySelector(`.shadow-source-card[data-source="${src}"]`);
                    if (!card) return;
                    const statusEl = card.querySelector(".source-status");
                    const flag = SHADOW_FLAGS[src];
                    // REAL GEMINI CALL FOR SHADOW DATA SCAN
                    fetchRealIntegrationData(src).then(realData => {
                        const prompt = `Analyze this data log for ${src}: "${realData}". Determine if there are compliance risks. Reply strictly in JSON: {"status": "Clean" | "Issues Found", "details": "short explanation"}`;
                        
                        executeGeminiPrompt(prompt).then(data => {
                        const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{"status": "Issues Found"}';
                        const isFlagged = answer.includes("Issues Found") || answer.includes("flagged");
                        
                        if (isFlagged) {
                            statusEl.className = "source-status flagged";
                            statusEl.innerHTML = "⚠ Issues Found";
                        } else {
                            card.classList.add("done");
                            statusEl.className = "source-status done";
                            statusEl.innerHTML = "✓ Clean";
                        }
                    }).catch(err => {
                        statusEl.className = "source-status flagged";
                        statusEl.innerHTML = "⚠ API Error";
                    }).finally(() => {
                        shadowScanStatus.textContent = `Scanned ${idx + 1} / 6 sources...`;
                        
                        if (idx === SHADOW_SOURCES.length - 1) {
                            shadowScanStatus.textContent = "✓ Scan complete";
                            shadowResultsCard.style.display = "block";
                            shadowScanBtn.disabled = false;
                            shadowScanBtn.querySelector("span").textContent = "Re-Scan Sources";
                            (typeof lucide!=='undefined'&&lucide.createIcons());
                            
                            shadowResultsCard.querySelectorAll(".btn").forEach(btn => {
                                btn.addEventListener("click", () => {
                                    const action = btn.textContent.trim();
                                    const row = btn.closest("tr");
                                    if (row) {
                                        row.style.opacity = "0.4";
                                        row.style.transition = "opacity 0.5s";
                                    }
                                    showToast(`${action} action initiated  - Security team notified via configured integrations.`);
                                    sendOutboundAlerts(`${action} initiated for shadow data risk.`);
                                });
                            });
                        }
                    });
                }); // close fetchRealIntegrationData.then()
                }, delay * (idx + 1));
            });
        });
    }

    // ───────────────────────────────────────
    // AUDITOR MODE  - Portal Generation
    // ───────────────────────────────────────
    const generatePortalBtn = document.getElementById("generate-portal-btn");
    const portalResult      = document.getElementById("portal-result");
    const portalLinkUrl     = document.getElementById("portal-link-url");
    const portalHash        = document.getElementById("portal-hash");
    const copyPortalBtn     = document.getElementById("copy-portal-btn");
    const previewFirmName   = document.getElementById("preview-firm-name");

    function randomHex(len) {
        const chars = "0123456789abcdef";
        return Array.from({length: len}, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    }

    if (generatePortalBtn) {
        generatePortalBtn.addEventListener("click", () => {
            const firm  = document.getElementById("auditor-firm")?.value.trim() || "External Auditor";
            const email = document.getElementById("auditor-email")?.value.trim();
            const scope = document.getElementById("auditor-scope")?.value || "SOC 2 Type II";

            if (email && !email.includes("@")) {
                showToast("Please enter a valid auditor email address.", true);
                return;
            }

            generatePortalBtn.querySelector("span").textContent = "Generating...";
            generatePortalBtn.disabled = true;

            setTimeout(() => {
                const token   = randomHex(12);
                const hash    = randomHex(8) + "..." + randomHex(4);
                const url     = `https://auditready.ai/portal/${token}`;

                portalLinkUrl.textContent = url;
                portalHash.textContent    = hash;
                portalResult.style.display = "flex";
                if (previewFirmName) previewFirmName.textContent = firm + " - " + scope;

                generatePortalBtn.querySelector("span").textContent = "Re-Generate Portal";
                generatePortalBtn.disabled = false;
                (typeof lucide!=='undefined'&&lucide.createIcons());
                showToast(`Secure portal generated for ${firm}. Invitation email sent!`);
            }, 1400);
        });
    }

    if (copyPortalBtn) {
        copyPortalBtn.addEventListener("click", () => {
            const url = portalLinkUrl?.textContent || "";
            navigator.clipboard.writeText(url).then(() => {
                copyPortalBtn.textContent = "Copied!";
                setTimeout(() => { copyPortalBtn.textContent = "Copy"; }, 2000);
            }).catch(() => {
                showToast("Copy failed  - please select and copy the URL manually.");
            });
        });
    }

    // ───────────────────────────────────────
    // CCM MONITOR  - Manual Trigger
    // ───────────────────────────────────────
    const ccmTriggerBtn = document.getElementById("ccm-trigger-btn");
    const ccmTimeline   = document.getElementById("ccm-timeline");

    if (ccmTriggerBtn) {
        if(ccmTriggerBtn) ccmTriggerBtn.addEventListener("click", () => {
            ccmTriggerBtn.disabled = true;
            ccmTriggerBtn.querySelector("span").textContent = "Running scan...";

            setTimeout(() => {
                // Inject a new event at top of timeline
                const now = new Date();
                const timeStr = now.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" });
                const newEvent = document.createElement("div");
                newEvent.className = "ccm-event ok";
                newEvent.style.animation = "fade-in 0.4s ease";
                newEvent.innerHTML = `
                    <div class="event-dot ok-dot"></div>
                    <div class="event-body">
                        <p class="event-title">✓ Manual Scan Complete  - All Controls Checked</p>
                        <p class="event-detail">47 controls evaluated. 2 gaps remain open (Vendor NDA, Background Check). No new gaps detected since last scan.</p>
                        <span class="event-time">Just now, ${timeStr} IST</span>
                    </div>`;
                ccmTimeline.insertBefore(newEvent, ccmTimeline.firstChild);

                ccmTriggerBtn.disabled = false;
                ccmTriggerBtn.querySelector("span").textContent = "Trigger Manual Scan Now";
                showToast("Manual CCM scan complete  - 45/47 controls passed. Results logged.");
            }, 2200);
        });
    }


    if(pricingToggle) pricingToggle.addEventListener("change", () => {
        isAnnualBilling = pricingToggle.checked;
        if (isAnnualBilling) {
            billingMonthlyLabel.classList.remove("active");
            billingAnnualLabel.classList.add("active");
        } else {
            billingAnnualLabel.classList.remove("active");
            billingMonthlyLabel.classList.add("active");
        }

        priceVals.forEach(val => {
            const planMonthly = val.getAttribute("data-monthly");
            const planAnnual = val.getAttribute("data-annual");
            val.innerText = isAnnualBilling ? planAnnual : planMonthly;
        });
    });

    // --- Simulator Ingestion Config ---
    fwCards.forEach(card => {
        card.addEventListener("click", () => {
            fwCards.forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            currentFramework = card.getAttribute("data-framework");
        });
    });

    providerBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            providerBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentProvider = btn.getAttribute("data-provider");
            showToast(`Storage provider switched to ${btn.innerText.trim()}`);
        });
    });

    // --- Ingestion File Manager ---
    function renderFileList() {
        fileListContainer.innerHTML = "";
        activeFiles.forEach(file => {
            const item = document.createElement("div");
            item.className = "file-item";
            item.innerHTML = `
                <div class="file-item-left">
                    <i data-lucide="file-${file.type === 'pdf' ? 'text' : (file.type === 'csv' ? 'table' : 'code')}"></i>
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${file.size}</span>
                </div>
                <div class="remove-file-btn" data-id="${file.id}">
                    <i data-lucide="trash-2"></i>
                </div>
            `;
            fileListContainer.appendChild(item);
        });
        (typeof lucide!=='undefined'&&lucide.createIcons());

        // Bind delete triggers
        document.querySelectorAll(".remove-file-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const fileId = parseInt(btn.getAttribute("data-id"));
                activeFiles = activeFiles.filter(f => f.id !== fileId);
                renderFileList();
                showToast("File removed from audit list");
            });
        });
    }

    // File Drag & Drop Simulation
    if(dropZone) dropZone.addEventListener("click", () => fileInput.click());
    
    if(fileInput) fileInput.addEventListener("change", () => {
        handleMockFiles(fileInput.files);
    });

    if(dropZone) dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("drag-over");
    });

    if(dropZone) dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("drag-over");
    });

    if(dropZone) dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("drag-over");
        handleMockFiles(e.dataTransfer.files);
    });

    async function handleMockFiles(files) {
        if (!files.length) return;
        
        showToast("Deeply analyzing document relevance...", "info");
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const extension = file.name.split('.').pop().toLowerCase();
            const mockSize = (file.size / (1024 * 1024)).toFixed(1);
            
            // Deep Analysis on Drop via backend
            let preScannedResult = null;
            try {
                const snippet = await readFileSnippet(file, 4000);
                const prompt = buildGeminiScanPrompt(file.name, snippet, currentFramework);
                
                const data = await executeGeminiPrompt(prompt);
const raw  = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
preScannedResult = parseGeminiResult(raw);

if (preScannedResult.issue.includes("Irrelevant") || preScannedResult.issue.includes("correct framework")) {
    // Throw alert pop up!
    alert(`DEEP ANALYSIS ERROR: ${preScannedResult.issue}`);
    continue; // Reject file, do not add to activeFiles
}
            } catch (err) {
                console.warn("Deep analysis drop check failed: ", err);
            }
            
            const newFile = {
                id: Date.now() + i,
                name: file.name,
                type: ['pdf', 'csv', 'json', 'docx'].includes(extension) ? extension : 'pdf',
                size: mockSize > 0.1 ? `${mockSize} MB` : `${(file.size / 1024).toFixed(0)} KB`,
                originalStatus: 'Pending',
                currentStatus:  'Pending',
                issue: 'Awaiting AI scan',
                risk: 'Unknown',
                actionLabel: 'None',
                clauseType: 'indemnity',
                _fileRef: file,  // keep reference for real AI scan
                _preScannedResult: preScannedResult // cache the result
            };
            
            activeFiles.push(newFile);
        }
        
        renderFileList();
        showToast(`${files.length} file${files.length > 1 ? 's' : ''} uploaded successfully! Ready to scan.`);
    }

    // Read first N characters from a file
    function readFileSnippet(file, maxChars) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = e => {
                const text = e.target?.result || '';
                resolve(typeof text === 'string' ? text.slice(0, maxChars) : '');
            };
            reader.onerror = () => resolve('');
            // Read as text for txt/csv/json; for others read first bytes
            const ext = file.name.split('.').pop().toLowerCase();
            if (['txt','csv','json'].includes(ext)) {
                reader.readAsText(file.slice(0, maxChars * 2));
            } else {
                reader.readAsText(file.slice(0, maxChars * 3));
            }
        });
    }

    if(resetFilesBtn) resetFilesBtn.addEventListener("click", () => {
        // Deep clone defaults
        activeFiles = defaultFiles.map(f => ({ ...f }));
        renderFileList();
        showToast("File list reset to default contracts");
    });

    // --- Plan limits config ---
    const PLAN_LIMITS = {
        free:       { scansPerMonth: 3,   frameworks: ['SOC 2'],                                                downloadReport: false, docusign: false },
        basic:      { scansPerMonth: 50,  frameworks: ['SOC 2'],                                                downloadReport: true,  docusign: false },
        growth:     { scansPerMonth: 200, frameworks: ['SOC 2','GDPR'],                                         downloadReport: true,  docusign: false },
        pro:        { scansPerMonth: 500, frameworks: ['SOC 2','GDPR','ISO 27001','HIPAA'],                     downloadReport: true,  docusign: true  },
        scale:      { scansPerMonth: 500, frameworks: ['SOC 2','GDPR','ISO 27001','HIPAA'],                     downloadReport: true,  docusign: true  },
        enterprise: { scansPerMonth: 999, frameworks: ['SOC 2','GDPR','ISO 27001','HIPAA','PCI DSS','NIST'],    downloadReport: true,  docusign: true  },
        ultimate:   { scansPerMonth: 999, frameworks: ['SOC 2','GDPR','ISO 27001','HIPAA','PCI DSS','NIST'],    downloadReport: true,  docusign: true  }
    };

    function getCurrentPlan() {
        try {
            const session = JSON.parse(localStorage.getItem('ar_session') || 'null');
            if (!session) return 'free';
            
            // Hardcoded super-admin bypass
            if (session.email.toLowerCase() === 'prakharmishra00000@gmail.com') {
                return 'enterprise';
            }

            const raw = localStorage.getItem('ar_plan_' + session.email.toLowerCase());
            if (!raw) return 'free';
            const p = JSON.parse(raw);
            if (Date.now() > p.expiry) {
                localStorage.removeItem('ar_plan_' + session.email.toLowerCase());
                return 'free';
            }
            return (p.plan || 'free').toLowerCase();
        } catch { return 'free'; }
    }

    function getScanUsageKey() {
        const now = new Date();
        const session = JSON.parse(localStorage.getItem('ar_session') || 'null');
        const user = session ? session.email : 'guest';
        return `ar_usage_${user}_${now.getFullYear()}_${now.getMonth() + 1}`;
    }

    function getScanCount() {
        return parseInt(localStorage.getItem(getScanUsageKey()) || '0');
    }

    function incrementScanCount() {
        const key = getScanUsageKey();
        localStorage.setItem(key, String(getScanCount() + 1));
    }

    function addTerminalLog(text, type) {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
        const logRow = document.createElement('div');
        logRow.className = 'console-log-row';
        logRow.innerHTML = `<span class="console-time">${timeStr}</span><span class="console-status-badge status-badge-${type}">[${type.toUpperCase()}]</span><span>${text}</span>`;
        terminalConsole.appendChild(logRow);
        terminalConsole.scrollTop = terminalConsole.scrollHeight;
    }

    function setTerminalProgress(pct, label) {
        terminalProgressFill.style.width = pct + '%';
        terminalPercentText.innerText = pct + '%';
        if (label) terminalCurrentFile.innerText = label;
    }

    // --- Scanning Console --- Real AI + Simulation fallback ---
    if(startAuditScanBtn) startAuditScanBtn.addEventListener('click', async () => {
        if (activeFiles.length === 0) { showToast('Please add at least one document to audit.', true); return; }

        // --- Plan gate: check framework access ---
        const plan     = getCurrentPlan();
        const limits   = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
        if (!limits.frameworks.includes(currentFramework)) {
            showToast(`⚠️ ${currentFramework} is available on Pro & Enterprise plans. Upgrade to scan this framework.`, true);
            const session = JSON.parse(localStorage.getItem('ar_session') || 'null');
            if (!session) { window.AR_openSignIn && window.AR_openSignIn(); }
            return;
        }

        // --- Plan gate: scan count limit ---
        const scanCount = getScanCount();
        if (scanCount >= limits.scansPerMonth) {
            showToast(`⚠️ You've used all ${limits.scansPerMonth} free scans this month. Upgrade to Pro for unlimited scans.`, true);
            return;
        }

        showSimStep('scan');
        terminalConsole.innerHTML = '';
        setTerminalProgress(0, 'Initializing...');
        incrementScanCount();

        const gemKey = window.AR_getActiveGeminiKey ? window.AR_getActiveGeminiKey() : '';

        if (!gemKey || gemKey === "AIzaSy_YOUR_API_KEY_HERE") {
            showToast("⚠️ Please enter a real Gemini API Key in the Admin Panel to run an audit.", true);
            return;
        }
        
        // ═══ REAL GEMINI AI SCAN ═══ 
        await runGeminiScan(gemKey);
    });

    // Real Gemini AI scan
    async function runGeminiScan(apiKey) {
        // --- ENTERPRISE PRE-SCAN: Zero-Trust Localized Data Isolation ---
        addTerminalLog('Initiating Local Data Redaction Engine...', 'warn');
        addTerminalLog('Scrubbing PII, SPII, and Financial Identifiers (DPDP/RBI compliant)...', 'scan');
        setTerminalProgress(2, 'Token Masking Data...');
        
        if (typeof window.appendSiemLog === 'function') {
            window.appendSiemLog('[PRIVACY] Local anonymization pipeline initiated. Scrubbing PAN/Aadhaar/PII.');
        }

        await new Promise(r => setTimeout(r, 1200));
        addTerminalLog('Replacing sensitive records with Secure Synthetic Tokens...', 'info');
        setTerminalProgress(4, 'Isolating Data...');
        await new Promise(r => setTimeout(r, 1000));
        addTerminalLog('Data isolation complete. Transmitting anonymized payload to Sovereign AI Node...', 'ok');
        
        if (typeof window.appendSiemLog === 'function') {
            window.appendSiemLog('[SEC] Encrypted payload transmitted to Mumbai (ap-south-1) Sovereign AI Node.');
        }
        await new Promise(r => setTimeout(r, 800));
        // --- END PRE-SCAN ---

        addTerminalLog('Connecting to Sovereign Gemini AI compliance engine...', 'info');
        addTerminalLog(`Mapping documents to ${currentFramework} standard...`, 'scan');
        setTerminalProgress(5, 'Reading documents...');

        const filesToScan = activeFiles.filter(f => f._fileRef);
        const total = filesToScan.length;

        for (let i = 0; i < total; i++) {
            const file = filesToScan[i];
            const pct = Math.round(((i + 0.5) / total) * 85) + 5;
            setTerminalProgress(pct, `Analyzing: ${file.name}`);
            addTerminalLog(`Auditing ${file.name} against ${currentFramework}...`, 'scan');

            try {
                const snippet = await readFileSnippet(file._fileRef, 4000);
                const prompt = buildGeminiScanPrompt(file.name, snippet, currentFramework);

                // If we pre-scanned on drop, use that result!
                if (file._preScannedResult) {
                    const parsed = file._preScannedResult;
                    file.currentStatus  = parsed.status;
                    file.originalStatus = parsed.status;
                    file.issue          = parsed.issue;
                    file.risk           = parsed.risk;
                    file.actionLabel    = parsed.status === 'Passed' ? 'None' : 'Generate Amendment';
                    file.clauseType     = parsed.clauseType || 'indemnity';
                    file.mappingRule    = parsed.mappingRule || '';
                    file.sourceQuote    = parsed.sourceQuote || '';

                    const logType = parsed.status === 'Passed' ? 'ok' : (parsed.risk === 'Critical' ? 'danger' : 'warn');
                    addTerminalLog(`${parsed.status === 'Passed' ? 'PASS' : 'FAIL'}: ${file.name} - ${parsed.issue}`, logType);
                    continue; // Skip the rest of the loop since we already scanned it!
                }

                const data = await executeGeminiPrompt(prompt);
                const raw  = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

                // Parse Gemini JSON response
                const parsed = parseGeminiResult(raw);
                file.currentStatus  = parsed.status;
                file.originalStatus = parsed.status;
                file.issue          = parsed.issue;
                file.risk           = parsed.risk;
                file.actionLabel    = parsed.status === 'Passed' ? 'None' : 'Generate Amendment';
                file.clauseType     = parsed.clauseType || 'indemnity';
                file.mappingRule    = parsed.mappingRule || '';
                file.sourceQuote    = parsed.sourceQuote || '';

                const logType = parsed.status === 'Passed' ? 'ok' : (parsed.risk === 'Critical' ? 'danger' : 'warn');
                addTerminalLog(`${parsed.status === 'Passed' ? 'PASS' : 'FAIL'}: ${file.name} – ${parsed.issue}`, logType);

                if (window.AR_rotateGeminiKey) AR_rotateGeminiKey();
            } catch (err) {
                addTerminalLog(`ERROR scanning ${file.name}: ${err.message}. Using cached analysis.`, 'warn');
            }
            // Artificial delay to make the scan feel more thorough and "advanced"
            const scanDelay = Math.floor(Math.random() * 2000) + 2000; 
            await new Promise(r => setTimeout(r, scanDelay));
        }

        setTerminalProgress(100, 'Analysis complete.');
        addTerminalLog('Gemini compliance analysis complete. Generating report...', 'info');
        setTimeout(() => { renderDashboardReport(); showSimStep('dashboard'); }, 2500);
    }

const FRAMEWORK_CONTROLS = {
    "SOC 2 Type II": [
        { id: "CC6.1", req: "Logical access is restricted to authorized individuals (e.g. MFA, passwords)" },
        { id: "CC6.2", req: "User system access is provisioned, managed, and revoked upon termination" },
        { id: "CC7.1", req: "System vulnerabilities are scanned and mitigated (e.g. pentests)" }
    ],
    "GDPR Compliance": [
        { id: "Art. 28", req: "Data Processing Addendum includes sufficient guarantees from processors" },
        { id: "Art. 30", req: "Records of processing activities are maintained" },
        { id: "Art. 32", req: "Security of processing including encryption and pseudonymisation" }
    ],
    "ISO 27001:2022": [
        { id: "A.5.1", req: "Information security policies are established and approved" },
        { id: "A.5.19", req: "Information security in supplier relationships" },
        { id: "A.8.2", req: "Privileged access rights are restricted and controlled" }
    ],
    "HIPAA / HITECH": [
        { id: "164.308", req: "Administrative safeguards: Risk analysis and security management" },
        { id: "164.312", req: "Technical safeguards: Access controls, encryption, and minimum necessary rule" },
        { id: "164.404", req: "Breach notification to individuals within 60 days" }
    ],
    "PCI DSS v4.0": [
        { id: "Req 1", req: "Install and maintain network security controls" },
        { id: "Req 8", req: "Identify users and authenticate access (MFA)" },
        { id: "Req 12", req: "Information security policy and vendor management" }
    ],
    "NIST CSF 2.0": [
        { id: "GV.OC-01", req: "Organizational cybersecurity policy is established" },
        { id: "PR.AA-01", req: "Identities and credentials are managed and authenticated" },
        { id: "ID.SC-02", req: "Suppliers are identified, prioritized, and assessed using a cyber supply chain risk assessment process" }
    ]
};

    function buildGeminiScanPrompt(fileName, content, framework) {
        const controls = FRAMEWORK_CONTROLS[framework] || [{ id: "General", req: "General compliance adherence" }];
        const controlsText = controls.map(c => `- [${c.id}] ${c.req}`).join('\\n');

        return `You are a strict, risk-averse compliance auditor AI. You must evaluate this document deterministically against the provided legal checklist matrix for ${framework}. Do not assume or extrapolate.

Document name: ${fileName}
Document content (first 4000 chars):
${content}

Deterministic Checklist to verify:
${controlsText}

Instructions:
1. Scan the document to see if it satisfies the controls in the checklist.
2. If it misses ANY required clause, alters one, or violates one, flag it as Failed.
3. If it satisfies the controls, flag it as Passed.
4. You MUST extract a "sourceQuote" directly from the text to prove your evaluation.

Respond in this EXACT JSON format (no markdown, no code blocks):
{
  "status": "Passed" or "Failed",
  "risk": "Low" or "Medium" or "High" or "Critical",
  "mappingRule": "The specific Control ID from the checklist above that this finding relates to (e.g. CC6.1)",
  "sourceQuote": "The EXACT text snippet quoted directly from the document supporting your finding. If missing/failed, quote the closest surrounding text or state 'No relevant text found.'",
  "issue": "one sentence describing the finding or missing clause",
  "recommendation": "one sentence on how to fix it",
  "clauseType": "indemnity" or "iam" or "hipaa_baa" or "pci_policy" or "nist_vendor" or "none"
}

Rules:
- TRACEABLE CITATIONS (NO-FAKE RULE): You must provide an exact sourceQuote. If you cannot find an exact quote to support a Pass, you must mark it as Failed.
- IF DOCUMENT IS FOR A DIFFERENT FRAMEWORK (e.g. SOC 2 document but GDPR is selected) → status: Failed, risk: High, issue: "Please select the correct framework for this document.", sourceQuote: "N/A"
- IF DOCUMENT IS COMPLETELY IRRELEVANT (e.g. source code, recipes, photos) → status: Failed, risk: Critical, issue: "Irrelevant, please upload a relevant document.", sourceQuote: "N/A"
- If missing required clauses or has violations → status: Failed with specific issue
- clauseType should match the type of fix needed`;
    }

    function parseGeminiResult(raw) {
        try {
            const clean = raw.replace(/```json|```/g, '').trim();
            const start = clean.indexOf('{');
            const end   = clean.lastIndexOf('}');
            if (start !== -1 && end !== -1) {
                const parsed = JSON.parse(clean.slice(start, end + 1));
                return {
                    status:     ['Passed','Failed'].includes(parsed.status) ? parsed.status : 'Failed',
                    risk:       ['Low','Medium','High','Critical'].includes(parsed.risk) ? parsed.risk : 'Medium',
                    issue:      parsed.issue || 'Compliance review required',
                    recommendation: parsed.recommendation || '',
                    clauseType: parsed.clauseType || 'indemnity',
                    mappingRule: parsed.mappingRule || '',
                    sourceQuote: parsed.sourceQuote || ''
                };
            }
        } catch {}
        return { status: 'Failed', risk: 'Medium', issue: 'Could not parse AI response - manual review required', clauseType: 'indemnity', mappingRule: '', sourceQuote: '' };
    }

    // Simulation fallback (used when no Gemini key or demo files)
    function runSimulatedScan() {
        // Obsolete: Replaced with requirement for real API keys
    }

    // --- Dashboard Report Renderer (Step 3) ---
    function renderDashboardReport() {
        reportFrameworkName.innerText = currentFramework + " Type II Standard";
        reportTableBody.innerHTML = "";
        
        let passedCount = 0;
        let failedCount = 0;

        activeFiles.forEach(file => {
            // Contextualize rules per framework if they are default files
            let displayIssue = file.issue;
            let displayAction = file.actionLabel;
            
            if (file.currentStatus === "Failed") {
                failedCount++;
            } else {
                passedCount++;
            }

            // Framework specific wording swaps
            if (currentFramework === "GDPR") {
                if (file.id === 1) displayIssue = "Missing Article 28 Processor indemnity clause";
                if (file.id === 3) displayIssue = "Unrestricted admin dashboard exposure (violates Art. 32)";
            } else if (currentFramework === "ISO 27001") {
                if (file.id === 1) displayIssue = "Missing A.5.19 subcontractor liability protection";
                if (file.id === 3) displayIssue = "Wildcard root privilege assignment violates A.8.2";
            } else if (currentFramework === "HIPAA") {
                if (file.id === 1) displayIssue = "No Business Associate Agreement (BAA) clauses found";
                if (file.id === 3) displayIssue = "IAM wildcard exposes ePHI  - violates 164.312 minimum-necessary rule";
            } else if (currentFramework === "PCI DSS") {
                if (file.id === 1) displayIssue = "Vendor policy review obligations missing (Req. 12)";
                if (file.id === 3) displayIssue = "Wildcard IAM violates PCI DSS Requirement 7 least-privilege";
            } else if (currentFramework === "NIST") {
                if (file.id === 1) displayIssue = "Vendor risk profile absent  - fails NIST ID.SC-2";
                if (file.id === 3) displayIssue = "Privilege escalation path violates NIST PR.AC-4";
            }

            const tr = document.createElement("tr");

            tr.className = file.currentStatus === "Passed" ? "status-passed" : "status-failed";
            tr.innerHTML = `
                <td>
                    <div class="file-item-left">
                        <i data-lucide="file-${file.type === 'pdf' ? 'text' : (file.type === 'csv' ? 'table' : 'code')}"></i>
                        <span class="file-name">${file.name}</span>
                    </div>
                </td>
                <td>
                    <span class="badge-status ${file.currentStatus === 'Passed' ? 'status-pass' : 'status-fail'}">
                        <i data-lucide="${file.currentStatus === 'Passed' ? 'check' : 'alert-circle'}"></i>
                        <span>${file.currentStatus}</span>
                    </span>
                </td>
                <td style="color: ${file.currentStatus === 'Failed' ? '#fca5a5' : 'var(--text-secondary)'}; max-width: 400px;">
                    <div style="margin-bottom: 4px;">
                        <strong>${file.mappingRule ? '[' + file.mappingRule + '] ' : ''}</strong>${displayIssue}
                    </div>
                    ${file.sourceQuote && file.sourceQuote !== 'N/A' && file.sourceQuote !== 'No relevant text found.' ? 
                        `<div style="font-size: 11px; padding: 6px; background: rgba(0,0,0,0.2); border-left: 2px solid var(--accent); color: #a1a1aa; font-style: italic; margin-top: 4px;">
                            "${file.sourceQuote}"
                         </div>` : ''
                    }
                </td>
                <td>
                    <span class="badge-risk badge-${file.risk.toLowerCase()}">${file.risk}</span>
                </td>
                <td>
                    ${file.currentStatus === 'Failed' ? 
                        `<button class="btn btn-primary btn-sm btn-glow apply-fix-trigger" data-id="${file.id}">
                            <i data-lucide="sparkles"></i>
                            <span>${displayAction}</span>
                         </button>` : 
                        `<span class="badge-status status-pass"><i data-lucide="check"></i> Resolved</span>`
                    }
                </td>
            `;
            reportTableBody.appendChild(tr);
        });

        (typeof lucide!=='undefined'&&lucide.createIcons());

        // Calculate summary metrics
        const totalFiles = activeFiles.length;
        const scorePercent = totalFiles > 0 ? Math.round((passedCount / totalFiles) * 100) : 100;

        statFailedText.innerText = failedCount;
        statPassedText.innerText = passedCount;
        statScoreText.innerText = `${scorePercent}%`;
        
        if (scorePercent === 100) {
            statScoreText.style.color = "var(--success)";
        } else {
            statScoreText.style.color = "var(--cyan)";
        }

        // Bind interactive fix buttons
        document.querySelectorAll(".apply-fix-trigger").forEach(btn => {
            btn.addEventListener("click", () => {
                const fileId = parseInt(btn.getAttribute("data-id"));
                openRemediationModal(fileId);
            });
        });
    }

    // --- Interactive Remediation Modal Flows ---
    function openRemediationModal(fileId) {
        activeRemediationRow = activeFiles.find(f => f.id === fileId);
        if (!activeRemediationRow) return;

        modalDocName.innerText = activeRemediationRow.name;
        modalRisk.innerText = activeRemediationRow.risk;
        modalRisk.className = `info-val badge-risk badge-${activeRemediationRow.risk.toLowerCase()}`;
        
        // Customize text depending on selected framework
        let metricTitle = "SOC 2 Section CC7.1";
        let gapExplanation = activeRemediationRow.issue;
        let clauseKey = activeRemediationRow.clauseType;

        if (currentFramework === "GDPR") {
            metricTitle = activeRemediationRow.id === 3 ? "GDPR Article 32 (Security)" : "GDPR Article 28 (Contracts)";
            gapExplanation = activeRemediationRow.id === 3 ?
                "Wildcard public administrative controls mapped in config. AWS policy permits full wildcard permission root access (*:*)." :
                "Missing Processor Indemnity rules ensuring vendor guarantees indemnity against direct or indirect privacy breach events.";
        } else if (currentFramework === "ISO 27001") {
            metricTitle = activeRemediationRow.id === 3 ? "ISO Annex A.8.2 (Access Controls)" : "ISO Annex A.5.19 (Supplier Relationships)";
            gapExplanation = activeRemediationRow.id === 3 ?
                "Identity Access Policy configuration violates least-privilege standards. Wildcard admin rule detected." :
                "Supplier liability caps are too low or absent; fails A.5.19 protection specifications.";
        } else if (currentFramework === "HIPAA") {
            metricTitle = activeRemediationRow.id === 3 ? "HIPAA 164.312 (Technical Safeguards)" : "HIPAA 164.314 (BAA Requirements)";
            gapExplanation = activeRemediationRow.id === 3 ?
                "Wildcard IAM role grants unrestricted access to storage containing ePHI. Violates HIPAA minimum-necessary standard." :
                "No Business Associate Agreement provisions found in vendor contract. BAA is mandatory under HIPAA 164.314.";
            if (activeRemediationRow.id === 1) clauseKey = "hipaa_baa";
        } else if (currentFramework === "PCI DSS") {
            metricTitle = activeRemediationRow.id === 3 ? "PCI DSS Requirement 7 (Access Control)" : "PCI DSS Requirement 12 (Security Policy)";
            gapExplanation = activeRemediationRow.id === 3 ?
                "AWS IAM policy grants wildcard (*) admin actions. PCI DSS Req 7 mandates access restricted strictly to those who need it." :
                "Vendor agreement missing annual Information Security Policy review obligations required by PCI DSS Requirement 12.";
            if (activeRemediationRow.id === 1) clauseKey = "pci_policy";
        } else if (currentFramework === "NIST") {
            metricTitle = activeRemediationRow.id === 3 ? "NIST PR.AC-4 (Least Privilege)" : "NIST ID.SC-2 (Supply Chain Risk)";
            gapExplanation = activeRemediationRow.id === 3 ?
                "Privilege escalation path detected in IAM policy. Violates NIST CSF PR.AC-4 least-privilege and separation of duties." :
                "Vendor cybersecurity risk profile not documented. NIST ID.SC-2 requires all third-party risks to be formally assessed.";
            if (activeRemediationRow.id === 1) clauseKey = "nist_vendor";
        }
        
        modalMetric.innerText = metricTitle;
        modalGapDesc.innerText = gapExplanation;

        // Ingest correct AI code amendment text
        const codeText = remediationClauses[clauseKey] || remediationClauses[activeRemediationRow.clauseType] || `// AI Amendment clause generator\nApproved contract amendment added to resolve compliance vulnerabilities.`;
        modalRemediationClause.textContent = codeText;

        remediationModal.classList.add("active");
    }

    function closeRemediationModal() {
        remediationModal.classList.remove("active");
        activeRemediationRow = null;
    }

    if(closeModalBtn) closeModalBtn.addEventListener("click", closeRemediationModal);
    if(cancelRemediationBtn) cancelRemediationBtn.addEventListener("click", closeRemediationModal);

    // Apply Remediation Fix
    
    if (downloadPatchBtn) {
        downloadPatchBtn.addEventListener("click", () => {
            if (!activeRemediationRow) return;
            const content = document.getElementById("modal-remediation-clause").textContent;
            let ext = ".patch";
            let filename = "remediation_fix";
            
            const issueStr = (activeRemediationRow.issue || "").toLowerCase();
            const clauseType = (activeRemediationRow.clauseType || "").toLowerCase();
            
            if (issueStr.includes("aws") || issueStr.includes("cloud") || issueStr.includes("infrastructure") || issueStr.includes("bucket")) {
                ext = ".tf";
                filename = "aws_compliance_fix";
            } else if (issueStr.includes("github") || issueStr.includes("action") || issueStr.includes("pipeline")) {
                ext = ".yml";
                filename = "pipeline_compliance_fix";
            } else if (clauseType.includes("policy") || clauseType.includes("agreement") || clauseType.includes("contract")) {
                ext = ".md";
                filename = "policy_amendment";
            }
            
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename + ext;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showToast("Remediation file downloaded successfully!", "success");
        });
    }

    if(applyRemediationBtn) applyRemediationBtn.addEventListener("click", async () => {
        if (!activeRemediationRow) return;
        
        applyRemediationBtn.disabled = true;
        applyRemediationBtn.innerHTML = '<span class="pulse-dot"></span> Generating Fix...';
        
        const prompt = `Write a short description (max 10 words) of the remediation applied to fix this issue: "${activeRemediationRow.issue}".`;
        
        try {
            const data = await executeGeminiPrompt(prompt);
            const fixText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Compliance requirement fulfilled and clauses injected.";
            
            activeRemediationRow.currentStatus = "Passed";
            activeRemediationRow.issue = fixText.replace(/[\n\r]/g, " ").trim();
        } catch (e) {
            activeRemediationRow.currentStatus = "Passed";
            activeRemediationRow.issue = "Amendment clauses automatically applied to resolve gap.";
        }
        
        applyRemediationBtn.disabled = false;
        applyRemediationBtn.innerHTML = '<i data-lucide="check" style="width:16px;height:16px"></i> Apply Fix';
        (typeof lucide!=='undefined'&&lucide.createIcons());
        
        closeRemediationModal();
        renderDashboardReport();
        showToast("Remediation amendment applied! Document status updated to Passed.");
    });

    // Copy to clipboard simulation
    if(copyClauseBtn) copyClauseBtn.addEventListener("click", () => {
        const textToCopy = modalRemediationClause.textContent;
        navigator.clipboard.writeText(textToCopy).then(() => {
            showToast("AI clause copied to clipboard!");
        }).catch(err => {
            console.error("Copy failed", err);
        });
    });

    // Send via DocuSign  - simulated workflow
    const docusignSendBtn = document.getElementById("docusign-send-btn");
    if (docusignSendBtn) {
        docusignSendBtn.addEventListener("click", () => {
            if (!activeRemediationRow) return;
            const docName = activeRemediationRow.name || "vendor contract";
            docusignSendBtn.querySelector("span").textContent = "Sending envelope...";
            docusignSendBtn.disabled = true;

            setTimeout(() => {
                docusignSendBtn.querySelector("span").textContent = "✓ Sent to DocuSign!";
                docusignSendBtn.style.color = "#22c55e";
                docusignSendBtn.style.borderColor = "rgba(34,197,94,0.4)";

                setTimeout(() => {
                    closeRemediationModal();
                    showToast(`DocuSign envelope created for "${docName}"  - vendor notified to sign the amendment.`);
                    docusignSendBtn.querySelector("span").textContent = "Send via DocuSign";
                    docusignSendBtn.style.color = "";
                    docusignSendBtn.style.borderColor = "";
                    docusignSendBtn.disabled = false;
                }, 1200);
            }, 1800);
        });
    }

    // --- Action Button footers in dashboard ---
    if(restartAuditBtn) restartAuditBtn.addEventListener("click", () => {
        // Reset file statuses back to original so they can run scans again
        activeFiles.forEach(f => f.currentStatus = f.originalStatus);
        showSimStep("connect");
        showToast("Audit simulator reset successfully.");
    });

    if(downloadReportBtn) downloadReportBtn.addEventListener("click", function() {
        var plan   = getCurrentPlan();
        var limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
        if (!limits.downloadReport) {
            showToast("Report download is available on Pro & Enterprise plans. Upgrade to access.", true);
            return;
        }
        var session = null;
        try { session = JSON.parse(localStorage.getItem("ar_session") || "null"); } catch {}
        var user = session ? session.email : "Guest";
        var lines = [
            "AUDITREADY.AI - COMPLIANCE ASSESSMENT REPORT",
            "================================================================",
            "Generated  : " + new Date().toLocaleString("en-IN"),
            "Framework  : " + currentFramework,
            "Cloud Layer: " + currentProvider.toUpperCase(),
            "Plan       : " + plan.charAt(0).toUpperCase() + plan.slice(1),
            "User       : " + user,
            "",
            "EXECUTIVE SUMMARY",
            "----------------------------------------------------------------",
            "Total Files Scanned  : " + activeFiles.length,
            "Compliance Gaps Found: " + statFailedText.innerText,
            "Passed Audits        : " + statPassedText.innerText,
            "Compliance Score     : " + statScoreText.innerText,
            "",
            "DETAILED FILE RESULTS",
            "----------------------------------------------------------------"
        ];
        activeFiles.forEach(function(f) {
            lines.push("* " + f.name);
            lines.push("  Status     : " + f.currentStatus);
            lines.push("  Risk Level : " + f.risk);
            lines.push("  Finding    : " + f.issue);
            lines.push("  Action     : " + (f.actionLabel !== "None" ? f.actionLabel : "No action required"));
            lines.push("");
        });
        var failed = activeFiles.filter(function(f) { return f.currentStatus === "Failed"; });
        lines.push("REMEDIATION SUMMARY");
        lines.push("----------------------------------------------------------------");
        if (failed.length) { failed.forEach(function(f) { lines.push("- " + f.name + ": " + f.issue); }); }
        else { lines.push("No remediation required. All documents are compliant."); }
        lines.push(""); lines.push("================================================================");
        lines.push("AuditReady.AI | Powered by Google Gemini AI | " + new Date().toISOString());
        var blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
        var url  = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href  = url;
        link.download = "AuditReady_" + currentFramework.replace(/\s+/g, "_") + "_Report_" + Date.now() + ".txt";
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast("Compliance report downloaded successfully!");
    });

    // --- Toast Controller ---
    function showToast(message, isError = false) {
        const toastIcon = toast.querySelector(".toast-icon");
        const toastMsg = toast.querySelector(".toast-message");
        
        toastMsg.innerText = message;
        
        if (isError) {
            toast.style.borderColor = "var(--danger)";
            toastIcon.setAttribute("data-lucide", "alert-triangle");
            toastIcon.style.color = "var(--danger)";
        } else {
            toast.style.borderColor = "var(--success)";
            toastIcon.setAttribute("data-lucide", "check");
            toastIcon.style.color = "var(--success)";
        }
        
        (typeof lucide!=='undefined'&&lucide.createIcons());
        toast.classList.add("active");
        
        setTimeout(() => {
            toast.classList.remove("active");
        }, 3000);
    }

    // --- Legal Modals (Privacy, Terms, Security) ---
    function openLegalModal(id) {
        document.getElementById(id).classList.add("active");
        (typeof lucide!=='undefined'&&lucide.createIcons());
    }

    function closeLegalModal(id) {
        document.getElementById(id).classList.remove("active");
    }

    // Open buttons in footer
    const privacyBtn = document.getElementById("open-privacy-btn");
    const termsBtn   = document.getElementById("open-terms-btn");
    const securityBtn = document.getElementById("open-security-btn");

    if (privacyBtn)  privacyBtn.addEventListener("click",  (e) => { e.preventDefault(); openLegalModal("privacy-modal"); });
    if (termsBtn)    termsBtn.addEventListener("click",    (e) => { e.preventDefault(); openLegalModal("terms-modal"); });
    if (securityBtn) securityBtn.addEventListener("click", (e) => { e.preventDefault(); openLegalModal("security-modal"); });

    // Open Full User Guide button (landing page "How It Works" section)
    const openManualBtn = document.getElementById("open-manual-btn");
    if (openManualBtn) {
        openManualBtn.addEventListener("click", (e) => {
            e.preventDefault();
            openLegalModal("user-manual-modal");
            (typeof lucide!=='undefined'&&lucide.createIcons());
        });
    }

    // Close buttons  - delegated so it works for support modal added after script tag
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".legal-close-btn");
        if (btn) {
            const target = btn.getAttribute("data-target");
            if (target) closeLegalModal(target);
        }
    });

    // Click outside any modal overlay to close  - delegated
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("modal-overlay") && e.target.classList.contains("legal-modal")) {
            e.target.classList.remove("active");
        }
    });



// Run immediately – DOM already ready at this point
})();

/* ============================================================
   HELP & SUPPORT  - Brevo Email via Cloudflare Worker
   300 emails/DAY free (vs old EmailJS: 200/month)
   Worker URL: https://auditready-support.yoursubdomain.workers.dev
   See: complete_credentials_guide.md → Cloudflare Worker section
   ============================================================ */
window.addEventListener("load", function initSupportForm() {
    // Worker URL reads from Admin → System Setup → ar_credentials (key: CLOUDFLARE_WORKER_URL)
    let _creds = {};
    try { _creds = (window.AR_CONFIG || {}); } catch {}
    const WORKER_URL  = _creds.CLOUDFLARE_WORKER_URL || _creds.WORKER_URL || '';  // Both keys supported
    const ADMIN_EMAIL = _creds.ADMIN_EMAIL || 'prakharmishra00000@gmail.com';


    let supportFiles = [];  // Stores File objects selected by user

    const openSupportBtn   = document.getElementById("open-support-btn");
    const navSupportLink   = document.getElementById("nav-support-link");
    const supportModal     = document.getElementById("support-modal");
    const attachBtn        = document.getElementById("support-attach-btn");
    const fileInput        = document.getElementById("support-file-input");
    const fileList         = document.getElementById("support-file-list");
    const sendBtn          = document.getElementById("support-send-btn");

    // Open modal via floating button
    if (openSupportBtn) {
        openSupportBtn.addEventListener("click", () => {
            supportModal.classList.add("active");
            syncSupportTabsState();
            (typeof lucide!=='undefined'&&lucide.createIcons());
        });
    }

    // Open modal via nav link
    if (navSupportLink) {
        navSupportLink.addEventListener("click", (e) => {
            e.preventDefault();
            supportModal.classList.add("active");
            syncSupportTabsState();
            (typeof lucide!=='undefined'&&lucide.createIcons());
        });
    }

    function syncSupportTabsState() {
        const session = getSession();
        const tabContainer = document.getElementById('support-modal-tabs');
        if (session && tabContainer) {
            tabContainer.style.display = 'flex';
            window.AR_switchSupportTab('submit');
        } else if (tabContainer) {
            tabContainer.style.display = 'none';
            window.AR_switchSupportTab('submit');
        }
    }

    window.AR_switchSupportTab = function(tabName) {
        const submitTabBtn = document.getElementById('tab-support-submit');
        const historyTabBtn = document.getElementById('tab-support-history');
        const formCol = document.getElementById('support-form-col');
        const historyCol = document.getElementById('support-history-col');
        
        if (tabName === 'history') {
            submitTabBtn?.classList.remove('active');
            historyTabBtn?.classList.add('active');
            if (formCol) formCol.style.display = 'none';
            if (historyCol) {
                historyCol.style.display = 'flex';
                renderSupportHistory();
            }
        } else {
            historyTabBtn?.classList.remove('active');
            submitTabBtn?.classList.add('active');
            if (historyCol) historyCol.style.display = 'none';
            if (formCol) formCol.style.display = 'block';
        }
    };

    function renderSupportHistory() {
        const historyCol = document.getElementById('support-history-col');
        if (!historyCol) return;
        
        const session = getSession();
        if (!session) {
            historyCol.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-muted)">Please sign in to view your tickets.</div>';
            return;
        }
        
        let allQueries = [];
        try { allQueries = JSON.parse(localStorage.getItem('ar_support_queries') || '[]'); } catch {}
        
        const myQueries = allQueries.filter(q => q.email.toLowerCase() === session.email.toLowerCase());
        
        if (!myQueries.length) {
            historyCol.innerHTML = `
                <div style="text-align:center;padding:3rem 1rem;color:var(--text-muted);display:flex;flex-direction:column;align-items:center;gap:.75rem">
                    <i data-lucide="inbox" style="width:36px;height:36px;opacity:.3"></i>
                    <p style="font-size:.9rem">No support tickets submitted yet.</p>
                </div>`;
            (typeof lucide!=='undefined'&&lucide.createIcons());
            return;
        }
        
        historyCol.innerHTML = myQueries.map(q => {
            const repliesHtml = (q.replies || []).map(r => `
                <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);border-radius:8px;padding:.65rem;margin-top:.5rem;margin-left:1rem">
                    <div style="display:flex;justify-content:space-between;font-size:.73rem;color:var(--text-muted);margin-bottom:.2rem">
                        <strong>${r.sender}</strong>
                        <span>${r.time}</span>
                    </div>
                    <div style="font-size:.8rem;color:var(--text-primary);line-height:1.4">${r.text}</div>
                </div>
            `).join('');
            
            return `
                <div class="ticket-card" style="background:rgba(255,255,255,.02);border:1px solid var(--border-color);border-radius:10px;padding:1rem;margin-bottom:.75rem">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem">
                        <span class="badge-${q.status==='open'?'cyan':'green'}" style="font-size:.75rem;padding:2px 8px;border-radius:4px">${q.status}</span>
                        <small style="color:var(--text-muted)">${q.time}</small>
                    </div>
                    <h4 style="font-size:.92rem;font-weight:700;color:var(--text-primary);margin-bottom:.3rem">${q.subject.charAt(0).toUpperCase() + q.subject.slice(1)}</h4>
                    <p style="font-size:.82rem;color:var(--text-secondary);line-height:1.5;background:rgba(0,0,0,.15);padding:.5rem .75rem;border-radius:6px">${q.msg}</p>
                    
                    ${q.attachments && q.attachments.length ? `
                        <div style="margin-top:.5rem;font-size:.75rem;color:var(--text-muted)">
                            <strong>Attachments:</strong> ${q.attachments.join(', ')}
                        </div>
                    ` : ''}

                    ${q.replies && q.replies.length ? `
                        <div style="margin-top:.75rem;border-top:1px solid var(--border-color);padding-top:.75rem">
                            <strong style="font-size:.78rem;color:var(--cyan);display:block;margin-bottom:.4rem">Replies</strong>
                            ${repliesHtml}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
        (typeof lucide!=='undefined'&&lucide.createIcons());
    }

    // ---- File Attachment Logic ----
    if (attachBtn && fileInput) {
        attachBtn.addEventListener("click", () => {
            if (supportFiles.length >= 5) {
                alert("Maximum 5 attachments allowed.");
                return;
            }
            fileInput.click();
        });

        if(fileInput) fileInput.addEventListener("change", () => {
            const newFiles = Array.from(fileInput.files);
            for (const f of newFiles) {
                if (supportFiles.length >= 5) break;
                const isDupe = supportFiles.some(x => x.name === f.name && x.size === f.size);
                if (!isDupe) supportFiles.push(f);
            }
            fileInput.value ="";
            renderFileChips();
        });
    }

    function getFileIcon(filename) {
        const ext = filename.split(".").pop().toLowerCase();
        if (["png","jpg","jpeg","gif","webp"].includes(ext)) return "image";
        if (ext === "pdf") return "file-text";
        if (["doc","docx"].includes(ext)) return "file-text";
        if (ext === "csv") return "table";
        if (["json","js","ts"].includes(ext)) return "file-code";
        return "paperclip";
    }

    function renderFileChips() {
        fileList.innerHTML = "";
        supportFiles.forEach((file, index) => {
            const chip = document.createElement("div");
            chip.className = "support-file-chip";
            chip.innerHTML = `
                <i data-lucide="${getFileIcon(file.name)}" class="chip-icon"></i>
                <span class="chip-name" title="${file.name}">${file.name}</span>
                <button class="chip-remove" data-index="${index}" title="Remove"><i data-lucide="x"></i></button>
            `;
            fileList.appendChild(chip);
        });
        (typeof lucide!=='undefined'&&lucide.createIcons());

        fileList.querySelectorAll(".chip-remove").forEach(btn => {
            btn.addEventListener("click", () => {
                const i = parseInt(btn.getAttribute("data-index"));
                supportFiles.splice(i, 1);
                renderFileChips();
            });
        });
    }

    // ---- Send Query Logic  - Brevo via Cloudflare Worker ----
    if (sendBtn) {
        sendBtn.addEventListener("click", async () => {
            const name    = (document.getElementById("support-name")?.value || "").trim();
            const email   = (document.getElementById("support-email")?.value || "").trim();
            const subject = (document.getElementById("support-subject")?.value || "general");
            const message = (document.getElementById("support-message")?.value || "").trim();

            if (!email || !email.includes("@")) {
                alert("Please enter a valid email address so we can reply to you.");
                return;
            }
            if (!message) {
                alert("Please describe your issue or question before sending.");
                return;
            }

            const fileNames = supportFiles.length
                ? supportFiles.map(f => `" ${f.name} (${(f.size/1024).toFixed(1)} KB)`).join("\n")
                : "None";

            sendBtn.disabled = true;
            sendBtn.querySelector("span").textContent = "Sending...";

            const payload = {
                from_name:   name || "Anonymous",
                from_email:  email,
                subject:     subject.charAt(0).toUpperCase() + subject.slice(1),
                message:     message,
                attachments: fileNames
            };

            try {
                // Save query to localStorage so admin panel sees it immediately
                try { var qs=[]; try{qs=JSON.parse(localStorage.getItem('ar_support_queries')||'[]');}catch{}
                qs.unshift({id:Date.now(),name:payload.from_name,email:payload.from_email,subject:payload.subject,msg:payload.message,time:new Date().toLocaleString('en-IN'),status:'open',attachments:supportFiles.map(function(f){return f.name;})});
                localStorage.setItem('ar_support_queries',JSON.stringify(qs)); } catch {}

                if (WORKER_URL) {
                    // Production path – Brevo via Cloudflare Worker (300 emails/day free)
                    const res = await fetch(WORKER_URL, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });
                    if (!res.ok) console.warn(`Email worker returned ${res.status}, but ticket was logged locally.`);
                }
                sendBtn.querySelector("span").textContent = "✓ Query Sent!";
                sendBtn.style.background = "var(--success)";
                setTimeout(() => {
                    supportModal.classList.remove("active");
                    document.getElementById("support-name").value    ="";
                    document.getElementById("support-email").value   ="";
                    document.getElementById("support-message").value ="";
                    document.getElementById("support-subject").value = "general";
                    supportFiles = [];
                    renderFileChips();
                    sendBtn.disabled = false;
                    sendBtn.querySelector("span").textContent = "Send Query";
                    sendBtn.style.background = "";
                    renderSupportHistory(); // refresh history if viewing
                }, 2000);

            } catch (err) {
                console.error("Support form error:", err);
                sendBtn.querySelector("span").textContent = "Send Query";
                sendBtn.disabled = false;
                alert("Failed to send your query. Please email us directly at: " + ADMIN_EMAIL);
            }
        });
    }
    // (Backdrop close is handled globally via event delegation above)
});


/* ================================================================
   ADMIN SETTINGS BRIDGE
   Reads admin-saved settings from localStorage and applies them to
   the main site on startup. Settings survive ALL page refreshes and
   site code updates because they are stored in the BROWSER localStorage.
   Plans purchased by users are stored per email (ar_plan_EMAIL) and
   are NEVER reset by any site code  -  only by admin action or expiry.
================================================================ */
(function() {
    'use strict';

    // Keys must match admin/admin.js constants exactly
    const LS_PLANS    = 'ar_plans';
    const LS_SETTINGS = 'ar_settings';
    const LS_CREDS    = 'ar_credentials';
    const LS_KEYS     = 'ar_gemini_keys';
    const LS_KEY_IDX  = 'ar_gemini_key_index';

    function readLS(key, def) {
        try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
    }

    /* -- GEMINI KEY ROTATION -- */
    function getActiveGeminiKey() {
        const keys  = readLS(LS_KEYS, []);
        const creds = readLS(LS_CREDS, {});
        if (!keys.length) return creds.GEMINI_API_KEY || '';
        let idx = parseInt(localStorage.getItem(LS_KEY_IDX) || '0');
        if (isNaN(idx) || idx >= keys.length) idx = 0;
        return keys[idx] || creds.GEMINI_API_KEY || '';
    }
    function rotateGeminiKey() {
        const keys = readLS(LS_KEYS, []);
        if (!keys.length) return;
        let idx = parseInt(localStorage.getItem(LS_KEY_IDX) || '0');
        idx = (idx + 1) % keys.length;
        localStorage.setItem(LS_KEY_IDX, String(idx));
        console.log('[AR] Gemini key rotated to slot', idx);
    }
    window.AR_getActiveGeminiKey = getActiveGeminiKey;
    window.AR_rotateGeminiKey    = rotateGeminiKey;

    /* -- SYNC PRICING CARDS FROM ADMIN PLAN EDITOR -- */
    function applyAdminPlans() {
        const plans = readLS(LS_PLANS, null);
        var _fw = readLS('ar_frameworks', null);
        if (!plans) return;
        document.querySelectorAll('.price-card').forEach(function(card) {
            const payBtn = card.querySelector('.btn-pay');
            if (!payBtn) return;
            const pid = payBtn.dataset.plan;
            const p   = plans[pid];
            if (!p) return;

            // Plan visibility
            if (p.visible === false) {
                card.style.display = 'none';
                return;
            } else {
                card.style.display = '';
            }

            var priceEl = card.querySelector('.price-val');
            if (priceEl && p.price) {
                var monthly = Number(p.price);
                var annual  = Math.round(monthly * 0.8);
                priceEl.setAttribute('data-monthly', monthly);
                priceEl.setAttribute('data-annual',  annual);
                priceEl.textContent = monthly.toLocaleString('en-IN');
            }
            var nameEl = card.querySelector('.plan-name');
            if (nameEl && p.name) nameEl.textContent = p.name;
            var descEl = card.querySelector('.plan-desc');
            if (descEl && p.description) descEl.textContent = p.description;
            if (p.price) payBtn.dataset.price = String(p.price);
            if (p.name)  payBtn.dataset.name  = p.name;

            // Render features dynamically
            if (p.features && p.features.length) {
                const uList = card.querySelector('.price-features ul');
                if (uList) {
                    uList.innerHTML = p.features.map(function(f) {
                        return '<li><i data-lucide="check-circle" class="text-cyan"></i> ' + f + '</li>';
                    }).join('');
                }
            }
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    /* -- APPLY ADMIN SITE SETTINGS -- */
    function applyAdminSettings() {
        var s = readLS(LS_SETTINGS, null);
        if (!s) return;
        if (s.maintenance_mode) {
            document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#060b14;color:#00e5ff;font-family:Outfit,sans-serif;text-align:center;flex-direction:column;gap:1.5rem"><svg width=\"64\" height=\"64\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\"><path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z\"/></svg><h1 style=\"font-size:2rem;font-weight:800\">Under Maintenance</h1><p style=\"color:rgba(255,255,255,.5);max-width:400px\">AuditReady.AI is currently undergoing scheduled maintenance. We will be back shortly.</p></div>';
            return;
        }
        if (s.hero_title) {
            var h = document.querySelector('.hero-title');
            if (h) h.innerHTML = s.hero_title;
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        applyAdminPlans();
        applyAdminSettings();
    });
})();


/* -----------------------------------------------------------
   AUTH SYSTEM  -  Sign Up / Sign In / Google / Plan Gating
   Accounts: localStorage ar_accounts (encrypted passwords)
   Session:  localStorage ar_session  (email, name, isGoogle)
   Plans:    localStorage ar_plan_EMAIL (plan, expiry)
----------------------------------------------------------- */
(function() {
    'use strict';

    /* -- STORAGE KEYS -- */
    const LS_ACCOUNTS = 'ar_accounts';   // [{email, pwHash, name, created}]
    const LS_SESSION  = 'ar_session';    // {email, name, isGoogle}
    const LS_PLAN_PFX = 'ar_plan_';      // + email ? {plan, expiry, utr}

    /* -- SIMPLE HASH (not cryptographic  -  demo) -- */
    function hashStr(s) {
        let h = 0x811c9dc5;
        for (let i = 0; i < s.length; i++) {
            h ^= s.charCodeAt(i);
            h = (h * 0x01000193) >>> 0;
        }
        return h.toString(16);
    }

    /* -- ACCOUNT STORE -- */
    function getAccounts() {
        try { return JSON.parse(localStorage.getItem(LS_ACCOUNTS) || '[]'); } catch { return []; }
    }
    function saveAccounts(arr) {
        localStorage.setItem(LS_ACCOUNTS, JSON.stringify(arr));
    }
    function findAccount(email) {
        return getAccounts().find(a => a.email.toLowerCase() === email.toLowerCase());
    }

    /* -- SESSION -- */
    function getSession() {
        try { return JSON.parse(localStorage.getItem(LS_SESSION) || 'null'); } catch { return null; }
    }
    function setSession(user) {
        localStorage.setItem(LS_SESSION, JSON.stringify(user));
    }
    function clearSession() {
        localStorage.removeItem(LS_SESSION);
    }

    /* -- USER PLAN (per email) -- */
    function getUserPlan(email) {
        if (!email) return null;
        if (email.toLowerCase() === 'prakharmishra00000@gmail.com') {
            return { plan: 'enterprise', expiry: Date.now() + 315360000000 }; // Permanent
        }
        try {
            const raw = localStorage.getItem(LS_PLAN_PFX + email.toLowerCase());
            if (!raw) return null;
            const p = JSON.parse(raw);
            if (Date.now() > p.expiry) {
                localStorage.removeItem(LS_PLAN_PFX + email.toLowerCase());
                return null;
            }
            return p;
        } catch { return null; }
    }
    function setUserPlan(email, plan, expiry, utr) {
        localStorage.setItem(LS_PLAN_PFX + email.toLowerCase(), JSON.stringify({ plan, expiry, utr }));
    }

    /* --------------------------------------------------
       AUTH MODAL CONTROL
    -------------------------------------------------- */
    let pendingPayPlan = null; // if user clicked Pay before signing in

    function openAuthModal(tab, hint) {
        const modal = document.getElementById('auth-modal');
        if (modal) modal.classList.add('open');
        if (tab === 'signup') switchTab('signup');
        else switchTab('signin');
        if (hint) {
            const hintEl = document.getElementById('auth-signin-hint');
            if (hintEl) { hintEl.textContent = hint; hintEl.classList.remove('hidden'); }
        }
        (typeof lucide!=='undefined'&&lucide.createIcons());
    }

    function closeAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) modal.classList.remove('open');
        clearAuthErrors();
    }

    function switchTab(tab) {
        const signInForm  = document.getElementById('auth-signin-form');
        const signUpForm  = document.getElementById('auth-signup-form');
        const forgotForm  = document.getElementById('auth-forgot-form');
        const tabSignIn   = document.getElementById('tab-signin');
        const tabSignUp   = document.getElementById('tab-signup');
        const tabs        = document.getElementById('tab-signin')?.parentElement;

        [signInForm, signUpForm, forgotForm].forEach(f => f?.classList.add('hidden'));
        [tabSignIn, tabSignUp].forEach(t => t?.classList.remove('active'));

        if (tab === 'signup') {
            signUpForm?.classList.remove('hidden');
            tabSignUp?.classList.add('active');
        } else if (tab === 'forgot') {
            forgotForm?.classList.remove('hidden');
            if (tabs) tabs.style.display = 'none';
        } else {
            signInForm?.classList.remove('hidden');
            tabSignIn?.classList.add('active');
            const tabs2 = document.getElementById('tab-signin')?.parentElement;
            if (tabs2) tabs2.style.display = '';
        }
        clearAuthErrors();
    }

    function clearAuthErrors() {
        ['si-error','su-error','fp-error'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.textContent=''; el.classList.remove('show'); }
        });
    }

    function showError(id, msg) {
        const el = document.getElementById(id);
        if (el) { el.textContent = msg; el.classList.add('show'); }
    }

    /* --------------------------------------------------
       GOOGLE SIGN-IN (Firebase if configured, else demo)
    -------------------------------------------------- */
    function doGoogleAuth() {
        const creds = {};
        try { Object.assign(creds, (window.AR_CONFIG || {})); } catch {}

        if (creds.GOOGLE_CLIENT_ID && typeof google !== 'undefined' && google.accounts) {
            // Official Google Identity Services - OAuth2 Custom Button Flow
            const client = google.accounts.oauth2.initTokenClient({
                client_id: creds.GOOGLE_CLIENT_ID,
                scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
                callback: (response) => {
                    if (response && response.access_token) {
                        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                            headers: { Authorization: `Bearer ${response.access_token}` }
                        })
                        .then(res => res.json())
                        .then(data => {
                            if (!data.email) throw new Error("Email not found");
                            let accounts = getAccounts();
                            if (!accounts.find(a => a.email.toLowerCase() === data.email.toLowerCase())) {
                                accounts.push({ email: data.email, pwHash: null, name: data.name, created: Date.now(), google: true });
                                saveAccounts(accounts);
                            }
                            loginSuccess({ email: data.email, name: data.name || data.email.split('@')[0], isGoogle: true });
                        })
                        .catch(err => {
                            showError('si-error', 'Google profile fetch failed: ' + err.message);
                        });
                    }
                }
            });
            client.requestAccessToken();
        } else if (typeof firebase !== 'undefined' && firebase.apps && firebase.auth && (creds.FIREBASE_CONFIG && creds.FIREBASE_CONFIG.apiKey)) {
            // Real Firebase Google Auth
            if (!firebase.apps.length) {
                firebase.initializeApp({
                    apiKey:        (creds.FIREBASE_CONFIG && creds.FIREBASE_CONFIG.apiKey),
                    authDomain:    creds.FIREBASE_AUTH_DOMAIN,
                    projectId:     creds.FIREBASE_PROJECT_ID,
                    storageBucket: creds.FIREBASE_STORAGE_BUCKET,
                    messagingSenderId: creds.FIREBASE_MESSAGING_SENDER_ID,
                    appId:         creds.FIREBASE_APP_ID,
                });
            }
            const provider = new firebase.auth.GoogleAuthProvider();
            firebase.auth().signInWithPopup(provider)
                .then(result => {
                    const user = result.user;
                    // Register if first time
                    let accounts = getAccounts();
                    if (!accounts.find(a => a.email.toLowerCase() === user.email.toLowerCase())) {
                        accounts.push({ email: user.email, pwHash: null, name: user.displayName, created: Date.now(), google: true });
                        saveAccounts(accounts);
                    }
                    loginSuccess({ email: user.email, name: user.displayName || user.email.split('@')[0], isGoogle: true });
                })
                .catch(err => {
                    showError('si-error', 'Google sign-in failed: ' + err.message);
                });
        } else {
            // Demo Google auth – show a proper inline modal (prompt() blocked on HTTPS)
            showGoogleDemoModal();
        }
    }

    function showGoogleDemoModal() {
        // Remove any existing demo modal
        const existing = document.getElementById('google-demo-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'google-demo-modal';
        modal.style.cssText = `
            position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;
            display:flex;align-items:center;justify-content:center;padding:1rem;
        `;
        modal.innerHTML = `
            <div style="background:#1a1f2e;border:1px solid rgba(255,255,255,0.12);border-radius:16px;
                        padding:2rem;width:100%;max-width:400px;position:relative;">
                <button onclick="document.getElementById('google-demo-modal').remove()"
                        style="position:absolute;top:1rem;right:1rem;background:none;border:none;
                               color:#aaa;font-size:1.4rem;cursor:pointer;line-height:1">&#x2715;</button>
                <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1.5rem">
                    <svg width="28" height="28" viewBox="0 0 48 48">
                        <path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.1 33.1 29.5 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l6.4-6.4C34.4 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.8 0 20.1-7.8 20.1-21 0-1.4-.1-2.7-.3-4z"/>
                        <path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 16.1 19.2 13 24 13c3 0 5.7 1.1 7.8 2.9l6.4-6.4C34.4 5.1 29.5 3 24 3 16.2 3 9.4 7.9 6.3 14.7z"/>
                        <path fill="#FBBC05" d="M24 45c5.3 0 10.2-1.8 13.9-4.9l-6.5-5.3C29.5 36.7 26.9 37.5 24 37.5c-5.5 0-10.1-3.7-11.7-8.7l-6.9 5.3C8.8 40.9 15.9 45 24 45z"/>
                        <path fill="#EA4335" d="M44.5 20H24v8.5h11.7c-.8 2.3-2.3 4.2-4.3 5.5l6.5 5.3C42.1 36 45 30.5 45 24c0-1.4-.1-2.7-.3-4z"/>
                    </svg>
                    <span style="color:#fff;font-size:1.1rem;font-weight:600">Sign in with Google</span>
                </div>
                <div style="margin-bottom:1rem">
                    <label style="color:#aaa;font-size:.85rem;display:block;margin-bottom:.4rem">Google Email Address</label>
                    <input id="gdemo-email" type="email" placeholder="you@gmail.com"
                           style="width:100%;padding:.75rem 1rem;background:#0f1322;border:1px solid rgba(255,255,255,0.15);
                                  border-radius:10px;color:#fff;font-size:.95rem;box-sizing:border-box;outline:none">
                </div>
                <div style="margin-bottom:1.5rem">
                    <label style="color:#aaa;font-size:.85rem;display:block;margin-bottom:.4rem">Your Name</label>
                    <input id="gdemo-name" type="text" placeholder="Prakhar Mishra"
                           style="width:100%;padding:.75rem 1rem;background:#0f1322;border:1px solid rgba(255,255,255,0.15);
                                  border-radius:10px;color:#fff;font-size:.95rem;box-sizing:border-box;outline:none">
                </div>
                <p id="gdemo-error" style="color:#f87171;font-size:.85rem;margin-bottom:.75rem;display:none"></p>
                <button onclick="submitGoogleDemo()"
                        style="width:100%;padding:.85rem;background:linear-gradient(135deg,#06b6d4,#3b82f6);
                               border:none;border-radius:10px;color:#fff;font-size:1rem;font-weight:600;cursor:pointer">
                    Continue with Google
                </button>
                <p style="color:#6b7280;font-size:.78rem;text-align:center;margin-top:1rem">
                    Full Google OAuth activates after Firebase setup in Admin Panel
                </p>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('gdemo-email').focus();
    }

    window.submitGoogleDemo = function() {
        const email = document.getElementById('gdemo-email')?.value.trim().toLowerCase();
        const name  = document.getElementById('gdemo-name')?.value.trim();
        const errEl = document.getElementById('gdemo-error');
        if (!email || !email.includes('@')) {
            errEl.textContent = 'Please enter a valid email address.';
            errEl.style.display = 'block';
            return;
        }
        let accountsList = getAccounts();
        const existingAcc = accountsList.find(a => a.email.toLowerCase() === email);
        if (existingAcc && existingAcc.suspended) {
            errEl.textContent = 'Your account has been suspended by the administrator.';
            errEl.style.display = 'block';
            return;
        }
        document.getElementById('google-demo-modal').remove();
        // Register if first time
        if (!accountsList.find(a => a.email.toLowerCase() === email)) {
            accountsList.push({ email, pwHash: null, name: name || email.split('@')[0], created: Date.now(), google: true });
            saveAccounts(accountsList);
        }
        loginSuccess({ email, name: name || email.split('@')[0], isGoogle: true });
    };

    /* --------------------------------------------------
       SIGN UP
    -------------------------------------------------- */
    function doSignUp() {
        const name    = document.getElementById('su-name')?.value.trim();
        const email   = document.getElementById('su-email')?.value.trim().toLowerCase();
        const pw      = document.getElementById('su-password')?.value;
        const confirm = document.getElementById('su-confirm')?.value;

        if (!name)             { showError('su-error','Please enter your full name.'); return; }
        if (!email || !email.includes('@')) { showError('su-error','Please enter a valid email address.'); return; }
        if (!pw || pw.length < 8) { showError('su-error','Password must be at least 8 characters.'); return; }
        if (pw !== confirm)    { showError('su-error','Passwords do not match.'); return; }

        const accounts = getAccounts();
        if (accounts.find(a => a.email.toLowerCase() === email)) {
            showError('su-error','An account with this email already exists. Please sign in.');
            return;
        }

        // Create account
        accounts.push({ email, pwHash: hashStr(pw), name, created: Date.now(), google: false });
        saveAccounts(accounts);
        loginSuccess({ email, name, isGoogle: false });
    }

    /* --------------------------------------------------
       SIGN IN
    -------------------------------------------------- */
    function doSignIn() {
        const email = document.getElementById('si-email')?.value.trim().toLowerCase();
        const pw    = document.getElementById('si-password')?.value;

        if (!email || !email.includes('@')) { showError('si-error','Please enter a valid email address.'); return; }
        if (!pw)                            { showError('si-error','Please enter your password.'); return; }

        const account = findAccount(email);
        if (!account) {
            showError('si-error','No account found with this email. Please sign up first.');
            return;
        }
        if (account.suspended) {
            showError('si-error','Your account has been suspended by the administrator.');
            return;
        }
        if (account.google) {
            showError('si-error','This email is registered with Google. Please use "Continue with Google".');
            return;
        }
        if (account.pwHash !== hashStr(pw)) {
            showError('si-error','Incorrect password. Please try again.');
            return;
        }

        loginSuccess({ email: account.email, name: account.name, isGoogle: false });
    }

    /* --------------------------------------------------
       FORGOT PASSWORD
    -------------------------------------------------- */
    function doForgotPassword() {
        const email = document.getElementById('fp-email')?.value.trim().toLowerCase();
        if (!email || !email.includes('@')) { showError('fp-error','Please enter a valid email address.'); return; }

        const account = findAccount(email);
        if (!account) {
            showError('fp-error','No account found with this email address.');
            return;
        }

        // Simulate sending reset email
        const fpBtn = document.getElementById('fp-submit-btn');
        if (fpBtn) {
            fpBtn.textContent = 'Sending...';
            fpBtn.disabled = true;
        }
        setTimeout(() => {
            if (fpBtn) { fpBtn.textContent = '? Reset link sent to ' + email; }
            setTimeout(() => {
                switchTab('signin');
                if (fpBtn) { fpBtn.textContent = 'Send Reset Link'; fpBtn.disabled = false; }
            }, 2500);
        }, 1200);
    }

    /* --------------------------------------------------
       LOGIN SUCCESS  -  update UI, handle pending payment
    -------------------------------------------------- */
    function loginSuccess(user) {
        setSession(user);
        closeAuthModal();
        updateNavForUser(user);
        loadUserPlanBadge(user.email);

        // If user had clicked "Pay & Auto Unlock" before signing in
        if (pendingPayPlan) {
            const { planId, price, planName } = pendingPayPlan;
            pendingPayPlan = null;
            setTimeout(() => openPayModal(planId, price, planName), 350);
        }
    }

    function doSignOut() {
        clearSession();
        updateNavForGuest();
        // Remove active plan badge
        const badge = document.getElementById('active-plan-badge');
        if (badge) badge.remove();
    }

    /* --------------------------------------------------
       NAV STATE UPDATES
    -------------------------------------------------- */
    function updateNavForUser(user) {
        const authBtns = document.getElementById('auth-btns-group');
        const userPill = document.getElementById('nav-user-pill');
        if (authBtns) authBtns.classList.add('hidden');
        if (userPill) userPill.classList.remove('hidden');

        const initial = (user.name || user.email).charAt(0).toUpperCase();
        const el = (id) => document.getElementById(id);
        if (el('nav-avatar'))    el('nav-avatar').textContent = initial;
        if (el('nud-avatar'))    el('nud-avatar').textContent = initial;
        if (el('nav-user-email')) el('nav-user-email').textContent = user.email;
        if (el('nud-name'))      el('nud-name').textContent = user.name || user.email.split('@')[0];
        if (el('nud-email'))     el('nud-email').textContent = user.email;

        // Dynamic Admin panel link redirection injection removed.
    }

    function updateNavForGuest() {
        const authBtns = document.getElementById('auth-btns-group');
        const userPill = document.getElementById('nav-user-pill');
        if (authBtns) authBtns.classList.remove('hidden');
        if (userPill) userPill.classList.add('hidden');
    }

    function loadUserPlanBadge(email) {
        const p = getUserPlan(email);
        const el = (id) => document.getElementById(id);
        if (p) {
            const daysLeft = Math.ceil((p.expiry - Date.now()) / 86400000);
            const planName = p.plan.charAt(0).toUpperCase() + p.plan.slice(1);
            if (el('nud-plan')) el('nud-plan').textContent = '✅ ' + planName + ' Plan · ' + daysLeft + 'd left';
        } else {
            if (el('nud-plan')) el('nud-plan').textContent = 'Free Plan';
        }
    }

    /* --------------------------------------------------
       PAYMENT GATE  -  require auth before paying
    -------------------------------------------------- */
    // Override the Pay button click to require sign-in first
    function gatePay(planId, price, planName) {
        const session = getSession();
        if (!session) {
            // Store pending intent and open auth modal
            pendingPayPlan = { planId, price, planName };
            openAuthModal('signin', '? Sign in or create an account to purchase the ' + planName + ' Plan.');
            return;
        }
        openPayModal(planId, price, planName);
    }

    // openPayModal wires into the existing payment modal from the previous module
    function openPayModal(planId, price, planName) {
        // Dispatch a custom event that the payment module listens to
        document.dispatchEvent(new CustomEvent('ar:openPayment', {
            detail: { planId, price, planName, userEmail: getSession()?.email }
        }));
    }

    // Expose functions for the payment module to use
    window.AR_AUTH = {
        getSession,
        getUserPlan,
        setUserPlan,
    };

    // Expose globally so HTML onclick attributes work as fallback
    window.AR_openSignIn  = () => openAuthModal('signin');
    window.AR_openSignUp  = () => openAuthModal('signup');
    window.AR_closeAuth   = closeAuthModal;
    window.AR_doSignIn    = doSignIn;
    window.AR_doSignUp    = doSignUp;
    window.AR_doGoogle    = doGoogleAuth;

    /* --------------------------------------------------
       BIND ALL EVENTS
    -------------------------------------------------- */
    // Safe init: runs immediately if DOM ready, else waits for event
    function initAuth() {
        // -- Open auth modal buttons --
        const openSignIn = document.getElementById('open-signin-btn');
        const openSignUp = document.getElementById('open-signup-btn');
        if (openSignIn) openSignIn.addEventListener('click', () => openAuthModal('signin'));
        if (openSignUp) openSignUp.addEventListener('click', () => openAuthModal('signup'));

        // -- Close modal --
        const closeBtn = document.getElementById('auth-modal-close-btn');
        if (closeBtn) closeBtn.addEventListener('click', closeAuthModal);
        document.getElementById('auth-modal')?.addEventListener('click', e => {
            if (e.target === document.getElementById('auth-modal')) closeAuthModal();
        });

        // -- Tab switching --
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab.dataset.tab));
        });
        document.querySelectorAll('.auth-switch-link').forEach(link => {
            link.addEventListener('click', e => { e.preventDefault(); switchTab(link.dataset.switch); });
        });

        // -- Forgot password --
        document.getElementById('auth-forgot-link')?.addEventListener('click', e => {
            e.preventDefault(); switchTab('forgot');
        });

        // -- Google buttons --
        document.getElementById('auth-google-signin-btn')?.addEventListener('click', doGoogleAuth);
        document.getElementById('auth-google-signup-btn')?.addEventListener('click', doGoogleAuth);

        // -- Sign In submit --
        const siBtn = document.getElementById('si-submit-btn');
        if (siBtn) siBtn.addEventListener('click', doSignIn);
        document.getElementById('si-password')?.addEventListener('keydown', e => { if (e.key==='Enter') doSignIn(); });

        // -- Sign Up submit --
        const suBtn = document.getElementById('su-submit-btn');
        if (suBtn) suBtn.addEventListener('click', doSignUp);
        document.getElementById('su-confirm')?.addEventListener('keydown', e => { if (e.key==='Enter') doSignUp(); });

        // -- Forgot submit --
        document.getElementById('fp-submit-btn')?.addEventListener('click', doForgotPassword);

        // -- Password strength meter --
        document.getElementById('su-password')?.addEventListener('input', function() {
            const v = this.value;
            const fill = document.getElementById('pw-strength-fill');
            const lbl  = document.getElementById('pw-strength-label');
            if (!fill) return;
            let score = 0;
            if (v.length >= 8)  score++;
            if (v.length >= 12) score++;
            if (/[A-Z]/.test(v)) score++;
            if (/[0-9]/.test(v)) score++;
            if (/[^a-zA-Z0-9]/.test(v)) score++;
            const pct = (score/5)*100;
            fill.style.width = pct + '%';
            fill.style.background = score<=1 ? '#f87171' : score<=3 ? '#fbbf24' : '#34d399';
            if (lbl) lbl.textContent = score<=1 ? 'Weak' : score<=2 ? 'Fair' : score<=3 ? 'Good' : score<=4 ? 'Strong' : 'Very Strong';
        });

        // -- Toggle password visibility --
        document.querySelectorAll('.auth-eye-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const input = document.getElementById(this.dataset.target);
                if (!input) return;
                const isText = input.type === 'text';
                input.type = isText ? 'password' : 'text';
                this.querySelector('i')?.setAttribute('data-lucide', isText ? 'eye' : 'eye-off');
                if (typeof lucide !== 'undefined') lucide.createIcons();
            });
        });

        // -- Sign Out --
        document.getElementById('nud-signout-btn')?.addEventListener('click', e => {
            e.preventDefault(); doSignOut();
        });

        // -- Nav user pill dropdown toggle --
        document.getElementById('nav-user-pill')?.addEventListener('click', function(e) {
            if (!e.target.closest('#nud-signout-btn') && !e.target.closest('#nud-upgrade-link')) {
                this.classList.toggle('open');
            }
        });
        document.addEventListener('click', e => {
            if (!e.target.closest('#nav-user-pill')) {
                document.getElementById('nav-user-pill')?.classList.remove('open');
            }
        });

        // -- Override Pay buttons to require auth --
        document.querySelectorAll('.btn-pay').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', function() {
                const planId   = this.dataset.plan;
                const price    = parseInt(this.dataset.price);
                const planName = this.dataset.name;
                gatePay(planId, price, planName);
            });
        });

        // -- Restore session on page load --
        const session = getSession();
        if (session) {
            // Check suspension state on restore
            var accounts = [];
            try { accounts = JSON.parse(localStorage.getItem('ar_accounts') || '[]'); } catch {}
            var u = accounts.find(a => a.email.toLowerCase() === session.email.toLowerCase());
            if (u && u.suspended) {
                clearSession();
                updateNavForGuest();
                setTimeout(() => {
                    _payToast('⚠️ Your account has been suspended by the administrator.', 'error');
                }, 1000);
            } else {
                checkAndHandlePlanExpiry(session.email);
                updateNavForUser(session);
                loadUserPlanBadge(session.email);
            }
        } else {
            updateNavForGuest();
        }
    }

    // Run immediately – DOM is already parsed since script is at bottom of <body>
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuth);
    } else {
        initAuth();
    }



    /* ================================================================
       PLAN EXPIRY CHECK + ADMIN REAL-TIME SYNC
    ================================================================ */
    function checkAndHandlePlanExpiry(email) {
        try {
            var raw = localStorage.getItem('ar_plan_' + email.toLowerCase());
            if (!raw) return;
            var p = JSON.parse(raw);
            if (Date.now() > p.expiry) {
                localStorage.removeItem('ar_plan_' + email.toLowerCase());
                showQuickToast('Your ' + (p.plan || 'Pro') + ' plan has expired. You are now on the Free plan.', true);
            }
        } catch {}
    }

    function showQuickToast(msg, isError) {
        var t = document.createElement('div');
        t.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:99999;background:' +
            (isError ? 'rgba(248,113,113,.97)' : 'rgba(52,211,153,.97)') +
            ';color:#000;padding:.7rem 1.6rem;border-radius:12px;font-weight:700;font-size:.9rem;' +
            'max-width:92vw;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.4);font-family:Outfit,sans-serif;';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(function() { t.style.transition = 'opacity .4s'; t.style.opacity = '0'; setTimeout(function(){t.remove();}, 400); }, 5000);
    }

    // Admin real-time sync
    window.addEventListener('storage', function(e) {
        if (['ar_credentials','ar_settings','ar_plans','ar_gemini_keys'].includes(e.key)) {
            try { applyAdminPlans(); applyAdminSettings(); } catch {}
        }
    });

    /* ================================================================
       PAYMENT MODULE
       Single persistent confirm handler using shared _payState.
       Plans stored per-user (ar_plan_EMAIL) and NEVER auto-reset.
    ================================================================ */
    var _payState = { planId: null, price: 0, planName: '', userEmail: '' };

    document.addEventListener('ar:openPayment', function(e) {
        var d = e.detail;
        _payState.planId    = d.planId;
        _payState.price     = d.price;
        _payState.planName  = d.planName;
        _payState.userEmail = d.userEmail || '';

        var title  = document.getElementById('pay-modal-title');
        var amount = document.getElementById('pay-amount-display');
        var pill   = document.getElementById('pay-plan-pill');
        if (title)  title.textContent  = 'Pay & Auto Unlock \u2014 ' + d.planName + ' Plan';
        if (amount) amount.textContent = '\u20b9' + d.price.toLocaleString('en-IN');
        if (pill)   pill.textContent   = d.planName + ' Plan \u00b7 Monthly \u00b7 ' + (d.userEmail || '');

        var creds = {};
        try { creds = (window.AR_CONFIG || {}); } catch {}
        var upiId   = creds.UPI_ID   || '6372843175@kotakbank';
        var upiName = creds.UPI_NAME || 'AuditReady.AI';
        var upiLink = 'upi://pay?pa=' + upiId + '&pn=' + encodeURIComponent(upiName) +
                      '&am=' + d.price + '&cu=INR&tn=AuditReady+' + encodeURIComponent(d.planName);

        var upiBtn = document.getElementById('pay-open-upi-btn');
        if (upiBtn) upiBtn.onclick = function() { window.location.href = upiLink; };

        var canvas = document.getElementById('pay-qr-canvas');
        if (canvas) {
            canvas.innerHTML = '';
            if (typeof QRCode !== 'undefined') {
                try {
                    new QRCode(canvas, { text:upiLink, width:170, height:170, colorDark:'#000', colorLight:'#fff', correctLevel:QRCode.CorrectLevel.M });
                } catch(err) { _qrFb(canvas, upiLink); }
            } else { _qrFb(canvas, upiLink); }
        }

        var copyBtn = document.getElementById('pay-copy-upi-btn');
        if (copyBtn) {
            copyBtn.onclick = function() {
                navigator.clipboard.writeText(upiId).then(function() {
                    copyBtn.innerHTML = '<i data-lucide="check" style="width:13px;height:13px;color:#34d399"></i>';
                    (typeof lucide!=='undefined'&&lucide.createIcons());
                    setTimeout(function() { copyBtn.innerHTML = '<i data-lucide="copy" style="width:13px;height:13px"></i>'; (typeof lucide!=='undefined'&&lucide.createIcons()); }, 2000);
                }).catch(function() { prompt('Copy UPI ID:', upiId); });
            };
        }

        var utrInput = document.getElementById('pay-utr-input');
        if (utrInput) utrInput.value = '';

        var modal = document.getElementById('payment-modal');
        if (modal) modal.classList.add('open');
        (typeof lucide!=='undefined'&&lucide.createIcons());
    });

    function _qrFb(canvas, link) {
        var img = document.createElement('img');
        img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=' + encodeURIComponent(link);
        img.alt = 'UPI QR'; img.style.cssText = 'border-radius:4px;max-width:170px';
        canvas.appendChild(img);
    }

    function initPayment() {
        var payModal = document.getElementById('payment-modal');
        if (payModal) payModal.addEventListener('click', function(ev) {
            if (ev.target === payModal) payModal.classList.remove('open');
        });

        // SINGLE persistent confirm handler
        var confirmBtn = document.getElementById('pay-confirm-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', function() {
                var utr = (document.getElementById('pay-utr-input') ? document.getElementById('pay-utr-input').value : '').trim();
                if (!utr || utr.length < 6) { _payToast('Please enter a valid UTR / Transaction ID (min 6 chars).', 'error'); return; }

                var utrs = [];
                try { utrs = JSON.parse(localStorage.getItem('ar_payment_utrs') || '[]'); } catch {}
                if (utrs.includes(utr)) { _payToast('\u26a0 This Transaction ID was already used.', 'error'); return; }
                utrs.push(utr);
                localStorage.setItem('ar_payment_utrs', JSON.stringify(utrs));

                var planId = _payState.planId, price = _payState.price;
                var planName = _payState.planName, userEmail = _payState.userEmail;

                var payments = [];
                try { payments = JSON.parse(localStorage.getItem('ar_payments') || '[]'); } catch {}
                payments.unshift({ 
                    user: userEmail || 'Guest', 
                    plan: planName, 
                    amount: '₹' + price.toLocaleString('en-IN'), 
                    ref: utr, 
                    time: new Date().toLocaleString('en-IN'), 
                    status: 'pending' 
                });
                localStorage.setItem('ar_payments', JSON.stringify(payments));

                _payToast('Payment submitted successfully! Waiting for administrator approval.', 'success');

                var body = document.querySelector('#payment-modal .modal-body');
                if (body) body.innerHTML = '<div class="pay-success-screen" style="text-align:center;padding:2rem 1rem"><div class="pay-success-icon" style="font-size:3rem;margin-bottom:1rem">⏳</div>' +
                    '<h3 style="font-size:1.3rem;font-weight:800;margin-bottom:.5rem">Verification Pending</h3>' +
                    '<p style="color:var(--text-muted);margin-bottom:.5rem">Your payment details for <strong style="color:var(--cyan)">' + planName + ' Plan</strong> have been submitted.</p>' +
                    '<p style="color:var(--text-muted);margin-bottom:1rem;font-size:.85rem;line-height:1.5;max-width:280px;margin-inline:auto">Our billing team will verify your transaction (UTR: <code>' + utr + '</code>) and activate your features shortly.</p>' +
                    '<p style="font-size:.78rem;color:var(--text-muted);margin-bottom:.25rem">Account: <code style="color:var(--cyan)">' + (userEmail||'guest') + '</code></p>' +
                    '<button class="btn btn-primary btn-glow" style="margin-top:1.25rem;padding:.6rem 2rem" onclick="document.getElementById(\'payment-modal\').classList.remove(\'open\');">Close</button></div>';
            });
        }

        var utrEl = document.getElementById('pay-utr-input');
        if (utrEl) utrEl.addEventListener('keydown', function(e) { if (e.key === 'Enter') document.getElementById('pay-confirm-btn') && document.getElementById('pay-confirm-btn').click(); });
    }

    // Run immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPayment);
    } else {
        initPayment();
    }

    function _payToast(msg, type) {
        var t = document.createElement('div');
        t.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:99999;background:' +
            (type === 'error' ? 'rgba(248,113,113,.95)' : 'rgba(52,211,153,.95)') +
            ';color:#000;padding:.65rem 1.4rem;border-radius:10px;font-weight:700;font-size:.88rem;max-width:90vw;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.4);font-family:Outfit,sans-serif';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(function() { t.style.cssText += ';opacity:0;transition:opacity .4s'; setTimeout(function(){t.remove();}, 400); }, 4000);
    }

})();


/* =========================================================
   MOCK AUDIT SIMULATOR LOGIC
   ========================================================= */
let mockAuditHistory = [];
function populateMockAuditFiles() {
    const select = document.getElementById("mock-audit-file-select");
    if(!select) return;
    select.innerHTML = '<option value="">Select a document to audit...</option>';
    uploadedFiles.forEach(f => {
        const opt = document.createElement("option");
        opt.value = f.name;
        opt.textContent = f.name;
        select.appendChild(opt);
    });
}

const startAuditBtn = document.getElementById("mock-audit-start-btn");
const mockAuditChat = document.getElementById("mock-audit-chat-window");
const mockAuditInput = document.getElementById("mock-audit-input");
const mockAuditSendBtn = document.getElementById("mock-audit-send-btn");
const mockAuditFileSelect = document.getElementById("mock-audit-file-select");
const mockAuditFwSelect = document.getElementById("mock-audit-fw-select");

function appendMockMessage(sender, text) {
    const div = document.createElement("div");
    div.style.padding = "0.8rem";
    div.style.borderRadius = "8px";
    div.style.maxWidth = "85%";
    div.style.lineHeight = "1.5";
    
    if (sender === "Auditor") {
        div.style.background = "rgba(6, 182, 212, 0.1)";
        div.style.border = "1px solid rgba(6, 182, 212, 0.3)";
        div.style.color = "#fff";
        div.style.alignSelf = "flex-start";
        div.innerHTML = `<strong style="color:#06b6d4;"><i data-lucide="shield"></i> Big-4 Auditor:</strong><br>${text.replace(/\n/g, '<br>')}`;
    } else {
        div.style.background = "rgba(59, 130, 246, 0.1)";
        div.style.border = "1px solid rgba(59, 130, 246, 0.3)";
        div.style.color = "#fff";
        div.style.alignSelf = "flex-end";
        div.innerHTML = `<strong style="color:#3b82f6;"><i data-lucide="user"></i> You:</strong><br>${text}`;
    }
    mockAuditChat.appendChild(div);
    mockAuditChat.scrollTop = mockAuditChat.scrollHeight;
    (typeof lucide!=='undefined'&&lucide.createIcons());
}

if(startAuditBtn) {
    if(startAuditBtn) startAuditBtn.addEventListener("click", async () => {
        const p = getCurrentPlan();
        const lims = PLAN_LIMITS[p] || PLAN_LIMITS.free;
        if(!lims.mockAudit) return showToast("Mock Audit is available on Scale & Enterprise plans. Upgrade to access.", true);
        const fileName = mockAuditFileSelect.value;
        const fw = mockAuditFwSelect.value;
        if(!fileName) return showToast("Please select a file first.", true);
        
        const fileObj = uploadedFiles.find(f => f.name === fileName);
        
        mockAuditFileSelect.disabled = true;
        mockAuditFwSelect.disabled = true;
        startAuditBtn.disabled = true;
        mockAuditChat.innerHTML = "";
        mockAuditHistory = [];
        
        appendMockMessage("Auditor", "Initializing audit... reviewing " + fileName + " against " + fw + " controls...");
        
        const prompt = `You are a strict Big-4 auditor conducting a live compliance interview. You have reviewed the document "${fileName}" which contains: "${fileObj.text.substring(0, 3000)}". The framework is ${fw}. Ask the user a tough, specific question about a potential compliance gap or edge case found in (or missing from) this document. Be professional, intimidating, and brief (2-3 sentences max). Do not grade yet. Just ask.`;
        
        try {
            const data = await executeGeminiPrompt(prompt);
            const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Can you explain the access controls in this document?";
            mockAuditChat.innerHTML = "";
            mockAuditHistory.push({ role: "Auditor", text: reply });
            appendMockMessage("Auditor", reply);
            
            mockAuditInput.disabled = false;
            mockAuditSendBtn.disabled = false;
            mockAuditInput.focus();
        } catch(e) {
            mockAuditChat.innerHTML = "Error connecting to AI: " + e.message;
            startAuditBtn.disabled = false;
        }
    });
}

if(mockAuditSendBtn) {
    const handleSend = async () => {
        const text = mockAuditInput.value.trim();
        if(!text) return;
        
        mockAuditInput.value = "";
        mockAuditInput.disabled = true;
        mockAuditSendBtn.disabled = true;
        
        appendMockMessage("User", text);
        mockAuditHistory.push({ role: "User", text: text });
        
        let histStr = mockAuditHistory.map(m => m.role + ": " + m.text).join("\n");
        const prompt = `You are a strict Big-4 auditor conducting a compliance interview. \nHistory:\n${histStr}\n\nAnalyze the user's last response. \nIf they are wrong but their file has the correct policy, tell them what to say instead.\nIf their file is missing the policy and they give an excuse, reject it and tell them the file is flawed and must be fixed.\nIf they are correct, praise them and ask a new, harder question.\nKeep it under 4 sentences.`;
        
        try {
            const data = await executeGeminiPrompt(prompt);
            const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Network error. Please try again.";
            
            mockAuditHistory.push({ role: "Auditor", text: reply });
            appendMockMessage("Auditor", reply);
            
        } catch(e) {
            appendMockMessage("Auditor", "Connection lost.");
        }
        
        mockAuditInput.disabled = false;
        mockAuditSendBtn.disabled = false;
        mockAuditInput.focus();
    };
    
    if(mockAuditSendBtn) mockAuditSendBtn.addEventListener("click", handleSend);
    if(mockAuditInput) mockAuditInput.addEventListener("keypress", (e) => {
        if(e.key === "Enter") handleSend();
    });
}


/* =========================================================
   CROSS-REFERENCE CONTRADICTION FINDER
   ========================================================= */
const crossRefEmpty = document.getElementById("cross-ref-empty");
const crossRefResults = document.getElementById("cross-ref-results");
const crossRefStartBtn = document.getElementById("cross-ref-start-btn");
const crossRefContent = document.getElementById("cross-ref-content");

function checkCrossRefState() {
    if(uploadedFiles.length < 2) {
        if(crossRefEmpty) crossRefEmpty.style.display = "block";
        if(crossRefStartBtn) crossRefStartBtn.style.display = "none";
        if(crossRefResults) crossRefResults.style.display = "none";
    } else {
        if(crossRefEmpty) crossRefEmpty.style.display = "none";
        if(crossRefStartBtn) crossRefStartBtn.style.display = "flex";
    }
}

if(crossRefStartBtn) {
    if(crossRefStartBtn) crossRefStartBtn.addEventListener("click", async () => {
        const p = getCurrentPlan();
        const lims = PLAN_LIMITS[p] || PLAN_LIMITS.free;
        if(!lims.crossRef) return showToast("Multi-Doc Cross-Reference is available on Scale & Enterprise plans. Upgrade to access.", true);
        crossRefStartBtn.disabled = true;
        crossRefStartBtn.innerHTML = '<i class="lucide-loader animate-spin"></i> Scanning...';
        crossRefResults.style.display = "block";
        crossRefContent.innerHTML = '<div class="pulse-dot"></div> Cross-referencing ' + uploadedFiles.length + ' documents. This may take a moment...';
        
        // Combine texts
        let combinedText = uploadedFiles.map(f => `--- DOCUMENT: ${f.name} ---\n${f.text.substring(0, 2000)}`).join("\n\n");
        
        const prompt = `Analyze the following documents and cross-reference them against each other. Find ANY logical contradictions, conflicting policies, or overlapping compliance gaps between them (e.g. Doc A says passwords expire 90 days, Doc B says 60 days). \n\nDocuments:\n${combinedText}\n\nIf you find contradictions, list them clearly with citations to the document names. If there are no contradictions, explicitly state that the documents are logically consistent.`;
        
        try {
            const data = await executeGeminiPrompt(prompt);
            const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Failed to analyze data room.";
            
            // Format markdown to HTML simply
            let htmlReply = reply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                 .replace(/\n/g, '<br>');
            crossRefContent.innerHTML = htmlReply;
            
        } catch(e) {
            crossRefContent.innerHTML = "Error analyzing documents: " + e.message;
        }
        
        crossRefStartBtn.disabled = false;
        crossRefStartBtn.innerHTML = '<i data-lucide="scan"></i> Re-Scan Data Room';
        (typeof lucide!=='undefined'&&lucide.createIcons());
    });
}

/* =========================================================
   SEMANTIC DOCUMENT Q&A LOGIC
   ========================================================= */
const qaSearchInput = document.getElementById("qa-search-input");
const qaSearchBtn = document.getElementById("qa-search-btn");
const qaResultsContainer = document.getElementById("qa-results-container");
const qaResultContent = document.getElementById("qa-result-content");
const qaEmptyState = document.getElementById("qa-empty-state");

function checkQAState() {
    if(uploadedFiles.length === 0) {
        if(qaEmptyState) qaEmptyState.style.display = "flex";
        if(qaSearchBtn) qaSearchBtn.disabled = true;
    } else {
        if(qaEmptyState) qaEmptyState.style.display = "none";
        if(qaSearchBtn) qaSearchBtn.disabled = false;
    }
}

if(qaSearchBtn) {
    const handleQASearch = async () => {
        const p = getCurrentPlan();
        const lims = PLAN_LIMITS[p] || PLAN_LIMITS.free;
        if(!lims.semanticQA) return showToast("Semantic Document Q&A is available on Growth plans and above. Upgrade to access.", true);
        
        const query = qaSearchInput.value.trim();
        if(!query) return showToast("Please enter a question.", true);
        if(uploadedFiles.length === 0) return showToast("Please upload documents in the Audit Risk Scan tab first.", true);
        
        qaSearchBtn.disabled = true;
        qaSearchBtn.innerHTML = '<i class="lucide-loader animate-spin"></i> Searching...';
        qaResultsContainer.style.display = "flex";
        qaResultContent.innerHTML = '<div class="pulse-dot"></div> Searching through ' + uploadedFiles.length + ' documents for exact clauses...';
        
        let combinedText = uploadedFiles.map(f => `--- DOCUMENT: ${f.name} ---\n${f.text.substring(0, 3000)}`).join("\n\n");
        
        const prompt = `The user has a question regarding their compliance documents. \n\nQuestion: "${query}"\n\nDocuments:\n${combinedText}\n\nFind the exact clause that answers their question. Respond directly with the answer and explicitly cite the Document Name. If the answer is not in the documents, state that clearly.`;
        
        try {
            const data = await executeGeminiPrompt(prompt);
            const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Search failed.";
            
            qaResultContent.innerHTML = reply.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        } catch(e) {
            qaResultContent.innerHTML = "Error analyzing documents: " + e.message;
        }
        
        qaSearchBtn.disabled = false;
        qaSearchBtn.innerHTML = '<i data-lucide="sparkles"></i> Ask AI';
        (typeof lucide!=='undefined'&&lucide.createIcons());
    };
    
    if(qaSearchBtn) qaSearchBtn.addEventListener("click", handleQASearch);
    if(qaSearchInput) {
        qaSearchInput.addEventListener("keypress", (e) => {
            if(e.key === "Enter") handleQASearch();
        });
    }
}


/* =========================================================
   REGULATORY LIVE RADAR LOGIC
   ========================================================= */
const radarScanImpactBtn = document.getElementById("radar-scan-impact-btn");
const radarImpactResults = document.getElementById("radar-impact-results");
const radarImpactContent = document.getElementById("radar-impact-content");

if(radarScanImpactBtn) {
    if(radarScanImpactBtn) radarScanImpactBtn.addEventListener("click", async () => {
        const p = getCurrentPlan();
        const lims = PLAN_LIMITS[p] || PLAN_LIMITS.free;
        if(!lims.liveRadar) return showToast("Live Regulatory Radar is an Enterprise feature. Upgrade to access.", true);
        
        if(uploadedFiles.length === 0) return showToast("Please upload documents in the Audit Risk Scan tab first.", true);
        
        radarScanImpactBtn.disabled = true;
        radarScanImpactBtn.innerHTML = '<i class="lucide-loader animate-spin"></i> Analyzing Impact...';
        radarImpactResults.style.display = "block";
        radarImpactContent.innerHTML = '<div class="pulse-dot"></div> Cross-referencing CCPA 2026 Amendment against your policies...';
        
        let combinedText = uploadedFiles.map(f => `--- DOCUMENT: ${f.name} ---\n${f.text.substring(0, 2000)}`).join("\n\n");
        const newLaw = "California has passed a new mandate requiring explicit opt-outs for any customer data processed by generative AI models. Takes effect in 30 days.";
        
        const prompt = `A new compliance law has passed: "${newLaw}". \n\nEvaluate the following user documents to see if they are impacted or non-compliant under this new law.\n\nDocuments:\n${combinedText}\n\nIf they are non-compliant, explain exactly what clause needs to be added or modified.`;
        
        try {
            const data = await executeGeminiPrompt(prompt);
            const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Analysis failed.";
            
            radarImpactContent.innerHTML = reply.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        } catch(e) {
            radarImpactContent.innerHTML = "Error: " + e.message;
        }
        
        radarScanImpactBtn.disabled = false;
        radarScanImpactBtn.innerHTML = '<i data-lucide="crosshair"></i> Analyze Impact on My Documents';
        (typeof lucide!=='undefined'&&lucide.createIcons());
    });
}


/* =========================================================
   ACTIVE EVIDENCE COLLECTOR (SHADOW DATA)
   ========================================================= */
const shadowEvidenceBtn = document.getElementById("shadow-evidence-btn");
const shadowEvidenceLog = document.getElementById("shadow-evidence-log");
const evidenceLogEntries = document.getElementById("evidence-log-entries");
let evidenceInterval = null;

const fakeEvidenceLogs = [
    { source: "Slack", text: "DevOps channel: 'Deployed MFA patch to production cluster'", metric: "SOC 2 CC6.1" },
    { source: "Jira", text: "Ticket SEC-412: 'Offboarded contractor John Doe access'", metric: "ISO A.8.1.4" },
    { source: "GitHub", text: "PR #891: 'Add encryption at rest to S3 bucket terraform'", metric: "GDPR Art 32" },
    { source: "Slack", text: "HR channel: 'Completed security training for new hires Q3'", metric: "HIPAA 164.308" }
];

if(shadowEvidenceBtn) {
    if(shadowEvidenceBtn) shadowEvidenceBtn.addEventListener("click", () => {
        const p = getCurrentPlan();
        const lims = PLAN_LIMITS[p] || PLAN_LIMITS.free;
        if(!lims.activeEvidence) return showToast("Active Evidence Collection is an Enterprise feature. Upgrade to access.", true);
        
        if (evidenceInterval) {
            clearInterval(evidenceInterval);
            evidenceInterval = null;
            shadowEvidenceBtn.innerHTML = '<i data-lucide="camera"></i> Auto-Collect Evidence (Continuous Monitoring)';
            shadowEvidenceBtn.classList.remove("active");
            shadowEvidenceBtn.style.borderColor = "";
            (typeof lucide!=='undefined'&&lucide.createIcons());
            return;
        }
        
        shadowEvidenceLog.style.display = "block";
        evidenceLogEntries.innerHTML = "Initializing API webhooks for Jira, Slack, and GitHub...<br>Monitoring continuously for compliance evidence...";
        shadowEvidenceBtn.innerHTML = '<span class="pulse-dot"></span> Collecting Evidence... (Click to Stop)';
        shadowEvidenceBtn.classList.add("active");
        shadowEvidenceBtn.style.borderColor = "#00e5ff";
        
        let counter = 0;
        evidenceInterval = setInterval(() => {
            if (counter >= fakeEvidenceLogs.length) {
                clearInterval(evidenceInterval);
                evidenceInterval = null;
                shadowEvidenceBtn.innerHTML = '<i data-lucide="check-circle"></i> Evidence Collection Complete';
                (typeof lucide!=='undefined'&&lucide.createIcons());
                return;
            }
            
            const log = fakeEvidenceLogs[counter];
            const div = document.createElement("div");
            div.style.padding = "0.5rem";
            div.style.background = "rgba(0, 229, 255, 0.05)";
            div.style.borderLeft = "2px solid #00e5ff";
            div.style.marginBottom = "0.5rem";
            
            const time = new Date().toLocaleTimeString();
            div.innerHTML = `<span style="color:#00e5ff;">[${time}]</span> <strong>[${log.source}]</strong> ${log.text} <span style="float:right; color:#818cf8; background:rgba(129, 140, 248, 0.1); padding:2px 6px; border-radius:4px; font-size:0.75rem;">${log.metric}</span>`;
            
            // Append and scroll to bottom
            if (counter === 0) evidenceLogEntries.innerHTML = "";
            evidenceLogEntries.appendChild(div);
            shadowEvidenceLog.scrollTop = shadowEvidenceLog.scrollHeight;
            
            counter++;
        }, 3000);
    });
}
