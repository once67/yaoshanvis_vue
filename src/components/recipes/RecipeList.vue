<template>
  <div class="recipe-list">
    <div class="list-header">
      <div class="title">药膳列表</div>
      <div class="search-bar">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="搜索药膳..." 
          @input="handleSearch"
        />
      </div>
    </div>
    
    <div class="filter-info" v-if="activeCategory || constitution">
      <span class="filter-tag" v-if="activeCategory">
        分类: <span class="tag-content">{{ activeCategory }}</span>
        <span class="clear-btn" @click="clearCategory">×</span>
      </span>
      <span class="filter-tag" v-if="constitution">
        体质: <span class="tag-content">{{ constitution }}</span>
        <span class="clear-btn" @click="clearConstitution">×</span>
      </span>
    </div>
    
    <div class="list-content" ref="listContent">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>
      
      <template v-else-if="filteredRecipes.length > 0">
        <div 
          v-for="recipe in filteredRecipes" 
          :key="recipe.id"
          class="recipe-item"
          :class="{ active: selectedRecipeId === recipe.id }"
          @click="selectRecipe(recipe)"
        >
          <div class="recipe-name">{{ recipe.name }}</div>
          <div class="recipe-tags">
            <span 
              v-for="(tag, tagIndex) in getEffectTags(recipe)"
              :key="tagIndex" 
              class="effect-tag"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </template>
      
      <div v-else class="empty-list">
        <span class="material-icons">search_off</span>
        <p>没有找到匹配的药膳</p>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, watch } from 'vue'
import { useRecipeStore } from '../../store'

export default {
  name: 'RecipeList',
  
  props: {
    category: {
      type: String,
      default: null
    },
    constitution: {
      type: String,
      default: null 
    }
  },
  
  emits: ['recipe-selected'],
  
  setup(props, { emit }) {
    const store = useRecipeStore()
    const searchQuery = ref('')
    const selectedRecipeId = ref(null)
    const listContent = ref(null)
    
    // 计算筛选后的药膳列表
    const filteredRecipes = computed(() => {
      let recipes = store.recipes || []
      
      // 分类筛选
      if (props.category) {
        recipes = recipes.filter(recipe => {
          // 根据effectTags或effects字段中的内容筛选
          if (recipe.effectTags && recipe.effectTags.length) {
            return recipe.effectTags.some(tag => tag.includes(props.category))
          } else if (recipe.effects) {
            return recipe.effects.includes(props.category)
          }
          return false
        })
      }
      
      // 体质筛选
      if (props.constitution) {
        recipes = recipes.filter(recipe => {
          // 根据suitableFor字段筛选
          if (recipe.suitableFor && recipe.suitableFor.length) {
            return recipe.suitableFor.includes(props.constitution)
          }
          // 根据effects字段中的内容推断是否适合该体质
          else if (recipe.effects) {
            // 根据体质关键词匹配功效
            const constitutionKeywords = {
              '气虚质': ['补气', '益气', '扶正'],
              '阴虚质': ['滋阴', '养阴', '清热'],
              '阳虚质': ['温阳', '补阳', '温补'],
              '痰湿质': ['化痰', '祛湿', '健脾'],
              '湿热质': ['清热', '祛湿', '解毒'],
              '血瘀质': ['活血', '化瘀', '通络'],
              '气郁质': ['理气', '解郁', '舒肝']
            }
            
            const keywords = constitutionKeywords[props.constitution] || []
            return keywords.some(keyword => recipe.effects.includes(keyword))
          }
          return false
        })
      }
      
      // 搜索筛选
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim()
        recipes = recipes.filter(recipe => 
          recipe.name.toLowerCase().includes(query) || 
          (recipe.effects && recipe.effects.toLowerCase().includes(query))
        )
      }
      
      return recipes
    })
    
    // 获取药膳的功效标签
    function getEffectTags(recipe) {
      // 优先使用已提取的标签
      if (recipe.effectTags && recipe.effectTags.length) {
        return recipe.effectTags.slice(0, 3) // 最多显示3个标签
      }
      
      // 如果没有预处理的标签，尝试从功效描述中提取
      if (recipe.effects) {
        const tags = recipe.effects.split(/[,，、；;]/).map(tag => tag.trim()).filter(tag => tag.length < 8)
        return tags.slice(0, 3) // 最多显示3个标签
      }
      
      return []
    }
    
    // 选择一个药膳
    function selectRecipe(recipe) {
      selectedRecipeId.value = recipe.id
      emit('recipe-selected', recipe)
    }
    
    // 搜索处理
    function handleSearch() {
      // 搜索时滚动到顶部
      if (listContent.value) {
        listContent.value.scrollTop = 0
      }
    }
    
    // 清除分类筛选
    function clearCategory() {
      emit('category-selected', null)
    }
    
    // 清除体质筛选
    function clearConstitution() {
      emit('constitution-selected', null)
    }
    
    // 当选中的药膳通过store改变时，更新列表中的选中状态
    watch(() => store.selectedRecipe, (newSelectedRecipe) => {
      if (newSelectedRecipe) {
        selectedRecipeId.value = newSelectedRecipe.id
      } else {
        selectedRecipeId.value = null
      }
    })
    
    // 计算当前活动的分类
    const activeCategory = computed(() => props.category)
    
    // 加载状态
    const loading = computed(() => store.loading)
    
    return {
      searchQuery,
      filteredRecipes,
      selectedRecipeId,
      activeCategory,
      listContent,
      loading,
      selectRecipe,
      handleSearch,
      getEffectTags,
      clearCategory,
      clearConstitution
    }
  }
}
</script>

