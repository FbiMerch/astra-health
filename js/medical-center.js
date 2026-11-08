/**
 * ASTRA Health - Medical Operations Center & Crew Health Management Module
 */
class MedicalOperationsCenter {
    constructor() {
        if (!this.checkAccess()) return;
        this.storageKeyNotes = "astra_medical_officer_notes";
        this.init();
    }

    checkAccess() {
        const currentUser = window.authService?.getCurrentUser();
        // Permite accesul dacă utilizatorul este MEDICAL_OFFICER sau ADMINISTRATOR
        if (!currentUser || (currentUser.role !== "MEDICAL_OFFICER" && currentUser.role !== "ADMINISTRATOR")) {
            alert("ACCES RESTRICȚIONAT: Acest modul este destinat exclusiv personalului medical autorizat și administratorilor.");
            window.location.href = "index.html";
            return false;
        }
        return true;
    }
    init() {
        document.getElementById("rosterSearch")?.addEventListener("input", () => this.renderRoster());
        document.getElementById("rosterFilterStatus")?.addEventListener("change", () => this.renderRoster());

        this.renderAll();
    }

    getCrewMembers() {
        // Returnează lista completă de astronauți din demo-data sau stocare
        return DEMO_DATA.astronauts || [
            { id: "ast-01", name: "Cmdr. Elena Vance", role: "Commander", mission: "ARTEMIS-IV" },
            { id: "ast-02", name: "Dr. Marcus Thorne", role: "Medical Specialist", mission: "ARTEMIS-IV" },
            { id: "ast-03", name: "Eng. Sarah Jenkins", role: "Flight Engineer", mission: "ARTEMIS-IV" }
        ];
    }

    evaluateAstronautStatus(astId) {
        // Reguli de Clasificare Medicală: RED, YELLOW, GREEN, GRAY
        const alerts = JSON.parse(localStorage.getItem(`astra_smart_alerts_${astId}`)) || [];
        const activeAlerts = alerts.filter(a => a.status !== "RESOLVED");

        const hasCritical = activeAlerts.some(a => a.severity === "CRITICAL" || a.severity === "HIGH");
        const hasMedium = activeAlerts.some(a => a.severity === "MEDIUM" || a.severity === "LOW");

        const vitals = DEMO_DATA.vitals?.[astId];
        if (!vitals) {
            return { status: "GRAY", label: "Insufficient Data", badgeClass: "badge-gray", activeAlerts };
        }

        if (hasCritical || vitals.boneDensity?.status === "critical") {
            return { status: "RED", label: "Urgent Attention", badgeClass: "badge-red", activeAlerts };
        }

        if (hasMedium || vitals.heartRate?.status === "warning" || vitals.bloodPressure?.status === "warning") {
            return { status: "YELLOW", label: "Monitoring Required", badgeClass: "badge-yellow", activeAlerts };
        }

        return { status: "GREEN", label: "Stable / Nominal", badgeClass: "badge-green", activeAlerts };
    }

    renderAll() {
        this.renderStats();
        this.renderRoster();
        this.renderAlertsFeed();
        this.renderAnalyticsCharts();
    }

    renderStats() {
        const crew = this.getCrewMembers();
        let green = 0, yellow = 0, red = 0, gray = 0;
        let totalUnack = 0;

        crew.forEach(ast => {
            const evalRes = this.evaluateAstronautStatus(ast.id);
            if (evalRes.status === "GREEN") green++;
            else if (evalRes.status === "YELLOW") yellow++;
            else if (evalRes.status === "RED") red++;
            else gray++;

            totalUnack += evalRes.activeAlerts.filter(a => a.status === "NEW").length;
        });

        document.getElementById("statTotalCrew").textContent = crew.length;
        document.getElementById("statGreen").textContent = green;
        document.getElementById("statYellow").textContent = yellow;
        document.getElementById("statRed").textContent = red;
        document.getElementById("statGray").textContent = gray;
        document.getElementById("statUnack").textContent = totalUnack;
    }

