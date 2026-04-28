<script setup lang="ts">

import { useFullscreen } from '@vueuse/core'
import instrumentCluster from "~/components/instrumentCluster.vue";
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

const mounted = ref(false);
onMounted(() => {
  mounted.value = true;
});

</script>

<template>
  <v-app v-if="mounted">
    <instrumentCluster/>
    <configuration/>
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