<style scoped>
.recipe-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 5px;
  border-radius: 8px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.title[data-v-e6f5c81b] {
    font-size: 16px;
    color: #5d4037;
    font-weight: bold;
    font-family: '楷体', serif;
    background-color:rgba(255, 255, 255, 0.79); /* 添加白色背景 */
    padding: 2px 8px; /* 增加内边距，避免文字贴边 */
    border-radius: 5px; /* 可选：添加圆角 */
    display: inline-block; /* 确保背景只包裹文字 */
}


.search-bar {
  flex: 1;
  max-width: 180px;
}

.search-bar input {
  width: 100%;
  padding: 6px 10px;
  border-radius: 16px;
  border: 1px solid rgba(93, 64, 55, 0.2);
  background-color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  color: #5d4037;
  outline: none;
  transition: all 0.3s ease;
}

.search-bar input:focus {
  border-color: #8d6e63;
  box-shadow: 0 0 0 2px rgba(141, 110, 99, 0.1);
}

.filter-info {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 5px;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background-color: rgba(141, 110, 99, 0.1);
  border-radius: 12px;
  font-size: 12px;
  color: rgb(255, 255, 255);
}

.tag-content {
  font-weight: bold;
  margin: 0 2px;
}

.clear-btn {
  margin-left: 5px;
  cursor: pointer;
  font-weight: bold;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.clear-btn:hover {
  opacity: 1;
}

.list-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 5px;
}

/* 自定义滚动条 */
.list-content::-webkit-scrollbar {
  width: 5px;
}

.list-content::-webkit-scrollbar-track {
  background: rgba(93, 64, 55, 0.05);
  border-radius: 10px;
}

.list-content::-webkit-scrollbar-thumb {
  background: rgba(93, 64, 55, 0.2);
  border-radius: 10px;
}

.list-content::-webkit-scrollbar-thumb:hover {
  background: rgba(93, 64, 55, 0.3);
}

.recipe-item {
  padding: 8px 10px;
  border-radius: 6px;
  margin-bottom: 5px;
  background-color: rgba(255, 255, 255, 0.75);
  transition: all 0.3s ease;
  border: 1px solid rgba(93, 64, 55, 0.1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.recipe-item:hover {
  background-color: rgba(255, 255, 255, 0.8);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.recipe-item.active {
  background-color: rgb(248, 246, 240);
  border-color: rgba(171, 145, 68, 0.3);
}

.recipe-name {
  font-size: 14px;
  font-weight: bold;
  color: #5d4037;
  margin-bottom: 3px;
  font-family: '宋体', serif;
}

.recipe-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.effect-tag {
  font-size: 11px;
  padding: 1px 6px;
  background-color: rgba(120, 204, 190, 0.2);
  border-radius: 8px;
  color: #3A2E39;
}

.empty-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #8d6e63;
  opacity: 0.7;
}

.empty-list .material-icons {
  font-size: 36px;
  margin-bottom: 10px;
}

.empty-list p {
  font-size: 14px;
  font-family: '宋体', serif;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #8d6e63;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(141, 110, 99, 0.2);
  border-top-color: #8d6e63;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style> 