    renderRoster() {
        const tbody = document.getElementById("rosterTableBody");
        const search = document.getElementById("rosterSearch")?.value.toLowerCase() || "";
        const filterStatus = document.getElementById("rosterFilterStatus")?.value || "ALL";
        if (!tbody) return;

        let crew = this.getCrewMembers().map(ast => {
            const evalRes = this.evaluateAstronautStatus(ast.id);
            return { ...ast, classification: evalRes };
        });

        // Sortează implicit: RED primul
        crew.sort((a, b) => {
            const priority = { "RED": 1, "YELLOW": 2, "GREEN": 3, "GRAY": 4 };
            return priority[a.classification.status] - priority[b.classification.status];
        });

        // Filtrare
        if (search) {
            crew = crew.filter(c => c.name.toLowerCase().includes(search) || c.id.toLowerCase().includes(search));
        }
        if (filterStatus !== "ALL") {
            crew = crew.filter(c => c.classification.status === filterStatus);
        }

        tbody.innerHTML = "";
        if (crew.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Niciun membru al echipajului găsit.</td></tr>`;
            return;
        }

        crew.forEach(ast => {
            const vitals = DEMO_DATA.vitals?.[ast.id] || {};
            const tr = document.createElement("tr");
            tr.className = "roster-row";
            tr.innerHTML = `
                <td><span class="classification-badge ${ast.classification.badgeClass}">${ast.classification.status}</span></td>
                <td><strong>${escapeHtml(ast.name)}</strong><div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(ast.id)} | ${escapeHtml(ast.role)}</div></td>
                <td>${vitals.heartRate?.value || 'N/A'} bpm / ${vitals.spo2?.value || 'N/A'}%</td>
                <td>${vitals.bloodPressure?.value || 'N/A'}</td>
                <td>7.8h (Good)</td>
                <td><span style="color: ${ast.classification.activeAlerts.length > 0 ? 'var(--accent-orange)' : 'var(--text-muted)'}; font-weight: bold;">${ast.classification.activeAlerts.length} active</span></td>
                <td>Acum 12 min</td>
            `;
            tr.addEventListener("click", () => this.openMedicalProfile(ast));
            tbody.appendChild(tr);
        });
    }

    renderAlertsFeed() {
        const container = document.getElementById("medicalAlertsFeed");
        if (!container) return;

        let allAlerts = [];
        const crew = this.getCrewMembers();
        crew.forEach(ast => {
            const alerts = JSON.parse(localStorage.getItem(`astra_smart_alerts_${ast.id}`)) || [];
            alerts.forEach(alt => {
                allAlerts.push({ ...alt, astronautName: ast.name, astronautId: ast.id });
            });
        });

        container.innerHTML = "";
        if (allAlerts.length === 0) {
            container.innerHTML = `<div style="font-size: 0.85rem; color: var(--text-muted);">Nicio alertă medicală înregistrată.</div>`;
            return;
        }

        allAlerts.forEach(alt => {
            const div = document.createElement("div");
            div.className = "alert-feed-item";
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between;">
                    <strong style="color: var(--accent-red);">${escapeHtml(alt.severity)} – ${escapeHtml(alt.title)}</strong>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(alt.timestamp)}</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-main);">Astronaut: <strong>${escapeHtml(alt.astronautName)}</strong> (${escapeHtml(alt.astronautId)})</div>
                <p style="color: var(--text-muted);">${escapeHtml(alt.description)}</p>
                <div style="display: flex; gap: 10px; margin-top: 5px;">
                    <button class="btn-action ack-alert-btn" type="button" style="padding: 4px 10px; font-size: 0.75rem; background: var(--accent-yellow); color: var(--bg-primary);">Ack</button>
                    <button class="btn-action resolve-alert-btn" type="button" style="padding: 4px 10px; font-size: 0.75rem; background: var(--accent-green); color: var(--bg-primary);">Rezolvat</button>
                </div>
            `;
            div.querySelector(".ack-alert-btn").addEventListener("click", () => this.acknowledgeAlert(alt.id, alt.astronautId));
            div.querySelector(".resolve-alert-btn").addEventListener("click", () => this.resolveAlert(alt.id, alt.astronautId));
            container.appendChild(div);
        });
    }

    acknowledgeAlert(alertId, astId) {
        const key = `astra_smart_alerts_${astId}`;
        let alerts = JSON.parse(localStorage.getItem(key)) || [];
        const alt = alerts.find(a => a.id === alertId);
        if (alt) {
            alt.status = "ACKNOWLEDGED";
            localStorage.setItem(key, JSON.stringify(alerts));
            this.renderAll();
        }
    }

    resolveAlert(alertId, astId) {
        const key = `astra_smart_alerts_${astId}`;
        let alerts = JSON.parse(localStorage.getItem(key)) || [];
        const alt = alerts.find(a => a.id === alertId);
        if (alt) {
            alt.status = "RESOLVED";
            alt.resolvedAt = new Date().toISOString().replace('T', ' ').substring(0, 19) + " UTC";
            localStorage.setItem(key, JSON.stringify(alerts));
            this.renderAll();
        }
    }

    openMedicalProfile(ast) {
        const modal = document.getElementById("medicalProfileModal");
        const container = document.getElementById("modalContainer");
        const vitals = DEMO_DATA.vitals?.[ast.id] || {};
        const evalRes = this.evaluateAstronautStatus(ast.id);
        const notesKey = `${this.storageKeyNotes}_${ast.id}`;
        const notes = JSON.parse(localStorage.getItem(notesKey)) || [];

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 15px;">
                <div>
                    <h2 style="color: var(--accent-cyan); font-size: 1.3rem;">${ast.name} (${ast.id})</h2>
                    <span style="font-size: 0.85rem; color: var(--text-muted);">Misiune: ${ast.mission} | Rol: ${ast.role}</span>
                </div>
                <button class="btn-action" style="background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); padding: 5px 12px;" onclick="document.getElementById('medicalProfileModal').style.display='none'">✕ Închide</button>
            </div>

            <div style="display: flex; gap: 10px; align-items: center;">
                <strong>Status Medical Curent:</strong>
                <span class="classification-badge ${evalRes.badgeClass}">${evalRes.status} – ${evalRes.label}</span>
            </div>

            <div class="panel-box" style="margin: 0;">
                <div class="panel-title">Semne Vitale & Telemetrie Curentă</div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 0.85rem;">
                    <div style="background: var(--bg-card); padding: 10px; border-radius: 6px;">Puls: <strong>${vitals.heartRate?.value || 'N/A'} bpm</strong></div>
                    <div style="background: var(--bg-card); padding: 10px; border-radius: 6px;">SpO2: <strong>${vitals.spo2?.value || 'N/A'}%</strong></div>
                    <div style="background: var(--bg-card); padding: 10px; border-radius: 6px;">Tensiune: <strong>${vitals.bloodPressure?.value || 'N/A'}</strong></div>
                    <div style="background: var(--bg-card); padding: 10px; border-radius: 6px;">Temperatură: <strong>${vitals.temperature?.value || 'N/A'} °C</strong></div>
                    <div style="background: var(--bg-card); padding: 10px; border-radius: 6px;">Densitate Os.: <strong>${vitals.boneDensity?.value || 'N/A'}%</strong></div>
                    <div style="background: var(--bg-card); padding: 10px; border-radius: 6px;">Ritm Resp.: <strong>${vitals.respiratoryRate?.value || 'N/A'} rpm</strong></div>
                </div>
            </div>

            <div class="panel-box" style="margin: 0;">
                <div class="panel-title">Note Clinice & Observații Medicale (Medical Notes)</div>
                <div style="display: flex; flex-direction: column; gap: 10px; max-height: 160px; overflow-y: auto;" id="notesListContainer">
                    ${notes.length === 0 ? '<div style="font-size:0.85rem; color:var(--text-muted);">Nicio notă medicală adăugată pentru acest membru.</div>' : notes.map(n => `
                        <div style="background: var(--bg-card); padding: 8px 12px; border-radius: 4px; font-size: 0.85rem; border-left: 3px solid var(--accent-cyan);">
                            <div>${escapeHtml(n.text)}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">Autor: ${escapeHtml(n.author)} | Data: ${escapeHtml(n.timestamp)}</div>
                        </div>
                    `).join('')}
                </div>
                <div style="display: flex; gap: 10px; margin-top: 5px;">
                    <input type="text" id="newMedicalNoteInput" placeholder="Adaugă observație clinică sau recomandare..." style="flex-grow: 1; background: var(--bg-primary); border: 1px solid var(--border-color); color: var(--text-main); padding: 8px; border-radius: 4px; font-size: 0.85rem;">
                    <button class="btn-action" style="padding: 8px 15px; font-size: 0.85rem;" onclick="window.medicalCenter.addMedicalNote('${ast.id}')">Adaugă Notă</button>
                </div>
            </div>
        `;

        modal.style.display = "flex";
    }

    addMedicalNote(astId) {
        const input = document.getElementById("newMedicalNoteInput");
        if (!input || !input.value.trim()) return;

        const currentUser = window.authService?.getCurrentUser();
        const noteText = input.value.trim();
        const notesKey = `${this.storageKeyNotes}_${astId}`;
        const notes = JSON.parse(localStorage.getItem(notesKey)) || [];

        notes.unshift({
            id: "note-" + Date.now(),
            text: noteText,
            author: currentUser?.fullName || "Medical Officer",
            authorRole: currentUser?.role || "MEDICAL_OFFICER",
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + " UTC"
        });

        localStorage.setItem(notesKey, JSON.stringify(notes));
        input.value = "";
        this.openMedicalProfile(this.getCrewMembers().find(c => c.id === astId));
    }

    renderAnalyticsCharts() {
        if (typeof Chart === "undefined") {
            ["classificationChart", "alertsAnalyticsChart"].forEach((id) => { const canvas = document.getElementById(id); if (canvas) canvas.parentElement.textContent = "Grafic indisponibil offline."; });
            return;
        }
        // Grafic Distribuție Clasificare
        const ctx1 = document.getElementById("classificationChart")?.getContext("2d");
        if (ctx1) {
            if (window.myClassChart) window.myClassChart.destroy();
            window.myClassChart = new Chart(ctx1, {
                type: "doughnut",
                data: {
                    labels: ["Green (Stable)", "Yellow (Monitor)", "Red (Urgent)", "Gray (No Data)"],
                    datasets: [{
                        data: [1, 1, 1, 0],
                        backgroundColor: ["#10b981", "#f59e0b", "#ef4444", "#8892b0"]
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#e2e8f0', font: { size: 10 } } } } }
            });
        }

        // Grafic Alerte
        const ctx2 = document.getElementById("alertsAnalyticsChart")?.getContext("2d");
        if (ctx2) {
            if (window.myAlertsChart) window.myAlertsChart.destroy();
            window.myAlertsChart = new Chart(ctx2, {
                type: "bar",
                data: {
                    labels: ["Critical", "High", "Medium", "Low", "Info"],
                    datasets: [{
                        label: "Alerte Misiune",
                        data: [1, 2, 1, 0, 1],
                        backgroundColor: "#00f0ff"
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: "#8892b0" }, grid: { color: "#233554" } }, y: { ticks: { color: "#8892b0" }, grid: { color: "#233554" } } }, plugins: { legend: { display: false } } }
            });
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.medicalCenter = new MedicalOperationsCenter();
});
