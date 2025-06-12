<template>
  <canvas id="confetti-canvas"></canvas>
  <router-view v-memo="[]" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'App',
  setup() {
    return {};
  },
});
</script>

<style scoped>
#confetti-canvas {
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 2;
  width: 100%;
  height: 100%;
  will-change: transform;
  contain: strict;
}
</style>
