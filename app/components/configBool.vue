<script setup lang="ts">
defineProps(["title", "subtitle", "enabled"]);
const model = defineModel();
</script>

<template>
  <v-list-item
      :title="title"
      :subtitle="subtitle"
      :active="false"
      :disabled="enabled === false"
      @click="model = !model"
  >
    <template v-slot:prepend>
      <v-icon v-if="enabled === false">mdi-checkbox-blank-off-outline</v-icon>
      <v-icon v-else-if="model">mdi-checkbox-intermediate</v-icon>
      <v-icon v-else>mdi-checkbox-blank-outline</v-icon>
    </template>
  </v-list-item>
</template>
