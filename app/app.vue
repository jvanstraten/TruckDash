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

const mounted = ref<boolean>(false);
const menuOpen = ref<boolean>(false);
const currentMenu = ref<"main" | "config">("main");
const adjust = ref<boolean>(false);
const mapping = ref<boolean>(false);

onMounted(() => {
  mounted.value = true;
});

function openMenu() {
  if (adjust.value) {
    adjust.value = false;
    return;
  }
  if (mapping.value) {
    mapping.value = false;
    currentMenu.value = "config";
    menuOpen.value = true;
    return;
  }
  currentMenu.value = "main";
  menuOpen.value = true;
}

</script>

<template>
  <v-app v-if="mounted">
    <workspace :adjust="adjust" :mapping="mapping" @menu="openMenu"/>
    <v-dialog max-width="600" height="100%" v-model="menuOpen">
      <template v-slot:default="{ isActive }">
        <v-card v-if="currentMenu == 'main'" title="TruckDash" subtitle="Main menu">
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
                @click="currentMenu = 'config'"
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
                <v-icon>mdi-source-branch</v-icon>
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

        <v-card v-if="currentMenu == 'config'" title="TruckDash" subtitle="Configuration">
          <template v-slot:append>
            <v-btn icon="mdi-arrow-left" @click="currentMenu = 'main'"/>
          </template>
          <v-card-text>
            <configuration
                @adjust="adjust = true; isActive.value = false"
                @mapping="mapping = true; isActive.value = false"
            />
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