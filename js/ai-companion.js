class AICompanion {
    constructor() {
        this.chatBox = document.getElementById("chatContainer");
        this.input = document.getElementById("chatInput");
        this.sendBtn = document.getElementById("sendChatBtn");
        this.astronautSelect = document.getElementById("astronautSelect");
        if (this.sendBtn) this.sendBtn.dataset.maitriBound = "true";
        this.initListeners();
    }

    initListeners() {
        if (!this.sendBtn || !this.input || !this.chatBox) return;
        this.sendBtn.addEventListener("click", () => this.handleSend());
        this.input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") this.handleSend();
        });
    }

    handleSend() {
        const text = this.input.value.trim();
        if (!text) return;

        this.appendMessage(text, "user");
        this.input.value = "";

        setTimeout(() => {
            let reply = "Sunt un asistent demonstrativ cu răspunsuri prestabilite. Nu pot evalua starea medicală sau telemetria.";
            const lower = text.toLowerCase();
            if (lower.includes("alert") || lower.includes("status") || lower.includes("problem")) {
                const astronautId = this.astronautSelect?.value || "ast-01";
                try {
                    const alerts = JSON.parse(localStorage.getItem(`astra_smart_alerts_${astronautId}`) || "[]").filter((item) => item.status !== "RESOLVED");
                    reply = alerts.length ? `Jurnal local: ${alerts.length} alerte nerezolvate. Consultă Smart Alerts pentru sursă și detalii. Datele sunt demonstrative și nu reprezintă o evaluare medicală.` : "Nu există alerte înregistrate local pentru acest astronaut. Absența alertelor nu confirmă o stare medicală nominală.";
                } catch (error) {
                    reply = "Jurnalul local de alerte nu poate fi citit. Starea medicală nu poate fi dedusă.";
                }
            } else if (lower.includes("somn") || lower.includes("obosit")) {
                reply = "Nu am acces la o evaluare clinică a somnului. Consultă Sleep & Recovery și urmează planul misiunii.";
            } else if (lower.includes("radia")) {
                reply = "Nu există o conexiune la telemetrie de radiații în acest modul. Consultă Environment Monitoring și procedura oficială.";
            }
            this.appendMessage(reply, "system");
        }, 600);
    }

    appendMessage(text, sender) {
        const msgDiv = document.createElement("div");
        msgDiv.className = `ai-message ${sender}`;
        msgDiv.textContent = text;
        this.chatBox.appendChild(msgDiv);
        this.chatBox.scrollTop = this.chatBox.scrollHeight;
    }
}

const aiCompanion = new AICompanion();
