<script setup lang="ts">

import type { ControlAction } from "~/composables/gestureControls";

const {
  action,
  size,
} = defineProps<{
  action: ControlAction,
  size: string,
}>();

function describeActionWithIcons(action: ControlAction): string[] {
  if (action === undefined) return [];
  if (typeof action === "string") return {
    layer: ["layers-plus"],
    menu: ["menu"],
  }[action];
  if (action[1] == "rel") return [];
  return {
    activate: {
      inc: ["check"],
      dec: ["check"],
    },
    ignition: {
      inc: ["engine-outline"],
      dec: ["engine-off-outline"],
    },
    parkingBrake: {
      inc: ["car-brake-parking"],
      dec: ["circle-off-outline"],
    },
    lowBeam: {
      inc: ["car-light-dimmed", "plus"],
      dec: ["car-light-dimmed", "minus"],
    },
    highBeam: {
      inc: ["car-light-high", "numeric-1"],
      dec: ["car-light-high", "numeric-0"],
    },
    highBeamCenterHorn: {
      inc: ["car-light-high", "numeric-1"],
      dec: ["car-light-high", "numeric-0"],
    },
    highBeamReverseHorn: {
      inc: ["car-light-high", "numeric-1"],
      dec: ["car-light-high", "numeric-0"],
    },
    blinkers: {
      inc: ["arrow-left-bold"],
      dec: ["arrow-right-bold"],
    },
    wipers: {
      inc: ["wiper", "plus"],
      dec: ["wiper", "minus"],
    },
    transGear: {
      inc: ["cog-box", "plus"],
      dec: ["cog-box", "minus"],
    },
    transBrake: {
      inc: ["car-brake-retarder", "plus"],
      dec: ["car-brake-retarder", "minus"],
    },
    transDirection: {
      inc: ["cog-box", "alpha-d"],
      dec: ["cog-box", "alpha-r"],
    },
    transMode: {
      inc: ["cog-box", "alpha-a"],
      dec: ["cog-box", "alpha-m"],
    },
    unmapped: {
      inc: [],
      dec: [],
    }
  }[action[0]][action[1]];
}

</script>

<template>
  <v-icon v-if="action !== undefined" v-for="icon in describeActionWithIcons(action)" :size="size">mdi-{{icon}}</v-icon>
  <v-icon v-else :size="`calc(${size} * 0.5)`" color="#FFF8">mdi-cancel</v-icon>
</template>
