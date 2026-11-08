class SelfAssessmentManager {
    constructor() {
        this.currentAstronautId = "ast-01";
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

        const startBtn = document.getElementById("startNewBtn");
        const formContainer = document.getElementById("assessmentFormContainer");
        if (startBtn && formContainer) {
            startBtn.addEventListener("click", () => {
                formContainer.style.display = formContainer.style.display === "none" ? "block" : "none";
                formContainer.scrollIntoView({ behavior: 'smooth' });
            });
        }

        document.querySelectorAll("input[name='symptom']").forEach(cb => {
            cb.addEventListener("change", () => this.checkEmergencySymptoms());
        });

        const form = document.getElementById("selfAssessmentForm");
        if (form) {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleSubmitAssessment();
            });
        }

        const backBtn = document.getElementById("backToAssessmentListBtn");
        if (backBtn) {
            backBtn.addEventListener("click", () => {
                document.getElementById("assessmentSummaryContainer").style.display = "none";
            });
        }

        this.renderHistory();
    }

    checkEmergencySymptoms() {
        const checked = Array.from(document.querySelectorAll("input[name='symptom']:checked")).map(cb => cb.value);
        const banner = document.getElementById("emergencyBanner");
        const hasEmergency = checked.includes("Chest discomfort") || checked.includes("Shortness of breath");
        if (banner) banner.style.display = hasEmergency ? "block" : "none";
    }

    handleSubmitAssessment() {
        const formData = {
            vitals: {
                heartRate: document.getElementById("inputHeartRate").value || null,
                sysBP: document.getElementById("inputSysBP").value || null,
                diaBP: document.getElementById("inputDiaBP").value || null,
                temperature: document.getElementById("inputTemp").value || null,
                glucose: document.getElementById("inputGlucose").value || null
            },
            sleep: {
                hours: document.getElementById("inputSleepHours").value || null,
                quality: document.getElementById("inputSleepQuality").value,
                interruptions: document.getElementById("inputSleepInterruptions").value || 0,
                fatigue: document.getElementById("inputFatigue").value
            },
            wellbeing: {
                mood: document.getElementById("inputMood").value,
                stress: document.getElementById("inputStress").value,
                motivation: document.getElementById("inputMotivation").value,
                notes: document.getElementById("inputNotes").value || ""
            },
            symptoms: {
                severity: document.getElementById("inputSeverity").value,
                duration: document.getElementById("inputDuration").value || "",
                list: Array.from(document.querySelectorAll("input[name='symptom']:checked")).map(cb => cb.value)
            }
        };

        const evaluation = this.evaluateAssessment(formData);
        formData.status = evaluation.status;
        formData.recommendations = evaluation.recommendations;

        // Salvare locală sigură prin modulul storage
        const result = assessmentStorage.saveAssessment(this.currentAstronautId, formData);

        if (result.success) {
            document.getElementById("assessmentFormContainer").style.display = "none";
            this.renderSummary(result.data);
            this.renderHistory();
            document.getElementById("selfAssessmentForm").reset();
        } else {
            alert("Eroare la salvarea locală a evaluării.");
        }
    }

    evaluateAssessment(data) {
        let status = "Normal / No immediate concern";
        const recs = [];
        const hasEmergency = data.symptoms.list.includes("Chest discomfort") || data.symptoms.list.includes("Shortness of breath");
        const highStress = data.wellbeing.stress === "High" || data.wellbeing.stress === "Very High";
        const poorSleep = data.sleep.hours && parseFloat(data.sleep.hours) < 6;

        if (hasEmergency || data.symptoms.severity === "Severe") {
            status = "Urgent – Follow Mission Medical Protocol";
            recs.push({ title: "Protocol Medical de Urgență", desc: "Contactați imediat chirurgul de zbor.", reason: "Simptome critice raportate." });
        } else if (highStress || poorSleep || data.symptoms.list.length > 0) {
            status = "Attention Recommended";
            recs.push({ title: "Optimizare Odihnă & Stres", desc: "Se recomandă sesiuni de relaxare și somn suplimentar.", reason: "Factori de risc detectați." });
        } else {
            recs.push({ title: "Menținere Rutină", desc: "Parametri în limite nominale.", reason: "Fără abateri." });
        }
        return { status, recommendations: recs };
    }

    renderSummary(data) {
        const container = document.getElementById("summaryContentBody");
        const badge = document.getElementById("summaryStatusBadge");
        const summaryBox = document.getElementById("assessmentSummaryContainer");

        if (!container || !summaryBox) return;

        badge.textContent = data.status.toUpperCase();
        badge.style.color = data.status.includes("Urgent") ? "var(--accent-red)" : data.status.includes("Attention") ? "var(--accent-yellow)" : "var(--accent-green)";

        let recHtml = (data.recommendations || []).map(r => `
            <div style="background: var(--bg-primary); padding: 10px; border-radius: 4px; border-left: 3px solid var(--accent-cyan);">
                <strong>${escapeHtml(r.title)}</strong>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">${escapeHtml(r.desc)}</p>
            </div>
        `).join('');

        let symptomsHtml = (data.symptoms.list && data.symptoms.list.length > 0) ? data.symptoms.list.join(', ') : "Niciun simptom selectat.";

        container.innerHTML = `
            <div style="font-size: 0.81rem; color: var(--accent-cyan); font-family: var(--font-tech);">ID Unic: ${escapeHtml(data.id)} | Salvat la: ${escapeHtml(data.createdAt)}</div>
            <div class="form-grid" style="margin-top: 5px;">
                <div class="summary-card">
                    <div style="font-size: 0.75rem; color: var(--text-muted);">Semne Vitale</div>
                    <div style="font-size: 0.9rem; margin-top: 4px;">Puls: ${escapeHtml(data.vitals.heartRate || '-')} BPM | Tensiune: ${escapeHtml(data.vitals.sysBP || '-')}/${escapeHtml(data.vitals.diaBP || '-')} mmHg</div>
                </div>
                <div class="summary-card">
                    <div style="font-size: 0.75rem; color: var(--text-muted);">Somn & Emoțional</div>
                    <div style="font-size: 0.9rem; margin-top: 4px;">Somn: ${escapeHtml(data.sleep.hours || '-')}h | Stres: ${escapeHtml(data.wellbeing.stress)}</div>
                </div>
            </div>
            <div class="summary-card">
                <div style="font-size: 0.75rem; color: var(--text-muted);">Simptome Raportate</div>
                <div style="font-size: 0.9rem; margin-top: 4px; color: var(--accent-yellow);">${escapeHtml(symptomsHtml)}</div>
            </div>
            <div style="font-weight: bold; font-size: 0.9rem; margin-top: 5px; color: var(--text-main);">Recomandări:</div>
            <div style="display: flex; flex-direction: column; gap: 8px;">${recHtml}</div>
        `;

        summaryBox.style.display = "block";
        summaryBox.scrollIntoView({ behavior: 'smooth' });
    }

    renderHistory(activeId = null) {
        const assessments = assessmentStorage.getAssessments(this.currentAstronautId);
        const container = document.getElementById("historyListContainer");
        const timeEl = document.getElementById("lastAssessmentTime");
        const badgeCount = document.getElementById("storageCountBadge");

        if (badgeCount) badgeCount.textContent = `${assessments.length} salvate local`;
        if (assessments.length > 0 && timeEl) {
            timeEl.textContent = assessments[0].createdAt;
        } else if (timeEl) {
            timeEl.textContent = "Niciuna";
        }

        if (!container) return;
        if (assessments.length === 0) {
            container.innerHTML = `<div style="font-size: 0.85rem; color: var(--text-muted);">Nicio evaluare salvată local momentan. Apăsați pe "Start New Assessment" pentru a crea una.</div>`;
            return;
        }

        container.innerHTML = "";
        assessments.forEach((item, idx) => {
            const isActive = item.id === activeId;
            const row = document.createElement("div");
            row.className = "history-row";

            // Dacă este deschis, evidențiem cardul cu o bordură cyan și schimbăm textul în "Închide Detalii"
            if (isActive) {
                row.style.borderColor = "var(--accent-cyan)";
                row.style.background = "rgba(0, 240, 255, 0.05)";
            }

            row.innerHTML = `
                <div>
                    <strong>#${assessments.length - idx} – ${escapeHtml(item.createdAt)}</strong>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Status: <span style="color: var(--accent-cyan);">${escapeHtml(item.status)}</span></div>
                </div>
                <div style="font-size: 0.8rem; font-weight: bold; color: ${isActive ? 'var(--accent-cyan)' : 'var(--text-muted)'};">
                    ${isActive ? 'Închide Detalii ▲' : 'Click pentru detalii →'}
                </div>
            `;

            row.addEventListener("click", () => {
                const summaryBox = document.getElementById("assessmentSummaryContainer");

                // Dacă dă click pe același element activ, închidem detaliile
                if (isActive && summaryBox.style.display === "block") {
                    summaryBox.style.display = "none";
                    this.renderHistory(null); // Resetează starea vizuală din istoric
                } else {
                    this.renderSummary(item);
                    this.renderHistory(item.id); // Re-rindează istoricul pentru a muta butonul "Închide Detalii" pe rândul selectat
                }
            });

            container.appendChild(row);
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.selfAssessmentManager = new SelfAssessmentManager();
});
