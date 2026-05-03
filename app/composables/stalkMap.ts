export type StalkAxisType = "lowBeam" | "blinkers" | "wipers"
    | "highBeam" | "highBeamCenterHorn" | "highBeamReverseHorn"
    | "transGear" | "transBrake" | "transDirection" | "transMode" | "unmapped";

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

export function getAxisRange(axis: StalkAxisType): [number, number] {
    switch (axis) {
        case "lowBeam": return [0, 2];
        case "blinkers": return [-1, 1];
        case "wipers": return [0, 3]
        case "highBeam": return [0, 1];
        case "highBeamCenterHorn": return [0, 2];
        case "highBeamReverseHorn": return [-1, 1];
        case "transGear": return [-1, 1];
        case "transBrake": return [-1, 1];
        case "transDirection": return [-1, 1];
        case "transMode": return [0, 1];
        case "unmapped": return [0, 0];
    }
}

export function useStalkMap(configuration: Configuration) : StalkMap {
    function getUtilityStalkAxes(): StalkAxes {
        const config = configuration.value;
        let highBeamType: "highBeam" | "highBeamCenterHorn" | "highBeamReverseHorn" = "highBeam";
        switch (config.stalkLightHornMode) {
            case "reverse": highBeamType = "highBeamReverseHorn"; break;
            case "middle": highBeamType = "highBeamCenterHorn"; break;
        }
        return {
            moveX: { type: highBeamType, invert: config.stalkInvertHighBeam },
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
