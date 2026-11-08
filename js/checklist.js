class ChecklistManager {
    constructor() {
        this.currentAstronautId = "ast-01";
        this.storageKey = "astra_daily_checklist";
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

        const checkinBtn = document.getElementById("saveCheckinBtn");
        if (checkinBtn) {
            checkinBtn.addEventListener("click", () => {
                this.saveEmotionalCheckin();
            });
        }

        const form = document.getElementById("customTaskForm");
        if (form) {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleAddCustomTask();
            });
        }

        this.renderAll();
    }

    getTodayTasks() {
        const todayStr = new Date().toISOString().substring(0, 10);
        const stored = localStorage.getItem(`${this.storageKey}_${this.currentAstronautId}_${todayStr}`);
        if (stored) {
            try { return JSON.parse(stored); } catch (e) { /* fallback */ }
        }

        const defaultTasks = [
            { id: "t-1", title: "Măsurare Tensiune & Puls (Medical Measurements)", category: "Medical", status: false, completedAt: null, source: "Guided Procedures", isCustom: false },
            { id: "t-2", title: "Check-in Emoțional & Stare Mentală", category: "Mental Wellbeing", status: false, completedAt: null, source: "Self-Assessment", isCustom: false },
            { id: "t-3", title: "Hidratare & Verificare Obiectiv Apă (2.5L)", category: "Nutrition", status: false, completedAt: null, source: "Nutrition Log", isCustom: false },
            { id: "t-4", title: "Antrenament Fizic Rezistență (ARED)", category: "Physical Activity", status: false, completedAt: null, source: "Exercise Module", isCustom: false },
            { id: "t-5", title: "Verificare Durată & Calitate Somn Anterior", category: "Sleep & Recovery", status: true, completedAt: "06:30 UTC", source: "Sleep Module", isCustom: false },
            { id: "t-6", title: "Verificare Alerte Active de Mediu / Sistem", category: "Active Alerts", status: false, completedAt: null, source: "Environment Monitor", isCustom: false }
        ];

        localStorage.setItem(`${this.storageKey}_${this.currentAstronautId}_${todayStr}`, JSON.stringify(defaultTasks));
        return defaultTasks;
    }

    saveTasks(tasks) {
        const todayStr = new Date().toISOString().substring(0, 10);
        localStorage.setItem(`${this.storageKey}_${this.currentAstronautId}_${todayStr}`, JSON.stringify(tasks));
    }

    toggleTask(taskId) {
        const tasks = this.getTodayTasks();
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.status = !task.status;
            task.completedAt = task.status ? new Date().toISOString().replace('T', ' ').substring(0, 19) + " UTC" : null;
            this.saveTasks(tasks);
            this.renderAll();
        }
    }

    deleteTask(taskId) {
        let tasks = this.getTodayTasks();
        tasks = tasks.filter(t => t.id !== taskId);
        this.saveTasks(tasks);
        this.renderAll();
    }

    handleAddCustomTask() {
        const titleInput = document.getElementById("customTaskTitle");
        const categorySelect = document.getElementById("customTaskCategory");

        const newTask = {
            id: "custom-" + Date.now(),
            title: titleInput.value.trim(),
            category: categorySelect.value,
            status: false,
            completedAt: null,
            source: "Personalized",
            isCustom: true
        };

        const tasks = this.getTodayTasks();
        tasks.push(newTask);
        this.saveTasks(tasks);

        titleInput.value = "";
        this.renderAll();
    }

    saveEmotionalCheckin() {
        const mood = document.getElementById("checkinMood").value;
        const stress = document.getElementById("checkinStress").value;
        alert(`Check-in emoțional înregistrat: Dispoziție [${mood}], Stres [${stress}]. Salvat local.`);

        const tasks = this.getTodayTasks();
        const mentalTask = tasks.find(t => t.id === "t-2");
        if (mentalTask) {
            mentalTask.status = true;
            mentalTask.completedAt = new Date().toISOString().replace('T', ' ').substring(0, 19) + " UTC";
            this.saveTasks(tasks);
        }
        this.renderAll();
    }

    renderAll() {
        const tasks = this.getTodayTasks();
        const completedCount = tasks.filter(t => t.status).length;
        const totalCount = tasks.length;
        const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

        document.getElementById("progressPercentageVal").textContent = `${pct}% Complete`;
        document.getElementById("progressBarFill").style.width = `${pct}%`;

        const msgEl = document.getElementById("progressMessage");
        if (pct === 100) {
            msgEl.textContent = "Mission accomplished for today! Outstanding routine.";
        } else if (pct >= 50) {
            msgEl.textContent = "You have completed most of today's activities. Keep going!";
        } else {
            msgEl.textContent = "Great start! Keep following your health routine.";
        }

        const container = document.getElementById("tasksContainer");
        if (container) {
            container.innerHTML = "";
            tasks.forEach(t => {
                const row = document.createElement("div");
                row.className = `checklist-item ${t.status ? 'done' : ''}`;
                row.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 12px; flex-grow: 1;">
                            <input type="checkbox" ${t.status ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--accent-green); cursor: pointer;" data-id="${escapeHtml(t.id)}">
                        <div>
                            <span class="task-title" style="font-weight: bold; color: var(--text-main);">${escapeHtml(t.title)}</span>
                            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                                Categorie: ${escapeHtml(t.category)} | Sursă: ${escapeHtml(t.source)} ${t.isCustom ? '⭐ [Personalizat]' : ''} ${t.completedAt ? '| Finalizat la: ' + escapeHtml(t.completedAt) : ''}
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span style="font-size: 0.75rem; font-weight: bold; color: ${t.status ? 'var(--accent-green)' : 'var(--accent-yellow)'};">
                            ${t.status ? 'DONE' : 'PENDING'}
                        </span>
                        ${t.isCustom ? `<button class="delete-btn" style="background: none; border: none; color: var(--accent-red); cursor: pointer; font-size: 0.85rem;" title="Șterge obiectiv">🗑️</button>` : ''}
                    </div>
                `;

                row.querySelector("input[type='checkbox']").addEventListener("change", () => {
                    this.toggleTask(t.id);
                });

                if (t.isCustom) {
                    row.querySelector(".delete-btn").addEventListener("click", () => {
                        this.deleteTask(t.id);
                    });
                }

                container.appendChild(row);
            });
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.checklistManager = new ChecklistManager();
});
