import { onUnmounted, reactive, watch } from "vue";
import { TruckTelSocket } from "~/lib/trucktel";
import type { Configuration, ConfigurationData, GameState } from "~/types/globals";
import { useStorage } from "@vueuse/core";

// Default configuration + configuration structure.
export const configDefaults: ConfigurationData = {

    // Preferences.
    prefSelfTest: true,
    prefSelfTestNeedle: true,
    prefClock12: false,
    prefClockOffset: 0,
    prefGearDisplayMode: "gear",
    prefCruiseDisplayMode: "normal",
    prefSpeedUnit: "kmh",
    prefShading: true,
    prefTimezones: true,
    prefDisplayStartup: true,
    prefDisplayFollowsTruck: true,
    prefDisplayStandby: true,
    prefFuelFollowsAdBlue: true,
    prefFlashOverspeed: true,
    prefFlashRestIndicator: false,

    // Settings that trade graphical fidelity for rendering speed.
    perfTelemetryThrottle: 30,
    perfAnimationThrottle: 14,
    perfAnimateNeedles: true,
    perfNeedleDetails: true,
    perfAnimateIndicators: false,
    perfBloom: false,
    perfShadows: true,

    // Theme and rendering configuration.
    themeWorkspace: '#000',
    themeWorkspaceFollowsBackground: true,
    themeBackground: '#444',
    themePrimary: '#DDD',
    themeSecondary: '#F98',
    themeBacklight: '#CFA',
    themeDisplay: '#DDD',
    themeIndicatorRed: '#F10',
    themeIndicatorAmber: '#FA0',
    themeIndicatorGreen: '#0F6',
    themeIndicatorBlue: '#36F',
    themeSegments: '#0000000C',
    themeNeedle: '#C43',
    themeNeedleBacklight: '#FFF',
    themeNeedleStroke: '#0006',

    // Layout configuration.
    layoutInstrumentsEnabled: true,
    layoutInstrumentsPosition: { x1: 0.0, y1: 0.0, x2: 1.0, y2: 1.0 },
    layoutDisplay1Address: "",
    layoutDisplay1Position: { x1: 0.0, y1: 0.0, x2: 1.0, y2: 1.0 },
    layoutDisplay1Zoom: 0,
    layoutDisplay2Address: "",
    layoutDisplay2Position: { x1: 0.0, y1: 0.0, x2: 1.0, y2: 1.0 },
    layoutDisplay2Zoom: 0,

    // Stalk configuration.
    stalkGestureMode: "bothStalks",
    stalkGestureSwitches: "outer",
    stalkHoldForMenu: false,
    stalkSwap: "lhd",
    stalkInvertLowBeam: false,
    stalkInvertHighBeam: false,
    stalkInvertWipers: false,
    stalkInvertTransPaddle: false,
    stalkInvertTransBrake: false,
    stalkInvertTransMode: false,
    stalkInvertTransDirection: false,
    stalkSwapPaddleBrake: false,
    stalkSwapModeDirection: false,

};

// Game state. This is a global/singleton because it's updated by the socket,
// which we only want to have one of.
const gameState: GameState = {
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
            dash: null,
        },
        util: {
            wipers: null,
            cruiseControl: null,
            speedLimit: null,
        },
    }),
    derived: {
        transMode: computed(() => {
            switch (gameState.unpaused.transmission.mode) {
                case "manual":
                case "hshifter":
                    return "M";
            }
            return "A";
        }),
        transDirection: computed(() => {
            const gear = gameState.unpaused.transmission.indicatedGear;
            if (gear == null) return "N";
            if (gear > 0) return "D";
            if (gear < 0) return "R";
            return "N";
        }),
    }
};

// Game socket. This is a global singleton to avoid connection spam.
const gameSocket = new TruckTelSocket("dash");
gameSocket.current = gameState.current;
gameSocket.unpaused = gameState.unpaused;
gameSocket.paused_key = "paused";
gameSocket.dev_host = "localhost:8080";
gameSocket.debug = true;

// Register usage.
export function useGlobals(): { configuration: Configuration, gameState: GameState, gameSocket: TruckTelSocket } {

    // Load configuration.
    const configuration = useStorage(
        "config",
        configDefaults,
        localStorage,
        {mergeDefaults: true}
    );

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

    return { configuration, gameState, gameSocket };
}
