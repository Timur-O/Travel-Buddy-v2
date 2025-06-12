<template>
  <q-page padding class="modern-list-page">
    <div v-for="region in regionGroups" :key="region.id" class="q-mb-lg">
      <q-card
        flat
        bordered
        class="region-card q-mb-md"
        :class="{ collapsed: !expandedRegions[region.id] }"
      >
        <q-card-section
          class="cursor-pointer region-header"
          @click="toggleRegion(region.id)"
        >
          <div class="row items-center">
            <div class="text-h6 col region-title">{{ region.name }}</div>
            <q-btn
              flat
              round
              :icon="expandedRegions[region.id] ? 'expand_less' : 'expand_more'"
              class="expand-button"
            />
          </div>
        </q-card-section>

        <q-slide-transition>
          <q-card-section
            v-show="expandedRegions[region.id]"
            class="region-content"
          >
            <div class="row q-col-gutter-md">
              <template
                v-for="country in regionCountriesMap[region.id]"
                :key="country.id"
              >
                <div class="col-12 col-sm-6 col-md-4">
                  <country-card :country="country" />
                </div>
              </template>
            </div>
          </q-card-section>
        </q-slide-transition>
      </q-card>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, computed, onMounted, ref, watchEffect } from 'vue';
import { useFirestoreStore } from 'stores/firestore';
import { storeToRefs } from 'pinia';
import { useAuthStore } from 'stores/auth';
import { Country, GroupType } from 'src/models';
import CountryCard from 'components/CountryCard.vue';
import { filterCountries } from 'src/utils/HelperFunctions';

export default defineComponent({
  name: 'ListPage',
  components: {
    CountryCard,
  },
  setup() {
    const firestore = useFirestoreStore();
    const authStore = useAuthStore();
    const { groups, countries, userData } = storeToRefs(firestore);
    const expandedRegions = ref<Record<string, boolean>>({});

    const filteredCountries = computed(() =>
      filterCountries(countries.value, groups.value, userData.value)
    );

    const regionGroups = computed(() =>
      groups.value.filter((g) => g.type === GroupType.Region)
    );

    const regionCountriesMap = computed(() => {
      const map: Record<string, Country[]> = {};
      regionGroups.value.forEach((region) => {
        map[region.id] = filteredCountries.value.filter((country) =>
          region.countries?.includes(country.id)
        );
      });
      return map;
    });

    const toggleRegion = (regionId: string) => {
      expandedRegions.value[regionId] = !expandedRegions.value[regionId];
    };

    onMounted(async () => {
      await Promise.all([
        firestore.fetchGroups(),
        firestore.fetchCountries(),
        authStore.authUser && firestore.fetchUserData(authStore.authUser.uid),
      ]);
    });

    watchEffect(() => {
      regionGroups.value.forEach((region) => {
        if (expandedRegions.value[region.id] === undefined) {
          expandedRegions.value[region.id] =
            regionCountriesMap.value[region.id]?.length > 0;
        }
      });
    });

    return {
      regionGroups,
      expandedRegions,
      toggleRegion,
      regionCountriesMap,
    };
  },
});
</script>

<style lang="scss" scoped>
.modern-list-page {
  background: $bg_shade;
  min-height: 100vh;
}

.region-card {
  background: $bg;
  border-radius: 16px;
  border: none;
  box-shadow: 0 4px 16px rgba($secondary, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
  will-change: transform, box-shadow;
}

.region-header {
  background: $warning_light;
  border-bottom: 1px solid $secondary;
  padding: 16px 20px;
}

.region-title {
  font-weight: 600;
  color: $primary;
  font-size: 1.25rem;
  letter-spacing: 0.01em;
}

.expand-button {
  color: $primary;
  transition: transform 0.3s ease, background-color 0.3s ease;
  will-change: transform, background-color;
}

.region-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba($secondary, 0.08);
}

.region-card:hover .expand-button {
  transform: scale(1.1);
}

.region-content {
  padding: 20px;
}

@media (max-width: 599px) {
  .region-card {
    margin: 12px 8px;
    border-radius: 12px;
  }

  .region-content {
    padding: 12px;
  }
}

.q-slide-transition-enter-active,
.q-slide-transition-leave-active {
  transition: all 0.3s ease;
}

:deep(.country-card) {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  will-change: transform, box-shadow;
}

:deep(.country-card:hover) {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba($secondary, 0.12);
}
</style>
