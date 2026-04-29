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
  <div class="stalks_container" :style="{'background-color': shading.background}">
    <div class="stalks_top stalks_grid" style="aspect-ratio: 32 / 3">
      <div style="background-color: #666; grid-area: 1 / 1 / 13 / 33; border-radius: 2vw; margin: 0vw 1vw 0vw 1vw"></div>

      <div style="grid-area: 5 / 2 / 9 / 3; display: flex; justify-content: center; align-items: center"><v-icon size="3vw">mdi-arrow-up-down</v-icon></div>
      <div style="grid-area: 5 / 3 / 9 / 4; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 1.8vw"><v-icon size="3vw">mdi-chevron-right</v-icon></div>
      <div style="grid-area: 1 / 4 / 5 / 5; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 1.8vw">D</div>
      <div style="grid-area: 5 / 4 / 9 / 5; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 1.8vw">N</div>
      <div style="grid-area: 9 / 4 / 13 / 5; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 1.8vw">R</div>

      <div style="grid-area: 1 / 6 / 5 / 9; display: flex; justify-content: center; align-items: center"><v-icon size="3vw">mdi-arrow-left-right</v-icon></div>
      <div style="grid-area: 5 / 6 / 9 / 8; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 1.8vw">A</div>
      <div style="grid-area: 5 / 7 / 9 / 9; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 1.8vw">M</div>
      <div style="background-color: #555; grid-area: 9 / 6 / 13 / 9; display: flex; justify-content: center; align-items: center; border-radius: 0.5vw; box-shadow: inset 0 0 0.8vw black; margin: 0.1vw 0vw 0.1vw 0vw"></div>
      <div style="background-color: #666; grid-area: 9 / 7 / 13 / 9; display: flex; justify-content: center; align-items: center; border-radius: 0.5vw; box-shadow: inset 0 0 0.3vw black; margin: 0.2vw 0.1vw 0.2vw 0.1vw"><v-icon size="3vw">mdi-chevron-up</v-icon></div>

      <div style="grid-area: 1 / 10 / 9 / 11; display: flex; justify-content: center; align-items: center"><v-icon size="3vw">mdi-arrow-up-down</v-icon></div>
      <div style="grid-area: 1 / 11 / 5 / 12; display: flex; justify-content: center; align-items: center"><v-icon size="3vw">mdi-plus</v-icon></div>
      <div style="grid-area: 5 / 11 / 9 / 12; display: flex; justify-content: center; align-items: center"><v-icon size="3vw">mdi-minus</v-icon></div>
      <div style="grid-area: 9 / 10 / 13 / 12; display: flex; justify-content: center; align-items: center"><v-icon size="3vw">mdi-cog</v-icon></div>

      <div style="grid-area: 1 / 13 / 5 / 15; display: flex; justify-content: center; align-items: center"><v-icon size="3vw">mdi-arrow-left-right</v-icon></div>
      <div style="grid-area: 5 / 13 / 9 / 14; display: flex; justify-content: center; align-items: center"><v-icon size="3vw">mdi-plus</v-icon></div>
      <div style="grid-area: 5 / 14 / 9 / 15; display: flex; justify-content: center; align-items: center"><v-icon size="3vw">mdi-minus</v-icon></div>
      <div style="grid-area: 9 / 13 / 13 / 15; display: flex; justify-content: center; align-items: center"><v-icon size="3vw">mdi-car-brake-retarder</v-icon></div>

      <div style="grid-area: 3 / 22 / 8 / 23; display: flex; justify-content: center; align-items: center"><v-icon size="3vw">mdi-arrow-up-down</v-icon></div>
      <div style="grid-area: 4 / 23 / 7 / 24; display: flex; justify-content: center; align-items: center"><v-icon size="3vw">mdi-chevron-right</v-icon></div>
      <div style="grid-area: 1 / 24 / 4 / 25; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 1.8vw">HI</div>
      <div style="grid-area: 4 / 24 / 7 / 25; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 1.8vw">LO</div>
      <div style="grid-area: 7 / 24 / 10 / 25; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 1.8vw">•••</div>
      <div style="grid-area: 10 / 24 / 13 / 25; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 1.8vw">0</div>

      <div style="background: linear-gradient(to right, #0000 40%, #0002 47%, #0008 50%, #0002 53%, #0000 60%); grid-area: 1 / 3 / 13 / 5"></div>
      <div style="background: linear-gradient(to bottom, #0000, #0005, #0008); grid-area: 1 / 1 / 13 / 33; border-radius: 2vw; box-shadow: inset 0 0 0.8vw black; margin: 0vw 1vw 0vw 1vw; z-index: 1000"></div>
      <div style="background: linear-gradient(100deg, #4440 23%, #111F 25%, #444F 27%, #444F 73%, #111F 75%, #4440 77%); grid-area: 1 / 15 / 13 / 19; z-index: 1000"></div>
    </div>
  </div>
</template>

<style scoped>

.stalks_container {
  font-family: Roboto, "Helvetica Neue", sans-serif;
  margin: 0;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
}

.stalks_top {
  position: relative;
  width: 100vw;
  text-anchor: middle;
  dominant-baseline: central;
}

.stalks_grid {
  display: grid;
  grid-template-columns: repeat(32, 1fr);
  grid-template-rows: repeat(12, 1fr);
}


</style>