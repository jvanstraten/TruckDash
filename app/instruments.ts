import { ref, computed } from "vue";
import { game } from "./game"

/*class Needle {

    angle = ref(0);

    clip_min: number = 0.0
}*/

function remainingTimeDisplay(remain: number): string {
    remain = Math.max(0, remain);
    remain = Math.floor(remain);
    let min = remain % 60;
    remain = Math.floor(remain / 60);
    let hrs = remain;
    if (hrs > 199) {
        hrs = 199;
        min = 59;
    }
    let hrsf = hrs.toString().padStart(3, "!");
    let minf = min.toString().padStart(2, "0");
    return `${hrsf}:${minf}`;
}

const gearCruise = computed(() => {
    let cc = game.unpaused.util.cruiseControl as any;
    if (typeof cc == "number" && cc > 0) {
        return Math.min(cc, 99).toString().padStart(2, "!");
    }
    let gear = game.unpaused.transmission.indicatedGear as any;
    if (typeof gear != "number") return "!!";
    if (gear < 0) return "R" + Math.min(-gear, 9).toString();
    if (gear == 0) return "N!";
    return Math.min(gear, 99).toString().padStart(2, "!");
});

const lampTest = ref(false);
const lampTest2 = ref(false);
const lampTest3 = ref(false);

