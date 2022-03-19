import { createApp } from 'vue'
import App from './App.vue'
// import 'element-plus/lib/theme-chalk/index.css'
// import 'element-plus/lib/theme-chalk/display.css'
import store from './store'
import router from './router'
import i18n from '@/locales'
import Quasar from 'quasar/src/vue-plugin.js';import Notify from 'quasar/src/plugins/Notify.js';
import quasarUserOptions from './quasar-user-options'
const app = createApp(App)
app.use(Quasar,{plugins: {
        Notify
    },
    config: {
        notify: { /* look at QuasarConfOptions from the API card */ }
    },quasarUserOptions}).use(router).use(store).use(i18n)

app.mount('#app')
