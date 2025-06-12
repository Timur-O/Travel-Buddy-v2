<template>
  <div class="login-container">
    <h2 class="text-h5 q-mb-lg text-weight-medium text-center">Welcome Back</h2>

    <q-form @submit.prevent="onSubmit" class="login-form">
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

      <q-btn
        label="Sign In"
        type="submit"
        color="primary"
        class="modern-button full-width"
        unelevated
        :loading="isLoading"
      />
    </q-form>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useAuthStore } from 'src/stores/auth';
import { useQuasar } from 'quasar';
import { FirebaseError } from 'firebase/app';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'LoginPage',
  emits: ['loginSuccess'],
  setup() {
    const authStore = useAuthStore();
    const router = useRouter();
    const $q = useQuasar();

    const email = ref('');
    const password = ref('');
    const isPwd = ref(true);
    const isLoading = ref(false);

    const emailRules = [(val: string) => !!val || 'Email is required'];
    const passwordRules = [(val: string) => !!val || 'Password is required'];

    const togglePassword = () => {
      isPwd.value = !isPwd.value;
    };

    const onSubmit = async () => {
      if (isLoading.value) return;

      isLoading.value = true;
      try {
        await authStore.login(email.value, password.value);
        $q.notify({
          color: 'positive',
          message: 'Login successful',
          icon: 'check',
        });
        const redirectPath =
          router.currentRoute.value.query.redirect?.toString() || '/plan';
        await router.replace(redirectPath);
      } catch (error) {
        if (error instanceof FirebaseError) {
          if (error.code === 'auth/invalid-credential') {
            $q.notify({
              color: 'negative',
              message: 'Email or password is incorrect.',
              icon: 'warning',
            });
          } else {
            $q.notify({
              color: 'negative',
              message: 'Login failed: ' + (error as Error).message,
              icon: 'report_problem',
            });
          }
        } else {
          $q.notify({
            color: 'negative',
            message: 'Login failed: ' + (error as Error).message,
            icon: 'report_problem',
          });
        }
      } finally {
        isLoading.value = false;
      }
    };

    return {
      email,
      password,
      isPwd,
      isLoading,
      onSubmit,
      togglePassword,
      emailRules,
      passwordRules,
    };
  },
});
</script>

<style lang="scss" scoped>
.login-container {
  width: 100%;
  padding: 20px;
}

.login-form {
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
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba($primary, 0.3);
  }
}

:deep(.q-icon) {
  transition: transform 0.3s ease;
}

:deep(.q-field:hover .q-icon) {
  transform: scale(1.1);
}
</style>
