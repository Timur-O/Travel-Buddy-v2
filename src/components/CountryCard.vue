<template>
  <q-card flat bordered :class="cardClasses">
    <q-card-section class="q-pt-xs q-px-lg">
      <div class="text-overline text-center">
        <div v-if="status === VisitStatus.Visited">
          <q-icon name="check" color="positive" size="sm" />
          <span class="q-ml-sm">Visited</span>
        </div>
        <div v-if="status === VisitStatus.Upcoming">
          <q-icon name="event" color="info" size="sm" />
          <span class="q-ml-sm">Upcoming / Planned</span>
        </div>
        <div v-if="status === VisitStatus.Unvisited">
          <q-icon name="close" color="negative" size="sm" />
          <span class="q-ml-sm">Unvisited</span>
        </div>
      </div>
      <q-separator />
      <div class="country-header q-mt-md q-mb-md">
        <div class="text-h5">{{ country.name }}</div>
        <div class="country-flag">{{ country.flag }}</div>
      </div>
      <div class="text-caption">
        <div class="location-info">
          <span class="id">{{ country.id }}</span>
          <span class="divider">•</span>
          <span class="region">{{ countryRegion?.name }}</span>
          <span class="divider">•</span>
          <span class="sovereignty">{{ countrySovereignty?.name }}</span>
          <template v-if="country.nonSovereignParent !== 'N/A'">
            <span class="divider">•</span>
            <span class="type">{{ country.nonSovereignParent }}</span>
          </template>
          <template v-if="country.nonSovereignType !== 'Sovereign'">
            <span class="divider">•</span>
            <span class="type">{{ country.nonSovereignType }}</span>
          </template>
        </div>
        <div class="stats q-mt-sm">
          <div class="stat-item">
            <q-icon name="area_chart" size="xs" class="q-mr-xs" />
            {{ formattedSize }} km²
          </div>
          <div class="stat-item">
            <q-icon name="stars" size="xs" class="q-mr-xs" />
            Difficulty: {{ countryDifficulty }}/5
            <q-tooltip>
              (US) Safety Rating (Lower = Safer): {{ country.safety }}/4
              <br />
              Living Cost Rating (Lower = Cheaper): {{ country.cost_index }}/5
              <br />
              (NL) Travel Cost Rating (Lower = Cheaper):
              {{ country.travel_price_nl }}/5
            </q-tooltip>
          </div>
        </div>
      </div>

      <div class="status-buttons q-mt-md" v-show="!props.shareMode">
        <q-btn
          class="unvisited_button"
          v-if="status !== VisitStatus.Unvisited"
          align="evenly"
          size="md"
          label="Unvisited"
          @click="updateStatus(VisitStatus.Unvisited)"
        />
        <q-btn
          class="upcoming_button"
          v-if="status !== VisitStatus.Upcoming"
          align="evenly"
          size="md"
          label="Upcoming"
          @click="updateStatus(VisitStatus.Upcoming)"
        />
        <q-btn
          class="visited_button"
          v-if="status !== VisitStatus.Visited"
          align="evenly"
          size="md"
          label="Visited"
          @click="updateStatus(VisitStatus.Visited)"
        />
      </div>

      <div v-if="!filtersStore.simpleMode && !forceSimpleMode">
        <div class="photos-section q-mt-md">
          <div class="text-subtitle2">Photos (max 3)</div>
          <div class="photo-grid">
            <div
              v-for="(photo, index) in photos"
              :key="index"
              class="photo-item"
            >
              <q-img :src="photo" :ratio="1" class="rounded-borders">
                <q-btn
                  round
                  color="negative"
                  icon="delete"
                  size="sm"
                  class="absolute-top-right delete-photo-button"
                  @click="removePhoto(index)"
                />
              </q-img>
            </div>
            <q-btn
              v-if="photos.length < 3"
              flat
              color="primary"
              icon="add_a_photo"
              class="upload-btn"
              @click="triggerFileInput"
            />
          </div>
          <input
            type="file"
            accept="image/*"
            ref="fileInput"
            style="display: none"
            @change="handleFileUpload"
          />
        </div>

        <div class="q-mt-md">
          <q-input
            v-model="note"
            label="Note..."
            :maxlength="180"
            filled
            type="textarea"
            :hint="`${note.length}/180 characters`"
            @update:model-value="updateNote"
          />
        </div>
      </div>
    </q-card-section>
    <slot name="actions"></slot>
  </q-card>

  <q-dialog v-model="showDeleteDialog" persistent>
    <q-card>
      <q-card-section class="row items-center">
        <q-avatar icon="warning" color="negative" text-color="white" />
        <span class="q-ml-sm">Are you sure you want to delete this photo?</span>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" v-close-popup />
        <q-btn
          flat
          label="Delete"
          color="negative"
          v-close-popup
          @click="confirmDelete"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { computed, defineComponent, ref, Ref } from 'vue';
