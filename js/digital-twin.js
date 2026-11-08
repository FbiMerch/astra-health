class DigitalTwinManager {
    constructor() {
        this.infoContainer = document.getElementById("twinInfo") || document.getElementById("twinAlertsStatus");
        this.initListeners();
    }

    initListeners() {
        const nodes = document.querySelectorAll(".twin-node");
        nodes.forEach(node => {
            node.addEventListener("click", (e) => {
                const partKey = e.target.getAttribute("data-part");
                this.displayPartInfo(partKey);
            });
        });
    }

    displayPartInfo(partKey) {
        const partData = DEMO_DATA.twinBodyParts[partKey];
        if (!partData) return;

        if (this.infoContainer) {
            this.infoContainer.innerHTML = `
                <div style="background: var(--bg-card); padding: 12px; border-radius: 6px; border-left: 3px solid var(--accent-cyan); text-align: left;">
                    <strong style="font-size: 1rem; color: var(--accent-cyan);">${partData.name}</strong><br><br>
                    Status: <span style="color: var(--accent-green); font-weight: bold;">${partData.status}</span><br><br>
                    <em>Pericol spațial:</em> ${partData.risk}<br><br>
                    <em>Protocol recomandat:</em> ${partData.advice}
                </div>
            `;
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.digitalTwinManager = new DigitalTwinManager();
});
