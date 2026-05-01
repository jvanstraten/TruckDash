<script setup lang="ts">

import uiContainer from "~/components/uiContainer.vue";
import instrumentCluster from "~/components/instrumentCluster.vue";

import { useGlobals } from "~/composables/globals";
import { useInstruments } from "~/composables/instruments";
import { useShading } from "~/composables/shading";
import { useGestureDetection, type GestureData } from "~/composables/gestureDetection";

const {
  adjust,
  mapping,
} = defineProps<{
  adjust: boolean,
  mapping: boolean,
}>();
const emit = defineEmits(["menu"]);

const { configuration, gameState, gameSocket } = useGlobals();
const { instruments } = useInstruments(gameState, configuration);
const { shading } = useShading(gameState, instruments, configuration);



// stalkConfiguration
type StalkAxisType = "lowBeam" | "highBeam" | "blinkers" | "wipers"
    | "transPaddle" | "transBrake" | "transDirection" | "transMode";

type StalkAxis = {
  type: StalkAxisType;
  invert: boolean;
};

type StalkAxes = {
  moveX: StalkAxis;
  moveY: StalkAxis;
  swX: StalkAxis;
  swY: StalkAxis;
};

function getUtilityStalkAxes(): StalkAxes {
  const config = configuration.value;
  return {
    moveX: { type: "highBeam", invert: config.stalkInvertHighBeam },
    moveY: { type: "blinkers", invert: config.stalkSwap == "lhd" },
    swX: { type: "lowBeam", invert: config.stalkInvertLowBeam },
    swY: { type: "wipers", invert: config.stalkInvertWipers },
  };
}

function getTransStalkAxes(): StalkAxes {
  const config = configuration.value;
  const transBrake: StalkAxis = { type: "transBrake", invert: config.stalkInvertTransBrake };
  const transPaddle: StalkAxis = { type: "transPaddle", invert: config.stalkInvertTransPaddle };
  const transMode: StalkAxis = { type: "transMode", invert: config.stalkInvertTransMode };
  const transDirection: StalkAxis = { type: "transDirection", invert: config.stalkInvertTransDirection };

  return {
    moveX: config.stalkSwapPaddleBrake ? transPaddle : transBrake,
    moveY: config.stalkSwapPaddleBrake ? transBrake : transPaddle,
    swX: config.stalkSwapModeDirection ? transDirection : transMode,
    swY: config.stalkSwapModeDirection ? transMode : transDirection,
  };
}

const leftStalkAxes = computed<StalkAxes>(() => {
  if (configuration.value.stalkSwap == "lhd") {
    return getUtilityStalkAxes();
  } else {
    return getTransStalkAxes();
  }
});

const rightStalkAxes = computed<StalkAxes>(() => {
  if (configuration.value.stalkSwap == "lhd") {
    return getTransStalkAxes();
  } else {
    return getUtilityStalkAxes();
  }
});





// gestureInput

type StalkAxisDirection = "inc" | "dec";
type ControlAction = "layer" | "menu" | [StalkAxisType, StalkAxisDirection] | undefined;
type SwipeZoneMapping = {
  left: ControlAction;
  right: ControlAction;
  up: ControlAction;
  down: ControlAction;
};
type StalkMapping = {
  outboard: ControlAction;
  inboard: ControlAction;
  up: ControlAction;
  down: ControlAction;
};
type StalkLayers = {
  move: StalkMapping;
  sw: StalkMapping;
}
type GestureMapping = {
  zones: SwipeZoneMapping[];
  click: ControlAction;
  hold: ControlAction;
};

const controlLayer = ref<number>(0);
const controlLayerTimer = ref<number | undefined>(undefined);
const gestureHistory = ref<Object[]>([]);

function stopControlLayerTimer() {
  if (controlLayerTimer.value !== undefined) {
    window.clearTimeout(controlLayerTimer.value);
    controlLayerTimer.value = undefined;
  }
}

function resetControlLayer() {
  stopControlLayerTimer();
  if (mapping && controlLayer.value != 0) {
    gestureHistory.value.push({
      text: "Control layer reset by timer",
      color: "default",
    });
  }
  controlLayer.value = 0;
}

function startControlLayerTimer() {
  stopControlLayerTimer();
  controlLayerTimer.value = window.setTimeout(() => resetControlLayer(), 1000);
}

