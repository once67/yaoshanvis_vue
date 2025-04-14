<template>
  <div class="category-chart">
    <div ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRecipeStore } from '../../store'
import { getAssetPath } from '../../utils/paths'

export default {
  name: 'CategoryPieChart',
  
  emits: ['category-selected'],
  
  setup(props, { emit }) {
    const store = useRecipeStore()
    const chartContainer = ref(null)
    let chart = null
    
    // 分类颜色映射 - 更加温柔内敛的低饱和度颜色
    const categoryColors = {
      '补气养血': '#E6A097', // 柔和的粉红色
      '健脾祛湿': '#E6C99F', // 柔和的黄色
      '滋阴补肾': '#A1C0CF', // 柔和的蓝色
      '清热解毒': '#A8C6A1', // 柔和的绿色
      '润肺止咳': '#B9A0C9', // 柔和的紫色
      '理气解郁': '#E6B89C', // 柔和的橙色
      '活血化瘀': '#D4A6A6', // 柔和的深粉色
      '安神助眠': '#A5B0C9', // 柔和的靛蓝色
      '温补阳气': '#D8B49E', // 柔和的橘红色
      '固表止汗': '#B9CBA5'  // 柔和的浅绿色
    }
    
    // 生成柔和的随机颜色（低饱和度）
    function getRandomColor() {
      // 生成柔和的基础色调
      const h = Math.floor(Math.random() * 360); // 色相
      const s = Math.floor(Math.random() * 30 + 20); // 低饱和度 (20%-50%)
      const l = Math.floor(Math.random() * 20 + 60); // 高亮度 (60%-80%)
      
      // 转换HSL到RGB (简化版本)
      return `hsl(${h}, ${s}%, ${l}%)`;
    }
    
    // 获取分类颜色
    function getCategoryColor(category) {
      return categoryColors[category] || getRandomColor();
    }
    
    // 选择分类
    function selectCategory(category) {
      emit('category-selected', category);
    }
    
    // 初始化图表
    function initChart() {
      if (!chartContainer.value) return;
      
      chart = echarts.init(chartContainer.value);
      
      // 注册点击事件
      chart.on('click', function(params) {
        if (params.componentType === 'series') {
          selectCategory(params.name);
        }
      });
      
      // 初始更新图表数据
      updateChart();
      
      // 响应窗口大小变化
      window.addEventListener('resize', handleResize);
    }
    
    // 处理窗口大小变化
    function handleResize() {
      if (chart) {
        chart.resize();
      }
    }
    
    // 更新图表数据
    function updateChart() {
      if (!chart) return;
      
      // 获取分类数据
      const categories = store.categories;
      
      if (!categories || categories.length === 0) {
        // 显示加载中或无数据状态
        chart.setOption({
          title: {
            left: 'center',
            top: 'center',
            textStyle: {
              color: '#B3A397', // 更柔和的文字颜色
              fontSize: 14,
              fontWeight: 'normal'
            }
          }
        });
        return;
      }
      
      // 转换数据格式为echarts需要的格式
      const chartData = categories.map(category => ({
        name: category.name,
        value: category.count,
        itemStyle: {
          color: getCategoryColor(category.name)
        }
      }));
      
      // 设置图表选项
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: '#B3A397', // 更柔和的边框色
          borderWidth: 1,
          textStyle: {
            color: '#6D5D56', // 更柔和的文字颜色
            fontSize: 12
          }
        },
        legend: {
          orient: 'vertical',
          right: 10,
          top: 'center',
          itemWidth: 10,
          itemHeight: 10,
          itemGap: 10,
          textStyle: {
            fontSize: 12,
            color: '#6D5D56' // 更柔和的文字颜色
          }
        },
        series: [
          {
            name: '药膳分类',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['40%', '50%'],
            avoidLabelOverlap: true,
            itemStyle: {
              borderColor: '#F7F4F0', // 更柔和的边框色
              borderWidth: 3, // 减小边框宽度，使外观更柔和
              borderRadius: 4, // 添加圆角
              shadowBlur: 5, // 轻微阴影
              shadowColor: 'rgba(0, 0, 0, 0.1)', // 柔和的阴影颜色
              opacity: 0.9 // 轻微半透明效果
            },
            emphasis: { // 鼠标悬停效果
              scale: false, // 禁用缩放效果
              scaleSize: 0, // 禁用缩放大小
              itemStyle: {
                borderWidth: 3,
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.2)'
              }
            },
            label: {
              show: false
            },
            labelLine: {
              show: false
            },
            data: chartData
          }
        ]
      };
      
      chart.setOption(option);
    }
    
    // 监听分类数据变化
    watch(() => store.categories, () => {
      nextTick(updateChart);
    }, { deep: true });
    
    // 组件挂载时初始化图表
    onMounted(() => {
      nextTick(() => {
        initChart();
      });
    });
    
    // 组件卸载时销毁图表
    onUnmounted(() => {
      if (chart) {
        chart.dispose();
        chart = null;
      }
      window.removeEventListener('resize', handleResize);
    });
    
    return {
      chartContainer,
      getAssetPath
    };
  }
}
</script>

<style scoped>
.category-chart {
  width: 100%;
  height: 100%;
  position: relative;
}

.chart-container {
  width: 100%;
  height: 100%;
  min-height: 280px;
}
</style> 