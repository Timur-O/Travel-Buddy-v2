<template>
  <q-page>
    <LeafletMap
      :key="mapKey"
      :countries="countries"
      :user-data="userData"
      @country-click="handleCountryClick"
    />
    <CountryInfoOverlay
      v-if="selectedCountry"
      :key="selectedCountry.id"
      :country="selectedCountry"
      @close="clearSelectedCountry"
    />

    <q-page-sticky class="sticky_button" position="bottom" :offset="[0, 18]">
      <q-btn fab icon="share" color="primary" @click="showShareDialog = true" />
    </q-page-sticky>

    <ShareDialog v-model="showShareDialog" :user-id="authStore.authUser!.uid" />
  </q-page>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, shallowRef, ref } from 'vue';
import LeafletMap from 'components/LeafletMap.vue';
import CountryInfoOverlay from 'components/CountryInfoOverlay.vue';
import ShareDialog from 'components/ShareDialog.vue'; // Add this import
import { useFirestoreStore } from 'stores/firestore';
import { filterCountries } from 'src/utils/HelperFunctions';
import { useAuthStore } from 'stores/auth';
import { Country } from 'src/models';

export default defineComponent({
  name: 'MapPage',
  components: { LeafletMap, CountryInfoOverlay, ShareDialog },

  setup() {
    const firestoreStore = useFirestoreStore();
    const authStore = useAuthStore();
    const selectedCountry = shallowRef<Country | null>(null);
    const mapKey = ref(0);
    const showShareDialog = ref(false);

    const countries = computed(() => {
      return filterCountries(
        firestoreStore.countries,
        firestoreStore.groups,
        firestoreStore.userData
      );
    });

    const userData = computed(() => firestoreStore.userData);

    onMounted(async () => {
      try {
        await Promise.all([
          firestoreStore.fetchCountries(),
          firestoreStore.fetchGroups(),
          firestoreStore.fetchUserData(authStore.authUser!.uid),
        ]);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    });

    const handleCountryClick = (countryId: string) => {
      selectedCountry.value =
        countries.value.find((c) => c.id === countryId) || null;
    };

    const clearSelectedCountry = () => {
      selectedCountry.value = null;
    };

    const refreshMap = () => {
      mapKey.value++;
    };

    return {
      countries,
      userData,
      selectedCountry,
      handleCountryClick,
      clearSelectedCountry,
      mapKey,
      refreshMap,
      authStore,
      showShareDialog,
    };
  },
});
</script>

<style lang="scss" scoped>
.q-page {
  background-color: $bg;
  min-height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;

  :deep(.leaflet-container) {
    background-color: $bg;
  }

  :deep(.leaflet-popup-content-wrapper) {
    background-color: $bg;
    color: white;
    border: 2px solid $secondary;
  }

  :deep(.leaflet-popup-tip) {
    background-color: $bg;
    border: 1px solid $secondary;
  }
}

.sticky_button {
  z-index: 1;
}
</style>
