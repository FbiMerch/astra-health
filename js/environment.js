class EnvironmentManager {
    constructor() {
        this.currentAstronautId = "ast-01";
        this.storageKey = "astra_env_manual_logs";
        this.airChartInstance = null;
        this.climateChartInstance = null;
        // Illustrative UI thresholds only; these are not mission or medical limits.
        this.thresholds = { o2Low: 19.5, co2High: 1.0, tempLow: 18, tempHigh: 28, humidityLow: 30, humidityHigh: 70, radiationRateHigh: 0.5 };
        this.init();
    }

    init() {
        const select = document.getElementById("astronautSelect");
        (DEMO_DATA.astronauts || []).forEach((astronaut) => {
            const option = document.createElement("option");
            option.value = astronaut.id;
            option.textContent = `${astronaut.name} (${astronaut.role})`;
            option.selected = astronaut.id === this.currentAstronautId;
            select.appendChild(option);
        });
        select.addEventListener("change", () => { this.currentAstronautId = select.value; this.renderAll(); });
        document.getElementById("envLogForm").addEventListener("submit", (event) => { event.preventDefault(); this.handleFormSubmit(); });
        this.renderAll();
    }

    readLogs() {
        try {
            const raw = localStorage.getItem(`${this.storageKey}_${this.currentAstronautId}`);
            if (raw === null) return [];
            const logs = JSON.parse(raw);
            return Array.isArray(logs) ? logs.filter((log) => log && [log.o2, log.co2, log.temp, log.humidity, log.radiation].every((value) => Number.isFinite(Number(value)))) : [];
        } catch (error) { console.warn("[ASTRA Environment] Local storage unavailable or invalid", error); return []; }
    }

    saveLog(log) {
        const key = `${this.storageKey}_${this.currentAstronautId}`;
        try {
            const logs = this.readLogs();
            logs.unshift(log);
            localStorage.setItem(key, JSON.stringify(logs));
            return true;
        } catch (error) { console.error("[ASTRA Environment] Could not save measurement", error); return false; }
    }

    getCurrent() {
        const manualLogs = this.readLogs();
        if (manualLogs.length) return { ...manualLogs[0], source: "MANUAL DATA", timestamp: manualLogs[0].timestamp, cumulativeDose: null, solarStatus: null };
        // No sensor connector is configured in this project. The fixed demo sample is labeled.
        return { o2: 20.9, co2: 0.8, temp: 23.5, humidity: 45, radiation: 0.05, source: "DEMO DATA", timestamp: "Exemplu static", cumulativeDose: 14.2, solarStatus: "QUIET (demo)" };
    }

    handleFormSubmit() {
        const log = {
            id: `env-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            timestamp: new Date().toISOString(),
            o2: Number(document.getElementById("manualO2").value),
            co2: Number(document.getElementById("manualCO2").value),
            temp: Number(document.getElementById("manualTemp").value),
            humidity: Number(document.getElementById("manualHumidity").value),
            radiation: Number(document.getElementById("manualRad").value),
            source: "MANUAL DATA"
        };
        if (![log.o2, log.co2, log.temp, log.humidity, log.radiation].every(Number.isFinite)) return;
        if (!this.saveLog(log)) { alert("Măsurătoarea nu a putut fi salvată. Verifică disponibilitatea localStorage."); return; }
        document.getElementById("envLogForm").reset();
        this.renderAll();
        alert("Măsurătoarea manuală a fost salvată local.");
    }

    sourceText(source, timestamp) {
        return `Sursă: ${source}${timestamp ? ` · ${timestamp === "Exemplu static" ? timestamp : new Date(timestamp).toLocaleString("ro-RO")}` : ""}`;
    }

    renderAll() {
        const current = this.getCurrent();
        this.renderOverview(current);
        this.renderRadiation(current);
        this.renderCharts(current);
        this.renderAlerts(current);
        this.renderInsights(current);
        this.renderHistory();
    }

    renderOverview(current) {
        const metrics = [
            ["Nivel oxigen (O₂)", current.o2, "%", current.o2 < this.thresholds.o2Low ? "var(--accent-red)" : "var(--accent-cyan)"],
            ["Dioxid de carbon (CO₂)", current.co2, "%", current.co2 > this.thresholds.co2High ? "var(--accent-yellow)" : "var(--accent-cyan)"],
            ["Temperatură ambientală", current.temp, "°C", "var(--accent-cyan)"],
            ["Umiditate relativă", current.humidity, "%", "var(--accent-cyan)"]
        ];
        const grid = document.getElementById("envOverviewGrid");
        grid.replaceChildren(...metrics.map(([label, value, unit, color]) => {
            const card = document.createElement("div"); card.className = "metric-card";
            const title = document.createElement("div"); title.className = "metric-title"; title.textContent = label;
            const val = document.createElement("div"); val.className = "metric-val"; val.style.color = color; val.textContent = `${value} ${unit}`;
            const source = document.createElement("div"); source.className = "metric-source"; source.textContent = this.sourceText(current.source, current.timestamp);
            card.append(title, val, source); return card;
        }));
    }

    renderRadiation(current) {
        document.getElementById("radRateVal").textContent = `${current.radiation} µSv/h`;
        document.getElementById("radRateSource").textContent = this.sourceText(current.source, current.timestamp);
        document.getElementById("radCumVal").textContent = current.cumulativeDose === null ? "Indisponibil" : `${current.cumulativeDose} mSv`;
        document.getElementById("radCumSource").textContent = current.cumulativeDose === null ? "Sursă: UNAVAILABLE · doza cumulativă nu este introdusă" : "Sursă: DEMO DATA · valoare ilustrativă";
        document.getElementById("radStatusVal").textContent = current.solarStatus || "Indisponibil";
        document.getElementById("radStatusSource").textContent = current.solarStatus ? "Sursă: DEMO DATA · status static ilustrativ" : "Sursă: UNAVAILABLE · flux space weather neconectat";
    }

    chartOptions() {
        return { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: "#e2e8f0" } } }, scales: {
            x: { ticks: { color: "#8892b0" }, grid: { color: "#233554" } },
            y: { beginAtZero: false, ticks: { color: "#8892b0" }, grid: { color: "#233554" } }
        } };
    }

    renderCharts(current) {
        if (typeof Chart === "undefined") return;
        const logs = this.readLogs();
        const chartLogs = logs.slice(0, 8).reverse();
        const manual = chartLogs.length > 0;
        const labels = manual ? chartLogs.map((log) => new Date(log.timestamp).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })) : ["−4h", "−3h", "−2h", "−1h", "Exemplu"];
        const airData = manual ? [chartLogs.map((log) => log.o2), chartLogs.map((log) => log.co2)] : [[21, 20.9, 20.9, 20.8, current.o2], [0.6, 0.7, 0.7, 0.8, current.co2]];
        const climateData = manual ? [chartLogs.map((log) => log.temp), chartLogs.map((log) => log.humidity)] : [[23, 23.2, 23.4, 23.5, current.temp], [44, 45, 45, 46, current.humidity]];
        const sourceLabel = manual ? "MANUAL DATA · ultimele înregistrări salvate local" : "DEMO DATA · valori istorice ilustrative, nu telemetrie";
        document.getElementById("airChartSource").textContent = `Sursă: ${sourceLabel}`;
        document.getElementById("climateChartSource").textContent = `Sursă: ${sourceLabel}`;
        if (this.airChartInstance) this.airChartInstance.destroy();
        this.airChartInstance = new Chart(document.getElementById("airQualityChart"), { type: "line", data: { labels, datasets: [
            { label: "O₂ (%)", data: airData[0], borderColor: "#10b981", tension: .3, yAxisID: "y" },
            { label: "CO₂ (%)", data: airData[1], borderColor: "#f59e0b", tension: .3, yAxisID: "y1" }
        ] }, options: { ...this.chartOptions(), scales: { ...this.chartOptions().scales, y: { ...this.chartOptions().scales.y, position: "left" }, y1: { ...this.chartOptions().scales.y, position: "right", grid: { drawOnChartArea: false } } } } });
        if (this.climateChartInstance) this.climateChartInstance.destroy();
        this.climateChartInstance = new Chart(document.getElementById("tempHumidityChart"), { type: "line", data: { labels, datasets: [
            { label: "Temperatură (°C)", data: climateData[0], borderColor: "#00f0ff", tension: .3, yAxisID: "y" },
            { label: "Umiditate (%)", data: climateData[1], borderColor: "#f97316", tension: .3, yAxisID: "y1" }
        ] }, options: { ...this.chartOptions(), scales: { ...this.chartOptions().scales, y: { ...this.chartOptions().scales.y, position: "left" }, y1: { ...this.chartOptions().scales.y, position: "right", grid: { drawOnChartArea: false } } } } });
    }

    renderAlerts(current) {
        const alerts = [];
        const add = (level, metric, value, explanation, action) => alerts.push({ level, metric, value, explanation, action });
        const t = this.thresholds;
        if (current.o2 < t.o2Low) add("warning", "Oxigen (O₂)", `${current.o2}%`, `Valoarea este sub pragul demonstrativ configurat de ${t.o2Low}%.`, "Verifică sursa de date și consultă procedura operațională aprobată.");
        if (current.co2 > t.co2High) add("warning", "Dioxid de carbon (CO₂)", `${current.co2}%`, `Valoarea depășește pragul demonstrativ configurat de ${t.co2High}%.`, "Verifică sursa de date și urmează procedura aprobată pentru sistemul de habitat.");
        if (current.temp < t.tempLow || current.temp > t.tempHigh) add("warning", "Temperatură", `${current.temp}°C`, `Valoarea este în afara intervalului demonstrativ ${t.tempLow}–${t.tempHigh}°C.`, "Verifică măsurătoarea și consultă procedura de mediu a misiunii.");
        if (current.humidity < t.humidityLow || current.humidity > t.humidityHigh) add("warning", "Umiditate relativă", `${current.humidity}%`, `Valoarea este în afara intervalului demonstrativ ${t.humidityLow}–${t.humidityHigh}%.`, "Verifică măsurătoarea și consultă procedura de mediu a misiunii.");
        if (current.radiation > t.radiationRateHigh) add("warning", "Rată doză radiație", `${current.radiation} µSv/h`, `Valoarea depășește pragul demonstrativ configurat de ${t.radiationRateHigh} µSv/h.`, "Confirmă citirea cu instrumentația și urmează procedurile de protecție radiologică aprobate.");
        if (!alerts.length) add("normal", "Parametrii introduși", "Fără depășiri demo detectate", `Valorile sunt în intervalele de afișare demonstrative. Sursa curentă este ${current.source}.`, "Nu se declanșează o acțiune automată. Continuă monitorizarea conform procedurii aprobate.");
        const container = document.getElementById("alertsContainer");
        container.replaceChildren(...alerts.map((alert) => {
            const card = document.createElement("div"); card.className = `alert-item alert-${alert.level}`;
            const heading = document.createElement("strong"); heading.textContent = `${alert.metric} · ${alert.value} · ${alert.level.toUpperCase()}`;
            const source = document.createElement("span"); source.className = "metric-source"; source.textContent = this.sourceText(current.source, current.timestamp);
            const reason = document.createElement("p"); reason.className = "subtle"; reason.textContent = alert.explanation;
            const action = document.createElement("em"); action.className = "subtle"; action.textContent = `Context / acțiune orientativă: ${alert.action}`;
            card.append(heading, source, reason, action); return card;
        }));
    }

    renderInsights(current) {
        const container = document.getElementById("insightsContainer");
        const notes = [
            ["Atmosferă în habitat închis", "O₂ și CO₂ sunt afișate cu proveniența datelor. O valoare introdusă manual nu confirmă starea sistemului de susținere a vieții.", `Context: comparația este orientativă; sursă curentă ${current.source}.`],
            ["Radiație spațială", "Rata dozei și doza cumulativă sunt indicatori diferiți. Doza cumulativă și statusul space weather apar indisponibile când nu există o sursă de date conectată.", "Justificare: formularul colectează doar rata de doză, deci nu permite calculul dozei cumulative de misiune."]
        ];
        container.replaceChildren(...notes.map(([title, text, reason]) => {
            const box = document.createElement("div"); box.className = "insight-box";
            const heading = document.createElement("strong"); heading.textContent = title;
            const body = document.createElement("p"); body.className = "subtle"; body.textContent = text;
            const context = document.createElement("em"); context.className = "metric-source"; context.textContent = reason;
            box.append(heading, body, context); return box;
        }));
    }

    renderHistory() {
        const container = document.getElementById("envHistoryContainer");
        const logs = this.readLogs();
        if (!logs.length) {
            const empty = document.createElement("p"); empty.className = "subtle"; empty.textContent = "Nicio măsurătoare manuală salvată. Senzorii nu sunt conectați; valorile principale sunt date demonstrative.";
            container.replaceChildren(empty); return;
        }
        container.replaceChildren(...logs.map((log) => {
            const row = document.createElement("div"); row.className = "metric-card";
            const date = document.createElement("strong"); date.textContent = `${new Date(log.timestamp).toLocaleString("ro-RO")} · MANUAL DATA`;
            const values = document.createElement("div"); values.className = "subtle"; values.textContent = `O₂ ${log.o2}% · CO₂ ${log.co2}% · ${log.temp}°C · Umiditate ${log.humidity}% · Radiație ${log.radiation} µSv/h`;
            row.append(date, values); return row;
        }));
    }
}

document.addEventListener("DOMContentLoaded", () => { window.environmentManager = new EnvironmentManager(); });
