<template>
  <div class="recommendation-container">
    <div class="recommendation-header">
      <h2>个性化养生推荐</h2>
    </div>
    
    <div class="constitution-input">
      <h3>体质选择</h3>
      <div class="constitution-options">
        <div 
          v-for="type in constitutionTypes" 
          :key="type.value"
          :class="['constitution-option', { active: constitution.type === type.value }]"
          @click="selectConstitution(type.value)">
          <span class="option-name">{{ type.label }}</span>
          <span class="option-desc">{{ type.description }}</span>
        </div>
      </div>
      
      <div class="health-needs">
        <h3>养生需求 <small>(可多选)</small></h3>
        <div class="needs-options">
          <div 
            v-for="need in healthNeeds" 
            :key="need.value"
            :class="['need-tag', { active: constitution.features.includes(need.value) }]"
            @click="toggleHealthNeed(need.value)">
            {{ need.label }}
          </div>
        </div>
      </div>
    </div>
    
    <div class="result-section">
      <div class="recommendation-result">
        <div class="result-header">
          <h3>推荐药膳</h3>
          <button 
            class="generate-btn" 
            @click="generateRecommendation"
            :disabled="isLoading">
            {{ isLoading ? '生成中...' : '重新生成' }}
          </button>
        </div>
        
        <div v-if="isLoading" class="loading-state">
          <div class="loader"></div>
          <p>正在分析体质与节气，生成个性化推荐...</p>
        </div>
        
        <div v-else-if="recommendation" class="recommendation-card">
          <div class="recipe-header">
            <h4>{{ recommendation.name }}</h4>
            <div class="recipe-tags">
              <span class="recipe-tag" v-for="tag in recommendation.tags" :key="tag">{{ tag }}</span>
            </div>
          </div>
          
          <div class="recipe-content">
            <div class="recipe-image" :style="{ backgroundImage: `url(${recommendation.image})` }"></div>
            <div class="recipe-info">
              <div class="ingredients">
                <h5>主要食材</h5>
                <ul>
                  <li v-for="item in recommendation.ingredients" :key="item">{{ item }}</li>
                </ul>
              </div>
              
              <div class="benefits">
                <h5>功效</h5>
                <p>{{ recommendation.benefits }}</p>
              </div>
            </div>
          </div>
          
          <div class="recipe-method">
            <h5>制作方法</h5>
            <ol>
              <li v-for="(step, index) in recommendation.steps" :key="index">{{ step }}</li>
            </ol>
          </div>
        </div>
        
        <div v-else class="empty-state">
          <p>请选择您的体质和养生需求，点击"生成推荐"按钮获取个性化药膳建议</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import yaoshanData from '../../../public/data/yaoshan_data.json';

// 接收props
const props = defineProps({
  selectedSeason: {
    type: String,
    required: true
  },
  userConstitution: {
    type: Object,
    default: () => ({
      type: '平和质',
      features: []
    })
  }
});

// 发出事件
const emit = defineEmits(['update-constitution']);

// 体质数据
const constitutionTypes = [
  { value: '平和质', label: '平和质', description: '阴阳气血调和' },
  { value: '气虚质', label: '气虚质', description: '气虚无力，易疲乏' },
  { value: '阳虚质', label: '阳虚质', description: '畏寒肢冷，精神不振' },
  { value: '阴虚质', label: '阴虚质', description: '口燥咽干，手足心热' },
  { value: '痰湿质', label: '痰湿质', description: '痰多体胖，胸闷脘痞' },
  { value: '湿热质', label: '湿热质', description: '面垢油光，口苦口臭' },
  { value: '血瘀质', label: '血瘀质', description: '肌肤晦暗，唇色紫暗' },
  { value: '气郁质', label: '气郁质', description: '情志抑郁，胸闷不舒' },
  { value: '特禀质', label: '特禀质', description: '过敏体质，易过敏' }
];

// 养生需求
const healthNeeds = [
  { value: 'digestive', label: '调理脾胃' },
  { value: 'sleep', label: '改善睡眠' },
  { value: 'immune', label: '增强免疫' },
  { value: 'energy', label: '提升精力' },
  { value: 'detox', label: '排毒养颜' },
  { value: 'calm', label: '平静心神' },
  { value: 'joints', label: '关节滋养' },
  { value: 'blood', label: '调节血压' },
  { value: 'respiratory', label: '呼吸道健康' }
];

