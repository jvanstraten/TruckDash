import type { Configuration } from "~/composables/configuration";
import type { StalkConfiguration, StalkAxisType } from "~/composables/stalkConfiguration";
import type { GestureData } from "~/composables/gestureDetection";

export type StalkAxisDirection = "inc" | "dec";

export type ControlAction = "layer" | "menu" | [StalkAxisType, StalkAxisDirection] | undefined;

export type SwipeZoneMapping = {
    left: ControlAction;
    right: ControlAction;
    up: ControlAction;
    down: ControlAction;
};

export type StalkMapping = {
    outboard: ControlAction;
    inboard: ControlAction;
    up: ControlAction;
    down: ControlAction;
};

export type StalkLayers = {
    move: StalkMapping;
    sw: StalkMapping;
};

export type GestureMapping = {
    zones: SwipeZoneMapping[];
    click: ControlAction;
    hold: ControlAction;
};

export function useGestureControls(
    configuration: Configuration,
    stalkConfiguration: StalkConfiguration,
    onGestureDecoded?: ComputedRef<((text: string, color: string) => void) | undefined>,
) : {
    gestureMapping: ComputedRef<GestureMapping>,
    decodeGesture: (data: GestureData) => ControlAction
} {

    const controlLayer = ref<number>(0);
    const controlLayerTimer = ref<number | undefined>(undefined);

    function stopControlLayerTimer() {
        if (controlLayerTimer.value !== undefined) {
            window.clearTimeout(controlLayerTimer.value);
            controlLayerTimer.value = undefined;
        }
    }

    function resetControlLayer() {
        stopControlLayerTimer();
        if (onGestureDecoded !== undefined && onGestureDecoded.value !== undefined && controlLayer.value != 0) {
            onGestureDecoded.value("Control layer reset by timer", "default");
        }
        controlLayer.value = 0;
    }

    function startControlLayerTimer() {
        stopControlLayerTimer();
        controlLayerTimer.value = window.setTimeout(() => resetControlLayer(), 500);
    }

    function describeActionWithText(action: ControlAction): string {
        if (action === undefined) return "not mapped";
        if (action === "layer") return "next control layer";
        if (action === "menu") return "open menu";
        return {
            lowBeam: {
                inc: "increase low beams",
                dec: "decrease low beams",
            },
            highBeam: {
                inc: "turn on high beams",
                dec: "turn off high beams",
            },
            blinkers: {
                inc: "enable left blinkers",
                dec: "enable right blinkers",
            },
            wipers: {
                inc: "increase wiper setting",
                dec: "decrease wiper setting",
            },
            transGear: {
                inc: "gear up",
                dec: "gear down",
            },
            transBrake: {
                inc: "retarder/engine brake up",
                dec: "retarder/engine brake down",
            },
            transDirection: {
                inc: "transmission toward drive",
                dec: "transmission toward reverse",
            },
            transMode: {
                inc: "automatic transmission",
                dec: "manual transmission",
            },
        }[action[0]][action[1]];
    }

    function expandStalkAxesToLayers(axes: StalkAxes): StalkLayers {
        return {
            move: {
                outboard: [axes.moveX.type, axes.moveX.invert ? "dec" : "inc"],
                inboard: [axes.moveX.type, axes.moveX.invert ? "inc" : "dec"],
                up: [axes.moveY.type, axes.moveY.invert ? "dec" : "inc"],
                down: [axes.moveY.type, axes.moveY.invert ? "inc" : "dec"],
            },
            sw: {
                outboard: [axes.swX.type, axes.swX.invert ? "dec" : "inc"],
                inboard: [axes.swX.type, axes.swX.invert ? "inc" : "dec"],
                up: [axes.swY.type, axes.swY.invert ? "dec" : "inc"],
                down: [axes.swY.type, axes.swY.invert ? "inc" : "dec"],
            }
        };
    }

    function convertStalkToSwipeMapping(stalk: StalkMapping, side: "L" | "R"): SwipeZoneMapping {
        return {
            left: side == "L" ? stalk.outboard : stalk.inboard,
            right: side == "L" ? stalk.inboard : stalk.outboard,
            up: stalk.up,
            down: stalk.down,
        };
    }

    function convertStalkToSwipeZones(layers: StalkLayers, side: "L" | "R"): SwipeZoneMapping[] {
        const move = convertStalkToSwipeMapping(layers.move, side);
        const sw = convertStalkToSwipeMapping(layers.sw, side);

        let mappings = [sw, move];
        switch (configuration.value.stalkGestureSwitches) {
            case "outer":
                break;
            case "inner":
                mappings.reverse();
                break;
            case "click":
                if (controlLayer.value == 0) {
                    mappings = [mappings[1]!];
                } else {
                    mappings = [mappings[0]!];
                }
                break;
        }
        if (side == "R") mappings.reverse();
        return mappings;
    }

    const gestureMapping = computed<GestureMapping>(() => {
        let mapping: GestureMapping = {
            zones: [],
            click: undefined,
            hold: undefined
        };

        const config = configuration.value;
        const stalks = config.stalkGestureMode;
        if (stalks == "bothStalks" || stalks == "leftStalk") {
            const axes = stalkConfiguration.left.value;
            const layers = expandStalkAxesToLayers(axes);
            const zones = convertStalkToSwipeZones(layers, "L");
            mapping.zones.push(...zones);
        }
        if (stalks == "bothStalks" || stalks == "rightStalk") {
            const axes = stalkConfiguration.right.value;
            const layers = expandStalkAxesToLayers(axes);
            const zones = convertStalkToSwipeZones(layers, "R");
            mapping.zones.push(...zones);
        }
        if (mapping.zones.length == 0) {
            mapping.zones.push({
                down: undefined,
                left: undefined,
                right: undefined,
                up: undefined,
            });
        }

        // Click enters menu unless it's used for layers.
        if (!configuration.value.stalkHoldForMenu) {
            mapping.click = "menu";
        }
        if (configuration.value.stalkGestureSwitches == "click") {
            if (configuration.value.stalkHoldForMenu || controlLayer.value == 0) {
                mapping.click = "layer";
            }
        }

        // Hold always enters menu.
        mapping.hold = "menu";

        return mapping;
    });

    function decodeGesture(data: GestureData): ControlAction {

        // Determine the action based on the current input mapping.
        let action: ControlAction = undefined;
        const actions = gestureMapping.value;
        let zoneIndex: number = 0;
        if (data.type == "click") {
            action = actions.click;
        } else if (data.type == "hold") {
            action = actions.hold;
        } else if (actions.zones.length > 0) {
            zoneIndex = Math.floor(data.startX! * actions.zones.length);
            const zone = actions.zones[zoneIndex]!;
            action = zone[data.type];
        }

        // Display test messages when mapping is active.
        if (onGestureDecoded !== undefined && onGestureDecoded.value !== undefined) {
            const gesture = {
                click: "Tap",
                hold: "Hold",
                left: `Swipe left in zone ${zoneIndex + 1}`,
                right: `Swipe right in zone ${zoneIndex + 1}`,
                up: `Swipe up in zone ${zoneIndex + 1}`,
                down: `Swipe down in zone ${zoneIndex + 1}`,
            }[data.type];
            const result = describeActionWithText(action);
            let color = "info";
            if (action === undefined) {
                color = "error";
            } else if (action == "layer" || action == "menu") {
                color = "default";
            }
            onGestureDecoded.value(`${gesture}: ${result}`, color);
        }

        // Handle click count.
        if (action == "layer") {
            controlLayer.value++;
        }
        startControlLayerTimer();

        if (action != "layer") return action;
        return undefined;
    }

    return {
        decodeGesture,
        gestureMapping,
    };
}
