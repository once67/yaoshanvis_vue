<template>
  <div class="home-container">
    <!-- 背景层 -->
    <div class="background-layer">
      <div class="ink-texture"></div>
      <div class="paper-texture"></div>
      <div class="taichi-pattern"></div>
    </div>

    <!-- 顶部导航 - 重新设计更加高级正式 -->
    <header class="top-nav glassmorphism">
      <div class="logo-area">
        <img :src="getAssetPath('/logos/seal-logo.png')" alt="药膳可视化系统" class="logo">
        <div class="title-area">
          <h1>药馔千秋·膳和百味</h1>
          <div class="subtitle">药食同源数据可视化系统</div>
        </div>
      </div>
      <nav class="main-nav">
        <a href="#" class="nav-item active">
          <span class="nav-icon home-icon"></span>
          <span>首页</span>
        </a>
        <a href="#" class="nav-item" @click.prevent="navigateTo('/database')">
          <span class="nav-icon database-icon"></span>
          <span>药食数据库</span>
        </a>
        <a href="#" class="nav-item" @click.prevent="navigateTo('/recipes')">
          <span class="nav-icon recipe-icon"></span>
          <span>药膳配方</span>
        </a>
        <a href="#" class="nav-item" @click.prevent="navigateTo('/seasons')">
          <span class="nav-icon season-icon"></span>
          <span>个性化养生</span>
        </a>
      </nav>
      <div class="nav-tools">
        <div class="search-box">
          <input type="text" placeholder="搜索药材..." />
          <button class="search-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#5d4037" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M21 21L16.65 16.65" stroke="#5d4037" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </header>

    

    <!-- 主内容区：功能卡片 -->
    <main class="main-content">
      <div class="intro-text">
        <h2>探索中医药膳文化，了解药食同源的智慧</h2>
      </div>
      
      <div class="feature-cards">
        <div 
          v-for="(card, index) in featureCards" 
          :key="index" 
          class="feature-card"
          @mouseenter="activateCard(index)"
          @mouseleave="deactivateCard(index)"
          @click="navigateTo(card.route)"
        >
          <!-- 上部图标区域 -->
          <div class="card-icon-area" :class="{ 'active': activeCardIndex === index }">
            <div class="card-icon-wrapper">
              <div class="card-icon" :style="{ backgroundImage: `url(${getAssetPath(card.icon)})` }"></div>
              <div class="icon-glow"></div>
            </div>
            <div class="icon-bg-pattern" :style="{ backgroundImage: `url(${getAssetPath(`/backgrounds/pattern-${index+1}.svg`)})` }"></div>
          </div>
          
          <!-- 下部白色内容区域 -->
          <div class="card-content" :class="{ 'active': activeCardIndex === index }">
            <h3>{{ card.title }}</h3>
            <p>{{ card.description }}</p>
            <div class="card-action">
              <span>探索</span>
              <div class="arrow-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 底部区域 -->
    <footer class="bottom-panel glassmorphism">
      <div class="wisdom-quote">
        <p>"药食同源，医食同理"</p>
        <span>——《黄帝内经》</span>
      </div>
      <div class="footer-links">
        <a href="#">关于系统</a>
        <a href="#">使用帮助</a>
        <a href="#">数据来源</a>
      </div>
    </footer>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getAssetPath } from '../utils/paths'

export default {
  name: 'Home',
  setup() {
    const router = useRouter()
    const activeCardIndex = ref(null)

    const featureCards = [
      {
        title: '药食数据库',
        description: '分类展示药食同源食材，了解不同食材的药用价值和五行归属，探索传统中医药理论。',
        icon: '/icons/database.svg',
        route: '/database'
      },
      {
        title: '个性化养生',
        description: '十二支月气食疗养生指南，根据时令变化调整饮食结构，顺应自然规律保持健康。',
        icon: '/icons/season.svg',
        route: '/seasons'
      },
      {
        title: '药膳配方',
        description: '古籍药膳方集，了解不同体质的食疗方案，通过可视化展示配伍原理与功效关系。',
        icon: '/icons/recipe.svg',
        route: '/recipes'
      }
    ]

    const navigateTo = (route) => {
      router.push(route)
    }

    const activateCard = (index) => {
      activeCardIndex.value = index
    }

    const deactivateCard = () => {
      activeCardIndex.value = null
    }

    return {
      featureCards,
      activeCardIndex,
      navigateTo,
      activateCard,
      deactivateCard,
      getAssetPath
    }
  }
}
</script>

