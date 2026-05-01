import { onMounted, onUnmounted, reactive, watch } from "vue";
import { TruckTelSocket } from "~/lib/trucktel";

export type GameState = {
    current: {
        paused: null | boolean,
    },
    unpaused: {
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
            dash: null | boolean,
        },
        util: {
            wipers: null | number,
            cruiseControl: null | number,
            speedLimit: null | number,
        },
    },
    derived: {
        transMode: ComputedRef<"M" | "A">,
        transDirection: ComputedRef<"R" | "N" | "D">,
    },
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
export function useGame(configuration: Configuration): { gameState: GameState, gameSocket: TruckTelSocket } {

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

    return { gameState, gameSocket };
}
