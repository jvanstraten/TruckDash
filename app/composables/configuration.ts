import type { RemovableRef } from "@vueuse/core";
import { useStorage } from "@vueuse/core";

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
// names or data types without having a very good reason! Note that prefixes
// are used for partial restore of default settings, so the prefix must match
// the configuration page.
export type ConfigurationData = {
    generalDriveSide: "lhd" | "rhd",
    generalSpeedUnit: "kmh" | "mph",
    general12HourTime: boolean,
    layoutInstrumentsEnabled: boolean,
    layoutInstrumentsPosition: UiPosition,
    layoutLeftStalkEnabled: boolean,
    layoutLeftStalkPosition: UiPosition,
    layoutRightStalkEnabled: boolean,
    layoutRightStalkPosition: UiPosition,
    layoutDisplay1Address: string,
    layoutDisplay1Position: UiPosition,
    layoutDisplay1Zoom: number,
    layoutDisplay2Address: string,
    layoutDisplay2Position: UiPosition,
    layoutDisplay2Zoom: number,
    gestureSingleHoldForMenu: boolean,
    gestureSingleSwipes: "bothStalks" | "leftStalk" | "rightStalk" | "disabled",
    gestureSingleSwipeZones: "outer" | "inner" | "click",
    gestureSingleSwipeLong: boolean,
    gestureDoubleTapHold: "activate" | "disabled",
    gestureDoubleRotate: "ignition" | "disabled",
    gestureDoubleSwipeVertical: "park" | "parkInvert" | "disabled",
    gestureSwipeSensitivity: number,
    gestureHoldTimer: number,
    gestureControlLayerTimer: number,
    gestureHapticTimer: number,
    stalkBlinkersMomentaryCount: number,
    stalkBlinkersAutoOffSensitivity: number,
    stalkSkipParkingLights: boolean,
    stalkInvertLowBeam: boolean,
    stalkLightHornMode: "disabled" | "reverse" | "middle",
    stalkInvertHighBeam: boolean,
    stalkInvertWipers: boolean,
    stalkTransStalkMode: "semi" | "directWithHints" | "fullDirect" | "disabled",
    stalkInvertTransGear: boolean,
    stalkInvertTransDirection: boolean,
    stalkInvertTransMode: boolean,
    stalkSwapModeDirection: boolean,
    stalkBrakingMode: "auto" | "retarder" | "engine"
    stalkInvertTransBrake: boolean,
    stalkSwapGearBrake: boolean,
    instrGearDisplayMode: "gear" | "realGear" | "speed",
    instrCruiseDisplayMode: "normal" | "retain" | "speedWhenDisabled" | "speedAlways",
    instrClockOffset: number,
    instrSelfTest: boolean,
    instrSelfTestNeedle: boolean,
    instrDisplayStartup: boolean,
    instrDisplayFollowsTruck: boolean,
    instrDisplayStandby: boolean,
    instrFuelFollowsAdBlue: boolean,
    instrStrictOverspeed: boolean,
    instrFlashOverspeed: boolean,
    instrFlashRestIndicator: boolean,
    perfTelemetryThrottle: number,
    perfAnimationThrottle: number,
    perfAnimateNeedles: boolean,
    perfNeedleDetails: boolean,
    perfAnimateIndicators: boolean,
    perfAnimateStalks: boolean,
    perfBloom: boolean,
    perfOcclusion: boolean,
    themeShading: boolean,
    themeShadingTimezones: boolean,
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
};

export type Configuration = RemovableRef<ConfigurationData>;

export type DefaultLayoutData = {
    title: string,
    subtitle: string,
    instrumentsPosition?: UiPosition;
    leftStalkPosition?: UiPosition;
    rightStalkPosition?: UiPosition;
};

