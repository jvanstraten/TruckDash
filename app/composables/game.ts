import {onMounted, onUnmounted, reactive, watch, ref, computed} from "vue";
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
        backlightBrightness: globalThis.ComputedRef<number>,
        displayBrightness: globalThis.ComputedRef<number>,
        indicatorBrightness: globalThis.ComputedRef<number>,
        integratedLightingBrightness: globalThis.ComputedRef<number>,
        highBeamIndicatorOverride: globalThis.ComputedRef<boolean>,
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
// Backlight logic
//-----------------------------------------------------------------------------

// Backlight intensity for the instrument cluster.
const backlightBrightness = computed(() => {
    if (telemetryState.unpaused.lights.low || telemetryState.unpaused.lights.parking) return 1.0;
    return 0.0;
});

// Brightness of the instrument cluster displays.
const displayBrightness = computed((): number => {
    if (!telemetryState.unpaused.electric.enabled) return 0.0;
    return 1.0;
});

// Brightness of the instrument cluster indicators.
const indicatorBrightness = computed(() => {
    return 1.0;
});

// Backlight intensity for integrated lighting outside the instrument cluster.
const integratedLightingBrightness = computed(() => {
    if (!telemetryState.unpaused.electric.enabled) return 0.0;
    return 0.3;
});


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

// Time that the light horn stays on for a single input.
let utilStalkHighBeamCfgLightHornMillis: number = 800;

function utilStalkHighBeamSyncCfg(configuration: ConfigurationData) {
    utilStalkHighBeamCfgLightHornMode.value = configuration.stalkLightHornMode;
    utilStalkHighBeamCfgLightHornMillis = configuration.stalkLightHornTimer;
}

// Timer for light horn behavior.
const utilStalkHighBeamLightHornTimer = ref<undefined | number>(undefined);

// Light horn active flag. The game doesn't report the high beams as being
// on via telemetry when the light horn button is used, even though the
// high-beam indicator light *does* come on. So we need to work around that.
const highBeamIndicatorOverride = computed(() => {
    return utilStalkHighBeamLightHornTimer.value !== undefined;
})

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

// Internal state. This is +/-1 for momentary input (kept on until
// 'MomentaryRemain counts down) or +/-2 for locked in place (kept on until the
// steering wheel moves far enough).
const utilStalkBlinkersState = ref(0);

// Timer for returning the stalk to its center position when giving momentary
// input.
let utilStalkBlinkersTimer: number | undefined = undefined;
function utilStalkBlinkersRunTimer(enable: boolean) {
    if (utilStalkBlinkersTimer !== undefined) {
        window.clearTimeout(utilStalkBlinkersTimer);
        utilStalkBlinkersTimer = undefined;
    }
    if (enable) {
        utilStalkBlinkersTimer = window.setTimeout(() => {
            utilStalkBlinkers.value = 0;
            utilStalkBlinkersTimer = undefined;
        }, 200);
    }
}

// If the internal state changes, update the visual state, and maybe (re)start
// the timer to reset it for momentary input.
let utilStalkBlinkersStatePrev: number = 0;
watch(utilStalkBlinkersState, (value: number) => {
    // Vue probably does this as well, but just to be safe...
    if (value == utilStalkBlinkersStatePrev) return;
    utilStalkBlinkersStatePrev = value;
    utilStalkBlinkers.value = value / 2;
    utilStalkBlinkersRunTimer(Math.abs(value) == 1);
});

// Number of flashes remaining for momentary mode.
let utilStalkBlinkersMomentaryRemain = 0;

// Whether either blinker was on in the game before the following watch
// callback. Previous value from Vue doesn't work for some reason.
let utilStalkBlinkersPrevOn: boolean = false;

watch(telemetryState.unpaused.lights, (value: { turnLeft: null | boolean, turnRight: null | boolean }) => {
    // Turn off blinkers if stalk is in +/-1 position and the blinkers have
    // flashed three times.
    if (Math.abs(utilStalkBlinkersState.value) != 1) return;
    const newBlinkerOn = !!value.turnLeft || !!value.turnRight;
    const blinkerTurnedOff = utilStalkBlinkersPrevOn && !newBlinkerOn;
    utilStalkBlinkersPrevOn = newBlinkerOn;
    if (!blinkerTurnedOff) return;
    utilStalkBlinkersMomentaryRemain--;
    if (utilStalkBlinkersMomentaryRemain > 0) return;
    utilStalkBlinkersState.value = 0;
});

