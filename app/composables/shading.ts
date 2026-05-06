import { Color } from "color-core";
import SunCalc from "~/lib/suncalc";
import type { Configuration } from "~/composables/configuration";
import type { GameState } from "~/composables/game";
import type { StyleValue } from "vue";

export type IndicatorStyles = {
    on: StyleValue,
    off: StyleValue,
};

export type AllStyles = {
    diffuse: StyleValue,
    emission: StyleValue,
    combined: StyleValue,
    needle: StyleValue,
    indicator: IndicatorStyles,
    divIndicator: IndicatorStyles,
};

export type Shading = {
    background: string,
    lowerBackground: string,
    stalkBackground: string,
    integrated: AllStyles,
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

export function useShading(gameState: GameState, configuration: Configuration): {shading: ComputedRef<Shading>} {

    const sunCalc = new SunCalc();

    // Values determined experimentally from ETS2...
    const longitude = computed(() => {
        let lon = gameState.unpaused.location.lon;
        if (typeof lon !== "number") lon = 0;
        return lon * 0.025 + 11.35;
    });
    const latitude = computed(() => {
        let lat = gameState.unpaused.location.lat;
        if (typeof lat !== "number") lat = 0;
        return lat * -0.018 + 49.8;
    });

    const sunAltitude = computed(() => {
        // Get time from the game. Note that this is in UTC, not local time.
        let time = gameState.unpaused.time.current;
        if (typeof time !== "number") time = 60 * 12;
        const hrs = Math.floor(time / 60) % 24;
        const min = Math.floor(time) % 60;

        // Guestimate latitude from game z coordinate.
        const lat = latitude.value;

        // Guestimate longitude from game z coordinate if timezone simulation is
        // enabled. If not, the game does not adjust sun position based on
        // longitude, so use a default value.
        const lon = configuration.value.themeShadingTimezones ? longitude.value : 5;

        // env_data.sii suggests that the day of the year that the game works with
        // is the summer solstice, though it doesn't suggest which year. Using 2000
        // arbitrarily. To avoid a sudden jerk in sun position when the day rolls
        // over, we'll interpolate between the solstice day and the day before.
        // Note that this calculation doesn't exactly match the game: it's off
        // by a few degrees depending on location. But all-in-all it's pretty good,
        // and we're shading a fake dashboard here, not orienting a spacecraft.
        const before = new Date(2000, 5, 20, hrs, min);
        const after = new Date(2000, 5, 21, hrs, min);
        const altitudeBefore = sunCalc.getSunPosition(before, lat, lon).altitude;
        const altitudeAfter = sunCalc.getSunPosition(after, lat, lon).altitude;
        const ratio = (time / (60 * 24)) % 1;
        const altitude = altitudeBefore * ratio + altitudeAfter * (1 - ratio);
        return altitude / Math.PI * 180;

    });

    const ambientLevel = computed(() => {
        if (!configuration.value.themeShading) return 1.0;
        const amount = (Math.tanh((sunAltitude.value - 5) / 15) + 1) / 2;
        return Math.round(amount * 100) / 100;
    });

    function multiplyColors(a: Color, b: Color): Color {
        return new Color({
            r: (a.r * b.r) / 255,
            g: (a.g * b.g) / 255,
            b: (a.b * b.b) / 255,
            a: a.a,
        });
    }

    function computeColors(): Shading {
        const amb_lvl = ambientLevel.value;
        const bl_lvl = gameState.derived.backlightBrightness.value;
        const disp_lvl = gameState.derived.displayBrightness.value;
        const ind_lvl = gameState.derived.indicatorBrightness.value;
        const int_lvl = gameState.derived.integratedLightingBrightness.value;
        const cfg = configuration.value;

        // Ambient light color. White at max brightness, orange-y when dimmed.
        const amb_col = new Color({
            r: Math.pow(amb_lvl, 0.8) * 240 + 10,
            g: Math.pow(amb_lvl, 1.0) * 240 + 10,
            b: Math.pow(amb_lvl, 1.2) * 240 + 10,
        });

        // Compute background color.
        const background = multiplyColors(new Color(cfg.themeBackground), amb_col);

        // Shared function for performing rudimentary shading.
        function shade(base: Color, emission: Color, strength: number, brightness: number): AllStyles {
            // For the diffuse color we just multiply the base color by the ambient light
            // level.
            const diffuse = multiplyColors(base, amb_col);

            // To simulate some degree of eye adjustment to ambient light levels, we
            // reduce the emission strength based on ambient light.
            const gamma = 1.0 - Math.pow(amb_lvl * brightness, 2)
            strength *= gamma;

            // We just do basic mixing for the base vs emission color, because we can't
            // do better than that in places where the diffuse vs emission colors are
            // rendered seperately.
            const combined = diffuse.mix(emission, strength);

            // For when the emission color is used separately, set the alpha channel.
            emission.setAlpha(strength);

            // The glow color is the same as the emission color, but with lower alpha.
            const glow = new Color(emission.toHex());
            glow.setAlpha(strength * Math.pow(gamma, 3));
            const no_glow = new Color(emission.toHex());
            no_glow.setAlpha(1);

            // Determine CSS properties.
            const glowFilter: string = cfg.perfBloom ? `drop-shadow(0px 0px 5px ${glow.toHex()})` : "";
            const glowFilterDiv: string = cfg.perfBloom ? `drop-shadow(0 0 1em ${glow.toHex()})` : "";
            const shadowFilter: string = cfg.perfOcclusion ? "drop-shadow(0px 0px 20px #0008)" : "";
            const transition: string = cfg.perfAnimateIndicators ? "fill 0.1s" : "none";
            const needleStroke: string = cfg.perfNeedleDetails ? cfg.themeNeedleStroke : "none";

            return {
                diffuse: {
                    fill: diffuse.toHex(), // for SVG markings
                    color: diffuse.toHex(), // for non-SVG markings
                },
                emission: {
                    fill: emission.toHex(), // for SVG markings
                    color: emission.toHex(), // for non-SVG markings
                    filter: glowFilter,
                },
                combined: {
                    fill: combined.toHex(), // for SVG markings
                    color: combined.toHex(), // for non-SVG markings
                    filter: glowFilter,
                },
                needle: {
                    fill: combined.toHex(),
                    stroke: needleStroke,
                    filter: `${shadowFilter} ${glowFilter}`,
                },
                indicator: {
                    on: {
                        fill: combined.toHex(),
                        filter: glowFilter,
                        transition: transition,
                    },
                    off: {
                        fill: diffuse.toHex(),
                        transition: transition,
                    },
                },
                divIndicator: {
                    on: {
                        'background-color': combined.toHex(),
                        filter: glowFilterDiv,
                        transition: transition,
                    },
                    off: {
                        'background-color': diffuse.toHex(),
                        transition: transition,
                    },
                },
            };
        }

        const c_prim = new Color(cfg.themePrimary);
        const c_sec = new Color(cfg.themeSecondary);
        const c_bl = new Color(cfg.themeBacklight);
        const c_dis = new Color(cfg.themeDisplay);
        const c_seg = new Color(cfg.themeSegments);
        const c_ndl = new Color(cfg.themeNeedle);
        const c_nbl = new Color(cfg.themeNeedleBacklight);
        const c_red = new Color(cfg.themeIndicatorRed);
        const c_amb = new Color(cfg.themeIndicatorAmber);
        const c_grn = new Color(cfg.themeIndicatorGreen);
        const c_blu = new Color(cfg.themeIndicatorBlue);

        const integrated = shade(c_prim, multiplyColors(c_prim, c_bl), int_lvl, 0.9);
        const primary = shade(c_prim, multiplyColors(c_prim, c_bl), bl_lvl, 0.9);
        const secondary = shade(c_sec, multiplyColors(c_sec, c_bl), bl_lvl, 0.9);
        const needle = shade(c_ndl, multiplyColors(c_ndl, c_nbl), bl_lvl, 0.9);
        const display = shade(c_seg, c_dis, disp_lvl, 0.4);
        const indicator_red = shade(c_seg, c_red, ind_lvl, 0.4);
        const indicator_amber = shade(c_seg, c_amb, ind_lvl, 0.4);
        const indicator_green = shade(c_seg, c_grn, ind_lvl, 0.4);
        const indicator_blue = shade(c_seg, c_blu, ind_lvl, 0.4);

        // The background of the lower layer is normally distinguished by shadows
        // and thus doesn't need an alternate color. When shadows are disabled,
        // darken it a little bit instead.
        let lowerBackground = background;
        if (!configuration.value.perfOcclusion) {
            lowerBackground = lowerBackground.adjustLightness(-3);
        }

        // The stalks need a lighter color, especially when shading is enabled.
        const stalkBackground = lowerBackground.adjustLightness(10 * amb_lvl);

        return {
            background: background.toHex(),
            lowerBackground: lowerBackground.toHex(),
            stalkBackground: stalkBackground.toHex(),
            integrated,
            primary,
            secondary,
            display,
            needle,
            indicator: {
                red: indicator_red.indicator,
                amber: indicator_amber.indicator,
                green: indicator_green.indicator,
                blue: indicator_blue.indicator,
                display: display.indicator,
            },
            divIndicator: {
                red: indicator_red.divIndicator,
                amber: indicator_amber.divIndicator,
                green: indicator_green.divIndicator,
                blue: indicator_blue.divIndicator,
                display: display.divIndicator,
            }
        };
    }

    const shading = computed(() => computeColors());

    return { shading };
}