export function useConfiguration(): {
    configuration: Configuration,
    defaultLayouts: DefaultLayoutData[],
    loadLayout: (layout: DefaultLayoutData) => void,
    loadDefaults: (prefix?: string) => void,
    loadFromFile: (file: File) => void,
    saveToFile: () => void,
} {

    // Default configuration + configuration structure.
    const configDefaults: ConfigurationData = {

        // General.
        generalDriveSide: "lhd",
        generalSpeedUnit: "kmh",
        general12HourTime: false,

        // Layout.
        layoutInstrumentsEnabled: true,
        layoutInstrumentsPosition: { x1: 0.0, y1: 0.0, x2: 1.0, y2: 1.0 },
        layoutLeftStalkEnabled: false,
        layoutLeftStalkPosition: { x1: 0.0, y1: 0.0, x2: 1.0, y2: 1.0 },
        layoutRightStalkEnabled: false,
        layoutRightStalkPosition: { x1: 0.0, y1: 0.0, x2: 1.0, y2: 1.0 },
        layoutDisplay1Address: "",
        layoutDisplay1Position: { x1: 0.0, y1: 0.0, x2: 1.0, y2: 1.0 },
        layoutDisplay1Zoom: 0,
        layoutDisplay2Address: "",
        layoutDisplay2Position: { x1: 0.0, y1: 0.0, x2: 1.0, y2: 1.0 },
        layoutDisplay2Zoom: 0,

        // Gesture input.
        gestureSingleHoldForMenu: false,
        gestureSingleSwipes: "bothStalks",
        gestureSingleSwipeZones: "outer",
        gestureSingleSwipeLong: true,
        gestureDoubleTapHold: "activate",
        gestureDoubleRotate: "ignition",
        gestureDoubleSwipeVertical: "park",
        gestureSwipeSensitivity: 0.2,
        gestureHoldTimer: 500,
        gestureControlLayerTimer: 500,
        gestureHapticTimer: 100,

        // Stalks & switches.
        stalkBlinkersMomentaryCount: 3,
        stalkBlinkersAutoOffSensitivity: 10,
        stalkSkipParkingLights: false,
        stalkInvertLowBeam: false,
        stalkLightHornMode: "middle",
        stalkInvertHighBeam: false,
        stalkInvertWipers: false,
        stalkTransStalkMode: "semi",
        stalkInvertTransGear: false,
        stalkInvertTransDirection: false,
        stalkInvertTransMode: false,
        stalkSwapModeDirection: false,
        stalkBrakingMode: "auto",
        stalkInvertTransBrake: false,
        stalkSwapGearBrake: false,

        // Instrument behavior.
        instrGearDisplayMode: "gear",
        instrCruiseDisplayMode: "normal",
        instrClockOffset: 0,
        instrSelfTest: true,
        instrSelfTestNeedle: true,
        instrDisplayStartup: true,
        instrDisplayFollowsTruck: true,
        instrDisplayStandby: true,
        instrFuelFollowsAdBlue: true,
        instrStrictOverspeed: false,
        instrFlashOverspeed: true,
        instrFlashRestIndicator: false,

        // Settings that trade graphical fidelity for rendering speed.
        perfTelemetryThrottle: 30,
        perfAnimationThrottle: 14,
        perfAnimateNeedles: true,
        perfNeedleDetails: true,
        perfAnimateIndicators: false,
        perfAnimateStalks: true,
        perfBloom: false,
        perfOcclusion: true,

        // Theme and rendering configuration.
        themeShading: true,
        themeShadingTimezones: true,
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
    };

    const defaultLayouts: DefaultLayoutData[] = [
        {
            title: "Instruments",
            subtitle: "Loads the default layout, with just the instrument cluster.",
            instrumentsPosition: { x1: 0.0, y1: 0.0, x2: 1.0, y2: 1.0,},
        },
    ];

    const configuration = useStorage(
        "config",
        configDefaults,
        localStorage,
        {mergeDefaults: true}
    );

    function loadLayout(layout: DefaultLayoutData) {
        configuration.value.layoutInstrumentsEnabled = layout.instrumentsPosition !== undefined;
        Object.assign(configuration.value.layoutInstrumentsPosition, layout.instrumentsPosition);
        configuration.value.layoutDisplay1Address = "";
        configuration.value.layoutDisplay2Address = "";
    }

    function loadDefaults(prefix?: string) {
        Object.keys(configDefaults).forEach(key => {
            if (!prefix || key.startsWith(prefix)) {
                (configuration.value as any)[key] = (configDefaults as any)[key];
            }
        });
    }

    function loadFromFile(file: File) {
        if (!file) {
            alert("Error restoring configuration: no file chosen.");
            return;
        }
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => {
            try {
                const data = reader.result;
                if (typeof data != "string") {
                    alert("Error restoring configuration: not a text file.");
                    return;
                }
                const parsed = JSON.parse(data);
                let restored = 0;
                let total = 0;
                Object.keys(configDefaults).forEach(key => {
                    if (key in parsed) {
                        (configuration.value as any)[key] = parsed[key];
                        restored++;
                    } else {
                        (configuration.value as any)[key] = (configDefaults as any)[key];
                    }
                    total++;
                });
                if (restored != total) {
                    alert(`Warning: Restored only ${restored} of ${total} configuration keys from file.`);
                }
            } catch (e) {
                alert(`Error restoring configuration: ${e}.`);
            }
        }
        reader.onerror = (e) => {
            alert(`Error restoring configuration: ${e}.`);
            return;
        }
    }

    function saveToFile() {
        const json = JSON.stringify(configuration.value);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = "truckdash.json";
        a.style.display = 'none';
        document.body.append(a);
        a.click();
        setTimeout(() => {
            URL.revokeObjectURL(url);
            a.remove();
        }, 1000);
    }

    return {
        configuration,
        defaultLayouts,
        loadLayout,
        loadDefaults,
        loadFromFile,
        saveToFile,
    };
}