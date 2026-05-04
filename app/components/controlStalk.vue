<script setup lang="ts">

import ControlStalkAxisIcon from "~/components/controlStalkAxisIcon.vue";

import type { ConfigurationData } from "~/composables/configuration";
import { getAxisRange, type StalkAxes, type StalkAxis, type StalkMap } from "~/composables/stalkMap";
import type { GameState } from "~/composables/game";
import type { Shading } from "~/composables/shading";

const {
  side,
  aspect,
  uiAdjust,
  configuration,
  stalkMap,
  gameState,
  shading,
} = defineProps<{
  side: "left" | "right",
  aspect: number,
  uiAdjust: boolean,
  configuration: ConfigurationData,
  stalkMap: StalkMap,
  gameState: GameState,
  shading: Shading,
}>();

const axes = computed<StalkAxes>(() => {
  return stalkMap[side].value;
});

// Returns the position of an axis before inversion.
function getAxisRawPosition(axis: StalkAxis): number {
  switch (axis.type) {
    case "lowBeam": return gameState.derived.utilStalkLowBeam.value;
    case "highBeam": return gameState.derived.utilStalkHighBeam.value;
    case "highBeamCenterHorn": return gameState.derived.utilStalkHighBeam.value;
    case "highBeamReverseHorn": return gameState.derived.utilStalkHighBeam.value;
    case "blinkers": return gameState.derived.utilStalkBlinkers.value;
    case "wipers": return gameState.derived.utilStalkWipers.value;
    case "transGear": return gameState.derived.transStalkShift.value;
    case "transBrake": return gameState.derived.transStalkBrake.value;
    case "transDirection": return gameState.derived.transStalkDirection.value;
    case "transMode": return gameState.derived.transStalkMode.value;
    default: return 0;
  }
}

function getAxisSwitchPositions(axis: StalkAxisType): number {
  const [low, high] = getAxisRange(axis);
  return high - low + 1;
}

function maybeInvertAxisIndex(axis: StalkAxis, index: number): number {
  if (!axis.invert) return index;
  return getAxisSwitchPositions(axis.type) - index - 1;
}

// Returns the normalized position of an axis for stalk position
// transformations.
function getStalkPosition(axis: StalkAxis): number {
  let range = getAxisRange(axis.type);
  let position = getAxisRawPosition(axis);

  // Invert axis as needed.
  if (axis.invert) {
    position = -position;
    range = [-range[1], -range[0]];
  }

  // Rescale the axis.
  const absRange = Math.max(Math.abs(range[0]), Math.abs(range[1]));
  position /= Math.max(absRange, 1);

  // Clamp the axis, just in case.
  position = Math.min(position, 1);
  position = Math.max(position, -1);

  return position;
}

// Returns the normalized switch index of an axis.
function getSwitchIndex(axis: StalkAxis, center?: boolean): number {
  let range = getAxisRange(axis.type);
  let position = getAxisRawPosition(axis);

  // Clamp the axis, just in case.
  position = Math.min(position, range[1]);
  position = Math.max(position, range[0]);

  // Normalize to start at zero and invert if needed.
  if (axis.invert) {
    position = range[1] - position;
  } else {
    position = position - range[0];
  }

  // Center if requested.
  if (center) {
    position -= (range[1] - range[0]) / 2;
  }

  return position;
}

// Transforms a cylindrical coordinate on the stalk to CSS coordinates. This
// function is by no means "correct" and was just tweaked manually to give
// passable results. We're not actually 3D-rendering the control stalks after
// all :(
function transformCoordinates(x: number, y: number): {x: number, y: number, scale: number, skew: number} {
  const rad = (15 - y) / 200 * Math.PI;
  const amount = Math.max(0, Math.cos(rad));
  const factor = Math.pow((1.8 - getStalkPosition(axes.value.moveX)), 1.5);
  return {
    x: amount * factor + x,
    y: Math.sin(rad) * 50 + 50,
    scale: amount,
    skew: Math.atan((Math.cos(rad - 0.05) - Math.cos(rad + 0.05)) * factor) * (side == "left" ? -1 : 1),
  }
}

