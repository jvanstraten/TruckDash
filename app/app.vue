<script setup>

import { reactive, onUnmounted } from "vue";
import {formatAbsScsTime, formatRelScsTime, TruckTelSocket} from "~/trucktel.ts";
import {design} from "~/design.ts";
import { useFullscreen } from '@vueuse/core'
import Indicator from './components/Indicator.vue'
import Display from './components/Display.vue'
import { Color } from 'color-core';

const current_state = reactive({
  paused: null,
  job_expected: null,
});

const unpaused_state = reactive({
  time: null,
  rest_remain: null,
  nav_remain_time: null,
  nav_remain_dist: null,
});

const trucktel = new TruckTelSocket("dash");
trucktel.current = current_state;
trucktel.unpaused = unpaused_state;
trucktel.paused_key = "paused";
trucktel.throttle = 1000;
trucktel.open();

onUnmounted(() => {
    trucktel.close();
});

const ambient_level = ref(1.0);
const backlight_level = ref(1.0);

const flash = ref(false);
const t = ref(0.0);

let timer;
function timeout() {
  timer = window.setTimeout(timeout, 350);
  flash.value = !flash.value;
  t.value += 1;
  ambient_level.value = Math.sin(t.value * 0.05) * 0.5 + 0.5;
  backlight_level.value = Math.sin(t.value * 0.16) > 0 ? 1.0 : 0.0;
  //if (ambient_level.value > 1.0) ambient_level.value = 0.0;
}
onMounted(() => {
  timeout();
})
onUnmounted(() => {
  window.clearTimeout(timeout);
})

const { isFullscreen, enter, exit, toggle } = useFullscreen()

const theme = ref({
  background: '#444',
  primary: '#DDD',
  secondary: '#F98',
  backlight: '#CFA',
  display: '#DDD',
  segments: '#0000000C',
  needle: '#C43',
  needle_stroke: '#0008',
  indicator_red: '#F10',
  indicator_amber: '#FA0',
  indicator_green: '#0F6',
  indicator_blue: '#36F',
});

function multiplyColors(a, b) {
  return new Color({
    r: (a.r * b.r) / 255,
    g: (a.g * b.g) / 255,
    b: (a.b * b.b) / 255,
    a: a.a,
  });
}