function describeActionWithIcons(action: ControlAction): string[] {
  if (action === undefined) return ["minus"];
  if (action === "layer") return ["layers-plus"];
  if (action === "menu") return ["menu"];
  return {
    lowBeam: {
      inc: ["car-light-dimmed", "plus"],
      dec: ["car-light-dimmed", "minus"],
    },
    highBeam: {
      inc: ["car-light-high", "numeric-1"],
      dec: ["car-light-high", "numeric-0"],
    },
    blinkers: {
      inc: ["arrow-left-bold"],
      dec: ["arrow-right-bold"],
    },
    wipers: {
      inc: ["wiper", "plus"],
      dec: ["wiper", "minus"],
    },
    transPaddle: {
      inc: ["cog-box", "plus"],
      dec: ["cog-box", "minus"],
    },
    transBrake: {
      inc: ["car-brake-retarder", "plus"],
      dec: ["car-brake-retarder", "minus"],
    },
    transDirection: {
      inc: ["cog-box", "alpha-d"],
      dec: ["cog-box", "alpha-r"],
    },
    transMode: {
      inc: ["cog-box", "alpha-a"],
      dec: ["cog-box", "alpha-m"],
    },
  }[action[0]][action[1]];
}

function describeActionWithText(action: ControlAction): string {
  if (action === undefined) return "not mapped";
  if (action === "layer") return "next control layer";
  if (action === "menu") return "open menu";
  return {
    lowBeam: {
      inc: "increase low beams",
      dec: "decrease low beams",
    },
    highBeam: {
      inc: "turn on high beams",
      dec: "turn off high beams",
    },
    blinkers: {
      inc: "enable left blinkers",
      dec: "enable right blinkers",
    },
    wipers: {
      inc: "increase wiper setting",
      dec: "decrease wiper setting",
    },
    transPaddle: {
      inc: "gear up",
      dec: "gear down",
    },
    transBrake: {
      inc: "retarder/engine brake up",
      dec: "retarder/engine brake down",
    },
    transDirection: {
      inc: "transmission toward drive",
      dec: "transmission toward reverse",
    },
    transMode: {
      inc: "automatic transmission",
      dec: "manual transmission",
    },
  }[action[0]][action[1]];
}

function expandStalkAxesToLayers(axes: StalkAxes): StalkLayers {
  return {
    move: {
      outboard: [axes.moveX.type, axes.moveX.invert ? "dec" : "inc"],
      inboard: [axes.moveX.type, axes.moveX.invert ? "inc" : "dec"],
      up: [axes.moveY.type, axes.moveY.invert ? "dec" : "inc"],
      down: [axes.moveY.type, axes.moveY.invert ? "inc" : "dec"],
    },
    sw: {
      outboard: [axes.swX.type, axes.swX.invert ? "dec" : "inc"],
      inboard: [axes.swX.type, axes.swX.invert ? "inc" : "dec"],
      up: [axes.swY.type, axes.swY.invert ? "dec" : "inc"],
      down: [axes.swY.type, axes.swY.invert ? "inc" : "dec"],
    }
  };
}

function convertStalkToSwipeMapping(stalk: StalkMapping, side: "L"|"R"): SwipeZoneMapping {
  return {
    left: side == "L" ? stalk.outboard : stalk.inboard,
    right: side == "L" ? stalk.inboard : stalk.outboard,
    up: stalk.up,
    down: stalk.down,
  };
}

function convertStalkToSwipeZones(layers: StalkLayers, side: "L"|"R"): SwipeZoneMapping[] {
  const move = convertStalkToSwipeMapping(layers.move, side);
  const sw = convertStalkToSwipeMapping(layers.sw, side);

  let mappings = [sw, move];
  switch (configuration.value.stalkGestureSwitches) {
    case "outer":
      break;
    case "inner":
      mappings.reverse();
      break;
    case "click":
      if (controlLayer.value % 2 == 0) {
        mappings = [mappings[1]!];
      } else {
        mappings = [mappings[0]!];
      }
      break;
  }
  if (side == "R") mappings.reverse();
  return mappings;
}

