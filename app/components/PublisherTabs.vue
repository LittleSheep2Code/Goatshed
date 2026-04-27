<template>
  <div class="tabs tabs-box bg-base-200/70 p-1">
    <button
      v-for="item in publishers"
      :key="item"
      class="tab"
      :class="active === item ? 'tab-active' : ''"
      @click="$emit('change', item)"
    >
      {{ item }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { PublisherName } from "~/constants/publishers";

defineProps<{
  publishers: readonly PublisherName[];
  active: PublisherName;
}>();

defineEmits<{
  change: [value: PublisherName];
}>();
</script>
