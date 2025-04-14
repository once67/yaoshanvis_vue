<template>
  <div class="seasons-container">
    <!-- 古籍背景与科技感交互线条 -->
    <div class="ancient-paper-bg"></div>
    <div class="tech-lines"></div>
    
    <div class="header">
      <div class="title-area">
          <h1>药馔千秋·膳和百味</h1>
        </div>

      <div class="current-info">
        <span class="current-season">{{ currentSeason }}</span>
        <span class="current-time">{{ currentTime }}</span>
      </div>
    </div>
    
    <div class="content-container">
      <div class="left-section">
        <!-- 交互日历 + 二十四节气动画 -->
        <SeasonCalendar @select-season="handleSeasonChange" />
      </div>
      
      <div class="right-section">
        <!-- 个性化推荐（体质输入+AI推荐药膳） -->
        <PersonalRecommendation 
          :selectedSeason="selectedSeason"
          :userConstitution="userConstitution" 
          @update-constitution="updateConstitution" />
        
        <!-- 数据可视化（热力图 + 折线图） -->
        <DataVisualization 
          :selectedSeason="selectedSeason"
          :userConstitution="userConstitution" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { DataVisualization, PersonalRecommendation, SeasonCalendar } from '../components/seasons';
import { useSeasonsStore } from '../store';
import { getAssetPath, getDataPath } from '../utils/paths';

// 状态管理
const seasonsStore = useSeasonsStore();
const selectedSeason = ref(''); // 默认节气
const userConstitution = ref({
  type: '平和质', // 默认体质类型
  features: [] // 体质特征
});

// 月份数据
const monthsData = ref([]);

// 获取月份数据
const fetchMonthsData = async () => {
  try {
    const response = await fetch(getDataPath('/data/months_data.json'));
    const data = await response.json();
    monthsData.value = data;
    // 设置默认节气为当前月份
    const currentMonth = new Date().getMonth();
    selectedSeason.value = data[currentMonth].阴历月份;
  } catch (error) {
    console.error('获取月份数据失败:', error);
    // 设置一个默认值
    selectedSeason.value = '正月';
  }
};

// 当前时间和节气
const currentTime = ref('');
const currentSeason = computed(() => {
  return selectedSeason.value;
});

// 处理节气变更
const handleSeasonChange = (season) => {
  selectedSeason.value = season;
  seasonsStore.setCurrentSeason(season);
};

// 更新用户体质信息
const updateConstitution = (constitution) => {
  userConstitution.value = constitution;
};

// 更新当前时间
const updateCurrentTime = () => {
  const now = new Date();
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  currentTime.value = now.toLocaleDateString('zh-CN', options);
};

// 组件挂载时
onMounted(() => {
  // 初始化时间
  updateCurrentTime();
  setInterval(updateCurrentTime, 60000); // 每分钟更新一次时间
  
  // 获取月份数据
  fetchMonthsData();
});
</script>

<style scoped>
.seasons-container {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  color: #333;
  overflow: hidden;
  background-image: v-bind('`url(${getAssetPath("/img/background/ancient-herbs.jpg")})`');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

/* 添加背景蒙版，确保整体风格保持温柔内敛 */
.seasons-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(245, 240, 235, 0.7); /* 柔和的米色半透明蒙版 */
  backdrop-filter: blur(3px); /* 轻微模糊效果 */
  z-index: 0;
}

/* 让内容在蒙版上方显示 */
.header, .content-container {
  position: relative;
  z-index: 1;
}

/* 添加古籍纹理和科技感线条 */
.ancient-paper-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: v-bind('`url(${getAssetPath("/img/textures/paper-texture.png")})`');
  opacity: 0.08;
  z-index: 0;
  pointer-events: none;
}

.tech-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: v-bind('`url(${getAssetPath("/img/textures/grid-lines.png")})`');
  opacity: 0.05;
  z-index: 0;
  pointer-events: none;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 1rem; /* 缩小上下左右内边距 */
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  height: 40px; /* 降低高度，使其变窄 */
  font-size: 12px; /* 缩小字体 */
}


.title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.current-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.current-season {
  padding: 0.3rem 0.8rem;
  background: rgba(126, 87, 194, 0.1);
  border-radius: 4px;
  color: #7e57c2;
  font-weight: 500;
}

.current-time {
  color: #666;
}

.content-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.left-section {
  width: 40%;
  padding: 1rem;
  overflow-y: auto;
}

.right-section {
  width: 60%;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .content-container {
    flex-direction: column;
  }
  
  .left-section, .right-section {
    width: 100%;
  }
}

/* 完善玻璃态效果 */
.left-section > div, .right-section > div {
  background: rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(90, 80, 70, 0.1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 15px;
  margin-bottom: 15px;
}
</style>
