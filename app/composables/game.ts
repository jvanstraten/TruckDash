import { onMounted, onUnmounted, reactive, watch, ref } from "vue";
import { TruckTelSocket } from "~/lib/trucktel";
import Configuration from "~/components/configuration.vue";

//-----------------------------------------------------------------------------
// Type definitions
//-----------------------------------------------------------------------------

type TelemetryCurrent = {
    paused: null | boolean,
};

type TelemetryUnpaused = {
    time: {
        current: null | number,
        restRemain: null | number,
        navRemain: null | number,
        jobExpected: null | number,
    },
    location: {
        lat: null | number,
        lon: null | number,
    },
    electric: {
        enabled: null | boolean,
        indicator: null | boolean,
    },
    engine: {
        running: null | boolean,
        rpm: null | number,
        rpmLimit: null | number,
        wear: null | number,
    },
    transmission: {
        mode: null | "arcade" | "automatic" | "manual" | "hshifter",
        realGear: null | number,
        indicatedGear: null | number,
        diffLock: null | boolean,
        wear: null | number,
    },
    axles: {
        liftTruck: null | boolean,
        liftTrailer: null | boolean,
        speed: null | number,
        odo: null | number,
    },
    brake: {
        parking: null | boolean,
        motor: null | boolean,
        retarder: null | number,
        retarderMax: null | number,
    },
    fuel: {
        amount: null | number,
        capacity: null | number,
        consumption: null | number,
        indicator: null | boolean,
    },
    adBlue: {
        amount: null | number,
        capacity: null | number,
        indicator: null | boolean,
    },
    oil: {
        pressure: null | number,
        indicator: null | boolean,
    },
    coolant: {
        temperature: null | number,
        indicator: null | boolean,
    },
    air: {
        pressure: null | number,
        indicator: null | boolean,
    },
    lights: {
        parking: null | boolean,
        low: null | boolean,
        high: null | boolean,
        beacon: null | boolean,
        turnLeft: null | boolean,
        turnRight: null | boolean,
        turnSwLeft: null | boolean,
        turnSwRight: null | boolean,
        turnSwSteer: null | number,
        hazardSw: null | boolean,
    },
    util: {
        wipers: null | boolean,
        cruiseControl: null | number,
        speedLimit: null | number,
    },
};

type TelemetryState = {
    current: TelemetryCurrent,
    unpaused: TelemetryUnpaused,
};

export type GameState = {
    current: TelemetryCurrent,
    unpaused: TelemetryUnpaused,
    derived: {
        transMode: ComputedRef<"M" | "A">,
        transDirection: ComputedRef<"R" | "N" | "D">,
        transGearIndex: ComputedRef<number>,
        transStalkMode: ComputedRef<number>,
        transStalkDirection: ComputedRef<number>,
        transStalkShift: Ref<number>,
        transStalkBrake: Ref<number>,
        utilStalkLowBeam: ComputedRef<number>,
        utilStalkHighBeam: ComputedRef<number>,
        utilStalkBlinkers: Ref<number>,
        utilStalkWipers: Ref<number>,
    },
};

//-----------------------------------------------------------------------------
// Raw telemetry state and socket
//-----------------------------------------------------------------------------

// This is a global/singleton because it's updated by the socket, which we only
// want to have one of.
const telemetryState: TelemetryState = {
    current: reactive({
        paused: null,
    }),
    unpaused: reactive({
        time: {
            current: null,
            restRemain: null,
            navRemain: null,
            jobExpected: null,
        },
        location: {
            lat: null,
            lon: null,
        },
        electric: {
            enabled: null,
            indicator: null,
        },
        engine: {
            running: null,
            rpm: null,
            rpmLimit: null,
            wear: null,
        },
        transmission: {
            mode: null,
            realGear: null,
            indicatedGear: null,
            diffLock: null,
            wear: null,
        },
        axles: {
            liftTruck: null,
            liftTrailer: null,
            speed: null,
            odo: null,
        },
        brake: {
            parking: null,
            motor: null,
            retarder: null,
            retarderMax: null,
        },
        fuel: {
            amount: null,
            capacity: null,
            consumption: null,
            indicator: null,
        },
        adBlue: {
            amount: null,
            capacity: null,
            indicator: null,
        },
        oil: {
            pressure: null,
            indicator: null,
        },
        coolant: {
            temperature: null,
            indicator: null,
        },
        air: {
            pressure: null,
            indicator: null,
        },
        lights: {
            parking: null,
            low: null,
            high: null,
            beacon: null,
            turnLeft: null,
            turnRight: null,
            turnSwLeft: null,
            turnSwRight: null,
            turnSwSteer: null,
            hazardSw: null,
        },
        util: {
            wipers: null,
            cruiseControl: null,
            speedLimit: null,
        },
    }),
};

