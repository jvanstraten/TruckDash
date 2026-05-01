<script setup lang="ts">
import configDialog from "~/components/configDialog.vue";
defineProps(["title", "subtitle"]);
const emit = defineEmits(["reset"]);
</script>

<template>
  <configDialog
      :title="title"
      :subtitle="subtitle"
      text="Are you sure?"
  >
    <template v-slot:prepend>
      <v-icon>mdi-reload</v-icon>
    </template>
    <template v-slot:default="{ isActive }">
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
            text="No, cancel"
            @click="isActive.value = false"
        ></v-btn>
        <v-btn
            text="Yes"
            @click="emit('reset'); isActive.value = false"
        ></v-btn>
      </v-card-actions>
    </template>
  </configDialog>
</template>
