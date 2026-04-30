export const stages = {
    taipei: {
        name: "Taipei Street",
        layers: {
            ground: "/assets/stages/taipei/battle_lane.png"
        },
        lane: {
            bottom: 110,
            height: 358
        },
        floor: {
            fromBottom: 250
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
            far: "/assets/stages/nola/background.png"
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
    }
};