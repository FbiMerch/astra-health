import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class DigitalTwinManager {
    constructor() {
        this.currentAstronautId = null;
        this.chartInstance = null;
        this.selectedBone = null;
        this.originalMaterials = new Map();

        // 3D Engine Variables
        this.scene = null; this.camera = null; this.renderer = null;
        this.controls = null; this.model = null; this.scannerLine = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.modelBoundingBox = new THREE.Box3();
        this.animationId = null;

        // Target Camera for Lerping
        this.targetCameraPos = new THREE.Vector3();
        this.isMovingCamera = false;

        this.init();
    }

    init() {
        this.initUIData();
        this.init3D();

        window.addEventListener('resize', this.onWindowResize.bind(this));

        document.querySelectorAll(".twin-tab").forEach(tab => {
            tab.addEventListener("click", (e) => {
                document.querySelectorAll(".twin-tab, .tab-content").forEach(el => el.classList.remove("active"));
                e.currentTarget.classList.add("active");
                document.getElementById(`tab-${e.currentTarget.dataset.tab}`).classList.add("active");
            });
        });

        document.querySelectorAll(".top-mode-selector .btn-view").forEach(btn => {
            btn.addEventListener("click", (e) => {
                document.querySelectorAll(".top-mode-selector .btn-view").forEach(b => b.classList.remove("active"));
                e.currentTarget.classList.add("active");
                const mode = e.currentTarget.dataset.mode;
                const placeholder = document.getElementById("placeholderOverlay");
                const container = document.getElementById("twin-3d-container");
                if (mode === "skeletal") {
                    placeholder.style.display = "none";
                    container.style.opacity = "1";
                } else {
                    placeholder.style.display = "flex";
                    container.style.opacity = "0.1";
                }
            });
        });

        // Camera Controls
        document.getElementById("cam-front")?.addEventListener("click", () => this.moveCameraTo(0, 0, this.baseCamZ));
        document.getElementById("cam-side")?.addEventListener("click", () => this.moveCameraTo(this.baseCamZ, 0, 0));
        document.getElementById("cam-back")?.addEventListener("click", () => this.moveCameraTo(0, 0, -this.baseCamZ));
        document.getElementById("cam-reset")?.addEventListener("click", () => {
            this.moveCameraTo(0, 0, this.baseCamZ);
            this.controls.target.copy(this.baseCamTarget);
        });

        // Click Raycasting
        const container = document.getElementById("twin-3d-container");
        container.addEventListener('pointerdown', this.onMouseClick.bind(this));
    }

    init3D() {
        const container = document.getElementById("twin-3d-container");
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Scene
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        this.baseCamZ = 5;
        this.camera.position.set(0, 0, this.baseCamZ);
        this.targetCameraPos.copy(this.camera.position);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0x00f0ff, 1.8);
        dirLight.position.set(5, 5, 5);
        this.scene.add(dirLight);

        const backLight = new THREE.DirectionalLight(0x0044ff, 1.2);
        backLight.position.set(-5, -5, -5);
        this.scene.add(backLight);

        // OrbitControls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 10;
        this.baseCamTarget = new THREE.Vector3(0, 0, 0);

        // Scanner Line (Hologram Effect)
        const scanGeo = new THREE.PlaneGeometry(5, 0.02);
        const scanMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.8, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
        this.scannerLine = new THREE.Mesh(scanGeo, scanMat);
        this.scene.add(this.scannerLine);

        // Load GLB using Fetch ArrayBuffer (Robust for IntelliJ server & 28MB file size)
        const loader = new GLTFLoader();
        const modelPath = 'assets/models/astronaut-skeleton.glb';

        fetch(modelPath)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.arrayBuffer();
            })
            .then(arrayBuffer => {
                loader.parse(arrayBuffer, '', (gltf) => {
                    this.model = gltf.scene;

                    this.model.traverse((child) => {
                        if (child.isMesh) {
                            const name = (child.name || "").toLowerCase();

                            // Culori și proprietăți diferite bazate pe tipul anatomic detectat în nume
                            let color = 0xddddcc; // Alb fildeș / os natural implicit
                            let emissive = 0x002244;
                            let roughness = 0.4;
                            let metalness = 0.1;
                            let opacity = 0.95;
                            let transparent = false;

                            if (name.includes('heart') || name.includes('cardio') || name.includes('inima')) {
                                color = 0xcc2233; // Roșu viu pentru inimă
                                emissive = 0x550011;
                                roughness = 0.2;
                            } else if (name.includes('lung') || name.includes('pulmon') || name.includes('resp')) {
                                color = 0xdd8899; // Roz-maroniu deschis pentru plămâni
                                emissive = 0x331122;
                                roughness = 0.5;
                            } else if (name.includes('liver') || name.includes('stomach') || name.includes('gut') || name.includes('digest')) {
                                color = 0xaa6644; // Maroniu/portocaliu pentru organe digestive
                                emissive = 0x221100;
                            } else if (name.includes('muscle') || name.includes('flesh') || name.includes('muscular')) {
                                color = 0xb23b3b; // Roșu-cărămiziu pentru mușchi
                                emissive = 0x331010;
                            } else if (name.includes('brain') || name.includes('nerve')) {
                                color = 0xd4a5a5; // Bej/gri deschis pentru creier
                                emissive = 0x332222;
                            } else {
                                // Oase (Skeletal) - Alb fildes mat cu tentă holografică fină
                                color = 0xebe8e1;
                                emissive = 0x004466; // O tentă albastră foarte fină de scaner medical
                                roughness = 0.6;
                            }

                            const mat = new THREE.MeshStandardMaterial({
                                color: color,
                                emissive: emissive,
                                emissiveIntensity: 0.15,
                                roughness: roughness,
                                metalness: metalness,
                                transparent: transparent,
                                opacity: opacity
                            });

                            child.material = mat;
                            this.originalMaterials.set(child.uuid, mat.clone());
                            child.userData = { name: child.name || "Anatomical Part", isBone: true };
                        }
                    });

                    this.modelBoundingBox.setFromObject(this.model);
                    const center = this.modelBoundingBox.getCenter(new THREE.Vector3());
                    const size = this.modelBoundingBox.getSize(new THREE.Vector3());

                    const maxDim = Math.max(size.x, size.y, size.z);
                    const scale = 3.5 / maxDim;
                    this.model.scale.setScalar(scale);
                    this.model.position.sub(center.multiplyScalar(scale));
                    this.modelBoundingBox.setFromObject(this.model);

                    this.scene.add(this.model);

                    document.getElementById("loadingOverlay").style.opacity = 0;
                    setTimeout(() => document.getElementById("loadingOverlay").style.display = "none", 500);

                    this.populateRightPanel(null);

                }, (error) => {
                    console.error("Eroare parsare GLTF:", error);
                });
            })
            .catch(error => {
                console.error("Eroare fetch GLB:", error);
                document.getElementById("loadingOverlay").innerHTML = `
                    <div style="color:var(--accent-red); font-size:1.3rem; text-align:center;">⚠️ EROARE CITIRE FIȘIER 3D</div>
                    <div style="font-size:0.8rem; margin-top:10px; color:var(--text-muted); text-align:center; max-width:450px;">
                        Verificați că fișierul de 28MB 'astronaut-skeleton.glb' este în folderul 'assets/models/'.
                    </div>
                `;
            });

        // Animation Loop
        this.animate = this.animate.bind(this);
        this.animate();
    }

    animate(time) {
        this.animationId = requestAnimationFrame(this.animate);

        if (this.isMovingCamera) {
            this.camera.position.lerp(this.targetCameraPos, 0.05);
            if (this.camera.position.distanceTo(this.targetCameraPos) < 0.01) {
                this.isMovingCamera = false;
            }
        }

        if (this.model && this.scannerLine) {
            const minY = this.modelBoundingBox.min.y;
            const maxY = this.modelBoundingBox.max.y;
            const range = maxY - minY;
            this.scannerLine.position.y = minY + (Math.sin(time * 0.001) * 0.5 + 0.5) * range;
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    moveCameraTo(x, y, z) {
        this.targetCameraPos.set(x, y, z);
        this.isMovingCamera = true;
    }

    onWindowResize() {
        const container = document.getElementById("twin-3d-container");
        if (!container || !this.camera || !this.renderer) return;
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }

    onMouseClick(event) {
        if (!this.model) return;

        const container = document.getElementById("twin-3d-container");
        const rect = container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.model, true);

        if (this.selectedBone) {
            this.selectedBone.material.emissive.setHex(0x00aaff);
            this.selectedBone.material.emissiveIntensity = 0.25;
            this.selectedBone = null;
        }

        if (intersects.length > 0) {
            const hitMesh = intersects[0].object;
            this.selectedBone = hitMesh;
            hitMesh.material.emissive.setHex(0xffffff);
            hitMesh.material.emissiveIntensity = 1.0;

            const meshName = hitMesh.userData.name;
            this.populateRightPanel(meshName);
        } else {
            this.populateRightPanel(null);
        }
    }

    initUIData() {
        const select = document.getElementById("astronautSelect");
        if (select && typeof DEMO_DATA !== 'undefined') {
            DEMO_DATA.astronauts.forEach(ast => {
                const opt = document.createElement("option");
                opt.value = ast.id;
                opt.textContent = `${ast.name} (${ast.role})`;
                select.appendChild(opt);
            });
            this.currentAstronautId = select.value;
            select.addEventListener("change", (e) => {
                this.currentAstronautId = e.target.value;
                this.refreshUI();
            });
        }
        this.refreshUI();
    }

    getAstronautData() {
        const vitals = DEMO_DATA.vitals?.[this.currentAstronautId] || {};
        const ast = DEMO_DATA.astronauts.find(a => a.id === this.currentAstronautId) || {};
        let alerts = [];
        if (ast.userId) {
            try {
                const stored = localStorage.getItem(`astra_smart_alerts_${ast.userId}`);
                if (stored) alerts = JSON.parse(stored);
            } catch (e) {}
        }
        return { vitals, ast, alerts };
    }

    calculateHealthScore(vitals, alerts) {
        if (!vitals || Object.keys(vitals).length === 0) return { score: 0, status: "GRAY", reason: "Insufficient Data" };
        let score = 100, status = "GREEN";
        const activeAlerts = alerts.filter(a => a.status !== "RESOLVED");

        activeAlerts.forEach(a => {
            if (a.severity === "CRITICAL") { score -= 25; status = "RED"; }
            else if (a.severity === "HIGH" || a.severity === "MEDIUM") { score -= 10; if (status !== "RED") status = "YELLOW"; }
        });
        Object.values(vitals).forEach(v => {
            if (v.status === "critical") { score -= 20; status = "RED"; }
            else if (v.status === "warning") { score -= 10; if (status !== "RED") status = "YELLOW"; }
        });
        return { score: Math.max(0, score), status, activeAlertsCount: activeAlerts.length };
    }

    refreshUI() {
        const { vitals, ast, alerts } = this.getAstronautData();
        const health = this.calculateHealthScore(vitals, alerts);

        document.getElementById("dt-astro-name").textContent = ast.name || "Unknown";
        document.getElementById("dt-astro-role").textContent = ast.role || "-";

        const ring = document.getElementById("dt-score-ring");
        const color = health.status === "RED" ? "#ef4444" : (health.status === "YELLOW" ? "#f59e0b" : (health.status === "GRAY" ? "#8892b0" : "#10b981"));
        ring.style.setProperty("--score-deg", `${(health.score / 100) * 360}deg`);
        ring.style.setProperty("--accent-color", color);
        document.getElementById("dt-score-val").textContent = health.score > 0 ? health.score : "N/A";

        const badge = document.getElementById("dt-global-status");
        badge.textContent = `STATUS: ${health.status}`;
        badge.style.background = `rgba(${health.status==='RED'?'239,68,68':(health.status==='YELLOW'?'245,158,11':(health.status==='GRAY'?'136,146,176':'16,185,129'))}, 0.2)`;
        badge.style.color = color;
        badge.style.border = `1px solid ${color}`;

        const qsContainer = document.getElementById("dt-quick-stats");
        qsContainer.innerHTML = `
            <div class="quick-stat-row"><span>Heart Rate</span> <strong style="color:${vitals.heartRate?.status==='warning'?'var(--accent-yellow)':(vitals.heartRate?.status==='critical'?'var(--accent-red)':'var(--accent-cyan)')}">${vitals.heartRate?.value || '-'} ${vitals.heartRate?.unit || ''}</strong></div>
            <div class="quick-stat-row"><span>SpO2</span> <strong>${vitals.spo2?.value || '-'} ${vitals.spo2?.unit || ''}</strong></div>
            <div class="quick-stat-row"><span>Bone Density</span> <strong style="color:${vitals.boneDensity?.status==='warning'?'var(--accent-yellow)':(vitals.boneDensity?.status==='critical'?'var(--accent-red)':'var(--accent-cyan)')}">${vitals.boneDensity?.value || '-'} ${vitals.boneDensity?.unit || ''}</strong></div>
        `;

        this.populateRightPanel(this.selectedBone ? this.selectedBone.userData.name : null);
    }

    populateRightPanel(meshName) {
        const { vitals } = this.getAstronautData();

        if (!meshName) {
            document.getElementById("dt-sys-title").textContent = "Full Skeletal System";
            document.getElementById("dt-sys-status").innerHTML = "Select a specific bone for localized data.";
        } else {
            document.getElementById("dt-sys-title").textContent = meshName.replace(/_/g, ' ').toUpperCase();
            document.getElementById("dt-sys-status").innerHTML = "<span style='color:var(--accent-cyan);'>Mesh selected successfully.</span>";
        }

        let bd = vitals.boneDensity;
        let oHtml = '';
        if (bd) {
            oHtml = `<div class="data-card">
                        <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Bone Mineral Density (T-Score Equiv)</div>
                        <div style="font-size:1.5rem; font-weight:bold; color:${bd.status==='critical'?'var(--accent-red)':'var(--accent-cyan)'}; font-family:monospace;">${bd.value} <span style="font-size:0.8rem;">${bd.unit}</span></div>
                     </div>
                     <div class="data-card">
                        <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Calcium Blood Level</div>
                        <div style="font-size:1.1rem; font-weight:bold; color:var(--text-main); font-family:monospace;">9.5 <span style="font-size:0.8rem;">mg/dL</span> (SIMULATED DATA)</div>
                     </div>`;
        } else {
            oHtml = `<div class="data-card" style="color:var(--text-muted); font-size:0.85rem;">NO DATA AVAILABLE for Bone Density.</div>`;
        }
        document.getElementById("dt-content-overview").innerHTML = oHtml;

        document.getElementById("dt-content-risks").innerHTML = `
            <div class="risk-item">
                <strong style="color: var(--accent-orange); font-size:0.85rem;">[HRP-4] Microgravity Bone Loss</strong>
                <p style="font-size:0.8rem; color:var(--text-muted); margin: 4px 0;">Lack of axial load causes significant osteoclast activity and demineralization.</p>
                <div style="font-size:0.75rem; color:var(--text-main);">Action: ARED Countermeasures.</div>
            </div>`;

        document.getElementById("dt-content-recs").innerHTML = `
            <div style="background: rgba(0,240,255,0.05); padding: 10px; border-radius:4px; font-size:0.85rem; border:1px solid var(--border-color);">✓ Complete 2.5h daily resistance training.</div>
            <div style="background: rgba(0,240,255,0.05); padding: 10px; border-radius:4px; font-size:0.85rem; border:1px solid var(--border-color);">✓ Review Vitamin D / Calcium supplementation.</div>`;
        document.getElementById("dt-module-links").innerHTML = `<button style="background:var(--accent-cyan); color:var(--bg-primary); border:none; padding:8px 15px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:0.85rem;" onclick="window.location.href='exercise.html'">Open Exercise Module →</button>`;

        this.renderChart();
    }

    renderChart() {
        const ctx = document.getElementById("twinTrendChart");
        if (!ctx) return;
        if (this.chartInstance) { this.chartInstance.destroy(); }

        const data = [97.1, 96.5, 95.8, 95.0, 94.5, 94.2];

        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ["Week 1","Week 2","Week 3","Week 4","Week 5","Week 6"],
                datasets: [{
                    label: 'Bone Density (%) (SIMULATED DATA)',
                    data: data,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    fill: true, tension: 0.3
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: '#8892b0', font:{size:10} }, grid: { color: '#233554' } },
                    y: { ticks: { color: '#8892b0', font:{size:10} }, grid: { color: '#233554' } }
                },
                plugins: { legend: { labels: { color: '#e2e8f0', font:{size:10} } } }
            }
        });
        document.getElementById("dt-content-trend-dir").innerHTML = `Trend Analysis: <strong style="color:var(--accent-orange);">Declining</strong> over last period.`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.twinManager = new DigitalTwinManager();
});