import { ref, computed } from "vue";
import { design } from "~/data/design";
import { useAnimation } from "~/composables/animation";
import type { Configuration, GameState } from "~/types/globals";
import type { Instruments } from "~/types/instruments";
import type { NeedleConfig } from "~/types/design";

export function useInstruments(gameState: GameState, configuration: Configuration): { instruments: Instruments } {

    const mpsToKmh = 3.6;
    const mpsToMph = 2.236936;
    const psiToBar = 0.06894757;

    function remainingTimeDisplay(remain: number): string {
        const negative = remain < 0;
        remain = Math.abs(remain);
        remain = Math.floor(remain);
        let min = remain % 60;
        remain = Math.floor(remain / 60);
        let hrs = remain;
        if (!negative) {
            if (hrs > 199) {
                hrs = 199;
                min = 59;
            }
        } else {
            if (hrs > 9) {
                hrs = 9;
                min = 59;
            }
            hrs = -hrs;
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
        needleConfig: NeedleConfig,
        speed: number,
        timeDelta: number,
    ) {
        if (power) {
            target *= needleConfig.scl;
            target += needleConfig.ofs;
        } else {
            target = needleConfig.scl > 0 ? needleConfig.clp[0] : needleConfig.clp[1];
        }

        // Animate only if needle animations are enabled.
        let pos: number = target;
        if (configuration.value.perfAnimateNeedles) {
            if (test) {
                target = needleConfig.scl > 0 ? needleConfig.clp[1] : needleConfig.clp[0];
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

        pos = Math.min(Math.max(needleConfig.clp[0], pos), needleConfig.clp[1]);
        output.value = pos;
    }

    const gearCruise = computed(() => {
        const config = configuration.value;
        if (config.prefGearDisplayMode == "speed") {
            let speed = gameState.unpaused.axles.speed;
            if (typeof speed != "number") return "!!";
            const factor = config.prefSpeedUnit == "mph" ? mpsToMph : mpsToKmh;
            const value = Math.min(Math.round(Math.abs(speed) * factor / 100), 99);
            return value.toString().padStart(2, "!");
        }
        let gear;
        if (config.prefGearDisplayMode == "realGear") {
            gear = gameState.unpaused.transmission.realGear;
        } else {
            gear = gameState.unpaused.transmission.indicatedGear;
        }
        if (typeof gear != "number") return "!!";
        if (gear < 0) return "R" + Math.min(-gear, 9).toString();
        if (gear == 0) return "N!";
        return Math.min(gear, 99).toString().padStart(2, "!");
    });

    function computeSpeedingSeverity() {
        let speed = gameState.unpaused.axles.speed;
        if (typeof speed != "number") return 0;
        speed /= 100; // scale in config.yaml
        const max = gameState.unpaused.util.speedLimit;
        if (typeof max != "number" || max <= 0) return 0;
        if (speed > max + 3) return 2;
        if (speed > max + 1) return 1;
        return 0;
    }

    let lastFuelConsumption: number = 0;
    let lastCruiseControl: number | null = null;

    const blink = ref(false);

    watch(gameState.unpaused, () => {
        if (gameState.unpaused.electric.enabled !== true) {
            lastCruiseControl = null;
        }
    });

    const systemChecks = {
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
    };

    const instruments: Instruments = {
        backlight: computed(() => {
            if (gameState.unpaused.lights.low || gameState.unpaused.lights.parking) return 1.0;
            return 0.0;
        }),
        displays: {
            brightness: computed((): number => {
                if (!gameState.unpaused.electric.enabled) return 0.0;
                return 1.0;
            }),
            clock: computed((): string => {
                const config = configuration.value;
                let time = gameState.unpaused.time.current;
                if (typeof time != "number") return "";
                time += config.prefClockOffset * 60;
                time = Math.floor(time);
                const min = (time % 60).toString().padStart(2, "0");
                time = Math.floor(time / 60) % 24;
                if (config.prefClock12) {
                    instruments.indicators.clockAm.value = time < 12;
                    instruments.indicators.clockPm.value = time >= 12;
                    time %= 12;
                    if (time == 0) time = 12;
                } else {
                    instruments.indicators.clockAm.value = false;
                    instruments.indicators.clockPm.value = false;
                }
                const hrs = time.toString().padStart(2, "!");
                return `!${hrs}:${min}`;
            }),
            deadline: computed((): string => {
                const time = gameState.unpaused.time.current;
                if (typeof time != "number") return "";
                const exp = gameState.unpaused.time.jobExpected;
                if (typeof exp != "number") return "";
                return remainingTimeDisplay(exp - time);
            }),
            eta: computed((): string => {
                let remain = gameState.unpaused.time.navRemain;
                if (typeof remain != "number") return "";
                return remainingTimeDisplay(remain);
            }),
            rest: computed((): string => {
                let remain = gameState.unpaused.time.restRemain;
                if (typeof remain != "number") return "";
                if (remain <= 0 && configuration.value.prefFlashRestIndicator && !blink.value) return "";
                return remainingTimeDisplay(remain);
            }),
            odometer: computed((): string => {
                let odo = gameState.unpaused.axles.odo;
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
            cruiseControl: computed((): string => {
                const config = configuration.value;
                let cc = gameState.unpaused.util.cruiseControl;
                let speed = gameState.unpaused.axles.speed;
                let val = null;
                if (typeof speed == "number") speed = Math.abs(speed) / 100;
                if (config.prefCruiseDisplayMode == "speedAlways") {
                    // Ignore cruise control value.
                    val = speed;
                } else if (typeof cc != "number" || cc <= 0) {
                    // Cruise control is off.
                    if (config.prefCruiseDisplayMode == "retain") {
                        val = lastCruiseControl;
                    } else if (config.prefCruiseDisplayMode == "speedWhenDisabled") {
                        val = speed;
                    }
                } else {
                    // Cruise control is on.
                    val = cc;
                    lastCruiseControl = cc;
                }
                if (typeof val != "number") return "";
                const factor = config.prefSpeedUnit == "mph" ? mpsToMph : mpsToKmh;
                const value = Math.min(Math.round(val * factor), 99);
                return value.toString().padStart(2, "!");
            }),
            retarder: computed((): string => {
                if (gameState.unpaused.brake.retarder) return gameState.unpaused.brake.retarder.toString();
                return "!";
            }),
        },
        indicators: {
            brightness: computed((): number => {
                return 1.0;
            }),
            adBlue: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (systemChecks.adBlue.value) return true;
                if (gameState.unpaused.adBlue.indicator) return true;
                return false;
            }),
            air: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (systemChecks.air.value) return true;
                if (gameState.unpaused.air.indicator) return true;
                return false;
            }),
            airbag: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (systemChecks.srs.value) return true;
                return false;
            }),
            axleLift: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (systemChecks.lamps.value) return true;
                if (gameState.unpaused.axles.liftTruck) return true;
                if (gameState.unpaused.axles.liftTrailer) return true;
                return false;
            }),
            battery: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (systemChecks.alternator.value) return true;
                if (gameState.unpaused.electric.indicator) return true;
                return false;
            }),
            beacon: computed((): boolean => {
                if (systemChecks.lamps.value) return true;
                if (gameState.unpaused.lights.beacon) return true;
                return false;
            }),
            coolant: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (systemChecks.coolant.value) return true;
                if (gameState.unpaused.coolant.indicator) return true;
                return false;
            }),
            cruiseControl: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (systemChecks.lamps.value) return true;
                if (gameState.unpaused.util.cruiseControl) return true;
                return false;
            }),
            diffLock: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (systemChecks.lamps.value) return true;
                if (gameState.unpaused.transmission.diffLock) return true;
                return false;
            }),
            engine: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (systemChecks.engine.value) return true;
                if (gameState.unpaused.engine.wear === null) return false;
                if (gameState.unpaused.engine.wear > 60) return true;
                return false;
            }),
            fuel: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (systemChecks.fuel.value) return true;
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
                if (systemChecks.lamps.value) return true;
                if (!gameState.unpaused.lights.low) return false;
                if (gameState.unpaused.lights.high) return true;
                return false;
            }),
            lowBeam: computed((): boolean => {
                if (systemChecks.lamps.value) return true;
                if (gameState.unpaused.lights.low) return true;
                return false;
            }),
            oil: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (systemChecks.oil.value) return true;
                if (gameState.unpaused.oil.indicator) return true;
                return false;
            }),
            parkingBrake: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (systemChecks.brakes.value) return true;
                if (gameState.unpaused.brake.parking) return true;
                return false;
            }),
            parkingLights: computed((): boolean => {
                if (systemChecks.lamps.value) return true;
                if (gameState.unpaused.lights.low) return false;
                if (gameState.unpaused.lights.parking) return true;
                return false;
            }),
            powerSteering: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (systemChecks.lamps.value) return true;
                if (systemChecks.powerSteering.value) return true;
                return false;
            }),
            retarder: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (systemChecks.lamps.value) return true;
                if (gameState.unpaused.brake.retarder) return true;
                if (gameState.unpaused.brake.motor) return true;
                return false;
            }),
            speeding: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (systemChecks.lamps.value) return true;
                const severity = computeSpeedingSeverity();
                if (severity < 1) return false;
                if (severity >= 2 && configuration.value.prefFlashOverspeed) return blink.value;
                return true;
            }),
            transmission: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (systemChecks.transmission.value) return true;
                if (gameState.unpaused.transmission.wear !== null && gameState.unpaused.transmission.wear > 60) return true;
                if (gameState.unpaused.transmission.realGear === 0) return false;
                if (gameState.unpaused.transmission.indicatedGear !== gameState.unpaused.transmission.realGear) return true;
                return false;
            }),
            turnLeft: computed((): boolean => {
                if (systemChecks.lamps.value) return true;
                if (gameState.unpaused.lights.turnLeft) return true;
                return false;
            }),
            turnRight: computed((): boolean => {
                if (systemChecks.lamps.value) return true;
                if (gameState.unpaused.lights.turnRight) return true;
                return false;
            }),
            clockAm: ref(false),
            clockPm: ref(false),
            transAuto: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (configuration.value.prefGearDisplayMode == "speed") return false;
                return gameState.derived.transMode.value == "A";
            }),
            transManual: computed((): boolean => {
                if (!gameState.unpaused.electric.enabled) return false;
                if (configuration.value.prefGearDisplayMode == "speed") return false;
                return gameState.derived.transMode.value == "M";
            }),
        },
        needles: {
            air: ref(design.ncfg.air.clp[1]),
            coolant: ref(design.ncfg.coolant.clp[0]),
            fuel: ref(design.ncfg.fuel.clp[0]),
            oil: ref(design.ncfg.oil.clp[1]),
            speed: ref(design.ncfg.speed.clp[0]),
            rpm: ref(design.ncfg.rpm.clp[0]),
            consumption: ref(design.ncfg.consumption.clp[1]),
        },
    };
    
    const needleTargets = {
        air: computed((): number => {
            const psi = gameState.unpaused.air.pressure;
            if (typeof psi != "number") return 0;
            return psi * psiToBar / 10; // revert rounding scale from config.yaml
        }),
            coolant: computed((): number => {
            const coolant = gameState.unpaused.coolant.temperature;
            if (typeof coolant != "number") return 0;
            return coolant / 2; // revert rounding scale from config.yaml
        }),
            fuel: computed((): number => {
            const amount = gameState.unpaused.fuel.amount;
            if (typeof amount != "number") return 0;
            const capacity = gameState.unpaused.fuel.capacity;
            if (typeof capacity != "number" || capacity < 1) return 0;
            return amount / capacity;
        }),
            adBlue: computed((): number => {
            const amount = gameState.unpaused.adBlue.amount;
            if (typeof amount != "number") return 0;
            const capacity = gameState.unpaused.adBlue.capacity;
            if (typeof capacity != "number" || capacity < 1) return 0;
            return amount / capacity;
        }),
            oil: computed((): number => {
            const psi = gameState.unpaused.oil.pressure;
            if (typeof psi != "number") return 0;
            return psi * psiToBar / 10; // revert rounding scale from config.yaml
        }),
            speed: computed((): number => {
            const speed = gameState.unpaused.axles.speed;
            if (typeof speed != "number") return 0;
            return Math.abs(speed) / 100; // revert rounding scale from config.yaml
        }),
            rpm: computed((): number => {
            const rpm = gameState.unpaused.engine.rpm;
            if (typeof rpm != "number") return 0;
            const limit = gameState.unpaused.engine.rpmLimit;
            if (typeof limit != "number" || limit < 1) return 0;
            return rpm / limit;
        }),
            consumption: computed((): number => {
            let amount = gameState.unpaused.fuel.consumption;
            if (typeof amount != "number") amount = 0;
            if (amount == 0) {
                amount = lastFuelConsumption;
            } else {
                lastFuelConsumption = amount;
            }
            return amount / 10;
        }),
    };

    // Timers for various animations.
    let electricEnabledMillis: number = 0;
    let engineRunningMillis: number = 0;
    let blinkTimer: number = 0;
    let skippedDelta: number = 0;

    function animate(timeDelta: number) {
        const config = configuration.value;
        skippedDelta += timeDelta;
        if (skippedDelta < config.perfAnimationThrottle) return;
        timeDelta = skippedDelta;
        skippedDelta = 0;

        // Get main vehicle system state.
        const power = !!gameState.unpaused.electric.enabled;
        const rpm = gameState.unpaused.engine.rpm;
        const engine = typeof rpm === "number" && rpm > 200;

        // Update timers.
        if (power) {
            electricEnabledMillis += timeDelta;
            blinkTimer += timeDelta / 600;
            blinkTimer %= 1;
        } else {
            electricEnabledMillis = 0;
            blinkTimer = 0;
        }
        blink.value = blinkTimer > 0.5;
        if (engine) {
            engineRunningMillis += timeDelta;
        } else {
            engineRunningMillis = 0;
        }

        // Whether to run self-tests.
        const runTests = config.prefSelfTest;

        // Model startup/self-tests of electrical systems.
        systemChecks.lamps.value = runTests && power && electricEnabledMillis < 1000;
        systemChecks.air.value = runTests && electricEnabledMillis < 1400;
        systemChecks.coolant.value = runTests && electricEnabledMillis < 1850;
        systemChecks.fuel.value = runTests && electricEnabledMillis < 2400;
        systemChecks.adBlue.value = runTests && electricEnabledMillis < 2600;
        systemChecks.brakes.value = runTests && electricEnabledMillis < 3300;
        systemChecks.transmission.value = runTests && electricEnabledMillis < 4100;
        systemChecks.srs.value = runTests && electricEnabledMillis < 5900;

        // Model startup/self-tests of engine-powered systems.
        systemChecks.oil.value = runTests && engineRunningMillis < 1100;
        systemChecks.alternator.value = runTests && engineRunningMillis < 1800;
        systemChecks.engine.value = runTests && engineRunningMillis < 2800;
        systemChecks.powerSteering.value = runTests && engineRunningMillis < 4900;

        // Animate needles.
        let fuelNeedleTarget = needleTargets.fuel.value;
        if (config.prefFuelFollowsAdBlue && needleTargets.adBlue.value < fuelNeedleTarget) {
            fuelNeedleTarget = needleTargets.adBlue.value;
        }
        const needleTest = config.prefSelfTestNeedle && power && electricEnabledMillis < 1500;
        updateNeedle(instruments.needles.air, needleTargets.air.value, power, needleTest, design.ncfg.air, 6, timeDelta);
        updateNeedle(instruments.needles.coolant, needleTargets.coolant.value, power, needleTest, design.ncfg.coolant, 4.5, timeDelta);
        updateNeedle(instruments.needles.fuel, fuelNeedleTarget, power, needleTest, design.ncfg.fuel, 4, timeDelta);
        updateNeedle(instruments.needles.oil, needleTargets.oil.value, power, needleTest, design.ncfg.oil, 5, timeDelta);
        updateNeedle(instruments.needles.speed, needleTargets.speed.value, power, needleTest, design.ncfg.speed, 5.3, timeDelta);
        updateNeedle(instruments.needles.rpm, needleTargets.rpm.value, power, needleTest, design.ncfg.rpm, 5.5, timeDelta);
        updateNeedle(instruments.needles.consumption, needleTargets.consumption.value, power, needleTest, design.ncfg.consumption, 2, timeDelta);
    }

    useAnimation(animate);

    return { instruments };
}