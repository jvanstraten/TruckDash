<script setup lang="ts">

import {validateDisplayUrl} from "~/misc/displayUrl";
import type { Shading } from "~/composables/shading";
import type { ConfigurationData } from "~/composables/configuration";
import type { GameState } from "~/composables/game";

const {
  address,
  zoom,
  configuration,
  gameState,
  shading,
} = defineProps<{
  address: string,
  zoom: number,
  configuration: ConfigurationData,
  gameState: GameState,
  shading: Shading,
}>();

const validatedUrl = computed(() => validateDisplayUrl(address));

//-----------------------------------------------------------------------------
// Power-up animation
//-----------------------------------------------------------------------------

const powerState = ref(0);
const powerStateOff = 0.0;
const powerStateStandby = 0.1;
const powerStateLightOn = 0.2;
const powerStateOn = 5.0;

let timer: number | undefined;

function stopTimer() {
  if (timer !== undefined) {
    window.clearTimeout(timer);
    timer = undefined;
  }
}

function handleStartup() {
  powerState.value += Math.pow(Math.random(), 2);
  if (powerState.value < powerStateOn) {
    timer = window.setTimeout(() => handleStartup(), Math.pow(Math.random(), 2) * 500 + 150);
  }
}

function powerUp() {
  stopTimer();
  if (configuration.instrDisplayStartup) {
    powerState.value = powerStateLightOn;
    handleStartup();
  } else {
    powerState.value = powerStateOn;
  }
}

function powerDown(keepIframeLoaded: boolean) {
  stopTimer();
  if (keepIframeLoaded) {
    powerState.value = powerStateStandby;
  } else {
    powerState.value = powerStateOff;
  }
}

function togglePower() {
  if (powerState.value > powerStateOff) {
    powerDown(false);
  } else {
    powerUp();
  }
}

const prevElectricEnabled = ref<boolean>(false);

watch(gameState.unpaused.electric, (a, b) => {
  const electricEnabled = gameState.unpaused.electric.enabled == true;
  if (configuration.instrDisplayFollowsTruck) {
    if (electricEnabled && !prevElectricEnabled.value) {
      if (powerState.value <= powerStateStandby) {
        powerUp();
      } else {
        stopTimer();
      }
    } else if (!electricEnabled && prevElectricEnabled.value) {
      timer = window.setTimeout(() => powerDown(configuration.instrDisplayStandby), 800);
    }
  }
  prevElectricEnabled.value = electricEnabled;
});

onUnmounted(() => stopTimer());

//-----------------------------------------------------------------------------
// Size and scale
//-----------------------------------------------------------------------------

const iframeStyle = ref({});
const el = useTemplateRef("lcd");
let lcdWidth = 0;
let lcdHeight = 0;

function updateSize() {
  const aspect = lcdWidth / lcdHeight;
  const width = window.innerWidth / Math.pow(2, zoom);
  const height = width / aspect;
  const scale = lcdWidth / width;

  iframeStyle.value = {
    width: `${width}px`,
    height: `${height}px`,
    zoom: `${scale}`,
  };
}

// ?????
const zoomLocal = computed(() => zoom);
watch(zoomLocal, () => updateSize());

const resizeObserver = new ResizeObserver((entries) => {
  const entry = entries[0]!;
  lcdWidth = entry.contentRect.width;
  lcdHeight = entry.contentRect.height;
  updateSize();
});

onMounted(() => {
  resizeObserver.observe(el.value!);
});
onUnmounted(() => {
  resizeObserver.disconnect();
});

</script>

<template>
  <div :class="['display-bezel', configuration.perfOcclusion ? 'display-bezel-shaded' : '']" :style="{'background-color': shading.background}">
    <div class="display-lcd-outer">
      <div class="display-lcd-inner" ref="lcd">
        <iframe
            class="display-iframe"
            :style="iframeStyle"
            v-if="validatedUrl.valid && powerState >= powerStateStandby"
            :src="validatedUrl.url!.toString()"
        />
        <div
            class="display-lcd"
            :style="{'background-color': powerState >= 0.5 ? '#111' : '#000'}"
            v-if="powerState >= powerStateStandby && powerState < powerStateOn"
        >
          <div
              class="display-loader"
              v-if="powerState >= 1 && powerState < 4.8"
          >
            <v-icon size="10cqw" color="#CF8">mdi-truck-fast-outline</v-icon>
            <v-progress-linear :model-value="(powerState - 1.5) * 34" height="20cqw" color="#8C0"></v-progress-linear>
          </div>
        </div>
      </div>
    </div>
    <div
        :class="['display-power-outer', configuration.perfOcclusion ? 'display-power-outer-shaded' : '']"
        @pointerup.stop.prevent="togglePower()" @pointermove.stop @pointerdown.stop
    >
      <div
          :class="['display-power-inner', configuration.perfOcclusion ? ' display-power-inner-shaded' : '']"
          :style="shading.divIndicator[powerState < powerStateOn ? 'amber' : 'green'][powerState >= powerStateLightOn ? 'on' : 'off']"
      />
    </div>
  </div>
</template>

<style scoped>

.display-bezel {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  border-radius: 4cqw;
  border: 0.2cqw solid #000;
}

.display-bezel-shaded {
  box-shadow: inset 0 0 0.5cqw #000;
  filter: drop-shadow(0 0 1vw #000);
  border: none !important;
}

.display-power-outer {
  position: absolute;
  right: 3cqw;
  width: 11cqw;
  bottom: 0;
  height: 5cqw;
  padding: 2cqw;
  border-radius: 1cqw 1cqw 0 0;
  border: 0.2cqw solid #000;
  border-bottom: none;
}

.display-power-outer-shaded {
  box-shadow: inset 0 0 0.5cqw #000;
  border: none !important;
}

.display-power-inner {
  position: absolute;
  left: 2.4cqw;
  top: 1.4cqw;
  right: 2.4cqw;
  bottom: 2.4cqw;
  border-radius: 0.5cqw;
  border: 0.1cqw solid #000;
  /* Hack for glow effect size: */
  font-size: 1cqw;
}

.display-power-inner-shaded {
  box-shadow: 0 0 0.3cqw #000;
}

.display-lcd-outer {
  position: absolute;
  left: 2cqw;
  top: 2cqw;
  right: 2cqw;
  bottom: 6cqw;
  background-color: #000;
  border-radius: 2cqw;
}

.display-lcd-inner {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  margin: 1cqw;
}

.display-loader {
  position: absolute;
  top: 30%;
  left: 30%;
  right: 30%;
  display: flow;
  text-align: center;
}

.display-iframe {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0 0;
  border: none;
}

.display-lcd {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}

</style>