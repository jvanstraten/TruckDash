<script setup lang="ts">

defineProps<{
  text: string,
  pattern: string,
  type: "7seg" | "14seg",
  size: string,
  color: "red" | "amber" | "green" | "blue" | "gray",
}>();

</script>

<template>
  <span :class="['display-parent', 'display-' + type]" :style="{'font-size': size}">
    <span class="display-off">{{ pattern }}</span>
    <span :class="'display-' + color">{{ text }}</span>
  </span>
</template>

<style scoped>

.display-7seg {
  font-family: "DSEG7 Classic Mini", monospace;
}

.display-14seg {
  font-family: "DSEG14 Classic Mini", monospace;
}

.display-parent {
  font-style: italic;
  display: inline-grid;
}

.display-parent span {
  grid-column: 1;
  grid-row: 1;
}

.display-off {
  color: #8881;
}

.display-red {
  color: #F00;
  filter: drop-shadow(0px 0px 5px);
}

.display-amber {
  color: #FA0;
  filter: drop-shadow(0px 0px 5px);
}

.display-green {
  color: #0F6;
  filter: drop-shadow(0px 0px 5px);
}

.display-blue {
  color: #04F;
  filter: drop-shadow(0px 0px 5px);
}

.display-gray {
  color: #CCC;
  filter: drop-shadow(0px 0px 5px);
}

</style>