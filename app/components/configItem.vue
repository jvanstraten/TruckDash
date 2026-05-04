<script setup lang="ts">
import { useGestureDetection, type GestureData } from "~/composables/gestureDetection";

defineProps(["title", "subtitle", "enabled", "value"]);
const emit = defineEmits(["activate"]);

function stripHtml(value: string): string {
  const div = document.createElement("div")
  div.innerHTML = value
  return div.textContent || div.innerText || "";
}

const help = ref<boolean>(false);
const tooltip = ref<boolean>(false);
const tooltipTimer = ref<number | undefined>(undefined);

function onGesture(data: GestureData) {
  if (data.type == "click") {
    emit("activate");
  } else if (data.type == "hold") {
    help.value = true;
  }
}

const gestures = useGestureDetection(onGesture, { receiveHolds: true });
let pointerDown: boolean = false;

function closeTooltip() {
  tooltip.value = false;
  if (tooltipTimer.value) {
    window.clearTimeout(tooltipTimer.value);
    tooltipTimer.value = undefined;
  }
}

function onPointerDown(event: PointerEvent) {
  gestures.onPointerDown(event);
  pointerDown = true;
  closeTooltip();
}

function onPointerMove(event: PointerEvent) {
  gestures.onPointerMove(event);
  if (event.movementX != 0 && event.movementY != 0) {
    closeTooltip();
  }
  if (!pointerDown && tooltipTimer.value === undefined) {
    tooltipTimer.value = window.setTimeout(() => {
      tooltipTimer.value = undefined;
      tooltip.value = true;
    }, 1000);
  }
}

function onPointerUp(event: PointerEvent) {
  gestures.onPointerUp(event);
  pointerDown = false;
}

function onPointerLeave(event: PointerEvent) {
  closeTooltip();
}

function onPointerCancel(event: PointerEvent) {
  gestures.onPointerCancel(event);
  closeTooltip();
}

</script>

<template>
  <v-list-item
      :title="title + (value && value !== '' ? `: ${stripHtml(value)}` : '')"
      :subtitle="subtitle"
      :active="false"
      :disabled="enabled === false"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerCancel"
      @pointerleave="onPointerLeave"
      @click="gestures.onClick"
      style="touch-action: pan-y; user-select: none"
  >
    <template v-slot:prepend><slot name="prepend"/></template>
    <template v-slot:append><slot name="append"/></template>
    <v-tooltip
        bottom
        activator="parent"
        location="bottom"
        max-width="450"
        :text="subtitle"
        :open-on-click="false"
        :open-on-hover="false"
        :open-on-focus="false"
        v-model="tooltip"
    />
  </v-list-item>
  <v-dialog max-width="470" v-model="help">
    <v-card :title="title" :text="subtitle" @click="help = false">
      <template v-slot:append>
        <v-icon>mdi-information-outline</v-icon>
      </template>
    </v-card>
  </v-dialog>
</template>
