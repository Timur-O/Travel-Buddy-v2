<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="modern-header">
      <q-toolbar>
        <q-btn
          v-if="authStore.authUser"
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>Financial Travel Buddy</q-toolbar-title>

        <q-btn
          v-if="authStore.authUser && isSharePage"
          flat
          dense
          label="Back to My Map"
          class="modern-back-to-map-button"
          @click="redirect('/map')"
        />

        <q-btn
          flat
          dense
          label="Back to Blog"
          class="modern-blog-button"
          href="https://financialtravelbuddy.com"
        />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-if="authStore.authUser && !isSharePage"
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      class="modern-drawer"
    >
      <div>
        <q-btn
          v-show="hasActiveFilters"
          flat
          dense
          icon="clear_all"
          label="Clear Filters"
          class="modern-clear-filters-button"
          @click="filtersStore.clearAllFilters"
        />
        <q-input
          v-show="!isPlanPage && !isAdminPage"
          v-model="filtersStore.searchQuery"
          dense
          standout
          placeholder="Search countries..."
          class="q-ml-md search-input"
        >
          <template #append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>

      <q-list padding>
        <template v-for="link in filteredEssentialLinks" :key="link.title">
          <q-item clickable v-ripple @click="redirect(link.link)">
            <q-item-section avatar>
              <q-icon color="primary" :name="link.icon" />
            </q-item-section>

            <q-item-section>
              <q-item-label>{{ link.title }}</q-item-label>
              <q-item-label caption>{{ link.caption }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator spaced inset="item" />
        </template>

        <template v-if="authStore.authUser">
          <template v-if="!isStatisticsPage && !isPlanPage && !isAdminPage">
            <q-separator spaced />
            <q-item-label header>Status Filter</q-item-label>

            <q-option-group
              :options="mappedUserStatus"
              type="checkbox"
              :model-value="filtersStore.getSelectedUserStatus"
              @update:model-value="filtersStore.setSelectedUserStatus"
            />
          </template>

          <template
            v-if="
              !isListPage && !isStatisticsPage && !isPlanPage && !isAdminPage
            "
          >
            <q-separator spaced />
            <q-item-label header>Region Filter</q-item-label>

            <q-option-group
              :options="mappedRegions"
              type="checkbox"
              :model-value="filtersStore.getSelectedRegions"
              @update:model-value="filtersStore.setSelectedRegions"
            />
          </template>

          <template v-if="!isPlanPage && !isAdminPage">
            <q-separator spaced />
            <q-item-label header>Sovereignty Filter</q-item-label>

            <q-option-group
              :options="mappedSovereignties"
              type="checkbox"
              :model-value="filtersStore.getSelectedSovereignties"
              @update:model-value="filtersStore.setSelectedSovereignties"
            />
          </template>

          <q-separator spaced />
          <q-item-label header>Settings</q-item-label>

          <q-item>
            <q-item-section>
              <q-toggle
                v-model="filtersStore.simpleMode"
                label="Disable Photos and Notes"
                color="primary"
              />
            </q-item-section>
          </q-item>

          <q-btn
            flat
            dense
            icon="logout"
            class="modern-logout-button"
            @click="logout"
          >
            Logout
          </q-btn>
        </template>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { computed, defineComponent, ref, onMounted } from 'vue';
import { useAuthStore } from 'src/stores/auth';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useFirestoreStore } from 'stores/firestore';
import { GroupType, VisitStatus } from 'src/models';
import { useFiltersStore } from 'stores/filters';

interface NavLink {
  readonly title: string;
  readonly caption: string;
  readonly icon: string;
  readonly link: string;
  readonly adminOnly?: boolean;
}

const linksList: readonly NavLink[] = [
  {
    title: 'Plan',
    caption: 'Plan your travels...',
    icon: 'event',
    link: '/plan',
  },
  {
    title: 'Map',
    caption: 'View countries on the map...',
    icon: 'map',
    link: '/map',
  },
  {
    title: 'List',
    caption: 'View countries in a list...',
    icon: 'list',
    link: '/list',
  },
  {
    title: 'Statistics',
    caption: 'View statistics about your travels...',
    icon: 'bar_chart',
    link: '/statistics',
  },
  {
    title: 'Admin',
    caption: 'Admin dashboard...',
    icon: 'admin_panel_settings',
    link: '/admin',
    adminOnly: true,
  },
] as const;

