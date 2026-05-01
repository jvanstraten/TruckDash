<script setup lang="ts" xmlns="http://www.w3.org/1999/html">

import type {UiPosition} from "~/types/globals";

const uiConfig = defineModel<UiPosition>();

const props = defineProps<{
  adjust: boolean
  aspect?: number
}>();

type Coordinate = {
  x: number;
  y: number;
};

//-----------------------------------------------------------------------------
// Handle dragging to adjust positioning
//-----------------------------------------------------------------------------

const dragData = ref<{
  ctrlPt: "top" | "1" | "2";
  pointerStart: Coordinate;
  point1Start: Coordinate;
  point2Start: Coordinate;
  absStart: Coordinate;
  moved: boolean;
} | null>(null);

function onPointerDown(event: PointerEvent) {
  const target = event.target as HTMLElement;
  target.setPointerCapture(event.pointerId);

  const ctrlPt = target.dataset.ctrlPt;
  if (ctrlPt !== "top" && ctrlPt !== "1" && ctrlPt !== "2") return;
  if (uiConfig.value === undefined) return;

  dragData.value = {
    ctrlPt: ctrlPt,
    pointerStart: {
      x: event.clientX / window.innerWidth,
      y: event.clientY / window.innerHeight,
    },
    point1Start: {
      x: uiConfig.value.x1,
      y: uiConfig.value.y1,
    },
    point2Start: {
      x: uiConfig.value.x2,
      y: uiConfig.value.y2,
    },
    absStart: {
      x: event.clientX,
      y: event.clientY,
    },
    moved: false,
  }
}

function clampDelta(delta: number, start: number): number {
  if (delta + start > 1) return 1 - start;
  if (delta + start < 0) return -start;
  return delta;
}

function onPointerMove(event: MouseEvent) {
  const data = dragData.value;
  if (data === null) return;
  if (uiConfig.value === undefined) return;

  if (Math.abs(event.clientX - data.absStart.x) > 1 || Math.abs(event.clientY - data.absStart.y) > 1) {
    data.moved = true;
  }

  let dx = event.clientX / window.innerWidth - data.pointerStart.x;
  let dy = event.clientY / window.innerHeight - data.pointerStart.y;

  if (data.ctrlPt != "2") {
    dx = clampDelta(dx, data.point1Start.x);
    dy = clampDelta(dy, data.point1Start.y);
  }
  if (data.ctrlPt != "1") {
    dx = clampDelta(dx, data.point2Start.x);
    dy = clampDelta(dy, data.point2Start.y);
  }

  if (data.ctrlPt != "2") {
    uiConfig.value.x1 = data.point1Start.x + dx;
    uiConfig.value.y1 = data.point1Start.y + dy;
  }
  if (data.ctrlPt != "1") {
    uiConfig.value.x2 = data.point2Start.x + dx;
    uiConfig.value.y2 = data.point2Start.y + dy;
  }
}

function onClick(event: MouseEvent) {
  onPointerMove(event);
  if (dragData.value && dragData.value.moved) {
    event.stopPropagation();
  }
  dragData.value = null;
}

//-----------------------------------------------------------------------------
// Track window size
//-----------------------------------------------------------------------------

const windowSize = ref<Coordinate | undefined>(undefined);

function onResize(event: Event | null) {
  windowSize.value = {
    x: window.innerWidth,
    y: window.innerHeight,
  };
}

onMounted(() => {
  window.addEventListener("resize", onResize);
  onResize(null);
})

onUnmounted(() => {
  window.removeEventListener("resize", onResize);
})

//-----------------------------------------------------------------------------
// Compute component positions and sizes
//-----------------------------------------------------------------------------

function formatPercentage(value: number): string {
  return `${value*100}%`;
}