// Game socket. This is a global singleton to avoid connection spam.
const gameSocket = new TruckTelSocket("dash");
gameSocket.current = telemetryState.current;
gameSocket.unpaused = telemetryState.unpaused;
gameSocket.paused_key = "paused";
gameSocket.dev_host = "192.168.0.196:8080"; // FIXME
gameSocket.debug = true;

//-----------------------------------------------------------------------------
// Low-beam logic
//-----------------------------------------------------------------------------

// Skip the parking lights position for the low beams switch.
let utilStalkLowBeamCfgSkipPark: boolean = false;

function utilStalkLowBeamSyncCfg(configuration: ConfigurationData) {
    utilStalkLowBeamCfgSkipPark = configuration.stalkSkipParkingLights;
}

// Switch position.
const utilStalkLowBeam = computed((): number => {
    if (telemetryState.unpaused.lights.low) {
        return 2;
    } else if (telemetryState.unpaused.lights.parking) {
        return 1;
    } else {
        return 0;
    }
});

function utilStalkLowBeamInc() {
    switch (utilStalkLowBeam.value) {
        case 0:
            if (!utilStalkLowBeamCfgSkipPark) {
                gameSocket.pressInput("lightpark");
                break;
            }
            // fallthrough
        case 1:
            gameSocket.pressInput("lighton");
            break;
    }
}

function utilStalkLowBeamDec() {
    switch (utilStalkLowBeam.value) {
        case 2:
            if (!utilStalkLowBeamCfgSkipPark) {
                gameSocket.pressInput("lightpark");
                break;
            }
            // fallthrough
        case 1:
            gameSocket.pressInput("lightoff");
            break;
    }
}

//-----------------------------------------------------------------------------
// High-beam logic
//-----------------------------------------------------------------------------

// High beam "horn" mode. When 'reverse', swipe in "decrease" direction to
// flash high beams. When 'middle', swipe once in "increase" direction to
// flash, and twice to keep on. When 'disabled', the stalk only has two
// positions.
let utilStalkHighBeamCfgLightHornMode = ref<"disabled" | "reverse" | "middle">("middle");

// Timer for light horn behavior.
let utilStalkHighBeamCfgLightHornMillis: number = 800;

function utilStalkHighBeamSyncCfg(configuration: ConfigurationData) {
    utilStalkHighBeamCfgLightHornMode.value = configuration.stalkLightHornMode;
    utilStalkHighBeamCfgLightHornMillis = configuration.stalkLightHornTimer;
}

// Timer for momentary flashes.
const utilStalkHighBeamLightHornTimer = ref<undefined | number>(undefined);

// Stalk position.
const utilStalkHighBeam = computed((): number => {
    if (utilStalkHighBeamLightHornTimer.value !== undefined) {
        return utilStalkHighBeamCfgLightHornMode.value === "middle" ? 1 : -1;
    } else if (telemetryState.unpaused.lights.high) {
        return utilStalkHighBeamCfgLightHornMode.value === "middle" ? 2 : 1;
    } else {
        return 0;
    }
});

function utilStalkHighBeamStopMomentary() {
    if (utilStalkHighBeamLightHornTimer.value !== undefined) {
        window.clearTimeout(utilStalkHighBeamLightHornTimer.value);
        utilStalkHighBeamLightHornTimer.value = undefined;
    }
}

