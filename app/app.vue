<script setup lang="ts">

import { useFullscreen } from '@vueuse/core'
import dashboard from "~/components/dashboard.vue";

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

</script>

<template>
  <dashboard @click="toggleFullscreen" />
</template>

<style>
body {
  margin: 0;
  background-color: #000;
}
</style>

<style scoped>

</style>