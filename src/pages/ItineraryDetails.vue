<template>
  <q-page>
    <div class="q-pa-md">
      <q-btn
        icon="arrow_back"
        flat
        label="Back to All Plans"
        to="/plan"
        color="primary"
      />
    </div>

    <q-card class="q-ma-md">
      <q-card-section>
        <div class="row items-center q-mb-md">
          <div class="col-xs-2 col-sm-1"></div>
          <div
            class="col-xs-12 col-sm-12 text-h5 text-center q-mb-sm-none q-mb-md"
          >
            {{ itineraryName }}
          </div>
        </div>

        <q-table
          :rows="rows"
          :columns="columns"
          row-key="id"
          flat
          bordered
          :loading="loading"
        >
          <template v-slot:body="props">
            <q-tr
              :props="props"
              :class="{ transport_row: isTransportCheck(props.row.itemType) }"
            >
              <q-td v-for="col in props.cols" :key="col.name" :props="props">
                <template v-if="col.name === 'booked'">
                  <q-icon
                    :name="col.value ? 'check' : 'close'"
                    :color="col.value ? 'positive' : 'negative'"
                    size="sm"
                  />
                </template>
                <template v-else-if="col.name === 'actions'">
                  <q-btn
                    flat
                    round
                    dense
                    color="negative"
                    icon="delete"
                    @click.stop="deleteItem(props.row.id)"
                  />
                </template>
                <template v-else>
                  {{ col.value }}
                </template>
              </q-td>
            </q-tr>
          </template>

          <template v-slot:no-data>
            <div class="full-width row justify-center q-pa-md text-h6">
              <q-btn
                flat
                color="primary"
                icon="add"
                label="Add First Segment"
                @click="addNewItem"
              />
            </div>
          </template>

          <template v-slot:loading>
            <q-inner-loading showing color="primary" />
          </template>

          <template v-slot:bottom>
            <div class="row justify-center q-pa-md full-width">
              <q-btn
                flat
                color="primary"
                icon="add"
                label="Add New Segment"
                @click="addNewItem"
              />
            </div>
          </template>
        </q-table>

        <div class="row items-center q-mb-md">
          <div class="col-sm-12 text-h5 text-center q-ma-lg">
            <q-btn
              :color="itinerary!.completed ? 'warning' : 'positive'"
              :icon="itinerary!.completed ? 'refresh' : 'check'"
              :label="$q.screen.gt.xs ? (itinerary!.completed ? 'Mark Incomplete' : 'Mark Complete') : (itinerary?.completed ? 'Incomplete' : 'Complete')"
              @click="toggleCompletion"
              :class="$q.screen.gt.xs ? '' : 'full-width'"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-dialog v-model="showDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <div class="text-h6">
            {{
              dialogType === 'complete'
                ? 'Mark Plan as Completed'
                : 'Mark Plan as Incomplete'
            }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <template v-if="dialogType === 'complete'">
            Marking your plan as completed will result in the following
            countries being marked as visited:
            <ul class="q-mt-sm">
              <li
                v-for="country in getCountriesList().split(', ')"
                :key="country"
              >
                {{ country }}
              </li>
            </ul>
            Are you sure you'd like to mark your plan as completed?
          </template>
          <template v-else>
            Marking your plan as incomplete will result in the following
            countries being marked as upcoming / planned:
            <ul class="q-mt-sm">
              <li
                v-for="country in getCountriesList().split(', ')"
                :key="country"
              >
                {{ country }}
              </li>
            </ul>
            Are you sure you'd like to mark your plan as incompleted?
          </template>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="negative" v-close-popup />
          <q-btn
            :color="dialogType === 'complete' ? 'positive' : 'warning'"
            :label="dialogType === 'complete' ? 'Yes, Completed!' : 'Yes'"
            @click="handleDialogConfirm"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showAddDialog">
      <q-card
        :style="
          $q.screen.lt.sm
            ? 'width: 95%'
            : 'min-width: 600px; width: 90%; max-width: 800px'
        "
      >
        <q-card-section>
          <div class="text-h6">Add Plan Segment</div>
        </q-card-section>

        <q-card-section>
          <q-form ref="formRef" class="segment-form">
            <div class="row q-col-gutter-md">
              <!-- Type Selection -->
              <div class="col-12">
                <q-select
                  v-model="newItem.itemType"
                  :options="Object.values(ItineraryItemType)"
                  label="Segment Type"
                  filled
                  :rules="[rules.required]"
                />
              </div>

              <!-- Dates Row -->
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="newItem.startDate"
                  type="date"
                  label="Start Date"
                  filled
                  :rules="[rules.required, rules.validYear]"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="newItem.endDate"
                  type="date"
                  label="End Date"
                  filled
                  :rules="[
                    rules.required,
                    rules.validYear,
                    rules.dateAfter(newItem.startDate),
                  ]"
                />
              </div>

              <!-- Transport Specific Fields -->
              <template v-if="isTransport">
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="newItem.startTime"
                    type="time"
                    label="Start Time"
                    filled
                    :rules="[rules.required]"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="newItem.endTime"
                    type="time"
                    label="End Time"
                    filled
                    :rules="[rules.required]"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="newItem.departurePort"
                    label="Departure Port"
                    filled
                    :rules="[rules.required]"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="newItem.arrivalPort"
                    label="Arrival Port"
                    filled
                    :rules="[rules.required]"
                  />
                </div>
              </template>

              <!-- Location Specific Fields -->
              <template v-else>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="newItem.detailedLocation"
                    label="Detailed Location"
                    filled
                    :rules="[rules.required]"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-select
                    v-model="newItem.countryId"
                    :options="countries"
                    label="Country"
                    filled
                    :rules="[rules.required]"
                  />
                </div>
              </template>

              <!-- Common Fields -->
              <div class="col-12">
                <q-input
                  v-model="newItem.note"
                  label="Note"
                  type="textarea"
                  filled
                  rows="2"
                />
              </div>

              <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="newItem.pricePerPerson"
                  type="number"
                  label="Price per Person"
                  filled
                  prefix="€"
                  :rules="[rules.positiveNumber]"
                />
              </div>

              <div class="col-12 col-sm-6">
                <div
                  class="checkbox-container flex items-center justify-center"
                >
                  <q-checkbox v-model="newItem.booked" label="Already Booked" />
                </div>
              </div>
            </div>
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="negative" v-close-popup />
          <q-btn
            flat
            label="Add Segment"
            color="primary"
            @click="saveNewItem"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section class="row items-center">
          <div class="text-h6">Delete Segment</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          Are you sure you want to delete this segment? This action cannot be
          undone.
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn
            flat
            label="Delete"
            color="negative"
            @click="confirmDelete"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue';
