<script setup lang="ts">

import {configDefaults, useGlobals} from "~/composables/globals";
import configBool from "~/components/configBool.vue";
import configRadio from "~/components/configRadio.vue";
import configColor from "~/components/configColor.vue";
import configDisplay from "~/components/configDisplay.vue";
import type { UiPosition } from "~/types/globals";
const { configuration } = useGlobals();

const tab = ref('layout');

type DefaultLayoutData = {
  title: string,
  subtitle: string,
  instrumentsPosition?: UiPosition;
  display1Position?: UiPosition;
  display2Position?: UiPosition;
};

const defaultLayouts: DefaultLayoutData[] = [
  {
    title: "Instruments",
    subtitle: "Loads the default layout, with just the instrument cluster.",
    instrumentsPosition: { x1: 0.0, y1: 0.0, x2: 1.0, y2: 1.0,},
  },
];

function loadLayout(layout: DefaultLayoutData) {
  configuration.value.layoutInstrumentsEnabled = layout.instrumentsPosition !== undefined;
  Object.assign(configuration.value.layoutInstrumentsPosition, layout.instrumentsPosition);
  configuration.value.layoutDisplay1Address = "";
  configuration.value.layoutDisplay2Address = "";
}

function resetAll() {
  Object.keys(configDefaults).forEach(key => {
    (configuration.value as any)[key] = (configDefaults as any)[key];
  });
}

function resetTheme() {
  Object.keys(configDefaults).forEach(key => {
    if (key.startsWith("theme")) {
      (configuration.value as any)[key] = (configDefaults as any)[key];
    }
  });
}

</script>

