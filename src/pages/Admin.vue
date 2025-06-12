<template>
  <q-page class="admin-container q-pa-md">
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-card class="admin-card">
          <q-inner-loading :showing="isProcessing">
            <q-spinner-dots size="50px" color="primary" />
          </q-inner-loading>
          <q-card-section>
            <div class="text-h6">Country Data Import</div>
          </q-card-section>
          <q-card-section>
            <q-input
              v-model="jsonInput"
              type="textarea"
              filled
              autogrow
              placeholder="Paste JSON data here..."
              :error="validationState.hasError"
              :error-message="validationState.message"
              debounce="500"
            />
            <q-btn
              class="q-mt-sm"
              color="primary"
              :disable="!validationState.isValid"
              @click="processJson"
              :loading="isProcessing"
              label="Process Data"
            />
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-6">
        <q-card class="admin-card q-pa-md">
          <q-card-section>
            <div class="text-h6">Database Exports</div>
          </q-card-section>
          <q-card-section class="row q-col-gutter-md">
            <div class="col">
              <q-btn
                color="primary"
                icon="download"
                label="Export Countries"
                @click="exportCountries"
                :loading="isExporting"
              />
            </div>
            <div class="col">
              <q-btn
                color="primary"
                icon="download"
                label="Export Groups"
                @click="exportGroups"
                :loading="isExporting"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useFirestoreStore } from 'stores/firestore';
import { CountryImportData, GroupType } from 'src/models';
import { validateCountryJson } from 'src/utils/ValidationFunctions';

export default defineComponent({
  name: 'AdminPage',

  setup() {
    const $q = useQuasar();
    const isProcessing = ref(false);
    const isExporting = ref(false);
    const jsonInput = ref('');
    const firestoreStore = useFirestoreStore();

    const validationState = computed(() => {
      if (!jsonInput.value) {
        return {
          isValid: false,
          hasError: false,
          message: 'Please enter JSON data...',
        };
      }
      const result = validateCountryJson(jsonInput.value);
      return {
        isValid: result.isValid,
        hasError: !result.isValid && jsonInput.value !== '',
        message: result.message,
      };
    });

    const exportCountries = async () => {
      isExporting.value = true;
      try {
        await firestoreStore.exportCountries();
        $q.notify({
          type: 'positive',
          message: 'Countries exported successfully',
          position: 'top',
        });
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: 'Export failed',
          position: 'top',
        });
      } finally {
        isExporting.value = false;
      }
    };

    const exportGroups = async () => {
      isExporting.value = true;
      try {
        await firestoreStore.exportGroups();
        $q.notify({
          type: 'positive',
          message: 'Groups exported successfully',
          position: 'top',
        });
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: 'Export failed',
          position: 'top',
        });
      } finally {
        isExporting.value = false;
      }
    };

    const processJson = async () => {
      if (!validationState.value.isValid) return;
      isProcessing.value = true;

      try {
        const parsedData = JSON.parse(jsonInput.value) as CountryImportData[];
        await firestoreStore.fetchGroups();
        await firestoreStore.fetchCountries();

        const batch = [];

        for (const countryData of parsedData) {
          const country = {
            id: countryData.id,
            name: countryData.name,
            size: countryData.size,
            flag: countryData.flag,
            nonSovereignParent: countryData.parent || 'N/A',
            nonSovereignType: countryData.type || 'Sovereign',
            safety: countryData.safety,
            cost_index: countryData.cost_index,
            travel_price_nl: countryData.travel_price_nl,
          };

          const regionGroup = {
            id: countryData.region,
            name: countryData.region.replace(/_/g, ' '),
            type: GroupType.Region,
            countries: [countryData.id],
          };

          const sovereigntyGroup = {
            id: countryData.sovereignty,
            name: countryData.sovereignty.replace(/_/g, ' '),
            type: GroupType.Sovereignty,
            countries: [countryData.id],
          };

          const existingRegion = firestoreStore.groups.find(
            (g) => g.id === regionGroup.id
          );
          const existingSovereignty = firestoreStore.groups.find(
            (g) => g.id === sovereigntyGroup.id
          );
          const existingCountry = firestoreStore.countries.find(
            (c) => c.id === country.id
          );

          if (existingRegion) {
            if (!existingRegion.countries.includes(countryData.id)) {
              batch.push(() =>
                firestoreStore.updateGroup({
                  ...existingRegion,
                  countries: [...existingRegion.countries, countryData.id],
                })
              );
            }
          } else {
            batch.push(() => firestoreStore.addGroup(regionGroup));
          }

          if (existingSovereignty) {
            if (!existingSovereignty.countries.includes(countryData.id)) {
              batch.push(() =>
                firestoreStore.updateGroup({
                  ...existingSovereignty,
                  countries: [...existingSovereignty.countries, countryData.id],
                })
              );
            }
          } else {
            batch.push(() => firestoreStore.addGroup(sovereigntyGroup));
          }

          batch.push(() =>
            existingCountry
              ? firestoreStore.updateCountry(country)
              : firestoreStore.addCountry(country)
          );
        }

        await Promise.all(batch.map((operation) => operation()));

        $q.notify({
          type: 'positive',
          message: 'Data successfully imported!',
          position: 'top',
          timeout: 2000,
        });

        jsonInput.value = '';
      } catch (error) {
        console.error('Error processing JSON:', error);
        $q.notify({
          type: 'negative',
          message: 'Error importing data. Please try again.',
          position: 'top',
          timeout: 2000,
        });
      } finally {
        isProcessing.value = false;
      }
    };

    return {
      exportCountries,
      exportGroups,
      isProcessing,
      isExporting,
      jsonInput,
      validationState,
      processJson,
    };
  },
});
</script>

<style lang="scss" scoped>
.q-page {
  background: $bg_shade;
}

.admin-card {
  height: 100%;
  background: $bg;

  .text-h6 {
    color: $primary;
  }
}
</style>