// 用户选择的体质状态
const constitution = ref({
  type: props.userConstitution.type,
  features: [...props.userConstitution.features]
});

// 推荐结果
const recommendation = ref(null);
const isLoading = ref(false);

// 体质关键词映射
const constitutionKeywords = {
  '平和质': ['调理', '健脾', '益气', '养阴', '温阳'],
  '气虚质': ['补气', '益气', '健脾', '补脾', '提神'],
  '阳虚质': ['温阳', '助阳', '壮阳', '补阳', '暖肾', '肾阳'],
  '阴虚质': ['滋阴', '养阴', '清热', '润燥', '生津'],
  '痰湿质': ['化痰', '祛湿', '利水', '消水', '健脾', '温阳'],
  '湿热质': ['清热', '祛湿', '解毒', '利水', '通淋'],
  '血瘀质': ['活血', '化瘀', '行气', '止痛', '通络'],
  '气郁质': ['解郁', '理气', '疏肝', '舒肝', '调畅'],
  '特禀质': ['扶正', '固表', '温肺', '补肾']
};

// 养生需求关键词映射
const healthNeedKeywords = {
  'digestive': ['健脾', '养胃', '消食', '脾胃', '开胃', '调理脾胃', '消化'],
  'sleep': ['安神', '静心', '宁神', '养心', '安眠', '改善睡眠'],
  'immune': ['扶正', '益卫', '益气', '补气', '增强免疫'],
  'energy': ['益气', '补气', '养血', '提神', '振奋', '精力'],
  'shen': ['补肾', '温肾', '壮阳', '固精', '肾阳', '肾虚'],
  'detox': ['解毒', '排毒', '清热', '消肿', '养颜', '美容'],
  'calm': ['静心', '安神', '宁神', '定志', '镇静', '平静'],
  'joints': ['壮骨', '强筋', '舒筋', '活络', '关节', '祛风除湿'],
  'blood': ['调节血压', '平肝', '养心', '平肝潜阳', '活血化瘀'],
  'respiratory': ['润肺', '止咳', '化痰', '平喘', '呼吸道', '支气管']
};

// 选择体质类型
const selectConstitution = (type) => {
  constitution.value.type = type;
  emit('update-constitution', constitution.value);
};

// 切换养生需求
const toggleHealthNeed = (need) => {
  const index = constitution.value.features.indexOf(need);
  if (index > -1) {
    constitution.value.features.splice(index, 1);
  } else {
    constitution.value.features.push(need);
  }
  emit('update-constitution', {...constitution.value});
};

