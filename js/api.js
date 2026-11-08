const API_BASE_URL = "http://localhost:8080/api";

class ApiService {
    constructor() {
        try { this.isApiMode = localStorage.getItem("astra_api_mode") === "true"; }
        catch (error) { this.isApiMode = false; console.warn("[ASTRA] API mode preference could not be loaded", error); }
    }

    setMode(apiMode) {
        this.isApiMode = apiMode;
        try { localStorage.setItem("astra_api_mode", String(apiMode)); }
        catch (error) { console.warn("[ASTRA] API mode preference could not be saved", error); }
        document.querySelectorAll("#apiModeToggle, #settingsApiToggle").forEach((toggle) => { toggle.checked = apiMode; });
        console.log(`[ASTRA] System operating mode switched to: ${this.isApiMode ? 'API MODE (Spring Boot)' : 'DEMO MODE (Local)'}`);
    }

    async getAstronauts() {
        if (!this.isApiMode) {
            return DEMO_DATA.astronauts;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/astronauts`);
            if (!response.ok) throw new Error("Failed to fetch astronauts from Spring Boot API");
            return await response.json();
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    }

    async getVitals(astronautId) {
        if (!this.isApiMode) {
            return DEMO_DATA.vitals[astronautId] || DEMO_DATA.vitals["ast-01"];
        }
        try {
            const response = await fetch(`${API_BASE_URL}/astronauts/${encodeURIComponent(astronautId)}/vitals`);
            if (!response.ok) throw new Error("Failed to fetch vitals");
            return await response.json();
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    }

    async getHistory(astronautId) {
        if (!this.isApiMode) {
            return DEMO_DATA.history;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/astronauts/${encodeURIComponent(astronautId)}/history`);
            if (!response.ok) throw new Error("Failed to fetch history");
            return await response.json();
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    }

    async getAlerts(astronautId) {
        if (!this.isApiMode) {
            return DEMO_DATA.alerts;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/astronauts/${encodeURIComponent(astronautId)}/alerts`);
            if (!response.ok) throw new Error("Failed to fetch alerts");
            return await response.json();
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    }

    async postVitals(astronautId, vitalData) {
        if (!this.isApiMode) {
            console.log("[DEMO MODE] Vital data recorded locally:", vitalData);
            return { success: true, message: "Recorded in DEMO mode" };
        }
        try {
            const response = await fetch(`${API_BASE_URL}/astronauts/${encodeURIComponent(astronautId)}/vitals`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(vitalData)
            });
            if (!response.ok) throw new Error("Failed to post vitals");
            return await response.json();
        } catch (error) {
            console.error("API Error:", error);
            return { success: false, error: error.message };
        }
    }

}

const apiService = new ApiService();

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("#apiModeToggle, #settingsApiToggle").forEach((toggle) => {
        toggle.checked = apiService.isApiMode;
        toggle.addEventListener("change", () => apiService.setMode(toggle.checked));
    });
});
