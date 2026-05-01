export type Coordinate = {
    x: number,
    y: number,
};

export type Label = {
    co: Coordinate,
    sz: number,
    txt: string,
};

export type DisplayId = "clock" | "deadline" | "eta" | "gearCruiseL" |
    "gearCruiseR" | "odometer" | "rest" | "cruiseControl" | "retarder";

export type DisplayType = "DESG7" | "DESG14";

export type Display = {
    co: Coordinate,
    id: DisplayId,
    sz: number,
    fnt: DisplayType,
    seg: string,
};

export type NeedleId = "air" | "coolant" | "fuel" | "oil" | "speed" | "consumption" | "rpm";

export type Needle = {
    co: Coordinate,
    pth: string,
    id: NeedleId,
};

export type NeedleConfig = {
    clp: [number, number],
    ofs: number,
    scl: number,
};

export type IndicatorId =
    "adBlue" | "air" | "airbag" | "axleLift" | "battery" | "beacon" | "coolant" |
    "cruiseControl" | "diffLock" | "engine" | "fuel" | "gameDisconnected" |
    "gamePaused" | "highBeam" | "lowBeam" | "oil" | "parkingBrake" |
    "parkingLights" | "powerSteering" | "retarder" | "speeding" | "transmission" |
    "turnLeft" | "turnRight" | "clockAm" | "clockPm" | "transManual" | "transAuto";

export type IndicatorColor = "red" | "amber" | "green" | "blue" | "display";

export type Indicator = {
    co: Coordinate,
    pth: string,
    id: IndicatorId,
    col: IndicatorColor,
};

export type Markings = {
    pth: string,
    lbl: Label[],
};

export type Layer = {
    pth: string,
    prim: Markings,
    sec: Markings,
    disp: Display[],
    ind: Indicator[],
    ndl: Needle[],
};

export type Design = {
    dim: {
        view: {
            w: number,
            h: number,
        },
        ind: {
            w: number,
            h: number,
        },
    },
    layer0: Layer,
    layer1: Layer,
    ncfg: {
        air: NeedleConfig,
        coolant: NeedleConfig,
        fuel: NeedleConfig,
        oil: NeedleConfig,
        speed: NeedleConfig,
        consumption: NeedleConfig,
        rpm: NeedleConfig,
    },
};
