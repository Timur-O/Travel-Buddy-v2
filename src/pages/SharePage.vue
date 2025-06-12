<template>
  <div class="share-page">
    <q-card flat class="stats-overlay-card">
      <q-card-section>
        <div class="text-h6 text-center">
          {{ userName }}'s Statistics and Map
        </div>
        <div class="row q-col-gutter-sm">
          <div class="col-6">
            <div class="text-subtitle2">Visited Countries</div>
            <div class="text-h6">
              {{ worldStats.visitedCount }}/{{ worldStats.totalCountries }}
            </div>
            <div class="text-caption">
              {{ formatPercentage(worldStats.completionPercentage) }}% complete
            </div>
            <q-linear-progress
              :value="worldStats.completionPercentage / 100"
              color="primary"
              class="q-mt-sm"
            />
          </div>
          <div class="col-6">
            <div class="text-subtitle2">Area Complete</div>
            <div class="text-h6">
              {{ formatPercentage(worldStats.areaPercentage) }}%
            </div>
            <div class="text-caption">
              {{ formatNumber(worldStats.visitedArea) }} /
              {{ formatNumber(worldStats.totalArea) }} km²
            </div>
            <q-linear-progress
              :value="worldStats.areaPercentage / 100"
              color="secondary"
              class="q-mt-sm"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <UserMap :user-id="shareUserId" />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted } from 'vue';
import UserMap from 'components/UserMap.vue';
import { useFirestoreStore } from 'stores/firestore';
import { calculateWorldStats } from 'src/utils/StatisticsHelper';
import { useFiltersStore } from 'stores/filters';

export default defineComponent({
  name: 'SharePage',
  components: { UserMap },
  props: {
    shareUserId: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const firestoreStore = useFirestoreStore();
    const filtersStore = useFiltersStore();

    const userName = computed(() =>
      firestoreStore.currentUser
        ? firestoreStore.currentUser!.displayName
        : 'User'
    );

    const worldStats = computed(() =>
      calculateWorldStats(
        firestoreStore.countries,
        firestoreStore.userData,
        firestoreStore.groups,
        filtersStore.getSelectedSovereignties
      )
    );

    const formatPercentage = (value: number) => value.toFixed(1);
    const formatNumber = (value: number) => Math.round(value).toLocaleString();

    onMounted(async () => {
      await Promise.all([
        firestoreStore.fetchCountries(),
        firestoreStore.fetchGroups(),
        firestoreStore.fetchUserData(props.shareUserId),
      ]);
    });

    return {
      userName,
      worldStats,
      formatPercentage,
      formatNumber,
    };
  },
});
</script>

<style lang="scss">
.share-page {
  position: relative;
}

.stats-overlay-card {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: $bg;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba($secondary, 0.15);
  max-width: 600px;
  width: 90%;
}
</style>