import { QForm, QTableColumn } from 'quasar';
import { Itinerary, ItineraryItemType } from 'src/models';
import { useRoute } from 'vue-router';
import { useFirestoreStore } from 'stores/firestore';

export default defineComponent({
  name: 'PlanDetailsPage',
  components: {},

  setup() {
    const route = useRoute();
    const store = useFirestoreStore();
    const itineraryId = route.params.id as string;
    const itinerary = ref<Itinerary>({
      id: '',
      name: '',
      ownerId: '',
      completed: false,
    });
    const itineraryName = ref<string>('');
    const rows = computed(() =>
      [...store.itineraryItems].sort((a, b) => {
        const dateA = new Date(a.startDate);
        const dateB = new Date(b.startDate);
        return dateA.getTime() - dateB.getTime();
      })
    );
    const loading = computed(() => store.loading);
    const showDialog = ref(false);
    const dialogType = ref<'complete' | 'incomplete'>('complete');
    const showAddDialog = ref(false);
    type ValidationRule = (val: unknown) => boolean | string;
    const rules = {
      required: (val: unknown): boolean | string =>
        !!val || 'Field is required',
      dateAfter: (startDate: string): ValidationRule => {
        return (val: unknown): boolean | string => {
          if (!startDate || !val) return true;
          return (
            new Date(val as string) >= new Date(startDate) ||
            'End date must be after start date'
          );
        };
      },
      validYear: (val: unknown): boolean | string => {
        if (!val) return true;
        const year = new Date(val as string).getFullYear();
        return (year >= 1000 && year <= 9999) || 'Year must be 4 digits';
      },
      positiveNumber: (val: unknown): boolean | string => {
        const numVal = val as number;
        return numVal >= 0 || 'Must be a positive number';
      },
    };
    const formRef = ref<QForm | null>(null);
    const newItem = ref({
      itemType: ItineraryItemType.None,
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      departurePort: '',
      arrivalPort: '',
      detailedLocation: '',
      countryId: '',
      note: '',
      pricePerPerson: 0,
      booked: false,
    });
    const isTransport = computed(() =>
      isTransportCheck(newItem.value.itemType)
    );
    const countries = computed(() =>
      store.countries
        .map((country) => ({
          label: country.name,
          value: country.id,
        }))
        .sort((a, b) => a.label.localeCompare(b.label))
    );
    const showDeleteDialog = ref(false);
    const itemToDelete = ref<string>('');
    const columns = ref<QTableColumn[]>([
      {
        name: 'booked',
        label: 'Booked',
        field: 'booked',
        align: 'center',
        style: 'width: 100px',
      },
      {
        name: 'dateAndType',
        label: 'Date & Time',
        field: (row) => {
          const dateFormat = (date: Date) =>
            date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
          const prefix =
            row.itemType !== ItineraryItemType.None ||
            ItineraryItemType.Accommodation
              ? `${row.itemType} - `
              : '';

          if (isTransportCheck(row.itemType)) {
            return `${prefix}${dateFormat(row.startDate)} (${row.startTime} - ${
              row.endTime
            })`;
          }
          return `${dateFormat(row.startDate)} - ${dateFormat(row.endDate)}`;
        },
        align: 'left',
      },
      {
        name: 'location',
        label: 'Location',
        field: (row) => {
          if (isTransportCheck(row.itemType)) {
            return `${row.departurePort} → ${row.arrivalPort}`;
          }
          const country =
            store.countries.find((c) => c.id === row.countryId)?.name || '';
          return `${row.detailedLocation}${country ? `, ${country}` : ''}`;
        },
        align: 'left',
      },
      {
        name: 'note',
        label: 'Note',
        field: 'note',
        align: 'left',
      },
      {
        name: 'pricePerPerson',
        label: 'Price/Person',
        field: 'pricePerPerson',
        format: (val: number) => `${val.toFixed(2)}`,
        align: 'right',
      },
      {
        name: 'actions',
        label: '',
        field: 'actions',
        align: 'right',
        style: 'width: 50px',
      },
    ]);

    const isTransportCheck = (itemType: ItineraryItemType) => {
      return (
        itemType === ItineraryItemType.Flight ||
        itemType === ItineraryItemType.Train ||
        itemType === ItineraryItemType.Bus
      );
    };

    const addNewItem = () => {
      showAddDialog.value = true;
    };

    const resetForm = () => {
      newItem.value = {
        itemType: ItineraryItemType.None,
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        departurePort: '',
        arrivalPort: '',
        detailedLocation: '',
        countryId: '',
        note: '',
        pricePerPerson: 0,
        booked: false,
      };
      formRef.value!.reset();
    };

    const saveNewItem = async () => {
      const isValid = await formRef.value!.validate();

      if (!isValid) return;

      const itemToSave = {
        ...newItem.value,
        itineraryId: itineraryId,
        startDate: new Date(newItem.value.startDate),
        endDate: new Date(newItem.value.endDate),
      };

      await store.addItineraryItem(itemToSave);
      resetForm();
    };

    const getCountriesList = () => {
      if (store.itineraryItems.length === 0) return 'No countries added...';

      return [
        ...new Set(
          store.itineraryItems
            .map((item) => {
              if (isTransportCheck(item.itemType)) {
                return [
                  item.departurePort?.split(',').pop()?.trim(),
                  item.arrivalPort?.split(',').pop()?.trim(),
                ];
              }
              return item.detailedLocation?.split(',').pop()?.trim();
            })
            .flat()
            .filter(Boolean)
        ),
      ]
        .sort()
        .join(', ');
    };

    const handleDialogConfirm = async () => {
      const updatedItinerary: Itinerary = {
        ...itinerary.value!,
        completed: dialogType.value === 'complete',
      };
      await store.updateItinerary(updatedItinerary);
      itinerary.value = updatedItinerary;
    };

    const deleteItem = (itemId: string) => {
      itemToDelete.value = itemId;
      showDeleteDialog.value = true;
    };

    const confirmDelete = async () => {
      await store.deleteItineraryItem(itineraryId, itemToDelete.value);
      showDeleteDialog.value = false;
      itemToDelete.value = '';
    };

    const toggleCompletion = () => {
      if (!itinerary.value || loading.value) return;

      dialogType.value = itinerary.value.completed ? 'incomplete' : 'complete';
      showDialog.value = true;
    };

    onMounted(async () => {
      await store.fetchCountries();
      await store.fetchItineraryItems(itineraryId);
      const fetchedItinerary = await store.fetchItinerary(itineraryId);
      if (fetchedItinerary) {
        itinerary.value = { ...fetchedItinerary };
        itineraryName.value = fetchedItinerary.name;
      }
    });

    return {
      columns,
      rows,
      loading,
      itinerary,
      itineraryName,
      addNewItem,
      toggleCompletion,
      showDialog,
      dialogType,
      getCountriesList,
      handleDialogConfirm,
      showAddDialog,
      newItem,
      isTransport,
      saveNewItem,
      ItineraryItemType,
      countries,
      deleteItem,
      isTransportCheck,
      showDeleteDialog,
      itemToDelete,
      confirmDelete,
      formRef,
      rules,
    };
  },
});
</script>

<style lang="scss" scoped>
.q-page {
  background: $bg_shade;
  min-height: 100vh;
}

.transport_row {
  background-color: $info_light;
}

.segment-form {
  .q-field {
    background: white;
    border-radius: 8px;
  }

  .q-checkbox {
    margin-top: 8px;
  }

  .q-field--filled .q-field__control {
    border-radius: 8px;
  }

  .q-field--error {
    border-radius: 8px;
    animation: shake 0.2s ease-in-out 0s 2;
  }
}

@keyframes shake {
  0% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(4px);
  }
  75% {
    transform: translateX(-4px);
  }
  100% {
    transform: translateX(0);
  }
}
</style>
