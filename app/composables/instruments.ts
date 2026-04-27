import { ref, computed } from "vue";
import { design } from "~/data/design";

export function useInstruments(gameState: any, configuration: any) {

    const mpsToKmh = 3.6;
    const psiToBar = 0.06894757;

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

    function updateNeedle(
        output: Ref<number, number>,
        target: number,
        power: boolean,
        test: boolean,
        design: { clp: [number, number], ofs: number, scl: number },
        speed: number,
        timeDelta: number,
    ) {
        if (power) {
            target *= design.scl;
            target += design.ofs;
        } else {
            target = design.scl > 0 ? design.clp[0] : design.clp[1];
        }

        // Animate only if needle animations are enabled.
        let pos: number = target;
        if (configuration.value.performance.animateNeedles) {
            if (test) {
                target = design.scl > 0 ? design.clp[1] : design.clp[0];
            }

            // The "control loop," if you can call it that, is completely yolo'd and
            // not based in reality. My only requirements were:
            //  - if the target doesn't move, animation must stop in finite time (e.g.
            //    we can't just use an IIR lowpass filter, because that never actually
            //    reaches its target exactly);
            //  - it should look natural.
            // The parameters differ based on whether electricity is enabled. If yes,
            // the needle is moved by a motorized servo loop in real life, which would
            // have a fairly low maximum speed but settles quickly. If no, the needle
            // is only forced back to the idle position by a spring in real life, so
            // it would move slower and with more damping. Parameters are adjusted by
            // eye, and the speed multiplier per needle is semi-randomized to make each
            // needle behave slightly differently.
            let damping: number;
            let dynamicRange: number;
            if (power) {
                speed *= 0.006;
                damping = 0.1;
                dynamicRange = 5;
            } else {
                speed *= 0.004;
                damping = 0.01;
                dynamicRange = 500;
            }
            pos = output.value;
            let error = target - pos;

            const minSpeed = speed * timeDelta;
            const maxSpeed = minSpeed * dynamicRange;

            let moveBy = Math.min(Math.max(-minSpeed, error), minSpeed);
            error -= moveBy;
            error *= damping;
            moveBy += Math.min(Math.max(-maxSpeed, error), maxSpeed);
            pos += moveBy;
        }

        pos = Math.min(Math.max(design.clp[0], pos), design.clp[1]);
        output.value = pos;
    }

    const gearCruise = computed(() => {
        let cc = gameState.unpaused.util.cruiseControl as any;
        if (typeof cc == "number" && cc > 0) {
            return Math.min(Math.round(cc * mpsToKmh), 99).toString().padStart(2, "!");
        }
        let gear = gameState.unpaused.transmission.indicatedGear as any;
        if (typeof gear != "number") return "!!";
        if (gear < 0) return "R" + Math.min(-gear, 9).toString();
        if (gear == 0) return "N!";
        return Math.min(gear, 99).toString().padStart(2, "!");
    });

    function computeSpeedingLevel() {
        let speed = gameState.unpaused.axles.speed as any;
        if (typeof speed != "number") return 0;
        speed /= 100; // scale in config.yaml
        const max = gameState.unpaused.util.speedLimit as any;
        if (typeof max != "number" || max <= 0) return 0;
        if (speed > max + 5) return 2;
        if (speed > max + 1) return 1;
        return 0;
    }

    const speeding = ref(false);

    let lastFuelConsumption = 0;

    const instruments = {
        backlight: computed(() => {
            if (gameState.unpaused.lights.low || gameState.unpaused.lights.parking) return 1.0;
            return 0.0;
        }),
        systemChecks: {
            lamps: ref(true),
            adBlue: ref(true),
            air: ref(true),
            srs: ref(true),
            alternator: ref(true),
            coolant: ref(true),
            engine: ref(true),
            fuel: ref(true),
            oil: ref(true),
            brakes: ref(true),
            powerSteering: ref(true),
            transmission: ref(true),
        },
        displays: {
            brightness: computed((): number => {
                if (!gameState.unpaused.electric.enabled) return 0.0;
                return 1.0;
            }),
            clock: computed((): string => {
                let time = gameState.unpaused.time.current as any;
                if (typeof time != "number") return "";
                time = Math.floor(time);
                const min = (time % 60).toString().padStart(2, "0");
                time = Math.floor(time / 60);
                const hrs = (time % 24).toString().padStart(2, "!");
                return `!${hrs}:${min}`;
            }),
            deadline: computed((): string => {
                const time = gameState.unpaused.time.current as any;
                if (typeof time != "number") return "";
                const exp = gameState.unpaused.time.jobExpected as any;
                if (typeof exp != "number") return "";
                return remainingTimeDisplay(exp - time);
            }),
            eta: computed((): string => {
                let remain = gameState.unpaused.time.navRemain as any;
                if (typeof remain != "number") return "";
                return remainingTimeDisplay(remain - remain);
            }),
            rest: computed((): string => {
                let remain = gameState.unpaused.time.restRemain as any;
                if (typeof remain != "number") return "";
                return remainingTimeDisplay(remain - remain);
            }),
            odometer: computed((): string => {
                let odo = gameState.unpaused.axles.odo as any;
                if (typeof odo != "number") return "";
                odo = Math.floor(odo);
                odo %= 1000000;
                return odo.toString().padStart(6, "0");
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
                return 1.0;
            }),
            adBlue: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (instruments.systemChecks.adBlue.value) return true;
                if (gameState.unpaused.adBlue.indicator) return true;
                return false;
            }),
            air: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (instruments.systemChecks.air.value) return true;
                if (gameState.unpaused.air.indicator) return true;
                return false;
            }),
            airbag: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (instruments.systemChecks.srs.value) return true;
                return false;
            }),
            axleLift: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (instruments.systemChecks.lamps.value) return true;
                if (gameState.unpaused.axles.liftTruck) return true;
                if (gameState.unpaused.axles.liftTrailer) return true;
                return false;
            }),
            battery: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (instruments.systemChecks.alternator.value) return true;
                if (gameState.unpaused.electric.indicator) return true;
                return false;
            }),
            beacon: computed((): boolean => {
                if (instruments.systemChecks.lamps.value) return true;
                if (gameState.unpaused.lights.beacon) return true;
                return false;
            }),
            coolant: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (instruments.systemChecks.coolant.value) return true;
                if (gameState.unpaused.coolant.indicator) return true;
                return false;
            }),
            cruiseControl: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (instruments.systemChecks.lamps.value) return true;
                if (gameState.unpaused.util.cruiseControl) return true;
                return false;
            }),
            diffLock: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (instruments.systemChecks.lamps.value) return true;
                if (gameState.unpaused.transmission.diffLock) return true;
                return false;
            }),
            engine: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (instruments.systemChecks.engine.value) return true;
                if (gameState.unpaused.engine.wear === null) return false;
                if (gameState.unpaused.engine.wear > 60) return true;
                return false;
            }),
            fuel: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (instruments.systemChecks.fuel.value) return true;
                if (gameState.unpaused.fuel.indicator) return true;
                return false;
            }),
            gameDisconnected: computed((): boolean => {
                return gameState.current.paused === null;
            }),
            gamePaused: computed((): boolean => {
                return gameState.current.paused === true;
            }),
            highBeam: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (instruments.systemChecks.lamps.value) return true;
                if (!gameState.unpaused.lights.low) return false;
                if (gameState.unpaused.lights.high) return true;
                return false;
            }),
            lowBeam: computed((): boolean => {
                if (instruments.systemChecks.lamps.value) return true;
                if (gameState.unpaused.lights.low) return true;
                return false;
            }),
            oil: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (instruments.systemChecks.oil.value) return true;
                if (gameState.unpaused.oil.indicator) return true;
                return false;
            }),
            parkingBrake: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (instruments.systemChecks.brakes.value) return true;
                if (gameState.unpaused.brake.parking) return true;
                return false;
            }),
            parkingLights: computed((): boolean => {
                if (instruments.systemChecks.lamps.value) return true;
                if (gameState.unpaused.lights.low) return false;
                if (gameState.unpaused.lights.parking) return true;
                return false;
            }),
            powerSteering: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (instruments.systemChecks.lamps.value) return true;
                if (instruments.systemChecks.powerSteering.value) return true;
                return false;
            }),
            retarder: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (instruments.systemChecks.lamps.value) return true;
                if (gameState.unpaused.brake.retarder) return true;
                if (gameState.unpaused.brake.motor) return true;
                return false;
            }),
            speeding: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (instruments.systemChecks.lamps.value) return true;
                return speeding.value;
            }),
            transmission: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (instruments.systemChecks.transmission.value) return true;
                if (gameState.unpaused.transmission.wear !== null && gameState.unpaused.transmission.wear > 60) return true;
                if (gameState.unpaused.transmission.realGear === 0) return false;
                if (gameState.unpaused.transmission.indicatedGear !== gameState.unpaused.transmission.realGear) return true;
                return false;
            }),
            turnLeft: computed((): boolean => {
                if (instruments.systemChecks.lamps.value) return true;
                if (gameState.unpaused.lights.turnLeft) return true;
                return false;
            }),
            turnRight: computed((): boolean => {
                if (instruments.systemChecks.lamps.value) return true;
                if (gameState.unpaused.lights.turnRight) return true;
                return false;
            }),
        },
        needleTargets: {
            air: computed((): number => {
                const psi = gameState.unpaused.air.pressure as any;
                if (typeof psi != "number") return 0;
                return psi * psiToBar / 10; // revert rounding scale from config.yaml
            }),
            coolant: computed((): number => {
                const coolant = gameState.unpaused.coolant.temperature as any;
                if (typeof coolant != "number") return 0;
                return coolant / 2; // revert rounding scale from config.yaml
            }),
            fuel: computed((): number => {
                const amount = gameState.unpaused.fuel.amount as any;
                if (typeof amount != "number") return 0;
                const capacity = gameState.unpaused.fuel.capacity as any;
                if (typeof capacity != "number" || capacity < 1) return 0;
                return amount / capacity;
            }),
            adBlue: computed((): number => {
                const amount = gameState.unpaused.adBlue.amount as any;
                if (typeof amount != "number") return 0;
                const capacity = gameState.unpaused.adBlue.capacity as any;
                if (typeof capacity != "number" || capacity < 1) return 0;
                return amount / capacity;
            }),
            oil: computed((): number => {
                const psi = gameState.unpaused.oil.pressure as any;
                if (typeof psi != "number") return 0;
                return psi * psiToBar / 10; // revert rounding scale from config.yaml
            }),
            speed: computed((): number => {
                const speed = gameState.unpaused.axles.speed as any;
                if (typeof speed != "number") return 0;
                return Math.abs(speed) / 100; // revert rounding scale from config.yaml
            }),
            rpm: computed((): number => {
                const rpm = gameState.unpaused.engine.rpm as any;
                if (typeof rpm != "number") return 0;
                const limit = gameState.unpaused.engine.rpmLimit as any;
                if (typeof limit != "number" || limit < 1) return 0;
                return rpm / limit;
            }),
            consumption: computed((): number => {
                let amount = gameState.unpaused.fuel.consumption as any;
                if (typeof amount != "number") amount = 0;
                if (amount == 0) {
                    amount = lastFuelConsumption;
                } else {
                    lastFuelConsumption = amount;
                }
                return amount / 10;
            }),
        },
        needles: {
            air: ref(design.layer1.ndl.air.clp[1]),
            coolant: ref(design.layer1.ndl.coolant.clp[0]),
            fuel: ref(design.layer1.ndl.fuel.clp[0]),
            oil: ref(design.layer1.ndl.oil.clp[1]),
            speed: ref(design.layer1.ndl.speed.clp[0]),
            rpm: ref(design.layer0.ndl.rpm.clp[0]),
            consumption: ref(design.layer0.ndl.consumption.clp[1]),
        },
    };

    // Timers for various animations.
    let electricEnabledMillis: number = 0;
    let engineRunningMillis: number = 0;
    let blink: number = 0;

    function animate(timeDelta: number) {
        // Get main vehicle system state.
        const power = !!gameState.unpaused.electric.enabled;
        const rpm = gameState.unpaused.engine.rpm as any;
        const engine = typeof rpm === "number" && rpm > 200;

        // Update timers.
        if (power) {
            electricEnabledMillis += timeDelta;
            blink += timeDelta / 600;
            blink %= 1;
        } else {
            electricEnabledMillis = 0;
            blink = 0;
        }
        if (engine) {
            engineRunningMillis += timeDelta;
        } else {
            engineRunningMillis = 0;
        }

        // Animate needles.
        const test = power && electricEnabledMillis < 1500;
        updateNeedle(instruments.needles.air, instruments.needleTargets.air.value, power, test, design.layer1.ndl.air, 6, timeDelta);
        updateNeedle(instruments.needles.coolant, instruments.needleTargets.coolant.value, power, test, design.layer1.ndl.coolant, 4.5, timeDelta);
        updateNeedle(instruments.needles.fuel, Math.min(instruments.needleTargets.fuel.value, instruments.needleTargets.adBlue.value), power, test, design.layer1.ndl.fuel, 4, timeDelta);
        updateNeedle(instruments.needles.oil, instruments.needleTargets.oil.value, power, test, design.layer1.ndl.oil, 5, timeDelta);
        updateNeedle(instruments.needles.speed, instruments.needleTargets.speed.value, power, test, design.layer1.ndl.speed, 5.3, timeDelta);
        updateNeedle(instruments.needles.rpm, instruments.needleTargets.rpm.value, power, test, design.layer0.ndl.rpm, 5.5, timeDelta);
        updateNeedle(instruments.needles.consumption, instruments.needleTargets.consumption.value, power, test, design.layer0.ndl.consumption, 2, timeDelta);

        // Model startup/self-tests of electrical systems.
        instruments.systemChecks.lamps.value = power && electricEnabledMillis < 1000;
        instruments.systemChecks.air.value = electricEnabledMillis < 1400;
        instruments.systemChecks.coolant.value = electricEnabledMillis < 1850;
        instruments.systemChecks.fuel.value = electricEnabledMillis < 2400;
        instruments.systemChecks.adBlue.value = electricEnabledMillis < 2600;
        instruments.systemChecks.brakes.value = electricEnabledMillis < 3300;
        instruments.systemChecks.transmission.value = electricEnabledMillis < 4100;
        instruments.systemChecks.srs.value = electricEnabledMillis < 5900;

        // Model startup/self-tests of engine-powered systems.
        instruments.systemChecks.oil.value = engineRunningMillis < 1100;
        instruments.systemChecks.alternator.value = engineRunningMillis < 1800;
        instruments.systemChecks.engine.value = engineRunningMillis < 2800;
        instruments.systemChecks.powerSteering.value = engineRunningMillis < 4900;

        // Animate the speeding indicator.
        switch (computeSpeedingLevel()) {
            case 0:
                speeding.value = false;
                break;
            case 1:
                speeding.value = true;
                break;
            default:
                speeding.value = blink > 0.5;
                break;
        }
    }

    useAnimation(animate);

    return { instruments };
}