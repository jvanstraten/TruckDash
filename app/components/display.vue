<script setup lang="ts">

import {validateDisplayUrl} from "~/misc/displayUrl";
import type { Shading } from "~/types/shading";
import type { ConfigurationData, GameState} from "~/types/globals";

const {
  address,
  configuration,
  gameState,
  shading,
} = defineProps<{
  address: string,
  configuration: ConfigurationData,
  gameState: GameState,
  shading: Shading,
}>();

const validatedUrl = computed(() => validateDisplayUrl(address));

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
  if (configuration.prefDisplayStartup) {
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
  if (configuration.prefDisplayFollowsTruck) {
    if (electricEnabled && !prevElectricEnabled.value) {
      if (powerState.value <= powerStateStandby) {
        powerUp();
      } else {
        stopTimer();
      }
    } else if (!electricEnabled && prevElectricEnabled.value) {
      timer = window.setTimeout(() => powerDown(configuration.prefDisplayStandby), 800);
    }
  }
  prevElectricEnabled.value = electricEnabled;
});

onUnmounted(() => stopTimer());

</script>

<template>
  <div class="display-bezel" :style="{'background-color': shading.background}">
    <div class="display-lcd-outer">
      <div class="display-lcd-inner">
        <iframe
            class="display-lcd display-iframe"
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
    <div class="display-power-outer" @click.stop.prevent="togglePower()">
      <div class="display-power-inner" :style="shading.divIndicator[powerState < powerStateOn ? 'amber' : 'green'][powerState >= powerStateLightOn ? 'on' : 'off']"/>
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
  box-shadow: inset 0 0 0.5cqw #000;
}

.display-power-outer {
  position: absolute;
  right: 3cqw;
  width: 11cqw;
  bottom: 0;
  height: 5cqw;
  padding: 2cqw;
  border-radius: 1cqw 1cqw 0 0;
  box-shadow: inset 0 0 0.5cqw #000;
}

.display-power-inner {
  position: absolute;
  left: 2.5cqw;
  top: 1.5cqw;
  right: 2.5cqw;
  bottom: 2.5cqw;
  border-radius: 0.5cqw;
  box-shadow: 0 0 0.3cqw #000;
  /* Hack for glow effect size: */
  font-size: 1cqw;
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