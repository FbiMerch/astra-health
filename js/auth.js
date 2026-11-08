/**
 * Local prototype authentication. This is an account-isolation aid for the demo,
 * not a security boundary; production identity and authorization belong on the API.
 */
class AuthService {
    constructor() {
        this.sessionKey = "astra_current_session";
        this.usersKey = "astra_registered_users";
        this.demoPassword = "ASTRA-Demo-2026!";
        this.initDemoUsers();
        this.installAccountStorageScope();
        this.checkAuthGuard();
    }

    initDemoUsers() {
        try {
            const saved = localStorage.getItem(this.usersKey);
            if (saved) {
                const existing = JSON.parse(saved);
                if (!Array.isArray(existing)) return;
                const trustedDemoRoles = { "usr-01": "ASTRONAUT", "usr-02": "MEDICAL_OFFICER", "usr-03": "MISSION_COMMANDER" };
                let migrated = false;
                existing.forEach((user) => {
                    if (typeof user.passwordHash === "string" && /^(demo_secure_hash_|simulated_hash_)/.test(user.passwordHash)) {
                        user.passwordHash = `demo:${user.id}`;
                        migrated = true;
                    }
                    if (!trustedDemoRoles[user.id] && user.role !== "ASTRONAUT") {
                        user.role = "ASTRONAUT";
                        migrated = true;
                    }
                    if (trustedDemoRoles[user.id] && user.role !== trustedDemoRoles[user.id]) {
                        user.role = trustedDemoRoles[user.id];
                        migrated = true;
                    }
                });
                if (migrated) localStorage.setItem(this.usersKey, JSON.stringify(existing));
                return;
            }
            const users = [
                { id: "usr-01", fullName: "Mihail Ertea", email: "mihailertea@gmail.com", passwordHash: "demo:usr-01", crewId: "ART-AX4-01", mission: "ARTEMIS-IV LUNAR BASE", role: "ASTRONAUT", status: "Active", registeredDate: "2026-10-15", avatar: "👨‍🚀" },
                { id: "usr-02", fullName: "Dr. Elena Vancea", email: "elena.vancea@astra.med", passwordHash: "demo:usr-02", crewId: "MED-MO-02", mission: "ARTEMIS-IV LUNAR BASE", role: "MEDICAL_OFFICER", status: "Active", registeredDate: "2026-10-10", avatar: "👩‍⚕️" },
                { id: "usr-03", fullName: "Cmdr. John Miller", email: "john.miller@astra.cmd", passwordHash: "demo:usr-03", crewId: "CMD-CC-03", mission: "ARTEMIS-IV LUNAR BASE", role: "MISSION_COMMANDER", status: "Active", registeredDate: "2026-10-01", avatar: "🎖️" }
            ];
            localStorage.setItem(this.usersKey, JSON.stringify(users));
        } catch (error) { console.error("[ASTRA Auth] Demo account setup failed", error); }
    }

    installAccountStorageScope() {
        const user = this.getCurrentUser();
        if (!user?.id || window.__astraStorageScopeInstalled) return;
        const storage = window.localStorage;
        const native = {
            getItem: Storage.prototype.getItem,
            setItem: Storage.prototype.setItem,
            removeItem: Storage.prototype.removeItem
        };
        const sharedKeys = new Set([this.sessionKey, this.usersKey, "astra_api_mode"]);
        const scopedKey = (key) => sharedKeys.has(String(key)) ? String(key) : `astra_account_${user.id}_${String(key)}`;
        try {
            Object.defineProperties(storage, {
                getItem: { configurable: true, value(key) { return native.getItem.call(storage, scopedKey(key)); } },
                setItem: { configurable: true, value(key, value) { return native.setItem.call(storage, scopedKey(key), value); } },
                removeItem: { configurable: true, value(key) { return native.removeItem.call(storage, scopedKey(key)); } }
            });
            window.__astraStorageScopeInstalled = true;
        } catch (error) {
            console.error("[ASTRA Auth] Could not isolate local demo storage", error);
        }
    }

    getCurrentUser() {
        try {
            const session = localStorage.getItem(this.sessionKey);
            if (!session) return null;
            const sessionUser = JSON.parse(session);
            if (!sessionUser || typeof sessionUser.id !== "string") return null;
            const canonicalUser = this.readUsers().find((user) => user.id === sessionUser.id && user.status === "Active");
            if (!canonicalUser) return null;
            return { ...this.publicUser(canonicalUser), lastLogin: sessionUser.lastLogin || canonicalUser.lastLogin };
        } catch (error) { return null; }
    }

