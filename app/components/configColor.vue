<script setup lang="ts">
defineProps(["title", "subtitle", "enabled"]);
const model = defineModel<string>();
</script>

<template>
  <v-dialog max-width="350">
    <template v-slot:activator="{ props: activatorProps }">
      <v-list-item
          :title="title"
          :subtitle="subtitle"
          :active="false"
          :disabled="enabled === false"
          v-bind="activatorProps"
      >
        <template v-slot:prepend>
          <v-icon :color="model">mdi-checkbox-blank</v-icon>
        </template>
      </v-list-item>
    </template>
    <template v-slot:default="{ isActive }">
      <v-card :title="title">
        <v-card-text>
          <v-color-picker
              v-model="model"
          ></v-color-picker>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
              text="Close"
              @click="isActive.value = false"
          ></v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>


</template>
