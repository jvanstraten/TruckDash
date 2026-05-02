<script setup lang="ts">

import configItem from "~/components/configItem.vue";
import configDialog from "~/components/configDialog.vue";
import configBool from "~/components/configBool.vue";
import configRadio from "~/components/configRadio.vue";
import configColor from "~/components/configColor.vue";
import configDisplay from "~/components/configDisplay.vue";

import { useConfiguration } from "~/composables/configuration";
import { useStalkMap } from "~/composables/stalkMap";
import { useGestureControls } from "~/composables/gestureControls";

const {
  configuration,
  defaultLayouts,
  loadLayout,
  loadDefaults,
  loadFromFile,
  saveToFile
} = useConfiguration();

const stalkMap = useStalkMap(configuration);
const { gestureMapping } = useGestureControls(configuration, stalkMap);


const emit = defineEmits(["adjust", "mapping"]);

const tab = ref('general');
const chosenFile = ref();

</script>

<template>
  <v-tabs v-model="tab" color="primary" grow>
    <v-tab value="general" min-width="0px"><v-icon>mdi-cog</v-icon></v-tab>
    <v-tab value="layout" min-width="0px"><v-icon>mdi-page-layout-header-footer</v-icon></v-tab>
    <v-tab value="stalks" min-width="0px"><v-icon>mdi-gamepad</v-icon></v-tab>
    <v-tab value="instruments" min-width="0px"><v-icon>mdi-gauge</v-icon></v-tab>
    <v-tab value="performance" min-width="0px"><v-icon>mdi-fast-forward</v-icon></v-tab>
    <v-tab value="theme" min-width="0px"><v-icon>mdi-palette-outline</v-icon></v-tab>
  </v-tabs>

  <v-divider></v-divider>

  <v-tabs-window v-model="tab">

    <v-tabs-window-item value="general">
      <v-list lines="one">
        <v-list-item disabled>General settings</v-list-item>

        <v-list-subheader>Shading</v-list-subheader>
        <configBool
            title="Follow day/night cycle"
            subtitle="Whether instruments will be shaded based on the game's day/night cycle. Light levels are guestimated from time and X coordinate and may be off slightly."
            v-model="configuration.prefShading"
        />
        <configBool
            title="Timezones"
            subtitle="Whether timezones are enabled in the game. When enabled, the sun position in the game also depends on longitude, so we need to correct for that."
            :enabled="configuration.prefShading"
            v-model="configuration.prefTimezones"
        />

        <v-list-subheader>Speed display (digital only)</v-list-subheader>
        <configRadio
            title="Kilometers per hour"
            subtitle="The digital speed displays show speed in kilometers per hour."
            v-model="configuration.prefSpeedUnit"
            joiner="first"
            value="kmh"
        />
        <configRadio
            title="Miles per hour"
            subtitle="The digital speed displays show speed in miles per hour."
            v-model="configuration.prefSpeedUnit"
            joiner="last"
            value="mph"
        />

        <v-list-subheader>Time display</v-list-subheader>
        <configRadio
            title="24-hour"
            subtitle="The clock shows 24-hour time (aka military time)."
            v-model="configuration.prefClock12"
            joiner="first"
            :value="false"
        />
        <configRadio
            title="12-hour am/pm"
            subtitle="The clock shows 12-hour time with am/pm notation."
            v-model="configuration.prefClock12"
            joiner="last"
            :value="true"
        />

        <v-list-subheader>More</v-list-subheader>
        <configItem
            title="Layout"
            subtitle="Configure which layout elements are present on your screen and where."
            @activate="tab = 'layout'"
        >
          <template v-slot:prepend><v-icon>mdi-page-layout-header-footer</v-icon></template>
          <template v-slot:append><v-icon>mdi-dots-horizontal</v-icon></template>
        </configItem>
        <configItem
            title="Control stalks &amp; gestures"
            subtitle="Use TruckDash to control your truck with swipe gestures! Real vehicles have control stalks, but unless you have a full sim setup, you probably don't for the game. TruckDash tries to emulate control stalks using swipe gesture controls."
            @activate="tab = 'stalks'"
        >
          <template v-slot:prepend><v-icon>mdi-gamepad</v-icon></template>
          <template v-slot:append><v-icon>mdi-dots-horizontal</v-icon></template>
        </configItem>
        <configItem
            title="Instrument behavior"
            subtitle="Configure the behavior of the instrument cluster to your liking."
            @activate="tab = 'instruments'"
        >
          <template v-slot:prepend><v-icon>mdi-gauge</v-icon></template>
          <template v-slot:append><v-icon>mdi-dots-horizontal</v-icon></template>
        </configItem>
        <configItem
            title="Performance settings"
            subtitle="Issues with stuttering on (old) mobile devices? Reduce update rates and expensive-ish visuals here."
            @activate="tab = 'performance'"
        >
          <template v-slot:prepend><v-icon>mdi-fast-forward</v-icon></template>
          <template v-slot:append><v-icon>mdi-dots-horizontal</v-icon></template>
        </configItem>
        <configItem
            title="Theme"
            subtitle="Don't like the default colors? Change them here."
            @activate="tab = 'theme'"
        >
          <template v-slot:prepend><v-icon>mdi-palette-outline</v-icon></template>
          <template v-slot:append><v-icon>mdi-dots-horizontal</v-icon></template>
        </configItem>

        <v-list-subheader>Save/restore configuration</v-list-subheader>
        <configItem
            title="Save to file"
            subtitle="Save this device's configuration to a file."
            @activate="saveToFile"
        >
          <template v-slot:prepend>
            <v-icon>mdi-file-download-outline</v-icon>
          </template>
        </configItem>
        <configDialog
            title="Restore from file"
            subtitle="Restore this device's configuration from a file."
        >
          <template v-slot:prepend>
            <v-icon>mdi-file-upload-outline</v-icon>
          </template>
          <template v-slot:default="{ isActive }">
            <v-card-text>
              <v-file-input
                  accept=".json"
                  label="Selected file"
                  outlined
                  v-model="chosenFile"
              >
              </v-file-input>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn
                  text="Cancel"
                  @click="isActive.value = false"
              ></v-btn>
              <v-btn
                  text="Restore from file"
                  @click="isActive.value = false; loadFromFile(chosenFile.value);"
              ></v-btn>
            </v-card-actions>
          </template>
        </configDialog>
        <configReset
            title="Restore defaults"
            subtitle="Restore this device's configuration from defaults."
            @reset="loadDefaults()"
        />

      </v-list>
    </v-tabs-window-item>

    <v-tabs-window-item value="layout">
      <v-list lines="one">
        <v-list-item disabled>Layout</v-list-item>

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
            v-model:address="configuration.layoutDisplay1Address"
            v-model:zoom="configuration.layoutDisplay1Zoom"
        />
        <configDisplay
            :title="'Display B'"
            subtitle="One nested web app not enough? Have a second one!"
            v-model:address="configuration.layoutDisplay2Address"
            v-model:zoom="configuration.layoutDisplay2Zoom"
        />
        <configItem
            title="Adjust"
            subtitle="Adjust the positioning of the components activated above."
            @activate="emit('adjust')"
        >
          <template v-slot:prepend>
            <v-icon>mdi-cursor-move</v-icon>
          </template>
        </configItem>

      </v-list>
    </v-tabs-window-item>

    <v-tabs-window-item value="stalks">
      <v-list lines="one">
        <v-list-item disabled>Control stalks &amp; gestures</v-list-item>

        <v-list-subheader>Preview</v-list-subheader>
        <gestureInputMap
            :gestureMapping="gestureMapping"
            style="height: auto; aspect-ratio: 2.8; position: relative"
        />

        <v-list-subheader>Gesture control</v-list-subheader>
        <configRadio
            title="Both stalks"
            subtitle="Use swipe gestures to control both control stalks. The left-hand side of the screen controls the left-hand stalk, and vice versa."
            v-model="configuration.stalkGestureMode"
            joiner="first"
            value="bothStalks"
        />
        <configRadio
            title="Left stalk only"
            subtitle="Use swipe gestures to control the left-hand stalk only. Use if you don't want to control the right-hand control stalk, or if you do that on another device."
            v-model="configuration.stalkGestureMode"
            joiner="middle"
            value="leftStalk"
        />
        <configRadio
            title="Right stalk only"
            subtitle="Use swipe gestures to control the right-hand stalk only. Use if you don't want to control the left-hand control stalk, or if you do that on another device."
            v-model="configuration.stalkGestureMode"
            joiner="middle"
            value="rightStalk"
        />
        <configRadio
            title="Disable gesture input"
            subtitle="Swipe gesture input is disabled entirely."
            v-model="configuration.stalkGestureMode"
            joiner="last"
            value="disabled"
        />

        <v-list-subheader>Gesture zones per stalk</v-list-subheader>
        <configRadio
            title="Two zones, outer controls switches"
            subtitle="The swipe zone for each stalk is vertically divided in two. The outer half controls the switches on the stalk, while the inner half moves the stalk itself."
            :enabled="configuration.stalkGestureMode != 'disabled'"
            v-model="configuration.stalkGestureSwitches"
            joiner="first"
            value="outer"
        />
        <configRadio
            title="Two zones, inner controls switches"
            subtitle="The swipe zone for each stalk is vertically divided in two. The inner half controls the switches on the stalk, while the outer half moves the stalk itself."
            :enabled="configuration.stalkGestureMode != 'disabled'"
            v-model="configuration.stalkGestureSwitches"
            joiner="middle"
            value="inner"
        />
        <configRadio
            title="Single zone, tap first for switches"
            subtitle="Swipe actions normally control stalk movement. To control the switches, use a tap-swipe combo. You can swipe as often as you like after tapping; the control layer reverts back on a timer."
            :enabled="configuration.stalkGestureMode != 'disabled'"
            v-model="configuration.stalkGestureSwitches"
            joiner="last"
            value="click"
        />

        <v-list-subheader>Menu entry</v-list-subheader>
        <configRadio
            title="Tap for menu"
            :subtitle="'Click/tap ' + (configuration.stalkGestureSwitches == 'click' ? 'twice ' : '') + 'to open the main menu. Hold also works.'"
            v-model="configuration.stalkHoldForMenu"
            joiner="first"
            :value="false"
        />
        <configRadio
            title="Hold for menu"
            subtitle="The menu opens only when you hold your mouse button or finger down without moving it for half a second."
            v-model="configuration.stalkHoldForMenu"
            joiner="last"
            :value="true"
        />

        <v-list-subheader>Left/right-hand drive</v-list-subheader>
        <configRadio
            title="Left-hand drive"
            subtitle="The left-hand stalk controls lights and wipers."
            v-model="configuration.stalkSwap"
            joiner="first"
            value="lhd"
        />
        <configRadio
            title="Right-hand drive"
            subtitle="The left-hand stalk controls the gearbox."
            v-model="configuration.stalkSwap"
            joiner="last"
            value="rhd"
        />

        <v-list-subheader>Turn indicator switch</v-list-subheader>
        <configRadio
            title="Swipe once to flash 3x"
            subtitle="Swipe twice to keep the turn indicator on. Emulates momentary switch."
            v-model="configuration.stalkBlinkersMomentaryCount"
            joiner="first"
            :value="3"
        />
        <configRadio
            title="Swipe once to flash 5x"
            subtitle="Swipe twice to keep the turn indicator on. Emulates momentary switch."
            v-model="configuration.stalkBlinkersMomentaryCount"
            joiner="middle"
            :value="5"
        />
        <configRadio
            title="Disable momentary switch position"
            subtitle="The first swipe already locks the stalk in place."
            v-model="configuration.stalkBlinkersMomentaryCount"
            joiner="last"
            :value="0"
        />
        <configRadio
            title="Auto-off high sensitivity"
            subtitle="The turn indicator automatically turns off when you turn the steering wheel by 10 percentage points in the opposing direction."
            v-model="configuration.stalkBlinkersAutoOffSensitivity"
            joiner="first"
            :value="10"
        />
        <configRadio
            title="Auto-off low sensitivity"
            subtitle="The turn indicator automatically turns off when you turn the steering wheel by 20 percentage points in the opposing direction."
            v-model="configuration.stalkBlinkersAutoOffSensitivity"
            joiner="middle"
            :value="20"
        />
        <configRadio
            title="Disable auto-off"
            subtitle="Steering wheel movement does not affect the turn indicators."
            v-model="configuration.stalkBlinkersAutoOffSensitivity"
            joiner="last"
            :value="0"
        />

        <v-list-subheader>Low-beam switch</v-list-subheader>
        <configBool
            title="Skip parking lights position"
            subtitle="Skip the middle switch position for parking lights, so a single swipe turns the lights fully on or off."
            v-model="configuration.stalkSkipParkingLights"
        />
        <configBool
            title="Invert low-beam switch"
            subtitle="Swipe inboard instead of outboard to increment mode (and vice versa)."
            v-model="configuration.stalkInvertLowBeam"
        />

        <v-list-subheader>High-beam switch</v-list-subheader>
        <configRadio
            title="Light horn between on and off"
            subtitle="Swipe once to flash the high beams; swipe twice to keep the high beams on. Emulates momentary switch position between off and on. This is what the in-game dashboard shows, at least for the truck I tested with."
            v-model="configuration.stalkLightHornMode"
            joiner="first"
            value="middle"
        />
        <configRadio
            title="Light horn before off"
            subtitle="Swipe in the off direction when the high beams are off to flash the high beams; swipe in the on direction to keep the high beams on. Emulates momentary switch position before off."
            v-model="configuration.stalkLightHornMode"
            joiner="middle"
            value="reverse"
        />
        <configRadio
            title="Disable light-horn switch position"
            subtitle="The high-beam switch has only the on and off positions."
            v-model="configuration.stalkLightHornMode"
            joiner="last"
            value="disabled"
        />
        <configRadio
            title="Long light horn duration"
            subtitle="A high-beam flash lasts for about a second."
            v-model="configuration.stalkLightHornTimer"
            :enabled="configuration.stalkLightHornMode != 'disabled'"
            joiner="first"
            :value="800"
        />
        <configRadio
            title="Short light horn duration"
            subtitle="A high-beam flash is really just a flash."
            v-model="configuration.stalkLightHornTimer"
            :enabled="configuration.stalkLightHornMode != 'disabled'"
            joiner="last"
            :value="300"
        />
        <configBool
            title="Invert high-beam switch"
            subtitle="Swipe inboard instead of outboard to enable high beams (and vice versa)."
            v-model="configuration.stalkInvertHighBeam"
        />

        <v-list-subheader>Wiper switch</v-list-subheader>
        <configBool
            title="Invert wiper switch"
            subtitle="Swipe down instead of up to increment wiper speed (and vice versa)."
            v-model="configuration.stalkInvertWipers"
        />

        <v-list-subheader>Transmission selection inverts &amp; swaps</v-list-subheader>
        <configBool
            title="Swap gear up/down and braking"
            subtitle="Up/down controls engine brake/retarder instead of gear up/down (and vice versa)."
            v-model="configuration.stalkSwapGearBrake"
        />
        <configBool
            title="Invert gear up/down"
            :subtitle="'Swipe ' + (configuration.stalkSwapGearBrake ? 'down instead of up' : 'inboard instead of outboard') + ' for gear up (and vice versa).'"
            v-model="configuration.stalkInvertTransGear"
        />
        <configBool
            title="Invert braking intensity"
            :subtitle="'Swipe ' + (configuration.stalkSwapGearBrake ? 'inboard instead of outboard' : 'down instead of up') + ' to increase braking action (and vice versa).'"
            v-model="configuration.stalkInvertTransBrake"
        />

        <v-list-subheader>Transmission mode inverts &amp; swaps</v-list-subheader>
        <configBool
            title="Swap transmission mode and direction"
            subtitle="Up/down controls transmission mode (manual/auto) instead of direction (and vice versa)."
            v-model="configuration.stalkSwapModeDirection"
        />
        <configBool
            title="Invert transmission direction"
            :subtitle="'Swipe ' + (configuration.stalkSwapModeDirection ? 'down instead of up' : 'inboard instead of outboard') + ' to move toward forward drive (and vice versa).'"
            v-model="configuration.stalkInvertTransDirection"
        />
        <configBool
            title="Invert transmission mode"
            :subtitle="'Swipe ' + (configuration.stalkSwapModeDirection ? 'inboard instead of outboard' : 'down instead of up') + ' to enable automatic transmission.'"
            v-model="configuration.stalkInvertTransMode"
        />

        <v-list-subheader>Test or reset</v-list-subheader>
        <configItem
            title="Test input mapping"
            subtitle="Try out the gesture controls without the game."
            @activate="emit('mapping')"
        >
          <template v-slot:prepend>
            <v-icon>mdi-information-outline</v-icon>
          </template>
        </configItem>
        <configReset
            title="Load default stalk settings"
            subtitle="Click to load default settings for this page."
            @reset="loadDefaults('stalk')"
        />

      </v-list>
    </v-tabs-window-item>

    <v-tabs-window-item value="instruments">
      <v-list lines="one">
        <v-list-item disabled>Instrument behavior</v-list-item>

        <v-list-subheader>Gear display</v-list-subheader>
        <configRadio
            title="Normal"
            subtitle='The gear display shows the "indicated gear" from game telemetry.'
            v-model="configuration.prefGearDisplayMode"
            joiner="first"
            value="gear"
        />
        <configRadio
            title='"Real" gear'
            subtitle="The gear display shows the &quot;real gear&quot; from game telemetry. This appears to be the gear that's actually used by the game's gearbox simulation. It shows N when the truck is not moving (regardless of R/N/D state) and might differ from the indicated gear when your transmission is messed up."
            v-model="configuration.prefGearDisplayMode"
            joiner="middle"
            value="realGear"
        />
        <configRadio
            title="Speed"
            subtitle="The gear display is used to show speed digitally instead."
            v-model="configuration.prefGearDisplayMode"
            :enabled="configuration.prefCruiseDisplayMode != 'speedAlways'"
            joiner="last"
            value="speed"
        />

        <v-list-subheader>Cruise control display</v-list-subheader>
        <configRadio
            title="Normal"
            subtitle="The cruise control speed display turns off when cruise control is not enabled."
            v-model="configuration.prefCruiseDisplayMode"
            joiner="first"
            value="normal"
        />
        <configRadio
            title="Remember speed"
            subtitle="When you or the game turns off cruise control, indicate the last known cruise control speed, which is probably what the &quot;resume&quot; binding will revert the speed to. The game doesn't report the resume speed via telemetry, so this information might be wrong."
            v-model="configuration.prefCruiseDisplayMode"
            joiner="middle"
            value="retain"
        />
        <configRadio
            title="Show actual speed when disabled"
            subtitle="When cruise control is not on, the display shows the actual speed digitally."
            v-model="configuration.prefCruiseDisplayMode"
            joiner="middle"
            value="speedWhenDisabled"
        />
        <configRadio
            title="Always show actual speed"
            subtitle="The display is used to show the actual speed digitally, regardless of the cruise control state."
            v-model="configuration.prefCruiseDisplayMode"
            :enabled="configuration.prefGearDisplayMode != 'speed'"
            joiner="last"
            value="speedAlways"
        />

        <v-list-subheader>Clock timezone offset</v-list-subheader>
        <configRadio
            title="No offset"
            subtitle="The clock shows the game's internal/default timezone."
            v-model="configuration.prefClockOffset"
            joiner="first"
            :value="0"
        />
        <configRadio
            title="+1 hour"
            subtitle="Adds one hour to the indicated time."
            v-model="configuration.prefClockOffset"
            joiner="middle"
            :value="+1"
        />
        <configRadio
            title="+2 hours"
            subtitle="Adds two hours to the indicated time."
            v-model="configuration.prefClockOffset"
            joiner="middle"
            :value="+2"
        />
        <configRadio
            title="-1 hour"
            subtitle="Subtracts one hour from the indicated time."
            v-model="configuration.prefClockOffset"
            joiner="middle"
            :value="-1"
        />
        <configRadio
            title="-2 hours"
            subtitle="Subtracts two hours from the indicated time."
            v-model="configuration.prefClockOffset"
            joiner="last"
            :value="-2"
        />

        <v-list-subheader>Startup behavior &amp; power</v-list-subheader>
        <configBool
            title="Indicator self-test"
            subtitle="Simulate a self-test of the indicators when you power up your truck. If disabled, all indicators follow game telemetry data immediately."
            v-model="configuration.prefSelfTest"
        />
        <configBool
            title="Gauge self-test"
            subtitle="Simulate self-test/homing of the gauges when you power up your truck. If disabled, the gauges follow game telemetry data immediately."
            v-model="configuration.prefSelfTestNeedle"
        />
        <configBool
            title="App display startup"
            subtitle="Simulates slow-ish start-up of an operating system running on the display."
            :enabled="configuration.layoutDisplay1Address != '' || configuration.layoutDisplay2Address != ''"
            v-model="configuration.prefDisplayStartup"
        />
        <configBool
            title="App display auto power"
            subtitle="Displays turn on and off automatically when you power your truck on and off. You can always override."
            :enabled="configuration.layoutDisplay1Address != '' || configuration.layoutDisplay2Address != ''"
            v-model="configuration.prefDisplayFollowsTruck"
        />
        <configBool
            title="App display refresh inhibit"
            subtitle="Note that manual power-cycling of a display always reloads the embedded web page."
            :enabled="(configuration.layoutDisplay1Address != '' || configuration.layoutDisplay2Address != '') && configuration.prefDisplayFollowsTruck"
            v-model="configuration.prefDisplayStandby"
        />

        <v-list-subheader>Miscellaneous</v-list-subheader>
        <configBool
            title="Clamp fuel gauge to AdBlue"
            subtitle="When selected and the AdBlue aka exhaust fluid level is lower than the fuel level, the fuel gauge shows the AdBlue level instead of the fuel level."
            v-model="configuration.prefDisplayStandby"
        />
        <configBool
            title="Flash overspeed indicator"
            subtitle="When selected, the overspeed indicator will flash instead of being on continuously when you're speeding by a lot."
            v-model="configuration.prefFlashOverspeed"
        />
        <configBool
            title="Flash rest time indicator"
            subtitle="When selected, the rest time indicator will flash when it reaches zero. If you don't have rest time simulation on in the game, the game will always report zero, so you'll definitely want to disable this then."
            v-model="configuration.prefFlashRestIndicator"
        />

      </v-list>
  </v-tabs-window-item>

    <v-tabs-window-item value="performance">
      <v-list lines="one">
        <v-list-item disabled>Performance settings</v-list-item>

        <v-list-subheader>Telemetry update rate</v-list-subheader>
        <configRadio
            title="No limit"
            subtitle="The game sends telemetry for every frame it renders."
            v-model="configuration.perfTelemetryThrottle"
            joiner="first"
            :value="0"
        />
        <configRadio
            title="60 fps"
            subtitle="Telemetry updates are sent at most every 14ms (value is rounded down to reduce stuttering)."
            v-model="configuration.perfTelemetryThrottle"
            joiner="middle"
            :value="14"
        />
        <configRadio
            title="30 fps"
            subtitle="Telemetry updates are sent at most every 30ms (value is rounded down to reduce stuttering)."
            v-model="configuration.perfTelemetryThrottle"
            joiner="middle"
            :value="30"
        />
        <configRadio
            title="20 fps"
            subtitle="Telemetry updates are sent at most every 45ms (value is rounded down to reduce stuttering)."
            v-model="configuration.perfTelemetryThrottle"
            joiner="middle"
            :value="45"
        />
        <configRadio
            title="10 fps"
            subtitle="Telemetry updates are sent at most every 100ms."
            v-model="configuration.perfTelemetryThrottle"
            joiner="middle"
            :value="100"
        />
        <configRadio
            title="5 fps"
            subtitle="Telemetry updates are sent at most every 200ms."
            v-model="configuration.perfTelemetryThrottle"
            joiner="middle"
            :value="200"
        />
        <configRadio
            title="2 fps"
            subtitle="Telemetry updates are sent at most every 500ms."
            v-model="configuration.perfTelemetryThrottle"
            joiner="last"
            :value="500"
        />

        <v-list-subheader>Javascript animations</v-list-subheader>
        <configRadio
            title="No limit"
            subtitle="Javascript animations update for every browser animation frame. That's usually 60 FPS."
            v-model="configuration.perfAnimationThrottle"
            joiner="first"
            :value="0"
        />
        <configRadio
            title="60 fps"
            subtitle="Javascript animations update at most every 14ms (value is rounded down to reduce stuttering)."
            v-model="configuration.perfAnimationThrottle"
            joiner="middle"
            :value="14"
        />
        <configRadio
            title="30 fps"
            subtitle="Javascript animations update at most every 30ms (value is rounded down to reduce stuttering)."
            v-model="configuration.perfAnimationThrottle"
            joiner="middle"
            :value="30"
        />
        <configRadio
            title="20 fps"
            subtitle="Telemetry updates are sent at most every 45ms (value is rounded down to reduce stuttering)."
            v-model="configuration.perfAnimationThrottle"
            joiner="last"
            :value="45"
        />

        <v-list-subheader>Effects</v-list-subheader>
        <configBool
            title="Needle animations"
            subtitle="Whether needle movement is smoothed out. This is done via Javascript, so it's throttled by the animation speed controls above."
            v-model="configuration.perfAnimateNeedles"
        />
        <configBool
            title="Needle details"
            subtitle="Whether to add some extra visual details to the needles, to make them not look so bland."
            v-model="configuration.perfNeedleDetails"
        />
        <configBool
            title="Indicator animations"
            subtitle="Whether to fade indicators in and out. Gives a lightbulb-like effect. This is done via CSS, and is therefore always done at the browser's framerate."
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
      <v-list lines="one">
        <v-list-item disabled>Theme</v-list-item>

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
            @reset="loadDefaults('theme')"
        />

      </v-list>
    </v-tabs-window-item>
  </v-tabs-window>
</template>

<style scoped>

</style>