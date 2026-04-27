import {TruckTelSocket} from "~/trucktel";
import {onUnmounted, reactive} from "vue";

/**
 * Raw game state, updated by trucktel.ts.
 */
export const game = {
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

/**
 * TruckTel socket. Can be used to send input.
 */
export const socket = new TruckTelSocket("dash");
socket.current = game.current;
socket.unpaused = game.unpaused;
socket.paused_key = "paused";
socket.throttle = 0;
socket.debug = true;

/**
 * Register usage of the socket.
 */
export function useGame() {
    onMounted(() => {
        console.info("mounted game.ts");
        socket.open();
    });

    onUnmounted(() => {
        console.info("unmounted game.ts");
        socket.close();
    });

    return {game, socket};
}
