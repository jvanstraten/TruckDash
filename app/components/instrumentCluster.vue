<script setup lang="ts">

import { useGlobals } from "~/composables/globals";
import { useInstruments } from "~/composables/instruments";
import { useShading } from "~/composables/shading";
import { design } from "~/data/design";

const { configuration, gameState } = useGlobals();
const { instruments } = useInstruments(gameState, configuration);
const { shading } = useShading(gameState, instruments, configuration);

</script>

<template>
  <div class="instrumentCluster_container" :style="{'background-color': shading.background}">
    <div class="instrumentCluster_top" :style="{'aspect-ratio': design.dim.view.w + ' / ' + design.dim.view.h}">
      {{""/* Note: vue is being an idiot and is refusing to bind viewBox reliably, regardless of camelcase property workaround */}}
      <svg class="instrumentCluster_full" viewBox="0 0 1300 600">
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
            :d="design.layer0.pth"
            :style="{'fill': shading.lowerBackground}"
        />
        <g :style="configuration.performance.shadows ? shading.primary.diffuse : shading.primary.combined">
          <path :d="design.layer0.prim.pth"/>
          <text
              v-for="label in design.layer0.prim.lbl"
              :x="label.co.x" :y="label.co.y"
              :style="{'font-size': (0.7 * label.sz) + 'pt'}"
          >{{ label.txt }}</text>
        </g>
        <g :style="configuration.performance.shadows ? shading.secondary.diffuse : shading.secondary.combined">
          <path :d="design.layer0.sec.pth"/>
          <text
              v-for="label in design.layer0.sec.lbl"
              :x="label.co.x" :y="label.co.y"
              :style="{'font-size': (0.7 * label.sz) + 'pt'}"
          >{{ label.txt }}</text>
        </g>
        <g :style="shading.display.diffuse">
          <text
              v-for="display in design.layer0.disp"
              :x="display.co.x" :y="display.co.y"
              :style="{'font-size': (0.7 * display.sz) + 'pt'}"
              :class="['instrumentCluster_' + display.fnt.toLowerCase()]"
          >{{ display.seg }}</text>
        </g>

        <!-- LAYER 0 AMBIENT SHADING -->
        <path
            v-if="configuration.performance.shadows"
            :d="design.layer1.pth"
            class="instrumentCluster_occlusion"
        />

        <!-- LAYER 0 EMISSION -->
        <g v-if="configuration.performance.shadows" :style="shading.primary.emission">
          <path :d="design.layer0.prim.pth"/>
          <text
              v-for="label in design.layer0.prim.lbl"
              :x="label.co.x" :y="label.co.y"
              :style="{'font-size': (0.7 * label.sz) + 'pt'}"
          >{{ label.txt }}</text>
        </g>
        <g v-if="configuration.performance.shadows" :style="shading.secondary.emission">
          <path :d="design.layer0.sec.pth"/>
          <text
              v-for="label in design.layer0.sec.lbl"
              :x="label.co.x" :y="label.co.y"
              :style="{'font-size': (0.7 * label.sz) + 'pt'}"
          >{{ label.txt }}</text>
        </g>
        <g :style="shading.display.emission">
          <text
              v-for="display in design.layer0.disp"
              :x="display.co.x" :y="display.co.y"
              :style="{'font-size': (0.7 * display.sz) + 'pt'}"
              :class="['instrumentCluster_' + display.fnt.toLowerCase()]"
          >{{ (instruments.displays as any)[display.id].value }}</text>
        </g>
        <g :style="shading.needle.needle">
          <path
              v-for="needle in design.layer0.ndl"
              :transform="'translate(' + needle.co.x + ' ' + needle.co.y + ') rotate(' + (instruments.needles as any)[needle.id].value + ')'"
              :d="needle.pth"
          />
        </g>

        <!-- LAYER 1 -->
        <!-- Combined diffuse and emission for better rendering performance. -->
        <!-- Needle shadows cover emission as a result, but it's hardly noticeable IMO. -->
        <path
            :d="design.layer1.pth"
            :style="{'fill': shading.background}"
        />
        <g :style="shading.primary.combined">
          <path :d="design.layer1.prim.pth"/>
          <text
              v-for="label in design.layer1.prim.lbl"
              :x="label.co.x" :y="label.co.y"
              :style="{'font-size': (0.7 * label.sz) + 'pt'}"
          >{{ label.txt }}</text>
        </g>
        <g :style="shading.secondary.combined">
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
            :style="(shading.indicator as any /* shut up */)[indicator.col][(instruments.indicators as any /* you too */ )[indicator.id].value ? 'on' : 'off']"
        />

        <g :style="shading.needle.needle">
          <g
              v-for="needle in design.layer1.ndl"
              :transform="'translate(' + needle.co.x + ' ' + needle.co.y + ') rotate(' + (instruments.needles as any)[needle.id].value + ')'"
          >
            <path :d="needle.pth"/>
            <circle v-if="configuration.performance.needleDetails" r="20" fill="url('#needleCenter')" stroke="none"/>
          </g>
        </g>
      </svg>
    </div>
  </div>
</template>

<style scoped>

.instrumentCluster_container {
  font-family: Roboto, "Helvetica Neue", sans-serif;
  margin: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.instrumentCluster_top {
  position: absolute;
  container-type: inline-size;
  container-name: dash;
  max-width: 100vw;
  max-height: 100vh;
  height: 100vh;
  text-anchor: middle;
  dominant-baseline: central;
}

.instrumentCluster_full {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}

.instrumentCluster_occlusion {
  filter: drop-shadow(1px 2px 30px #0004) drop-shadow(1px 2px 5px #0008);
}

.instrumentCluster_desg7 {
  font-family: "DSEG7 Classic Mini", monospace;
  font-style: italic;
  dominant-baseline: initial;
}

.instrumentCluster_desg14 {
  font-family: "DSEG14 Classic Mini", monospace;
  font-style: italic;
  dominant-baseline: initial;
}

</style>