const controlActions = computed<GestureMapping>(() => {
  let mapping: GestureMapping = {
    zones: [],
    click: undefined,
    hold: undefined
  };

  const config = configuration.value;
  const stalks = config.stalkGestureMode;
  if (stalks == "bothStalks" || stalks == "leftStalk") {
    const axes = leftStalkAxes.value;
    const layers = expandStalkAxesToLayers(axes);
    const zones = convertStalkToSwipeZones(layers, "L");
    mapping.zones.push(...zones);
  }
  if (stalks == "bothStalks" || stalks == "rightStalk") {
    const axes = rightStalkAxes.value;
    const layers = expandStalkAxesToLayers(axes);
    const zones = convertStalkToSwipeZones(layers, "R");
    mapping.zones.push(...zones);
  }

  // Click enters menu unless it's used for layers.
  if (!configuration.value.stalkHoldForMenu) {
    mapping.click = "menu";
  }
  if (configuration.value.stalkGestureSwitches == "click") {
    if (configuration.value.stalkHoldForMenu || controlLayer.value == 0) {
      mapping.click = "layer";
    }
  }

  // Hold always enters menu.
  mapping.hold = "menu";

  return mapping;
});

function onGesture(data: GestureData) {
  // Override all gesture behavior if the UI is being adjusted.
  if (adjust) {
    if (data.type == "click") {
      emit("menu");
    }
    return;
  }

  // Determine the action based on the current input mapping.
  let action: ControlAction = undefined;
  const actions = controlActions.value;
  let zoneIndex: number = 0;
  if (data.type == "click") {
    action = actions.click;
  } else if (data.type == "hold") {
    action = actions.hold;
  } else if (actions.zones.length > 0) {
    zoneIndex = Math.floor(data.startX! * actions.zones.length);
    const zone = actions.zones[zoneIndex]!;
    action = zone[data.type];
  }

  // Display test messages when mapping is active.
  if (mapping) {
    const gesture = {
      click: "Tap",
      hold: "Hold",
      left: `Swipe left in zone ${zoneIndex + 1}`,
      right: `Swipe right in zone ${zoneIndex + 1}`,
      up: `Swipe up in zone ${zoneIndex + 1}`,
      down: `Swipe down in zone ${zoneIndex + 1}`,
    }[data.type];
    const result = describeActionWithText(action);
    let color = "info";
    if (action === undefined) {
      color = "error";
    } else if (action == "layer" || action == "menu") {
      color = "default";
    }
    gestureHistory.value.push({
      text: `${gesture}: ${result}`,
      color: color,
    });
  }

  // Handle click count.
  if (action == "layer") {
    controlLayer.value++;
  }
  startControlLayerTimer();

  // Handle menu.
  if (action == "menu") {
    emit("menu");
    return;
  }

  // Don't actually send events to the game when mapping is active.
  if (mapping) {
    return;
  }

  // TODO send input to game...
}

const gestures = useGestureDetection(onGesture);

</script>

