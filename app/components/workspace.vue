<script setup lang="ts">

import uiContainer from "~/components/uiContainer.vue";
import instrumentCluster from "~/components/instrumentCluster.vue";
import controlStalk from "~/components/controlStalk.vue";
import gestureInputMap from "~/components/gestureInputMap.vue";
import display from "~/components/display.vue";

import { useConfiguration } from "~/composables/configuration";
import { useGame } from "~/composables/game";
import { useInstruments } from "~/composables/instruments";
import { useShading } from "~/composables/shading";
import { useGestureDetection, type GestureData } from "~/composables/gestureDetection";
import { useStalkMap } from "~/composables/stalkMap";
import { useGestureControls } from "~/composables/gestureControls";

// Adjust: layout adjustment overlay is active.
// Mapping: gesture input mapping overlay is active.
const {
  adjust,
  mapping,
} = defineProps<{
  adjust: boolean,
  mapping: boolean,
}>();

// Menu emit opens the main menu.
const emit = defineEmits(["menu"]);

// Load configuration from local storage.
const { configuration } = useConfiguration();

// Decode stalk control map, because it's a pain in the ass, and it's needed
// both here and in the stalk components.
const stalkMap = useStalkMap(configuration);

// Use the telemetry connection (TruckTel).
const { gameState, sendToGame } = useGame(configuration);

// Use instrument logic.
const { instruments } = useInstruments(gameState, configuration);

// Use shading logic.
const { shading } = useShading(gameState, configuration);

// Use gesture controls. When the input mapping display is activated by the
// user, we push decoded gesture information into a snackbar queue to also
// allow the user to test input.
const gestureHistory = ref<Object[]>([]);
function pushGesture(text: string, color: string) {
  gestureHistory.value.push({ text, color });
}
const onGestureDecoded = computed(() => {
  return mapping ? pushGesture : undefined;
});
const { decodeGesture, gestureMapping } = useGestureControls(configuration, stalkMap, onGestureDecoded);

// Toplevel gesture routing.
function onGesture(data: GestureData): boolean {

  // Override all gesture behavior if the UI is being adjusted.
  if (adjust) {
    if (data.type == "click") {
      emit("menu");
    }
    return false;
  }

  // Decode the gesture to a control action based on the current input map.
  let action = undefined;
  try {
    action = decodeGesture(data);
    pushGestureLog(`Mapping: ${action}`);
  } catch (e) {
    pushGestureLog(`Error decoding: ${e}`);
  }

  // Handle menu.
  if (action == "menu") {
    emit("menu");
    return !data.last;
  }

  // Don't actually send events to the game when mapping is active.
  if (!mapping) {

    // Get rid of inputs not addressed to the game.
    if (action === undefined) return !data.last;
    if (action === "layer") return !data.last;

    // Handle stalk commands.
    let [axis, dir] = action;
    if (axis === "unmapped") return !data.last;
    if (axis === "highBeamReverseHorn") axis = "highBeam";
    if (axis === "highBeamCenterHorn") axis = "highBeam";
    sendToGame(`${axis}-${dir}`);

  }
  return !data.last;

}

const enableGestureDebugging: boolean = false;

const gestureDebug = ref<string>("...");
const gestureDebugHistory = ref<string[]>([]);
const gestures = useGestureDetection(
    onGesture, {
      receiveSwipes: true,
      receiveHolds: true,
      receiveRotations: true,
      receiveMultiTouch: true,
    }, enableGestureDebugging ? gestureDebug : undefined);

function pushGestureLog(s: string) {
  if (gestureDebugHistory.value.length > 50) gestureDebugHistory.value.splice(0, 1);
  gestureDebugHistory.value.push(s);
}
watch(gestureDebug, () => {
  pushGestureLog(gestureDebug.value);
});

</script>

<template>
  <!-- touchstart.prevent: stops long press from opening context menu on chrome android, doesn't *seem* to have adverse effects on others -->
  <div
      class="workspace"
      :style="{'background-color': configuration.themeWorkspaceFollowsBackground ? shading.background : configuration.themeWorkspace}"
      @pointerdown="gestures.onPointerDown"
      @pointermove="gestures.onPointerMove"
      @pointerup="gestures.onPointerUp"
      @pointerleave="gestures.onPointerUp"
      @pointercancel="gestures.onPointerCancel"
      @click="gestures.onClick"
      @touchstart.prevent
  >
    <uiContainer
        :adjust="adjust"
        @exitAdjust="emit('menu')"
        v-if="configuration.layoutInstrumentsEnabled"
        v-model="configuration.layoutInstrumentsPosition"
        :aspect="13/6"
    >
      <instrumentCluster
          :configuration="configuration"
          :instruments="instruments"
          :shading="shading"
      />
    </uiContainer>

    <uiContainer
        :adjust="adjust"
        @exitAdjust="emit('menu')"
        v-if="configuration.layoutLeftStalkEnabled"
        v-model="configuration.layoutLeftStalkPosition"
        :minAspect="1.5"
        :maxAspect="3"
        :alignX="0"
        v-slot:default="{ aspect }"
    >
      <controlStalk
          side="left"
          :aspect="aspect"
          :uiAdjust="adjust"
          :configuration="configuration"
          :stalkMap="stalkMap"
          :gameState="gameState"
          :shading="shading"
      />
    </uiContainer>

    <uiContainer
        :adjust="adjust"
        @exitAdjust="emit('menu')"
        v-if="configuration.layoutRightStalkEnabled"
        v-model="configuration.layoutRightStalkPosition"
        :minAspect="1.5"
        :maxAspect="3"
        :alignX="1"
        v-slot:default="{ aspect }"
    >
      <controlStalk
          side="right"
          :aspect="aspect"
          :uiAdjust="adjust"
          :configuration="configuration"
          :stalkMap="stalkMap"
          :gameState="gameState"
          :shading="shading"
      />
    </uiContainer>

    <uiContainer
        :adjust="adjust"
        @exitAdjust="emit('menu')"
        v-if="configuration.layoutDisplay1Address"
        v-model="configuration.layoutDisplay1Position"
    >
      <display
          :address="configuration.layoutDisplay1Address"
          :zoom="configuration.layoutDisplay1Zoom"
          :configuration="configuration"
          :gameState="gameState"
          :shading="shading"
      />
    </uiContainer>

    <uiContainer
        :adjust="adjust"
        @exitAdjust="emit('menu')"
        v-if="configuration.layoutDisplay2Address"
        v-model="configuration.layoutDisplay2Position"
    >
      <display
          :address="configuration.layoutDisplay2Address"
          :zoom="configuration.layoutDisplay2Zoom"
          :configuration="configuration"
          :gameState="gameState"
          :shading="shading"
      />
    </uiContainer>

    <v-snackbar-queue
        v-model="gestureHistory"
        :close-delay="2000"
        location="bottom end"
        display-strategy="overflow"
        :total-visible="10"
    />

    <div v-if="enableGestureDebugging" style="position: absolute; left: 0; bottom: 0">
      <div v-for="message in gestureDebugHistory">{{message}}</div>
    </div>

    <gestureInputMap
        v-if="mapping"
        :gestureMapping="gestureMapping"
    />

  </div>

</template>

<style scoped>

.workspace {
  overflow: hidden;
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  touch-action: none;
  user-select: none;
}

</style>