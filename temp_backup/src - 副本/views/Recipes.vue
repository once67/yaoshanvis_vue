<template>
  <div class="recipes-container">
    <!-- 古籍背景与科技感交互线条 -->
    <div class="ancient-paper-bg"></div>
    <div class="tech-lines"></div>
    
    <!-- 数据大屏主内容区域 - 优化布局 -->
    <div class="recipes-dashboard">
      <!-- 左侧：药膳分类(环形分布图) -->
      <div class="dashboard-left glassmorphism">
        <div class="section-header">
          <h2>药膳分类</h2>
        </div>
        
        <!-- 分类饼图 -->
        <div class="function-category">
          <CategoryPieChart @category-selected="handleCategorySelected" />
        </div>
        
        <!-- 药膳列表 -->
        <div class="recipe-list-wrapper">
          <RecipeList
            :constitution="selectedConstitution"
            :category="selectedCategory"
            @recipe-selected="handleRecipeSelected"
          />
        </div>
      </div>
      
      <!-- 中部：药膳组成展示(力导向图) -->
      <div class="dashboard-center glassmorphism">
        <div class="section-header">
          <h2>药膳组成分析</h2>
          <div class="recipe-info" v-if="selectedRecipe">
            <span class="recipe-title">{{ selectedRecipe.name }}</span>
          </div>
        </div>
        
        <!-- 组成分析图 -->
        <div class="recipe-content">
          <RecipeForceGraph 
            v-if="selectedRecipe"
            :recipe="selectedRecipe"
          />
          <div v-else class="empty-state">
            <div class="empty-icon">
              <span class="material-icons">bubble_chart</span>
            </div>
            <p>请选择一个药膳方查看组成分析</p>
          </div>
        </div>
        
        <!-- 药膳详情 -->
        <div class="recipe-detail-wrapper" v-if="selectedRecipe">
          <RecipeDetail :recipe="selectedRecipe" />
        </div>
      </div>
      
      <!-- 右侧：配伍逻辑分析(桑基图) -->
      <div class="dashboard-right glassmorphism">
        <div class="section-header">
          <h2>配伍逻辑分析</h2>
        </div>
        
        <!-- 配伍分析图 -->
        <PairingVisualization :recipe="selectedRecipe" />
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import CategoryPieChart from '../components/recipes/CategoryPieChart.vue'
import PairingVisualization from '../components/recipes/PairingVisualization.vue'
import RecipeDetail from '../components/recipes/RecipeDetail.vue'
import RecipeForceGraph from '../components/recipes/RecipeForceGraph.vue'
import RecipeList from '../components/recipes/RecipeList.vue'
import { useRecipeStore } from '../store'
import { getAssetPath } from '../utils/paths'

export default {
  name: 'Recipes',
  
  components: {
    RecipeList,
    RecipeDetail,
    PairingVisualization,
    CategoryPieChart,
    RecipeForceGraph
  },
  
  setup() {
    const store = useRecipeStore()
    const loading = ref(false)
    const selectedCategory = ref(null)
    
    // 确保初始化数据
    onMounted(async () => {
      loading.value = true
      try {
        console.log('开始加载药膳数据')
        await store.fetchRecipes()
        await store.fetchCategories() // 加载分类数据
        console.log('药膳数据加载完成:', store.recipes)
      } catch (error) {
        console.error('加载药膳数据错误:', error)
      } finally {
        loading.value = false
      }
    })
    
    const selectedConstitution = computed(() => store.selectedConstitution)
    const selectedRecipe = computed(() => store.selectedRecipe)
    
    function handleCategorySelected(category) {
      console.log('选择分类:', category)
      selectedCategory.value = category
      // 清空体质选择
      store.setSelectedConstitution(null)
    }
    
    function handleRecipeSelected(recipe) {
      console.log('选择药膳:', recipe)
      store.selectRecipe(recipe)
    }
    
    return {
      selectedConstitution,
      selectedRecipe,
      selectedCategory,
      loading,
      handleCategorySelected,
      handleRecipeSelected,
      getAssetPath
    }
  }
}
</script>

