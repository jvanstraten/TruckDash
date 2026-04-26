import { Color } from "color-core";
import { state } from "~/state";
import { config } from "~/config";

function multiplyColors(a: Color, b: Color): Color {
    return new Color({
        r: (a.r * b.r) / 255,
        g: (a.g * b.g) / 255,
        b: (a.b * b.b) / 255,
        a: a.a,
    });
}

function computeColors() {
    const amb_lvl = state.ambient_level.value;
    const bl_lvl = state.backlight_level.value;
    const th = config.theme.value;

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

        return {
            diffuse: {
                fill: diffuse.toHex(),
            },
            emission: {
                fill: emission.toHex(),
                filter: `drop-shadow(0px 0px 5px ${glow.toHex()})`,
            },
            combined: {
                fill: combined.toHex(),
                filter: `drop-shadow(0px 0px 5px ${glow.toHex()})`,
            },
            needle: {
                fill: combined.toHex(),
                stroke: config.theme.value.needle_stroke,
                filter: `drop-shadow(0px 0px 20px #0008) drop-shadow(0px 0px 10px ${glow.toHex()})`,
            },
            indicator: {
                on: {
                    fill: combined.toHex(),
                    filter: `drop-shadow(0px 0px 5px ${glow.toHex()})`,
                    transition: 'fill 0.1s',
                },
                off: {
                    fill: diffuse.toHex(),
                    transition: 'fill 0.1s',
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
    const c_red = new Color(th.indicator_red);
    const c_amb = new Color(th.indicator_amber);
    const c_grn = new Color(th.indicator_green);
    const c_blu = new Color(th.indicator_blue);

    const primary = shade(c_prim, multiplyColors(c_prim, c_bl), bl_lvl, 0.9);
    const secondary = shade(c_sec, multiplyColors(c_sec, c_bl), bl_lvl, 0.9);
    const needle = shade(c_ndl, c_ndl, bl_lvl, 0.9);
    const display = shade(c_seg, c_dis, bl_lvl, 0.7);
    const indicator_red = shade(c_seg, c_red, 1.0, 0.5);
    const indicator_amber = shade(c_seg, c_amb, 1.0, 0.5);
    const indicator_green = shade(c_seg, c_grn, 1.0, 0.5);
    const indicator_blue = shade(c_seg, c_blu, 1.0, 0.5);

    return {
        background: background.toHex(),
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

export const shading = computed(() => computeColors());
