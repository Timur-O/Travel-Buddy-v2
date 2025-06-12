<template>
  <q-page class="auth-page flex flex-center">
    <div v-show="!authStore.authUser" class="auth-container">
      <div class="app-description q-mb-lg text-center">
        <h1 class="text-h4 text-weight-bold q-mb-md">
          Welcome to Travel Buddy!
        </h1>
        <p class="text-body1">
          Track the countries (both sovereign and not) you have visited, plan
          your future trips, and compare your statistics to those of your
          friends.
        </p>
      </div>

      <q-card class="auth-card">
        <q-tabs
          v-model="tab"
          class="text-primary auth-tabs"
          narrow-indicator
          dense
        >
          <q-tab name="login" label="Login" />
          <q-tab name="register" label="Register" />
          <q-tab name="forgotPassword" label="Forgot Password" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="tab" animated class="auth-panels">
          <q-tab-panel name="login">
            <Login />
          </q-tab-panel>

          <q-tab-panel name="register">
            <Register />
          </q-tab-panel>

          <q-tab-panel name="forgotPassword">
            <ForgotPassword />
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </div>
  </q-page>
</template>
<script lang="ts">
import { defineComponent, ref, defineAsyncComponent } from 'vue';
import { useAuthStore } from 'src/stores/auth';

export default defineComponent({
  name: 'IndexPage',
  components: {
    Login: defineAsyncComponent(() => import('components/Login.vue')),
    Register: defineAsyncComponent(() => import('components/Register.vue')),
    ForgotPassword: defineAsyncComponent(
      () => import('components/ForgotPassword.vue')
    ),
  },
  setup() {
    const authStore = useAuthStore();
    const tab = ref('login');

    return {
      authStore,
      tab,
    };
  },
});
</script>

<style lang="scss" scoped>
.auth-page {
  background: $bg_shade;
  min-height: 100vh;
  will-change: transform;
}

.auth-container {
  width: 100%;
  max-width: 450px;
  padding: 20px;
  contain: content;
}

.auth-card {
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  background: $bg;
  contain: layout style;
}

.auth-tabs {
  background: rgba($bg, 0.9);
  backdrop-filter: blur(10px);
  contain: content;
}

:deep(.q-tab) {
  padding: 16px 24px;
  transition: transform 0.3s ease;
  contain: layout style;
}

:deep(.q-tab:hover) {
  background: rgba($primary, 0.1);
  transform: translateY(-1px);
}

:deep(.q-tab--active) {
  color: $primary;
  font-weight: 600;
}

.auth-panels {
  padding: 24px;
  contain: content;
}

:deep(.q-field) {
  margin-bottom: 16px;
}

:deep(.q-field--error .q-field__bottom) {
  color: $negative;
}

:deep(.q-btn) {
  border-radius: 8px;
  height: 48px;
  font-weight: 600;
  text-transform: none;
}
</style>
