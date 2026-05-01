<script setup lang="ts">

import gestureAction from "~/components/gestureAction.vue"
import type { GestureMapping } from "~/composables/gestureControls";

const {
  gestureMapping,
} = defineProps<{
  gestureMapping: GestureMapping,
}>();

</script>

<template>
  <div class="gesture-input-outer">

    <div class="workspace-gesture-zones" :style="{'grid-template-columns': `repeat(${gestureMapping.zones.length}, auto)`}">
      <div v-for="[index, zone] in gestureMapping.zones.entries()" class="workspace-gesture-zone">
        <span class="workspace-gesture-zone-header">Swipe zone {{ index + 1 }}</span>
        <div class="workspace-gesture-zone-directions">
          <div style="grid-area: 3 / 3 / 4 / 4"><v-icon size="4cqw" color="#FFF8">mdi-gesture-tap-hold</v-icon></div>
          <div style="grid-area: 2 / 3 / 3 / 4"><v-icon size="3cqw" color="#FFF8">mdi-arrow-up</v-icon></div>
          <div style="grid-area: 4 / 3 / 5 / 4"><v-icon size="3cqw" color="#FFF8">mdi-arrow-down</v-icon></div>
          <div style="grid-area: 3 / 2 / 4 / 3"><v-icon size="3cqw" color="#FFF8">mdi-arrow-left</v-icon></div>
          <div style="grid-area: 3 / 4 / 4 / 5"><v-icon size="3cqw" color="#FFF8">mdi-arrow-right</v-icon></div>
          <div style="grid-area: 1 / 2 / 2 / 5"><gestureAction :action="zone.up" size="4cqw"/></div>
          <div style="grid-area: 5 / 2 / 6 / 5"><gestureAction :action="zone.down" size="4cqw"/></div>
          <div style="grid-area: 2 / 1 / 5 / 2; flex-direction: column"><gestureAction :action="zone.left" size="4cqw"/></div>
          <div style="grid-area: 2 / 5 / 5 / 6; flex-direction: column"><gestureAction :action="zone.right" size="4cqw"/></div>
        </div>
      </div>
    </div>

    <div class="workspace-click-actions">
      <div class="workspace-click-cell" style="grid-area: 1 / 1 / 2 / 2">
        <v-icon size="4cqw" color="#FFF8">mdi-gesture-tap</v-icon>
        <gestureAction :action="gestureMapping.click" size="4cqw"/>
      </div>
      <div class="workspace-click-cell" style="grid-area: 1 / 2 / 2 / 3">
        Anywhere
      </div>
      <div class="workspace-click-cell" style="grid-area: 1 / 3 / 2 / 4">
        <v-icon size="4cqw" color="#FFF8">mdi-gesture-tap-hold</v-icon>
        <gestureAction :action="gestureMapping.hold" size="4cqw"/>
      </div>
    </div>

  </div>
</template>

<style scoped>

.gesture-input-outer {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  container-type: inline-size;
}

.workspace-gesture-zones {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  display: grid;
  grid-template-rows: repeat(1, auto);
}

.workspace-gesture-zone {
  background-color: #4448;
  margin: 0.5cqmin;
  border-radius: 2cqmin;
  border: 1px solid white;
  position: relative;
}

.workspace-gesture-zone-header {
  position: absolute;
  left: 0;
  right: 0;
  top: 2cqw;
  height: 3cqw;
  color: white;
  font-size: 2cqw;
  text-align: center;
  filter: drop-shadow(0 0px 2px black);
}

.workspace-gesture-zone-directions {
  position: absolute;
  left: 50%;
  top: 8cqw;
  width: 20cqw;
  height: 20cqw;
  translate: -50% 0;
  background: none;
  border: none;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(5, 1fr);
}

.workspace-gesture-zone-directions div {
  display: flex;
  justify-content: center;
  align-items: center;
}

.workspace-click-actions {
  position: absolute;
  left: 30cqw;
  height: 5cqw;
  right: 30cqw;
  bottom: 0;
  background-color: #444;
  border-radius: 2cqmin 2cqmin 0 0;
  border: 1px solid white;
  border-bottom: none;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(1, 1fr);
}

.workspace-click-cell {
  font-size: 3cqw;
  display: flex;
  justify-content: center;
  align-items: center;
}

</style>