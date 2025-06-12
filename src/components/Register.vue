<template>
  <div class="register-container">
    <h2 class="text-h5 q-mb-lg text-weight-medium text-center">
      Create Account
    </h2>

    <q-form @submit.prevent="onSubmit" class="register-form">
      <q-input
        filled
        v-model.trim="displayName"
        label="Display Name"
        class="modern-input"
        :rules="displayNameRules"
        lazy-rules
      >
        <template #prepend>
          <q-icon name="person" color="primary" />
        </template>
      </q-input>

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

      <q-input
        filled
        v-model.trim="password"
        label="Password"
        class="modern-input"
        :type="isPwd ? 'password' : 'text'"
        :rules="passwordRules"
        lazy-rules
      >
        <template #prepend>
          <q-icon name="lock" color="primary" />
        </template>
        <template #append>
          <q-icon
            :name="isPwd ? 'visibility_off' : 'visibility'"
            class="cursor-pointer"
            @click="togglePassword"
          />
        </template>
      </q-input>

      <q-input
        filled
        v-model.trim="confirmPassword"
        label="Confirm Password"
        class="modern-input"
        :type="isPwd ? 'password' : 'text'"
        :rules="confirmPasswordRules"
        lazy-rules
      >
        <template #prepend>
          <q-icon name="lock" color="primary" />
        </template>
        <template #append>
          <q-icon
            :name="isPwd ? 'visibility_off' : 'visibility'"
            class="cursor-pointer"
            @click="togglePassword"
          />
        </template>
      </q-input>

      <q-btn
        label="Create Account"
        type="submit"
        color="primary"
        class="modern-button full-width"
        unelevated
      />
    </q-form>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useAuthStore } from 'src/stores/auth';
import { useQuasar } from 'quasar';
import { FirebaseError } from 'firebase/app';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'RegisterPage',
  emits: ['register-success'],
  setup() {
    const authStore = useAuthStore();
    const router = useRouter();
    const $q = useQuasar();

    const displayName = ref('');
    const displayNameRules = [
      (val: string) => !!val || 'Display name is required',
      (val: string) =>
        val.length >= 2 || 'Display name must be at least 2 characters',
    ];
    const email = ref('');
    const password = ref('');
    const confirmPassword = ref('');
    const isPwd = ref(true);

    const emailRules = [(val: string) => !!val || 'Email is required'];

    const passwordRules = computed(() => [
      (val: string) => !!val || 'Password is required',
      (val: string) =>
        val.length >= 8 || 'Password must be at least 8 characters',
      (val: string) =>
        (/[A-Z]/.test(val) && /[a-z]/.test(val) && /[0-9]/.test(val)) ||
        'Password must contain a number, a lowercase letter and an uppercase letter',
      (val: string) =>
        /[!@#$%^&*()_=+{}|;:,<.>/?-]/.test(val) ||
        'Password must contain a special character',
    ]);

    const confirmPasswordRules = computed(() => [
      (val: string) => !!val || 'Please confirm your password',
      (val: string) => val === password.value || 'Passwords do not match',
    ]);

    const togglePassword = () => {
      isPwd.value = !isPwd.value;
    };

    const showError = (message: string) => {
      $q.notify({
        color: 'negative',
        message,
        icon: 'report_problem',
      });
    };

    const onSubmit = async () => {
      if (password.value !== confirmPassword.value) {
        showError('Passwords do not match');
        return;
      }

      try {
        await authStore.register(
          displayName.value,
          email.value,
          password.value
        );
        $q.notify({
          color: 'positive',
          message: 'Registration successful',
          icon: 'check',
        });
        const redirectPath =
          router.currentRoute.value.query.redirect?.toString() || '/plan';
        await router.replace(redirectPath);
      } catch (error) {
        if (error instanceof FirebaseError) {
          if (error.code === 'auth/password-does-not-meet-requirements') {
            showError(
              'Password must be at least 8 characters, and contain an upper-case, lower-case, number, and special character.'
            );
          } else {
            showError('Registration failed: ' + (error as Error).message);
          }
        } else {
          showError('Registration failed: ' + (error as Error).message);
        }
      }
    };

    return {
      displayName,
      email,
      password,
      confirmPassword,
      isPwd,
      onSubmit,
      displayNameRules,
      emailRules,
      passwordRules,
      confirmPasswordRules,
      togglePassword,
    };
  },
});
</script>

<style lang="scss" scoped>
.register-container {
  width: 100%;
  padding: 20px;
}

.register-form {
  max-width: 100%;
}

.modern-input {
  margin-bottom: 24px;
}

:deep(.q-field__control) {
  border-radius: 12px;
  height: 56px;
  background: $bg;
}

:deep(.q-field--filled .q-field__control:before) {
  border: none;
}

:deep(.q-field--filled.q-field--focused .q-field__control) {
  background: $bg;
  box-shadow: 0 0 0 1px $primary;
}

:deep(.q-field__prepend) {
  padding-left: 12px;
}

:deep(.q-field__append) {
  padding-right: 12px;
}

.modern-button {
  height: 48px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 0.5px;
  background: linear-gradient(120deg, $primary 0%, $secondary 100%);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba($primary, 0.3);
  }
}

:deep(.q-icon) {
  transition: all 0.3s ease;
}

:deep(.q-field:hover .q-icon) {
  transform: scale(1.1);
}
</style>
