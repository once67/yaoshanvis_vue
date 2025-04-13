<template>
  <div class="recipe-detail">

    
    <div class="recipe-info-block">
      <div class="info-header">
        <span class="material-icons">local_pharmacy</span>
        <span>组成</span>
      </div>
      
      <div class="ingredients-list">
        <div v-for="(item, index) in recipe.ingredients" :key="`herb-${index}`" class="ingredient-item">
          <span class="ingredient-name">{{ item.name }}</span>
          <span class="ingredient-amount">{{ item.amount }}</span>
        </div>
        
        <template v-if="recipe.foodIngredients && recipe.foodIngredients.length > 0">
          <div class="ingredient-divider"></div>
          
          <div v-for="(item, index) in recipe.foodIngredients" :key="`food-${index}`" class="ingredient-item food">
            <span class="ingredient-name">{{ item.name }}</span>
            <span class="ingredient-amount">{{ item.amount }}</span>
          </div>
        </template>
      </div>
    </div>
    
    <div class="recipe-info-block">
      <div class="info-header">
        <span class="material-icons">menu_book</span>
        <span>制作流程</span>
      </div>
      
      <div class="process-timeline">
        <div v-for="(step, index) in processSteps" 
             :key="index" 
             class="process-step">
          <div class="step-connector" v-if="index > 0"></div>
          <div class="step-number">{{ index + 1 }}</div>
          <div class="step-content">
            <div class="step-icon">
              <span class="material-icons">{{ step.icon }}</span>
            </div>
            <div class="step-details">
              <div class="step-title">{{ step.title }}</div>
              <div class="step-description">{{ step.description }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="usage-info">
        <div class="usage-header">
          <span class="material-icons">schedule</span>
          <span>服用方法</span>
        </div>
        <div class="usage-content">{{ recipe.usage || '暂无服用说明' }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RecipeDetail',
  
  props: {
    recipe: {
      type: Object,
      required: true
    }
  },
  
  data() {
    return {}
  },
  
  computed: {
    processSteps() {
      // 将制法文字拆分成步骤
      const preparation = this.recipe.preparation || ''
      const steps = preparation.split(/[。；;]/).filter(step => step.trim())
      
      return steps.map(step => {
        const stepInfo = this.analyzeStep(step)
        return {
          title: stepInfo.title,
          description: step,
          icon: stepInfo.icon
        }
      })
    }
  },
  
  methods: {
    analyzeStep(step) {
      // 根据关键词分析步骤类型并返回对应的标题和图标
      const keywords = {
        '准备': { title: '准备食材', icon: 'kitchen' },
        '洗': { title: '清洗处理', icon: 'water_drop' },
        '切': { title: '切制', icon: 'content_cut' },
        '煮': { title: '煮制', icon: 'soup_kitchen' },
        '炒': { title: '翻炒', icon: 'outdoor_grill' },
        '煎': { title: '煎制', icon: 'local_fire_department' },
        '泡': { title: '浸泡', icon: 'opacity' },
        '焖': { title: '焖煮', icon: 'whatshot' },
        '加入': { title: '加料', icon: 'add_circle' },
        '调味': { title: '调味', icon: 'restaurant' }
      }
      
      // 默认值
      let result = { title: '处理', icon: 'double_arrow' }
      
      // 查找匹配的关键词
      for (const [keyword, info] of Object.entries(keywords)) {
        if (step.includes(keyword)) {
          result = info
          break
        }
      }
      
      return result
    }
  }
}
</script>

<style scoped>
.recipe-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  overflow-y: auto;
  padding-right: 5px;
}

/* 自定义滚动条 */
.recipe-detail::-webkit-scrollbar {
  width: 4px;
}

.recipe-detail::-webkit-scrollbar-track {
  background: rgba(93, 64, 55, 0.05);
  border-radius: 10px;
}

.recipe-detail::-webkit-scrollbar-thumb {
  background: rgba(93, 64, 55, 0.2);
  border-radius: 10px;
}

.recipe-detail::-webkit-scrollbar-thumb:hover {
  background: rgba(93, 64, 55, 0.3);
}

.recipe-info-block[data-v-7973ab80] {
    background-color: rgba(255, 255, 255, 0.5);
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

    /* 设置边框 */
    border: 1px solid rgba(0, 0, 0, 0.2); /* 细边框 */
    border-top: 4px solid rgba(93, 64, 55, 0.8); /* 上边框加粗 */
}


.info-row {
  margin-bottom: 5px;
  line-height: 1.5;
}

.property {
  font-weight: 600;
  color: #5d4037;
  font-family: '宋体', serif;
}

.value {
  color: #5d4037;
  line-height: 1.6;
  font-family: '宋体', serif;
  text-align: justify;
}

.info-header[data-v-7973ab80] {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    border-bottom: 1px solid rgba(93, 64, 55, 0.1);
    padding: 8px 12px; /* 增加上下左右内边距 */
    font-family: '楷体', serif;
    font-size: 16px;
    color: white; /* 让文字与背景形成对比 */
    
    /* 设置棕色背景 */
    background-color:rgb(147, 123, 115); /* 深棕色 */
    border-radius: 6px 6px 0 0; /* 让标题区域的顶部有圆角 */
}


.info-header .material-icons {
  font-size: 18px;
  margin-right: 8px;
  color: #8d6e63;
}

.ingredients-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
}

.ingredient-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
  background-color: rgba(171, 145, 68, 0.08);
  border-radius: 6px;
  font-size: 14px;
}

.ingredient-item.food {
  background-color: rgba(120, 204, 190, 0.08);
}

.ingredient-name {
  font-weight: 500;
  color: #5d4037;
  font-family: '宋体', serif;
}

.ingredient-amount {
  color: #8d6e63;
  font-family: '宋体', serif;
  font-size: 13px;
}

.ingredient-divider {
  grid-column: 1 / -1;
  height: 1px;
  background-color: rgba(93, 64, 55, 0.1);
  margin: 5px 0;
}

.process-timeline {
  position: relative;
  padding: 20px 0;
}

.process-step {
  position: relative;
  display: flex;
  align-items: flex-start;
  padding: 16px 0;
}

.step-connector {
  position: absolute;
  top: 0;
  left: 20px;
  width: 2px;
  height: 100%;
  background: linear-gradient(to bottom, 
    rgba(93, 64, 55, 0.15) 0%,
    rgba(93, 64, 55, 0.15) 100%);
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #BFD7E3, #A1C0CF);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  margin-right: 16px;
  z-index: 1;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.12);
}

.step-content {
  flex: 1;
  display: flex;
  align-items: flex-start;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  padding: 14px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.step-icon {
  margin-right: 14px;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(93, 64, 55, 0.08);
}

.step-icon .material-icons {
  font-size: 20px;
  color: #7d5d52;
}

.step-details {
  flex: 1;
}

.step-title {
  font-weight: 600;
  color: #5d4037;
  margin-bottom: 4px;
  font-size: 15px;
  font-family: '楷体', serif;
}

.step-description {
  color: #8d6e63;
  font-size: 14px;
  line-height: 1.5;
  font-family: '宋体', serif;
}

.usage-info {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(93, 64, 55, 0.1);
}

.usage-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #5d4037;
  font-family: '楷体', serif;
  font-size: 15px;
}

.usage-header .material-icons {
  font-size: 18px;
  color: #8d6e63;
}

.usage-content {
  color: #8d6e63;
  font-size: 14px;
  line-height: 1.6;
  font-family: '宋体', serif;
}
</style> 