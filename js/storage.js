class AssessmentStorage {
    constructor() {
        this.storageKey = "astra_health_user_assessments";
    }

    // Preluarea sigură a evaluărilor din localStorage pentru astronautul curent
    getAssessments(astronautId) {
        try {
            const data = localStorage.getItem(`${this.storageKey}_${astronautId}`);
            if (!data) return [];
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error("[ASTRA Storage] Eroare la citirea din localStorage:", error);
            return [];
        }
    }

    // Salvarea unei noi evaluări cu ID unic și timestamp
    saveAssessment(astronautId, assessmentData) {
        try {
            const currentList = this.getAssessments(astronautId);

            // Corectat: .toString(36) aplicat corect înainte de .substring()
            const uniqueId = `assess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + " UTC";

            const payload = {
                id: uniqueId,
                astronautId: astronautId,
                createdAt: timestamp,
                ...assessmentData,
                syncedWithServer: false // Indicator clar de stocare locală
            };

            currentList.unshift(payload); // Cele mai noi primele
            localStorage.setItem(`${this.storageKey}_${astronautId}`, JSON.stringify(currentList));

            return { success: true, data: payload };
        } catch (error) {
            console.error("[ASTRA Storage] Eroare la scrierea în localStorage:", error);
            return { success: false, error: error.message };
        }
    }

    // Găsirea unei evaluări după ID pentru revizuire
    getAssessmentById(astronautId, assessmentId) {
        const list = this.getAssessments(astronautId);
        return list.find(item => item.id === assessmentId) || null;
    }
}

const assessmentStorage = new AssessmentStorage();