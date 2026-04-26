import { reactive, ref } from "vue";

export const state = {

    // Master light levels for shading, 0-1.
    ambient_level: ref(1.0),
    backlight_level: ref(1.0),

}

