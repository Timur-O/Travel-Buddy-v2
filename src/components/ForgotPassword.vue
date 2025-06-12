<template>
  <div class="forgot-password-container">
    <h2 class="text-h5 q-mb-lg text-weight-medium text-center">
      Reset Your Password
    </h2>

    <q-form @submit.prevent="onSubmit" class="forgot-form">
      <q-input
        filled
        v-model.trim="email"
        label="Email"
        type="email"
        class="modern-input"
        :rules="emailRules"
        lazy-rules
      >
        <template #prepend>
          <q-icon name="email" color="primary" />
        </template>
      </q-input>

      <q-btn
        label="Reset Password"
        type="submit"
        color="primary"
        class="modern-button full-width"
        unelevated
        :loading="isSubmitting"
      />
    </q-form>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useAuthStore } from 'src/stores/auth';
import { useQuasar } from 'quasar';

export default defineComponent({
  name: 'ForgotPassword',
  setup() {
    const authStore = useAuthStore();
    const $q = useQuasar();
    const email = ref('');
    const isSubmitting = ref(false);

    const emailRules = computed(() => [
      (val: string) => !!val || 'Email is required',
      (val: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Invalid email format',
    ]);

    const onSubmit = async () => {
      if (isSubmitting.value) return;

      isSubmitting.value = true;
      try {
        await authStore.forgotPassword(email.value);
        $q.notify({
          color: 'positive',
          message: 'Password reset email sent',
          icon: 'check',
          position: 'top',
          timeout: 3000,
        });
        email.value = '';
      } catch (error) {
        $q.notify({
          color: 'negative',
          message: 'Failed to send reset email: ' + (error as Error).message,
          icon: 'report_problem',
          position: 'top',
          timeout: 5000,
        });
      } finally {
        isSubmitting.value = false;
      }
    };

    return {
      email,
      onSubmit,
      emailRules,
      isSubmitting,
    };
  },
});
</script>

<style lang="scss" scoped>
.forgot-password-container {
  width: 100%;
  padding: 20px;
  contain: content;
}

.forgot-form {
  max-width: 100%;
  will-change: transform;
}

.modern-input {
  margin-bottom: 24px;
}

:deep(.q-field__control) {
  border-radius: 12px;
  height: 56px;
  background: $bg;
  contain: strict;
}

:deep(.q-field--filled .q-field__control:before) {
  border: none;
}

:deep(.q-field--filled.q-field--focused .q-field__control) {
  background: $bg;
  box-shadow: 0 0 0 1px $primary;
}

.modern-button {
  height: 48px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 0.5px;
  background: linear-gradient(120deg, $primary 0%, $secondary 100%);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  will-change: transform, box-shadow;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba($primary, 0.3);
  }
}
</style>