<style scoped>
.recipes-container {
  position: relative;
  width: 100%;
  height: 100vh;
  padding: 20px;
  overflow: hidden;
  color: #32292F;
  display: flex;
  flex-direction: column;
  background-image: v-bind('`url(${getAssetPath("/img/background/ancient-herbs.jpg")})`');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

/* 添加背景蒙版，确保整体风格保持温柔内敛 */
.recipes-container::before {
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
.recipes-dashboard {
  position: relative;
  z-index: 1;
}

/* 优化后的数据大屏布局 */
.recipes-dashboard {
  display: grid;
  grid-template-columns: 350px 1fr 450px;
  grid-template-rows: 1fr;
  gap: 20px;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.dashboard-left {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  max-height: 100%;
  overflow: hidden;
  border-radius: 12px;
}

.dashboard-center {
  display: flex;
  flex-direction: column;
  padding: 15px;
  max-height: 100%;
  overflow: hidden;
}

.dashboard-right {
  display: flex;
  flex-direction: column;
  padding: 15px;
  max-height: 100%;
  overflow: hidden;
}

/* 内部布局 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(93, 64, 55, 0.1);
  margin-bottom: 15px;
}

.section-header h2[data-v-bc451626] {
    font-size: 20px;
    color: #FFFFFF; /* 文字颜色改为白色，增强对比度 */
    font-family: '楷体', serif;
    background-color: #8d6e63; /* 棕色背景 */
    padding: 5px 10px; /* 增加内边距，避免文字紧贴边缘 */
    border-radius: 5px; /* 可选，添加圆角 */
    display: inline-block; /* 让背景只包裹文字，而不会占满整行 */
}


.recipe-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.recipe-title {
  font-size: 16px;
  color: #5d4037;
  font-weight: bold;
}

.recipe-source {
  font-size: 14px;
  color: #8d6e63;
  font-style: italic;
}

/* 左侧布局 */
.function-category {
  min-height: 180px;
  flex-shrink: 0;
}

.recipe-list-wrapper {
  flex: 1;
  overflow: auto;
  margin-top: 5px;
  border-top: 1px solid rgba(93, 64, 55, 0.1);
  padding-top: 5px;
  background-color: #8d6e63 !important;
  border-radius: 8px;
}

/* 中部布局 */
.recipe-content {
  flex: 0.1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 400px;

}

.recipe-detail-wrapper {
  flex: 0.9;
  overflow: auto;
  margin-top: 15px;
  border-top: 1px solid rgba(93, 64, 55, 0.1);
  padding-top: 10px;

}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8d6e63;
  gap: 15px;
}

.empty-icon {
  font-size: 48px;
  color: #d7ccc8;
}

.empty-state p {
  font-size: 16px;
  opacity: 0.8;
  font-family: '宋体', serif;
}

/* Material Icons */
.material-icons {
  font-family: 'Material Icons';
  font-weight: normal;
  font-style: normal;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
}

/* 响应式调整 */
@media (max-width: 1440px) {
  .recipes-dashboard {
    grid-template-columns: 320px 1fr 400px;
  }
  
  .section-header h2 {
    font-size: 18px;
  }
}

@media (max-width: 1280px) {
  .recipes-dashboard {
    grid-template-columns: 250px 1fr 350px;
  }
}

@media (max-width: 1024px) {
  .recipes-dashboard {
    grid-template-columns: 220px 1fr 280px;
  }
}

@media (max-width: 768px) {
  .recipes-dashboard {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    height: auto;
    gap: 15px;
  }
  
  .dashboard-left,
  .dashboard-center,
  .dashboard-right {
    max-height: none;
  }
  
  .recipe-list-wrapper {
    max-height: 300px;
  }
}

/* 修改古籍背景与科技感交互线条样式 */
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

/* 完善玻璃态效果 */
.glassmorphism {
  background: rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(90, 80, 70, 0.1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
</style> 