// 生成推荐
const generateRecommendation = async () => {
  isLoading.value = true;
  
  try {
    // 使用真实的yaoshanData数据而不是mock数据
    const recipes = yaoshanData || [];
    const currentSeason = props.selectedSeason;
    const constitutionType = constitution.value.type;
    
    // 过滤出可能适合的药膳
    let suitableRecipes = [];
    
    // 1. 首先尝试找到既匹配体质又匹配季节的药膳
    for (const recipe of recipes) {
      // 检查药膳的功效是否与体质相匹配
      const benefits = recipe.功效 || '';
      const isConstitutionMatch = constitutionKeywords[constitutionType]?.some(keyword => benefits.includes(keyword)) || false;
      
      // 季节匹配逻辑 - 简化版
      const isSeasonMatch = true; // 先默认匹配，后续可加入更精细的季节匹配逻辑
      
      // 需求匹配逻辑
      const needsMatch = constitution.value.features.some(need => {
        const needKeywords = healthNeedKeywords[need] || [];
        return needKeywords.some(keyword => benefits.includes(keyword));
      });
      
      if (isConstitutionMatch && isSeasonMatch) {
        suitableRecipes.push({
          name: recipe.药膳名,
          tags: recipe.药材?.split('，') || [],
          image: 'https://via.placeholder.com/150', // 占位图
          ingredients: recipe.食材?.split('，') || [],
          benefits: recipe.功效 || '',
          steps: ['具体做法请参考专业中医食疗指导'], // 简化步骤
          matchScore: needsMatch ? 100 : 80 // 如果需求也匹配，分数更高
        });
      }
    }
    
    // 2. 如果没有同时匹配体质和季节的，则寻找只匹配体质的
    if (suitableRecipes.length === 0) {
      for (const recipe of recipes) {
        const benefits = recipe.功效 || '';
        const isConstitutionMatch = constitutionKeywords[constitutionType]?.some(keyword => benefits.includes(keyword)) || false;
        
        if (isConstitutionMatch) {
          suitableRecipes.push({
            name: recipe.药膳名,
            tags: recipe.药材?.split('，') || [],
            image: 'https://via.placeholder.com/150',
            ingredients: recipe.食材?.split('，') || [],
            benefits: recipe.功效 || '',
            steps: ['具体做法请参考专业中医食疗指导'],
            matchScore: 70
          });
        }
      }
    }
    
    // 3. 如果仍然没有匹配的，则随机选择几个药膳
    if (suitableRecipes.length === 0) {
      const randomRecipes = [];
      const totalRecipes = recipes.length;
      
      // 随机选5个或更少（如果数据不足）
      const numToSelect = Math.min(5, totalRecipes);
      
      for (let i = 0; i < numToSelect; i++) {
        const randomIndex = Math.floor(Math.random() * totalRecipes);
        const recipe = recipes[randomIndex];
        
        randomRecipes.push({
          name: recipe.药膳名,
          tags: recipe.药材?.split('，') || [],
          image: 'https://via.placeholder.com/150',
          ingredients: recipe.食材?.split('，') || [],
          benefits: recipe.功效 || '',
          steps: ['具体做法请参考专业中医食疗指导'],
          matchScore: 50
        });
      }
      
      suitableRecipes = randomRecipes;
    }
    
    // 如果有符合条件的推荐，随机选择一个
    if (suitableRecipes.length > 0) {
      // 按matchScore排序并取前三名
      suitableRecipes.sort((a, b) => b.matchScore - a.matchScore);
      const topRecipes = suitableRecipes.slice(0, Math.min(3, suitableRecipes.length));
      
      // 从前三名中随机选择一个，以增加变化性
      const randomIndex = Math.floor(Math.random() * topRecipes.length);
      recommendation.value = topRecipes[randomIndex];
    } else {
      // 极端情况：没有任何药膳数据
      recommendation.value = {
        name: '暂无匹配的药膳推荐',
        tags: ['请尝试其他体质选项'],
        image: 'https://via.placeholder.com/150',
        ingredients: ['暂无'],
        benefits: '暂无匹配的推荐，请调整体质或养生需求后重试。',
        steps: ['暂无'],
        matchScore: 0
      };
    }
  } catch (error) {
    console.error('生成推荐时出错:', error);
    recommendation.value = {
      name: '推荐生成失败',
      tags: ['请稍后重试'],
      image: 'https://via.placeholder.com/150',
      ingredients: ['暂无'],
      benefits: '推荐生成过程中出现错误，请稍后重试。',
      steps: ['暂无'],
      matchScore: 0
    };
  } finally {
    isLoading.value = false;
  }
};

// 监听季节变化，自动更新推荐
watch(() => props.selectedSeason, (newSeason) => {
  if (recommendation.value) {
    generateRecommendation();
  }
});
</script>

<style scoped>
.recommendation-container {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(8px);
  padding: 1.5rem;
  margin-bottom: 1rem;
  height: 48%; /* 原代码保持不变 */
  
  overflow-y: auto; /* ✅ 允许垂直滚动 */
  overflow-x: hidden; /* ✅ 防止出现水平滚动 */
}


.recommendation-header {
    background: #8d6e63; /* 棕色背景 */
    padding: 1px 10px; /* 保持较窄的背景 */
    border-radius: 6px; /* 圆角 */
    margin-top: -5px; /* 上移 5px，可调整 */
}


/* 确保 h2 充满整行，并调整字体颜色 */
.recommendation-header h2[data-v-a34f9fe0] {
    margin: 0;
    font-size: 1.2rem;
    color: white; /* 让文字在棕色背景上更清晰 */
    display: block; /* 让 h2 充满整行 */
}


