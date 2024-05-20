import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import './style.css';

import router from './router/index.js';
// SWAL SWEET ALERTS GLOBAL CONFIG
import VueSweetalert2 from 'vue-sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const pinia = createPinia();
const app = createApp(App);

app.use(VueSweetalert2);
app.use(pinia);
app.use(router).mount('#app');
