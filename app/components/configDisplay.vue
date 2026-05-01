<script setup lang="ts">
import configDialog from "~/components/configDialog.vue";
import {validateDisplayUrl} from "~/misc/displayUrl";

defineProps(["title", "subtitle"]);
const address = defineModel<string>("address", { required: true });
const zoom = defineModel<number>("zoom", { required: true });

const dialogActive = ref(false);
const enteredUrl = ref("");

function activate() {
  enteredUrl.value = address.value;
  dialogActive.value = true;
}

async function submit(event: any) {
  const results = await event;
  if (results.valid) {
    address.value = enteredUrl.value;
    dialogActive.value = false;
  }
}

const rules = [
  (value: string) => {
    const result = validateDisplayUrl(value);
    if (result.valid) return true;
    if (result.suggestion !== undefined) enteredUrl.value = result.suggestion;
    return result.message!;
  },
]
</script>

<template>

  <configDialog
      :title="title"
      :subtitle="subtitle"
      :value="address"
      v-model="dialogActive"
      @activate="activate"
  >
    <template v-slot:prepend>
      <v-icon v-if="address">mdi-checkbox-intermediate</v-icon>
      <v-icon v-else>mdi-checkbox-blank-outline</v-icon>
    </template>
    <template v-slot:default="{ isActive }">
      <v-form validate-on="submit lazy" @submit.prevent="submit">
        <v-card-text style="margin-top: -2em">
          <p class="text-medium-emphasis">
            Enter the address of the web app you want to embed. This can be a full
            address, or just the port (and possibly path) of another app running in
            TruckTel, or at least on the computer that the game is running on, e.g.
            <span class="text-high-emphasis ">:30001</span>.
          </p>
          <v-text-field
              v-model="enteredUrl"
              :rules="rules"
              label="Address"
          ></v-text-field>
          <p class="text-medium-emphasis">
            By default, the embedded page is rendered as it would be if it filled
            the screen of your device (or your browser window), and then scaled to
            fit the display. You can add an additional scale factor below.
          </p>
          <v-slider
              min="-2"
              max="2"
              v-model="zoom"
              thumb-label="hover"
              label="Zoom"
          >
            <template v-slot:thumb-label="{ modelValue }">
              {{ Math.round(Math.pow(2, modelValue) * 100) }}%
            </template>
          </v-slider>
          <v-spacer></v-spacer>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
              text="Cancel"
              @click="isActive.value = false"
          ></v-btn>
          <v-btn
              text="Disable"
              @click="isActive.value = false; address = ''"
          ></v-btn>
          <v-btn
              text="Enable"
              type="submit"
          ></v-btn>
        </v-card-actions>
      </v-form>
    </template>
  </configDialog>

</template>
