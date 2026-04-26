<script setup lang="ts">

import * as Icons from '@mdi/js';
export type MdiIconString = keyof typeof Icons;

defineProps<{
  icon: MdiIconString,
  size: string,
  color: "red" | "amber" | "green" | "blue" | "gray",
  active?: boolean,
}>();

</script>

<template>
  <span>
    <MdiIcon :icon="icon" :size="size" :class="['indicator-all', active ? 'indicator-' + color : 'indicator-off']"/>
  </span>
</template>

<style scoped>

.indicator-all {
  transition: color 0.1s;
  filter: drop-shadow(0px 0px 10px);
}

.indicator-off {
  color: #8881;
}

.indicator-red {
  color: #F00;
}

.indicator-amber {
  color: #FA0;
}

.indicator-green {
  color: #0F6;
}

.indicator-blue {
  color: #04F;
}

.indicator-gray {
  color: #CCC;
}

</style>