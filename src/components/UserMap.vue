<template>
  <div class="user-map">
    <LeafletMap
      :key="mapKey"
      :countries="countries"
      :user-data="userData"
      @country-click="handleCountryClick"
    />

    <q-card class="filter-card">
      <q-card-section class="filter-header">
        <div class="row items-center justify-between">
          <div class="text-h6">Filters</div>
          <q-btn
            flat
            round
            dense
            :icon="isFiltersExpanded ? 'expand_more' : 'expand_less'"
            @click="isFiltersExpanded = !isFiltersExpanded"
          />
        </div>
      </q-card-section>

      <q-slide-transition>
        <q-card-section v-show="isFiltersExpanded">
          <q-input
            v-model="searchQuery"
            dense
            standout
            placeholder="Search countries..."
            class="q-mb-md"
          >
            <template #append>
              <q-icon name="search" />
            </template>
          </q-input>

          <q-separator spaced />

          <div class="text-subtitle2 q-mb-sm">Status Filter</div>
          <q-option-group
            :options="mappedUserStatus"
            type="checkbox"
            v-model="selectedStatus"
          />

          <q-separator spaced />

          <div class="text-subtitle2 q-mb-sm">Region Filter</div>
          <q-option-group
            :options="mappedRegions"
            type="checkbox"
            v-model="selectedRegions"
          />

          <q-separator spaced />

          <div class="text-subtitle2 q-mb-sm">Sovereignty Filter</div>
          <q-option-group
            :options="mappedSovereignties"
            type="checkbox"
            v-model="selectedSovereignties"
          />
        </q-card-section>
      </q-slide-transition>
    </q-card>

    <CountryInfoOverlay
      v-if="selectedCountry"
      :key="selectedCountry.id"
      :country="selectedCountry"
      :shareMode="true"
      @close="clearSelectedCountry"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, shallowRef, ref } from 'vue';
import LeafletMap from './LeafletMap.vue';
import CountryInfoOverlay from './CountryInfoOverlay.vue';
import { useFirestoreStore } from 'stores/firestore';
import { useFiltersStore } from 'stores/filters';
import { filterCountries } from 'src/utils/HelperFunctions';
import { Country, GroupType, VisitStatus } from 'src/models';

export default defineComponent({
  name: 'UserMap',
  components: { LeafletMap, CountryInfoOverlay },
  props: {
    userId: {
      type: String,
      required: true,
    },
  },

  setup(props) {
    const firestoreStore = useFirestoreStore();
    const filtersStore = useFiltersStore();
    const selectedCountry = shallowRef<Country | null>(null);
    const mapKey = ref(0);
    const groups = ref<Array<{ id: string; name: string; type: GroupType }>>(
      []
    );
    const isFiltersExpanded = ref(false);

    const countries = computed(() => {
      return filterCountries(
        firestoreStore.countries,
        firestoreStore.groups,
        firestoreStore.userData
      );
    });

    const userData = computed(() => firestoreStore.userData);

    const mappedRegions = computed(() =>
      groups.value
        .filter((g) => g.type === GroupType.Region)
        .map((group) => ({
          label: group.name,
          value: group.id,
        }))
    );

    const mappedSovereignties = computed(() =>
      groups.value
        .filter((g) => g.type === GroupType.Sovereignty)
        .map((group) => ({
          label: group.name,
          value: group.id,
        }))
    );

    onMounted(async () => {
      try {
        await Promise.all([
          firestoreStore.fetchCountries(),
          firestoreStore.fetchGroups(),
          firestoreStore.fetchUserData(props.userId),
        ]);
        groups.value = firestoreStore.groups;
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

    return {
      countries,
      userData,
      selectedCountry,
      handleCountryClick,
      clearSelectedCountry,
      mapKey,
      searchQuery: computed({
        get: () => filtersStore.searchQuery,
        set: (val) => (filtersStore.searchQuery = val),
      }),
      selectedStatus: computed({
        get: () => filtersStore.getSelectedUserStatus,
        set: (val) => filtersStore.setSelectedUserStatus(val),
      }),
      selectedRegions: computed({
        get: () => filtersStore.getSelectedRegions,
        set: (val) => filtersStore.setSelectedRegions(val),
      }),
      selectedSovereignties: computed({
        get: () => filtersStore.getSelectedSovereignties,
        set: (val) => filtersStore.setSelectedSovereignties(val),
      }),
      mappedUserStatus: Object.values(VisitStatus).map((status) => ({
        label: status,
        value: status,
      })),
      mappedRegions,
      mappedSovereignties,
      isFiltersExpanded,
    };
  },
});
</script>

<style lang="scss" scoped>
.user-map {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: $bg;

  .filter-card {
    position: absolute;
    bottom: 40px;
    left: 20px;
    z-index: 1000;
    width: 300px;
    max-height: 90vh;
    background: rgba($bg, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid $bg_shade;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

    .filter-header {
      padding-bottom: 4px;
    }

    &:not(.expanded) {
      .filter-header {
        padding-bottom: 12px;
      }
    }

    :deep(.q-card__section) {
      padding: 12px;
    }

    :deep(.q-option-group) {
      max-height: 150px;
      overflow-y: auto;

      .q-checkbox {
        margin: 4px 0;
        min-height: 28px;
      }
    }

    .text-h6 {
      margin-bottom: 8px;
      font-size: 1rem;
    }

    .text-subtitle2 {
      margin: 4px 0;
      font-size: 0.9rem;
    }

    .q-separator {
      margin: 8px 0;
    }
  }

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
</style>
