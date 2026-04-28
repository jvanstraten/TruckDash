import { onUnmounted, reactive, watch } from "vue";
import { TruckTelSocket } from "~/lib/trucktel";
import {useStorage} from "@vueuse/core";

// Default configuration + configuration structure.
export const configDefaults = {

    // Preferences.
    preferences: {
        // Whether to enable shading based on the current time.
        shading: true,

        // Whether timezones are enabled in the game. Only affects dashboard
        // shading.
        timezones: true,
    },

    // Settings that trade graphical fidelity for rendering speed.
    performance: {
        // Throttle value in milliseconds passed to TruckTel to avoid spamming
        // updates. Animation aside, higher values reduce framerate.
        telemetryThrottle: 0,

        // Whether to animate needle positions, to give them some inertia when
        // values change quickly.
        animateNeedles: true,

        // Add some extra visual detail to the needles to make them not look as
        // flat.
        needleDetails: true,

        // Whether to fade indicators in and out. Gives a bulb-like effect.
        // The LED-based indicators used in modern dashboards do not fade in
        // and out.
        animateIndicators: false,

        // Whether to render a glow effect for things that emit light.
        bloom: false,

        // Whether to render shadows.
        shadows: true,
    },

    // Theme and rendering configuration.
    theme: {
        // Dashboard background color.
        background: '#444',

        // Primary diffuse color for dashboard markings.
        primary: '#DDD',

        // Secondary diffuse color used for out-of-range dashboard markings.
        secondary: '#F98',

        // Backlight color for dashboard markings.
        backlight: '#CFA',

        // Emission color for the displays.
        display: '#DDD',

        // Emission color for red indicators.
        indicatorRed: '#F10',

        // Emission color for amber indicators.
        indicatorAmber: '#FA0',

        // Emission color for green indicators.
        indicatorGreen: '#0F6',

        // Emission color for blue indicators.
        indicatorBlue: '#36F',

        // Color for segments and indicators that are off, to make them
        // slightly visible when the dashboard is brightly lit.
        segments: '#0000000C',

        // Color for the needles.
        needle: '#C43',

        // Stroke color for the needles when needle details are enabled.
        needleStroke: '#0006',
    },

};

// Game state. This is a global/singleton because it's updated by the socket,
// which we only want to have one of.
const gameState = {
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
            dash: null,
        },
        util: {
            cruiseControl: null,
            speedLimit: null,
        },
    }),
};

// Game socket. This is a global singleton to avoid connection spam.
const gameSocket = new TruckTelSocket("dash");
gameSocket.current = gameState.current;
gameSocket.unpaused = gameState.unpaused;
gameSocket.paused_key = "paused";
gameSocket.dev_host = "localhost:8080";
gameSocket.debug = true;

// Register usage.
export function useGlobals() {

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
    watch(() => configuration.value.performance.telemetryThrottle, () => {
        gameSocket.throttle = configuration.value.performance.telemetryThrottle;
        gameSocket.reopen();
    }, { immediate: true });

    return { configuration, gameState, gameSocket };
}
