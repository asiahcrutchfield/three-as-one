export const stages = {
    taipei: {
        name: "Taipei Street",
        layers: {
            ground: "/assets/stages/taipei/battle_lane2.jpg"
        },
        lane: {
            bottom: 110,
            height: 358
        },
        floor: {
            fromBottom: 125
        },
        dimensions: {
            w: 1660,
            h: 358
        },
        fitmode: "width",
        worldScale: 0.8
    },
    nola: {
        name: "NOLA Street",
        layers: {
            ground: "/assets/stages/nola/battle_lane.png",
            far: "/assets/stages/nola/background.jpg"
        },
        lane: {
            bottom: 95,
            height: 340,
        },
        floor: {
            fromBottom: 120
        },
        dimensions: {
            w: 1344,
            h: 768
        },
        fitmode: "width",
        worldScale: 0.8
    },
    paradise: {
        name: "Paradise",
        layers: {
            ground: "/assets/stages/paradise/battle_lane2.png",
            far: "/assets/stages/paradise/background.png"
        },
        lane: {
            bottom: 95,
            height: 340
        },
        floor: {
            fromBottom: 200
        },
        dimensions: {
            w: 1660,
            h: 359
        },
        fitmode: "width",
        worldScale: 1
    },
    boss: {
        name: "Convergence Arena",
        layers: {
            ground: "/assets/stages/boss/battle_lane.png"
        },
        lane: {
            bottom: 110,
            height: 380
        },
        floor: {
            fromBottom: 150
        },
        dimensions: {
            w: 1672,
            h: 941
        },
        fitmode: "width",
        worldScale: 1
    }
};
