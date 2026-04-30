<script setup lang="ts">
import configDialog from "~/components/configDialog.vue";
import {validateDisplayUrl} from "~/misc/displayUrl";

defineProps(["title", "subtitle"]);
const model = defineModel<string>({ required: true });

const dialogActive = ref(false);
const enteredUrl = ref("")

function click() {
  enteredUrl.value = model.value;
  dialogActive.value = true;
}

async function submit(event: any) {
  const results = await event;
  if (results.valid) {
    model.value = enteredUrl.value;
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
      :value="model"
      @click="click"
  >
    <template v-slot:prepend>
      <v-icon v-if="model">mdi-checkbox-intermediate</v-icon>
      <v-icon v-else>mdi-checkbox-blank-outline</v-icon>
    </template>
    <template v-slot:default="{ isActive }">
      <v-form validate-on="submit lazy" @submit.prevent="submit">
        <v-card-text>
          <div class="text-body-medium text-medium-emphasis mb-4">
            Enter the address of the web app you want to embed. This can be a full
            address, or just the port (and possibly path) of another app running in
            TruckTel, or at least on the computer that the game is running on, e.g.
            <span class="text-high-emphasis ">:30001</span>.
          </div>
          <v-spacer></v-spacer>
          <v-text-field
              v-model="enteredUrl"
              :rules="rules"
              label="Address"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
              text="Cancel"
              @click="isActive.value = false"
          ></v-btn>
          <v-btn
              text="Disable"
              @click="isActive.value = false; model = ''"
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
