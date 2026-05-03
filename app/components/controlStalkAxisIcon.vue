<script setup lang="ts">

import type { StalkAxisType } from "~/composables/stalkMap";

const {
  axis,
  index,
} = defineProps<{
  axis: StalkAxisType,
  index?: number,
}>();

const icon = computed((): string => {
  switch (axis) {
    case "lowBeam":
      switch (index) {
        case undefined: return "mdi-lightbulb-on-outline";
        case 0: return "mdi-numeric-0";
        case 1: return "mdi-car-parking-lights";
        case 2: return "mdi-car-light-dimmed";
        default: return "none";
      }

    case "highBeam":
      switch (index) {
        case undefined: return "mdi-car-light-high";
        case 0: return "mdi-numeric-0";
        case 1: return "mdi-numeric-1";
        default: return "none";
      }

    case "highBeamReverseHorn":
      switch (index) {
        case undefined: return "mdi-car-light-high";
        case 0: return "mdi-bullhorn-outline";
        case 1: return "mdi-numeric-0";
        case 2: return "mdi-numeric-1";
        default: return "none";
      }

    case "highBeamCenterHorn":
      switch (index) {
        case undefined: return "mdi-car-light-high";
        case 0: return "mdi-numeric-0";
        case 1: return "mdi-bullhorn-outline";
        case 2: return "mdi-numeric-1";
        default: return "none";
      }

    case "blinkers":
      switch (index) {
        case undefined: return "blinkers";
        default: return "none";
      }

    case "wipers":
      switch (index) {
        case undefined: return "mdi-wiper";
        case 0: return "mdi-numeric-0";
        case 1: return "dots";
        case 2: return "mdi-numeric-1";
        case 3: return "mdi-numeric-2";
        default: return "none";
      }

    case "transGear":
      switch (index) {
        case undefined: return "mdi-cog";
        case 0: return "mdi-minus";
        case 1: return "mdi-pan-vertical";
        case 2: return "mdi-plus";
        default: return "none";
      }

    case "transBrake":
      switch (index) {
        case undefined: return "mdi-car-brake-retarder";
        case 0: return "mdi-minus";
        case 1: return "mdi-pan-vertical";
        case 2: return "mdi-plus";
        default: return "none";
      }

    case "transDirection":
      switch (index) {
        case undefined: return "mdi-cog-transfer";
        case 0: return "mdi-alpha-r";
        case 1: return "mdi-alpha-n";
        case 2: return "mdi-alpha-d";
        default: return "none";
      }

    case "transMode":
      switch (index) {
        case undefined: return "mdi-account-cog";
        case 0: return "mdi-alpha-m";
        case 1: return "mdi-alpha-a";
        default: return "none";
      }

    case "unmapped":
      return "none"
  }
});

function isMdi() {
  return icon.value.startsWith("mdi-");
}

function getMdiSize() {
  const i = icon.value;
  if (i.startsWith("mdi-alpha-")) return '9cqw';
  if (i.startsWith("mdi-numeric-")) return '9cqw';
  if (index === undefined) return '8cqw';
  return '6cqw';
}

</script>

<template>
  <v-icon v-if="isMdi()" :size="getMdiSize()">{{icon}}</v-icon>
  <v-icon v-else-if="icon == 'dots'" :size="getMdiSize()" style="margin: 0 1.5cqw 0 1.5cqw">mdi-dots-horizontal</v-icon>
  <div class="stalk-axis-turn-indicators" v-else-if="icon == 'blinkers'">
    <v-icon size="8cqw" style="position: absolute; top: 1cqw; right: -20%">mdi-arrow-right-bold</v-icon>
    <v-icon size="8cqw" style="position: absolute; top: 1cqw; left: -20%">mdi-arrow-left-bold</v-icon>
  </div>
</template>

<style scoped>

.stalk-axis-turn-indicators {
  transition: inherit;
}

</style>