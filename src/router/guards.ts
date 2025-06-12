import { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import { useFirestoreStore } from 'stores/firestore';

export async function requireAuth(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const authStore = useAuthStore();
  await authStore.init();

  authStore.authUser
    ? next()
    : next({ path: '/', query: { redirect: to.fullPath } });
}

export async function requireNoAuth(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const authStore = useAuthStore();
  await authStore.init();

  if (authStore.authUser) {
    const redirectPath = String(to.query.redirect || '/plan');
    next(redirectPath);
  } else {
    next();
  }
}

export async function requireAdmin(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const authStore = useAuthStore();
  await authStore.init();

  const firestoreStore = useFirestoreStore();

  !authStore.authUser || !firestoreStore.currentUser?.isAdmin
    ? next({ path: '/plan' })
    : next();
}
