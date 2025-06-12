<template>
  <div class="country-info-overlay" :class="{ mobile: $q.screen.lt.sm }">
    <country-card
      v-if="country"
      :country="country"
      :force-simple-mode="true"
      :shareMode="props.shareMode"
    >
      <template #actions>
        <q-separator />
        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" @click="$emit('close')" />
        </q-card-actions>
      </template>
    </country-card>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import CountryCard from './CountryCard.vue';
import { Country } from 'src/models';

export default defineComponent({
  name: 'CountryInfoOverlay',
  components: {
    CountryCard,
  },
  props: {
    country: {
      type: Object as () => Country,
      required: true,
    },
    shareMode: {
      type: Boolean,
      default: false,
    },
  },
  inheritAttrs: false,

  setup(props) {
    return {
      props,
    };
  },
});
</script>

<style lang="scss" scoped>
.country-info-overlay {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  will-change: transform;
  contain: content;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 5px;
}

.country-info-overlay.mobile {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

.country-info-overlay.mobile :deep(.q-card) {
  max-width: 100%;
  width: 100%;
  border-radius: 16px 16px 0 0;
  margin: 0;
  height: auto;
  max-height: 80vh;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

:deep(.q-card) {
  max-width: 400px;
  width: 300px;
  transform: translateY(0);
  will-change: transform;
  backface-visibility: hidden;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba($secondary, 0.1);
  margin-bottom: 5px;
}

:deep(.q-card:hover) {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba($secondary, 0.15);
  border-color: rgba($secondary, 0.3);
}
</style>
