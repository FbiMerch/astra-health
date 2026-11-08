class ExerciseManager {
    constructor() {
        this.currentAstronautId = "ast-01";
        this.storageKey = "astra_exercise_logs";
        this.boneKey = "astra_bone_density";
        this.muscleChartInstance = null;
        this.historyChartInstance = null;
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
        select.addEventListener("change", () => {
            this.currentAstronautId = select.value;
            this.renderAll();
        });
        document.getElementById("workoutLogForm").addEventListener("submit", (event) => {
            event.preventDefault();
            this.handleFormSubmit();
        });
        document.getElementById("simulateBoneScanBtn").addEventListener("click", () => this.simulateBoneScan());
        this.renderAll();
    }

    storageRead(key) {
        try { return localStorage.getItem(key); }
        catch (error) { console.warn("[ASTRA Exercise] Local storage unavailable", error); return null; }
    }

    getWorkouts() {
        const raw = this.storageRead(`${this.storageKey}_${this.currentAstronautId}`);
        if (raw === null) return this.getDemoWorkouts();
        try {
            const list = JSON.parse(raw);
            return Array.isArray(list) ? list.filter((item) => item && Number.isFinite(Number(item.duration))) : [];
        } catch (error) { return []; }
    }

    getDemoWorkouts() {
        const today = new Date();
        const at = (daysAgo, hour, minute) => {
            const date = new Date(today);
            date.setDate(date.getDate() - daysAgo);
            date.setHours(hour, minute, 0, 0);
            return date.toISOString();
        };
        return [
            { id: "demo-r-1", type: "Resistance", name: "ARED Squats & Deadlifts", duration: 60, intensity: "High", details: "4 seturi × 8 repetări (date demo)", createdAt: at(0, 8, 0), demo: true },
            { id: "demo-c-1", type: "Cardio", name: "T2 Treadmill Interval Run", duration: 30, intensity: "Moderate", details: "Puls mediu: 142 bpm (date demo)", createdAt: at(0, 15, 30), demo: true },
            { id: "demo-r-2", type: "Resistance", name: "ARED Full Body", duration: 55, intensity: "Moderate", details: "Sesiune demonstrativă", createdAt: at(1, 9, 0), demo: true },
            { id: "demo-c-2", type: "Cardio", name: "Cycle Ergometer", duration: 35, intensity: "Moderate", details: "Sesiune demonstrativă", createdAt: at(1, 16, 0), demo: true },
            { id: "demo-r-3", type: "Resistance", name: "ARED Lower Body", duration: 50, intensity: "High", details: "Sesiune demonstrativă", createdAt: at(2, 9, 0), demo: true }
        ];
    }

    saveWorkout(workout) {
        const key = `${this.storageKey}_${this.currentAstronautId}`;
        // First manual entry starts a clean persistent log instead of mixing in sample data.
        const current = this.storageRead(key) === null ? [] : this.getWorkouts();
        try {
            current.unshift(workout);
            localStorage.setItem(key, JSON.stringify(current));
            return true;
        } catch (error) {
            console.error("[ASTRA Exercise] Could not save workout", error);
            return false;
        }
    }

    getBoneDensityData() {
        const raw = this.storageRead(`${this.boneKey}_${this.currentAstronautId}`);
        if (!raw) return null;
        try { return JSON.parse(raw); } catch (error) { return null; }
    }

    simulateBoneScan() {
        const scan = { bmdValue: "94.2%", status: "Atenție (valoare demonstrativă)", createdAt: new Date().toISOString() };
        try {
            localStorage.setItem(`${this.boneKey}_${this.currentAstronautId}`, JSON.stringify(scan));
            this.renderBoneHealth();
            alert("Scanarea BMD demonstrativă a fost salvată local.");
        } catch (error) { alert("Nu s-a putut salva scanarea: spațiul local nu este disponibil."); }
    }

    handleFormSubmit() {
        const name = document.getElementById("logName").value.trim();
        const duration = Number(document.getElementById("logDuration").value);
        if (!name || !Number.isInteger(duration) || duration < 5 || duration > 180) return;
        const workout = {
            id: `workout-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            type: document.getElementById("logType").value,
            name,
            duration,
            intensity: document.getElementById("logIntensity").value,
            details: document.getElementById("logDetails").value.trim(),
            createdAt: new Date().toISOString()
        };
        if (!this.saveWorkout(workout)) {
            alert("Antrenamentul nu a putut fi salvat. Verifică disponibilitatea spațiului local.");
            return;
        }
        document.getElementById("workoutLogForm").reset();
        this.renderAll();
        alert("Antrenamentul a fost salvat local.");
    }

    isToday(workout) {
        if (workout.demo && workout.createdAt) return new Date(workout.createdAt).toDateString() === new Date().toDateString();
        if (workout.createdAt) return new Date(workout.createdAt).toDateString() === new Date().toDateString();
        return workout.date === "Azi" || String(workout.date || "").startsWith("Azi ");
    }

    renderAll() {
        const workouts = this.getWorkouts();
        const todayWorkouts = workouts.filter((workout) => this.isToday(workout));
        const totalMinutes = todayWorkouts.reduce((sum, workout) => sum + Number(workout.duration), 0);
        const goalMinutes = 120;
        const overview = document.getElementById("dailyOverviewGrid");
        overview.innerHTML = `
            <div class="metric-card"><div class="metric-title">Antrenamente azi</div><div class="metric-val">${todayWorkouts.length} ședințe</div></div>
            <div class="metric-card"><div class="metric-title">Durată totală efort</div><div class="metric-val">${totalMinutes} / ${goalMinutes} min</div></div>
            <div class="metric-card"><div class="metric-title">Progres obiectiv zilnic</div><div class="metric-val" style="color:var(--accent-green)">${Math.min(100, Math.round(totalMinutes / goalMinutes * 100))}%</div></div>
            <div class="metric-card"><div class="metric-title">Recuperare</div><div class="metric-val" style="font-size:1.1rem">Conform planului echipajului</div></div>`;
        this.renderBoneHealth();
        this.renderCharts(workouts);
        this.renderRecommendations(todayWorkouts, totalMinutes);
        this.renderHistoryList(workouts);
    }

    renderBoneHealth() {
        const element = document.getElementById("boneDensityVal");
        const data = this.getBoneDensityData();
        if (!data) {
            element.textContent = "Nicio măsurătoare BMD disponibilă";
            element.style.color = "var(--accent-yellow)";
            return;
        }
        element.textContent = `BMD ${data.bmdValue} · ${data.status} · ${new Date(data.createdAt).toLocaleDateString("ro-RO")}`;
        element.style.color = "var(--text-main)";
    }

    chartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: "#e2e8f0" } } },
            scales: {
                x: { ticks: { color: "#8892b0" }, grid: { color: "#233554" } },
                y: { beginAtZero: true, ticks: { color: "#8892b0" }, grid: { color: "#233554" } }
            }
        };
    }

    renderCharts(workouts) {
        if (typeof Chart === "undefined") return;
        const muscleCanvas = document.getElementById("muscleChart");
        if (this.muscleChartInstance) this.muscleChartInstance.destroy();
        this.muscleChartInstance = new Chart(muscleCanvas, {
            type: "bar",
            data: { labels: ["Membre superioare", "Core", "Membre inferioare"], datasets: [{ label: "Indice demonstrativ (%)", data: [98, 95, 92], backgroundColor: ["#00f0ff", "#10b981", "#f59e0b"] }] },
            options: { ...this.chartOptions(), scales: { ...this.chartOptions().scales, y: { ...this.chartOptions().scales.y, min: 80, max: 100 } } }
        });

        const labels = [];
        const resistance = [];
        const cardio = [];
        for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            labels.push(daysAgo === 0 ? "Azi" : date.toLocaleDateString("ro-RO", { weekday: "short" }));
            const todays = workouts.filter((workout) => {
                if (!workout.createdAt) return daysAgo === 0 && this.isToday(workout);
                const loggedDate = new Date(workout.createdAt);
                return loggedDate.toDateString() === date.toDateString();
            });
            resistance.push(todays.filter((item) => item.type === "Resistance").reduce((sum, item) => sum + Number(item.duration), 0));
            cardio.push(todays.filter((item) => item.type === "Cardio").reduce((sum, item) => sum + Number(item.duration), 0));
        }
        if (this.historyChartInstance) this.historyChartInstance.destroy();
        this.historyChartInstance = new Chart(document.getElementById("trainingHistoryChart"), {
            type: "line",
            data: { labels, datasets: [
                { label: "Resistance (ARED) · min", data: resistance, borderColor: "#00f0ff", backgroundColor: "rgba(0,240,255,.1)", tension: .3 },
                { label: "Cardio (T2 / Cycle) · min", data: cardio, borderColor: "#10b981", backgroundColor: "rgba(16,185,129,.1)", tension: .3 }
            ] },
            options: this.chartOptions()
        });
    }

    renderRecommendations(todayWorkouts, totalMinutes) {
        const container = document.getElementById("exerciseRecommendationsList");
        const recs = [];
        if (!todayWorkouts.some((workout) => workout.type === "Resistance")) recs.push(["Verifică sesiunea de rezistență", "Nu există o sesiune de rezistență în jurnalul de azi. Consultă planul aprobat al echipajului.", "Încărcarea musculară și osoasă este un obiectiv important în misiunile cu gravitație redusă."]);
        if (!todayWorkouts.some((workout) => workout.type === "Cardio")) recs.push(["Verifică sesiunea cardio", "Nu există o sesiune cardio în jurnalul de azi. Urmează programul individualizat al misiunii.", "Menținerea condiției cardiovasculare este inclusă în contramăsurile de exercițiu."]);
        if (totalMinutes < 90 && todayWorkouts.length && recs.length === 0) recs.push(["Activitatea zilnică este sub reperul demonstrativ", "Jurnalul indică mai puțin de 90 de minute. Compară cu planul echipajului înainte de a ajusta activitatea.", "Durata-țintă afișată este orientativă și poate diferi de protocolul individual."]);
        if (!recs.length) recs.push(["Jurnalul de azi include cardio și rezistență", "Ambele categorii apar în înregistrările de azi. Continuă să urmezi planul de exerciții aprobat.", "Această sumarizare se bazează numai pe jurnalul local, nu pe evaluare clinică."]);
        container.replaceChildren(...recs.map(([title, description, reason]) => {
            const card = document.createElement("div");
            card.className = "recommendation-item";
            const heading = document.createElement("strong"); heading.textContent = title;
            const body = document.createElement("p"); body.className = "subtle"; body.style.marginTop = "4px"; body.textContent = description;
            const note = document.createElement("em"); note.style.cssText = "color:var(--accent-cyan);display:block;margin-top:4px"; note.textContent = `Context: ${reason}`;
            card.append(heading, body, note);
            return card;
        }));
    }

    renderHistoryList(workouts) {
        const container = document.getElementById("workoutHistoryList");
        if (!workouts.length) {
            container.innerHTML = '<div class="subtle">Niciun antrenament înregistrat.</div>';
            return;
        }
        container.replaceChildren(...workouts.map((workout, index) => {
            const row = document.createElement("div");
            row.className = "workout-row";
            const details = document.createElement("div");
            const title = document.createElement("strong");
            title.textContent = `#${workouts.length - index} · [${workout.type}] ${workout.name}${workout.demo ? " (demo)" : ""}`;
            const meta = document.createElement("div");
            meta.className = "subtle";
            const date = workout.createdAt ? new Date(workout.createdAt).toLocaleString("ro-RO") : (workout.date || "Dată indisponibilă");
            meta.textContent = `${workout.details || "Fără detalii"} · ${date}`;
            details.append(title, meta);
            const duration = document.createElement("div");
            duration.style.cssText = "font-weight:bold;color:var(--accent-cyan);white-space:nowrap";
            duration.textContent = `${Number(workout.duration)} min · ${workout.intensity || "—"}`;
            row.append(details, duration);
            return row;
        }));
    }
}

document.addEventListener("DOMContentLoaded", () => { window.exerciseManager = new ExerciseManager(); });
