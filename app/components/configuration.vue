<script setup lang="ts">

import { useGlobals } from "~/composables/globals";

const { configuration, gameState } = useGlobals();

const tab = ref('preferences');

</script>

<template>
  <v-sheet elevation="2">
    <v-tabs v-model="tab" color="primary">
      <v-tab value="preferences">Preferences</v-tab>
      <v-tab value="performance">Performance</v-tab>
      <v-tab value="theme">Theme</v-tab>
    </v-tabs>

    <v-divider></v-divider>

    <v-tabs-window v-model="tab">

      <v-tabs-window-item value="preferences">
        <v-list lines="two">
          <v-list-item
              title="Day/night cycle"
              subtitle="Whether the dashboard will try to follow the game's day/night cycle based on time and latitude."
          >
            <template v-slot:prepend>
              <v-list-item-action start>
                <v-checkbox-btn v-model="configuration.preferences.shading"/>
              </v-list-item-action>
            </template>
          </v-list-item>
          <v-list-item
              title="Timezones"
              subtitle="Whether timezones are enabled in the game. When enabled, the sun position in the game also depends on longitude, so we need to correct for that."
              :disabled="!configuration.preferences.shading"
          >
            <template v-slot:prepend>
              <v-list-item-action start>
                <v-checkbox-btn v-model="configuration.preferences.timezones"/>
              </v-list-item-action>
            </template>
          </v-list-item>
        </v-list>
      </v-tabs-window-item>

      <v-tabs-window-item value="performance">
        <v-list lines="two" select-strategy="leaf">
          <v-list-item
              title="Needle animations"
              subtitle="Whether needle movement is smoothed out."
          >
            <template v-slot:prepend>
              <v-list-item-action start>
                <v-checkbox-btn v-model="configuration.performance.animateNeedles"/>
              </v-list-item-action>
            </template>
          </v-list-item>
          <v-list-item
              title="Needle details"
              subtitle="Whether to add some extra visual details to the needles, to make them not look as flat."
          >
            <template v-slot:prepend>
              <v-list-item-action start>
                <v-checkbox-btn v-model="configuration.performance.needleDetails"/>
              </v-list-item-action>
            </template>
          </v-list-item>
          <v-list-item
              title="Indicator animations"
              subtitle="Whether to fade indicators in and out. Gives a lightbulb-like effect."
          >
            <template v-slot:prepend>
              <v-list-item-action start>
                <v-checkbox-btn v-model="configuration.performance.animateIndicators"/>
              </v-list-item-action>
            </template>
          </v-list-item>
          <v-list-item
              title="Bloom"
              subtitle="Whether to render a glow effect for things that emit light."
          >
            <template v-slot:prepend>
              <v-list-item-action start>
                <v-checkbox-btn v-model="configuration.performance.bloom"/>
              </v-list-item-action>
            </template>
          </v-list-item>
          <v-list-item
              title="Shadows"
              subtitle="Whether to render shadows of needles and the insets in the instrument cluster."
          >
            <template v-slot:prepend>
              <v-list-item-action start>
                <v-checkbox-btn v-model="configuration.performance.shadows"/>
              </v-list-item-action>
            </template>
          </v-list-item>
        </v-list>
      </v-tabs-window-item>

      <v-tabs-window-item value="theme">
        <v-sheet class="pa-5" color="brown">Three</v-sheet>
      </v-tabs-window-item>
    </v-tabs-window>
  </v-sheet>
</template>

<style scoped>

</style>