function computeColors() {
  const amb_lvl = ambient_level.value;
  const bl_lvl = backlight_level.value;
  const th = theme.value;

  // Ambient light color. White at max brightness, orange-y when dimmed.
  const amb_col = new Color({
    r: Math.pow(amb_lvl, 0.8) * 240 + 10,
    g: Math.pow(amb_lvl, 1.0) * 240 + 10,
    b: Math.pow(amb_lvl, 1.2) * 240 + 10,
  });

  // Compute background color.
  const background = multiplyColors(new Color(th.background), amb_col);

  // Shared function for performing rudimentary shading.
  function shade(base, emission, strength, brightness) {
    // For the diffuse color we just multiply the base color by the ambient light
    // level.
    const diffuse = multiplyColors(base, amb_col);

    // To simulate some degree of eye adjustment to ambient light levels, we
    // reduce the emission strength based on ambient light.
    if (emission === undefined) {
      emission = base;
    }
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

const colors = computed(() => computeColors());

/*const colors = {
  ambient_level: ref(1.0),
  backlight_level: ref(1.0),

  primary: {
    config: {
      base: ref('#FFF'),
      emission: ref('#AF8'),
    },
  },

  ambient: undefined,
};

colors.ambient = computed(() => {
  return new Color({
    r: Math.pow(colors.ambient_level.value, 0.8) * 240 + 10,
    g: Math.pow(colors.ambient_level.value, 1.0) * 240 + 10,
    b: Math.pow(colors.ambient_level.value, 1.2) * 240 + 10,
  });
});

function color_multiply(a, b) {
  return new Color({
    r: (a.r * b.r) / 255,
    g: (a.g * b.g) / 255,
    b: (a.b * b.b) / 255,
  });
}

function compute_lighting(base, emission, strength) {
  // For the diffuse color we just multiply the base color by the ambient light
  // level.
  const diffuse = color_multiply(base, colors.ambient_level.value);

  // To simulate some degree of eye adjustment to ambient light levels, we
  // reduce the emission strength based on ambient light.
  if (emission === undefined) {
    emission = base;
  }
  strength *= 1.0 - Math.pow(colors.ambient_level.value * 0.9, 2);

  // We just do basic mixing for the base vs emission color, because we can't
  // do better than that in places where the diffuse vs emission colors are
  // rendered seperately.
  const combined = diffuse.mix(emission, strength);

  // For when the emission color is used separately, set the alpha channel.
  emission.setAlpha(strength);

  // The glow color is the same as the emission color, but with lower alpha.
  const glow = new Color(emission);
  glow.setAlpha(strength * 0.3);

  return {
    diffuse: diffuse,
    emission: emission,
    combined: combined,
    glow: glow,
  };
}

colors.background = computed(() => {
  return color_multiply(colors.ambient.value, new Color('#444'));
});

colors.primary.computed = computed(() => {
  return compute_lighting(
      new Color(colors.primary.config.base.value),
      new Color(colors.primary.config.emission.value),
      colors.backlight_level.value
  );
});
*/


//light.background = 'rgb(218.0, 0.0, 0.0)';
//alert(light.background.value);


</script>

<template>

  <div class="container" @click="toggle" :style="{'background-color': colors.background}">
    <div class="dashboard_top" :style="{'aspect-ratio': design.dim.view.w + ' / ' + design.dim.view.h}">
      {{""/* Note: vue is being an idiot and is refusing to bind viewBox reliably, regardless of camelcase property workaround */}}
      <svg class="dashboard_full" viewBox="0 0 1300 600">
        <!-- Details for the needles. -->
        <defs>
          <radialGradient id="needleCenter">
            <stop offset="10%" stop-color="#0008" />
            <stop offset="40%" stop-color="#0007" />
            <stop offset="50%" stop-color="#0004" />
            <stop offset="70%" stop-color="#0001" />
            <stop offset="100%" stop-color="#0000" />
          </radialGradient>
        </defs>

        <!-- LAYER 0 DIFFUSE -->
        <path
            :d="design.layer0.pth" class="dashboard_background"
            :style="{'fill': colors.background}"
        />
        <g :style="colors.primary.diffuse">
          <path :d="design.layer0.prim.pth"/>
          <text
              v-for="label in design.layer0.prim.lbl"
              :x="label.co.x" :y="label.co.y"
              :style="{'font-size': (0.7 * label.sz) + 'pt'}"
          >{{ label.txt }}</text>
        </g>
        <g :style="colors.secondary.diffuse">
          <path :d="design.layer0.sec.pth"/>
          <text
              v-for="label in design.layer0.sec.lbl"
              :x="label.co.x" :y="label.co.y"
              :style="{'font-size': (0.7 * label.sz) + 'pt'}"
          >{{ label.txt }}</text>
        </g>
        <g :style="colors.display.diffuse">
          <text
              v-for="display in design.layer0.disp"
              :x="display.co.x" :y="display.co.y"
              :style="{'font-size': (0.7 * display.sz) + 'pt'}"
              :class="['dashboard_' + display.fnt.toLowerCase()]"
          >{{ display.seg }}</text>
        </g>

        <!-- LAYER 0 AMBIENT SHADING -->
        <path :d="design.layer1.pth" class="dashboard_occlusion"/>

        <!-- LAYER 0 EMISSION -->
        <g :style="colors.primary.emission">
          <path :d="design.layer0.prim.pth"/>
          <text
              v-for="label in design.layer0.prim.lbl"
              :x="label.co.x" :y="label.co.y"
              :style="{'font-size': (0.7 * label.sz) + 'pt'}"
          >{{ label.txt }}</text>
        </g>
        <g :style="colors.secondary.emission">
          <path :d="design.layer0.sec.pth"/>
          <text
              v-for="label in design.layer0.sec.lbl"
              :x="label.co.x" :y="label.co.y"
              :style="{'font-size': (0.7 * label.sz) + 'pt'}"
          >{{ label.txt }}</text>
        </g>
        <g :style="colors.display.emission">
          <text
              v-for="display in design.layer0.disp"
              :x="display.co.x" :y="display.co.y"
              :style="{'font-size': (0.7 * display.sz) + 'pt'}"
              :class="['dashboard_' + display.fnt.toLowerCase()]"
          >{{ display.seg }}</text>
        </g>
        <g :style="colors.needle.needle">
          <path
              v-for="needle in design.layer0.ndl"
              :transform="'translate(' + needle.co.x + ' ' + needle.co.y + ') rotate(' + needle.clp[0] + ')'"
              :d="needle.pth"
          />
        </g>

        <!-- LAYER 1 -->
        <!-- Combined diffuse and emission for better rendering performance. -->
        <!-- Needle shadows cover emission as a result, but it's hardly noticeable IMO. -->
        <path
            :d="design.layer1.pth" class="dashboard_background"
            :style="{'fill': colors.background}"
        />
        <g :style="colors.primary.combined">
          <path :d="design.layer1.prim.pth"/>
          <text
              v-for="label in design.layer1.prim.lbl"
              :x="label.co.x" :y="label.co.y"
              :style="{'font-size': (0.7 * label.sz) + 'pt'}"
          >{{ label.txt }}</text>
        </g>
        <g :style="colors.secondary.combined">
          <path :d="design.layer1.sec.pth"/>
          <text
              v-for="label in design.layer1.sec.lbl"
              :x="label.co.x" :y="label.co.y"
              :style="{'font-size': (0.7 * label.sz) + 'pt'}"
          >{{ label.txt }}</text>
        </g>

        <path
            v-for="indicator in design.layer1.ind"
            :transform="'translate(' + indicator.co.x + ' ' + indicator.co.y + ')'"
            :d="indicator.pth"
            :style="colors.indicator[indicator.col][false ? 'on' : 'off']"
        />

        <g :style="colors.needle.needle">
          <g
              v-for="needle in design.layer1.ndl"
              :transform="'translate(' + needle.co.x + ' ' + needle.co.y + ') rotate(' + needle.clp[0] + ')'"
          >
            <path :d="needle.pth"/>
            <circle r="20" fill="url('#needleCenter')" stroke="none"/>
          </g>
        </g>
      </svg>
    </div>
  </div>

</template>

<style>
body {
  margin: 0;
  background-color: #000;
}
</style>

<style scoped>

.container {
  font-family: Roboto, "Helvetica Neue", sans-serif;
  margin: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.dashboard_background {
}

.dashboard_top {
  position: absolute;
  container-type: inline-size;
  container-name: dash;
  max-width: 100vw;
  max-height: 100vh;
  height: 100vh;
  text-anchor: middle;
  dominant-baseline: central;
}

.dashboard_full {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}

.dashboard_needle {
  fill: #F64;
  stroke: #832;
  stroke-width: 1;
  filter: drop-shadow(0px 0px 10px #F648);
}

.dashboard_occlusion {
  filter: drop-shadow(1px 2px 30px #0004) drop-shadow(1px 2px 5px #0008);
}

.dashboard_primary {
  fill: #AF8;
  filter: drop-shadow(0px 0px 5px #AF86);
}

.dashboard_secondary {
  fill: #FA8;
  filter: drop-shadow(0px 0px 5px #FA86);
}

.dashboard_segment {
  fill: #0002;
}

.dashboard_desg7 {
  font-family: "DSEG7 Classic Mini", monospace;
  font-style: italic;
  dominant-baseline: initial;
}

.dashboard_desg14 {
  font-family: "DSEG14 Classic Mini", monospace;
  font-style: italic;
  dominant-baseline: initial;
}

.indicator-off {
  color: #101010;
}

.indicator-red {
  color: #FF0000;
}

.indicator-amber {
  color: #FFAA00;
}

.indicator-green {
  color: #00FF60;
}

.indicator-blue {
  color: #0044FF;
}

.indicator-gray {
  color: #CCCCCC;
}

</style>