class HealthInsightsManager {
    constructor() {
        this.selectedTimeRange = 7;
        this.trendsChartInstance = null;
        this.demoSeries = [
            [100, 99.1, 97.8, 96.2, 94.8, 93.5, 94.2],
            [72, 70, 75, 82, 76, 74, 74]
        ];
        this.init();
    }

    init() {
        const select = document.getElementById("astronautSelect");
        (DEMO_DATA.astronauts || []).forEach((astronaut, index) => {
            const option = document.createElement("option");
            option.value = astronaut.id;
            option.textContent = `${astronaut.name} (${astronaut.role}) · DEMO`;
            option.selected = index === 0;
            select?.appendChild(option);
        });
        document.querySelectorAll("[data-trendrange]").forEach((button) => {
            button.addEventListener("click", () => {
                document.querySelectorAll("[data-trendrange]").forEach((item) => item.classList.remove("active"));
                button.classList.add("active");
                this.selectedTimeRange = Number(button.dataset.trendrange) || 7;
                this.renderTrendChart();
            });
        });
        this.renderAll();
    }

    renderAll() {
        const score = document.getElementById("healthScoreVal");
        if (score) score.textContent = "DEMO";
        const status = document.getElementById("healthStatusVal");
        if (status) status.textContent = "NECLASIFICAT · DEMO";
        const trend = document.getElementById("healthTrendVal");
        if (trend) trend.textContent = "INDISPONIBIL";
        const risks = document.getElementById("activeRisksVal");
        if (risks) risks.textContent = "NEEVALUAT";
        const summary = document.getElementById("trendSummaryText");
        if (summary) summary.textContent = "Seria afișată este demonstrativă; nu există istoric de măsurători conectat.";
        const path = document.getElementById("scoreCirclePath");
        if (path) { path.setAttribute("stroke-dasharray", "0, 100"); path.setAttribute("stroke", "#8892b0"); }

        const risksContainer = document.getElementById("riskCardsGrid");
        if (risksContainer) risksContainer.textContent = "Nu se generează clasificări clinice: sursele și modelul nu sunt validate.";
        const recommendations = document.getElementById("recommendationsList");
        if (recommendations) recommendations.textContent = "Nu se generează recomandări personalizate. Consultă echipa medicală și protocoalele aprobate ale misiunii.";
        const timeline = document.getElementById("riskTimelineContainer");
        if (timeline) timeline.textContent = "Cronologia clinică nu este conectată; evenimente demonstrative nu sunt afișate ca istoric real.";
        this.renderTrendChart();
        this.renderUnavailableForecast();
    }

    renderTrendChart() {
        const canvas = document.getElementById("trendsChart");
        if (!canvas) return;
        if (typeof Chart === "undefined") {
            canvas.parentElement.textContent = "Grafic demo indisponibil offline.";
            return;
        }
        if (this.trendsChartInstance) this.trendsChartInstance.destroy();
        const indices = this.selectedTimeRange === 90 ? [0, 3, 6] : this.selectedTimeRange === 30 ? [0, 2, 4, 6] : [0, 1, 2, 3, 4, 5, 6];
        const labels = this.selectedTimeRange === 90 ? ["Lună 1", "Lună 2", "Lună 3"] : this.selectedTimeRange === 30 ? ["Săpt. 1", "Săpt. 2", "Săpt. 3", "Săpt. 4"] : ["Z-6", "Z-5", "Z-4", "Z-3", "Z-2", "Z-1", "Azi"];
        this.trendsChartInstance = new Chart(canvas, {
            type: "line",
            data: { labels, datasets: [
                { label: "Masă osoasă (%) · demo", data: indices.map((i) => this.demoSeries[0][i]), borderColor: "#f59e0b", tension: .3 },
                { label: "Ritm cardiac (bpm) · demo", data: indices.map((i) => this.demoSeries[1][i]), borderColor: "#00f0ff", tension: .3 }
            ] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: "#e2e8f0" } } }, scales: {
                x: { ticks: { color: "#8892b0" }, grid: { color: "#233554" } },
                y: { ticks: { color: "#8892b0" }, grid: { color: "#233554" } }
            } }
        });
        const summary = document.getElementById("trendSummaryText");
        if (summary) summary.textContent = "Valorile sunt eșantioane demonstrative, nu măsurători sau tendințe clinice.";
    }

    renderUnavailableForecast() {
        const canvas = document.getElementById("predictiveChart");
        if (canvas) canvas.parentElement.textContent = "Prognoză indisponibilă: nu există un set longitudinal validat conectat.";
    }
}

document.addEventListener("DOMContentLoaded", () => { window.healthInsightsManager = new HealthInsightsManager(); });
