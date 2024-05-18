import { createWebHistory, createRouter } from "vue-router";
import Login from "./../views/loginView.vue";

const routes = [
  {
    path: "/",
    name: "Login",
    component: Login,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
