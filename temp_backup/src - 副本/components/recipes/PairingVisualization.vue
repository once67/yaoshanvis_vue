<template>
  <div class="pairing-visualization">    
    <div v-if="recipe" class="visualization-content">
      <!-- 桑基图容器 -->
      <div ref="chartContainer" class="chart-container"></div>
      
      <!-- 配伍说明 -->
      <div class="pairing-info">
        <h3>五行配伍分析</h3>
        <div class="wuxing-tags">
          <span 
            v-for="(type, index) in wuxingTypes" 
            :key="index"
            :style="{backgroundColor: getWuxingColor(type)}"
            class="wuxing-tag"
          >
            {{ type }}
          </span>
        </div>
        <p class="analysis-text">{{ recipe.wuxingLogic || '' }}</p>
      </div>
    </div>
    
    <div v-else class="empty-state">
      <div class="empty-icon">
        <span class="material-icons">account_tree</span>
      </div>
      <p>请选择一个药膳方查看配伍分析</p>
    </div>
  </div>
</template>

<script>
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { getAssetPath } from '../../utils/paths'

export default {
  name: 'PairingVisualization',
  
  props: {
    recipe: {
      type: Object,
      default: null
    }
  },
  
  setup(props) {
    const chartContainer = ref(null)
    let chart = null
    
    const wuxingTypes = ['木', '火', '土', '金', '水']
    
    // 五行颜色映射 - 降低饱和度，更加温柔内敛
    const wuxingColors = {
      '木': '#A8C6A1', // 柔和的绿色
      '火': '#E6A097', // 柔和的红色
      '土': '#E6C99F', // 柔和的黄色
      '金': '#E8E2D7', // 柔和的米色
      '水': '#A1C0CF'  // 柔和的蓝色
    }
    
    // 功效分类映射（基于中医五行理论）- 降低饱和度
    const effectTypes = {
      '补气': { category: '土', color: '#E6C99F' },
      '滋阴': { category: '水', color: '#A1C0CF' },
      '养血': { category: '木', color: '#A8C6A1' },
      '清热': { category: '金', color: '#E8E2D7' },
      '祛湿': { category: '土', color: '#E6C99F' },
      '安神': { category: '火', color: '#E6A097' },
      '健脾': { category: '土', color: '#E6C99F' },
      '润肺': { category: '金', color: '#E8E2D7' },
      '补血': { category: '木', color: '#A8C6A1' },
      '活血': { category: '火', color: '#E6A097' }
    }
    
    // 药材五行分类映射
    const herbCategories = {
      '人参': '土',
      '白术': '土',
      '茯苓': '土',
      '甘草': '土',
      '黄芪': '土',
      '党参': '土',
      '山药': '土',
      '淮山药': '土',
      '白芍': '木',
      '当归': '木',
      '熟地': '水',
      '枸杞': '水',
      '菊花': '金',
      '桂枝': '火',
      '红花': '火',
      '生姜': '火',
      '大枣': '土',
      '莲子': '土',
      '芡实': '土',
      '陈皮': '金'
    }
    
    // 经络分类
    const meridians = [
      '心经', '肺经', '脾经', '肝经', '肾经', '胆经', '膀胱经', '三焦经'
    ]
    
    function getWuxingColor(type) {
      return wuxingColors[type] || '#795548'
    }
    
    // 初始化桑基图
    function initChart() {
      if (!chartContainer.value) return
      
      // 延迟加载ECharts以提高性能
      import('echarts').then((echarts) => {
        if (!chartContainer.value) return
        
        if (chart) {
          chart.dispose()
        }
        
        chart = echarts.init(chartContainer.value)
        console.log('桑基图初始化完成')
        
        if (props.recipe) {
          updateSankeyChart()
        }
        
        // 添加resize事件监听
        window.addEventListener('resize', () => {
          chart && chart.resize()
        })
      }).catch(err => {
        console.error('ECharts加载失败:', err)
      })
    }
    
    // 更新桑基图
    function updateSankeyChart() {
      if (!chart || !props.recipe) {
        console.log('图表或药膳数据不存在，无法更新桑基图')
        return
      }
      
      console.log('更新桑基图数据:', props.recipe.name)
      
      const recipe = props.recipe
      const ingredients = recipe.ingredients || []
      if (ingredients.length === 0) {
        console.log('药材列表为空')
        return
      }
      
      // 构建桑基图节点
      const nodes = [
        { name: recipe.name, itemStyle: { color: '#D4A6A6' } } // 更柔和的粉色
      ]
      
      // 添加药材节点
      ingredients.forEach(item => {
        const wuxing = herbCategories[item.name] || '土'
        nodes.push({
          name: item.name,
          itemStyle: { color: wuxingColors[wuxing] || '#795548' }
        })
      })
      
      // 添加功效节点
      const effects = recipe.effects.split(/[,，、；;]/).filter(e => e.trim().length > 0)
      effects.forEach(effect => {
        const typeInfo = Object.keys(effectTypes).find(key => effect.includes(key))
        const colorInfo = typeInfo ? effectTypes[typeInfo] : { color: '#795548' }
        nodes.push({
          name: effect,
          itemStyle: { color: colorInfo.color }
        })
      })
      
      // 添加经络节点
      const recipeRelatedMeridians = []
      
      // 基于药材的五行属性确定经络关联
      const meridianMapping = {
        '心经': ['火'],
        '肺经': ['金'],
        '脾经': ['土'],
        '肝经': ['木'],
        '肾经': ['水'],
        '胆经': ['木'],
        '膀胱经': ['水'],
        '三焦经': ['火']
      }
      
      // 根据药材的五行属性确定相关经络
      ingredients.forEach(item => {
        const wuxing = herbCategories[item.name] || '土'
        
        // 找出与药材五行属性相关的经络
        Object.entries(meridianMapping).forEach(([meridian, wuxingTypes]) => {
          if (wuxingTypes.includes(wuxing) && !recipeRelatedMeridians.includes(meridian)) {
            recipeRelatedMeridians.push(meridian)
          }
        })
      })
      
      // 如果没有找到相关经络，使用主要药材的五行对应的经络
      if (recipeRelatedMeridians.length === 0 && ingredients.length > 0) {
        const mainHerbWuxing = herbCategories[ingredients[0].name] || '土'
        Object.entries(meridianMapping).forEach(([meridian, wuxingTypes]) => {
          if (wuxingTypes.includes(mainHerbWuxing)) {
            recipeRelatedMeridians.push(meridian)
          }
        })
      }
      
      recipeRelatedMeridians.forEach(meridian => {
        nodes.push({
          name: meridian,
          itemStyle: { color: '#B9A0C9' } // 更柔和的紫色
        })
      })
      
      // 构建桑基图连接
      const links = []
      
      // 药膳到药材的连接
      ingredients.forEach(item => {
        links.push({
          source: recipe.name,
          target: item.name,
          value: parseInt(item.amount) || 10
        })
      })
      
      // 药材到功效的连接
      const herbEffectMapping = {
        '人参': ['补气', '益肺', '生津', '安神'],
        '白术': ['健脾', '燥湿', '止汗'],
        '茯苓': ['利水', '健脾', '宁心'],
        '甘草': ['调和', '润肺', '清热', '解毒'],
        '黄芪': ['补气', '固表', '利水', '托毒'],
        '党参': ['补气', '健脾', '生津'],
        '山药': ['补脾', '固肾', '止泻', '润肺'],
        '淮山药': ['健脾', '补肺', '固肾', '益精'],
        '白芍': ['养血', '柔肝', '止痛', '平抑阳气'],
        '当归': ['补血', '活血', '调经', '止痛'],
        '熟地': ['补血', '滋阴'],
        '枸杞': ['滋肾', '润肺', '补肝', '明目'],
        '菊花': ['疏风', '清热', '明目', '解毒'],
        '桂枝': ['发汗', '温通', '助阳'],
        '红花': ['活血', '通经', '散瘀', '止痛'],
        '生姜': ['发汗', '温中', '止呕', '解毒'],
        '大枣': ['补脾', '益气', '养血', '安神'],
        '莲子': ['补脾', '涩肠', '益肾', '安神'],
        '芡实': ['健脾', '固肾', '止带'],
        '陈皮': ['理气', '燥湿', '和胃']
      }
      
      ingredients.forEach(item => {
        // 获取药材的功效列表
        const herbEffects = herbEffectMapping[item.name] || []
        
        // 药材与其功效的强连接
        effects.forEach(effect => {
          // 检查该药材是否具有该功效
          const hasEffect = herbEffects.some(herbEffect => 
            effect.includes(herbEffect) || herbEffect.includes(effect)
          )
          
          if (hasEffect) {
            links.push({
              source: item.name,
              target: effect,
              value: 8 // 强关联
            })
          } else {
            // 检查该药材的五行属性与功效的关联
            const wuxing = herbCategories[item.name] || '土'
            const effectTypeKey = Object.keys(effectTypes).find(key => effect.includes(key))
            
            if (effectTypeKey && effectTypes[effectTypeKey].category === wuxing) {
              links.push({
                source: item.name,
                target: effect,
                value: 5 // 中等关联
              })
            }
          }
        })
        
        // 药材到经络的连接
        recipeRelatedMeridians.forEach(meridian => {
          const wuxing = herbCategories[item.name] || '土'
          
          // 检查该药材的五行属性与经络的关联
          if (meridianMapping[meridian] && meridianMapping[meridian].includes(wuxing)) {
            links.push({
              source: item.name,
              target: meridian,
              value: 5 // 强关联
            })
          }
        })
      })
      
      // 功效到经络的连接
      effects.forEach(effect => {
        recipeRelatedMeridians.forEach(meridian => {
          // 基于功效和经络的关联性确定连接
          const effectTypeKey = Object.keys(effectTypes).find(key => effect.includes(key))
          
          if (effectTypeKey) {
            const effectWuxing = effectTypes[effectTypeKey].category
            
            // 如果功效的五行与经络的五行一致或有相生关系，建立连接
            if (meridianMapping[meridian] && meridianMapping[meridian].includes(effectWuxing)) {
              links.push({
                source: effect,
                target: meridian,
                value: 4
              })
            }
          }
        })
      })
      
      // 桑基图配置
      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          triggerOn: 'mousemove',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: '#B3A397', // 更柔和的边框色
          borderWidth: 1,
          textStyle: {
            color: '#6D5D56', // 更柔和的文字颜色
            fontFamily: '宋体'
          },
          formatter: function(params) {
            if (params.dataType === 'edge') {
              return `${params.data.source} → ${params.data.target}: ${params.data.value}`;
            } else if (params.dataType === 'node') {
              return `<strong>${params.name}</strong>`;
            }
          }
        },
        series: [
          {
            type: 'sankey',
            left: '5%',
            right: '15%',
            top: '8%',
            bottom: '5%',
            data: nodes,
            links: links,
            orient: 'horizontal',
            draggable: false,
            nodeWidth: 20,
            nodeGap: 12,
            emphasis: {
              focus: 'adjacency',
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.2)'
              }
            },
            label: {
              fontFamily: '楷体',
              fontSize: 12,
              color: '#3A2E39',
              formatter: '{b}'
            },
            lineStyle: {
              color: 'source',
              opacity: 0.4, // 降低不透明度
              curveness: 0.5
            },
            itemStyle: {
              borderWidth: 1,
              borderColor: '#F7F4F0', // 更柔和的边框色
              shadowColor: 'rgba(0, 0, 0, 0.1)', // 降低阴影强度
              shadowBlur: 2
            }
          }
        ]
      }
      
      try {
        chart.setOption(option)
        console.log('桑基图渲染完成')
      } catch (error) {
        console.error('桑基图渲染错误:', error)
      }
    }
    
    // 监听药膳变化
    watch(() => props.recipe, (newVal) => {
      console.log('药膳变化:', newVal?.name)
      
      nextTick(() => {
        if (newVal) {
          if (!chart) {
            initChart()
          } else {
            updateSankeyChart()
          }
        }
      })
    }, { deep: true })
    
    // 组件挂载时初始化
    onMounted(() => {
      console.log('配伍图谱组件挂载')
      nextTick(() => {
        initChart()
      })
    })
    
    // 组件卸载时清理资源
    onUnmounted(() => {
      console.log('配伍图谱组件卸载')
      if (chart) {
        chart.dispose()
        chart = null
        window.removeEventListener('resize', () => {
          chart && chart.resize()
        })
      }
    })
    
    return {
      chartContainer,
      wuxingTypes,
      getWuxingColor,
      getAssetPath
    }
  }
}
</script>

<style scoped>
.pairing-visualization {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.visualization-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chart-container {
  flex: 1;
  min-height: 250px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  position: relative;
}

.pairing-info {
  padding: 15px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
}

.pairing-info h3 {
  color: white; /* 文字颜色调整为白色，增强对比度 */
  background-color: #8d6e63; /* 棕色背景 */
  padding: 8px 12px; /* 让背景不会紧贴文字 */
  font-family: '楷体', serif;
  font-size: 18px;
  margin-bottom: 15px;
  display: block;
  width: 100%;
  text-align: center; /* 让文字居中 */

  border-radius: 6px; /* 让背景带圆角 */
}


.wuxing-tags {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.wuxing-tag {
  border-radius: 15px;
  padding: 4px 12px;
  font-family: '楷体', serif;
  color: white;
  display: inline-block;
}

.analysis-text {
  color: #5d4037;
  line-height: 1.8;
  font-family: '宋体', serif;
  text-align: justify;
  margin: 0;
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

/* 添加Material Icons支持 */
.material-icons {
  font-family: 'Material Icons';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
}
</style> 