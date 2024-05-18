import { createWebHistory, createRouter } from 'vue-router';
import axios from 'axios';
import Login from './../views/loginView.vue';
import Dashboard from './../views/dashboardView.vue';

const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login,
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const url = 'http://192.168.29.201:4000/api/v1/users/user-verification';

router.beforeEach(async (to, from, next) => {
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      try {
        const response = await axios.post(
          url,
          {},
          {
            headers: {
              authorization: `Bearer ${authToken}`,
            },
          }
        );
        if (response.status === 200 && response.data.status === 'success') {
          console.log('access allowed');
          next(); // Authentication successful, proceed to the route
        } else {
          throw new Error('Authentication failed');
        }
      } catch (error) {
        console.error('Authentication error:', error);
        localStorage.removeItem('authToken');
        next({ name: 'Login' });
      }
    } else {
      next({ name: 'Login' });
    }
  } else {
    next(); // Route does not require authentication, proceed as normal
  }
});
export default router;