export default defineComponent({
  name: 'MainLayout',

  setup() {
    const firestoreStore = useFirestoreStore();
    const filtersStore = useFiltersStore();
    const authStore = useAuthStore();
    const router = useRouter();
    const $q = useQuasar();

    const leftDrawerOpen = ref(false);
    const mappedRegions = ref<Array<{ label: string; value: string }>>([]);
    const mappedSovereignties = ref<Array<{ label: string; value: string }>>(
      []
    );

    const isPlanPage = computed(() =>
      router.currentRoute.value.path.includes('plan')
    );
    const isStatisticsPage = computed(() =>
      router.currentRoute.value.path.includes('statistics')
    );
    const isListPage = computed(() =>
      router.currentRoute.value.path.includes('list')
    );
    const isAdminPage = computed(() =>
      router.currentRoute.value.path.includes('admin')
    );
    const isSharePage = computed(() =>
      router.currentRoute.value.path.includes('share')
    );

    const filteredEssentialLinks = computed(() =>
      linksList.filter(
        (link) => !link.adminOnly || firestoreStore.currentUser?.isAdmin
      )
    );

    const mappedUserStatus = Object.values(VisitStatus).map((status) => ({
      label: status,
      value: status,
    }));

    const hasActiveFilters = computed(
      () =>
        filtersStore.getSelectedRegions.length > 0 ||
        filtersStore.getSelectedSovereignties.length > 0 ||
        filtersStore.getSelectedUserStatus.length > 0 ||
        filtersStore.getSearchQuery.length > 0
    );

    onMounted(async () => {
      await firestoreStore.fetchGroups();
      mappedRegions.value = firestoreStore.groups
        .filter((g) => g.type === GroupType.Region)
        .map((group) => ({
          label: group.name,
          value: group.id,
        }));

      mappedSovereignties.value = firestoreStore.groups
        .filter((g) => g.type === GroupType.Sovereignty)
        .map((group) => ({
          label: group.name,
          value: group.id,
        }));
    });

    const toggleLeftDrawer = () => {
      leftDrawerOpen.value = !leftDrawerOpen.value;
    };

    const redirect = (link: string) => {
      router.push(link);
    };

    const logout = async () => {
      try {
        await authStore.logout();
        $q.notify({
          color: 'positive',
          message: 'Logout successful',
          icon: 'check',
        });
        await router.replace('/');
      } catch (error) {
        $q.notify({
          color: 'negative',
          message: 'Logout failed: ' + (error as Error).message,
          icon: 'report_problem',
        });
      }
    };

    router.beforeEach((to, _, next) => {
      if (to.path === '/statistics') {
        filtersStore.setSelectedUserStatus([]);
      }
      if (to.path === '/list') {
        filtersStore.setSelectedRegions([]);
      }
      next();
    });

    return {
      essentialLinks: linksList,
      filteredEssentialLinks,
      leftDrawerOpen,
      toggleLeftDrawer,
      authStore,
      firestoreStore,
      redirect,
      logout,
      mappedRegions,
      mappedSovereignties,
      mappedUserStatus,
      filtersStore,
      isStatisticsPage,
      isListPage,
      hasActiveFilters,
      isPlanPage,
      isAdminPage,
      isSharePage,
    };
  },
});
</script>

<style lang="scss" scoped>
:deep(.q-checkbox) {
  .q-checkbox__inner {
    width: 1.4em;
    height: 1.4em;
  }

  .q-checkbox__bg {
    border-radius: 6px;
    border: 2px solid $secondary;
    transition: all 0.2s ease;
  }
}

:deep(.q-checkbox--checked) .q-checkbox__bg {
  background: linear-gradient(120deg, $primary 0%, $secondary 100%);
  border-color: transparent;
}

/*.Modern Search */
.search-input {
  margin-top: 1em;
  padding-right: 1.5em;
  border-radius: 20px;
}

.search-input :deep(.q-field__control) {
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba($primary, 0.05);
}

.modern-header {
  color: $primary;
  background: linear-gradient(120deg, $bg 0%, $bg_shade 100%);
  box-shadow: 0 2px 12px rgba($bg_shade, 0.1);
}

.modern-drawer {
  background: $bg;
  border-right: 1px solid $bg_shade;
}

.q-item {
  border-radius: 8px;
  margin: 4px 8px;
  transition: all 0.2s ease;
}

.q-item:hover {
  background: $secondary;
  transform: translateX(4px);
}

/* Modern Logout Button */
.modern-logout-button {
  margin: 16px auto;
  display: block;
  padding: 8px 24px;
  border-radius: 20px;
  background-color: $negative_light;
  color: $primary;
  box-shadow: 0 4px 12px rgba($secondary, 0.2);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba($secondary, 0.3);
  }
}

/* Additional modern enhancements */
.q-toolbar-title {
  font-weight: 600;
  letter-spacing: 0.5px;
}

.q-item-label {
  font-weight: 500;
  color: $secondary;
}

.q-item-label[header] {
  text-transform: uppercase;
  font-size: 0.8em;
  letter-spacing: 1px;
  color: $primary;
}

.q-separator {
  height: 2px;
  background: linear-gradient(to right, transparent, $bg_shade, transparent);
}

/* Hover effects for menu items */
.q-item {
  margin: 4px 12px;
  border-radius: 12px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba($secondary, 0.1);
    transform: translateX(4px);
  }

  .q-icon {
    transition: all 0.2s ease;
  }

  &:hover .q-icon {
    transform: scale(1.1);
  }
}

.modern-clear-filters-button {
  margin: 16px auto;
  display: block;
  padding: 8px 24px;
  border-radius: 20px;
  background: $negative_light;
  color: $primary;
  box-shadow: 0 4px 12px rgba($secondary, 0.2);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba($secondary, 0.3);
  }
}

.modern-blog-button {
  margin: 16px auto;
  display: block;
  padding: 8px 24px;
  border-radius: 20px;
  background: $accent;
  color: $primary_opposite;
  box-shadow: 0 4px 12px rgba($secondary, 0.2);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba($secondary, 0.3);
  }
}

.modern-back-to-map-button {
  margin-right: 1em;
  display: block;
  padding: 8px 24px;
  border-radius: 20px;
  background: $bg_shade;
  color: $primary;
  box-shadow: 0 4px 12px rgba($secondary, 0.2);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba($secondary, 0.3);
  }
}
</style>
