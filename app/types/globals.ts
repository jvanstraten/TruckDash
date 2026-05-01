import type { RemovableRef } from "@vueuse/core";

export type UiPosition = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

// Note: limited nesting in this type because the configuration loading does
// only a shallow merge between defaults and the configuration in local store.
// The data types of the keys in this object can therefore not be changed
// without requiring a manual browser local storage reset. Do not change key
// names or data types without having a very good reason!
export type ConfigurationData = {
    prefSelfTest: boolean,
    prefSelfTestNeedle: boolean,
    prefClock12: boolean,
    prefClockOffset: number,
    prefGearDisplayMode: "gear" | "realGear" | "speed",
    prefCruiseDisplayMode: "normal" | "retain" | "speedWhenDisabled" | "speedAlways",
    prefSpeedUnit: "kmh" | "mph",
    prefShading: boolean,
    prefTimezones: boolean,
    prefDisplayStartup: boolean,
    prefDisplayFollowsTruck: boolean,
    prefDisplayStandby: boolean,
    prefFuelFollowsAdBlue: boolean,
    prefFlashOverspeed: boolean,
    prefFlashRestIndicator: boolean,

    perfTelemetryThrottle: number,
    perfAnimationThrottle: number,
    perfAnimateNeedles: boolean,
    perfNeedleDetails: boolean,
    perfAnimateIndicators: boolean,
    perfBloom: boolean,
    perfShadows: boolean,

    themeWorkspace: string,
    themeWorkspaceFollowsBackground: boolean,
    themeBackground: string,
    themePrimary: string,
    themeSecondary: string,
    themeBacklight: string,
    themeDisplay: string,
    themeIndicatorRed: string,
    themeIndicatorAmber: string,
    themeIndicatorGreen: string,
    themeIndicatorBlue: string,
    themeSegments: string,
    themeNeedle: string,
    themeNeedleBacklight: string,
    themeNeedleStroke: string,

    layoutInstrumentsEnabled: boolean,
    layoutInstrumentsPosition: UiPosition,
    layoutDisplay1Address: string,
    layoutDisplay1Position: UiPosition,
    layoutDisplay2Address: string,
    layoutDisplay2Position: UiPosition,

    stalkGestureMode: "bothStalks" | "leftStalk" | "rightStalk" | "disabled",
    stalkGestureSwitches: "outer" | "inner" | "click",
    stalkHoldForMenu: boolean,
    stalkSwap: "lhd" | "rhd",
    stalkInvertLowBeam: boolean,
    stalkInvertHighBeam: boolean,
    stalkInvertWipers: boolean,
    stalkSwapPaddleBrake: boolean,
    stalkInvertTransPaddle: boolean,
    stalkInvertTransBrake: boolean,
    stalkSwapModeDirection: boolean,
    stalkInvertTransDirection: boolean,
    stalkInvertTransMode: boolean,
};

export type Configuration = RemovableRef<ConfigurationData>;

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