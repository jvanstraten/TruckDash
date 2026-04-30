<script setup lang="ts">
import configDialog from "~/components/configDialog.vue";
defineProps(["title", "subtitle", "enabled"]);
const model = defineModel<string>();
</script>

<template>
  <configDialog
      :title="title"
      :subtitle="subtitle"
      :enabled="enabled"
  >
    <template v-slot:prepend><v-icon :color="model">mdi-checkbox-blank</v-icon></template>
    <template v-slot:default="{ isActive }">
      <v-card-text>
        <v-color-picker
            v-model="model"
            width="100%"
            elevation="0"
        ></v-color-picker>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
            text="Close"
            @click="isActive.value = false"
        ></v-btn>
      </v-card-actions>
    </template>
  </configDialog>
</template>