import { useFirestoreStore } from 'stores/firestore';
import { storeToRefs } from 'pinia';
import { Country, GroupType, UserData, VisitStatus } from 'src/models';
import { useConfetti } from 'src/composables/useConfetti';
import { calculateCountryDifficulty } from 'src/utils/StatisticsHelper';
import { useFiltersStore } from 'stores/filters';

export default defineComponent({
  name: 'CountryCard',
  props: {
    country: {
      type: Object as () => Country,
      required: true,
    },
    forceSimpleMode: {
      type: Boolean,
      default: false,
    },
    shareMode: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const firestore = useFirestoreStore();
    const filtersStore = useFiltersStore();
    const { groups, userData, currentUser } = storeToRefs(firestore);
    const { triggerConfetti } = useConfetti();
    const fileInput = ref<HTMLInputElement | null>(null);
    const showDeleteDialog = ref(false);
    const pendingDeleteIndex = ref<number | null>(null);

    const countryUserData: Ref<UserData | undefined> = computed(() =>
      userData.value.find((d) => d.countryId === props.country.id)
    );

    const photos = computed(() => countryUserData.value?.photos || []);
    const status = computed(
      () => countryUserData.value?.status || VisitStatus.Unvisited
    );
    const note = ref(countryUserData.value?.note || '');

    const cardClasses = computed(() => ({
      'visited-country': status.value === VisitStatus.Visited,
      'upcoming-country': status.value === VisitStatus.Upcoming,
    }));

    const formattedSize = computed(() =>
      Number(props.country.size).toLocaleString()
    );

    const countryRegion = computed(() =>
      groups.value.find(
        (g) =>
          g.type === GroupType.Region && g.countries?.includes(props.country.id)
      )
    );

    const countrySovereignty = computed(() =>
      groups.value.find(
        (g) =>
          g.type === GroupType.Sovereignty &&
          g.countries?.includes(props.country.id)
      )
    );

    const countryDifficulty = computed(() =>
      calculateCountryDifficulty(props.country)
    );

    const updateUserData = async (data: Partial<UserData>) => {
      if (countryUserData.value) {
        await firestore.updateUserData({ ...countryUserData.value, ...data });
      } else {
        await firestore.addUserData({
          userId: currentUser.value!.id,
          countryId: props.country.id,
          status: VisitStatus.Unvisited,
          note: '',
          photos: [],
          ...data,
        });
      }
    };

    const triggerFileInput = () => fileInput.value?.click();

    const handleFileUpload = async (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        const currentPhotos = photos.value || [];
        await updateUserData({
          photos: [...currentPhotos, base64String].slice(0, 3),
        });
        if (fileInput.value) fileInput.value.value = '';
      };
      reader.readAsDataURL(file);
    };

    const confirmDelete = async () => {
      if (pendingDeleteIndex.value !== null && countryUserData.value) {
        const currentPhotos = [...photos.value];
        currentPhotos.splice(pendingDeleteIndex.value, 1);
        await updateUserData({ photos: currentPhotos });
        pendingDeleteIndex.value = null;
      }
    };

    const removePhoto = (index: number) => {
      pendingDeleteIndex.value = index;
      showDeleteDialog.value = true;
    };

    const updateNote = async (newNote: string | number | null) => {
      await updateUserData({ note: String(newNote || '') });
    };

    const updateStatus = async (newStatus: VisitStatus) => {
      await updateUserData({ status: newStatus });
      if (newStatus === VisitStatus.Visited) {
        triggerConfetti();
      }
    };

    return {
      props,
      photos,
      fileInput,
      triggerFileInput,
      handleFileUpload,
      removePhoto,
      note,
      updateNote,
      countryRegion,
      countrySovereignty,
      status,
      updateStatus,
      countryDifficulty,
      VisitStatus,
      filtersStore,
      cardClasses,
      formattedSize,
      showDeleteDialog,
      confirmDelete,
    };
  },
});
</script>

<style lang="scss" scoped>
.location-info {
  font-weight: 500;
}

.divider {
  margin: 0 4px;
  opacity: 0.6;
}

.stats {
  display: flex;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
}

.type {
  font-style: italic;
}

.country-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.country-flag {
  font-size: 4rem;
  flex-shrink: 0;
}

.visited-country {
  background-color: rgba($positive_light, 0.95);
}

.upcoming-country {
  background-color: rgba($info_light, 0.95);
}

.status-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  padding-bottom: 1em;
  flex-wrap: wrap;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 8px;
}

.photo-item {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid $secondary;
}

.upload-btn {
  aspect-ratio: 1;
  width: 100%;
  border: 2px dashed $primary;
}

.photo-item .q-img__content {
  pointer-events: none;
}

.delete-photo-button {
  pointer-events: auto;
  z-index: 2;
}

.unvisited_button {
  color: $primary;
  background-color: rgba($negative_light, 0.95);
}

.visited_button {
  color: $primary;
  background-color: rgba($positive_light, 0.95);
}

.upcoming_button {
  color: $primary;
  background-color: rgba($info_light, 0.95);
}
</style>
