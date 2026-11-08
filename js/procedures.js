class ProceduresManager {
    constructor() {
        this.currentAstronautId = "ast-01";
        this.storageKey = "astra_guided_procedures_history";
        this.currentProcedure = null;
        this.currentWizardStep = 1;
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
                this.renderHistory();
            });
        }

        this.renderLibrary();
        this.initWizardListeners();
        this.initPracticeMode();
        this.renderHistory();
    }

    getProceduresLibrary() {
        return [
            {
                id: "bp",
                title: "Blood Pressure Measurement",
                icon: "🩺",
                desc: "Ghid complet pentru utilizarea tensiometrului digital și interpretarea sistolică/diastolică.",
                steps: {
                    1: "Așezați-vă în repaus timp de 5 minute. Nu vorbiți și evitați mișcările bruște.",
                    2: "Verificați bateria tensiometrului digital și integritatea furtunului/manșonului.",
                    3: "Poziționați manșonul direct pe braț, la nivelul inimii, la 2-3 cm deasupra cotului.",
                    4: "Porniți dispozitivul și lăsați-l să umfle manșonul automat până la finalizarea citirii.",
                    5: "Introduceți valorile obținute în format Sistolic/Diastolic (ex: 120/80).",
                    6: "Valorile normale orientative se situează sub 120/80 mmHg. Valori repetat peste 140/90 necesită atenție."
                }
            },
            {
                id: "hr",
                title: "Heart Rate / Pulse Measurement",
                icon: "❤️",
                desc: "Verificarea pulsului prin pulsoximetru sau palpare directă.",
                steps: {
                    1: "Relaxați-vă brațul pe o suprafață stabilă. Respirați lent și adânc.",
                    2: "Pregătiți pulsoximetru de deget sau folosiți cele două degete (arătător și mediu) pe încheietură.",
                    3: "Poziționați corect pulsoximetrul pe degetul arătător, fără lac de unghii.",
                    4: "Așteptați 10-15 secunde până când semnalul se stabilizează pe ecran.",
                    5: "Notați valoarea bătăilor pe minut (BPM) afișată.",
                    6: "Pulsul normal în repaus este între 60 și 100 BPM. Variațiile mari pot indica oboseală sau stres."
                }
            },
            {
                id: "temp",
                title: "Body Temperature Measurement",
                icon: "🌡️",
                desc: "Utilizarea termometrului infraroșu sau timpanic pentru evaluarea termică.",
                steps: {
                    1: "Asigurați-vă că zona de contact sau fruntea este uscată și curată.",
                    2: "Porniți termometrul și verificați calibrarea sau modul de măsurare selectat.",
                    3: "Aplicați senzorul conform instrucțiunilor (frunte sau canal auditiv).",
                    4: "Apăsați butonul de măsurare și mențineți nemișcat până la semnalul sonor.",
                    5: "Înregistrați valoarea în grade Celsius (°C).",
                    6: "Temperatura normală se situează între 36.1°C și 37.2°C. Peste 38°C reprezintă febră."
                }
            },
            {
                id: "glucose",
                title: "Blood Glucose Measurement (Opțional)",
                icon: "🩸",
                desc: "Protocol de măsurare a glicemiei capilare conform cerințelor medicale.",
                steps: {
                    1: "Spălați și dezinfectați mâna pe care o veți folosi pentru recoltare.",
                    2: "Pregătiți glucometrul, introduceți o bandeletă nouă și pregătiți dispozitivul de înțepare.",
                    3: "Înțepați lateralul vârfului degetului pentru a obține o picătură mică de sânge.",
                    4: "Aplicați picătura pe bandeleta glucometrului.",
                    5: "Citiți valoarea afișată în mg/dL și notați-o în jurnal.",
                    6: "Valoarea a jeun normală este între 70 și 99 mg/dL. Raportați orice abatere severă."
                }
            }
        ];
    }

    renderLibrary() {
        const grid = document.getElementById("proceduresLibraryGrid");
        if (!grid) return;
        grid.innerHTML = "";

        const lib = this.getProceduresLibrary();
        lib.forEach(proc => {
            const card = document.createElement("div");
            card.className = "procedure-card";
            card.innerHTML = `
                <div style="font-size: 1.2rem;">${proc.icon} <strong style="color: var(--text-main); font-size: 0.95rem;">${proc.title}</strong></div>
                <p style="font-size: 0.8rem; color: var(--text-muted);">${proc.desc}</p>
                <div style="font-size: 0.75rem; color: var(--accent-cyan); font-weight: bold; margin-top: auto;">Pornește Ghidul Pas cu Pas →</div>
            `;
            card.addEventListener("click", () => this.startWizard(proc));
            grid.appendChild(card);
        });
    }

    startWizard(proc) {
        this.currentProcedure = proc;
        this.currentWizardStep = 1;

        document.getElementById("wizardTitle").textContent = `Ghid: ${proc.title}`;
        document.getElementById("step1Desc").textContent = proc.steps[1];
        document.getElementById("step2Desc").textContent = proc.steps[2];
        document.getElementById("step3Desc").textContent = proc.steps[3];

        document.getElementById("wizardContainer").style.display = "block";
        document.getElementById("wizardContainer").scrollIntoView({ behavior: 'smooth' });
        this.updateWizardView();
    }

    initWizardListeners() {
        document.getElementById("wizardNextBtn").addEventListener("click", () => {
            if (this.currentWizardStep < 6) {
                this.currentWizardStep++;
                if (this.currentWizardStep === 6) {
                    const val = document.getElementById("wizardResultInput").value || "N/A";
                    document.getElementById("wizardInterpretationResult").textContent =
                        `Măsurătoria pentru ${this.currentProcedure.title} cu valoarea [${val}] a fost evaluată conform ghidului. Nicio anomelie critică detectată.`;
                    this.saveProcedureResult(this.currentProcedure.title, val);
                }
                this.updateWizardView();
            } else {
                document.getElementById("wizardContainer").style.display = "none";
            }
        });

        document.getElementById("wizardPrevBtn").addEventListener("click", () => {
            if (this.currentWizardStep > 1) {
                this.currentWizardStep--;
                this.updateWizardView();
            }
        });
    }

    updateWizardView() {
        document.querySelectorAll(".wizard-step").forEach(el => {
            const stepNum = parseInt(el.getAttribute("data-step"));
            if (stepNum === this.currentWizardStep) {
                el.classList.add("active");
            } else {
                el.classList.remove("active");
            }
        });
        document.getElementById("wizardProgressIndicator").textContent = `Pasul ${this.currentWizardStep} din 6`;
        document.getElementById("wizardNextBtn").textContent = this.currentWizardStep === 6 ? "Finalizează & Salvează" : "Următorul →";
    }

    saveProcedureResult(title, resultVal) {
        try {
            const history = this.getHistory();
            const entry = {
                id: "proc-" + Date.now(),
                title: title,
                result: resultVal,
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + " UTC",
                source: "GUIDED PROCEDURE"
            };
            history.unshift(entry);
            localStorage.setItem(`${this.storageKey}_${this.currentAstronautId}`, JSON.stringify(history));
            this.renderHistory();
        } catch (e) {
            console.error("Eroare salvare istoric procedură:", e);
        }
    }

    getHistory() {
        try {
            const data = localStorage.getItem(`${this.storageKey}_${this.currentAstronautId}`);
            if (!data) return [];
            return JSON.parse(data);
        } catch (e) {
            return [];
        }
    }

    renderHistory() {
        const history = this.getHistory();
        const container = document.getElementById("proceduresHistoryList");
        if (!container) return;

        if (history.length === 0) {
            container.innerHTML = `<div style="font-size: 0.85rem; color: var(--text-muted);">Nicio măsurătoare salvată prin ghid.</div>`;
            return;
        }

        container.innerHTML = "";
        history.forEach((item, idx) => {
            const row = document.createElement("div");
            row.className = "history-row";
            row.innerHTML = `
                <div>
                    <strong>#${history.length - idx} – ${escapeHtml(item.title)}</strong>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Data: ${escapeHtml(item.timestamp)} | Sursă: ${escapeHtml(item.source)}</div>
                </div>
                <div style="font-size: 0.9rem; font-weight: bold; color: var(--accent-cyan);">Rezultat: ${escapeHtml(item.result)}</div>
            `;
            container.appendChild(row);
        });
    }

    initPracticeMode() {
        const modal = document.getElementById("practiceModal");
        const openBtn = document.getElementById("openPracticeModalBtn");
        const closeBtn = document.getElementById("closePracticeModalBtn");

        if (openBtn && modal) {
            openBtn.addEventListener("click", () => { modal.style.display = "flex"; });
        }
        if (closeBtn && modal) {
            closeBtn.addEventListener("click", () => { modal.style.display = "none"; });
        }

        document.querySelectorAll(".practice-choice").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const isCorrect = e.target.getAttribute("data-correct") === "true";
                const feedback = document.getElementById("practiceFeedback");
                if (isCorrect) {
                    feedback.style.color = "var(--accent-green)";
                    feedback.textContent = "✅ Corect! Poziționarea manșonului direct pe piele asigură acuratețea măsurătorii.";
                } else {
                    feedback.style.color = "var(--accent-red)";
                    feedback.textContent = "❌ Incorect. Hainele groase sau plasarea greșită denaturează valorile tensiunii.";
                }
            });
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.proceduresManager = new ProceduresManager();
});
