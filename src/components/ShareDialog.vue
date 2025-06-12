<template>
  <q-dialog v-model="isOpen">
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">Share Your Map and Statistics</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-toggle
          v-model="sharingEnabled"
          label="Enable sharing"
          @update:model-value="toggleSharing"
        />

        <div v-if="sharingEnabled" class="q-mt-md">
          <p class="text-caption">Your sharing link:</p>
          <q-input readonly :model-value="shareUrl" stack-label>
            <template v-slot:append>
              <q-btn flat round icon="content_copy" @click="copyToClipboard" />
            </template>
          </q-input>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Close" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useFirestoreStore } from 'stores/firestore';
import { useQuasar } from 'quasar';

export default defineComponent({
  name: 'ShareDialog',
  props: {
    modelValue: Boolean,
    userId: {
      type: String,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const firestoreStore = useFirestoreStore();
    const $q = useQuasar();

    const isOpen = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value),
    });

    const sharingEnabled = computed(
      () => firestoreStore.currentUser?.sharingEnabled || false
    );

    const shareUrl = computed(() => {
      if (!firestoreStore.currentUser?.shareCode) {
        return '';
      }
      return `${window.location.origin}/#/share/${firestoreStore.currentUser.shareCode}`;
    });

    const toggleSharing = async (enabled: boolean) => {
      if (!firestoreStore.currentUser) return;

      await firestoreStore.updateUser({
        ...firestoreStore.currentUser,
        sharingEnabled: enabled,
      });
    };

    const copyToClipboard = () => {
      navigator.clipboard.writeText(shareUrl.value);
      $q.notify({
        message: 'Share link copied to clipboard',
        color: 'positive',
      });
    };

    return {
      isOpen,
      sharingEnabled,
      shareUrl,
      toggleSharing,
      copyToClipboard,
    };
  },
});
</script>
