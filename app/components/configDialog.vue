<script setup lang="ts">
import configItem from "~/components/configItem.vue";
defineProps(["title", "subtitle", "text", "enabled", "value"]);
const emit = defineEmits(["activate"]);
const dialog = defineModel<boolean>();
</script>

<template>
  <configItem
      :title="title"
      :subtitle="subtitle"
      :enabled="enabled"
      :value="value"
      @activate="dialog = true; emit('activate')"
  >
    <template v-slot:prepend><slot name="prepend"/></template>
    <template v-slot:append><v-icon>mdi-dots-horizontal</v-icon></template>
  </configItem>
  <v-dialog max-width="470" v-model="dialog">
    <template v-slot:default="{ isActive }">
      <v-card :title="title" :text="text ? text : subtitle">
        <template v-slot:append>
          <v-btn icon="mdi-close" @click="isActive.value = false"/>
        </template>
        <slot :isActive="isActive"/>
      </v-card>
    </template>
  </v-dialog>
</template>
