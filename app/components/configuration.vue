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

function vibrate(time: number) {
  try {
    navigator.vibrate(time);
  } catch (e) {
  }
}

function vibrateSupported(): boolean {
  return navigator !== undefined && navigator.vibrate !== undefined;
}


</script>

<template>
  <v-tabs v-model="tab" color="primary" grow>
    <v-tab value="general" min-width="0px"><v-icon>mdi-cog</v-icon></v-tab>
    <v-tab value="layout" min-width="0px"><v-icon>mdi-page-layout-header-footer</v-icon></v-tab>
    <v-tab value="gestures" min-width="0px"><v-icon>mdi-gesture-swipe</v-icon></v-tab>
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

        <v-list-subheader>Left/right-hand drive</v-list-subheader>
        <configRadio
            title="Left-hand drive"
            subtitle="The left-hand stalk controls lights and wipers."
            v-model="configuration.generalDriveSide"
            joiner="first"
            value="lhd"
        />
        <configRadio
            title="Right-hand drive"
            subtitle="The left-hand stalk controls the gearbox."
            v-model="configuration.generalDriveSide"
            joiner="last"
            value="rhd"
        />

        <v-list-subheader>Speed display (digital only)</v-list-subheader>
        <configRadio
            title="Kilometers per hour"
            subtitle="The digital speed displays show speed in kilometers per hour."
            v-model="configuration.generalSpeedUnit"
            joiner="first"
            value="kmh"
        />
        <configRadio
            title="Miles per hour"
            subtitle="The digital speed displays show speed in miles per hour."
            v-model="configuration.generalSpeedUnit"
            joiner="last"
            value="mph"
        />

        <v-list-subheader>Time display</v-list-subheader>
        <configRadio
            title="24-hour"
            subtitle="The clock shows 24-hour time (aka military time)."
            v-model="configuration.general12HourTime"
            joiner="first"
            :value="false"
        />
        <configRadio
            title="12-hour am/pm"
            subtitle="The clock shows 12-hour time with am/pm notation."
            v-model="configuration.general12HourTime"
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
            title="Gesture input"
            subtitle="Use TruckDash to control your truck with swipe gestures! Real vehicles have control stalks, but unless you have a full sim setup, you probably don't for the game. TruckDash tries to emulate control stalks using swipe gesture controls."
            @activate="tab = 'gestures'"
        >
          <template v-slot:prepend><v-icon>mdi-gesture-swipe</v-icon></template>
          <template v-slot:append><v-icon>mdi-dots-horizontal</v-icon></template>
        </configItem>
        <configItem
            title="Stalks &amp; switches"
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
        <configBool
            title="Left control stalk"
            subtitle="Shows a rendition of the left control stalk. Note: rather than pressing the switches or dragging the handles, use swipe actions!"
            v-model="configuration.layoutLeftStalkEnabled"
        />
        <configBool
            title="Right control stalk"
            subtitle="Shows a rendition of the right control stalk. Note: rather than pressing the switches or dragging the handles, use swipe actions!"
            v-model="configuration.layoutRightStalkEnabled"
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

        <v-list-subheader>Reset</v-list-subheader>
        <configReset
            title="Restore default layout settings"
            subtitle="Click to load default settings for this page."
            @reset="loadDefaults('layout')"
        />

      </v-list>
    </v-tabs-window-item>

    <v-tabs-window-item value="gestures">
      <v-list lines="one">
        <v-list-item disabled>Gesture input</v-list-item>

        <v-list-subheader>Preview</v-list-subheader>
        <gestureInputMap
            :gestureMapping="gestureMapping"
            style="height: auto; aspect-ratio: 2.8; position: relative"
        />

        <v-list-subheader>Single-finger gestures</v-list-subheader>
        <configRadio
            title="Tap for menu"
            :subtitle="'Click/tap ' + (configuration.gestureSingleSwipeZones == 'click' ? 'twice ' : '') + 'to open the main menu. Hold also works.'"
            v-model="configuration.gestureSingleHoldForMenu"
            joiner="first"
            :value="false"
        />
        <configRadio
            title="Hold for menu"
            subtitle="The menu opens only when you hold your mouse button or finger down without moving it for half a second."
            v-model="configuration.gestureSingleHoldForMenu"
            joiner="last"
            :value="true"
        />
        <configRadio
            title="Swipes control both stalks"
            subtitle="Use swipe gestures to control both control stalks. The left-hand side of the screen controls the left-hand stalk, and vice versa."
            v-model="configuration.gestureSingleSwipes"
            joiner="first"
            value="bothStalks"
        />
        <configRadio
            title="Swipes control left stalk"
            subtitle="Use swipe gestures to control the left-hand stalk only. Use if you don't want to control the right-hand control stalk, or if you do that on another device."
            v-model="configuration.gestureSingleSwipes"
            joiner="middle"
            value="leftStalk"
        />
        <configRadio
            title="Swipes control right stalk"
            subtitle="Use swipe gestures to control the right-hand stalk only. Use if you don't want to control the left-hand control stalk, or if you do that on another device."
            v-model="configuration.gestureSingleSwipes"
            joiner="middle"
            value="rightStalk"
        />
        <configRadio
            title="Disable swipe controls"
            subtitle="Swipe controls are disabled entirely."
            v-model="configuration.gestureSingleSwipes"
            joiner="last"
            value="disabled"
        />
        <configRadio
            title="Two zones, outer controls switches"
            subtitle="The swipe zone for each stalk is vertically divided in two. The outer half controls the switches on the stalk, while the inner half moves the stalk itself."
            :enabled="configuration.gestureSingleSwipes != 'disabled'"
            v-model="configuration.gestureSingleSwipeZones"
            joiner="first"
            value="outer"
        />
        <configRadio
            title="Two zones, inner controls switches"
            subtitle="The swipe zone for each stalk is vertically divided in two. The inner half controls the switches on the stalk, while the outer half moves the stalk itself."
            :enabled="configuration.gestureSingleSwipes != 'disabled'"
            v-model="configuration.gestureSingleSwipeZones"
            joiner="middle"
            value="inner"
        />
        <configRadio
            title="Single zone, tap first for switches"
            subtitle="Swipe actions normally control stalk movement. To control the switches, use a tap-swipe combo. You can swipe as often as you like after tapping; the control layer reverts back on a timer."
            :enabled="configuration.gestureSingleSwipes != 'disabled'"
            v-model="configuration.gestureSingleSwipeZones"
            joiner="last"
            value="click"
        />
        <configBool
            title="Long swipes repeat input"
            subtitle="When enabled, you can swipe longer distances to move a stalk or switch by more than one position. When disabled, you need to swipe multiple times to advance by multiple positions."
            :enabled="configuration.gestureSingleSwipes != 'disabled'"
            v-model="configuration.gestureSingleSwipeLong"
        />

        <v-list-subheader>Two-finger gestures</v-list-subheader>
        <configRadio
            title="Tap/hold to interact"
            subtitle="When enabled, tap or hold with two fingers to interact with the environment (sleep, refuel, take job, etc.)."
            v-model="configuration.gestureDoubleTapHold"
            joiner="first"
            value="activate"
        />
        <configRadio
            title="Tap/hold for disabled"
            subtitle="Two-finger tap/hold is disabled."
            v-model="configuration.gestureDoubleTapHold"
            joiner="last"
            value="disabled"
        />
        <configRadio
            title="Rotate controls ignition"
            subtitle="When enabled, hold down two fingers and turn to rotate the ignition key switch."
            v-model="configuration.gestureDoubleRotate"
            joiner="first"
            value="ignition"
        />
        <configRadio
            title="Rotate gestures disabled"
            subtitle="Two-finger rotations are disabled."
            v-model="configuration.gestureDoubleRotate"
            joiner="last"
            value="disabled"
        />
        <configRadio
            title="Swipe down/up for park set/release"
            subtitle="When enabled, swipe up with two fingers to release the parking brake. Swipe down with two fingers to set it."
            v-model="configuration.gestureDoubleSwipeVertical"
            joiner="first"
            value="park"
        />
        <configRadio
            title="Swipe up/down for park set/release"
            subtitle="When enabled, swipe up with two fingers to set the parking brake. Swipe down with two fingers to release it."
            v-model="configuration.gestureDoubleSwipeVertical"
            joiner="middle"
            value="parkInvert"
        />
        <configRadio
            title="Swipe up/down disabled"
            subtitle="Two-finger swipes are disabled."
            v-model="configuration.gestureDoubleSwipeVertical"
            joiner="last"
            value="disabled"
        />

        <v-list-subheader>Sensitivity</v-list-subheader>
        <configRadio
            title="Low swipe sensitivity"
            subtitle="Swipes activate for movements longer than than 30% of your screen's smallest dimension. Taps and holds must move less than 15%."
            v-model="configuration.gestureSwipeSensitivity"
            joiner="first"
            :value="0.3"
        />
        <configRadio
            title="Medium swipe sensitivity"
            subtitle="Swipes activate for movements longer than than 20% of your screen's smallest dimension. Taps and holds must move less than 10%."
            v-model="configuration.gestureSwipeSensitivity"
            joiner="middle"
            :value="0.2"
        />
        <configRadio
            title="High swipe sensitivity"
            subtitle="Swipes activate for movements longer than than 10% of your screen's smallest dimension. Taps and holds must move less than 5%."
            v-model="configuration.gestureSwipeSensitivity"
            joiner="last"
            :value="0.1"
        />
        <configRadio
            title="Long hold timer"
            subtitle='The "hold" gesture takes 800ms to activate.'
            v-model="configuration.gestureHoldTimer"
            joiner="first"
            :value="800"
        />
        <configRadio
            title="Medium hold timer"
            subtitle='The "hold" gesture takes 500ms to activate.'
            v-model="configuration.gestureHoldTimer"
            joiner="middle"
            :value="500"
        />
        <configRadio
            title="Short hold timer"
            subtitle='The "hold" gesture takes 300ms to activate.'
            v-model="configuration.gestureHoldTimer"
            joiner="last"
            :value="300"
        />
        <configRadio
            title="Long control layer timer"
            subtitle="The tap-before-swipe logic for controlling stalk switches instead of position resets 800ms after the last gesture."
            v-model="configuration.gestureControlLayerTimer"
            :enabled="configuration.gestureSingleSwipeZones == 'click'"
            joiner="first"
            :value="800"
        />
        <configRadio
            title="Medium control layer timer"
            subtitle="The tap-before-swipe logic for controlling stalk switches instead of position resets 500ms after the last gesture."
            v-model="configuration.gestureControlLayerTimer"
            :enabled="configuration.gestureSingleSwipeZones == 'click'"
            joiner="middle"
            :value="500"
        />
        <configRadio
            title="Short control layer timer"
            subtitle="The tap-before-swipe logic for controlling stalk switches instead of position resets 300ms after the last gesture."
            v-model="configuration.gestureControlLayerTimer"
            :enabled="configuration.gestureSingleSwipeZones == 'click'"
            joiner="last"
            :value="300"
        />

        <v-list-subheader>Vibration</v-list-subheader>
        <configRadio
            title="Long haptic feedback"
            subtitle="A gesture that moves a switch to a new latched position sends a 200ms vibrate command to your browser. Whether that does anything depends both on your device and your browser; your mileage may vary."
            v-model="configuration.gestureHapticTimer"
            :enabled="vibrateSupported"
            joiner="first"
            @activate="vibrate(200)"
            :value="200"
        />
        <configRadio
            title="Medium haptic feedback"
            subtitle="A gesture that moves a switch to a new latched position sends a 100ms vibrate command to your browser. Whether that does anything depends both on your device and your browser; your mileage may vary"
            v-model="configuration.gestureHapticTimer"
            :enabled="vibrateSupported"
            joiner="middle"
            @activate="vibrate(100)"
            :value="100"
        />
        <configRadio
            title="Short haptic feedback"
            subtitle="A gesture that moves a switch to a new latched position sends a 50ms vibrate command to your browser. Whether that does anything depends both on your device and your browser; your mileage may vary"
            v-model="configuration.gestureHapticTimer"
            :enabled="vibrateSupported"
            joiner="middle"
            @activate="vibrate(50)"
            :value="50"
        />
        <configRadio
            title="No haptic feedback"
            subtitle="Haptic feedback is disabled."
            v-model="configuration.gestureHapticTimer"
            joiner="last"
            :value="0"
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
            title="Restore default gesture settings"
            subtitle="Click to load default settings for this page."
            @reset="loadDefaults('gesture')"
        />

      </v-list>
    </v-tabs-window-item>

    <v-tabs-window-item value="stalks">
      <v-list lines="one">
        <v-list-item disabled>Stalks &amp; switches</v-list-item>

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

        <v-list-subheader>Transmission switches</v-list-subheader>
        <configRadio
            title="Semi-automatic"
            subtitle="Models the input of a semi-automatic transmission. Gear index and R/N/D are separate axes, the latter being a switch on the stalk. Gear-up goes from 1 to 2, but also from R1 to R2. Gear-down from 1 or R1 or any gear input while the direction switch is in N does nothing. A third switch toggles automatic vs manual mode. In automatic mode, the gear axis provides gear up/down hints."
            v-model="configuration.stalkTransStalkMode"
            joiner="first"
            value="semi"
        />
        <configRadio
            title="Direct-mapped with hints"
            subtitle="The gear up/down axis is directly mapped to the gear (hint) up and gear (hint) down inputs of the game. The hint inputs are used when automatic or arcade controls are selected and the truck is moving."
            v-model="configuration.stalkTransStalkMode"
            joiner="middle"
            value="directWithHints"
        />
        <configRadio
            title="Direct-mapped without hints"
            subtitle="The gear up/down axis is directly mapped to the gear up and gear down inputs of the game. The gear up/down hint inputs are unbound."
            v-model="configuration.stalkTransStalkMode"
            joiner="middle"
            value="fullDirect"
        />
        <configRadio
            title="Disable controls"
            subtitle="Use this if you have an H-shifter or don't want to think about gearboxes at all."
            v-model="configuration.stalkTransStalkMode"
            joiner="last"
            value="disabled"
        />
        <configBool
            title="Invert gear up/down"
            :subtitle="'Swipe ' + (configuration.stalkSwapGearBrake ? 'down instead of up' : 'inboard instead of outboard') + ' for gear up (and vice versa).'"
            v-model="configuration.stalkInvertTransGear"
            :enabled="configuration.stalkTransStalkMode != 'disabled'"
        />
        <configBool
            title="Invert direction"
            :subtitle="'Swipe ' + (configuration.stalkSwapModeDirection ? 'inboard instead of outboard' : 'down instead of up') + ' to move toward forward drive (and vice versa).'"
            v-model="configuration.stalkInvertTransDirection"
            :enabled="configuration.stalkTransStalkMode == 'semi'"
        />
        <configBool
            title="Invert transmission mode"
            :subtitle="'Swipe ' + (configuration.stalkSwapModeDirection ? 'down instead of up' : 'inboard instead of outboard') + ' to enable automatic transmission.'"
            v-model="configuration.stalkInvertTransMode"
            :enabled="configuration.stalkTransStalkMode != 'disabled'"
        />
        <configBool
            title="Swap transmission mode and direction"
            subtitle="Up/down controls transmission mode (manual/auto) instead of direction (and vice versa)."
            v-model="configuration.stalkSwapModeDirection"
            :enabled="configuration.stalkTransStalkMode != 'disabled'"
        />

        <v-list-subheader>Engine brake and retarder</v-list-subheader>
        <configRadio
            title="Prefer retarder"
            subtitle="The braking-action axis of the stalk is mapped to retarder level if a retarder is installed on the truck. If not, it controls engine brake intensity."
            v-model="configuration.stalkBrakingMode"
            joiner="first"
            value="auto"
        />
        <configRadio
            title="Force retarder"
            subtitle="The braking-action axis of the stalk always sends input to the game to try to control the retarder, whether one is installed or not."
            v-model="configuration.stalkBrakingMode"
            joiner="middle"
            value="retarder"
        />
        <configRadio
            title="Force engine brake"
            subtitle="The braking-action axis of the stalk always controls the engine brake, regardless of whether a retarder is installed."
            v-model="configuration.stalkBrakingMode"
            joiner="last"
            value="engine"
        />
        <configBool
            title="Invert braking intensity"
            :subtitle="'Swipe ' + (configuration.stalkSwapGearBrake ? 'inboard instead of outboard' : 'down instead of up') + ' to increase braking action (and vice versa).'"
            v-model="configuration.stalkInvertTransBrake"
        />
        <configBool
            title="Swap gear up/down and braking"
            subtitle="Up/down controls engine brake/retarder instead of gear up/down (and vice versa)."
            v-model="configuration.stalkSwapGearBrake"
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
            title="Restore default stalk &amp; switch settings"
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
            v-model="configuration.instrGearDisplayMode"
            joiner="first"
            value="gear"
        />
        <configRadio
            title='"Real" gear'
            subtitle="The gear display shows the &quot;real gear&quot; from game telemetry. This appears to be the gear that's actually used by the game's gearbox simulation. It shows N when the truck is not moving (regardless of R/N/D state) and might differ from the indicated gear when your transmission is messed up."
            v-model="configuration.instrGearDisplayMode"
            joiner="middle"
            value="realGear"
        />
        <configRadio
            title="Speed"
            subtitle="The gear display is used to show speed digitally instead."
            v-model="configuration.instrGearDisplayMode"
            :enabled="configuration.instrCruiseDisplayMode != 'speedAlways'"
            joiner="last"
            value="speed"
        />

        <v-list-subheader>Cruise control display</v-list-subheader>
        <configRadio
            title="Normal"
            subtitle="The cruise control speed display turns off when cruise control is not enabled."
            v-model="configuration.instrCruiseDisplayMode"
            joiner="first"
            value="normal"
        />
        <configRadio
            title="Remember speed"
            subtitle="When you or the game turns off cruise control, indicate the last known cruise control speed, which is probably what the &quot;resume&quot; binding will revert the speed to. The game doesn't report the resume speed via telemetry, so this information might be wrong."
            v-model="configuration.instrCruiseDisplayMode"
            joiner="middle"
            value="retain"
        />
        <configRadio
            title="Show actual speed when disabled"
            subtitle="When cruise control is not on, the display shows the actual speed digitally."
            v-model="configuration.instrCruiseDisplayMode"
            joiner="middle"
            value="speedWhenDisabled"
        />
        <configRadio
            title="Always show actual speed"
            subtitle="The display is used to show the actual speed digitally, regardless of the cruise control state."
            v-model="configuration.instrCruiseDisplayMode"
            :enabled="configuration.instrGearDisplayMode != 'speed'"
            joiner="last"
            value="speedAlways"
        />

        <v-list-subheader>Clock timezone offset</v-list-subheader>
        <configRadio
            title="No offset"
            subtitle="The clock shows the game's internal/default timezone."
            v-model="configuration.instrClockOffset"
            joiner="first"
            :value="0"
        />
        <configRadio
            title="+1 hour"
            subtitle="Adds one hour to the indicated time."
            v-model="configuration.instrClockOffset"
            joiner="middle"
            :value="+1"
        />
        <configRadio
            title="+2 hours"
            subtitle="Adds two hours to the indicated time."
            v-model="configuration.instrClockOffset"
            joiner="middle"
            :value="+2"
        />
        <configRadio
            title="-1 hour"
            subtitle="Subtracts one hour from the indicated time."
            v-model="configuration.instrClockOffset"
            joiner="middle"
            :value="-1"
        />
        <configRadio
            title="-2 hours"
            subtitle="Subtracts two hours from the indicated time."
            v-model="configuration.instrClockOffset"
            joiner="last"
            :value="-2"
        />

        <v-list-subheader>Startup behavior &amp; power</v-list-subheader>
        <configBool
            title="Indicator self-test"
            subtitle="Simulate a self-test of the indicators when you power up your truck. If disabled, all indicators follow game telemetry data immediately."
            v-model="configuration.instrSelfTest"
        />
        <configBool
            title="Gauge self-test"
            subtitle="Simulate self-test/homing of the gauges when you power up your truck. If disabled, the gauges follow game telemetry data immediately."
            v-model="configuration.instrSelfTestNeedle"
        />
        <configBool
            title="App display startup"
            subtitle="Simulates slow-ish start-up of an operating system running on the display."
            :enabled="configuration.layoutDisplay1Address != '' || configuration.layoutDisplay2Address != ''"
            v-model="configuration.instrDisplayStartup"
        />
        <configBool
            title="App display auto power"
            subtitle="Displays turn on and off automatically when you power your truck on and off. You can always override."
            :enabled="configuration.layoutDisplay1Address != '' || configuration.layoutDisplay2Address != ''"
            v-model="configuration.instrDisplayFollowsTruck"
        />
        <configBool
            title="App display refresh inhibit"
            subtitle="Note that manual power-cycling of a display always reloads the embedded web page."
            :enabled="(configuration.layoutDisplay1Address != '' || configuration.layoutDisplay2Address != '') && configuration.instrDisplayFollowsTruck"
            v-model="configuration.instrDisplayStandby"
        />

        <v-list-subheader>Miscellaneous</v-list-subheader>
        <configBool
            title="Clamp fuel gauge to AdBlue"
            subtitle="When selected and the AdBlue aka exhaust fluid level is lower than the fuel level, the fuel gauge shows the AdBlue level instead of the fuel level."
            v-model="configuration.instrDisplayStandby"
        />
        <configBool
            title="Strict overspeed indicator"
            subtitle="When selected, the tolerance used by the overspeed indicator is 2km/h instead of the default 6km/h."
            v-model="configuration.instrStrictOverspeed"
        />
        <configBool
            title="Flash overspeed indicator"
            subtitle="When selected, the overspeed indicator will flash instead of being on continuously when you're speeding by 3x the tolerance."
            v-model="configuration.instrFlashOverspeed"
        />
        <configBool
            title="Flash rest time indicator"
            subtitle="When selected, the rest time indicator will flash when it reaches zero. If you don't have rest time simulation on in the game, the game will always report zero, so you'll definitely want to disable this then."
            v-model="configuration.instrFlashRestIndicator"
        />

        <v-list-subheader>Reset</v-list-subheader>
        <configReset
            title="Restore default instrument behavior settings"
            subtitle="Click to load default settings for this page."
            @reset="loadDefaults('instr')"
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
            title="Control stalk animations"
            subtitle="Whether to smooth out control stalk and switch movement. This is done via CSS, and is therefore always done at the browser's framerate."
            v-model="configuration.perfAnimateStalks"
        />
        <configBool
            title="Bloom"
            subtitle="Whether to render a glow effect for things that emit light."
            v-model="configuration.perfBloom"
        />
        <configBool
            title="Ambient occlusion"
            subtitle="Whether to add some basic ambient occlusion and shading effects. Note that it's all faked with CSS shadow effects and gradients -- there is no 3D rendering here -- but it's better than nothing IMO."
            v-model="configuration.perfOcclusion"
        />
      </v-list>

      <v-list-subheader>Reset</v-list-subheader>
      <configReset
          title="Restore default performance settings"
          subtitle="Click to load default settings for this page."
          @reset="loadDefaults('perf')"
      />
    </v-tabs-window-item>

    <v-tabs-window-item value="theme">
      <v-list lines="one">
        <v-list-item disabled>Theme</v-list-item>

        <v-list-subheader>Shading</v-list-subheader>
        <configBool
            title="Follow day/night cycle"
            subtitle="Whether instruments will be shaded based on the game's day/night cycle. Light levels are guestimated from time and X coordinate and may be off slightly."
            v-model="configuration.themeShading"
        />
        <configBool
            title="Timezones"
            subtitle="Whether timezones are enabled in the game. When enabled, the sun position in the game also depends on longitude, so we need to correct for that."
            :enabled="configuration.themeShading"
            v-model="configuration.themeShadingTimezones"
        />

        <v-list-subheader>Workspace</v-list-subheader>
        <configBool
            title="Workspace follows background"
            subtitle="Whether the color used between UI components in the layout follows the (shaded) dashboard background color."
            v-model="configuration.themeWorkspaceFollowsBackground"
        />
        <configColor
            title="Workspace color"
            subtitle="The color to use between UI components."
            :enabled="!configuration.themeWorkspaceFollowsBackground"
            v-model="configuration.themeWorkspace"
        />

        <v-list-subheader>Diffuse colors</v-list-subheader>
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

        <v-list-subheader>Emission colors</v-list-subheader>
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

        <v-list-subheader>Reset</v-list-subheader>
        <configReset
            title="Restore default theme"
            subtitle="Click to load default theme data."
            @reset="loadDefaults('theme')"
        />

      </v-list>
    </v-tabs-window-item>
  </v-tabs-window>
</template>

<style scoped>

</style>