function utilStalkHighBeamStartMomentary() {
    utilStalkHighBeamStopMomentary();
    utilStalkHighBeamLightHornTimer.value = window.setTimeout(() => {
        utilStalkHighBeamStopMomentary()
    }, utilStalkHighBeamCfgLightHornMillis);
}

watch(utilStalkHighBeamLightHornTimer, (value: number | undefined) => {
    if (value === undefined) {
        gameSocket.releaseInput("lighthorn");
    } else {
        gameSocket.holdInput("lighthorn");
    }
});

function utilStalkHighBeamInc() {
    switch (utilStalkHighBeam.value) {
        case -1:
            utilStalkHighBeamStopMomentary();
            break;
        case 0:
            if (utilStalkHighBeamCfgLightHornMode.value === "middle") {
                utilStalkHighBeamStartMomentary();
            } else {
                gameSocket.pressInput("hblight");
            }
            break;
        case 1:
            if (utilStalkHighBeamCfgLightHornMode.value === "middle") {
                utilStalkHighBeamStopMomentary();
                gameSocket.pressInput("hblight");
            }
            break;
    }
}

function utilStalkHighBeamDec() {
    if (utilStalkHighBeam.value > 0) {
        if (telemetryState.unpaused.lights.high) {
            gameSocket.pressInput("hblight");
        }
        utilStalkHighBeamStopMomentary();
    } else if (utilStalkHighBeamCfgLightHornMode.value === "reverse") {
        utilStalkHighBeamStartMomentary();
    }
}

//-----------------------------------------------------------------------------
// Blinker logic
//-----------------------------------------------------------------------------

// Number of flashes done for a single swipe, or 0 to disable this behavior.
let utilStalkBlinkersCfgMomentaryCount: number = 3;

// Amount of steering input in percentage points counter to blinker direction
// needed to automatically cancel the blinkers, or 0 to disable this behavior.
let utilStalkBlinkersCfgAutoOffSensitivity: number = 20;

function utilStalkBlinkersSyncCfg(configuration: ConfigurationData) {
    utilStalkBlinkersCfgMomentaryCount = configuration.stalkBlinkersMomentaryCount;
    utilStalkBlinkersCfgAutoOffSensitivity = configuration.stalkBlinkersAutoOffSensitivity;
}

// Stalk position.
const utilStalkBlinkers = ref(0);

// Number of flashes remaining for momentary mode.
let utilStalkBlinkersMomentaryRemain = 0;

// Whether either blinker was on in the game before the following watch
// callback. Previous value from Vue doesn't work for some reason.
let utilStalkBlinkersPrevOn: boolean = false;

watch(telemetryState.unpaused.lights, (value: { turnLeft: null | boolean, turnRight: null | boolean }) => {
    // Turn off blinkers if stalk is in +/-1 position and the blinkers have
    // flashed three times.
    if (Math.abs(utilStalkBlinkers.value) != 1) return;
    const newBlinkerOn = !!value.turnLeft || !!value.turnRight;
    const blinkerTurnedOff = utilStalkBlinkersPrevOn && !newBlinkerOn;
    utilStalkBlinkersPrevOn = newBlinkerOn;
    if (!blinkerTurnedOff) return;
    utilStalkBlinkersMomentaryRemain--;
    if (utilStalkBlinkersMomentaryRemain > 0) return;
    utilStalkBlinkers.value = 0;
});

// Steering extreme position in the direction of the blinker since the blinker
// was enabled.
let utilStalkBlinkersSteeringMax = 0;

