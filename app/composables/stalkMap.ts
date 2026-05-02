export type StalkAxisType   // default down/inward <--> up/outward
    = "lowBeam"             // Off, park, low beams
    | "highBeam"            // (Flash), off, high beams
    | "blinkers"            // Left, (left), off, (right), right
    | "wipers"              // Off, intermittent, low, high
    | "transGear"           // (Gear down), no-op, (gear up)
    | "transBrake"          // (Brake reduce), no-op, (brake increase)
    | "transDirection"      // Reverse, neutral, drive
    | "transMode"           // Manual, automatic
    | "unmapped";           // No control action

export type StalkAxis = {
    type: StalkAxisType;
    invert: boolean;
};

export type StalkAxes = {
    moveX: StalkAxis;
    moveY: StalkAxis;
    swX: StalkAxis;
    swY: StalkAxis;
};

export type StalkMap = {
    left: ComputedRef<StalkAxes>,
    right: ComputedRef<StalkAxes>,
};

export function useStalkMap(configuration: Configuration) : StalkMap {
    function getUtilityStalkAxes(): StalkAxes {
        const config = configuration.value;
        return {
            moveX: { type: "highBeam", invert: config.stalkInvertHighBeam },
            moveY: { type: "blinkers", invert: config.stalkSwap == "lhd" },
            swX: { type: "lowBeam", invert: config.stalkInvertLowBeam },
            swY: { type: "wipers", invert: config.stalkInvertWipers },
        };
    }

    function getTransStalkAxes(): StalkAxes {
        const config = configuration.value;
        const transBrake: StalkAxis = {
            type: "transBrake",
            invert: config.stalkInvertTransBrake
        };
        const transGear: StalkAxis = {
            type: config.stalkTransStalkMode != "disabled" ? "transGear" : "unmapped",
            invert: config.stalkInvertTransGear
        };
        const transMode: StalkAxis = {
            type: config.stalkTransStalkMode != "disabled" ? "transMode" : "unmapped",
            invert: config.stalkInvertTransMode
        };
        const transDirection: StalkAxis = {
            type: config.stalkTransStalkMode == "semi" ? "transDirection" : "unmapped",
            invert: config.stalkInvertTransDirection
        };

        return {
            moveX: config.stalkSwapGearBrake ? transGear : transBrake,
            moveY: config.stalkSwapGearBrake ? transBrake : transGear,
            swX: config.stalkSwapModeDirection ? transDirection : transMode,
            swY: config.stalkSwapModeDirection ? transMode : transDirection,
        };
    }

    const left = computed<StalkAxes>(() => {
        if (configuration.value.stalkSwap == "lhd") {
            return getUtilityStalkAxes();
        } else {
            return getTransStalkAxes();
        }
    });

    const right = computed<StalkAxes>(() => {
        if (configuration.value.stalkSwap == "lhd") {
            return getTransStalkAxes();
        } else {
            return getUtilityStalkAxes();
        }
    });

    return { left, right };
}