// Disable animations to avoid shenanigans as much as possible:
//  - on startup;
//  - when configuration changes;
//  - when the layout is being adjusted;
//  - when the screen resizes.
// Basically whenever any layout logic changes. We have to do this because
// we DO want to animate element movement and transformations normally, in
// order to handle the 3D effects for stalk movement.
let pauseAnimationsTimer = ref<null | number>(null);
function pauseAnimations() {
  if (pauseAnimationsTimer.value !== null) {
    window.clearTimeout(pauseAnimationsTimer.value);
  }
  pauseAnimationsTimer.value = window.setTimeout(() => {
    pauseAnimationsTimer.value = null;
  }, 500);
}
watch(() => configuration, () => {
  pauseAnimations();
});
onMounted(() => {
  window.addEventListener("resize", pauseAnimations);
  pauseAnimations();
});
onUnmounted(() => {
  window.removeEventListener("resize", pauseAnimations);
});
const enableAnimations = computed<boolean>(() => {
  if (!configuration.perfAnimateStalks) return false;
  if (uiAdjust) return false;
  return pauseAnimationsTimer.value === null;
});

// Returns the computed style for the stalk body.
const bodyStyle = computed(() => {
  let style = {};

  // Calculate transform for stalk movement.
  const extraYSpace = 3 / (aspect ?? 3) - 1;
  const rotateZFactor = Math.min(extraYSpace, 1) * 6 + 1;
  let z = getStalkPosition(axes.value.moveY) * rotateZFactor;
  let y = 25 - getStalkPosition(axes.value.moveX) * 10;
  if (side == "right") {
    z = -z;
    y = -y;
  }
  Object.assign(style, {
    transform: `perspective(400cqw) rotateY(${y}deg) rotateZ(${z}deg)`,
  })

  // Enable/disable animations. We only need to do this on the body element,
  // because children are set to inherit its transition property.
  if (enableAnimations.value) {
    Object.assign(style, {
      transition: "all 0.15s ease-in-out",
    });
  }

  // Enable/disable shading.
  Object.assign(style, { backgroundColor: shading.stalkBackground });
  if (configuration.perfShadows) {
    Object.assign(style, { filter: "drop-shadow(0 0 0.2cqw #0003)" });
  } else {
    Object.assign(style, { border: "0.2cqw solid #000" });
  }

  return style;
});

type RenderLayer = "diffuse" | "emission" | "combined";

function getMarkingStyle(layer: RenderLayer) {
  let style = {};
  let z = 0;
  switch (layer) {
    case "diffuse": Object.assign(style, shading.integrated.diffuse); z = 0; break;
    case "emission": Object.assign(style, shading.integrated.emission); z = 2; break;
    case "combined": Object.assign(style, shading.integrated.combined); z = 2; break;
  }
  Object.assign(style, {zIndex: z});
  return style;
}

function getRenderLayers(): RenderLayer[] {
  return ['diffuse', 'emission'];
}

const ySwitchSeamStyle = computed(() => {
  const width = Math.abs(transformCoordinates(0, 0).x);
  return {
    width: `${width}cqw`,
  }
});

function elementStyle(x: number, y: number, w: number, h?: number, align?: "inner" | "outer") {
  const { x: tx, y: ty, scale, skew } = transformCoordinates(x, y);

  let justifyContent: "left" | "center" | "right" = "center";
  if (align == "inner") {
    if (side == "left") {
      justifyContent = "left";
    } else {
      justifyContent = "right";
    }
  } else if (align == "outer") {
    if (side == "left") {
      justifyContent = "right";
    } else {
      justifyContent = "left";
    }
  }

  let leftRight = `${tx}cqw`;
  return {
    top: `${ty}%`,
    left: side == "left" ? leftRight : "auto",
    right: side == "right" ? leftRight : "auto",
    width: `${w}cqw`,
    height: `${h ?? w}cqw`,
    scale: `1 ${scale}`,
    transform: `skewX(${skew}rad)`,
    justifyContent
  };
}

function SwitchTrackStyle() {
  const positions = getAxisSwitchPositions(axes.value.swX.type);
  return elementStyle(44, 0, positions * 6 + 4, 7);
}