watch(telemetryState.unpaused.lights, (value: { turnSwSteer: null | number }) => {
    // Turn off blinkers if stalk is in +/-2 position and the steering wheel
    // has turned by more than X% in the reverse direction of the blinker.
    if (Math.abs(utilStalkBlinkers.value) != 2) return;
    if (utilStalkBlinkersCfgAutoOffSensitivity == 0) return;
    let steeringState = value.turnSwSteer ?? 0;
    if (utilStalkBlinkers.value < 0) steeringState = -steeringState;
    utilStalkBlinkersSteeringMax = Math.max(utilStalkBlinkersSteeringMax, steeringState);
    if (steeringState > utilStalkBlinkersSteeringMax - utilStalkBlinkersCfgAutoOffSensitivity) return;
    utilStalkBlinkers.value = 0;
});

watch(utilStalkBlinkers, (value: number) => {
    if (value < 0) {
        gameSocket.holdInput("rblinkerh");
    } else {
        gameSocket.releaseInput("rblinkerh");
    }
    if (value > 0) {
        gameSocket.holdInput("lblinkerh");
    } else {
        gameSocket.releaseInput("lblinkerh");
    }
});

function utilStalkBlinkersLeft() {
    switch (utilStalkBlinkers.value) {
        case -2:
        case -1:
            utilStalkBlinkersMomentaryRemain = 0;
            utilStalkBlinkers.value = 0;
            break;
        case 0:
            if (utilStalkBlinkersCfgMomentaryCount > 0) {
                utilStalkBlinkersMomentaryRemain = utilStalkBlinkersCfgMomentaryCount;
                utilStalkBlinkers.value = 1;
                break;
            }
            // fallthrough
        case 1:
            utilStalkBlinkersSteeringMax = telemetryState.unpaused.lights.turnSwSteer ?? 0;
            utilStalkBlinkers.value = 2;
            break;
    }
}

function utilStalkBlinkersRight() {
    switch (utilStalkBlinkers.value) {
        case 2:
        case 1:
            utilStalkBlinkersMomentaryRemain = 0;
            utilStalkBlinkers.value = 0;
            break;
        case 0:
            if (utilStalkBlinkersCfgMomentaryCount > 0) {
                utilStalkBlinkersMomentaryRemain = utilStalkBlinkersCfgMomentaryCount;
                utilStalkBlinkers.value = -1;
                break;
            }
            // fallthrough
        case -1:
            utilStalkBlinkersSteeringMax = -(telemetryState.unpaused.lights.turnSwSteer ?? 0);
            utilStalkBlinkers.value = -2;
            break;
    }
}

//-----------------------------------------------------------------------------
// Wiper logic
//-----------------------------------------------------------------------------

// Switch position. The game doesn't give sufficient information over telemetry
// to provide valid input on wiper stalk position (it only provides a boolean)
// so we just keep track of the wiper state ourselves.
const utilStalkWipers = ref(0);

// If we receive a wiper on/off event that disagrees with our stalk position,
// default our stalk position to the off resp. low positions, so it's at least
// not completely wrong.
let utilStalkWipersPrev: boolean = false;
watch(telemetryState.unpaused.util, () => {
    const state = !!telemetryState.unpaused.util.wipers;
    if (state == utilStalkWipersPrev) return;
    utilStalkWipersPrev = state;
    if (state && utilStalkWipers.value == 0) {
        utilStalkWipers.value = 2;
    } else if (!state && utilStalkWipers.value > 0) {
        utilStalkWipers.value = 0;
    }
});

function utilStalkWipersInc() {
    if (utilStalkWipers.value < 3) {
        utilStalkWipers.value++;
        gameSocket.pressInput(`wipers${utilStalkWipers.value}`);
    }
}

function utilStalkWipersDec() {
    if (utilStalkWipers.value > 0) {
        utilStalkWipers.value--;
        gameSocket.pressInput(`wipers${utilStalkWipers.value}`);
    }
}

//-----------------------------------------------------------------------------
// Gear shifting logic
//-----------------------------------------------------------------------------

// Transmission positive gear index, ignoring neutral.
const transGearIndex = computed(() => {
    return Math.max(1, Math.abs(telemetryState.unpaused.transmission.indicatedGear ?? 0));
});

// Gear shift stalk position. Just for visual feedback.
const transStalkShift = ref(0);

// TODO

