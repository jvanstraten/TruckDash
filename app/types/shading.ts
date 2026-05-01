export type IndicatorStyles = {
    on: any,
    off: any,
};

export type AllStyles = {
    diffuse: any,
    emission: any,
    combined: any,
    needle: any,
    indicator: IndicatorStyles,
    divIndicator: IndicatorStyles,
};

export type Shading = {
    background: string,
    lowerBackground: string,
    primary: AllStyles,
    secondary: AllStyles,
    display: AllStyles,
    needle: AllStyles,
    indicator: {
        red: IndicatorStyles,
        amber: IndicatorStyles,
        green: IndicatorStyles,
        blue: IndicatorStyles,
        display: IndicatorStyles,
    }
    divIndicator: {
        red: IndicatorStyles,
        amber: IndicatorStyles,
        green: IndicatorStyles,
        blue: IndicatorStyles,
        display: IndicatorStyles,
    }
};
