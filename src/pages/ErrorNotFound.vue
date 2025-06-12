<template>
  <main v-once class="fullscreen text-center q-pa-md flex flex-center">
    <div class="error-container">
      <div class="error-code">404</div>
      <h1 class="text-h2 error-message">Oops. Nothing here...</h1>
      <q-btn
        class="q-mt-xl"
        color="primary"
        unelevated
        to="/"
        label="Go Home"
        no-caps
      />
    </div>
  </main>
</template>

<script setup lang="ts">
defineOptions({
  name: 'ErrorNotFound',
});
</script>

<style lang="scss" scoped>
.error-code {
  font-size: 30vh;
  line-height: 1;
}

.error-message {
  opacity: 0.8;
  color: $negative;
}

.error-container {
  text-align: center;
}
</style>