function SwitchBodyStyle() {
  let style = elementStyle(44 - 6 * getSwitchIndex(axes.value.swX, true), 0, 9, 6);
  Object.assign(style, {
    background: shading.stalkBackground,
  });
  return style;
}

// Returns list of classes for the given base class.
function classes(cls: string) {
  return [`stalk-${cls}`, `stalk-${cls}-${side}`]
}
function shadedClasses(cls: string) {
  const shaded = configuration.perfShadows ? "shaded" : "unshaded";
  return [`stalk-${cls}`, `stalk-${cls}-${side}`, `stalk-${cls}-${shaded}`]
}

</script>

<template>
  <div :class="classes('container')">
    <div :class="classes('body')" :style="bodyStyle">
      <div v-for="layer in getRenderLayers()" class="stalk-group" :style="getMarkingStyle(layer)">
        <div v-if="axes.moveX.type != 'unmapped'" class="stalk-group">
          <controlStalkAxisIcon
              :class="classes('positioned')"
              :style="elementStyle(69, 90, 10)"
              :axis="axes.moveX.type"
          />
          <v-icon
              :class="classes('positioned')"
              :style="elementStyle(60, 90, 10)"
              size="8cqw"
          >mdi-arrow-up-down</v-icon>
          <v-icon
              :class="classes('positioned')"
              :style="elementStyle(64, 75, 10)"
              size="4cqw"
          >mdi-{{axes.moveX.invert ? 'plus' : 'minus'}}</v-icon>
        </div>

        <div v-if="axes.moveY.type != 'unmapped'" class="stalk-group">
          <controlStalkAxisIcon
              :class="classes('positioned')"
              :style="elementStyle(69, 0, 10)"
              :axis="axes.moveY.type"
          />
          <v-icon
              :class="classes('positioned')"
              :style="elementStyle(60, 0, 10)"
              size="8cqw"
          >mdi-arrow-up-down</v-icon>
          <v-icon
              v-if="axes.moveY.type != 'blinkers'"
              :class="classes('positioned')"
              :style="elementStyle(64, -15, 10)"
              size="4cqw"
          >mdi-{{axes.moveY.invert ? 'plus' : 'minus'}}</v-icon>
          <v-icon
              v-if="axes.moveY.type != 'blinkers'"
              :class="classes('positioned')"
              :style="elementStyle(64, 15, 10)"
              size="4cqw"
          >mdi-{{axes.moveY.invert ? 'minus' : 'plus'}}</v-icon>
        </div>

        <div v-if="axes.swX.type != 'unmapped'" class="stalk-group">
          <controlStalkAxisIcon
              v-for="index in Array(getAxisSwitchPositions(axes.swX.type)).keys()"
              :class="classes('positioned')"
              :style="elementStyle(-(index - (getAxisSwitchPositions(axes.swX.type)-1)/2) * 7 + 44, 40, 10)"
              :axis="axes.swX.type"
              :index="maybeInvertAxisIndex(axes.swX, index)"
          />
          <controlStalkAxisIcon
              :class="classes('positioned')"
              :style="elementStyle(44, 75, 8)"
              :axis="axes.swX.type"
          />

        </div>

        <div v-if="axes.swY.type != 'unmapped'" class="stalk-group">
          <controlStalkAxisIcon
              v-for="index in Array(getAxisSwitchPositions(axes.swY.type)).keys()"
              :class="classes('positioned')"
              :style="elementStyle(17, (getSwitchIndex(axes.swY) - index) * 30, 10, 10, 'inner')"
              :axis="axes.swY.type"
              :index="maybeInvertAxisIndex(axes.swY, index)"
          />
          <v-icon
              :class="classes('positioned')"
              :style="elementStyle(22, 0, 8)"
              size="4cqw"
          >mdi-minus</v-icon>
          <controlStalkAxisIcon
              :class="classes('positioned')"
              :style="elementStyle(28, 0, 8)"
              :axis="axes.swY.type"
          />
        </div>
      </div>

      <div v-if="axes.swX.type != 'unmapped'" class="stalk-group">
        <div
            :class="shadedClasses('switch-track')"
            :style="SwitchTrackStyle()"
        />
        <div
            :class="shadedClasses('switch-body')"
            :style="SwitchBodyStyle()"
        >
          <v-icon
              v-for="layer in getRenderLayers()"
              class="stalk-switch-body-icon"
              :style="getMarkingStyle(layer)"
              size="4cqw"
          >mdi-dots-vertical</v-icon>
          <div v-if="configuration.perfShadows" class="stalk-switch-grip"/>
        </div>
      </div>
      <div class="stalk-group">
        <div
            v-if="axes.swY.type != 'unmapped'"
            :class="shadedClasses('y-switch-seam')"
            :style="ySwitchSeamStyle"
        />
      </div>
      <div v-if="configuration.perfShadows" class="stalk-shadow"/>
    </div>
  </div>
