<script setup lang="ts">

import uiContainer from "~/components/uiContainer.vue";
import instrumentCluster from "~/components/instrumentCluster.vue";

import { useGlobals } from "~/composables/globals";
import { useInstruments } from "~/composables/instruments";
import { useShading } from "~/composables/shading";

const adjust = defineModel<boolean>({ required: true });

const { configuration, gameState, gameSocket } = useGlobals();
const { instruments } = useInstruments(gameState, configuration);
const { shading } = useShading(gameState, instruments, configuration);

//-----------------------------------------------------------------------------
// Swipe handling
//-----------------------------------------------------------------------------

function onPointerDown(event: PointerEvent) {
  const target = event.target as HTMLElement;
  target.setPointerCapture(event.pointerId);
}

function onPointerMove(event: PointerEvent) {
}

function onClick(event: MouseEvent) {
  if (adjust.value) {
    adjust.value = false;
    event.stopPropagation();
  }
}

//-----------------------------------------------------------------------------
// End of script
//-----------------------------------------------------------------------------

</script>

<template>
  <div
      class="workspace"
      :style="{'background-color': configuration.themeWorkspaceFollowsBackground ? shading.background : configuration.themeWorkspace}"
      @pointerdown.stop.prevent="onPointerDown($event)"
      @pointermove.stop.prevent="onPointerMove($event)"
      @click="onClick($event)"
  >
    <ui-container
        :adjust="adjust"
        v-if="configuration.layoutInstrumentsEnabled"
        v-model="configuration.layoutInstrumentsPosition"
        :aspect="13/6"
    >
      <instrument-cluster
          :configuration="configuration"
          :instruments="instruments"
          :shading="shading"
      />
    </ui-container>

    <ui-container
        :adjust="adjust"
        v-if="configuration.layoutDisplay1Address"
        v-model="configuration.layoutDisplay1Position"
    >
      <display
          :address="configuration.layoutDisplay1Address"
          :configuration="configuration"
          :gameState="gameState"
          :shading="shading"
      />
    </ui-container>

    <ui-container
        :adjust="adjust"
        v-if="configuration.layoutDisplay2Address"
        v-model="configuration.layoutDisplay2Position"
    >
      <display
          :address="configuration.layoutDisplay2Address"
          :configuration="configuration"
          :gameState="gameState"
          :shading="shading"
      />
    </ui-container>
  </div>
</template>

<style scoped>

.workspace {
  background-color: #000;
  overflow: hidden;
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  touch-action: none;
}

</style>