// Steering extreme position in the direction of the blinker since the blinker
// was enabled.
let utilStalkBlinkersSteeringMax = 0;

watch(telemetryState.unpaused.lights, (value: { turnSwSteer: null | number }) => {
    // Turn off blinkers if stalk is in +/-2 position and the steering wheel
    // has turned by more than X% in the reverse direction of the blinker.
    if (Math.abs(utilStalkBlinkersState.value) != 2) return;
    if (utilStalkBlinkersCfgAutoOffSensitivity == 0) return;
    let steeringState = value.turnSwSteer ?? 0;
    if (utilStalkBlinkersState.value < 0) steeringState = -steeringState;
    utilStalkBlinkersSteeringMax = Math.max(utilStalkBlinkersSteeringMax, steeringState);
    if (steeringState > utilStalkBlinkersSteeringMax - utilStalkBlinkersCfgAutoOffSensitivity) return;
    utilStalkBlinkersState.value = 0;
});

watch(utilStalkBlinkersState, (value: number) => {
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

function utilStalkBlinkersAdj(dir: "left" | "right") {
    const sign = {left: 1, right: -1}[dir];
    switch (utilStalkBlinkersState.value * sign) {
        case -2:
            utilStalkBlinkersMomentaryRemain = 0;
            utilStalkBlinkersState.value = 0;
            break;
        case -1:
        case 0:
            if (utilStalkBlinkersCfgMomentaryCount > 0) {
                if (telemetryState.current.paused === false && telemetryState.unpaused.electric.enabled) {
                    utilStalkBlinkersMomentaryRemain = utilStalkBlinkersCfgMomentaryCount;
                    utilStalkBlinkersState.value = sign;
                } else {
                    // Hack: still show the animation when electricity is off.
                    utilStalkBlinkers.value = sign / 2;
                    utilStalkBlinkersRunTimer(true);
                }
                break;
            }
            // fallthrough
        case 1:
            utilStalkBlinkersSteeringMax = (telemetryState.unpaused.lights.turnSwSteer ?? 0) * sign;
            utilStalkBlinkersState.value = 2 * sign;
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
    return {R: -1, N: 0, D: 1}[transDirection.value];
});

function transStalkDirectionInc() {
    switch (transDirection.value) {
        case "R":
            gameSocket.pressInput("gear0");
            break;
        case "N":
            gameSocket.pressInput("geardrive");
            break;
    }
}

function transStalkDirectionDec() {
    switch (transDirection.value) {
        case "D":
            gameSocket.pressInput("gear0");
            break;
        case "N":
            gameSocket.pressInput("gearreverse");
            break;
    }
}

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

function transStalkModeInc() {
    if (transMode.value == "M") {
        gameSocket.pressInput("transemi");
    }
}

function transStalkModeDec() {
    if (transMode.value == "A") {
        gameSocket.pressInput("transemi");
    }
}

//-----------------------------------------------------------------------------
// Gear shifting logic
//-----------------------------------------------------------------------------

// Transmission positive gear index, ignoring neutral.
const transGearIndex = computed(() => {
    return Math.max(1, Math.abs(telemetryState.unpaused.transmission.indicatedGear ?? 0));
});

// Map the control inputs directly to the game, i.e. don't try to model
// semi-automatic transmission controls.
let transStalkGearCfgMode: "semi" | "directWithHints" | "fullDirect" | "disabled" = "semi";

function transStalkGearSyncCfg(configuration: ConfigurationData) {
    transStalkGearCfgMode = configuration.stalkTransStalkMode;
}

// Gear shift stalk position. Just for visual feedback.
const transStalkGear = ref(0);

// Timer for returning the stalk to its center position.
let transStalkGearTimer: number | undefined = undefined;

function transStalkGearStartTimer() {
    if (transStalkGearTimer !== undefined) {
        window.clearTimeout(transStalkGearTimer);
    }
    transStalkGearTimer = window.setTimeout(() => {
        transStalkGear.value = 0;
        transStalkGearTimer = undefined;
    }, 200);
}

function transStalkGearAdj(dir: "up" | "down") {
    if (transStalkGearCfgMode == "disabled") return;

    transStalkGear.value = dir == "up" ? 1 : -1;
    transStalkGearStartTimer();

    switch (transStalkGearCfgMode) {
        case "directWithHints":
            // Use hints only when the truck is moving, otherwise it's
            // impossible to switch between R/N/D.
            if (transMode.value == "A" && Math.abs(telemetryState.unpaused.axles.speed ?? 0) >= 10) {
                gameSocket.pressInput(`gear${dir}hint`);
                break;
            }
            // fallthrough
        case "fullDirect":
            gameSocket.pressInput(`gear${dir}`);
            break;
        case "semi":
            if (transDirection.value == "N") break;

            // Don't shift (or hint) below first gear. Hinting below first gear
            // seems to overflow an internal counter!
            if (dir == "down" && transGearIndex.value <= 1) break;

            // Swap direction if in reverse, to convert to the game's
            // sequential gearbox inputs.
            if (transDirection.value == "R") {
                // @ts-ignore
                dir = {up: "down", down: "up"}[dir];
            }

            // Always use hints when in automatic mode, since R/N/D is
            // controlled via a separate switch.
            if (transMode.value == "A") {
                gameSocket.pressInput(`gear${dir}hint`);
            } else {
                gameSocket.pressInput(`gear${dir}`);
            }
            break;
    }
}

//-----------------------------------------------------------------------------
// Engine brake and retarder logic
//-----------------------------------------------------------------------------

// Configures which game input the brake lever is mapped to.
let transStalkBrakeCfgMode: "auto" | "retarder" | "engine" = "auto";

function transStalkBrakeSyncCfg(configuration: ConfigurationData) {
    transStalkBrakeCfgMode = configuration.stalkBrakingMode;
}

// Retarder stalk position. Just for visual feedback.
const transStalkBrake = ref(0);

// Timer for returning the stalk to its center position.
let transStalkBrakeTimer: number | undefined = undefined;

function transStalkBrakeStartTimer() {
    if (transStalkBrakeTimer !== undefined) {
        window.clearTimeout(transStalkBrakeTimer);
    }
    transStalkBrakeTimer = window.setTimeout(() => {
        transStalkBrake.value = 0;
        transStalkBrakeTimer = undefined;
    }, 200);
}

function transStalkBrakeAdj(dir: "inc" | "dec") {
    let mapToRetarder: boolean;
    let feedback = true;
    if (transStalkBrakeCfgMode == "retarder") {
        mapToRetarder = true;
        feedback = (telemetryState.unpaused.brake.retarderMax ?? 0) > 0;
    } else if (transStalkBrakeCfgMode == "engine") {
        mapToRetarder = false;
    } else {
        mapToRetarder = (telemetryState.unpaused.brake.retarderMax ?? 0) > 0;
    }

    if (feedback) {
        transStalkBrake.value = dir == "inc" ? 1 : -1;
        transStalkBrakeStartTimer();
    }

    if (mapToRetarder) {
        gameSocket.pressInput(dir == "inc" ? "retarderup" : "retarderdown");
    } else {
        gameSocket.pressInput(dir == "inc" ? "engbrakeup" : "engbrakedwn");
    }
}

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
        case "blinkers-inc": utilStalkBlinkersAdj("left"); break;
        case "blinkers-dec": utilStalkBlinkersAdj("right"); break;
        case "wipers-inc": utilStalkWipersInc(); break;
        case "wipers-dec": utilStalkWipersDec(); break;
        case "transGear-inc": transStalkGearAdj("up"); break;
        case "transGear-dec": transStalkGearAdj("down"); break;
        case "transBrake-inc": transStalkBrakeAdj("inc"); break;
        case "transBrake-dec": transStalkBrakeAdj("dec"); break;
        case "transDirection-inc": transStalkDirectionInc(); break;
        case "transDirection-dec": transStalkDirectionDec(); break;
        case "transMode-inc": transStalkModeInc(); break;
        case "transMode-dec": transStalkModeDec(); break;
    }
}

function syncControlBehaviorConfig(configuration: ConfigurationData) {
    utilStalkLowBeamSyncCfg(configuration);
    utilStalkHighBeamSyncCfg(configuration);
    utilStalkBlinkersSyncCfg(configuration);
    transStalkGearSyncCfg(configuration);
    transStalkBrakeSyncCfg(configuration);
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
                backlightBrightness,
                displayBrightness,
                indicatorBrightness,
                integratedLightingBrightness,
                highBeamIndicatorOverride,
                transMode,
                transDirection,
                transGearIndex,
                transStalkMode,
                transStalkDirection,
                transStalkShift: transStalkGear,
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