</template>

<style scoped>

.stalk-container {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  container-type: inline-size;
  //background-color: #f0f;
}

.stalk-container-left {
  -webkit-mask-image: linear-gradient(100deg, #FFFF 92%, #0000 95%);
  mask-image: linear-gradient(95deg, #FFFF 92%, #0000 95%);
}

.stalk-container-right {
  -webkit-mask-image: linear-gradient(-80deg, #FFFF 92%, #0000 95%);
  mask-image: linear-gradient(-85deg, #FFFF 92%, #0000 95%);
}

.stalk-body {
  position: absolute;
  top: 50%;
  translate: 0 -50%;
  height: 23cqw;
  border-radius: 7.5cqw / 9cqw;
  transform-style: preserve-3d;
}

.stalk-body-left {
  left: 12cqw;
  right: -30cqw;
  transform-origin: right;
}

.stalk-body-right {
  left: -30cqw;
  right: 12cqw;
  transform-origin: left;
}

.stalk-group {
  transition: inherit;
  position: absolute;
  overflow: hidden;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}

.stalk-positioned {
  position: absolute;
  transition: inherit;
  display: flex;
  align-items: center;
}

.stalk-positioned-left {
  translate: -50% -50%;
}

.stalk-positioned-right {
  translate: 50% -50%;
}

.stalk-switch-track {
  position: absolute;
  transition: inherit;
  border-radius: 1cqw;
  background-color: #0004;
}

.stalk-switch-track-shaded {
  box-shadow: inset 0 0 2cqw #000;
}

.stalk-switch-track-left {
  translate: -50% -50%;
}

.stalk-switch-track-right {
  translate: 50% -50%;
}

.stalk-switch-body {
  position: absolute;
  transition: inherit;
  border-radius: 1cqw;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.stalk-switch-body-left {
  translate: -50% -50%;
}

.stalk-switch-body-right {
  translate: 50% -50%;
}

.stalk-switch-body-shaded {
  box-shadow: 0 0 1cqw #000;
}

.stalk-switch-body-unshaded {
  border: 0.2cqw solid #000;
}

.stalk-switch-body-icon {
  position: absolute;
  left: 50%;
  top: 50%;
  translate: -50% -50%;
}

.stalk-switch-grip {
  position: absolute;
  left: 0.5cqw;
  right: 0.5cqw;
  top: 0;
  bottom: 0;
  background: repeating-linear-gradient(to right, transparent, #0004, transparent 10%);
}

.stalk-shadow {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  border-radius: 7.5cqw / 9cqw;
  box-shadow: inset 0 -0.75cqw 3cqw #000;
  background: linear-gradient(to bottom, #0000, #0005, #0008);
  z-index: 1;
}

.stalk-y-switch-seam {
  position: absolute;
  top: -0.5cqw;
  bottom: -0.5cqw;
  transition: inherit;
  z-index: 1;
}

.stalk-y-switch-seam-shaded {
  border: #0008 0.5cqw solid;
  filter: drop-shadow(0 0 0.5cqw #000);
}

.stalk-y-switch-seam-unshaded {
  border: #000 0.2cqw solid;
}

.stalk-y-switch-seam-left {
  left: 20cqw;
  border-left: none;
  border-radius: 0 200% 200% 0 / 0 100% 100% 0;
}

.stalk-y-switch-seam-right {
  right: 20cqw;
  border-right: none;
  border-radius: 200% 0 0 200% / 100% 0 0 100%;
}

</style>