const fullCoords = computed(() => {
  if (!uiConfig.value) return {};
  return {
    left: formatPercentage(Math.min(uiConfig.value.x1, uiConfig.value.x2)),
    top: formatPercentage(Math.min(uiConfig.value.y1, uiConfig.value.y2)),
    width: formatPercentage(Math.abs(uiConfig.value.x1 - uiConfig.value.x2)),
    height: formatPercentage(Math.abs(uiConfig.value.y1 - uiConfig.value.y2)),
  };
});

const clientCoords = computed(() => {
  if (!uiConfig.value) return {};
  let left = Math.min(uiConfig.value.x1, uiConfig.value.x2);
  let top = Math.min(uiConfig.value.y1, uiConfig.value.y2);
  let width = Math.abs(uiConfig.value.x1 - uiConfig.value.x2);
  let height = Math.abs(uiConfig.value.y1 - uiConfig.value.y2);

  if (props.aspect !== undefined && windowSize.value !== undefined) {
    const windowWidth = windowSize.value.x;
    const windowHeight = windowSize.value.y;

    left *= windowWidth;
    top *= windowHeight;
    width *= windowWidth;
    height *= windowHeight;

    const desiredAspectRatio = props.aspect;
    const currentAspectRatio = width / height;
    if (currentAspectRatio < desiredAspectRatio) {
      const reducedHeight = width / desiredAspectRatio;
      top += (height - reducedHeight) / 2;
      height = reducedHeight;
    } else {
      const reducedWidth = height * desiredAspectRatio;
      left += (width - reducedWidth) / 2;
      width = reducedWidth;
    }

    left /= windowWidth;
    top /= windowHeight;
    width /= windowWidth;
    height /= windowHeight;
  }

  return {
    left: formatPercentage(left),
    top: formatPercentage(top),
    width: formatPercentage(width),
    height: formatPercentage(height),
  };
});

const cp1Coords = computed(() => {
  if (!uiConfig.value) return {};
  return {
    left: formatPercentage(uiConfig.value.x1),
    top: formatPercentage(uiConfig.value.y1),
  };
});

const cp2Coords = computed(() => {
  if (!uiConfig.value) return {};
  return {
    left: formatPercentage(uiConfig.value.x2),
    top: formatPercentage(uiConfig.value.y2),
  };
});

</script>

<template>

  <div class="uic-content" :style="clientCoords"><slot/></div>
  <div
      v-if="props.adjust"
      class="uic-border"
      :style="clientCoords"
  />
  <div
      v-if="props.adjust"
      class="uic-adjuster"
      :style="fullCoords"
      data-ctrl-pt="top"
      @click="onClick($event)"
      @pointerdown.stop.prevent="onPointerDown($event)"
      @pointermove.stop.prevent="onPointerMove($event)"
  />
  <div
      v-if="props.adjust"
      class="uic-control-point"
      :style="cp1Coords"
      data-ctrl-pt="1"
      @click="onClick($event)"
      @pointerdown.stop.prevent="onPointerDown($event)"
      @pointermove.stop.prevent="onPointerMove($event)"
  />
  <div
      v-if="props.adjust"
      class="uic-control-point"
      :style="cp2Coords"
      data-ctrl-pt="2"
      @click="onClick($event)"
      @pointerdown.stop.prevent="onPointerDown($event)"
      @pointermove.stop.prevent="onPointerMove($event)"
  />

</template>

<style scoped>

.uic-content {
  position: absolute;
  container-name: uic-content;
  container-type: inline-size;
  display: flex;
  justify-content: center;
  align-items: center;
}

.uic-border {
  position: absolute;
  background-color: #FFF4;
  border: 2px solid #FFF;
  z-index: 1000;
}

.uic-adjuster {
  position: absolute;
  border: 2px dashed #FFF;
  touch-action: none;
  z-index: 1000;
}

.uic-control-point {
  position: absolute;
  width: 20vmin;
  height: 20vmin;
  translate: -50% -50%;
  background-color: #F80;
  border: 2px solid #FFF;
  border-radius: 100%;
  touch-action: none;
  z-index: 1100;
  display: flex;
  justify-content: center;
  align-items: center;
}

</style>