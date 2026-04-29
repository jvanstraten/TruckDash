<script setup lang="ts">
defineProps(["title", "subtitle"]);
</script>

<template>
  <v-dialog max-width="500">
    <template v-slot:activator="{ props: activatorProps }">
      <v-list-item
          :title="title"
          :subtitle="subtitle"
          v-bind="activatorProps"
      >
        <template v-slot:prepend>
          <v-icon>mdi-reload</v-icon>
        </template>
      </v-list-item>
    </template>
    <template v-slot:default="{ isActive }">
      <v-card :title="title">
        <v-card-text>
          Are you sure?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
              text="No, cancel"
              @click="isActive.value = false"
          ></v-btn>
          <v-btn
              text="Yes"
              @click="$emit('reset'); isActive.value = false"
          ></v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>
