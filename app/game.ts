import {TruckTelSocket} from "~/trucktel";
import {onUnmounted, reactive} from "vue";

/**
 * Raw game state, updated by trucktel.ts.
 */
export const game = {
    current: reactive({
        paused: null,
        job_expected: null,
    }),
    unpaused: reactive({
        time: null,
        rest_remain: null,
        nav_remain_time: null,
        nav_remain_dist: null,
    }),
};

/**
 * TruckTel socket. Can be used to send input.
 */
export const socket = new TruckTelSocket("dash");
socket.current = game.current;
socket.unpaused = game.unpaused;
socket.paused_key = "paused";
socket.throttle = 1000;
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
