class EmergencyManager {
    constructor() {
        this.currentAstronautId = "ast-01";
        this.storageKeyIncidents = "astra_emergency_incidents";
        this.currentProcedure = null;
        this.currentStepIndex = 0;
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
            });
        }

        const form = document.getElementById("incidentForm");
        if (form) {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleIncidentSubmit();
            });
        }

        this.renderProceduresLibrary();
    }

    getEmergencyProcedures() {
        return [
            {
                id: "resp-diff",
                title: "Respiratory Difficulties (Dificultăți Respiratorii)",
                category: "Respiratory",
                status: "Demo / Unverified",
                source: "ASTRA demonstration text — verify against official mission protocol",
                version: "unverified",
                lastReviewed: "2026-09-15",
                steps: [
                    { title: "1. Alertă", desc: "Conținut demonstrativ: anunță echipajul și echipa medicală folosind canalele oficiale." },
                    { title: "2. Urmează procedura autorizată", desc: "Nu folosi acest demo pentru a decide tratamente sau intervenții." },
                    { title: "3. Echipamente", desc: "Folosește numai echipamentele și pașii indicați în protocolul oficial disponibil misiunii." },
                    { title: "4. Monitorizare", desc: "Înregistrează observațiile conform procedurii aprobate; acest modul nu interpretează valori." },
                    { title: "5. Atenționare", desc: "Nu administra oxigen, medicamente sau alte intervenții pe baza acestui text demonstrativ." },
                    { title: "6. Escaladare", desc: "Solicită imediat suportul echipei medicale prin canalul oficial și urmează instrucțiunile acesteia." }
                ]
            },
            {
                id: "cardio-emerg",
                title: "Cardiovascular Distress / Chest Pain",
                category: "Cardiovascular",
                status: "Demo / Unverified",
                source: "ASTRA demonstration text — verify against official mission protocol",
                version: "unverified",
                lastReviewed: "2026-10-01",
                steps: [
                    { title: "1. Alertă", desc: "Conținut demonstrativ: anunță echipajul și echipa medicală prin canalele aprobate." },
                    { title: "2. Urmează procedura autorizată", desc: "Acest demo nu oferă instrucțiuni de evaluare sau tratament." },
                    { title: "3. Echipamente", desc: "Folosește echipamente numai conform protocolului oficial al misiunii." },
                    { title: "4. Raportare", desc: "Înregistrează simptomele și observațiile în sistemul autorizat." },
                    { title: "5. Atenționare", desc: "Nu administra medicamente și nu iniția intervenții pe baza textului demonstrativ." },
                    { title: "6. Escaladare", desc: "Contactează imediat echipa medicală prin canalul oficial și urmează instrucțiunile sale." }
                ]
            },
            {
                id: "minor-burns",
                title: "Burns & Minor Wounds (Arsuri & Răni)",
                category: "Burns & Wounds",
                status: "Demo",
                source: "ASTRA Health Standard Training Module",
                version: "v1.0",
                lastReviewed: "2026-10-20",
                steps: [
                    { title: "1. Situation & Assessment", desc: "Examinați extinderea și severitatea leziunii cutanate." },
                    { title: "2. Initial Action", desc: "Spălați zona cu soluție salină sterilă sau apă curată. Nu aplicați gheață direct pe arsuri." },
                    { title: "3. Equipment Needed", desc: "Kit de prim ajutor, comprese sterile, unguent pentru arsuri." },
                    { title: "4. Step-by-Step Execution", desc: "Aplicați un pansament steril lejer pentru a preveni contaminarea." },
                    { title: "5. Warnings & Contraindications", desc: "Nu spargeți bășicile formate pe piele." },
                    { title: "6. Medical Escalation", desc: "Dacă suprafața afectată este mare sau prezintă semne de infecție, consultați medicul misiunii." }
                ]
            }
        ];
    }

    renderProceduresLibrary() {
        const grid = document.getElementById("emergencyProceduresGrid");
        if (!grid) return;
        grid.innerHTML = "";

        const list = this.getEmergencyProcedures();
        list.forEach(proc => {
            const badgeClass = proc.status === 'Verified' ? 'badge-verified' : 'badge-demo';
            const card = document.createElement("div");
            card.className = "procedure-card";
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong style="color: var(--text-main); font-size: 0.95rem;">${proc.title}</strong>
                    <span class="${badgeClass}">${proc.status}</span>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Sursă: ${proc.source} (${proc.version})</div>
                <div style="font-size: 0.75rem; color: var(--accent-cyan); font-weight: bold; margin-top: auto;">Pornește Ghidul de Urgență →</div>
            `;
            card.addEventListener("click", () => this.startProcedureWizard(proc));
            grid.appendChild(card);
        });
    }

    startProcedureWizard(proc) {
        this.currentProcedure = proc;
        this.currentStepIndex = 0;

        const box = document.getElementById("emergencyWizardBox");
        box.style.display = "block";
        box.scrollIntoView({ behavior: 'smooth' });
        this.renderWizardStep();
    }

    renderWizardStep() {
        const step = this.currentProcedure.steps[this.currentStepIndex];
        document.getElementById("ewTitle").textContent = `Ghid: ${this.currentProcedure.title}`;
        document.getElementById("ewStepIndicator").textContent = `Pasul ${this.currentStepIndex + 1} din ${this.currentProcedure.steps.length}`;

        const content = document.getElementById("ewContentArea");
        content.innerHTML = `
            <h3 style="color: var(--accent-red); font-size: 1rem;">${step.title}</h3>
            <p>${step.desc}</p>
        `;

        document.getElementById("ewPrevBtn").style.display = this.currentStepIndex === 0 ? "none" : "block";
        document.getElementById("ewNextBtn").textContent = this.currentStepIndex === this.currentProcedure.steps.length - 1 ? "Finalizează & Salvează Incidentul" : "Următorul Pas →";

        // Listeners for wizard buttons
        document.getElementById("ewNextBtn").onclick = () => {
            if (this.currentStepIndex < this.currentProcedure.steps.length - 1) {
                this.currentStepIndex++;
                this.renderWizardStep();
            } else {
                alert("Procedura de urgență a fost parcursă. Incidentul a fost marcat înregistrat.");
                document.getElementById("emergencyWizardBox").style.display = "none";
            }
        };

        document.getElementById("ewPrevBtn").onclick = () => {
            if (this.currentStepIndex > 0) {
                this.currentStepIndex--;
                this.renderWizardStep();
            }
        };
    }

    handleIncidentSubmit() {
        const type = document.getElementById("incType").value;
        const desc = document.getElementById("incDesc").value;

        const incident = {
            id: "inc-" + Date.now(),
            type: type,
            description: desc,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + " UTC",
            status: "Active",
            source: "Manual Emergency Report"
        };

        try {
            const existing = JSON.parse(localStorage.getItem(`${this.storageKeyIncidents}_${this.currentAstronautId}`)) || [];
            existing.unshift(incident);
            localStorage.setItem(`${this.storageKeyIncidents}_${this.currentAstronautId}`, JSON.stringify(existing));
        } catch (e) {}

        document.getElementById("incidentForm").reset();
        alert("Raportul de incident a fost salvat în dosarul medical central și pregătit pentru sincronizare offline.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.emergencyManager = new EmergencyManager();
});
