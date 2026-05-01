import { onMounted, onUnmounted, reactive, watch, ref } from "vue";
import { TruckTelSocket } from "~/lib/trucktel";

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
            gameSocket.pressInput("lightpark");
            break;
        case 1:
            gameSocket.pressInput("lighton");
            break;
    }
}

function utilStalkLowBeamDec() {
    switch (utilStalkLowBeam.value) {
        case 1:
            gameSocket.pressInput("lightoff");
            break;
        case 2:
            gameSocket.pressInput("lightpark");
            break;
    }
}

//-----------------------------------------------------------------------------
// High-beam logic
//-----------------------------------------------------------------------------

const utilStalkHighBeamMomentaryTimer = ref<undefined | number>(undefined);

const utilStalkHighBeam = computed((): number => {
    if (utilStalkHighBeamMomentaryTimer.value !== undefined) {
        return -1;
    } else if (telemetryState.unpaused.lights.high) {
        return 1;
    } else {
        return 0;
    }
});

function utilStalkHighBeamStopMomentary() {
    if (utilStalkHighBeamMomentaryTimer.value !== undefined) {
        window.clearTimeout(utilStalkHighBeamMomentaryTimer.value);
        utilStalkHighBeamMomentaryTimer.value = undefined;
    }
}

function utilStalkHighBeamStartMomentary() {
    utilStalkHighBeamStopMomentary();
    utilStalkHighBeamMomentaryTimer.value = window.setTimeout(() => utilStalkHighBeamStopMomentary(), 800);
}

watch(utilStalkHighBeamMomentaryTimer, (value: number | undefined) => {
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
            gameSocket.pressInput("hblight");
            break;
    }
}

function utilStalkHighBeamDec() {
    if (utilStalkHighBeam.value > 0) {
        gameSocket.pressInput("hblight");
    } else {
        utilStalkHighBeamStartMomentary();
    }
}

//-----------------------------------------------------------------------------
// Blinker logic
//-----------------------------------------------------------------------------

const utilStalkBlinkers = ref(0);

// Number of flashes remaining for momentary mode.
let utilStalkBlinkersMomentaryRemain = 0;

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
    let steeringState = value.turnSwSteer ?? 0;
    if (utilStalkBlinkers.value < 0) steeringState = -steeringState;
    utilStalkBlinkersSteeringMax = Math.max(utilStalkBlinkersSteeringMax, steeringState);
    if (steeringState > utilStalkBlinkersSteeringMax - 20) return;
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
            utilStalkBlinkersMomentaryRemain = 3;
            utilStalkBlinkers.value = 1;
            break;
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
            utilStalkBlinkersMomentaryRemain = 3;
            utilStalkBlinkers.value = -1;
            break;
        case -1:
            utilStalkBlinkersSteeringMax = -(telemetryState.unpaused.lights.turnSwSteer ?? 0);
            utilStalkBlinkers.value = -2;
            break;
    }
}

//-----------------------------------------------------------------------------
// Wiper logic
//-----------------------------------------------------------------------------

// The game doesn't give sufficient information over telemetry to provide valid
// input on wiper stalk position (it only provides a boolean) so we just keep
// track of the wiper state ourselves.
const utilStalkWipers = ref(0);

watch(utilStalkWipers, (value: number) => {
    gameSocket.pressInput(`wipers${value}`);
});

function utilStalkWipersInc() {
    if (utilStalkWipers.value < 3) {
        utilStalkWipers.value++;
    }
}

function utilStalkWipersDec() {
    if (utilStalkWipers.value > 0) {
        utilStalkWipers.value--;
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
// Game input demultiplexing
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
