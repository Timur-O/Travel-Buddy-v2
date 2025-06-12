import { RouteRecordRaw } from 'vue-router';
import { requireAdmin, requireAuth, requireNoAuth } from './guards';
import MainLayout from 'layouts/MainLayout.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        component: () => import('pages/Index.vue'),
        beforeEnter: requireNoAuth,
      },
      {
        path: 'plan',
        component: () => import('pages/Plan.vue'),
        beforeEnter: requireAuth,
      },
      {
        path: 'plan/:id',
        component: () => import('pages/ItineraryDetails.vue'),
        beforeEnter: requireAuth,
      },
      {
        path: 'map',
        component: () => import('pages/Map.vue'),
        beforeEnter: requireAuth,
      },
      {
        path: 'statistics',
        component: () => import('pages/Statistics.vue'),
        beforeEnter: requireAuth,
      },
      {
        path: 'list',
        component: () => import('pages/List.vue'),
        beforeEnter: requireAuth,
      },
      {
        path: 'admin',
        component: () => import('pages/Admin.vue'),
        beforeEnter: requireAdmin,
      },
      {
        path: 'share/:id',
        component: () => import('pages/SharePage.vue'),
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];
export default routes;
