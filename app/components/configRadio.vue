<script setup lang="ts">
import configItem from "~/components/configItem.vue";
defineProps(["title", "subtitle", "value", "joiner"]);
const model = defineModel();
</script>

<template>
  <configItem
      :title="title"
      :subtitle="subtitle"
      @activate="model = value"
  >
    <template v-slot:prepend>
      <div v-if="joiner" :class="['radio-joiner', 'radio-joiner-' + joiner]"/>
      <v-icon>mdi-radiobox-{{model == value ? 'marked' : 'blank'}}</v-icon>
    </template>
  </configItem>
</template>

<style scoped>
.radio-joiner {
  position: absolute;
  width: 1.5em;
  background-color: #FFF1;
}

.radio-joiner-first {
  top: calc(50% - 0.75em);
  bottom: 0;
  border-radius: 0.75em 0.75em 0 0;
}

.radio-joiner-middle {
  top: 0;
  bottom: 0;
}

.radio-joiner-last {
  top: 0;
  bottom: calc(50% - 0.75em);
  border-radius: 0 0 0.75em 0.75em;
}
</style>