//-----------------------------------------------------------------------------
// Engine brake and retarder logic
//-----------------------------------------------------------------------------

// Retarder stalk position. Just for visual feedback.
const transStalkBrake = ref(0);

// TODO

//-----------------------------------------------------------------------------
// Transmission direction logic
//-----------------------------------------------------------------------------

// Transmission direction (R/N/D).
const transDirection = computed(() => {
    const gear = telemetryState.unpaused.transmission.indicatedGear;
    if (gear == null) return "N";
    if (gear > 0) return "D";
    if (gear < 0) return "R";
    return "N";
});

// Switch position index.
const transStalkDirection = computed((): number => {
    return {R: 0, N: 1, D: 2}[transDirection.value];
});

// TODO

//-----------------------------------------------------------------------------
// Transmission mode logic
//-----------------------------------------------------------------------------

// Transmission manual/auto mode.
const transMode = computed(() => {
    switch (telemetryState.unpaused.transmission.mode) {
        case "manual":
        case "hshifter":
            return "M";
    }
    return "A";
});

// Switch position index.
const transStalkMode = computed((): number => {
    return {M: 0, A: 1}[transMode.value];
});

// TODO

//-----------------------------------------------------------------------------
// Input demultiplexing
//-----------------------------------------------------------------------------

// Semantical control events that can be sent to the game.
export type GameInput
    = "lowBeam-inc" | "lowBeam-dec"
    | "highBeam-inc" | "highBeam-dec"
    | "blinkers-inc" | "blinkers-dec"
    | "wipers-inc" | "wipers-dec"
    | "transGear-inc" | "transGear-dec"
    | "transBrake-inc" | "transBrake-dec"
    | "transDirection-inc" | "transDirection-dec"
    | "transMode-inc" | "transMode-dec";

// Sends commands to the game. This is mostly just a translation step between
// TruckDash actions and semantic input for the game engine.
function sendToGame(input: GameInput) {
    switch (input) {
        case "lowBeam-inc": utilStalkLowBeamInc(); break;
        case "lowBeam-dec": utilStalkLowBeamDec(); break;
        case "highBeam-inc": utilStalkHighBeamInc(); break;
        case "highBeam-dec": utilStalkHighBeamDec(); break;
        case "blinkers-inc": utilStalkBlinkersLeft(); break;
        case "blinkers-dec": utilStalkBlinkersRight(); break;
        case "wipers-inc": utilStalkWipersInc(); break;
        case "wipers-dec": utilStalkWipersDec(); break;
    }
}

function syncControlBehaviorConfig(configuration: ConfigurationData) {
    utilStalkLowBeamSyncCfg(configuration);
    utilStalkHighBeamSyncCfg(configuration);
    utilStalkBlinkersSyncCfg(configuration);
}

//-----------------------------------------------------------------------------
// Registration
//-----------------------------------------------------------------------------

export function useGame(configuration: Configuration): { gameState: GameState, sendToGame: (input: GameInput) => void} {

    // Open/close the socket on mount/unmount.
    onMounted(() => {
        gameSocket.open();
    });
    onUnmounted(() => {
        gameSocket.close();
    });

    // Reopen the socket when the throttle configuration parameter changes.
    watch(() => configuration.value.perfTelemetryThrottle, () => {
        gameSocket.throttle = configuration.value.perfTelemetryThrottle;
        gameSocket.reopen();
    }, { immediate: true });

    // Keep configuration globals in this file in sync.
    watch(configuration, () => syncControlBehaviorConfig(configuration.value));
    syncControlBehaviorConfig(configuration.value);

    return {
        gameState: {
            current: telemetryState.current,
            unpaused: telemetryState.unpaused,
            derived: {
                transMode,
                transDirection,
                transGearIndex,
                transStalkMode,
                transStalkDirection,
                transStalkShift,
                transStalkBrake,
                utilStalkLowBeam,
                utilStalkHighBeam,
                utilStalkBlinkers,
                utilStalkWipers,
            }
        },
        sendToGame
    };
}
