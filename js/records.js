class MedicalRecordsManager {
    constructor() {
        this.currentAstronautId = "ast-01";
        this.storageKeySymptoms = "astra_medical_symptoms";
        this.chartInstance1 = null;
        this.chartInstance2 = null;
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

        const symptomForm = document.getElementById("symptomForm");
        if (symptomForm) {
            symptomForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleSymptomSubmit();
            });
        }

        const filterSelect = document.getElementById("measurementFilter");
        if (filterSelect) {
            filterSelect.addEventListener("change", () => {
                this.renderMeasurementsTable();
            });
        }

        // Export buttons
        document.getElementById("exportCsvBtn")?.addEventListener("click", () => this.exportCSV());
        document.getElementById("exportJsonBtn")?.addEventListener("click", () => this.exportJSON());
        document.getElementById("exportPdfBtn")?.addEventListener("click", () => alert("Generare raport PDF în curs... Fiișierul a fost descărcat cu succes (simulare)."));

        this.renderAll();
    }

    getAllMeasurements() {
        // Colectează din ghiduri medicale, mediu și demo
        let unified = [];
        try {
            const guidedHistory = JSON.parse(localStorage.getItem(`astra_guided_procedures_history_${this.currentAstronautId}`)) || [];
            guidedHistory.forEach(item => {
                unified.push({
                    type: item.title.includes("Pressure") ? "Blood Pressure" : (item.title.includes("Heart") ? "Heart Rate" : "Temperature"),
                    value: item.result,
                    unit: item.title.includes("Pressure") ? "mmHg" : (item.title.includes("Heart") ? "BPM" : "°C"),
                    timestamp: item.timestamp,
                    source: item.source || "Guided Procedures"
                });
            });
            const appendStored = (key, mapEntry) => {
                try {
                    const entries = JSON.parse(localStorage.getItem(key) || "[]");
                    if (Array.isArray(entries)) entries.forEach((entry) => unified.push(mapEntry(entry)));
                } catch (error) { console.warn("[ASTRA Records] Skipping invalid local module data", key); }
            };
            appendStored(`astra_env_manual_logs_${this.currentAstronautId}`, (entry) => ({ type: "Habitat O₂", value: entry.o2, unit: "%", timestamp: entry.timestamp, source: "MANUAL DATA · Environment" }));
            appendStored(`astra_env_manual_logs_${this.currentAstronautId}`, (entry) => ({ type: "Habitat CO₂", value: entry.co2, unit: "%", timestamp: entry.timestamp, source: "MANUAL DATA · Environment" }));
            appendStored(`astra_env_manual_logs_${this.currentAstronautId}`, (entry) => ({ type: "Habitat Temperature", value: entry.temp, unit: "°C", timestamp: entry.timestamp, source: "MANUAL DATA · Environment" }));
            appendStored(`astra_env_manual_logs_${this.currentAstronautId}`, (entry) => ({ type: "Radiation dose rate", value: entry.radiation, unit: "µSv/h", timestamp: entry.timestamp, source: "MANUAL DATA · Environment" }));
            appendStored(`astra_sleep_logs_${this.currentAstronautId}`, (entry) => ({ type: "Sleep duration", value: entry.hours, unit: "h", timestamp: entry.date || "Dată indisponibilă", source: "MANUAL LOG · Sleep" }));
            appendStored(`astra_exercise_logs_${this.currentAstronautId}`, (entry) => ({ type: `Exercise · ${entry.type}`, value: entry.duration, unit: "min", timestamp: entry.createdAt || entry.date || "Dată indisponibilă", source: entry.demo ? "DEMO DATA · Exercise" : "MANUAL LOG · Exercise" }));
        } catch (e) {}

        // Adăugăm date demonstrative standard dacă lipsesc
        if (unified.length === 0) {
            unified = [
                { type: "Blood Pressure", value: "120/80", unit: "mmHg", timestamp: "2026-11-07 08:00:00 UTC", source: "DEMO DATA (AstroSkin)" },
                { type: "Heart Rate", value: "72", unit: "BPM", timestamp: "2026-11-07 08:05:00 UTC", source: "DEMO DATA (Biometric)" },
                { type: "Temperature", value: "36.7", unit: "°C", timestamp: "2026-11-07 08:10:00 UTC", source: "DEMO DATA (Ambient)" },
                { type: "SpO2", value: "98", unit: "%", timestamp: "2026-11-07 08:15:00 UTC", source: "DEMO DATA (Pulsoximetru)" }
            ];
        }
        return unified;
    }

    getSymptoms() {
        try {
            const data = localStorage.getItem(`${this.storageKeySymptoms}_${this.currentAstronautId}`);
            if (!data) return [];
            return JSON.parse(data);
        } catch (e) {
            return [];
        }
    }

    handleSymptomSubmit() {
        const entry = {
            id: "sym-" + Date.now(),
            type: document.getElementById("symptomType").value,
            intensity: document.getElementById("symptomIntensity").value,
            duration: document.getElementById("symptomDuration").value,
            desc: document.getElementById("symptomDesc").value,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + " UTC",
            source: "MANUAL REPORT"
        };

        const symptoms = this.getSymptoms();
        symptoms.unshift(entry);
        localStorage.setItem(`${this.storageKeySymptoms}_${this.currentAstronautId}`, JSON.stringify(symptoms));

        document.getElementById("symptomForm").reset();
        this.renderAll();
        alert("Simptomul a fost înregistrat în dosarul medical central!");
    }

    renderAll() {
        this.renderOverview();
        this.renderMeasurementsTable();
        this.renderCharts();
        this.renderTimeline();
    }

    renderOverview() {
        const measurements = this.getAllMeasurements();
        const symptoms = this.getSymptoms();
        const grid = document.getElementById("medicalOverviewGrid");
        if (!grid) return;
        const validTimes = measurements.filter((item) => !String(item.source).includes("DEMO DATA")).map((item) => new Date(item.timestamp)).filter((date) => !Number.isNaN(date.getTime()));
        const latestTime = validTimes.length ? new Date(Math.max(...validTimes.map((date) => date.getTime()))).toLocaleString("ro-RO") : "Indisponibil";

        grid.innerHTML = `
            <div class="metric-card">
                <div class="metric-title">Total Măsurători</div>
                <div class="metric-val">${measurements.length}</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Simptome Raportate</div>
                <div class="metric-val" style="color: var(--accent-yellow);">${symptoms.length}</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Evenimente Medicale</div>
                <div class="metric-val" style="color: var(--accent-cyan);">${measurements.length + symptoms.length}</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Ultima Actualizare Dosar</div>
                <div class="metric-val" style="font-size: 0.9rem; margin-top: 5px;">${escapeHtml(latestTime)}</div>
            </div>
        `;
    }

    renderMeasurementsTable() {
        const tbody = document.getElementById("measurementsTableBody");
        const filter = document.getElementById("measurementFilter")?.value || "ALL";
        if (!tbody) return;

        const measurements = this.getAllMeasurements();
        const filtered = filter === "ALL" ? measurements : measurements.filter(m => m.type.toLowerCase().includes(filter.toLowerCase()));

        tbody.innerHTML = "";
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Nicio înregistrare găsită pentru filtrul selectat.</td></tr>`;
            return;
        }

        filtered.forEach(m => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${escapeHtml(m.type)}</strong></td>
                <td style="font-family: var(--font-tech); color: var(--accent-cyan);">${escapeHtml(m.value)}</td>
                <td>${escapeHtml(m.unit)}</td>
                <td>${escapeHtml(m.timestamp)}</td>
                <td><span style="font-size: 0.75rem; color: var(--accent-yellow);">${escapeHtml(m.source)}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    renderCharts() {
        if (typeof Chart === "undefined") {
            ["trendsChart1", "trendsChart2"].forEach((id) => { const canvas = document.getElementById(id); if (canvas) canvas.parentElement.textContent = "Grafic indisponibil offline."; });
            return;
        }
        // Chart 1: Heart Rate & SpO2
        const ctx1 = document.getElementById("trendsChart1")?.getContext("2d");
        if (ctx1) {
            if (this.chartInstance1) this.chartInstance1.destroy();
            this.chartInstance1 = new Chart(ctx1, {
                type: "line",
                data: {
                    labels: ["Ziua -4", "Ziua -3", "Ziua -2", "Ziua -1", "Azi"],
                    datasets: [
                        { label: "Puls (BPM)", data: [70, 72, 71, 74, 72], borderColor: "#00f0ff", backgroundColor: "rgba(0,240,255,0.1)", tension: 0.3 },
                        { label: "SpO2 (%)", data: [98, 97, 98, 99, 98], borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.1)", tension: 0.3 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: "#8892b0" }, grid: { color: "#233554" } }, y: { ticks: { color: "#8892b0" }, grid: { color: "#233554" } } } }
            });
        }

        // Chart 2: Temperature
        const ctx2 = document.getElementById("trendsChart2")?.getContext("2d");
        if (ctx2) {
            if (this.chartInstance2) this.chartInstance2.destroy();
            this.chartInstance2 = new Chart(ctx2, {
                type: "line",
                data: {
                    labels: ["Ziua -4", "Ziua -3", "Ziua -2", "Ziua -1", "Azi"],
                    datasets: [
                        { label: "Temperatură (°C)", data: [36.6, 36.7, 36.8, 36.7, 36.7], borderColor: "#f59e0b", backgroundColor: "rgba(245,158,11,0.1)", tension: 0.3 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: "#8892b0" }, grid: { color: "#233554" } }, y: { ticks: { color: "#8892b0" }, grid: { color: "#233554" } } } }
            });
        }
    }

    renderTimeline() {
        const container = document.getElementById("timelineContainer");
        if (!container) return;

        const symptoms = this.getSymptoms();
        container.innerHTML = "";

        // Evenimente statice demonstrative pentru Medical Timeline
        const timelineEvents = [
            { time: "08:00 UTC", type: "Blood Pressure Measurement", desc: "Exemplu de înregistrare demonstrativă, nu provine dintr-o măsurătoare.", source: "DEMO DATA" },
            { time: "09:30 UTC", type: "Exercise Session", desc: "Exemplu de antrenament demonstrativ, nu provine dintr-o sesiune sincronizată.", source: "DEMO DATA" }
        ];

        symptoms.forEach(s => {
            timelineEvents.unshift({
                time: s.timestamp,
                type: `Simptom: ${s.type} (Intensitate: ${s.intensity}/10)`,
                desc: s.desc,
                source: "Manual Report"
            });
        });

        timelineEvents.forEach(ev => {
            const div = document.createElement("div");
            div.className = "timeline-item";
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between;">
                    <strong style="color: var(--accent-cyan);">${escapeHtml(ev.time)} – ${escapeHtml(ev.type)}</strong>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(ev.source)}</span>
                </div>
                <p style="color: var(--text-main); margin-top: 2px;">${escapeHtml(ev.desc)}</p>
            `;
            container.appendChild(div);
        });
    }

    exportCSV() {
        const measurements = this.getAllMeasurements();
        let csv = "Tip,Valoare,Unitate,Data,Sursa\n";
        const cell = (value) => {
            let text = String(value ?? "");
            if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
            return `"${text.replace(/"/g, '""')}"`;
        };
        measurements.forEach(m => {
            csv += [m.type, m.value, m.unit, m.timestamp, m.source].map(cell).join(",") + "\n";
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ASTRA_Medical_Report_${this.currentAstronautId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    exportJSON() {
        const data = {
            astronautId: this.currentAstronautId,
            exportDate: new Date().toISOString(),
            measurements: this.getAllMeasurements(),
            symptoms: this.getSymptoms()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ASTRA_Medical_Report_${this.currentAstronautId}.json`;
        a.click();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.medicalRecordsManager = new MedicalRecordsManager();
});