<template>
    <v-tabs v-model="tab" color="primary">
      <v-tab value="layout">Layout</v-tab>
      <v-tab value="preferences">Preferences</v-tab>
      <v-tab value="performance">Performance</v-tab>
      <v-tab value="theme">Theme</v-tab>
    </v-tabs>

    <v-divider></v-divider>

    <v-tabs-window v-model="tab">

      <v-tabs-window-item value="preferences">
        <v-list lines="two" active-strategy="leaf" activatable>

          <v-list-subheader>Lighting</v-list-subheader>
          <configBool
              title="Follow day/night cycle"
              subtitle="Whether the dashboard will try to follow the game's day/night cycle based on time and latitude."
              v-model="configuration.prefShading"
          />
          <configBool
              title="Timezones"
              subtitle="Whether timezones are enabled in the game. When enabled, the sun position in the game also depends on longitude, so we need to correct for that."
              :enabled="configuration.prefShading"
              v-model="configuration.prefTimezones"
          />

          <v-list-subheader>Instrument behavior</v-list-subheader>
          <configBool
              title="Enable indicator self-test"
              subtitle="Whether to simulate a self-test for the indicators when you power up your truck. If disabled, all indicators follow telemetry immediately."
              v-model="configuration.prefSelfTest"
          />
          <configBool
              title="12-hour clock"
              subtitle="The clock shows 12-hour time. Note that am/pm cannot be shown."
              v-model="configuration.prefClock12"
          />

          <v-list-subheader>Gear/cruise display</v-list-subheader>
          <configRadio
              title="Mixed (km/h)"
              subtitle="When cruise control is enabled, the gear/cruise display shows the cruise control speed in km/h. Otherwise, it shows the current gear."
              v-model="configuration.prefGearCruiseMode"
              value="mixed-kmh"
          />
          <configRadio
              title="Mixed (mph)"
              subtitle="When cruise control is enabled, the gear/cruise display shows the cruise control speed in mph. Otherwise, it shows the current gear."
              v-model="configuration.prefGearCruiseMode"
              value="mixed-mph"
          />
          <configRadio
              title="Gear"
              subtitle="The gear/cruise display always shows the current gear."
              v-model="configuration.prefGearCruiseMode"
              value="gear"
          />
          <configRadio
              title="Speed (km/h)"
              subtitle="Instead of gear or cruise control speed, the gear/cruise display shows the current speed in km/h."
              v-model="configuration.prefGearCruiseMode"
              value="speed-kmh"
          />
          <configRadio
              title="Speed (mph)"
              subtitle="Instead of gear or cruise control speed, the gear/cruise display shows the current speed in mph."
              v-model="configuration.prefGearCruiseMode"
              value="speed-mph"
          />

          <v-list-subheader>Embedded app display behavior</v-list-subheader>
          <configBool
              title="Power-up animation"
              subtitle="Simulates slow-ish start-up of an operating system running on the display."
              :enabled="configuration.layoutDisplay1Address != '' || configuration.layoutDisplay2Address != ''"
              v-model="configuration.prefDisplayStartup"
          />
          <configBool
              title="Auto power-up/power-down"
              subtitle="Displays turn on and off automatically when you power your truck on and off. You can always override."
              :enabled="configuration.layoutDisplay1Address != '' || configuration.layoutDisplay2Address != ''"
              v-model="configuration.prefDisplayFollowsTruck"
          />
          <configBool
              title="Auto power-down does not refresh"
              subtitle="Note that manual power-cycling of a display always reloads the embedded web page."
              :enabled="(configuration.layoutDisplay1Address != '' || configuration.layoutDisplay2Address != '') && configuration.prefDisplayFollowsTruck"
              v-model="configuration.prefDisplayStandby"
          />

          <v-list-subheader>Reset</v-list-subheader>
          <configReset
              title="Load default settings"
              subtitle="Click to load default settings for everything."
              @reset="resetAll"
          />

        </v-list>
      </v-tabs-window-item>

      <v-tabs-window-item value="layout">
        <v-list lines="two" active-strategy="leaf" activatable>

          <v-list-subheader>Presets</v-list-subheader>
          <configReset
              v-for="layout in defaultLayouts"
              :title=layout.title
              :subtitle=layout.subtitle
              @reset="loadLayout(layout)"
          />

          <v-list-subheader>Customize</v-list-subheader>
          <configBool
              title="Instrument cluster"
              subtitle="Enables the instrument cluster component."
              v-model="configuration.layoutInstrumentsEnabled"
          />
          <configDisplay
              :title="'Display A'"
              subtitle="Nests a web app from another mod like TruckDash into the page, as if it's an infotainment display."
              v-model="configuration.layoutDisplay1Address"
          />
          <configDisplay
              :title="'Display B'"
              subtitle="One nested web app not enough? Have a second one!"
              v-model="configuration.layoutDisplay2Address"
          />
          <v-list-item
              title="Adjust"
              subtitle="Adjust the positioning of the components activated above."
              :active="false"
              @click="$emit('adjust')"
          >
            <template v-slot:prepend>
              <v-icon>mdi-cursor-move</v-icon>
            </template>
          </v-list-item>

        </v-list>
      </v-tabs-window-item>

      <v-tabs-window-item value="performance">
        <v-list lines="two" select-strategy="leaf">

          <v-list-subheader>Telemetry update rate</v-list-subheader>
          <configRadio
              title="No limit"
              subtitle="The game sends telemetry for every frame it renders."
              v-model="configuration.perfTelemetryThrottle"
              value="0"
          />
          <configRadio
              title="60fps"
              subtitle="Telemetry updates are sent at most every 16ms."
              v-model="configuration.perfTelemetryThrottle"
              value="16"
          />
          <configRadio
              title="30fps"
              subtitle="Telemetry updates are sent at most every 33ms."
              v-model="configuration.perfTelemetryThrottle"
              value="33"
          />
          <configRadio
              title="10fps"
              subtitle="Telemetry updates are sent at most every 100ms."
              v-model="configuration.perfTelemetryThrottle"
              value="100"
          />
          <configRadio
              title="5fps"
              subtitle="Telemetry updates are sent at most every 200ms."
              v-model="configuration.perfTelemetryThrottle"
              value="200"
          />
          <configRadio
              title="2fps"
              subtitle="Telemetry updates are sent at most every 500ms."
              v-model="configuration.perfTelemetryThrottle"
              value="500"
          />

          <v-list-subheader>Effects</v-list-subheader>
          <configBool
              title="Needle animations"
              subtitle="Whether needle movement is smoothed out."
              v-model="configuration.perfAnimateNeedles"
          />
          <configBool
              title="Needle details"
              subtitle="Whether to add some extra visual details to the needles, to make them not look as flat."
              v-model="configuration.perfNeedleDetails"
          />
          <configBool
              title="Indicator animations"
              subtitle="Whether to fade indicators in and out. Gives a lightbulb-like effect."
              v-model="configuration.perfAnimateIndicators"
          />
          <configBool
              title="Bloom"
              subtitle="Whether to render a glow effect for things that emit light."
              v-model="configuration.perfBloom"
          />
          <configBool
              title="Shadows"
              subtitle="Whether to render shadows of needles and the insets in the instrument cluster."
              v-model="configuration.perfShadows"
          />
        </v-list>
      </v-tabs-window-item>

      <v-tabs-window-item value="theme">
        <v-list lines="two" select-strategy="leaf">

          <v-list-subheader>Diffuse</v-list-subheader>
          <configColor
              title="Background"
              subtitle="Dashboard background color when fully lit by ambient light."
              v-model="configuration.themeBackground"
          />
          <configColor
              title="Primary"
              subtitle="Primary color for markings."
              v-model="configuration.themePrimary"
          />
          <configColor
              title="Secondary"
              subtitle="Secondary color for markings, used for out-of-range values and ticks."
              v-model="configuration.themeSecondary"
          />
          <configColor
              title="Needles"
              subtitle="Fill color for the needles."
              v-model="configuration.themeNeedle"
          />
          <configColor
              title="Needle stroke"
              subtitle="Stroke color for the needles when needle details are enabled."
              v-model="configuration.themeNeedleStroke"
          />
          <configColor
              title="Segments"
              subtitle="Color and transparency used for indicators and display segments that are off."
              v-model="configuration.themeSegments"
          />

          <v-list-subheader>Emission</v-list-subheader>
          <configColor
              title="Backlight"
              subtitle="Backlight color. Mixed with the primary and secondary color for markings."
              v-model="configuration.themeBacklight"
          />
          <configColor
              title="Needle backlight"
              subtitle="Backlight color for the needles. Mixed with their diffuse color."
              v-model="configuration.themeNeedleBacklight"
          />
          <configColor
              title="Display"
              subtitle="Emission color for displays."
              v-model="configuration.themeDisplay"
          />
          <configColor
              title="Red indicators"
              subtitle="Emission color for red indicators."
              v-model="configuration.themeIndicatorRed"
          />
          <configColor
              title="Amber indicators"
              subtitle="Emission color for amber indicators."
              v-model="configuration.themeIndicatorAmber"
          />
          <configColor
              title="Green indicators"
              subtitle="Emission color for green indicators."
              v-model="configuration.themeIndicatorGreen"
          />
          <configColor
              title="Blue indicators"
              subtitle="Emission color for blue indicators."
              v-model="configuration.themeIndicatorBlue"
          />

          <v-list-subheader>Misc</v-list-subheader>
          <configBool
              title="Workspace follows background"
              subtitle="Whether the color used between UI components in the layout follows the (shaded) dashboard background color."
              v-model="configuration.themeWorkspaceFollowsBackground"
          />
          <configColor
              title="Workspace"
              subtitle="The color to use between UI components."
              :enabled="!configuration.themeWorkspaceFollowsBackground"
              v-model="configuration.themeWorkspace"
          />

          <v-list-subheader>Reset</v-list-subheader>
          <configReset
              title="Load default theme"
              subtitle="Click to load default theme data."
              @reset="resetTheme"
          />

        </v-list>
      </v-tabs-window-item>
    </v-tabs-window>
</template>

<style scoped>

</style>