import { Color } from "color-core";
import SunCalc from "~/lib/suncalc";

export function useShading(gameState: any, instruments: any, configuration: any) {

    const sunCalc = new SunCalc();

    // Values determined experimentally from ETS2...
    const longitude = computed(() => {
        let lon = gameState.unpaused.location.lon as any;
        if (typeof lon !== "number") lon = 0;
        return lon * 0.025 + 11.35;
    });
    const latitude = computed(() => {
        let lat = gameState.unpaused.location.lat as any;
        if (typeof lat !== "number") lat = 0;
        return lat * -0.018 + 49.8;
    });

    const sunAltitude = computed(() => {
        // Get time from the game. Note that this is in UTC, not local time.
        let time = gameState.unpaused.time.current as any;
        if (typeof time !== "number") time = 60 * 12;
        const hrs = Math.floor(time / 60) % 24;
        const min = Math.floor(time) % 60;

        // Guestimate latitude from game z coordinate.
        const lat = latitude.value;

        // Guestimate longitude from game z coordinate if timezone simulation is
        // enabled. If not, the game does not adjust sun position based on
        // longitude, so use a default value.
        const lon = configuration.value.preferences.timezones ? longitude.value : 5;

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
        if (!configuration.value.preferences.shading) return 1.0;
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

    function computeColors() {
        const amb_lvl = ambientLevel.value;
        const bl_lvl = instruments.backlight.value;
        const disp_lvl = instruments.displays.brightness.value;
        const ind_lvl = instruments.indicators.brightness.value;
        const th = configuration.value.theme;

        // Ambient light color. White at max brightness, orange-y when dimmed.
        const amb_col = new Color({
            r: Math.pow(amb_lvl, 0.8) * 240 + 10,
            g: Math.pow(amb_lvl, 1.0) * 240 + 10,
            b: Math.pow(amb_lvl, 1.2) * 240 + 10,
        });

        // Compute background color.
        const background = multiplyColors(new Color(th.background), amb_col);

        // Shared function for performing rudimentary shading.
        function shade(base: Color, emission: Color, strength: number, brightness: number) {
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
            const glowFilter: string = configuration.value.performance.bloom ? `drop-shadow(0px 0px 5px ${glow.toHex()})` : "";
            const shadowFilter: string = configuration.value.performance.shadows ? "drop-shadow(0px 0px 20px #0008)" : "";
            const transition: string = configuration.value.performance.animateIndicators ? "fill 0.1s" : "none";
            const needleStroke: string = configuration.value.performance.needleDetails ? th.needleStroke : "none";

            return {
                diffuse: {
                    fill: diffuse.toHex(),
                },
                emission: {
                    fill: emission.toHex(),
                    filter: glowFilter,
                },
                combined: {
                    fill: combined.toHex(),
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
            };
        }

        const c_prim = new Color(th.primary);
        const c_sec = new Color(th.secondary);
        const c_bl = new Color(th.backlight);
        const c_dis = new Color(th.display);
        const c_seg = new Color(th.segments);
        const c_ndl = new Color(th.needle);
        const c_red = new Color(th.indicatorRed);
        const c_amb = new Color(th.indicatorAmber);
        const c_grn = new Color(th.indicatorGreen);
        const c_blu = new Color(th.indicatorBlue);

        const primary = shade(c_prim, multiplyColors(c_prim, c_bl), bl_lvl, 0.9);
        const secondary = shade(c_sec, multiplyColors(c_sec, c_bl), bl_lvl, 0.9);
        const needle = shade(c_ndl, c_ndl, bl_lvl, 0.9);
        const display = shade(c_seg, c_dis, disp_lvl, 0.4);
        const indicator_red = shade(c_seg, c_red, ind_lvl, 0.4);
        const indicator_amber = shade(c_seg, c_amb, ind_lvl, 0.4);
        const indicator_green = shade(c_seg, c_grn, ind_lvl, 0.4);
        const indicator_blue = shade(c_seg, c_blu, ind_lvl, 0.4);

        // The background of the lower layer is normally distinguished by shadows
        // and thus doesn't need an alternate color. When shadows are disabled,
        // darken it a little bit instead.
        let lowerBackground = background;
        if (!configuration.value.performance.shadows) {
            lowerBackground = lowerBackground.adjustLightness(-3);
        }

        return {
            background: background.toHex(),
            lowerBackground: lowerBackground.toHex(),
            primary: primary,
            secondary: secondary,
            display: display,
            needle: needle,
            indicator: {
                red: indicator_red.indicator,
                amber: indicator_amber.indicator,
                green: indicator_green.indicator,
                blue: indicator_blue.indicator,
            }
        };
    }

    const shading = computed(() => computeColors());

    return { shading };
}
