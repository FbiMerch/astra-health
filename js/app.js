class App {
    constructor() {
        this.currentAstronautId = "ast-01";
        this.init();
    }

    async init() {
        document.getElementById("apiModeToggle")?.addEventListener("change", () => this.loadData());

        let astronauts;
        try {
            astronauts = await apiService.getAstronauts();
        } catch (error) {
            astronauts = [];
            const alerts = document.getElementById("alertsList");
            if (alerts) alerts.textContent = `API indisponibilă: ${error.message}. Datele demo nu sunt afișate în modul API.`;
        }
        const select = document.getElementById("astronautSelect");
        if (select) {
            select.innerHTML = "";
            astronauts.forEach(ast => {
                const option = document.createElement("option");
                option.value = ast.id;
                option.textContent = `${ast.name} (${ast.role})`;
                select.appendChild(option);
            });

            select.addEventListener("change", (e) => {
                this.currentAstronautId = e.target.value;
                this.loadData();
            });
        }

        await this.loadData();
    }

    async loadData() {
        if (!this.currentAstronautId) return;
        try {
            const [vitals, alerts] = await Promise.all([
                apiService.getVitals(this.currentAstronautId),
                apiService.getAlerts(this.currentAstronautId)
            ]);
            this.renderVitals(vitals);
            this.renderAlerts(alerts);
        } catch (error) {
            this.renderVitals(null);
            this.renderAlerts([{ level: "warning", timestamp: "SYSTEM", message: `Date indisponibile din API: ${error.message}` }]);
        }
    }

    renderVitals(vitals) {
        const grid = document.getElementById("metricsGrid");
        if (!grid) return;
        grid.innerHTML = "";

        const mapping = [
            { key: "heartRate", label: "Ritm Cardiac" },
            { key: "spo2", label: "Oxigen (SpO2)" },
            { key: "temperature", label: "Temperatură Corp" },
            { key: "bloodPressure", label: "Tensiune Arterială" },
            { key: "boneDensity", label: "Masă Osoasă" },
            { key: "respiratoryRate", label: "Ritm Resp." }
        ];

        if (!vitals || typeof vitals !== "object") {
            grid.innerHTML = '<div class="metric-card"><div class="metric-title">Date indisponibile</div><div class="metric-value">UNAVAILABLE</div><div class="metric-status">Sursa API nu a răspuns</div></div>';
            return;
        }
        mapping.forEach(m => {
            const item = vitals[m.key];
            if (!item) return;

            const card = document.createElement("div");
            card.className = "metric-card";
            card.innerHTML = `
                <div class="metric-title">${escapeHtml(m.label)}</div>
                <div class="metric-value">${escapeHtml(item.value)} <span style="font-size:0.9rem; color:var(--text-muted);">${escapeHtml(item.unit)}</span></div>
                <div class="metric-status status-${escapeHtml(item.status)}">${escapeHtml(item.status).toUpperCase()}</div>
                <div style="font-size:.7rem;color:var(--text-muted)">Sursă: ${apiService.isApiMode ? "Spring Boot API" : "DEMO DATA"}</div>
            `;
            grid.appendChild(card);
        });
    }

    renderAlerts(alerts) {
        const list = document.getElementById("alertsList");
        if (!list) return;
        list.innerHTML = "";
        alerts.forEach(alert => {
            const div = document.createElement("div");
            div.className = `alert-item ${alert.level}`;
            div.textContent = `[${alert.timestamp}] ${alert.message}`;
            list.appendChild(div);
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.appInstance = new App();
});