.constitution-input {
  margin-bottom: 1.5rem;
  margin-top: 1.5rem;
  display: flex;
  gap: 1.5rem;
}

.constitution-input h3 {
  font-size: 1rem;
  margin: 0 0 0.8rem 0;
  color: #2c3e50;
}

.constitution-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;
  margin-bottom: 0;
  flex: 1;
}

.constitution-option {
  display: flex;
  flex-direction: column;
  padding: 0.3rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
}

.constitution-option:hover {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.constitution-option.active {
  background: rgba(126, 87, 194, 0.1);
  border: 1px solid rgba(126, 87, 194, 0.3);
}

.option-name {
  font-weight: 600;
  color: #4f6e8d;
  margin-bottom: 0.1rem;
  font-size: 0.9rem;
}

.option-desc {
  font-size: 0.8rem;
  color: #666;
  line-height: 1.2;
}

.health-needs {
  flex: 1;
  min-width: 200px;
}

.health-needs h3 {
  font-size: 1rem;
  margin: 0 0 0.8rem 0;
  color: #2c3e50;
}

.health-needs small {
  font-size: 0.75rem;
  font-weight: normal;
  color: #666;
}

.needs-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.need-tag {
  padding: 0.3rem 0.6rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.05);
  font-size: 0.8rem;
  color: #555;
  cursor: pointer;
  transition: all 0.2s ease;
}

.need-tag:hover {
  background: rgba(255, 255, 255, 0.9);
}

.need-tag.active {
  background: rgba(126, 87, 194, 0.1);
  border: 1px solid rgba(126, 87, 194, 0.3);
  color: #7e57c2;
}

.result-section {
  flex: 1;
  overflow: hidden;
}

.recommendation-result {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 1rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.result-header h3 {
  font-size: 1rem;
  margin: 0;
  color: #2c3e50;
}

.generate-btn {
  padding: 0.5rem 1rem;
  background: #7e57c2;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.generate-btn:hover {
  background: #6a3db5;
}

.generate-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.loader {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(126, 87, 194, 0.2);
  border-radius: 50%;
  border-top-color: #7e57c2;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: #666;
  text-align: center;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  color: #666;
  text-align: center;
}

.recommendation-card {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.recipe-header {
  margin-bottom: 1rem;
}

.recipe-header h4 {
  font-size: 1.1rem;
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.recipe-tags {
  display: flex;
  gap: 0.5rem;
}

.recipe-tag {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  background: rgba(126, 87, 194, 0.1);
  border-radius: 12px;
  color: #7e57c2;
}

.recipe-content {
  display: flex;
  margin-bottom: 0.8rem;
  gap: 0.8rem;
}

.recipe-image {
  width: 100px;
  height: 100px;
  background-size: cover;
  background-position: center;
  border-radius: 6px;
  flex-shrink: 0;
}

.recipe-info {
  flex: 1;
}

.ingredients, .benefits {
  margin-bottom: 0.8rem;
}

.ingredients h5, .benefits h5, .recipe-method h5 {
  font-size: 0.9rem;
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.ingredients ul {
  margin: 0;
  padding-left: 1.2rem;
}

.ingredients li {
  font-size: 0.85rem;
  color: #555;
  margin-bottom: 0.2rem;
}

.benefits p {
  font-size: 0.85rem;
  color: #555;
  margin: 0;
  line-height: 1.5;
}

.recipe-method {
  flex: 1;
  overflow: hidden;
}

.recipe-method ol {
  margin: 0;
  padding-left: 1.2rem;
  height: 100%;
  overflow: hidden;
}

.recipe-method li {
  font-size: 0.85rem;
  color: #555;
  margin-bottom: 0.4rem;
  line-height: 1.5;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .constitution-input {
    flex-direction: column;
    gap: 1rem;
  }
  
  .constitution-options {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .constitution-option {
    padding: 0.4rem;
  }
  
  .health-needs {
    min-width: 100%;
  }
  
  .recipe-content {
    flex-direction: column;
  }
  
  .recipe-image {
    width: 100%;
    height: 150px;
  }
  
  .option-name {
    font-size: 0.85rem;
  }
  
  .option-desc {
    font-size: 0.7rem;
  }
}
</style> 