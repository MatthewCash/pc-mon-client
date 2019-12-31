import './assets/tailwind.css';

import Vue from 'vue';
import App from './App.vue';
import store from './store';
import { VueHammer } from 'vue2-hammer';
Vue.use(VueHammer);

Vue.config.productionTip = false;

new Vue({
    store,
    render: h => h(App)
}).$mount('#app');
