class OfflineManager {
    constructor() {
        this.currentAstronautId = "ast-01";
        this.storageKeyLogs = "astra_offline_activity_logs";
        this.storageKeyQueue = "astra_sync_queue";
        this.isSimulatedOffline = false;
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

        // Network listeners
        window.addEventListener('online', () => this.updateNetworkStatus(true));
        window.addEventListener('offline', () => this.updateNetworkStatus(false));

        document.getElementById("syncNowBtn")?.addEventListener("click", () => this.triggerSync());
        document.getElementById("toggleNetworkBtn")?.addEventListener("click", () => this.toggleSimulatedOffline());

        this.logActivity("Sistemul de autonomie offline a fost inițializat cu succes.");
        this.renderAll();
    }

    getSyncQueue() {
        try {
            const data = localStorage.getItem(`${this.storageKeyQueue}_${this.currentAstronautId}`);
            if (!data) {
                // Initial demo queue items
                const defaultQueue = [
                    { id: "sync-1", type: "Blood Pressure (demo)", val: "120/80 mmHg", timestamp: "Exemplu demonstrativ", status: "pending_sync", demo: true },
                    { id: "sync-2", type: "Symptom Report (demo)", val: "Intensitate 4/10", timestamp: "Exemplu demonstrativ", status: "pending_sync", demo: true },
                    { id: "sync-3", type: "Daily Health Checklist (demo)", val: "75% completat", timestamp: "Exemplu demonstrativ", status: "pending_sync", demo: true }
                ];
                localStorage.setItem(`${this.storageKeyQueue}_${this.currentAstronautId}`, JSON.stringify(defaultQueue));
                return defaultQueue;
            }
            return JSON.parse(data);
        } catch (e) {
            return [];
        }
    }

    saveSyncQueue(queue) {
        localStorage.setItem(`${this.storageKeyQueue}_${this.currentAstronautId}`, JSON.stringify(queue));
    }

    getActivityLogs() {
        try {
            const data = localStorage.getItem(`${this.storageKeyLogs}_${this.currentAstronautId}`);
            if (!data) return [
                { time: "08:30 UTC", text: "Blood pressure measurement saved locally [Saved Locally / Pending Sync].", state: "pending" },
                { time: "10:15 UTC", text: "Symptom report created in offline mode.", state: "pending" },
                { time: "11:30 UTC", text: "Health checklist updated locally.", state: "pending" }
            ];
            return JSON.parse(data);
        } catch (e) {
            return [];
        }
    }

    logActivity(text) {
        const logs = this.getActivityLogs();
        const timeStr = new Date().toISOString().replace('T', ' ').substring(11, 19) + " UTC";
        logs.unshift({ time: timeStr, text: text, state: "info" });
        localStorage.setItem(`${this.storageKeyLogs}_${this.currentAstronautId}`, JSON.stringify(logs));
        this.renderActivityLogs();
    }

    toggleSimulatedOffline() {
        this.isSimulatedOffline = !this.isSimulatedOffline;
        this.updateNetworkStatus(!this.isSimulatedOffline);
        this.logActivity(this.isSimulatedOffline ? "Simulare: Conexiunea cu Pământul a fost întreruptă (Mod Offline activat)." : "Simulare: Conexiunea cu Pământul a fost restabilită.");
    }

    updateNetworkStatus(isOnline) {
        const badge = document.getElementById("connectionBadge");
        if (!badge) return;

        if (isOnline && !this.isSimulatedOffline) {
            badge.className = "status-badge status-online";
            badge.textContent = "ONLINE / LINK ACTIVE";
        } else {
            badge.className = "status-badge status-offline";
            badge.textContent = "OFFLINE / MISSION AUTONOMY";
        }
    }

    triggerSync() {
        if (this.isSimulatedOffline) {
            alert("Eroare de sincronizare: Dispozitivul este în mod Offline / Fără conexiune la server.");
            this.logActivity("Tentativă eșuată de sincronizare: Lipsă conexiune server.");
            return;
        }

        this.logActivity("Sincronizarea nu a pornit: endpoint-ul de sincronizare nu este configurat.");
        alert("Sincronizarea cu serverul nu este implementată încă. Coada a rămas salvată local și în așteptare.");
    }

    renderAll() {
        this.renderStatusOverview();
        this.renderLibrary();
        this.renderEmergency();
        this.renderLocalRecords();
        this.renderActivityLogs();
    }

    renderStatusOverview() {
        const queue = this.getSyncQueue();
        const pending = queue.filter(q => q.status === "pending_sync").length;
        document.getElementById("pendingSyncCount").textContent = `${pending} elemente`;
    }

    renderLibrary() {
        const container = document.getElementById("offlineLibraryContainer");
        if (!container) return;
        container.innerHTML = `
            <div class="log-row"><div><strong>1. Basic Medical Procedures</strong><div style="font-size:0.75rem; color:var(--text-muted);">Text demonstrativ inclus în aplicație</div></div><span class="badge-local">DEMO</span></div>
            <div class="log-row"><div><strong>2. Vital Signs Measurement</strong><div style="font-size:0.75rem; color:var(--text-muted);">Text demonstrativ inclus în aplicație</div></div><span class="badge-local">DEMO</span></div>
            <div class="log-row"><div><strong>3. Hygiene & Infection Prevention</strong><div style="font-size:0.75rem; color:var(--text-muted);">Text demonstrativ inclus în aplicație</div></div><span class="badge-local">DEMO</span></div>
        `;
    }

    renderEmergency() {
        const container = document.getElementById("emergencyProceduresContainer");
        if (!container) return;
        container.innerHTML = `
            <div class="log-row" style="border-left: 3px solid var(--accent-red);"><div><strong>Respiratory Difficulties</strong><div style="font-size:0.75rem; color:var(--text-muted);">Protocol de urgență offline</div></div><span class="badge-synced">READY</span></div>
            <div class="log-row" style="border-left: 3px solid var(--accent-orange);"><div><strong>Minor Burns & Wound Care</strong><div style="font-size:0.75rem; color:var(--text-muted);">Protocol de urgență offline</div></div><span class="badge-synced">READY</span></div>
        `;
    }

    renderLocalRecords() {
        const container = document.getElementById("localRecordsList");
        if (!container) return;
        const queue = this.getSyncQueue();
        container.innerHTML = "";

        queue.forEach(item => {
            const badgeClass = item.status === "synced" ? "badge-synced" : "badge-pending";
            const badgeText = item.status === "synced" ? "SYNCED (Pe Server)" : "PENDING SYNC (Salvat Local)";
            const div = document.createElement("div");
            div.className = "log-row";
            div.innerHTML = `
                <div>
                    <strong>${item.type}</strong>: <span style="color:var(--accent-cyan);">${item.val}</span>
                    <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">Timestamp: ${item.timestamp}</div>
                </div>
                <span class="${badgeClass}">${badgeText}</span>
            `;
            container.appendChild(div);
        });
    }

    renderActivityLogs() {
        const container = document.getElementById("offlineActivityLogContainer");
        if (!container) return;
        const logs = this.getActivityLogs();
        container.innerHTML = "";

        logs.forEach(l => {
            const div = document.createElement("div");
            div.className = "log-row";
            div.innerHTML = `
                <div><strong>${escapeHtml(l.time)}</strong> – ${escapeHtml(l.text)}</div>
                <span class="badge-local">OFFLINE LOG</span>
            `;
            container.appendChild(div);
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.offlineManager = new OfflineManager();
});
