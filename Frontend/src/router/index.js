import { createWebHistory, createRouter } from 'vue-router';
import axios from 'axios';
import Login from './../views/loginView.vue';
import Dashboard from './../views/dashboardView.vue';
import Signup from './../views/signupView.vue';
import Test from './../views/test.vue';
import NotFound from './../components/notFoundView.vue';
import Room from './../views/roomView.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true },
  },
  {
    path: '/signup',
    name: 'Signup',
    component: Signup,
    meta: { requiresAuth: false },
  },
  {
    path: '/room',
    name: 'Room',
    component: Room,
    meta: { requiresAuth: true },
  },
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/:catchAll(.*)',
    name: '404-not-found',
    component: NotFound,
  },
  {
    path: '/test',
    name: 'TEST',
    component: Test,
    meta: { requiresAuth: false },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const url = `${import.meta.env.VITE_SERVER_API_URL}users/user-verification`;

router.beforeEach(async (to, from, next) => {
  if (
    to.matched.some((record) => record.meta.requiresAuth) &&
    to.name !== 'Login'
  ) {
    const authToken = localStorage.getItem('authToken');
    console.log(to.name);
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
