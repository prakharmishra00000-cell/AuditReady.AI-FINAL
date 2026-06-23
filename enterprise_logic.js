// enterprise_logic.js

document.addEventListener('DOMContentLoaded', () => {

    // 1. Navigation logic for new sidebar items
    const menuVendor = document.getElementById('sim-menu-vendor');
    const menuDelta = document.getElementById('sim-menu-delta');
    
    if (menuVendor && menuDelta) {
        menuVendor.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof window.showSimStep === 'function') {
                window.showSimStep('vendor');
                renderVendorDiligence();
            }
        
    // 5. Aadhaar e-Sign Approval Pipeline Logic
    const approvalChks = document.querySelectorAll('.approval-chk');
    const enactBtn = document.getElementById('apply-remediation-btn');
    if (approvalChks.length > 0 && enactBtn) {
        approvalChks.forEach(chk => {
            chk.addEventListener('change', () => {
                const allChecked = Array.from(approvalChks).every(c => c.checked);
                if (allChecked) {
                    enactBtn.disabled = false;
                    enactBtn.style.opacity = '1';
                } else {
                    enactBtn.disabled = true;
                    enactBtn.style.opacity = '0.5';
                }
            });
        });
    }

}); // End DOMContentLoaded


        menuDelta.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof window.showSimStep === 'function') {
                window.showSimStep('delta');
                renderGlobalDelta();
            }
        });
    }

    // 2. Render Vendor Diligence UI
    function renderVendorDiligence() {
        const container = document.getElementById('vendor-diligence-content');
        if (!container) return;

        container.innerHTML = \`
            <div style="display:flex; gap: 2rem; margin-top: 2rem;">
                <div style="flex:1;">
                    <h4 class="panel-heading"><i data-lucide="cloud" class="text-cyan"></i> Monitored Vendors & Integrations</h4>
                    <div style="display:flex; flex-direction:column; gap:1rem;">
                        <!-- AWS Card -->
                        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:1rem; display:flex; justify-content:space-between; align-items:center;">
                            <div style="display:flex; align-items:center; gap:1rem;">
                                <div style="background:#ff9900; color:#121212; width:40px; height:40px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:bold;">AWS</div>
                                <div>
                                    <h5 style="margin:0; font-size:1rem;">Amazon Web Services</h5>
                                    <span style="font-size:0.8rem; color:var(--text-muted);">SOC 2 Type II Verified &middot; Zero Data Retention SLA Active</span>
                                </div>
                            </div>
                            <div><span style="background:rgba(16,185,129,0.1); color:#10b981; border:1px solid rgba(16,185,129,0.2); padding:4px 8px; border-radius:12px; font-size:0.8rem;">Low Risk</span></div>
                        </div>

                        <!-- HuggingFace Card (Shadow AI) -->
                        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(239,68,68,0.3); border-radius:8px; padding:1rem; display:flex; justify-content:space-between; align-items:center;">
                            <div style="display:flex; align-items:center; gap:1rem;">
                                <div style="background:#ef4444; color:#fff; width:40px; height:40px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:bold;">HF</div>
                                <div>
                                    <h5 style="margin:0; font-size:1rem;">HuggingFace (Shadow AI)</h5>
                                    <span style="font-size:0.8rem; color:#ef4444;">Unsanctioned API Calls Detected in GitHub Repo (repo-core-backend)</span>
                                </div>
                            </div>
                            <div><span style="background:rgba(239,68,68,0.1); color:#ef4444; border:1px solid rgba(239,68,68,0.2); padding:4px 8px; border-radius:12px; font-size:0.8rem;">Critical Risk</span></div>
                        </div>

                        <!-- MongoDB Card -->
                        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:1rem; display:flex; justify-content:space-between; align-items:center;">
                            <div style="display:flex; align-items:center; gap:1rem;">
                                <div style="background:#10b981; color:#fff; width:40px; height:40px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:bold;">MDB</div>
                                <div>
                                    <h5 style="margin:0; font-size:1rem;">MongoDB Atlas</h5>
                                    <span style="font-size:0.8rem; color:var(--text-muted);">DPDP India Data Localization Verified</span>
                                </div>
                            </div>
                            <div><span style="background:rgba(16,185,129,0.1); color:#10b981; border:1px solid rgba(16,185,129,0.2); padding:4px 8px; border-radius:12px; font-size:0.8rem;">Low Risk</span></div>
                        </div>
                    </div>
                </div>

                <div style="flex:1;">
                    <h4 class="panel-heading"><i data-lucide="shield-alert" class="text-cyan"></i> Supply Chain Vulnerabilities</h4>
                    <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.05); padding:1.5rem; border-radius:8px; height:100%;">
                        <p style="font-size:0.9rem; margin-top:0;"><strong>Action Required: Shadow AI Mitigation</strong></p>
                        <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.5;">AuditReady.AI telemetry detected 4,200 outbound API requests to an unverified HuggingFace model in the last 72 hours. This violates ISO 42001 (AI Management System) controls and DPDP Cross-Border Data Transfer rules.</p>
                        <button class="btn btn-pay btn-sm" style="margin-top:1rem; width:100%;" id="btn-quarantine-vendor">Quarantine Vendor Endpoint (Firewall Block)</button>
                    </div>
                </div>
            </div>
        \`;

        // Re-init lucide icons for newly injected HTML
        if (window.lucide) {
            window.lucide.createIcons();
        }

        const btnQuarantine = document.getElementById('btn-quarantine-vendor');
        if (btnQuarantine) {
            btnQuarantine.addEventListener('click', function() {
                this.innerHTML = 'Quarantining...';
                this.style.opacity = '0.7';
                setTimeout(() => {
                    this.innerHTML = 'Endpoint Quarantined';
                    this.style.background = '#10b981';
                    appendSiemLog('[SEC] Network Firewall rule updated: Blocked outbound traffic to api.huggingface.co');
                }, 1500);
            });
        }
    }

    // 3. Render Global Delta UI
    function renderGlobalDelta() {
        const container = document.getElementById('global-delta-content');
        if (!container) return;

        container.innerHTML = \`
            <div style="display:flex; gap: 2rem; margin-top: 2rem;">
                <!-- Setup -->
                <div style="flex:1;">
                    <h4 class="panel-heading"><i data-lucide="map" class="text-cyan"></i> Configure Delta Engine</h4>
                    <div style="display:flex; flex-direction:column; gap:1.5rem;">
                        <div>
                            <label style="display:block; font-size:0.85rem; color:var(--text-muted); margin-bottom:0.5rem;">Sovereign Base Posture</label>
                            <select class="support-input" style="width:100%;">
                                <option>India - DPDP Act 2023 & RBI Cyber Guidelines (100% Compliant)</option>
                                <option>US - NIST CSF v2.0</option>
                            </select>
                        </div>
                        <div>
                            <label style="display:block; font-size:0.85rem; color:var(--text-muted); margin-bottom:0.5rem;">Target Foreign Jurisdiction</label>
                            <select class="support-input" style="width:100%;" id="target-jurisdiction">
                                <option value="eu-gdpr">European Union - GDPR</option>
                                <option value="eu-ai">European Union - AI Act</option>
                                <option value="us-ccpa">United States - California CCPA</option>
                            </select>
                        </div>
                        <button class="btn btn-primary btn-glow" style="width:100%;" id="btn-calculate-delta">Calculate Regulatory Delta Roadmap</button>
                    </div>
                </div>

                <!-- Results -->
                <div style="flex:1;" id="delta-results-container">
                    <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.05); padding:1.5rem; border-radius:8px; height:100%; display:flex; align-items:center; justify-content:center; flex-direction:column;">
                        <i data-lucide="globe" style="width:48px; height:48px; color:rgba(255,255,255,0.1); margin-bottom:1rem;"></i>
                        <p style="color:var(--text-muted); font-size:0.9rem; text-align:center;">Select jurisdictions and calculate to view the gap analysis.</p>
                    </div>
                </div>
            </div>
        \`;

        if (window.lucide) {
            window.lucide.createIcons();
        }

        const btnCalc = document.getElementById('btn-calculate-delta');
        if (btnCalc) {
            btnCalc.addEventListener('click', function() {
                this.innerHTML = 'Analyzing Legal Frameworks...';
                this.disabled = true;
                
                appendSiemLog('[COMPLIANCE] Initiating Cross-Border Delta Analysis: DPDP (IN) -> GDPR (EU)');

                setTimeout(() => {
                    this.innerHTML = 'Calculate Regulatory Delta Roadmap';
                    this.disabled = false;
                    
                    const resContainer = document.getElementById('delta-results-container');
                    resContainer.innerHTML = \`
                        <h4 class="panel-heading"><i data-lucide="pie-chart" class="text-cyan"></i> Gap Analysis: India DPDP -> EU GDPR</h4>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                            <div style="text-align:center;">
                                <div style="font-size:2rem; font-weight:bold; color:#10b981;">82%</div>
                                <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Overlap</div>
                            </div>
                            <div style="text-align:center;">
                                <div style="font-size:2rem; font-weight:bold; color:#ef4444;">18%</div>
                                <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Delta Gap</div>
                            </div>
                            <div style="text-align:center;">
                                <div style="font-size:2rem; font-weight:bold; color:#f59e0b;">3</div>
                                <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Policies to Update</div>
                            </div>
                        </div>

                        <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:0.8rem;">
                            <li style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); padding:0.8rem; border-radius:6px; font-size:0.85rem;">
                                <strong>Article 17 (Right to Erasure)</strong><br>
                                <span style="color:var(--text-muted);">DPDP mandates erasure upon consent withdrawal, but GDPR requires explicit "Right to be Forgotten" workflows for 3rd-party vendors.</span>
                            </li>
                            <li style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); padding:0.8rem; border-radius:6px; font-size:0.85rem;">
                                <strong>Article 27 (EU Representative)</strong><br>
                                <span style="color:var(--text-muted);">As an Indian entity processing EU citizen data, you must formally appoint a representative inside the EU.</span>
                            </li>
                            <li style="background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.2); padding:0.8rem; border-radius:6px; font-size:0.85rem;">
                                <strong>Article 33 (Breach Notification)</strong><br>
                                <span style="color:var(--text-muted);">Update CERT-In 6-hour SLA policy to also trigger GDPR 72-hour Supervisory Authority notification.</span>
                            </li>
                        </ul>
                        <button class="btn btn-secondary btn-sm" style="margin-top:1rem; width:100%; border-color:#cyan; color:#cyan;">Generate Delta Remediation Plan</button>
                    \`;
                }, 2000);
            });
        }
    }

    // 4. SIEM Log Appender Logic
    window.appendSiemLog = function(msg) {
        const logContainer = document.getElementById('siem-ticker-log');
        if (logContainer) {
            const time = new Date().toISOString().substring(11, 19); // HH:MM:SS
            const el = document.createElement('div');
            el.innerHTML = \`<span style="color:var(--text-muted);">[\${time}]</span> \${msg}\`;
            // Add signature hash for "immutable" feel
            const hash = Math.random().toString(36).substring(2, 10).toUpperCase();
            const elHash = document.createElement('span');
            elHash.style.color = 'rgba(255,255,255,0.1)';
            elHash.style.float = 'right';
            elHash.style.fontSize = '0.65rem';
            elHash.textContent = \`sig_\${hash}\`;
            el.appendChild(elHash);
            
            logContainer.appendChild(el);
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    };

    // Auto-tick some background SIEM events
    setInterval(() => {
        const bgEvents = [
            '<span style="color:#10b981;">[NET]</span> Ingress traffic scanned via VPC boundary (Clean)',
            '<span style="color:#f59e0b;">[IAM]</span> Temporary role assumed by Data Processor node',
            '<span style="color:#3b82f6;">[SYS]</span> Storage volume snapshot completed (Encrypted AES-256)',
            '<span style="color:#10b981;">[AUTH]</span> Token refresh validated for Workday HRIS Connector'
        ];
        if(document.getElementById('siem-ticker-log')) {
            // Only tick if randomly selected
            if (Math.random() > 0.7) {
                const ev = bgEvents[Math.floor(Math.random() * bgEvents.length)];
                window.appendSiemLog(ev);
            }
        }
    }, 4000);

});
