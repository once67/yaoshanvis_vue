<template>
  <div class="force-graph">
    <div ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

export default {
  name: 'RecipeForceGraph',
  
  props: {
    recipe: {
      type: Object,
      required: true
    }
  },
  
  setup(props) {
    const chartContainer = ref(null)
    let chart = null
    
    // 节点分类与颜色映射
    const categoryColors = {
      'recipe': {
        base: '#A1C0CF',
        gradient: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
          { offset: 0, color: '#BFD7E3' },
          { offset: 1, color: '#A1C0CF' }
        ])
      },
      'herb': {
        base: '#E6C99F',
        gradient: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
          { offset: 0, color: '#F2DEC0' },
          { offset: 1, color: '#E6C99F' }
        ])
      },
      'food': {
        base: '#E6A097',
        gradient: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
          { offset: 0, color: '#F2BCB5' },
          { offset: 1, color: '#E6A097' }
        ])
      },
      'effect': {
        base: '#A8C6A1',
        gradient: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
          { offset: 0, color: '#C4DBC0' },
          { offset: 1, color: '#A8C6A1' }
        ])
      }
    }
    
    // 药材功效映射表（基于中医药理论）
    const herbEffectMapping = {
      '人参': ['补气', '益肺', '生津', '安神'],
      '白术': ['健脾', '燥湿', '止汗'],
      '茯苓': ['利水', '健脾', '宁心'],
      '甘草': ['调和', '润肺', '清热', '解毒'],
      '黄芪': ['补气', '固表', '利水', '托毒'],
      '党参': ['补气', '健脾', '生津'],
      '山药': ['补脾', '固肾', '止泻', '润肺'],
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
      '陈皮': ['理气', '燥湿', '和胃'],
      '远志': ['安神', '益智', '祛痰', '消肿'],
      '酸枣仁': ['安神', '敛汗', '生津'],
      '木香': ['行气', '健脾', '止痛'],
      '龙眼肉': ['补心', '益脾', '养血', '安神'],
      '淮山药': ['健脾', '补肺', '固肾', '益精'],
      '黄精': ['补气', '养阴', '健脾', '润肺']
    }
    
    // 初始化图表
    function initChart() {
      if (!chartContainer.value) return
      
      chart = echarts.init(chartContainer.value)
      updateChart()
      
      // 响应窗口大小变化
      window.addEventListener('resize', handleResize)
    }
    
    // 更新图表数据
    function updateChart() {
      if (!chart || !props.recipe) return
      
      const recipe = props.recipe
      
      // 准备节点和链接数据
      const nodes = []
      const links = []
      
      // 添加药膳名称节点(核心节点)
      nodes.push({
        id: 'recipe-' + recipe.id,
        name: recipe.name,
        symbolSize: 70,
        category: 0,
        x: 0,  // 固定在中心
        y: 0,
        fixed: true,
        itemStyle: {
          color: categoryColors.recipe.gradient,
          borderWidth: 2,
          borderColor: categoryColors.recipe.base
        },
        label: {
          show: true,
          position: 'inside',
          formatter: '{b}',
          fontSize: 16,
          fontWeight: 'bold',
          color: '#2c3e50'
        }
      })
      
      // 添加功效节点(第二层级)
      const effectTags = getEffectTags(recipe)
      effectTags.forEach((tag, index) => {
        const angle = (index / effectTags.length) * Math.PI * 2
        const radius = 150  // 第一层半径
        nodes.push({
          id: 'effect-' + index,
          name: tag,
          symbolSize: 45,
          category: 1,
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          itemStyle: {
            color: categoryColors.effect.gradient,
            borderWidth: 1.5,
            borderColor: categoryColors.effect.base
          },
          label: {
            show: true,
            position: 'right',
            fontSize: 14,
            color: '#34495e'
          }
        })
        
        links.push({
          source: 'recipe-' + recipe.id,
          target: 'effect-' + index,
          lineStyle: {
            color: categoryColors.effect.base,
            width: 2,
            curveness: 0,
            type: 'solid'
          }
        })
      })
      
      // 添加药材节点(第三层级)
      if (recipe.ingredients) {
        recipe.ingredients.forEach((herb, index) => {
          const angle = (index / recipe.ingredients.length) * Math.PI * 2
          const radius = 250  // 第二层半径
          nodes.push({
            id: 'herb-' + index,
            name: herb.name,
            symbolSize: 35,
            category: 2,
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            itemStyle: {
              color: categoryColors.herb.gradient,
              borderWidth: 1.5,
              borderColor: categoryColors.herb.base
            },
            label: {
              show: true,
              position: 'right',
              fontSize: 13,
              color: '#34495e'
            }
          })
          
          // 连接药膳和药材
          links.push({
            source: 'recipe-' + recipe.id,
            target: 'herb-' + index,
            lineStyle: {
              color: categoryColors.herb.base,
              width: 1.5,
              curveness: 0.1,
              opacity: 0.7
            }
          })
          
          // 药材与功效的连接
          const herbEffects = herbEffectMapping[herb.name] || []
          effectTags.forEach((effectTag, effectIndex) => {
            const hasMatching = herbEffects.some(effect => 
              effectTag.includes(effect) || effect.includes(effectTag)
            )
            
            if (hasMatching) {
              links.push({
                source: 'herb-' + index,
                target: 'effect-' + effectIndex,
                lineStyle: {
                  color: 'rgba(171, 145, 68, 0.5)',
                  width: 1,
                  curveness: 0.3,
                  opacity: 0.5
                }
              })
            }
          })
        })
      }
      
      // 添加食材节点(第四层级)
      if (recipe.foodIngredients) {
        recipe.foodIngredients.forEach((food, index) => {
          const angle = (index / recipe.foodIngredients.length) * Math.PI * 2
          const radius = 350  // 第三层半径
          nodes.push({
            id: 'food-' + index,
            name: food.name,
            symbolSize: 30,
            category: 3,
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            itemStyle: {
              color: categoryColors.food.gradient,
              borderWidth: 1,
              borderColor: categoryColors.food.base
            },
            label: {
              show: true,
              position: 'right',
              fontSize: 12,
              color: '#34495e'
            }
          })
          
          links.push({
            source: 'recipe-' + recipe.id,
            target: 'food-' + index,
            lineStyle: {
              color: categoryColors.food.base,
              width: 1,
              curveness: 0.1,
              opacity: 0.6
            }
          })
        })
      }
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: function(params) {
            if (params.dataType === 'node') {
              return `<div style="padding: 8px">
                <div style="font-weight: bold">${params.data.name}</div>
                ${params.data.category === 0 ? '<div style="margin-top: 4px">点击查看详情</div>' : ''}
              </div>`
            }
            return ''
          },
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(0, 0, 0, 0.1)',
          textStyle: {
            color: '#5d4037'
          }
        },
        
        legend: {
          data: ['药膳', '功效', '药材', '食材'],
          textStyle: {
            color: '#5d4037'
          },
          selected: {
            '药膳': true,
            '功效': true,
            '药材': true,
            '食材': true
          }
        },
        
        animationDuration: 1000,
        animationEasingUpdate: 'cubicInOut',
        
        series: [{
          name: '药膳组成关系',
          type: 'graph',
          layout: 'none',  // 使用自定义布局
          data: nodes,
          links: links,
          categories: [
            { name: '药膳' },
            { name: '功效' },
            { name: '药材' },
            { name: '食材' }
          ],
          roam: true,
          focusNodeAdjacency: true,
          itemStyle: {
            borderCap: 'round',
            borderJoin: 'round'
          },
          label: {
            show: true,
            position: 'right',
            formatter: '{b}',
            fontSize: 12,
            color: '#34495e'
          },
          edgeSymbol: ['none', 'arrow'],
          edgeSymbolSize: [0, 8],
          lineStyle: {
            color: 'source',
            curveness: 0.1
          },
          emphasis: {
            focus: 'adjacency',
            lineStyle: {
              width: 4
            },
            itemStyle: {
              borderWidth: 2,
              borderColor: '#fff'
            },
            label: {
              fontSize: 14,
              fontWeight: 'bold'
            }
          },
          zoom: 0.8,
          center: [0, 0]
        }]
      }
      
      chart.setOption(option)
    }
    
    // 处理窗口大小变化
    function handleResize() {
      if (chart) {
        chart.resize()
      }
    }
    
    // 获取药膳的功效标签
    function getEffectTags(recipe) {
      // 如果有预处理的标签，直接使用
      if (recipe.effectTags && recipe.effectTags.length) {
        return recipe.effectTags
      }
      
      // 否则尝试从功效描述中提取标签
      if (recipe.effects) {
        return recipe.effects
          .split(/[,，、；;]/)
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0 && tag.length < 10)
          .slice(0, 5) // 最多使用5个标签
      }
      
      return ['功效未知']
    }
    
    // 监听药膳数据变化
    watch(() => props.recipe, () => {
      nextTick(updateChart)
    }, { deep: true })
    
    // 组件挂载时初始化图表
    onMounted(() => {
      nextTick(() => {
        initChart()
      })
    })
    
    // 组件卸载时清理资源
    onUnmounted(() => {
      if (chart) {
        chart.dispose()
        chart = null
      }
      window.removeEventListener('resize', handleResize)
    })
    
    return {
      chartContainer
    }
  }
}
</script>

<style scoped>
.force-graph {
  width: 100%;
  height: 100%;
  position: relative;
}

.chart-container {
  width: 100%;
  height: 100%;

  /* 添加背景图 */
  background-image: url('backgrounds/边框2.png'); /* 替换为你的图片路径 */
  background-size: 100% 100%; /* 让背景图完全拉伸适应容器 */
  background-position: center; /* 居中对齐 */
  background-repeat: no-repeat; /* 防止图片重复 */
}

</style> 