<template>
  <div
      class="workspace"
      :style="{'background-color': configuration.themeWorkspaceFollowsBackground ? shading.background : configuration.themeWorkspace}"
      @pointerdown="gestures.onPointerDown"
      @pointermove="gestures.onPointerMove"
      @click="gestures.onClick"
  >
    <ui-container
        :adjust="adjust"
        v-if="configuration.layoutInstrumentsEnabled"
        v-model="configuration.layoutInstrumentsPosition"
        :aspect="13/6"
    >
      <instrument-cluster
          :configuration="configuration"
          :instruments="instruments"
          :shading="shading"
      />
    </ui-container>

    <ui-container
        :adjust="adjust"
        v-if="configuration.layoutDisplay1Address"
        v-model="configuration.layoutDisplay1Position"
    >
      <display
          :address="configuration.layoutDisplay1Address"
          :zoom="configuration.layoutDisplay1Zoom"
          :configuration="configuration"
          :gameState="gameState"
          :shading="shading"
      />
    </ui-container>

    <ui-container
        :adjust="adjust"
        v-if="configuration.layoutDisplay2Address"
        v-model="configuration.layoutDisplay2Position"
    >
      <display
          :address="configuration.layoutDisplay2Address"
          :zoom="configuration.layoutDisplay2Zoom"
          :configuration="configuration"
          :gameState="gameState"
          :shading="shading"
      />
    </ui-container>

    <div v-if="mapping" class="workspace-gesture-zones" :style="{'grid-template-columns': `repeat(${controlActions.zones.length}, auto)`}">
      <div v-for="[index, zone] in controlActions.zones.entries()" class="workspace-gesture-zone">
        <span class="workspace-gesture-zone-header">Swipe zone {{ index + 1 }}</span>
        <div class="workspace-gesture-zone-directions">
          <div style="grid-area: 4 / 4 / 5 / 5"><v-icon size="2.5vw" color="#FFF8">mdi-gesture-tap-hold</v-icon></div>
          <div style="grid-area: 3 / 4 / 4 / 5"><v-icon size="2vw" color="#FFF8">mdi-arrow-up</v-icon></div>
          <div style="grid-area: 5 / 4 / 6 / 5"><v-icon size="2vw" color="#FFF8">mdi-arrow-down</v-icon></div>
          <div style="grid-area: 4 / 3 / 5 / 4"><v-icon size="2vw" color="#FFF8">mdi-arrow-left</v-icon></div>
          <div style="grid-area: 4 / 5 / 5 / 6"><v-icon size="2vw" color="#FFF8">mdi-arrow-right</v-icon></div>
          <div style="grid-area: 1 / 3 / 3 / 6">
            <v-icon v-for="icon in describeActionWithIcons(zone.up)" size="2.5vw">mdi-{{icon}}</v-icon>
          </div>
          <div style="grid-area: 6 / 3 / 8 / 6">
            <v-icon v-for="icon in describeActionWithIcons(zone.down)" size="2.5vw">mdi-{{icon}}</v-icon>
          </div>
          <div style="grid-area: 3 / 1 / 6 / 3; flex-direction: column">
            <v-icon v-for="icon in describeActionWithIcons(zone.left)" size="2.5vw">mdi-{{icon}}</v-icon>
          </div>
          <div style="grid-area: 3 / 6 / 6 / 8; flex-direction: column">
            <v-icon v-for="icon in describeActionWithIcons(zone.right)" size="2.5vw">mdi-{{icon}}</v-icon>
          </div>
        </div>
      </div>
    </div>

    <div v-if="mapping" class="workspace-click-actions">
      <div class="workspace-click-cell" style="grid-area: 1 / 1 / 2 / 2">
        <v-icon size="2.5vw" color="#FFF8">mdi-gesture-tap</v-icon>
        <v-icon v-for="icon in describeActionWithIcons(controlActions.click)" size="2.5vw">mdi-{{icon}}</v-icon>
      </div>
      <div class="workspace-click-cell" style="grid-area: 1 / 2 / 2 / 3">
        Anywhere
      </div>
      <div class="workspace-click-cell" style="grid-area: 1 / 3 / 2 / 4">
        <v-icon size="2.5vw" color="#FFF8">mdi-gesture-tap-hold</v-icon>
        <v-icon v-for="icon in describeActionWithIcons(controlActions.hold)" size="2.5vw">mdi-{{icon}}</v-icon>
      </div>
    </div>

    <v-snackbar-queue
        v-model="gestureHistory"
        close-delay="2000"
        location="bottom end"
        display-strategy="overflow"
        :total-visible="3"
    />
  </div>

</template>

<style scoped>

.workspace {
  background-color: #000;
  overflow: hidden;
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  touch-action: none;
  user-select: none;
}

.workspace-gesture-zones {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  display: grid;
  grid-template-rows: repeat(1, auto);
}

.workspace-gesture-zone {
  background-color: #4448;
  margin: 1vmin;
  border-radius: 2vmin;
  border: 0.1vmin solid white;
  position: relative;
}

.workspace-gesture-zone-header {
  position: absolute;
  left: 0;
  right: 0;
  top: 2vw;
  height: 3vw;
  color: white;
  font-size: 2vw;
  text-align: center;
  filter: drop-shadow(0 0px 2px black);
}

.workspace-gesture-zone-directions {
  position: absolute;
  left: 50%;
  top: 8vw;
  width: 20vw;
  height: 20vw;
  translate: -50% 0;
  background: none;
  border: none;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(7, 1fr);
}

.workspace-gesture-zone-directions div {
  display: flex;
  justify-content: center;
  align-items: center;
}

.workspace-click-actions {
  position: absolute;
  left: 30vw;
  height: 5vw;
  right: 30vw;
  bottom: 0;
  background-color: #444;
  border-radius: 2vmin 2vmin 0 0;
  border: 0.1vmin solid white;
  border-bottom: none;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(1, 1fr);
}

.workspace-click-cell {
  font-size: 2vw;
  display: flex;
  justify-content: center;
  align-items: center;
}

</style>