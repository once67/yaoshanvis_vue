<template>
  <div class="season-calendar-container">
    <div class="calendar-header">
      <h2>十二地支月药材推荐</h2>
      <div class="year-selector">
        <button @click="changeYear(-1)" class="year-btn">
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="current-year">{{ currentYear }}年</span>
        <button @click="changeYear(1)" class="year-btn">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
    
    <div class="seasons-wheel">
      <div 
        v-for="(month, index) in months" 
        :key="month.阴历月份"
        :class="['season-item', { active: selectedMonth === month.阴历月份 }]"
        :style="getMonthStyle(index)"
        @click="selectMonth(month.阴历月份)">
        <div class="season-content">
          <span class="season-name">{{ month.阴历月份 }}</span>
        </div>
      </div>
    </div>
    
    <div class="season-details" v-if="selectedMonthInfo">
      <h3>{{ selectedMonthInfo.阴历月份 }}</h3>
      <div class="season-info">
        <div class="season-description">
          <p>{{ selectedMonthInfo.人体气机变化 }}</p>
        </div>
        <div class="season-characteristics">
          <div class="char-item">
            <span class="char-label">适用药材：</span>
            <span class="char-value">{{ selectedMonthInfo.适用药材 }}</span>
          </div>
          <div class="char-item">
            <span class="char-label">饮食调养建议：</span>
            <span class="char-value">{{ selectedMonthInfo.饮食调养建议 }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import monthsData from '../../../public/data/months_data.json';

// 发出事件
const emit = defineEmits(['select-month']);

// 当前年份
const currentYear = ref(new Date().getFullYear());

// 当前选中的月份
const selectedMonth = ref('正月');

// 月份数据
const months = ref(monthsData);

// 计算当前选中月份的详细信息
const selectedMonthInfo = computed(() => {
  return months.value.find(month => month.阴历月份 === selectedMonth.value);
});

// 选择月份
const selectMonth = (monthName) => {
  selectedMonth.value = monthName;
  emit('select-month', monthName);
};

// 切换年份
const changeYear = (delta) => {
  currentYear.value += delta;
};

// 计算月份在圆环上的位置
const getMonthStyle = (index) => {
  const totalMonths = months.value.length;
  const angle = (index * (360 / totalMonths)) - 90; // 从顶部开始，逆时针排列
  const radius = 130; // 缩小圆环半径，原来是160
  
  const x = radius * Math.cos(angle * Math.PI / 180);
  const y = radius * Math.sin(angle * Math.PI / 180);
  
  return {
    transform: `translate(calc(50% + ${x}px), calc(50% + ${y}px)) rotate(${angle + 90}deg)`,
    '--season-hue': (index * (360 / totalMonths)) // 给每个月份设置不同的色调
  };
};

// 组件挂载时
onMounted(async () => {
  // 设置当前月份
  const currentMonth = new Date().getMonth();
  const monthNames = months.value.map(month => month.阴历月份);
  selectMonth(monthNames[currentMonth]);
});

// 监听选中月份变化
watch(selectedMonth, (newMonth) => {
  console.log('选中月份:', newMonth);
});
</script>

<style scoped>
.season-calendar-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(8px);
  position: relative;

    /* 添加背景图片 */
  background-image: url('/backgrounds/十二月.png') !important;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.calendar-header h2[data-v-fe79f361] {
    font-size: 1.2rem;
    color: #2c3e50;
    margin: 0;
    background:rgba(255, 255, 255, 0.75); /* 添加白色背景 */
    border: 2px solid #2c3e50; /* 添加边框，颜色与文字相同 */
    padding: 8px 12px; /* 增加内边距，让文本不会贴边 */
    border-radius: 6px; /* 让边角更圆滑 */
    display: inline-block; /* 让背景和边框包裹文字 */
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 添加一点阴影，增强立体感 */
}


.year-selector {
  display: flex;
  align-items: center;
}

.year-btn {
  background: transparent;
  border: none;
  font-size: 0.9rem;
  color: #7e57c2;
  cursor: pointer;
  padding: 0.3rem 0.5rem;
}

.current-year {
  margin: 0 0.5rem;
  font-weight: 500;
}

.seasons-wheel {
  position: relative;
  width: 120px; /* 增加宽度 */
  height: 120px; /* 增加高度 */
  margin: 8rem auto; /* 修改外边距 */
}

.season-item {
  position: absolute;
  width: 50px; /* 缩小尺寸 */
  height: 50px; /* 缩小尺寸 */
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 2;
  transform-origin: center;
}

.season-item:hover {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.season-item.active {
  background:rgb(255, 255, 255); /* 选中后背景变深 */
  color: white;
  border: 2px solid #5d4037;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(126, 87, 194, 0.5);
  transform: scale(2); /* 选中时放大 2 倍 */
}

.season-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: rotate(-90deg);
}

.season-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: hsl(var(--season-hue), 70%, 40%);
}

.season-details {
  margin-top: 0.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  border-left: 3px solid #7e57c2;
  transition: all 0.3s ease;
  max-height: 30%;
  overflow-y: auto;
}

.season-details h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.season-info {
  display: flex;
  flex-direction: column;
}

.season-description {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
}

.season-characteristics {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.char-item {
  display: flex;
  align-items: flex-start;
}

.char-label {
  font-weight: 500;
  color: #7e57c2;
  width: 120px;
  flex-shrink: 0;
}

.char-value {
  color: #555;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .seasons-wheel {
    width: 280px;
    height: 280px;
  }
  
  .season-item {
    width: 45px;
    height: 45px;
  }
  
  .season-name {
    font-size: 0.8rem;
  }
  
  .season-details {
    max-height: 40%;
  }
}
</style>