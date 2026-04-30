<script setup lang="ts">
import configItem from "~/components/configItem.vue";
defineProps(["title", "subtitle", "enabled"]);
const model = defineModel();
</script>

<template>
  <configItem
      :title="title"
      :subtitle="subtitle"
      :enabled="enabled"
      @activate="model = !model"
  >
    <template v-slot:prepend>
      <v-icon v-if="enabled === false">mdi-checkbox-blank-off-outline</v-icon>
      <v-icon v-else-if="model">mdi-checkbox-intermediate</v-icon>
      <v-icon v-else>mdi-checkbox-blank-outline</v-icon>
    </template>
  </configItem>
</template>
