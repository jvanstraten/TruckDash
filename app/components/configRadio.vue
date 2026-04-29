<script setup lang="ts">
defineProps(["title", "subtitle", "value"]);
const model = defineModel();
</script>

<template>
  <v-list-item
      :title="title"
      :subtitle="subtitle"
      :active="false"
      @click="model = value"
  >
    <template v-slot:prepend>
      <v-icon v-if="model == value">mdi-radiobox-marked</v-icon>
      <v-icon v-else>mdi-radiobox-blank</v-icon>
    </template>
  </v-list-item>
</template>
