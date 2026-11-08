class SmartAlertsManager {
    constructor() {
        this.currentAstronautId = "ast-01";
        this.storageKeyAlerts = "astra_smart_alerts";
        this.init();
    }

    async init() {
        const astronauts = DEMO_DATA.astronauts;
        const select = document.getElementById("astronautSelect");
        if (select) {
            select.innerHTML = "";
            astronauts.forEach(ast => {
                const opt = document.createElement("option");
                opt.value = ast.id;
                opt.textContent = `${ast.name} (${ast.role})`;
                if (ast.id === this.currentAstronautId) opt.selected = true;
                select.appendChild(opt);
            });

            select.addEventListener("change", (e) => {
                this.currentAstronautId = e.target.value;
                this.renderAll();
            });
        }

        document.getElementById("filterSeverity")?.addEventListener("change", () => this.renderActiveAlerts());
        document.getElementById("filterSource")?.addEventListener("change", () => this.renderActiveAlerts());
        document.getElementById("runEvaluationBtn")?.addEventListener("click", () => {
            const count = this.evaluateRules();
            alert(`${count} indicatori demonstrativi au depășit regulile configurate. Lipsa alertelor nu confirmă o stare nominală.`);
        });

        this.initDefaultAlertsIfNeeded();
        this.renderAll();
    }

    getAlerts() {
        try {
            const data = localStorage.getItem(`${this.storageKeyAlerts}_${this.currentAstronautId}`);
            if (!data) return [];
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    saveAlerts(alerts) {
        localStorage.setItem(`${this.storageKeyAlerts}_${this.currentAstronautId}`, JSON.stringify(alerts));
    }

    initDefaultAlertsIfNeeded() {
        let alerts = this.getAlerts();
        if (alerts.length === 0) {
            alerts = [
                {
                    id: "alt-01",
                    title: "Repeated Insufficient Sleep Duration",
                    severity: "MEDIUM",
                    category: "Sleep & Recovery",
                    description: "DEMO DATA: exemplu static de durată redusă a somnului; nu provine dintr-o măsurare conectată.",
                    triggerParam: "Sleep Duration",
                    observedVal: "5.4 hours",
                    baselineVal: "7.5 hours",
                    timestamp: "2026-11-07 07:30:00 UTC",
                    sourceModule: "Sleep",
                    recommendedSteps: "Programați o sesiune de odihnă suplimentară.",
                    status: "NEW",
                    escalationHistory: ["Creat inițial ca LOW, escaladat la MEDIUM."]
                },
                {
                    id: "alt-02",
                    title: "Elevated CO2 in Habitat Sector B",
                    severity: "HIGH",
                    category: "Environment",
                    description: "DEMO DATA: alertă demonstrativă de CO₂; nu provine dintr-un senzor conectat.",
                    triggerParam: "CO2 Levels",
                    observedVal: "4800 ppm",
                    baselineVal: "< 4000 ppm",
                    timestamp: "2026-11-07 10:10:00 UTC",
                    sourceModule: "Environment",
                    recommendedSteps: "Verificați sistemul de filtrare a aerului.",
                    status: "ACKNOWLEDGED",
                    escalationHistory: ["Generat direct la severitate HIGH."]
                }
            ];
            this.saveAlerts(alerts);
        }
    }

    evaluateRules() {
        let alerts = this.getAlerts();
        const priorRules = new Map(alerts.filter((alert) => alert.ruleGenerated).map((alert) => [alert.ruleKey, alert]));
        alerts = alerts.filter((alert) => !alert.ruleGenerated);
        const vitals = DEMO_DATA.vitals?.[this.currentAstronautId] || null;
        const now = new Date().toISOString();
        let generated = 0;
        if (vitals) {
            Object.entries(vitals).forEach(([key, metric]) => {
                if (!["warning", "critical"].includes(metric.status)) return;
                const old = priorRules.get(`vital-${key}`);
                alerts.unshift({
                    id: old?.id || `rule-${this.currentAstronautId}-${key}`,
                    ruleKey: `vital-${key}`, ruleGenerated: true,
                    title: `Indicator demo: ${key}`,
                    severity: metric.status === "critical" ? "CRITICAL" : "MEDIUM",
                    category: "Telemetry",
                    description: `DEMO DATA: statusul simulat al câmpului ${key} este ${metric.status}. Aceasta nu este o clasificare clinică.`,
                    triggerParam: key, observedVal: `${metric.value} ${metric.unit}`, baselineVal: "Status demo nominal",
                    timestamp: now, sourceModule: "Telemetry",
                    recommendedSteps: "Verifică proveniența măsurătorii și urmează protocolul oficial al misiunii.",
                    status: old?.status || "NEW", escalationHistory: ["Evaluare demonstrativă a flag-ului static."],
                    sourceType: "DEMO DATA"
                });
                generated++;
            });
        }
        const assessments = typeof assessmentStorage !== "undefined" ? assessmentStorage.getAssessments(this.currentAstronautId) : [];
        const latest = assessments[0];
        const symptomList = Array.isArray(latest?.symptoms?.list) ? latest.symptoms.list : [];
        const severeSymptoms = symptomList.filter((symptom) => ["Chest discomfort", "Shortness of breath"].includes(symptom));
        if (severeSymptoms.length || latest?.symptoms?.severity === "Severe") {
            const key = "self-report-severe"; const old = priorRules.get(key);
            alerts.unshift({ id: old?.id || `rule-${this.currentAstronautId}-${key}`, ruleKey: key, ruleGenerated: true,
                title: "Raport de simptom cu prioritate de revizuire", severity: "CRITICAL", category: "Medical Assessment",
                description: `MANUAL DATA: autoevaluarea raportează ${severeSymptoms.join(", ") || "severitate declarată severă"}. Nu este diagnostic automat.`,
                triggerParam: "Autoevaluare simptome", observedVal: latest.symptoms.severity || severeSymptoms.join(", "), baselineVal: "Necesită revizuire conform protocolului",
                timestamp: now, sourceModule: "Medical Assessment", recommendedSteps: "Contactează echipa medicală și urmează procedura oficială de urgență.",
                status: old?.status || "NEW", escalationHistory: ["Generat din auto-raport, necesită evaluare umană."], sourceType: "MANUAL DATA" });
            generated++;
        }
        try {
            const environmentLogs = JSON.parse(localStorage.getItem(`astra_env_manual_logs_${this.currentAstronautId}`) || "[]");
            const current = Array.isArray(environmentLogs) ? environmentLogs[0] : null;
            if (current) {
                const checks = [
                    ["environment-o2", Number(current.o2) < 19.5, "Oxigen habitat (O₂)", `${current.o2}%`, "19.5%", "Valoarea manuală este sub pragul demonstrativ de 19.5% O₂."],
                    ["environment-co2", Number(current.co2) > 1.0, "CO₂ habitat", `${current.co2}%`, "1.0%", "Valoarea manuală depășește pragul demonstrativ de 1.0% CO₂."],
                    ["environment-radiation", Number(current.radiation) > 0.5, "Rată doză radiație", `${current.radiation} µSv/h`, "0.5 µSv/h", "Valoarea manuală depășește pragul demonstrativ de 0.5 µSv/h."]
                ];
                checks.forEach(([key, triggered, title, observed, baseline, explanation]) => {
                    if (!triggered) return;
                    const old = priorRules.get(key);
                    alerts.unshift({
                        id: old?.id || `rule-${this.currentAstronautId}-${key}`, ruleKey: key, ruleGenerated: true,
                        title: `Revizuire necesară: ${title}`, severity: "MEDIUM", category: "Environment",
                        description: `MANUAL DATA: ${explanation} Pragul este doar pentru demonstrația UI, nu operațional.`,
                        triggerParam: title, observedVal: observed, baselineVal: baseline,
                        timestamp: current.timestamp || now, sourceModule: "Environment",
                        recommendedSteps: "Verifică măsurătoarea și urmează procedura oficială a misiunii; nu interpreta această alertă ca diagnostic sau control al habitatului.",
                        status: old?.status || "NEW", escalationHistory: ["Declanșată de o comparație demonstrativă."], sourceType: "MANUAL DATA"
                    });
                    generated++;
                });
            }
        } catch (error) { console.warn("[ASTRA Alerts] Environment log unavailable", error); }
        this.saveAlerts(alerts);
        this.renderAll();
        return generated;
    }

    acknowledgeAlert(alertId) {
        let alerts = this.getAlerts();
        const alt = alerts.find(a => a.id === alertId);
        if (alt) {
            alt.status = "ACKNOWLEDGED";
            this.saveAlerts(alerts);
            this.renderAll();
        }
    }

    resolveAlert(alertId) {
        let alerts = this.getAlerts();
        const alt = alerts.find(a => a.id === alertId);
        if (alt) {
            alt.status = "RESOLVED";
            alt.resolvedAt = new Date().toISOString().replace('T', ' ').substring(0, 19) + " UTC";
            this.saveAlerts(alerts);
            this.renderAll();
        }
    }

    renderAll() {
        this.renderOverview();
        this.renderActiveAlerts();
        this.renderResolvedAlerts();
    }

    renderOverview() {
        const alerts = this.getAlerts();
        const active = alerts.filter(a => a.status !== "RESOLVED");
        const critical = active.filter(a => a.severity === "CRITICAL").length;
        const high = active.filter(a => a.severity === "HIGH").length;
        const newUnack = active.filter(a => a.status === "NEW").length;
        const resolved = alerts.filter(a => a.status === "RESOLVED").length;

        const grid = document.getElementById("overviewGrid");
        if (!grid) return;

        grid.innerHTML = `
            <div class="metric-card"><div class="metric-title">Active Alerts</div><div class="metric-val" style="color: var(--accent-cyan);">${active.length}</div></div>
            <div class="metric-card"><div class="metric-title">Critical & High</div><div class="metric-val" style="color: var(--accent-red);">${critical + high}</div></div>
            <div class="metric-card"><div class="metric-title">New (Awaiting Ack)</div><div class="metric-val" style="color: var(--accent-yellow);">${newUnack}</div></div>
            <div class="metric-card"><div class="metric-title">Resolved History</div><div class="metric-val" style="color: var(--accent-green);">${resolved}</div></div>
        `;
    }

    renderActiveAlerts() {
        const container = document.getElementById("activeAlertsContainer");
        const filterSev = document.getElementById("filterSeverity")?.value || "ALL";
        const filterSrc = document.getElementById("filterSource")?.value || "ALL";
        if (!container) return;

        let alerts = this.getAlerts().filter(a => a.status !== "RESOLVED");
        if (filterSev !== "ALL") alerts = alerts.filter(a => a.severity === filterSev);
        if (filterSrc !== "ALL") alerts = alerts.filter(a => a.sourceModule === filterSrc);

        container.innerHTML = "";
        if (alerts.length === 0) {
            container.innerHTML = `<div style="font-size: 0.85rem; color: var(--text-muted);">Nicio alertă activă.</div>`;
            return;
        }

        alerts.forEach(alt => {
            const safeSeverity = ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(alt.severity) ? alt.severity.toLowerCase() : "info";
            const sevClass = `severity-${safeSeverity}`;
            const badgeClass = `badge-${safeSeverity}`;
            const card = document.createElement("div");
            card.className = `alert-card ${sevClass}`;
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="badge ${badgeClass}">${escapeHtml(alt.severity)}</span>
                        <strong style="color: var(--text-main); font-size: 0.95rem;">${escapeHtml(alt.title)}</strong>
                    </div>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">Sursă: ${escapeHtml(alt.sourceType || "DEMO DATA")} · ${escapeHtml(alt.sourceModule)} | ${escapeHtml(alt.timestamp)}</span>
                </div>
                <p style="font-size: 0.85rem; color: var(--text-muted);">${escapeHtml(alt.description)}</p>
                <div style="font-size: 0.8rem; background: var(--bg-primary); padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);">
                    <strong>Valoare:</strong> <span style="color: var(--accent-cyan);">${escapeHtml(alt.observedVal)}</span> (Baseline: ${escapeHtml(alt.baselineVal)})<br>
                    <strong>Acțiune:</strong> ${escapeHtml(alt.recommendedSteps)}
                </div>
                <div style="display: flex; gap: 10px; margin-top: 5px;">
                    ${alt.status === 'NEW' ? `<button class="btn-action ack-btn" style="background: var(--accent-yellow); color: var(--bg-primary);">Confirmă (Ack)</button>` : ''}
                    <button class="btn-action res-btn" style="background: var(--accent-green); color: var(--bg-primary);">Rezolvat</button>
                </div>
            `;

            if (alt.status === 'NEW') {
                card.querySelector(".ack-btn").addEventListener("click", () => this.acknowledgeAlert(alt.id));
            }
            card.querySelector(".res-btn").addEventListener("click", () => this.resolveAlert(alt.id));
            container.appendChild(card);
        });
    }

    renderResolvedAlerts() {
        const container = document.getElementById("resolvedAlertsContainer");
        if (!container) return;

        const resolved = this.getAlerts().filter(a => a.status === "RESOLVED");
        container.innerHTML = "";
        if (resolved.length === 0) {
            container.innerHTML = `<div style="font-size: 0.85rem; color: var(--text-muted);">Nicio alertă rezolvată.</div>`;
            return;
        }

        resolved.forEach(alt => {
            const div = document.createElement("div");
            div.className = "alert-card";
            div.style.borderLeft = "4px solid var(--accent-green)";
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong style="color: var(--text-main); font-size: 0.9rem;">${escapeHtml(alt.title)}</strong>
                    <span style="font-size: 0.75rem; color: var(--accent-green);">Rezolvat: ${escapeHtml(alt.resolvedAt)}</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">Sursă: ${escapeHtml(alt.sourceType || "DEMO DATA")} · ${escapeHtml(alt.sourceModule)}</div>
            `;
            container.appendChild(div);
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.smartAlertsManager = new SmartAlertsManager();
});
