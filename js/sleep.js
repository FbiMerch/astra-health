class SleepManager {
    constructor() {
        this.currentAstronautId = "ast-01";
        this.storageKey = "astra_sleep_logs";
        this.chartInstance = null;
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

        const form = document.getElementById("sleepLogForm");
        if (form) {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });
        }

        this.renderAll();
    }

    getLogs() {
        try {
            const data = localStorage.getItem(`${this.storageKey}_${this.currentAstronautId}`);
            if (!data) {
                // Return demo logs if none saved yet
                return [
                    { date: "Z-5", hours: 7.2, quality: "Fair", bedtime: "23:00", wakeTime: "06:15", interruptions: 2, fatigue: "Moderate" },
                    { date: "Z-4", hours: 8.0, quality: "Good", bedtime: "22:30", wakeTime: "06:30", interruptions: 0, fatigue: "Low" },
                    { date: "Z-3", hours: 6.5, quality: "Poor", bedtime: "00:00", wakeTime: "06:30", interruptions: 3, fatigue: "High" },
                    { date: "Z-2", hours: 7.8, quality: "Good", bedtime: "22:45", wakeTime: "06:35", interruptions: 1, fatigue: "Low" },
                    { date: "Azi", hours: 7.5, quality: "Good", bedtime: "22:30", wakeTime: "06:00", interruptions: 1, fatigue: "Low" }
                ];
            }
            return JSON.parse(data);
        } catch (e) {
            return [];
        }
    }

    saveLog(newLog) {
        const logs = this.getLogs();
        logs.push(newLog);
        localStorage.setItem(`${this.storageKey}_${this.currentAstronautId}`, JSON.stringify(logs));
    }

    handleFormSubmit() {
        const entry = {
            date: "Azi (" + new Date().toISOString().substring(5, 10) + ")",
            hours: parseFloat(document.getElementById("logSleepDuration").value),
            quality: document.getElementById("logSleepQuality").value,
            bedtime: document.getElementById("logBedtime").value,
            wakeTime: document.getElementById("logWakeTime").value,
            interruptions: parseInt(document.getElementById("logInterruptions").value),
            fatigue: document.getElementById("logFatigueLevel").value
        };

        this.saveLog(entry);
        alert("Înregistrarea de somn a fost salvată local cu succes!");
        this.renderAll();
    }

    renderAll() {
        const logs = this.getLogs();
        const latest = logs[logs.length - 1] || { hours: 7.5, quality: "Good", bedtime: "22:30", wakeTime: "06:00", interruptions: 1, fatigue: "Low" };

        // A. Sleep Overview Cards
        const overviewGrid = document.getElementById("sleepOverviewGrid");
        if (overviewGrid) {
            overviewGrid.innerHTML = `
                <div class="metric-card">
                    <div class="metric-title">Durată Somn (Ultimele)</div>
                    <div class="metric-val">${latest.hours} ore</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Calitate Estimată</div>
                    <div class="metric-val" style="color: var(--accent-green);">${latest.quality}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Orar (Culcare / Trezire)</div>
                    <div class="metric-val" style="font-size: 1.1rem;">${latest.bedtime} - ${latest.wakeTime}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Întreruperi & Oboseală</div>
                    <div class="metric-val" style="font-size: 1.1rem; color: var(--accent-yellow);">${latest.interruptions} întreruperi (${latest.fatigue})</div>
                </div>
            `;
        }

        this.renderChart(logs);
        this.renderRecommendations(latest);
    }

    renderChart(logs) {
        const ctx = document.getElementById("sleepCorrelationsChart")?.getContext("2d");
        if (!ctx) return;
        if (typeof Chart === "undefined") { ctx.canvas.parentElement.textContent = "Grafic indisponibil offline."; return; }

        if (this.chartInstance) this.chartInstance.destroy();

        const labels = logs.map(l => l.date);
        const hoursData = logs.map(l => l.hours);

        this.chartInstance = new Chart(ctx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Durată Somn (Ore)",
                        data: hoursData,
                        borderColor: "#00f0ff",
                        backgroundColor: "rgba(0, 240, 255, 0.1)",
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: "#8892b0" }, grid: { color: "#233554" } },
                    y: { ticks: { color: "#8892b0" }, grid: { color: "#233554" }, min: 4, max: 12 }
                }
            }
        });
    }

    renderRecommendations(latest) {
        const container = document.getElementById("sleepRecommendationsList");
        if (!container) return;
        container.innerHTML = "";

        const recs = [];
        if (latest.hours < 7) {
            recs.push({
                title: "Durată de somn sub media recomandată",
                desc: "Ați înregistrat sub 7 ore de odihnă. Se recomandă o scurtă sesiune de recuperare (power nap) de 20-30 de minute în programul de după-amiază.",
                reason: "Prevenirea scăderii vigilenței cognitive în mediu izolat."
            });
        }
        if (latest.interruptions > 2) {
            recs.push({
                title: "Frecvență ridicată a întreruperilor nocturne",
                desc: "Verificați nivelul de zgomot ambiental al ventilatoarelor din habitaclu și opriți dispozitivele cu lumină albastră cu 2 ore înainte de culcare.",
                reason: "Menținerea continuității etapelor de somn profund și REM."
            });
        }
        if (recs.length === 0) {
            recs.push({
                title: "Program de somn stabil și optim",
                desc: "Indicatorii de odihnă se încadrează în limitele optime pentru misiunile Artemis. Continuați respectarea orelor de culcare.",
                reason: "Stabilitatea ritmului circadian sprijină performanța operațională."
            });
        }

        recs.forEach(r => {
            const div = document.createElement("div");
            div.className = "recommendation-item";
            div.innerHTML = `
                <strong style="color: var(--text-main);">${r.title}</strong>
                <p style="color: var(--text-muted); margin-top: 4px;">${r.desc}</p>
                <em style="color: var(--accent-cyan); display: block; margin-top: 4px;">Motiv HRP: ${r.reason}</em>
            `;
            container.appendChild(div);
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.sleepManager = new SleepManager();
});
