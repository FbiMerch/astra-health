const DEMO_DATA = {
    mission: {
        code: "ARTEMIS-IV LUNAR BASE",
        day: 14,
        environment: "Lunar Surface Habitat"
    },
    astronauts: [
        {
            id: "ast-01",
            userId: "usr-01", // Legătura cu contul lui Mihail Ertea
            name: "Mihail Ertea",
            role: "Astronaut / Software Engineer",
            mission: "ARTEMIS-IV LUNAR BASE"
        },
        {
            id: "ast-02",
            userId: "usr-02", // Legătura cu contul Dr. Elena Vancea
            name: "Dr. Elena Vancea",
            role: "Medical Officer",
            mission: "ARTEMIS-IV LUNAR BASE"
        },
        {
            id: "ast-03",
            userId: "usr-03",
            name: "Eng. Sarah Jenkins",
            role: "Flight Engineer",
            mission: "ARTEMIS-IV LUNAR BASE"
        }
    ],
    vitals: {
        "ast-01": {
            heartRate: { value: 74, unit: "bpm", status: "normal" },
            spo2: { value: 98, unit: "%", status: "normal" },
            temperature: { value: 36.6, unit: "°C", status: "normal" },
            bloodPressure: { value: "118/78", unit: "mmHg", status: "normal" },
            boneDensity: { value: 94.2, unit: "%", status: "warning" },
            respiratoryRate: { value: 15, unit: "rpm", status: "normal" }
        },
        "ast-02": {
            heartRate: { value: 88, unit: "bpm", status: "warning" },
            spo2: { value: 96, unit: "%", status: "normal" },
            temperature: { value: 37.2, unit: "°C", status: "normal" },
            bloodPressure: { value: "125/82", unit: "mmHg", status: "warning" },
            boneDensity: { value: 89.5, unit: "%", status: "critical" },
            respiratoryRate: { value: 18, unit: "rpm", status: "normal" }
        },
        "ast-03": {
            heartRate: { value: 68, unit: "bpm", status: "normal" },
            spo2: { value: 99, unit: "%", status: "normal" },
            temperature: { value: 36.5, unit: "°C", status: "normal" },
            bloodPressure: { value: "115/75", unit: "mmHg", status: "normal" },
            boneDensity: { value: 96.0, unit: "%", status: "normal" },
            respiratoryRate: { value: 14, unit: "rpm", status: "normal" }
        }
    },
    twinBodyParts: {
        brain: { name: "Central Nervous System", status: "Normal", risk: "Isolation & Confinement stress", advice: "Maintain scheduled crew interaction and cognitive rest cycles." },
        heart: { name: "Cardiovascular System", status: "Normal", risk: "Fluid shift due to reduced gravity", advice: "Perform daily lower-body negative pressure exercises." },
        lungs: { name: "Cardiopulmonary & O2", status: "Normal", risk: "Closed environment cabin air particulates", advice: "Check HEPA filtration units and monitor CO2 scrubbers." },
        bones: { name: "Osteo-Skeletal System", status: "Warning", risk: "Bone mineral density loss in microgravity", advice: "Complete mandatory 2.5h resistance training session." },
        muscular: { name: "Muscular System", status: "Normal", risk: "Atrophy from lack of axial load", advice: "Execute localized flywheel resistance routines." }
    },
    history: {
        labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"],
        heartRate: [70, 72, 85, 78, 74, 76],
        spo2: [98, 97, 99, 98, 96, 98]
    },
    wellbeing: {
        sleepQuality: 7.8,
        moodScore: 8.2,
        stressLevel: 3.1
    },
    alerts: [
        { id: 1, level: "normal", message: "Cabin atmosphere nominal (O2: 21.2%, CO2: 400 ppm).", timestamp: "12:40 UTC" },
        { id: 2, level: "warning", message: "Dr. Elena Vancea: Elevated resting heart rate detected during prep.", timestamp: "11:15 UTC" },
        { id: 3, level: "critical", message: "Mihail Ertea: Bone density threshold warning in lower limbs.", timestamp: "08:30 UTC" }
    ]
};