<style scoped>
.home-container {
  width: 100vw;
  height: 100vh;
  display: grid;
  grid-template-rows: 90px 1fr 70px;
  position: relative;
  overflow: hidden;
  font-family: 'SimSun', serif;
  background-color: #f9f6f0;
  background-image: v-bind('`url(${getAssetPath("/backgrounds/home.png")})`');
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
}

/* 背景层样式 */
.background-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

.ink-texture {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: v-bind('`url(${getAssetPath("/backgrounds/ink-texture.jpg")})`') no-repeat center center;
  background-size: cover;
  opacity: 0.04;
}

.paper-texture {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: v-bind('`url(${getAssetPath("/backgrounds/paper-texture.jpg")})`') repeat;
  opacity: 0.08;
  mix-blend-mode: multiply;
}

.taichi-pattern {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1000px;
  height: 1000px;
  background: v-bind('`url(${getAssetPath("/backgrounds/taichi-pattern.svg")})`') no-repeat center center;
  background-size: contain;
  opacity: 0.02;
  transform: translate(-50%, -50%) rotate(8deg);
}

/* 顶部导航 - 重新设计更加高级正式 */
.top-nav {
  grid-row: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  z-index: 10;
  border-bottom: 1px solid rgba(141, 110, 99, 0.1);
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logo {
  width: 50px;
  height: 50px;
  transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.logo:hover {
  transform: rotate(15deg) scale(1.1);
}

.title-area {
  display: flex;
  flex-direction: column;
}

.title-area h1 {
  font-size: 1.6rem;
  color: #5d4037;
  margin: 0;
  font-weight: normal;
  letter-spacing: 2px;
}

.subtitle[data-v-2dc54a20] {
    font-size: 0.9rem;
    color: #8d6e63;
    letter-spacing: 8px;
}

.main-nav {
  display: flex;
  gap: 20px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #5d4037;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.3s ease;
  position: relative;
}

.nav-item::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  width: 0;
  height: 2px;
  background-color: #8d6e63;
  transition: all 0.3s ease;
  transform: translateX(-50%);
}

.nav-item:hover::after,
.nav-item.active::after {
  width: 80%;
}

.nav-item.active {
  background-color: rgba(141, 110, 99, 0.1);
}

.nav-icon {
  width: 20px;
  height: 20px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.home-icon {
  background-image: v-bind('`url(${getAssetPath("/icons/home.svg")})`');
}

.database-icon {
  background-image: v-bind('`url(${getAssetPath("/icons/database.svg")})`');
}

.recipe-icon {
  background-image: v-bind('`url(${getAssetPath("/icons/recipe.svg")})`');
}

.season-icon {
  background-image: v-bind('`url(${getAssetPath("/icons/season.svg")})`');
}

.nav-tools {
  display: flex;
  align-items: center;
}

.search-box {
  display: flex;
  align-items: center;
  border: 1px solid rgba(141, 110, 99, 0.3);
  border-radius: 20px;
  padding: 5px 10px;
  background: rgba(255, 255, 255, 0.6);
  transition: all 0.3s ease;
}

.search-box:focus-within {
  box-shadow: 0 0 0 2px rgba(141, 110, 99, 0.2);
  background: rgba(255, 255, 255, 0.9);
}

.search-box input {
  border: none;
  outline: none;
  background: transparent;
  color: #5d4037;
  font-family: 'SimSun', serif;
  padding: 0 5px;
  width: 150px;
}

.search-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
}

/* 主内容区 */
.main-content {
  grid-row: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0 40px;
}

.intro-text {
  text-align: center;
  margin-bottom: 40px;
}

.intro-text h2 {
  font-size: 1.5rem;
  color:rgb(255, 255, 255);
  font-weight: 900;
  opacity: 0.85;
  margin: 0;
}

.feature-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
  max-width: 1200px;
  width: 100%;
}

