import type { Configuration } from "~/composables/configuration";
import type { StalkMap, StalkAxisType } from "~/composables/stalkMap";
import type { GestureData } from "~/composables/gestureDetection";

// Switches with multiple discrete positions. Buttons are also covered in a
// hacky way:
//  - inc = hold
//  - rel = release
//  - dec = press
export type SwitchType = StalkAxisType | "ignition" | "parkingBrake" | "activate";
export type SwitchAction = "inc" | "dec" | "rel";

export type ControlAction
    = "layer" | "menu"
    | [SwitchType, SwitchAction]
    | undefined;

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
    cw: ControlAction;
    ccw: ControlAction;
    up2: ControlAction;
    down2: ControlAction;
    click2: ControlAction;
    hold2: ControlAction;
};

export function useGestureControls(
    configuration: Configuration,
    stalkConfiguration: StalkMap,
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
        controlLayerTimer.value = window.setTimeout(() => resetControlLayer(), configuration.value.gestureControlLayerTimer);
    }

    function describeActionWithText(action: ControlAction): string | undefined {
        if (action === undefined) return "not mapped";
        if (typeof action === "string") return {
            layer: "next control layer",
            menu: "open menu",
        }[action];
        if (action[1] == "rel") return undefined;
        return {
            activate: {
                inc: "interact/activate (hold)",
                dec: "interact/activate (press)",
            },
            ignition: {
                inc: "ignition key clockwise",
                dec: "ignition key counterclockwise",
            },
            parkingBrake: {
                inc: "set parking brake",
                dec: "release parking brake",
            },
            lowBeam: {
                inc: "increase low beams",
                dec: "decrease low beams",
            },
            highBeam: {
                inc: "turn on high beams",
                dec: "turn off high beams",
            },
            highBeamCenterHorn: {
                inc: "turn on high beams",
                dec: "turn off high beams",
            },
            highBeamReverseHorn: {
                inc: "turn on high beams",
                dec: "flash high beams",
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
            unmapped: {
                inc: "not mapped",
                dec: "not mapped",
            }
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
        switch (configuration.value.gestureSingleSwipeZones) {
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
            hold: undefined,
            cw: undefined,
            ccw: undefined,
            up2: undefined,
            down2: undefined,
            click2: undefined,
            hold2: undefined,
        };

        const config = configuration.value;
        const stalks = config.gestureSingleSwipes;
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
        if (!configuration.value.gestureSingleHoldForMenu) {
            mapping.click = "menu";
        }
        if (configuration.value.gestureSingleSwipeZones == "click") {
            if (configuration.value.gestureSingleHoldForMenu || controlLayer.value == 0) {
                mapping.click = "layer";
            }
        }

        // Hold always enters menu.
        mapping.hold = "menu";

        // Two-finger tap/hold for activate.
        if (config.gestureDoubleTapHold == "activate") {
            mapping.click2 = ["activate", "dec"];
            mapping.hold2 = ["activate", "inc"];
        }

        // Rotations control ignition.
        if (config.gestureDoubleRotate == "ignition") {
            mapping.cw = ["ignition", "inc"];
            mapping.ccw = ["ignition", "dec"];
        }

        // Two-finger up/down swipes control the parking brake.
        if (config.gestureDoubleSwipeVertical == "park") {
            mapping.down2 = ["parkingBrake", "inc"];
            mapping.up2 = ["parkingBrake", "dec"];
        } else if (config.gestureDoubleSwipeVertical == "parkInvert") {
            mapping.down2 = ["parkingBrake", "dec"];
            mapping.up2 = ["parkingBrake", "inc"];
        }

        return mapping;
    });

    // Once an event is reported for a switch or button, we lock all future
    // events for that gesture to the same switch/button.
    let inputLock: SwitchType | "other" | undefined = undefined;

    function decodeGesture(data: GestureData): ControlAction {

        // Determine the action based on the current input mapping.
        let action: ControlAction = undefined;
        const actions = gestureMapping.value;
        let zoneIndex: number = 0;
        if (data.fingers <= 1) {
            if (data.type == "click") {
                action = actions.click;
            } else if (data.type == "hold") {
                action = actions.hold;
            } else if (data.type == "left" || data.type == "right" || data.type == "up" || data.type == "down") {
                if (actions.zones.length > 0) {
                    zoneIndex = Math.floor(data.middleX! * actions.zones.length);
                    const zone = actions.zones[zoneIndex]!;
                    action = zone[data.type];
                }
            }
        } else if (data.fingers == 2) {
            if (data.type == "cw") {
                action = actions.cw;
            } else if (data.type == "ccw") {
                action = actions.ccw;
            } else if (data.type == "up") {
                action = actions.up2;
            } else if (data.type == "down") {
                action = actions.down2;
            } else if (data.type == "click") {
                action = actions.click2;
            } else if (data.type == "hold") {
                action = actions.hold2;
            }
        }

        // Handle input lock. If we're locked to an input, propagate release
        // events, and block all events for other inputs. If multi-swipe is
        // disabled, block all events while we have an input lock, even for
        // the same input.
        const input = (typeof action == "string" || action == undefined) ? "other" : action[0];
        if (inputLock !== undefined) {
            if (data.type == "release" && inputLock !== "other") {
                action = [inputLock, "rel"];
            } else if (input !== inputLock || !configuration.value.gestureSingleSwipeLong) {
                action = undefined;
            }
        }

        // Update input lock.
        if (data.last) {
            inputLock = undefined;
        } else if (inputLock === undefined) {
            inputLock = input;
        }

        // Display test messages when mapping is active.
        if (onGestureDecoded !== undefined && onGestureDecoded.value !== undefined && data.type != "release") {
            let gesture = {
                click: "Tap",
                hold: "Hold",
                left: `Swipe left in zone ${zoneIndex + 1}`,
                right: `Swipe right in zone ${zoneIndex + 1}`,
                up: `Swipe up in zone ${zoneIndex + 1}`,
                down: `Swipe down in zone ${zoneIndex + 1}`,
                cw: "Swipe clockwise",
                ccw: "Swipe counterclockwise",
            }[data.type];
            if (data.fingers > 1) gesture = `${data.fingers}-finger ${gesture.toLowerCase()}`;
            const result = describeActionWithText(action);
            if (result !== undefined) {
                let color = "info";
                if (action === undefined) {
                    color = "error";
                } else if (action == "layer" || action == "menu") {
                    color = "default";
                }
                onGestureDecoded.value(`${gesture}: ${result}`, color);
            }
        }

        // Handle click count.
        if (action == "layer") {
            controlLayer.value++;
        }
        if (data.last) {
            // Gesture is complete, restart control layer reset timer.
            startControlLayerTimer();
        } else {
            // Gesture is not yet complete, lock control layer.
            stopControlLayerTimer();
        }

        if (action != "layer") return action;
        return undefined;
    }

    return {
        decodeGesture,
        gestureMapping,
    };
}
