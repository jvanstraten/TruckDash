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
    layoutDisplay1Zoom: number,
    layoutDisplay2Address: string,
    layoutDisplay2Position: UiPosition,
    layoutDisplay2Zoom: number,

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

export type DefaultLayoutData = {
    title: string,
    subtitle: string,
    instrumentsPosition?: UiPosition;
    display1Position?: UiPosition;
    display2Position?: UiPosition;
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