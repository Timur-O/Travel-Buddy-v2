<template>
  <q-page padding class="modern-statistics-page">
    <div class="row q-col-gutter-md">
      <!-- World Statistics Card -->
      <div class="col-12">
        <q-card flat class="world-card">
          <q-card-section>
            <div class="text-h6">World</div>
            <div class="text-subtitle2">
              {{ worldStats.totalCountries }} countries
            </div>
          </q-card-section>

          <q-card-section>
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <q-card flat class="stat-card">
                  <q-card-section>
                    <div class="text-subtitle2">Visited Countries</div>
                    <div class="text-h6">
                      {{ worldStats.visitedCount }}/{{
                        worldStats.totalCountries
                      }}
                    </div>
                    <div class="text-caption">
                      {{ formatPercentage(worldStats.completionPercentage) }}%
                      complete
                    </div>
                    <q-linear-progress
                      :value="worldStats.completionPercentage / 100"
                      color="primary"
                      class="q-mt-sm"
                    />
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-sm-6">
                <q-card flat class="stat-card">
                  <q-card-section>
                    <div class="text-subtitle2">Area Complete</div>
                    <div class="text-h6">
                      {{ formatPercentage(worldStats.areaPercentage) }}%
                    </div>
                    <div class="text-caption">
                      {{ formatNumber(worldStats.visitedArea) }}
                      /
                      {{ formatNumber(worldStats.totalArea) }}
                      km²
                    </div>
                    <q-linear-progress
                      :value="worldStats.areaPercentage / 100"
                      color="secondary"
                      class="q-mt-sm"
                    />
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12">
                <q-card flat class="stat-card">
                  <q-card-section>
                    <div class="row q-col-gutter-xs">
                      <div class="col-8">
                        <div class="text-subtitle2">
                          Difficulty Distribution
                        </div>
                        <div class="row q-col-gutter-xs">
                          <div
                            v-for="stat in difficultyStats"
                            :key="stat.level"
                            class="col"
                          >
                            <div class="text-center">{{ stat.level }}</div>
                            <q-linear-progress
                              :value="stat.percentage / 100"
                              color="accent"
                              style="height: 20px"
                              class="q-mt-xs"
                            />
                            <div class="text-caption text-center">
                              {{ formatPercentage(stat.percentage) }}%
                            </div>
                            <div class="text-caption text-center">
                              ({{ stat.count }})
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="col-4 flex flex-center column">
                        <div class="text-subtitle2 text-center">
                          Average Difficulty
                        </div>
                        <div class="text-h6 text-center">
                          {{ formatPercentage(worldStats.averageDifficulty) }}/5
                        </div>
                        <div class="text-caption text-center">
                          Based on visited countries
                        </div>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12" v-if="regionStats.length">
        <q-card flat class="region-card">
          <q-card-section>
            <div class="text-h6">Regional Comparison</div>
            <div style="position: relative; height: 200px">
              <Suspense>
                <ChartJSBar :data="chartData" :options="barChartOptions" />
              </Suspense>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div
        v-for="region in regionStats"
        :key="region.name"
        class="col-12 col-md-6"
      >
        <q-card flat class="region-card">
          <q-card-section
            class="cursor-pointer"
            @click="toggleRegion(region.name)"
          >
            <div class="row items-center">
              <div class="text-h6 col">{{ region.name }}</div>
              <q-btn
                flat
                round
                :icon="
                  expandedRegions[region.name] ? 'expand_less' : 'expand_more'
                "
              />
            </div>
            <div class="text-subtitle2">
              {{ region.totalCountries }} countries
            </div>
          </q-card-section>

          <q-slide-transition>
            <q-card-section v-show="expandedRegions[region.name]">
              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm-6">
                  <q-card flat class="stat-card">
                    <q-card-section>
                      <div class="text-subtitle2">Visited Countries</div>
                      <div class="text-h6">
                        {{ region.visitedCount }}/{{ region.totalCountries }}
                      </div>
                      <div class="text-caption">
                        {{ formatPercentage(region.completionPercentage) }}%
                        complete
                      </div>
                      <q-linear-progress
                        :value="region.completionPercentage / 100"
                        color="primary"
                        class="q-mt-sm"
                      />
                    </q-card-section>
                  </q-card>
                </div>

                <div class="col-12 col-sm-6">
                  <q-card flat class="stat-card">
                    <q-card-section>
                      <div class="text-subtitle2">Area Complete</div>
                      <div class="text-h6">
                        {{ formatPercentage(region.areaPercentage) }}%
                      </div>
                      <div class="text-caption">
                        {{ formatNumber(region.visitedArea) }} /
                        {{ formatNumber(region.totalArea) }} km²
                      </div>
                      <q-linear-progress
                        :value="region.areaPercentage / 100"
                        color="secondary"
                        class="q-mt-sm"
                      />
                    </q-card-section>
                  </q-card>
                </div>

                <div class="col-12">
                  <q-card flat class="stat-card">
                    <q-card-section>
                      <div class="row q-col-gutter-xs">
                        <div class="col-8">
                          <div class="text-subtitle2">
                            Difficulty Distribution
                          </div>
                          <div class="row q-col-gutter-xs">
                            <div
                              v-for="stat in difficultyStats"
                              :key="stat.level"
                              class="col"
                            >
                              <div class="text-center">{{ stat.level }}</div>
                              <q-linear-progress
                                :value="stat.percentage / 100"
                                color="accent"
                                style="height: 20px"
                                class="q-mt-xs"
                              />
                              <div class="text-caption text-center">
                                {{ formatPercentage(stat.percentage) }}%
                              </div>
                              <div class="text-caption text-center">
                                ({{ stat.count }})
                              </div>
                            </div>
                          </div>
                        </div>

                        <div class="col-4 flex flex-center column">
                          <div class="text-subtitle2 text-center">
                            Average Difficulty
                          </div>
                          <div class="text-h6 text-center">
                            {{ formatPercentage(region.averageDifficulty) }}/5
                          </div>
                          <div class="text-caption text-center">
                            Based on visited countries
                          </div>
                        </div>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </q-card-section>
          </q-slide-transition>
        </q-card>
      </div>
    </div>
  </q-page>

  <q-page-sticky position="bottom" :offset="[0, 18]">
    <q-btn fab icon="share" color="primary" @click="showShareDialog = true" />
  </q-page-sticky>

  <ShareDialog v-model="showShareDialog" :user-id="authStore.authUser!.uid" />
