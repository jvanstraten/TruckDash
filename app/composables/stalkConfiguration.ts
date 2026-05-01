export type StalkAxisType   // default down/inward <--> up/outward
    = "lowBeam"             // Off, park, low beams
    | "highBeam"            // (Flash), off, high beams
    | "blinkers"            // Left, (left), off, (right), right
    | "wipers"              // Off, intermittent, low, high
    | "transPaddle"         // (Gear down), no-op, (gear up)
    | "transBrake"          // (Brake reduce), no-op, (brake increase)
    | "transDirection"      // Reverse, neutral, drive
    | "transMode";          // Manual, automatic

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

export type StalkConfiguration = {
    left: ComputedRef<StalkAxes>,
    right: ComputedRef<StalkAxes>,
};

export function useStalkConfiguration(configuration: Configuration) : StalkConfiguration {
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
        const transBrake: StalkAxis = { type: "transBrake", invert: config.stalkInvertTransBrake };
        const transPaddle: StalkAxis = { type: "transPaddle", invert: config.stalkInvertTransPaddle };
        const transMode: StalkAxis = { type: "transMode", invert: config.stalkInvertTransMode };
        const transDirection: StalkAxis = { type: "transDirection", invert: config.stalkInvertTransDirection };

        return {
            moveX: config.stalkSwapPaddleBrake ? transPaddle : transBrake,
            moveY: config.stalkSwapPaddleBrake ? transBrake : transPaddle,
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
