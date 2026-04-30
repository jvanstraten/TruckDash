<script setup lang="ts">
import configItem from "~/components/configItem.vue";
defineProps(["title", "subtitle", "value"]);
const model = defineModel();
</script>

<template>
  <configItem
      :title="title"
      :subtitle="subtitle"
      @activate="model = value"
  >
    <template v-slot:prepend>
      <v-icon v-if="model == value">mdi-radiobox-marked</v-icon>
      <v-icon v-else>mdi-radiobox-blank</v-icon>
    </template>
  </configItem>
</template>
