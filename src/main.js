import * as echarts from 'echarts'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'
import { wuxingTheme } from './utils/echartsConfig'

const app = createApp(App)

app.use(ElementPlus)
app.use(createPinia())
app.use(router)

// 注册主题
echarts.registerTheme('wuxing', wuxingTheme)

app.mount('#app')
