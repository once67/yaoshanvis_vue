import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/database',
    name: 'Database',
    component: () => import('../views/Database.vue')
  },
  {
    path: '/recipes',
    name: 'Recipes',
    component: () => import('../views/Recipes.vue')
  },
  {
    path: '/seasons',
    name: 'Seasons',
    component: () => import('../views/Seasons.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 