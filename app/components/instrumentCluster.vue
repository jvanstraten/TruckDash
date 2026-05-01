<script setup lang="ts">

import { design } from "~/data/design";

import type { ConfigurationData } from "~/types/globals";
import type { Instruments } from "~/types/instruments";
import type { Shading } from "~/types/shading";

const {
  configuration,
  instruments,
  shading,
} = defineProps<{
  configuration: ConfigurationData,
  instruments: Instruments,
  shading: Shading,
}>();

</script>

<template>
  <svg class="instrumentCluster" viewBox="0 0 1300 600">
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
    <g :style="configuration.perfShadows ? shading.primary.diffuse : shading.primary.combined">
      <path :d="design.layer0.prim.pth"/>
      <text
          v-for="label in design.layer0.prim.lbl"
          :x="label.co.x" :y="label.co.y"
          :style="{'font-size': (0.7 * label.sz) + 'pt'}"
      >{{ label.txt }}</text>
    </g>
    <g :style="configuration.perfShadows ? shading.secondary.diffuse : shading.secondary.combined">
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
        v-if="configuration.perfShadows"
        :d="design.layer1.pth"
        class="instrumentCluster_occlusion"
    />

    <!-- LAYER 0 EMISSION -->
    <g v-if="configuration.perfShadows" :style="shading.primary.emission">
      <path :d="design.layer0.prim.pth"/>
      <text
          v-for="label in design.layer0.prim.lbl"
          :x="label.co.x" :y="label.co.y"
          :style="{'font-size': (0.7 * label.sz) + 'pt'}"
      >{{ label.txt }}</text>
    </g>
    <g v-if="configuration.perfShadows" :style="shading.secondary.emission">
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
      >{{ instruments.displays[display.id].value }}</text>
    </g>
    <path
        v-for="indicator in design.layer0.ind"
        :transform="'translate(' + indicator.co.x + ' ' + indicator.co.y + ')'"
        :d="indicator.pth"
        :style="shading.indicator[indicator.col][instruments.indicators[indicator.id].value ? 'on' : 'off']"
    />
    <g :style="shading.needle.needle">
      <path
          v-for="needle in design.layer0.ndl"
          :transform="'translate(' + needle.co.x + ' ' + needle.co.y + ') rotate(' + instruments.needles[needle.id].value + ')'"
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
        :style="shading.indicator[indicator.col][instruments.indicators[indicator.id].value ? 'on' : 'off']"
    />

    <g :style="shading.needle.needle">
      <g
          v-for="needle in design.layer1.ndl"
          :transform="'translate(' + needle.co.x + ' ' + needle.co.y + ') rotate(' + instruments.needles[needle.id].value + ')'"
      >
        <path :d="needle.pth"/>
        <circle v-if="configuration.perfNeedleDetails" r="20" fill="url('#needleCenter')" stroke="none"/>
      </g>
    </g>
  </svg>
</template>

<style scoped>

.instrumentCluster {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  font-family: Roboto, "Helvetica Neue", sans-serif;
  text-anchor: middle;
  dominant-baseline: central;
  border-radius: 3% / 6.5%;
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