<template>
  <div class="fluid-wave" aria-hidden="true">
    <svg viewBox="0 24 150 28" preserveAspectRatio="none">
      <defs>
        <path
          :id="wavePathId"
          d="m -160,44.4 c 30,0 58,-18 87.7,-18 30.3,0 58.3,18 87.3,18 30,0 58,-18 88,-18 30,0 58,18 88,18 l 0,34.5 -351,0 z"
        />
      </defs>
      <g>
        <use
          v-for="(offset, index) in LAYER_OFFSETS"
          :key="index"
          :href="`#${wavePathId}`"
          :y="offset"
          x="50"
          class="fluid-wave-layer"
        />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
const LAYER_OFFSETS = [0, 3, 6] as const;

const wavePathId = `fluid-wave-${useId()}`;
</script>

<style scoped>
/*
  Sits at the bottom edge of its container and is filled with the surface *below* that container,
  so the lower surface reads as liquid rising into the cover.
*/
.fluid-wave {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  margin: 0;
  height: var(--wave-height, 5rem);
  pointer-events: none;
}

.fluid-wave svg {
  display: block;
  width: 100%;
  height: 100%;
}

.fluid-wave-layer {
  fill: var(--wave-surface, var(--color-base-200));
  animation: fluid-wave-drift 12s linear infinite;
}

.fluid-wave-layer:nth-child(1) {
  animation-delay: -2s;
  opacity: 0.45;
}

.fluid-wave-layer:nth-child(2) {
  animation-delay: -3s;
  animation-duration: 7s;
  opacity: 0.7;
}

.fluid-wave-layer:nth-child(3) {
  animation-delay: -4s;
  animation-duration: 4s;
}

@keyframes fluid-wave-drift {
  from {
    transform: translateX(-90px);
  }
  to {
    transform: translateX(85px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .fluid-wave-layer {
    animation: none;
  }
}
</style>