export const instruments = {
    backlight: computed(() => {
        if (!game.unpaused.electric.enabled) return 0.0;
        if (game.unpaused.lights.low) return 1.0;
        return 0.0;
    }),
    displays: {
        brightness: computed((): number => {
            if (!game.unpaused.electric.enabled) return 0.0;
            if (game.unpaused.lights.low) return 0.5;
            return 1.0;
        }),
        clock: computed((): string => {
            let time = game.unpaused.time.current as any;
            if (typeof time != "number") return "";
            time = Math.floor(time);
            const min = (time % 60).toString().padStart(2, "0");
            time = Math.floor(time / 60);
            const hrs = (time % 24).toString().padStart(2, "!");
            return `!${hrs}:${min}`;
        }),
        deadline: computed((): string => {
            const time = game.unpaused.time.current as any;
            if (typeof time != "number") return "";
            const exp = game.unpaused.time.jobExpected as any;
            if (typeof exp != "number") return "";
            return remainingTimeDisplay(exp - time);
        }),
        eta: computed((): string => {
            let remain = game.unpaused.time.navRemain as any;
            if (typeof remain != "number") return "";
            return remainingTimeDisplay(remain - remain);
        }),
        rest: computed((): string => {
            let remain = game.unpaused.time.restRemain as any;
            if (typeof remain != "number") return "";
            return remainingTimeDisplay(remain - remain);
        }),
        odometer: computed((): string => {
            let odo = game.unpaused.axles.odo as any;
            if (typeof odo != "number") return "";
            odo = Math.floor(odo);
            odo %= 1000000;
            return odo.toString().padStart(2, "6");
        }),
        gearCruiseL: computed((): string => {
            return (gearCruise.value + "!!")[0] as string;
        }),
        gearCruiseR: computed((): string => {
            return (gearCruise.value + "!!")[1] as string;
        }),
    },
    indicators: {
        brightness: computed((): number => {
            if (game.unpaused.lights.low) return 0.8;
            return 1.0;
        }),
        adBlue: computed((): boolean => {
            if (!game.unpaused.electric.enabled) return false;
            if (lampTest.value) return true;
            if (game.unpaused.adBlue.indicator) return true;
            return false;
        }),
        air: computed((): boolean => {
            if (!game.unpaused.electric.enabled) return false;
            if (lampTest.value) return true;
            if (game.unpaused.air.indicator) return true;
            return false;
        }),
        airbag: computed((): boolean => {
            if (!game.unpaused.electric.enabled) return false;
            if (lampTest3.value) return true;
            return false;
        }),
        axleLift: computed((): boolean => {
            if (!game.unpaused.electric.enabled) return false;
            if (game.unpaused.axles.liftTruck) return true;
            if (game.unpaused.axles.liftTrailer) return true;
            return false;
        }),
        battery: computed((): boolean => {
            if (!game.unpaused.electric.enabled) return false;
            if (lampTest.value) return true;
            if (game.unpaused.electric.indicator) return true;
            return false;
        }),
        beacon: computed((): boolean => {
            if (game.unpaused.lights.beacon) return true;
            return false;
        }),
        coolant: computed((): boolean => {
            if (!game.unpaused.electric.enabled) return false;
            if (lampTest.value) return true;
            if (game.unpaused.coolant.indicator) return true;
            return false;
        }),
        cruiseControl: computed((): boolean => {
            if (!game.unpaused.electric.enabled) return false;
            if (game.unpaused.util.cruiseControl) return true;
            return false;
        }),
        diffLock: computed((): boolean => {
            if (!game.unpaused.electric.enabled) return false;
            if (game.unpaused.transmission.diffLock) return true;
            return false;
        }),
        engine: computed((): boolean => {
            if (!game.unpaused.electric.enabled) return false;
            if (lampTest.value) return true;
            if (game.unpaused.engine.wear === null) return false;
            if (game.unpaused.engine.wear > 0.6) return true;
            return false;
        }),
        fuel: computed((): boolean => {
            if (!game.unpaused.electric.enabled) return false;
            if (lampTest.value) return true;
            if (game.unpaused.fuel.indicator) return true;
            return false;
        }),
        gameDisconnected: computed((): boolean => {
            return game.current.paused === null;
        }),
        gamePaused: computed((): boolean => {
            return game.current.paused === true;
        }),
        highBeam: computed((): boolean => {
            if (!game.unpaused.lights.low) return false;
            if (game.unpaused.lights.high) return true;
            return false;
        }),
        lowBeam: computed((): boolean => {
            if (game.unpaused.lights.low) return true;
            return false;
        }),
        oil: computed((): boolean => {
            if (!game.unpaused.electric.enabled) return false;
            if (lampTest.value) return true;
            if (game.unpaused.oil.indicator) return true;
            return false;
        }),
        parkingBrake: computed((): boolean => {
            if (!game.unpaused.electric.enabled) return false;
            if (lampTest.value) return true;
            if (game.unpaused.brake.parking) return true;
            return false;
        }),
        parkingLights: computed((): boolean => {
            if (game.unpaused.lights.low) return false;
            if (game.unpaused.lights.parking) return true;
            return false;
        }),
        powerSteering: computed((): boolean => {
            if (!game.unpaused.electric.enabled) return false;
            if (lampTest2.value) return true;
            return false;
        }),
        retarder: computed((): boolean => {
            if (!game.unpaused.electric.enabled) return false;
            if (game.unpaused.brake.retarder) return true;
            if (game.unpaused.brake.motor) return true;
            return false;
        }),
        speeding: computed((): boolean => {
            if (!game.unpaused.electric.enabled) return false;
            if (lampTest2.value) return true;
            let speed = game.unpaused.axles.speed as any;
            if (typeof speed != "number") return false;
            speed /= 10; // scale in config.yaml
            const max = game.unpaused.util.speedLimit as any;
            if (typeof max != "number") return false;
            if (speed > max + 1) return true;
            return false;
        }),
        transmission: computed((): boolean => {
            if (!game.unpaused.electric.enabled) return false;
            if (lampTest.value) return true;
            if (game.unpaused.transmission.wear !== null && game.unpaused.transmission.wear > 0.6) return true;
            if (game.unpaused.transmission.realGear === 0) return false;
            if (game.unpaused.transmission.indicatedGear !== game.unpaused.transmission.realGear) return true;
            return false;
        }),
        turnLeft: computed((): boolean => {
            if (game.unpaused.lights.turnLeft) return true;
            return false;
        }),
        turnRight: computed((): boolean => {
            if (game.unpaused.lights.turnRight) return true;
            return false;
        }),
    },
    needles: {
        air: ref(0),
        coolant: ref(0),
        fuel: ref(0),
        oil: ref(0),
        speed: ref(0),
        rpm: ref(0),
        consumption: ref(0),
    },
};

let previous: number = 0;

function step(timestamp: number) {
    /*const elapsed = (previous === undefined) ? 0.0 : timestamp - previous;
    previous = timestamp;*/
    /*instruments.needles.air.value = timestamp * 0.1;
    instruments.needles.coolant.value = timestamp * 0.11;
    instruments.needles.fuel.value = timestamp * 0.12;
    instruments.needles.oil.value = timestamp * 0.13;
    instruments.needles.speed.value = timestamp * 0.2;
    instruments.needles.rpm.value = timestamp * 0.15;
    instruments.needles.consumption.value = timestamp * 0.16;*/
    requestAnimationFrame(step);
}

if (window !== undefined) {
    window.requestAnimationFrame(step);
}