</template>

<script lang="ts">
import ShareDialog from 'components/ShareDialog.vue';
import { computed, defineComponent, onMounted, ref } from 'vue';
import { useFirestoreStore } from 'stores/firestore';
import { useAuthStore } from 'stores/auth';
import { useFiltersStore } from 'stores/filters';
import {
  calculateDifficultyDistribution,
  calculateRegionStats,
  calculateWorldStats,
} from 'src/utils/StatisticsHelper';

export default defineComponent({
  name: 'StatisticsPage',
  components: { ShareDialog },
  setup() {
    const firestoreStore = useFirestoreStore();
    const filterStore = useFiltersStore();
    const authStore = useAuthStore();
    const expandedRegions = ref<Record<string, boolean>>({});
    const showShareDialog = ref(false);

    const selectedSovereignties = computed(
      () => filterStore.selectedSovereignties || []
    );
    const selectedRegions = computed(() => filterStore.selectedRegions || []);

    const toggleRegion = (regionName: string) => {
      expandedRegions.value[regionName] = !expandedRegions.value[regionName];
    };

    const formatPercentage = (value: number) => value.toFixed(1);
    const formatNumber = (value: number) => Math.round(value).toLocaleString();

    onMounted(async () => {
      await Promise.all([
        firestoreStore.fetchCountries(),
        firestoreStore.fetchGroups(),
        firestoreStore.fetchUserData(authStore.authUser!.uid),
      ]);
      regionStats.value.forEach((region) => {
        expandedRegions.value[region.name] = true;
      });
    });

    const difficultyStats = computed(() =>
      calculateDifficultyDistribution(
        firestoreStore.countries,
        firestoreStore.userData,
        firestoreStore.groups,
        selectedSovereignties.value
      )
    );

    const worldStats = computed(() =>
      calculateWorldStats(
        firestoreStore.countries,
        firestoreStore.userData,
        firestoreStore.groups,
        selectedSovereignties.value
      )
    );

    const regionStats = computed(() =>
      calculateRegionStats(
        firestoreStore.countries,
        firestoreStore.groups,
        firestoreStore.userData,
        selectedSovereignties.value,
        selectedRegions.value
      )
    );

    const chartData = computed(() => ({
      labels: regionStats.value.map((r) => r.name),
      datasets: [
        {
          data: regionStats.value.map((r) => r.completionPercentage),
          backgroundColor: '#1976D2',
          borderRadius: 8,
        },
      ],
    }));

    const barChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Completion Percentage',
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
          },
        },
        x: {
          grid: {
            display: false,
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
      interaction: {
        mode: 'nearest',
        intersect: false,
      },
      layout: {
        padding: {
          left: 10,
          right: 10,
        },
      },
      animation: {
        duration: 500,
      },
    };

    return {
      authStore,
      regionStats,
      worldStats,
      expandedRegions,
      toggleRegion,
      difficultyStats,
      barChartOptions,
      chartData,
      formatPercentage,
      formatNumber,
      showShareDialog,
    };
  },
});
</script>

<style lang="scss">
.modern-statistics-page {
  background-color: $bg_shade;
  min-height: 100vh;
}

.region-card,
.world-card {
  background: $bg;
  border-radius: 16px;
  transition: all 0.3s ease;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba($secondary, 0.05);
}

.stat-card {
  background: $bg_shade;
  border-radius: 12px;
  border: 1px solid rgba($secondary, 0.05);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba($secondary, 0.08);
  }
}

.region-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba($secondary, 0.08);
}

@media (max-width: 599px) {
  .region-card,
  .world-card {
    margin: 12px 8px;
    border-radius: 12px;
  }
}

.q-slide-transition-enter-active,
.q-slide-transition-leave-active {
  transition: all 0.3s ease;
}

.q-btn {
  transition: transform 0.3s ease;

  &:hover {
    background: rgba($primary, 0.1);
    transform: scale(1.1);
  }
}

.q-linear-progress {
  border-radius: 4px;
  overflow: hidden;
}
</style>
