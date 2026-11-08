class ChartsManager {
    constructor() {
        this.chartInstance = null;
        this.initChart();
        this.initTimeButtons();
    }

    initChart() {
        const canvas = document.getElementById("vitalsChart");
        if (!canvas) return;
        if (typeof Chart === "undefined") { canvas.parentElement.textContent = "Grafic indisponibil offline; datele de bază rămân accesibile."; return; }
        const ctx = canvas.getContext("2d");
        this.chartInstance = new Chart(ctx, {
            type: "line",
            data: {
                labels: DEMO_DATA.history.labels,
                datasets: [
                    {
                        label: "Ritm Cardiac (bpm)",
                        data: DEMO_DATA.history.heartRate,
                        borderColor: "#00f0ff",
                        backgroundColor: "rgba(0, 240, 255, 0.1)",
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: "Oxigen SpO2 (%)",
                        data: DEMO_DATA.history.spo2,
                        borderColor: "#10b981",
                        backgroundColor: "rgba(16, 185, 129, 0.1)",
                        tension: 0.4,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: "#e2e8f0", font: { size: 10 } }
                    }
                },
                scales: {
                    x: { ticks: { color: "#8892b0" }, grid: { color: "#233554" } },
                    y: { ticks: { color: "#8892b0" }, grid: { color: "#233554" } }
                }
            }
        });
    }

    initTimeButtons() {
        const buttons = document.querySelectorAll(".btn-time");
        buttons.forEach(btn => {
            btn.addEventListener("click", (e) => {
                buttons.forEach(b => b.classList.remove("active"));
                e.target.classList.add("active");
                const range = e.target.getAttribute("data-range");
                this.updateDataRange(range);
            });
        });
    }

    updateDataRange(range) {
        if (!this.chartInstance) return;
        let newLabels, newHr, newSpo2;
        if (range === "1h") {
            newLabels = ["-50m", "-40m", "-30m", "-20m", "-10m", "Acum"];
            newHr = [72, 74, 73, 75, 74, 74];
            newSpo2 = [98, 98, 99, 98, 98, 98];
        } else if (range === "6h") {
            newLabels = ["-6h", "-5h", "-4h", "-3h", "-2h", "Acum"];
            newHr = [70, 75, 80, 72, 74, 74];
            newSpo2 = [97, 98, 99, 96, 98, 98];
        } else if (range === "12h") {
            newLabels = ["-12h", "-10h", "-8h", "-6h", "-3h", "Acum"];
            newHr = [68, 72, 85, 76, 73, 74];
            newSpo2 = [98, 96, 97, 99, 98, 98];
        } else {
            newLabels = DEMO_DATA.history.labels;
            newHr = DEMO_DATA.history.heartRate;
            newSpo2 = DEMO_DATA.history.spo2;
        }

        this.chartInstance.data.labels = newLabels;
        this.chartInstance.data.datasets[0].data = newHr;
        this.chartInstance.data.datasets[1].data = newSpo2;
        this.chartInstance.update();
    }
}

const chartsManager = new ChartsManager();
