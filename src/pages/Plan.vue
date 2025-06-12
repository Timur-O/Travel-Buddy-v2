<template>
  <q-page padding class="itinerary-section">
    <!-- Active Itineraries Card -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row items-center">
          <div class="text-h6">Plans</div>
          <q-space />
          <q-btn
            color="positive"
            class="create-btn"
            icon="add"
            label="Create Itinerary"
            @click="showCreateDialog = true"
          />
        </div>
      </q-card-section>

      <q-card-section>
        <q-table
          :loading="isLoading"
          :rows="activeItineraries"
          :columns="columns"
          row-key="id"
          flat
          bordered
          separator="cell"
          :rows-per-page-options="[0]"
          class="modern-table"
          hide-pagination
          hide-header
          :pagination="{ rowsPerPage: 0 }"
          @row-click="onRowClick"
        >
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                round
                color="negative"
                icon="delete"
                @click.stop="deleteItinerary(props.row.id)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Completed Itineraries Card -->
    <q-card :class="{ collapsed: !expanded }">
      <q-card-section
        class="cursor-pointer completed-header"
        @click="expanded = !expanded"
      >
        <div class="row items-center">
          <div class="text-h6 col">Completed Plans</div>
          <q-btn
            flat
            round
            :icon="expanded ? 'expand_less' : 'expand_more'"
            class="expand-button"
          />
        </div>
      </q-card-section>

      <q-slide-transition>
        <q-card-section v-show="expanded" class="completed-content">
          <q-table
            :rows="completedItineraries"
            :columns="columns"
            row-key="id"
            flat
            bordered
            hide-pagination
            hide-header
            :pagination="{ rowsPerPage: 0 }"
            @row-click="onRowClick"
          >
            <template v-slot:body-cell-actions="props">
              <q-td :props="props">
                <q-btn
                  flat
                  round
                  color="negative"
                  icon="delete"
                  @click.stop="deleteItinerary(props.row.id)"
                />
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-slide-transition>
    </q-card>
    <q-dialog v-model="showCreateDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Create New Itinerary</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="newItineraryName"
            label="Itinerary Name"
            autofocus
            @keyup.enter="createItinerary"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="negative" v-close-popup />
          <q-btn
            flat
            label="Create"
            color="positive"
            @click="createItinerary"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showDeleteDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Confirm Deletion</div>
        </q-card-section>

        <q-card-section>
          Are you sure you want to delete this itinerary? This action cannot be
          undone.
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="Delete" color="negative" @click="confirmDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>
<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useFirestoreStore } from 'src/stores/firestore';
import { QTableColumn } from 'quasar';
import { useAuthStore } from 'src/stores/auth';
import { Itinerary } from 'src/models';
import { Router, useRouter } from 'vue-router';

export default defineComponent({
  name: 'PlanPage',

  setup() {
    const router: Router = useRouter();
    const store = useFirestoreStore();
    const authStore = useAuthStore();
    const expanded = ref(false);
    const showCreateDialog = ref(false);
    const newItineraryName = ref('');
    const showDeleteDialog = ref(false);
    const itineraryToDelete = ref<string | null>(null);
    const isLoading = ref(false);

    const columns: QTableColumn[] = [
      {
        name: 'name',
        label: 'Name',
        field: 'name',
        align: 'left',
      },
      {
        name: 'actions',
        label: 'Actions',
        field: 'actions',
        align: 'right',
      },
    ];

    const onRowClick = async (evt: Event, row: Itinerary) => {
      isLoading.value = true;
      await store.fetchItineraries(authStore.authUser!.uid);
      const currentItinerary = store.itineraries?.find((i) => i.id === row.id);

      if (currentItinerary) {
        router.push(`/plan/${currentItinerary.id}`);
      }
      isLoading.value = false;
    };

    const activeItineraries = computed(
      () => store.itineraries?.filter((i) => !i.completed) || []
    );

    const completedItineraries = computed(
      () => store.itineraries?.filter((i) => i.completed) || []
    );

    const deleteItinerary = (id: string) => {
      itineraryToDelete.value = id;
      showDeleteDialog.value = true;
    };

    const confirmDelete = async () => {
      if (itineraryToDelete.value) {
        await store.deleteItinerary(itineraryToDelete.value);
        itineraryToDelete.value = null;
      }
      showDeleteDialog.value = false;
    };

    const createItinerary = async () => {
      if (!newItineraryName.value) return;

      await store.addItinerary({
        name: newItineraryName.value,
        ownerId: authStore.authUser?.uid || '',
        completed: false,
      });

      newItineraryName.value = '';
      showCreateDialog.value = false;
    };

    onMounted(async () => {
      await store.fetchItineraries(authStore.authUser!.uid);
    });

    return {
      expanded,
      columns,
      activeItineraries,
      completedItineraries,
      deleteItinerary,
      showCreateDialog,
      newItineraryName,
      createItinerary,
      showDeleteDialog,
      itineraryToDelete,
      confirmDelete,
      onRowClick,
      isLoading,
    };
  },
});
</script>

<style lang="scss" scoped>
.q-page {
  background-color: $bg_shade;
  min-height: 100vh;
  display: grid;
  gap: 24px;
  margin: 0 auto;
  padding: 24px;
}

.q-card {
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba($secondary, 0.07);
  border: 1px solid rgba($secondary, 0.08);
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  will-change: transform, box-shadow;
}

.q-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba($secondary, 0.08);
}

.q-table {
  border-radius: 8px;
  overflow: hidden;
}

.q-table thead tr th {
  font-weight: 600;
  background: $bg;
  padding: 16px;
}

.q-table tbody td {
  padding: 12px 16px;
}

.create-btn {
  border-radius: 8px;
  padding: 8px 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.create-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba($secondary, 0.1);
}

.q-dialog .q-card {
  padding: 8px;
  max-width: 450px;
}

.q-dialog .q-input {
  margin: 16px 0;
}

.q-dialog .q-card-actions {
  padding: 16px;
}

.q-table tbody tr {
  transition: background-color 0.2s ease;
}

.q-table tbody tr:hover {
  background: rgba($dark, 0.02);
}

.q-slide-transition .q-table__container {
  transition: all 0.3s ease-in-out;
}

.collapsed-card .q-card-section {
  padding-bottom: 0;
}

.completed-header {
  background: $positive_light;
  border-bottom: 1px solid $secondary;
  padding: 16px 20px;
}

.completed-header .text-h6 {
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

.q-card:hover .expand-button {
  background: rgba($primary, 0.1);
  transform: scale(1.1);
}

.completed-content {
  padding: 20px;
}

.collapsed {
  max-height: 72px;
  overflow: hidden;
  transition: max-height 0.3s ease-out;
}

.q-card:not(.collapsed) {
  max-height: 1000px;
  transition: max-height 0.3s ease-in;
}

.q-table td:last-child {
  width: 1%;
  white-space: nowrap;
  border-left: none;
}

.q-table td:last-child .q-btn {
  margin-right: -8px;
}
</style>