.feature-card {
  display: flex;
  flex-direction: column;
  height: 400px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.5s ease;
}

.feature-card:hover {
  transform: translateY(-15px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
}

/* 卡片上部图标区域 */
.card-icon-area {
  position: relative;
  height: 200px;
  background-color: #8d6e63;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: height 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  overflow: hidden;
}

.card-icon-area.active {
  height: 220px;
}

.card-icon-wrapper {
  position: relative;
  z-index: 2;
}

.card-icon {
  width: 100px;
  height: 100px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
}

.feature-card:hover .card-icon {
  transform: scale(1.1);
}

.icon-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 70%);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.5s;
  z-index: 1;
}

.feature-card:hover .icon-glow {
  transform: translate(-50%, -50%) scale(1);
  opacity: 1;
}

.icon-bg-pattern {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: 180px 180px;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.2;
  transition: opacity 0.5s, transform 8s ease-in-out;
  transform: scale(1.1) rotate(-5deg);
}

.feature-card:hover .icon-bg-pattern {
  opacity: 0.4;
  transform: scale(1) rotate(0deg);
}

/* 卡片下部内容区域 */
.card-content {
  flex: 1;
  padding: 25px;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: background-color 0.3s;
}

.card-content.active {
  background-color: #fdfbf7;
}

.card-content h3 {
  margin: 0 0 15px 0;
  color: #5d4037;
  font-size: 1.4rem;
  font-weight: normal;
  position: relative;
}

.card-content h3::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 40px;
  height: 2px;
  background-color: #8d6e63;
  transition: width 0.3s;
}

.feature-card:hover .card-content h3::after {
  width: 80px;
}

.card-content p {
  color: #795548;
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 20px;
  flex: 1;
}

.card-action {
  display: flex;
  align-items: center;
  color: #8d6e63;
  transition: color 0.3s;
}

.feature-card:hover .card-action {
  color: #5d4037;
}

.arrow-icon {
  margin-left: 8px;
  transition: transform 0.3s;
}

.feature-card:hover .arrow-icon {
  transform: translateX(5px);
}

/* 底部面板 */
.bottom-panel {
  grid-row: 3;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  z-index: 10;
  border-top: 1px solid rgba(141, 110, 99, 0.1);
}

.wisdom-quote {
  text-align: center; /* 让整句话居中 */
  color: #5d4037;
  font-size: 1.2rem;
}

.wisdom-quote p, .wisdom-quote span {
  display: inline;  /* 让它们并排 */
  margin-left: 10px; /* 让《黄帝内经》稍微往右 */
}


.wisdom-quote span {
  font-size: 0.9rem;
  color: #8d6e63;
}

.footer-links {
  display: flex;
  gap: 20px;
}

.footer-links a {
  color: #8d6e63;
  text-decoration: none;
  transition: color 0.3s;
}

.footer-links a:hover {
  color: #5d4037;
}

/* 玻璃拟态效果 */
.glassmorphism {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
}

/* 针对不同卡片的颜色变化 */
.feature-card:nth-child(1) .card-icon-area {
  background-color: #6a8a73; /* 木-青色调 */
}

.feature-card:nth-child(2) .card-icon-area {
  background-color: #a06b58; /* 火-赤色调 */
}

.feature-card:nth-child(3) .card-icon-area {
  background-color: #9e9967; /* 土-黄色调 */
}
</style> 