    async hashPassword(password, saltBytes = crypto.getRandomValues(new Uint8Array(16))) {
        if (!crypto?.subtle) throw new Error("Autentificarea locală necesită un context HTTPS sau localhost.");
        const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
        const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: saltBytes, iterations: 210000, hash: "SHA-256" }, key, 256);
        const toBase64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
        return `pbkdf2$${toBase64(saltBytes)}$${toBase64(bits)}`;
    }

    async verifyPassword(password, passwordHash, userId) {
        if (passwordHash === `demo:${userId}`) return password === this.demoPassword;
        if (typeof passwordHash !== "string" || !passwordHash.startsWith("pbkdf2$")) return false;
        try {
            const [, saltText, expected] = passwordHash.split("$");
            const salt = Uint8Array.from(atob(saltText), (char) => char.charCodeAt(0));
            const actual = await this.hashPassword(password, salt);
            return actual === `pbkdf2$${saltText}$${expected}`;
        } catch (error) { return false; }
    }

    readUsers() {
        try {
            const users = JSON.parse(localStorage.getItem(this.usersKey) || "[]");
            return Array.isArray(users) ? users : [];
        } catch (error) { return []; }
    }

    async login(email, password) {
        const normalizedEmail = String(email || "").trim().toLowerCase();
        const user = this.readUsers().find((candidate) => String(candidate.email).toLowerCase() === normalizedEmail);
        if (!user || !(await this.verifyPassword(String(password || ""), user.passwordHash, user.id))) {
            throw new Error("Email sau parolă incorectă.");
        }
        if (user.status !== "Active") throw new Error("Contul nu este activ. Contactează administratorul misiunii.");
        const session = this.publicUser(user);
        session.lastLogin = new Date().toISOString();
        localStorage.setItem(this.sessionKey, JSON.stringify(session));
        return session;
    }

    async signup(userData) {
        const users = this.readUsers();
        const email = String(userData.email || "").trim().toLowerCase();
        if (users.some((user) => String(user.email).toLowerCase() === email)) throw new Error("Adresa de email este deja înregistrată.");
        if (String(userData.password || "").length < 12) throw new Error("Parola trebuie să conțină cel puțin 12 caractere.");
        const id = `usr-${crypto.randomUUID()}`;
        const user = {
            id,
            fullName: String(userData.fullName || "").trim(),
            email,
            passwordHash: await this.hashPassword(String(userData.password)),
            crewId: String(userData.crewId || "").trim(),
            mission: "ARTEMIS-IV LUNAR BASE",
            // Public self-registration must never grant a privileged role.
            role: "ASTRONAUT",
            status: "Active",
            registeredDate: new Date().toISOString().slice(0, 10),
            avatar: "🧑‍🚀"
        };
        if (users.some((candidate) => String(candidate.crewId || "").toLowerCase() === user.crewId.toLowerCase())) throw new Error("Crew ID-ul este deja asociat unui cont.");
        users.push(user);
        localStorage.setItem(this.usersKey, JSON.stringify(users));
        localStorage.setItem(this.sessionKey, JSON.stringify(this.publicUser(user)));
        return this.publicUser(user);
    }

    publicUser(user) {
        const { passwordHash, ...safeUser } = user;
        return safeUser;
    }

    logout() {
        localStorage.removeItem(this.sessionKey);
        window.location.href = "login.html";
    }

    checkAuthGuard() {
        const publicPages = new Set(["login.html", "signup.html", "forgot-password.html"]);
        const currentPage = window.location.pathname.split("/").pop() || "index.html";
        const user = this.getCurrentUser();
        if (!user && !publicPages.has(currentPage)) {
            window.location.replace("login.html");
            return;
        }
        if (user && publicPages.has(currentPage)) {
            window.location.replace("index.html");
            return;
        }
        const roleAccess = { "medical-center.html": ["MEDICAL_OFFICER", "ADMINISTRATOR"] };
        if (user && roleAccess[currentPage] && !roleAccess[currentPage].includes(user.role)) {
            window.location.replace("index.html");
        }
    }
}

window.authService = new AuthService();
window.escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

document.addEventListener("DOMContentLoaded", () => {
    const user = window.authService.getCurrentUser();
    const aside = document.querySelector("aside");
    if (!user || !aside) return;
    const profileBox = document.createElement("div");
    profileBox.style.cssText = "background:var(--bg-card);padding:12px;border-radius:6px;border:1px solid var(--border-color);margin-top:15px;font-size:.85rem";
    profileBox.innerHTML = '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><span data-profile-avatar style="font-size:1.2rem"></span><div><strong data-profile-name style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:150px"></strong><span data-profile-role style="font-size:.75rem;color:var(--accent-cyan)"></span></div></div><button id="logoutBtn" type="button" style="background:rgba(239,68,68,.15);color:var(--accent-red);border:1px solid var(--accent-red);width:100%;padding:6px;border-radius:4px;cursor:pointer;font-weight:bold;font-size:.8rem">LOGOUT</button>';
    profileBox.querySelector("[data-profile-avatar]").textContent = user.avatar || "👤";
    profileBox.querySelector("[data-profile-name]").textContent = user.fullName || "User";
    profileBox.querySelector("[data-profile-role]").textContent = user.role;
    aside.appendChild(profileBox);
    profileBox.querySelector("#logoutBtn").addEventListener("click", () => window.authService.logout());
});
