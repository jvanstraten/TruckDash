<script setup lang="ts">

import { useFullscreen } from '@vueuse/core'
import workspace from "~/components/workspace.vue";
import configuration from "~/components/configuration.vue";

const fullscreen = useFullscreen()
let wakeLock: WakeLockSentinel | null = null;

async function toggleFullscreen() {
  if (fullscreen.isFullscreen.value) {
    await fullscreen.exit();
    if (wakeLock !== null) {
      await wakeLock.release();
      wakeLock = null;
    }
  } else {
    await fullscreen.enter();

    // Not that this is gonna work, because clearly it's NoT sAfE to keep a
    // screen on UNLESS the javascript requesting it was encrypted with a key
    // that has the seal of approval from a hostile foreign government's
    // certificate authority. See also:
    // https://www.youtube.com/watch?v=M1si1y5lvkk
    if (navigator && "wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
    }
  }
}

function github() {
  window.location.href = 'https://www.github.com/jvanstraten/TruckDash/';
}

const mounted = ref(false);
const menu = ref("main");
const adjust = ref(false);

onMounted(() => {
  mounted.value = true;
});

</script>

<template>
  <v-app v-if="mounted">
    <!--<iframe :src="nav" width="300" height="300"/-->
    <v-dialog max-width="600">
      <template v-slot:activator="{ props: activatorProps }">
        <workspace v-model="adjust" v-bind="activatorProps"/>
      </template>
      <template v-slot:default="{ isActive }">
        <v-card v-if="menu == 'main'" title="TruckDash" subtitle="Main menu">
          <template v-slot:append>
            <v-btn
                icon="mdi-close"
                @click="isActive.value = false"
            ></v-btn>
          </template>
          <v-list lines="two" select-strategy="leaf">
            <v-list-item
                :title="fullscreen.isFullscreen.value ? 'Exit full screen' : 'Go full screen'"
                :active="false"
                @click="toggleFullscreen(); isActive.value = false"
            >
              <template v-slot:prepend>
                <v-icon>{{ fullscreen.isFullscreen.value ? 'mdi-fullscreen-exit' : 'mdi-fullscreen' }}</v-icon>
              </template>
            </v-list-item>
            <v-list-item
                title="Configuration"
                :active="false"
                @click="menu = 'config'"
            >
              <template v-slot:prepend>
                <v-icon>mdi-cog-outline</v-icon>
              </template>
            </v-list-item>
            <v-list-item
                title="Go to GitHub page"
                :active="false"
                @click="github"
            >
              <template v-slot:prepend>
                <v-icon>mdi-information-outline</v-icon>
              </template>
            </v-list-item>
            <v-list-item
                title="Return"
                :active="false"
                @click="isActive.value = false"
            >
              <template v-slot:prepend>
                <v-icon>mdi-arrow-left</v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-card>

        <v-card v-if="menu == 'config'" title="Configuration">
          <template v-slot:append>
            <v-btn
                icon="mdi-check"
                @click="menu = 'main'"
            ></v-btn>
          </template>
          <v-card-text>
            <configuration @adjust="adjust = true; isActive.value = false"/>
          </v-card-text>
        </v-card>

      </template>
    </v-dialog>
  </v-app>
  <v-app v-else>
    <v-container fluid>
      <v-row>
        <v-col>
          <v-sheet
              class="d-flex align-center justify-center flex-wrap text-center mx-auto px-4"
              elevation="2" height="100" width="200" rounded>
            Loading...
            <v-progress-linear color="primary" indeterminate></v-progress-linear>
          </v-sheet>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<style>
body, html {
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  overflow: hidden;
  height: 100vh;
  margin: 0;
}
</style>