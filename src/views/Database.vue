<script setup>
import * as echarts from 'echarts'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useHerbalStore } from '../store'
// 引入地图相关
import chinaJson from '../assets/geojson/china_alt.json'
// 引入词云图组件
import 'echarts-wordcloud'
// 在文件顶部添加导入
// 添加常用中医功效词汇列表用于分词
const commonEffectWords = [
  '补气', '益气', '补血', '养血', '活血', '化瘀', '行气', '理气', '止痛', '镇痛', 
  '清热', '解毒', '泻火', '祛湿', '利水', '消肿', '散寒', '温中', '温肾', '助阳', 
  '补阴', '滋阴', '润肺', '止咳', '化痰', '平喘', '安神', '养心', '宁心', '安胎', 
  '补脾', '健脾', '消食', '开胃', '止泻', '止血', '凉血', '利胆', '明目', '清心', 
  '止汗', '生津', '敛阴', '固表', '固肠', '固精', '止带', '收敛', '杀虫', '消积', 
  '解表', '发汗', '抗菌', '消炎', '升提', '降逆', '涩肠', '益智', '益肾', '补肝',
  '养肝', '养胃', '健胃', '强心', '降压', '平肝', '潜阳', '祛风', '通络', '通经'
]

// 注册中国地图
echarts.registerMap('china', chinaJson)

const route = useRoute()
const herbalStore = useHerbalStore()
const store = useHerbalStore()

const activeCategory = ref(null)
const searchQuery = ref('')
const mapChartRef = ref(null)
const selectedHerb = ref(null)
const showHerbDetail = ref(false) // 控制药材详情对话框显示
const wordCloudChartRef = ref(null) // 词云图引用
let wordCloudChart = null // 词云图实例
let radarChart = null
let sankeyChart = null
let mapChart = null
const timelineChartRef = ref(null)
let timelineChart = null

// 添加气泡图引用
const componentBubbleChartRef = ref(null)
let componentBubbleChart = null

// 解析成分数据
const parseComponents = (componentsText) => {
  if (!componentsText) return { nutrients: [], others: [] }
  
  const nutrients = []
  const others = []
  
  try {
    // 使用正则表达式匹配两个部分
    const nutrientMatch = componentsText.match(/1\..*?营养成分.*?([^2]+)2\./)
    const otherMatch = componentsText.match(/2\..*?其他成分(.+)/)
    
    if (nutrientMatch && nutrientMatch[1]) {
      // 处理营养成分
      const nutrientContent = nutrientMatch[1]
        .replace(/\[[^\]]*\]/g, '') // 移除引用标记 [数字]
        .replace(/等[^、；。]+[；。]?$/, '') // 移除"等..."结尾
        .trim()
      
      // 分割成分
      const nutrientItems = nutrientContent.split(/[、；]/).filter(Boolean)
      
      nutrientItems.forEach(item => {
        const name = item.trim()
          .replace(/\([^)]*\)/g, '') // 移除括号内容
          .replace(/^[和与]/, '') // 移除开头的"和"或"与"
          .trim()
        
        if (name) {
          nutrients.push({
            name,
            type: '营养成分',
            value: 50
          })
        }
      })
    }
    
    if (otherMatch && otherMatch[1]) {
      // 处理其他成分
      const otherContent = otherMatch[1]
        .replace(/\[[^\]]*\]/g, '') // 移除引用标记 [数字]
        .replace(/等[^、；。]+[；。]?$/, '') // 移除"等..."结尾
        .trim()
      
      // 分割成分
      const otherItems = otherContent.split(/[、；]/).filter(Boolean)
      
      otherItems.forEach(item => {
        const name = item.trim()
          .replace(/\([^)]*\)/g, '') // 移除括号内容
          .replace(/^[和与]/, '') // 移除开头的"和"或"与"
          .trim()
        
        if (name) {
          others.push({
            name,
            type: '其他成分',
            value: 30
          })
        }
      })
    }
  } catch (error) {
    console.error('解析成分数据出错:', error)
  }
  
  console.log('解析结果:', { nutrients, others })
  return { nutrients, others }
}

// 更新气泡图
const updateComponentBubbleChart = (herb) => {
  if (!componentBubbleChart || !store.selectedHerbDetail) return
  
  const { nutrients, others } = parseComponents(store.selectedHerbDetail.components)
  
  // 如果没有数据,显示提示
  if (nutrients.length === 0 && others.length === 0) {
    componentBubbleChart.setOption({
      title: {
        text: '暂无成分数据',
        left: 'center',
        top: 'middle'
      },
      series: []
    })
    return
  }
  
  const option = {
    title: {
      text: `${herb.name}的成分分析`,
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 16,
        color: '#333'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        return `${params.name}<br/>类型: ${params.data.type}`
      }
    },
    legend: {
      top: 40,
      data: ['营养成分', '其他成分']
    },
    grid: {
      top: 100,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false }
    },
    yAxis: {
      type: 'category',
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false }
    },
    series: [
      {
        name: '营养成分',
        type: 'scatter',
        data: nutrients.map((item, index) => ({
          name: item.name,
          value: [
            index % 5, // x坐标
            Math.floor(index / 5), // y坐标
            item.value // 气泡大小
          ],
          type: item.type
        })),
        symbolSize: 60,
        itemStyle: {
          color: '#91cc75',
          opacity: 0.8,
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.2)'
        },
        emphasis: {
          itemStyle: {
            opacity: 1
          }
        },
        label: {
          show: true,
          formatter: '{b}',
          position: 'inside',
          color: '#fff',
          fontSize: 12,
          fontWeight: 'bold',
          textShadowBlur: 2,
          textShadowColor: 'rgba(0, 0, 0, 0.3)'
        }
      },
      {
        name: '其他成分',
        type: 'scatter',
        data: others.map((item, index) => ({
          name: item.name,
          value: [
            index % 5 + 6, // x坐标偏移
            Math.floor(index / 5), // y坐标
            item.value // 气泡大小
          ],
          type: item.type
        })),
        symbolSize: 50,
        itemStyle: {
          color: '#5470c6',
          opacity: 0.8,
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.2)'
        },
        emphasis: {
          itemStyle: {
            opacity: 1
          }
        },
        label: {
          show: true,
          formatter: '{b}',
          position: 'inside',
          color: '#fff',
          fontSize: 12,
          fontWeight: 'bold',
          textShadowBlur: 2,
          textShadowColor: 'rgba(0, 0, 0, 0.3)'
        }
      }
    ]
  }
  
  componentBubbleChart.setOption(option)
}

// 初始化气泡图
const initComponentBubbleChart = () => {
  if (!componentBubbleChartRef.value) return
  
  componentBubbleChart = echarts.init(componentBubbleChartRef.value)
  
  // 设置默认配置
  const option = {
    title: {
      text: '请选择药食查看成分分析',
      left: 'center'
    }
  }
  
  componentBubbleChart.setOption(option)
}

// 生成渐变色彩板
const generateColorPalette = (baseColor) => {
  console.log('生成颜色板,基础颜色:', baseColor)
  
  try {
    let rgb = [];
    // 处理rgb/rgba格式
    if (baseColor.startsWith('rgb')) {
      const matches = baseColor.match(/\d+/g);
      if (matches && matches.length >= 3) {
        rgb = matches.slice(0, 3).map(Number);
      } else {
        throw new Error('RGB格式解析失败');
      }
    } 
    // 处理十六进制格式
    else if (baseColor.startsWith('#')) {
      const hex = baseColor.replace('#', '')
      rgb = [
        parseInt(hex.substr(0, 2), 16),
        parseInt(hex.substr(2, 2), 16),
        parseInt(hex.substr(4, 2), 16)
      ]
    } else {
      throw new Error('不支持的颜色格式')
    }
    
    console.log('解析的RGB值:', rgb)
    
    if (!rgb || rgb.length < 3 || rgb.some(v => isNaN(v))) {
      throw new Error('无效的RGB值')
    }
    
    // 生成不同透明度的颜色
    return [
      `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.8)`,
      `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.6)`,
      `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.4)`,
      `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.2)`
    ]
  } catch (error) {
    console.error('生成颜色板失败:', error)
    // 返回默认颜色
    return [
      'rgba(139, 195, 74, 0.8)',
      'rgba(139, 195, 74, 0.6)',
      'rgba(139, 195, 74, 0.4)',
      'rgba(139, 195, 74, 0.2)'
    ]
  }
}

// 更新词云图方法
const updateWordCloudByElement = (element) => {
  if (!wordCloudChart) return
  
  console.log('更新词云图,五行属性:', element)
  
  const elementHerbs = herbalStore.herbs.filter(herb => herb.category === element)
  console.log(`按${element}属性筛选出${elementHerbs.length}种药食`)
  
  // 获取五行颜色
  const category = herbalStore.categories.find(c => c.name === element)
  if (!category) {
    console.error('未找到五行属性对应的配置:', element)
    return
  }
  
  const color = category.color
  console.log('五行颜色:', color)
  
  // 生成渐变色彩板
  const colorPalette = generateColorPalette(color)
  console.log('生成的颜色板:', colorPalette)
  
  // 收集所有功效
  let allEffects = []
  elementHerbs.forEach(herb => {
    // 优先使用详细信息中的功效
    if (herb.detailedInfo && herb.detailedInfo.effect) {
      allEffects = [...allEffects, ...herb.detailedInfo.effect.split('、').filter(Boolean)]
    } else if (herb.effects && herb.effects.length > 0) {
      allEffects = [...allEffects, ...herb.effects]
    }
  })
  console.log(`收集到${allEffects.length}条功效信息`)
  
  // 分词处理功效信息
  const segmentedWords = []
  allEffects.forEach(effect => {
    // 对每个功效进行分词
    const words = segmentEffect(effect)
    segmentedWords.push(...words)
  })
  console.log(`分词后得到${segmentedWords.length}个词语`)
  
  // 统计词频
  const wordCount = {}
  segmentedWords.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1
  })
  console.log('分词统计:', wordCount)
  
  // 转换为词云数据格式
  const cloudData = Object.keys(wordCount).map(word => ({
    name: word,
    value: wordCount[word]
  })).sort((a, b) => b.value - a.value)
  console.log('词云数据:', cloudData)
  
  const newOption = {
    title: {
      text: `${element}行药食功效词云`,
      subtext: `统计自${elementHerbs.length}种药食的功效`,
      left: 'center',
      textStyle: {
        color: '#3A2E39',
        fontFamily: '楷体',
        fontSize: 20
      }
    },
    tooltip: {
      show: true,
      formatter: '{b}: {c}次'
    },
    series: [{
      type: 'wordCloud',
      shape: 'circle',
      left: 'center',
      top: 'center',
      width: '90%',
      height: '80%',
      right: null,
      bottom: null,
      sizeRange: [12, 50],  // 字体大小范围
      rotationRange: [-45, 45],  // 旋转角度范围
      rotationStep: 15,
      gridSize: 8,
      drawOutOfBound: false,
      textStyle: {
        fontFamily: '楷体',
        fontWeight: 'normal',
        color: function() {
          return colorPalette[Math.floor(Math.random() * colorPalette.length)]
        }
      },
      emphasis: {
        focus: 'self',
        textStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.3)',
          fontSize: 60
        }
      },
      data: cloudData.length > 0 ? cloudData : [{ name: '暂无数据', value: 20 }]
    }]
  }
  
  wordCloudChart.setOption(newOption)
}

// 中文功效分词函数
const segmentEffect = (effect) => {
  if (!effect) return []
  
  // 去除特殊符号
  effect = effect.replace(/[，。；！？,\.;!?]/g, '')
  
  const result = []
  let remainText = effect
  
  // 基于常用功效词汇进行分词
  while (remainText.length > 0) {
    let matched = false
    
    // 从长到短匹配常用词
    for (let i = 0; i < commonEffectWords.length; i++) {
      const word = commonEffectWords[i]
      if (remainText.includes(word)) {
        const index = remainText.indexOf(word)
        
        // 如果词在开头或中间，则提取出来
        if (index === 0 || index > 0) {
          result.push(word)
          remainText = remainText.replace(word, '') // 移除已匹配词
          matched = true
          break
        }
      }
    }
    
    // 如果没有匹配到常用词，则逐字提取
    if (!matched) {
      // 提取单个中文字符（如果长度大于2个字符）
      if (remainText.length > 2) {
        const char = remainText.charAt(0)
        remainText = remainText.substring(1)
        
        // 跳过单个字符，除非它是关键字
        const isKeyword = ['补', '清', '活', '化', '强', '固', '养'].includes(char)
        if (isKeyword) {
          result.push(char)
        }
      } else {
        // 最后剩余的短文本，如果有意义则添加
        if (remainText.length >= 2) {
          result.push(remainText)
        }
        break
      }
    }
  }
  
  // 过滤掉太短的词（单个字符）
  return result.filter(word => word.length >= 2 || ['补', '清', '活', '化', '强', '固', '养'].includes(word))
}

// 创建Python分词脚本
const createPythonSegmentationScript = (element, cloudData) => {
  // 这里仅创建示例Python脚本，实际应用需要与后端集成
  const script = `
import jieba
import json
from collections import Counter

# 读取功效数据
effects_data = ${JSON.stringify(cloudData)}

# 分词处理
all_words = []
for item in effects_data:
    words = jieba.cut(item['name'])
    all_words.extend([w for w in words if len(w) > 1])

# 统计词频
word_counts = Counter(all_words)

# 生成新的词云数据
word_cloud_data = [{"name": word, "value": count} for word, count in word_counts.items()]

# 排序
word_cloud_data.sort(key=lambda x: x['value'], reverse=True)

# 输出结果
with open("${element}_wordcloud_segmented.json", "w", encoding="utf-8") as f:
    json.dump(word_cloud_data, f, ensure_ascii=False, indent=2)

print(f"已将{element}属性的分词结果保存到 {element}_wordcloud_segmented.json")
`
  console.log('生成Python分词脚本:', script)
  // 此处仅日志输出脚本，实际应用中可能需要保存到文件或发送到后端执行
}

// 重置词云图为总体状态
const resetWordCloud = () => {
  if (!wordCloudChart) return
  
  console.log('重置词云图为总体状态')
  
  // 收集所有药材的功效
  let allEffects = []
  herbalStore.herbs.forEach(herb => {
    if (herb.detailedInfo && herb.detailedInfo.effect) {
      allEffects = [...allEffects, ...herb.detailedInfo.effect.split('、').filter(Boolean)]
    } else if (herb.effects && herb.effects.length > 0) {
      allEffects = [...allEffects, ...herb.effects]
    }
  })
  
  // 分词处理功效信息
  const segmentedWords = []
  allEffects.forEach(effect => {
    const words = segmentEffect(effect)
    segmentedWords.push(...words)
  })
  
  // 统计词频
  const wordCount = {}
  segmentedWords.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1
  })
  
  // 转换为词云数据格式
  const cloudData = Object.keys(wordCount).map(word => ({
    name: word,
    value: wordCount[word]
  })).sort((a, b) => b.value - a.value)
  
  const option = {
    title: {
      text: '药食功效总体词云',
      subtext: `统计自${herbalStore.herbs.length}种药食的功效`,
      left: 'center',
      textStyle: {
        color: '#3A2E39',
        fontFamily: '楷体',
        fontSize: 20
      }
    },
    tooltip: {
      show: true,
      formatter: '{b}: {c}次'
    },
    series: [{
      type: 'wordCloud',
      shape: 'circle',
      left: 'center',
      top: 'center',
      width: '90%',
      height: '80%',
      right: null,
      bottom: null,
      sizeRange: [12, 50],
      rotationRange: [-45, 45],
      rotationStep: 15,
      gridSize: 8,
      drawOutOfBound: false,
      textStyle: {
        fontFamily: '楷体',
        fontWeight: 'normal',
        color: function() {
          // 使用五行颜色随机组合
          const colors = herbalStore.categories.map(c => c.color)
          return colors[Math.floor(Math.random() * colors.length)]
        }
      },
      emphasis: {
        focus: 'self',
        textStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.3)',
          fontSize: 60
        }
      },
      data: cloudData.length > 0 ? cloudData : [{ name: '暂无数据', value: 20 }]
    }]
  }
  
  wordCloudChart.setOption(option)
}

// 选择一个药材展示详情
const selectHerb = async (herb) => {
  console.log('Selecting herb:', herb)
  
  // 确保详细数据已加载
  if (store.detailedHerbData.length === 0) {
    console.log('Loading detailed data...')
    await store.fetchDetailedHerbData()
  }
  
  // 先获取详细数据
  const detail = store.getHerbDetail(herb.name)
  console.log('Got herb detail:', detail)
  
  if (detail) {
    selectedHerb.value = herb
    showHerbDetail.value = true
    // 更新气泡图
    updateComponentBubbleChart(herb)
  } else {
    console.error('No detail data found for herb:', herb.name)
  }
}

// 关闭药材详情对话框
const closeHerbDetail = () => {
  // 不清除selectedHerb，只隐藏对话框
  showHerbDetail.value = false
}

// 更新雷达图数据
const updateRadarChart = (herb) => {
  if (!radarChart) return
  
  // 模拟功效数值，实际应该从数据库获取
  const effectValues = {
    '补气': Math.floor(Math.random() * 100),
    '滋阴': Math.floor(Math.random() * 100),
    '养血': Math.floor(Math.random() * 100),
    '清热': Math.floor(Math.random() * 100),
    '祛湿': Math.floor(Math.random() * 100),
  }
  
  // 获取五行对应的颜色
  const categoryColor = herbalStore.categories.find(c => c.name === herb.category)?.color || '#8BC34A';
  
  const newOption = {
    series: [
      {
        data: [
          {
            value: [
              effectValues['补气'],
              effectValues['滋阴'],
              effectValues['养血'],
              effectValues['清热'],
              effectValues['祛湿']
            ],
            name: herb.name,
            lineStyle: {
              width: 2,
              color: categoryColor
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: categoryColor.replace(')', ', 0.6)').replace('rgb', 'rgba') },
                  { offset: 1, color: categoryColor.replace(')', ', 0.1)').replace('rgb', 'rgba') }
                ]
              }
            },
            itemStyle: {
              color: categoryColor,
              borderColor: '#fff',
              borderWidth: 2
            }
          }
        ]
      }
    ]
  }
  
  radarChart.setOption(newOption)
}

// 更新桑基图
const updateSankeyChart = (herb) => {
  if (!sankeyChart) return
  
  // 模拟桑基图数据，实际应该从数据库获取
  const funcEffects = herb.effects.slice(0, 3) // 取前三个功效
  const meridians = ['心经', '肺经', '肝经', '脾经', '肾经', '胆经', '膀胱经', '三焦经'] // 模拟归经
  const herbMeridians = []
  
  // 随机选择2-3个归经
  const meridianCount = Math.floor(Math.random() * 2) + 2; // 2-3个
  for (let i = 0; i < meridianCount; i++) {
    const idx = Math.floor(Math.random() * meridians.length)
    if (!herbMeridians.includes(meridians[idx])) {
      herbMeridians.push(meridians[idx])
    }
  }
  
  // 获取五行对应的颜色
  const categoryColor = herbalStore.categories.find(c => c.name === herb.category)?.color || '#8BC34A';
  
  // 构建节点
  const nodes = [
    { 
      name: herb.name, 
      itemStyle: { color: categoryColor }
    }
  ]
  
  // 功效颜色映射
  const effectColors = {
    '补气': '#FFA726',
    '滋阴': '#42A5F5',
    '养血': '#EF5350',
    '清热': '#66BB6A',
    '祛湿': '#7E57C2',
    '固脱': '#FFD54F',
    '生津': '#4FC3F7',
    '滋补肝肾': '#26A69A',
    '明目': '#BA68C8',
    '补气升阳': '#FF7043',
    '固表止汗': '#9CCC65',
    '化痰': '#5C6BC0',
    '止咳': '#29B6F6',
    '润肺': '#26C6DA'
  };
  
  // 经络颜色映射
  const meridianColors = {
    '心经': '#EC407A',
    '肺经': '#9CCC65',
    '肝经': '#7CB342',
    '脾经': '#FFE082',
    '肾经': '#4DD0E1',
    '胆经': '#9CCC65',
    '膀胱经': '#4FC3F7',
    '三焦经': '#FF8A65'
  };
  
  // 添加功效节点
  funcEffects.forEach(effect => {
    nodes.push({ 
      name: effect,
      itemStyle: { color: effectColors[effect] || '#80CBC4' }
    })
  })
  
  // 添加归经节点
  herbMeridians.forEach(meridian => {
    nodes.push({ 
      name: meridian,
      itemStyle: { color: meridianColors[meridian] || '#90A4AE' }
    })
  })
  
  // 构建链接
  const links = []
  
  // 药材到功效
  funcEffects.forEach(effect => {
    links.push({
      source: herb.name,
      target: effect,
      value: Math.floor(Math.random() * 10) + 5
    })
  })
  
  // 功效到归经
  funcEffects.forEach(effect => {
    herbMeridians.forEach(meridian => {
      if (Math.random() > 0.4) { // 增加连接概率
        links.push({
          source: effect,
          target: meridian,
          value: Math.floor(Math.random() * 8) + 3
        })
      }
    })
  })
  
  const newOption = {
    series: [
      {
        data: nodes,
        links: links
      }
    ]
  }
  
  sankeyChart.setOption(newOption)
}

// 初始化地图
const initMapChart = () => {
  if (!mapChartRef.value) return
  
  mapChart = echarts.init(mapChartRef.value)
  
  const option = {
    backgroundColor: 'transparent',
    title: {
      text: '药食产地分布',
      left: 'center',
      textStyle: {
        color: '#3A2E39',
        fontFamily: '楷体',
        fontSize: 20,
        fontWeight: 'normal'
      },
      subtext: '悬停查看详情',
      subtextStyle: {
        color: '#795548',
        fontFamily: '宋体',
        fontSize: 14
      }
    },
    tooltip: {
      show: false // 禁用悬停气泡
    },
    visualMap: {
      min: 0,
      max: 100,
      left: 'center', // 修改为中间
      right: '20%', // 相对右侧稍微偏右
      bottom: 'middle', // 垂直居中
      text: ['主要产区', '次要产区'],
      inRange: {
        color: [
          'rgba(224, 247, 250, 1)',
          'rgba(178, 223, 219, 1)',
          'rgba(128, 203, 196, 1)',
          'rgba(77, 182, 172, 1)',
          'rgba(38, 166, 154, 1)'
        ]
      },
      calculable: true,
      textStyle: {
        color: '#3A2E39',
        fontFamily: '宋体'
      },
      orient: 'vertical',
      itemWidth: 15,
      itemHeight: 120,
      precision: 0
    },
    geo: {
      map: 'china',
      roam: true,
      zoom: 1.2,
      center: [104, 36],
      selectedMode: false,
      label: {
        show: false
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 12,
          fontFamily: '宋体',
          color: '#fff',
          textBorderColor: 'rgba(0, 0, 0, 0.3)',
          textBorderWidth: 2
        },
        itemStyle: {
          areaColor: '#81c784',
          shadowBlur: 20,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      itemStyle: {
        borderColor: 'rgba(255, 255, 255, 0.8)',
        borderWidth: 1,
        areaColor: 'rgba(224, 247, 250, 0.8)',
        shadowColor: 'rgba(0, 0, 0, 0.2)',
        shadowBlur: 10,
        shadowOffsetX: 2,
        shadowOffsetY: 2
      },
      scaleLimit: {
        min: 0.8,
        max: 3
      },
      zlevel: 1
    },
    series: [
      {
        name: '产地分布',
        type: 'map',
        map: 'china',
        geoIndex: 0,
        roam: true, // 允许缩放和平移
        data: [],
        // 视觉映射
        emphasis: {
          label: {
            show: true,
            fontSize: 13,
            fontFamily: '宋体'
          },
          itemStyle: {
            shadowColor: 'rgba(0, 0, 0, 0.5)',
            shadowBlur: 15
          }
        },
        zlevel: 2
      },
      // 添加散点图表示主要产地
      {
        name: '重点产区',
        type: 'scatter',
        coordinateSystem: 'geo',
        symbol: 'pin',
        symbolSize: [30, 30],
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            formatter: '{b}',
            position: 'right',
            color: '#fff',
            fontSize: 12,
            textBorderColor: 'rgba(0, 0, 0, 0.5)',
            textBorderWidth: 2
          }
        },
        itemStyle: {
          color: '#FF5722',
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.3)'
        },
        zlevel: 3,
        data: []
      },
      // 添加隐形的辅助线，用于提升3D效果
      {
        name: '边界线',
        type: 'lines',
        coordinateSystem: 'geo',
        zlevel: 1,
        effect: {
          show: true,
          period: 6,
          trailLength: 0.1,
          color: 'rgba(255, 255, 255, 0.2)',
          symbolSize: 3
        },
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)',
          width: 1,
          opacity: 0.1,
          curveness: 0.3
        },
        data: []
      }
    ],
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicInOut'
  }
  
  mapChart.setOption(option)
}

// 更新地图
const updateMapChart = (herb) => {
  if (!mapChart) return
  
  // 省份对应的坐标
  const provinceCoords = {
    '四川': [104.06, 30.67],
    '云南': [102.73, 25.04],
    '贵州': [106.71, 26.57],
    '甘肃': [104.62, 35.58],
    '陕西': [108.95, 34.27],
    '河北': [114.48, 38.03],
    '山东': [117.00, 36.65],
    '江苏': [118.78, 32.07],
    '浙江': [120.19, 30.26],
    '福建': [119.30, 26.08],
    '湖南': [112.98, 28.21],
    '湖北': [114.31, 30.59],
    '广东': [113.23, 23.16],
    '广西': [108.33, 22.84],
    '黑龙江': [126.63, 45.75],
    '辽宁': [123.38, 41.80],
    '吉林': [125.35, 43.88],
    '内蒙古': [111.65, 40.82],
    '新疆': [87.68, 43.77],
    '西藏': [91.11, 29.97]
  }
  
  // 解析产地数据
  const locations = herb.location ? herb.location.split('、').filter(Boolean) : []
  const data = []
  const scatterData = []
  const linesData = []
  
  // 找出该药材的分布省份
  const herbProvinces = []
  locations.forEach(location => {
    for (const province in provinceCoords) {
      if (location.includes(province) && !herbProvinces.includes(province)) {
        herbProvinces.push(province)
        // 标记为主要产区
      data.push({
        name: province,
          value: 80 // 用于标记颜色深浅，表示主要产区
      })
      
      // 添加散点
        scatterData.push({
          name: location,
          value: [...provinceCoords[province], 100]
        })
      }
    }
  })
  
  // 如果没有明确的产地信息，使用一些默认产区
  if (herbProvinces.length === 0) {
    console.log('未能解析产地信息:', herb.name, herb.location)
    // 不添加随机数据，保持地图为空
  }
  
  // 生成连线数据 - 相邻产区之间连线
  for (let i = 0; i < herbProvinces.length - 1; i++) {
    const source = herbProvinces[i];
    const target = herbProvinces[i + 1];
    
    if (provinceCoords[source] && provinceCoords[target]) {
      linesData.push({
        coords: [provinceCoords[source], provinceCoords[target]],
        value: 100 // 连线权重
      });
    }
  }
  
  const newOption = {
    title: {
      text: `${herb.name}产地分布`,
      subtext: herbProvinces.length > 0 ? '主产区: ' + herbProvinces.join('、') : '暂无产地数据',
      left: 'center',
      textStyle: {
        color: '#ffffff',
        fontSize: 22,
        fontFamily: '楷体',
        textShadow: '0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3)'
      },
      backgroundColor: '#674541',
      borderRadius: 8,
      padding: 15,
      subtextStyle: {
        color: '#f0f0f0',
        fontSize: 14
      }
    },
    series: [
      {
        name: '产地分布',
        type: 'map',
        map: 'china',
        geoIndex: 0,
        data: data,
        zlevel: 2
      },
      {
        name: '重点产区',
        type: 'scatter',
        coordinateSystem: 'geo',
        symbol: 'pin',
        symbolSize: [30, 30],
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            formatter: '{b}',
            position: 'right',
            color: '#fff',
            fontSize: 12,
            textBorderColor: 'rgba(0, 0, 0, 0.5)',
            textBorderWidth: 2
          }
        },
        itemStyle: {
          color: '#FF5722'
        },
        zlevel: 3,
        data: scatterData
      },
      {
        name: '边界线',
        type: 'lines',
        coordinateSystem: 'geo',
        zlevel: 1,
        effect: {
          show: true,
          period: 6,
          trailLength: 0.1,
          color: 'rgba(255, 255, 255, 0.2)',
          symbolSize: 3
        },
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)',
          width: 1,
          opacity: 0.1,
          curveness: 0.3
        },
        data: linesData
      }
    ]
  }
  
  mapChart.setOption(newOption)
}

// 初始化时间线图表
function initTimelineChart() {
  if (!timelineChartRef.value) return
  
  timelineChart = echarts.init(timelineChartRef.value)
  
  // 初始化为显示所有五行属性的历史数据
  initTimelineAllElements()
}

// 初始化展示所有五行属性的历史数据
function initTimelineAllElements() {
  if (!timelineChart) return
  
  // 时间线数据对象，用于存储各个时期的记载数量
  const timelineData = {
    '木': [0, 0, 0, 0, 0, 0, 0, 0],
    '火': [0, 0, 0, 0, 0, 0, 0, 0],
    '土': [0, 0, 0, 0, 0, 0, 0, 0],
    '金': [0, 0, 0, 0, 0, 0, 0, 0],
    '水': [0, 0, 0, 0, 0, 0, 0, 0]
  }
  
  // 定义历史时期
  const periods = ['先秦', '汉朝', '魏晋南北朝', '隋唐', '宋元', '明朝', '清朝',]
  
  // 定义朝代和时期映射
  const dynastyMapping = {
    '先秦': ['先秦', '夏', '商', '周', '春秋', '战国'],
    '汉朝': ['汉', '秦汉', '西汉', '东汉'],
    '魏晋南北朝': ['魏', '晋', '南北朝', '三国', '南朝', '北朝', '魏晋'],
    '隋唐': ['隋', '唐', '隋唐'],
    '宋元': ['宋', '元', '两宋', '北宋', '南宋', '金', '辽'],
    '明朝': ['明'],
    '清朝': ['清'],
  }
  
  // 统计各五行属性药材在各时期的记载数量
  const elementHerbs = {}
  
  for (const element of herbalStore.categories.map(c => c.name)) {
    // 筛选该五行属性的所有药材
    elementHerbs[element] = herbalStore.herbs.filter(herb => herb.category === element)
    
    // 对于每个五行属性的药材，统计其在各时期的记载数量
    elementHerbs[element].forEach(herb => {
      // 获取详细的药材数据，包含historical_records
      const detailedData = herbalStore.detailedHerbData.find(d => d.name === herb.name)
      
      // 如果有历史记载数据，则进行解析和统计
      if (detailedData && detailedData.historical_records) {
        // 将历史记载拆分为单独的记录
        const records = detailedData.historical_records.split(/\d+\./).filter(Boolean)
        
        // 遍历每条记录
        records.forEach(record => {
          // 尝试提取朝代信息
          const dynastyMatch = record.match(/（(.*?)）/)
          if (dynastyMatch && dynastyMatch[1]) {
            const dynasty = dynastyMatch[1].trim()
            
            // 判断记录属于哪个时期
            for (let i = 0; i < periods.length; i++) {
              const period = periods[i]
              if (dynastyMapping[period].some(d => dynasty.includes(d))) {
                // 找到对应的时期，对应的五行属性计数加一
                timelineData[element][i]++
                break
              }
            }
          }
        })
      }
    })
    
    // 如果该五行属性的药材在各时期的记载数量都为0，则随机生成一些数据用于展示
    if (timelineData[element].every(count => count === 0)) {
      timelineData[element] = periods.map(() => Math.floor(Math.random() * 10) + 1)
    }
    
    console.log(`${element}行属性药材各时期记载统计:`, timelineData[element])
  }
  
  // 准备系列数据
  const series = []
  
  // 为每个五行属性创建一个系列
  herbalStore.categories.forEach(category => {
    const categoryColor = category.color
    
    series.push({
      name: `${category.name}行`,
      type: 'line',
      smooth: true,
      data: timelineData[category.name],
      symbol: 'circle',
      symbolSize: 8,
      itemStyle: {
        color: categoryColor
      },
      lineStyle: {
        color: categoryColor,
        width: 2
      }
      // 移除 areaStyle 属性，这样就不会有区域填充了
    })
  })
  
  // 更新图表选项
  const option = {
    title: {
      text: '五行药食历史文献记载统计',
      subtext: '按朝代统计五行属性药食的文献记载数量',
      left: 'center',
      top: 10,
      textStyle: {
        color: '#3A2E39',
        fontSize: 18,
        fontFamily: '楷体'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        let result = params[0].name + '<br/>'
        params.forEach(param => {
          result += `${param.seriesName}: ${param.value}<br/>`
        })
        return result
      }
    },
    legend: {
      data: herbalStore.categories.map(c => `${c.name}行`),
      bottom: 0,
      textStyle: {
        color: '#3A2E39',
        fontFamily: '宋体'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: periods,
      axisLabel: {
        color: '#3A2E39',
        fontFamily: '宋体'
      }
    },
    yAxis: {
      type: 'value',
      name: '记载数量',
      minInterval: 1,
      axisLabel: {
        color: '#3A2E39',
        fontFamily: '宋体'
      }
    },
    series: series
  }
  
  timelineChart.setOption(option, true)
}

// 根据五行属性更新时间线
function updateTimelineByElement(element) {
  if (!timelineChart) return
  
  // 定义历史时期
  const periods = ['先秦', '汉朝', '魏晋南北朝', '隋唐', '宋元', '明朝', '清朝']
  
  // 定义朝代和时期映射
  const dynastyMapping = {
    '先秦': ['先秦', '夏', '商', '周', '春秋', '战国'],
    '汉朝': ['汉', '秦汉', '西汉', '东汉'],
    '魏晋南北朝': ['魏', '晋', '南北朝', '三国', '南朝', '北朝', '魏晋'],
    '隋唐': ['隋', '唐', '隋唐'],
    '宋元': ['宋', '元', '两宋', '北宋', '南宋', '金', '辽'],
    '明朝': ['明'],
    '清朝': ['清'],

  }
  
  // 筛选该五行属性的所有药材
  const elementHerbs = herbalStore.herbs.filter(herb => herb.category === element)
  console.log(`按${element}属性筛选出${elementHerbs.length}种药食`)
  
  // 初始化记载计数
  const timelineData = Array(periods.length).fill(0)
  
  // 统计药材在各时期的记载数量
  elementHerbs.forEach(herb => {
    // 获取详细的药材数据，包含historical_records
    const detailedData = herbalStore.detailedHerbData.find(d => d.name === herb.name)
    
    // 如果有历史记载数据，则进行解析和统计
    if (detailedData && detailedData.historical_records) {
      // 将历史记载拆分为单独的记录
      const records = detailedData.historical_records.split(/\d+\./).filter(Boolean)
      
      // 遍历每条记录
      records.forEach(record => {
        // 尝试提取朝代信息
        const dynastyMatch = record.match(/（(.*?)）/)
        if (dynastyMatch && dynastyMatch[1]) {
          const dynasty = dynastyMatch[1].trim()
          
          // 判断记录属于哪个时期
          for (let i = 0; i < periods.length; i++) {
            const period = periods[i]
            if (dynastyMapping[period].some(d => dynasty.includes(d))) {
              // 找到对应的时期，计数加一
              timelineData[i]++
              break
            }
          }
        }
      })
    }
  })
  
  console.log(`${element}行属性药材各时期记载统计:`, timelineData)
  
  // 如果各时期的记载数量都为0，则随机生成一些数据用于展示
  if (timelineData.every(count => count === 0)) {
    for (let i = 0; i < timelineData.length; i++) {
      timelineData[i] = Math.floor(Math.random() * 10) + 1
    }
    console.log(`使用随机数据:`, timelineData)
  }
  
  // 获取五行对应的颜色 - 确保这里获取的颜色正确
  const category = herbalStore.categories.find(c => c.name === element)
  const categoryColor = category ? category.color : '#8BC34A'
  
  console.log(`${element}行的颜色: ${categoryColor}`) // 添加日志来检查颜色
  
  // 更新图表选项
  const option = {
    title: {
      text: `${element}行药食历史文献记载统计`,
      subtext: `按朝代统计${element}行属性${elementHerbs.length}种药食的文献记载数量`,
      left: 'center',
      top: 10,
      textStyle: {
        color: '#3A2E39',
        fontSize: 18,
        fontFamily: '楷体'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        const data = params[0]
        return `${data.name}<br/>
                记载数量: ${data.value}`
      }
    },
    legend: {
      data: [`${element}行`],
      bottom: 0,
      textStyle: {
        color: '#3A2E39',
        fontFamily: '宋体'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: periods,
      axisLabel: {
        color: '#3A2E39',
        fontFamily: '宋体'
      }
    },
    yAxis: {
      type: 'value',
      name: '记载数量',
      minInterval: 1,
      axisLabel: {
        color: '#3A2E39',
        fontFamily: '宋体'
      }
    },
    series: [
      {
        name: `${element}行`,
        type: 'line',
        smooth: true,
        data: timelineData,
        itemStyle: {
          color: categoryColor
        },
        lineStyle: {
          color: categoryColor,
          width: 3
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: categoryColor.replace(')', ', 0.6)').replace('rgb', 'rgba')
            },
            {
              offset: 1,
              color: categoryColor.replace(')', ', 0.1)').replace('rgb', 'rgba')
            }
          ])
        }
      }
    ]
  }
  
  // 确保完全重置图表选项，而不是合并
  timelineChart.setOption(option, true)
}

// 更新时间线图表数据
function updateTimelineChart(herb) {
  if (!timelineChart) return
  
  // 定义朝代和时期映射
  const dynastyMapping = {
    '先秦': ['先秦', '夏', '商', '周', '春秋', '战国'],
    '汉朝': ['汉', '秦汉', '西汉', '东汉'],
    '魏晋南北朝': ['魏', '晋', '南北朝', '三国', '南朝', '北朝', '魏晋'],
    '隋唐': ['隋', '唐', '隋唐'],
    '宋元': ['宋', '元', '两宋', '北宋', '南宋', '金', '辽'],
    '明朝': ['明'],
    '清朝': ['清'],

  }
  
  // 初始化各时期的记载计数
  const timelineData = [
    { period: '先秦', count: 0 },
    { period: '汉朝', count: 0 },
    { period: '魏晋南北朝', count: 0 },
    { period: '隋唐', count: 0 },
    { period: '宋元', count: 0 },
    { period: '明朝', count: 0 },
    { period: '清朝', count: 0 },

  ]
  
  // 获取详细的药材数据，包含historical_records
  const detailedData = herbalStore.detailedHerbData.find(
    d => d.name === herb.name
  )
  
  // 如果有历史记载数据，则进行解析和统计
  if (detailedData && detailedData.historical_records) {
    console.log(`解析${herb.name}的历史记载数据:`, detailedData.historical_records)
    
    // 将历史记载拆分为单独的记录
    const records = detailedData.historical_records.split(/\d+\./).filter(Boolean)
    
    // 遍历每条记录
    records.forEach(record => {
      // 尝试提取朝代信息
      const dynastyMatch = record.match(/（(.*?)）/)
      if (dynastyMatch && dynastyMatch[1]) {
        const dynasty = dynastyMatch[1].trim()
        
        // 判断记录属于哪个时期
        for (const [period, dynasties] of Object.entries(dynastyMapping)) {
          if (dynasties.some(d => dynasty.includes(d))) {
            // 找到对应的时期，计数加一
            const timelineItem = timelineData.find(item => item.period === period)
            if (timelineItem) {
              timelineItem.count++
            }
            break
          }
        }
      }
    })
    
    console.log(`${herb.name}各时期记载统计:`, timelineData)
  } else {
    console.log(`${herb.name}没有历史记载数据`)
    // 如果没有历史记载数据，使用随机数据，但数值较小
    timelineData.forEach(item => {
      item.count = Math.floor(Math.random() * 3)
    })
  }
  
  // 获取五行对应的颜色 - 确保这里获取的颜色正确
  const category = herbalStore.categories.find(c => c.name === herb.category)
  const categoryColor = category ? category.color : '#8BC34A'
  
  console.log(`${herb.name} (${herb.category}行) 的颜色: ${categoryColor}`) // 添加日志来检查颜色
  
  // 更新图表选项
  const newOption = {
    title: {
      text: `${herb.name}历史文献记载`,
      subtext: '按朝代统计文献记载数量',
      left: 'center',
      top: 10,
      textStyle: {
        color: '#3A2E39',
        fontSize: 18,
        fontFamily: '楷体'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        const data = params[0]
        return `${data.name}<br/>
                记载数量: ${data.value}`
      }
    },
    legend: {
      data: [herb.name],
      bottom: 0,
      textStyle: {
        color: '#3A2E39',
        fontFamily: '宋体'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: timelineData.map(item => item.period),
      axisLabel: {
        color: '#3A2E39',
        fontFamily: '宋体'
      }
    },
    yAxis: {
      type: 'value',
      name: '记载数量',
      minInterval: 1 // 确保坐标轴以整数显示
    },
    series: [{
      name: herb.name,
      type: 'line',
      smooth: true,
      data: timelineData.map(item => item.count),
      itemStyle: {
        color: categoryColor
      },
      lineStyle: {
        color: categoryColor,
        width: 3
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: categoryColor.replace(')', ', 0.6)').replace('rgb', 'rgba')
          },
          {
            offset: 1,
            color: categoryColor.replace(')', ', 0.1)').replace('rgb', 'rgba')
          }
        ])
      }
    }]
  }
  
  // 确保完全重置图表选项，而不是合并
  timelineChart.setOption(newOption, true)
}

// 初始化词云图
const initWordCloudChart = () => {
  if (!wordCloudChartRef.value) return
  
  wordCloudChart = echarts.init(wordCloudChartRef.value)
  
  // 直接调用 resetWordCloud 显示总体词云
  resetWordCloud()
}

// 在打开详情时获取详细数据
const handleShowDetail = (herb) => {
  selectedHerb.value = herb
  store.getHerbDetail(herb.name)
  showHerbDetail.value = true
  
  // 添加调试日志
  console.log('Selected herb:', herb)
  console.log('Detailed data:', store.selectedHerbDetail)
}

// 添加监听器以检查数据变化
watch(() => store.selectedHerbDetail, (newVal) => {
  console.log('Selected herb detail changed:', newVal)
}, { immediate: true })

// 修改初始化顺序
onMounted(async () => {
  // 先加载所有必要数据
  await store.fetchDetailedHerbData()
  await herbalStore.fetchHerbs()
  
  // 数据加载完成后再初始化图表
  initMapChart()
  initWordCloudChart()
  initTimelineChart()
  initComponentBubbleChart()
  
  // 设置初始分类
  if (route.query.element) {
    activeCategory.value = route.query.element
    herbalStore.setSelectedCategory(route.query.element)
    updateMapByElement(route.query.element)
    updateTimelineByElement(route.query.element)
  }
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', () => {
    radarChart?.resize()
    sankeyChart?.resize()
    mapChart?.resize()
    wordCloudChart?.resize()
    timelineChart?.resize()
    componentBubbleChart?.resize()
  })
})

// 组件卸载时销毁图表
onUnmounted(() => {
  radarChart && radarChart.dispose()
  sankeyChart && sankeyChart.dispose()
  mapChart && mapChart.dispose()
  wordCloudChart && wordCloudChart.dispose()
  timelineChart && timelineChart.dispose()
  
  window.removeEventListener('resize', () => {
    radarChart && radarChart.resize()
    sankeyChart && sankeyChart.resize()
    mapChart && mapChart.resize()
    wordCloudChart && wordCloudChart.resize()
    timelineChart && timelineChart.resize()
  })
  
  componentBubbleChart && componentBubbleChart.dispose()
})

// 根据分类和搜索筛选药材
const filteredHerbs = computed(() => {
  let result = herbalStore.herbs
  
  if (activeCategory.value) {
    result = result.filter(herb => herb.category === activeCategory.value)
  }
  
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(herb => 
      herb.name.toLowerCase().includes(query) || 
      herb.effects.some(effect => effect.toLowerCase().includes(query))
    )
  }
  
  return result
})

// 修改选择分类的方法
const selectCategory = (category) => {
  console.log('选择分类:', category)
  
  activeCategory.value = category
  herbalStore.setSelectedCategory(category)
  
  if (category) {
    // 验证分类是否有效
    const categoryConfig = herbalStore.categories.find(c => c.name === category)
    if (!categoryConfig) {
      console.error('无效的分类:', category)
      return
    }
    
    console.log('分类配置:', categoryConfig)
    
    updateMapByElement(category)
    updateTimelineByElement(category)
  } else {
    resetMap()
    resetWordCloud()
    initTimelineAllElements()
  }
}

// 清除筛选
const clearFilters = () => {
  activeCategory.value = null
  searchQuery.value = ''
  herbalStore.setSelectedCategory(null)
  resetMap() // 重置地图
}

// 重置地图为初始状态
const resetMap = () => {
  if (!mapChart) return
  
  const option = {
    title: {
      text: '药食产地分布',
      subtext: '悬停查看详情'
    },
    series: [
      {
        name: '产地分布',
        data: [],
        zlevel: 2
      },
      {
        name: '重点产区',
        data: [],
        zlevel: 3
      },
      {
        name: '边界线',
        data: [],
        zlevel: 1
      }
    ]
  }
  
  mapChart.setOption(option)
}

// 根据五行属性更新地图
const updateMapByElement = (element) => {
  if (!mapChart) return
  
  console.log('Updating map for element:', element)
  
  // 筛选该五行属性的所有药材
  const elementHerbs = herbalStore.herbs.filter(herb => herb.category === element)
  console.log('Element herbs:', elementHerbs)
  
  if (elementHerbs.length === 0) {
    console.warn('No herbs found for element:', element)
    return
  }
  
  // 收集所有产地信息
  let allLocations = []
  elementHerbs.forEach(herb => {
    if (herb.location) {
      const locations = herb.location.split('、').filter(Boolean)
      allLocations = [...allLocations, ...locations]
    }
  })
  
  console.log('All locations:', allLocations)
  
  // 统计各产地出现频率
  const locationCount = {}
  allLocations.forEach(location => {
    locationCount[location] = (locationCount[location] || 0) + 1
  })
  
  console.log('Location count:', locationCount)
  
  // 省份对应的坐标
  const provinceCoords = {
    '四川': [104.06, 30.67],
    '云南': [102.73, 25.04],
    '贵州': [106.71, 26.57],
    '甘肃': [104.62, 35.58],
    '陕西': [108.95, 34.27],
    '河北': [114.48, 38.03],
    '山东': [117.00, 36.65],
    '江苏': [118.78, 32.07],
    '浙江': [120.19, 30.26],
    '福建': [119.30, 26.08],
    '湖南': [112.98, 28.21],
    '湖北': [114.31, 30.59],
    '广东': [113.23, 23.16],
    '广西': [108.33, 22.84],
    '黑龙江': [126.63, 45.75],
    '辽宁': [123.38, 41.80],
    '吉林': [125.35, 43.88],
    '内蒙古': [111.65, 40.82],
    '新疆': [87.68, 43.77],
    '西藏': [91.11, 29.97]
  }
  
  // 将产地转换为省份数据
  const provinceData = {}
  Object.keys(locationCount).forEach(location => {
    for (const province in provinceCoords) {
      if (location.includes(province)) {
        provinceData[province] = (provinceData[province] || 0) + locationCount[location]
        break
      }
    }
  })
  
  console.log('Province data:', provinceData)
  
  // 找出药材数量最多的省份，用于设置值范围
  const maxCount = Math.max(...Object.values(provinceData))
  
  // 准备地图数据
  const data = []
  const scatterData = []
  Object.keys(provinceData).forEach(province => {
    // 地图区域数据
    data.push({
      name: province,
      value: Math.round((provinceData[province] / maxCount) * 100) // 归一化到0-100
    })
    
    // 添加散点
    if (provinceCoords[province]) {
      scatterData.push({
        name: `${province}（${provinceData[province]}种）`,
        value: [
          ...provinceCoords[province], 
          Math.round((provinceData[province] / maxCount) * 100)
        ]
      })
    }
  })
  
  console.log('Map data:', data)
  console.log('Scatter data:', scatterData)
  
  // 准备连线数据 - 连接药材数量前5的省份
  const topProvinces = Object.keys(provinceData)
    .sort((a, b) => provinceData[b] - provinceData[a])
    .slice(0, 5)
  
  const linesData = []
  for (let i = 0; i < topProvinces.length - 1; i++) {
    const source = topProvinces[i]
    const target = topProvinces[i + 1]
    
    if (provinceCoords[source] && provinceCoords[target]) {
      linesData.push({
        coords: [provinceCoords[source], provinceCoords[target]],
        value: 100
      })
    }
  }
  
  // 获取五行对应的颜色
  const color = herbalStore.categories.find(c => c.name === element)?.color || '#8BC34A'
  
  // 更新地图选项
  const newOption = {
    title: {
      text: `${element}行药食产地分布`,
      subtext: `共${elementHerbs.length}种药食，分布在${Object.keys(provinceData).length}个省份`
    },
    visualMap: {
      inRange: {
        color: [
          'rgba(224, 247, 250, 1)',
          color.replace(')', ', 0.4)').replace('rgb', 'rgba'),
          color.replace(')', ', 0.8)').replace('rgb', 'rgba')
        ]
      },
      text: ['高频出现', '低频出现'],
      right: '10%',
      bottom: '20%'
    },
    series: [
      {
        name: '产地分布',
        type: 'map',
        map: 'china',
        geoIndex: 0,
        data: data,
        zlevel: 2
      },
      {
        name: '重点产区',
        type: 'scatter',
        coordinateSystem: 'geo',
        symbol: 'pin',
        symbolSize: [30, 30],
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            formatter: '{b}',
            position: 'right',
            color: '#fff',
            fontSize: 12,
            textBorderColor: 'rgba(0, 0, 0, 0.5)',
            textBorderWidth: 2
          }
        },
        itemStyle: {
          color: color
        },
        zlevel: 3,
        data: scatterData
      },
      {
        name: '关联线',
        type: 'lines',
        coordinateSystem: 'geo',
        zlevel: 1,
        effect: {
          show: true,
          period: 6,
          trailLength: 0.1,
          color: color.replace(')', ', 0.3)').replace('rgb', 'rgba'),
          symbolSize: 3
        },
        lineStyle: {
          color: color.replace(')', ', 0.3)').replace('rgb', 'rgba'),
          width: 1,
          opacity: 0.3,
          curveness: 0.3
        },
        data: linesData
      }
    ]
  }
  
  mapChart.setOption(newOption)
  
  // 更新功效词云图
  updateWordCloudByElement(element)
}
</script>

<template>
  <div class="database-container">
    <!-- 古籍背景与科技感交互线条 -->
    <div class="ancient-paper-bg"></div>
    <div class="tech-lines"></div>
    
    <div class="database-content">
      <div class="main-content">
        <!-- 左侧分类筛选和可视化区域 -->
        <div class="left-section">
          <!-- 五行分类筛选 -->
          <div class="category-section glassmorphism">
            <h2>五行分类</h2>
            <div class="category-buttons">
              <el-button 
                v-for="category in herbalStore.categories" 
                :key="category.name"
                :class="['category-btn', { active: activeCategory === category.name }]"
                :style="{ '--category-color': category.color }"
                @click="selectCategory(category.name)"
              >
                {{ category.name }}
              </el-button>
              
              <el-button 
                class="clear-btn"
                @click="clearFilters"
              >
                清除筛选
              </el-button>
            </div>
            
            <!-- 搜索框 -->
            <div class="search-box">
              <el-input
                v-model="searchQuery"
                placeholder="搜索药食名称或功效"
                clearable
              >
                <template #prefix>
                  <el-icon class="el-input__icon"><el-icon-search /></el-icon>
                </template>
              </el-input>
            </div>
          </div>
          
          <!-- 词云图 -->
          <div class="data-charts glassmorphism">
            <div class="word-cloud-chart">
              <div ref="wordCloudChartRef" class="chart"></div>
            </div>
          </div>
        </div>
        
        <!-- 中间药食产地地图可视化 -->
        <div class="center-section">
          <div class="map-container glassmorphism">
            <div ref="mapChartRef" class="china-map"></div>
            <div class="map-overlay glassmorphism" v-if="!selectedHerb && !activeCategory">
              <div class="map-hint">
                <el-icon><el-icon-location /></el-icon>
                选择一种药食查看产地分布
              </div>
            </div>
            <div class="map-controls" v-if="selectedHerb">
              <el-button-group class="glassmorphism">
                <el-button size="small" circle><el-icon><el-icon-zoom-in /></el-icon></el-button>
                <el-button size="small" circle><el-icon><el-icon-zoom-out /></el-icon></el-button>
                <el-button size="small" circle><el-icon><el-icon-refresh-right /></el-icon></el-button>
              </el-button-group>
            </div>
          </div>
        </div>
        
        <!-- 右侧药食列表 -->
        <div class="right-section">
          <div class="herbs-section glassmorphism">
            <h2>药食列表</h2>
            <div v-if="herbalStore.loading" class="loading">
              <el-skeleton :rows="10" animated />
            </div>
            
            <div v-else-if="filteredHerbs.length === 0" class="no-data">
              <div class="no-data-icon">
                <el-icon><el-icon-document /></el-icon>
              </div>
              <p>未找到符合条件的药食</p>
            </div>
            
            <div v-else class="herbs-grid">
              <el-card 
                v-for="herb in filteredHerbs" 
                :key="herb.id"
                class="herb-card"
                :body-style="{ padding: '0' }"
                :class="{ 'herb-card-active': selectedHerb?.id === herb.id }"
                @click="selectHerb(herb)"
              >
                <div class="herb-card-content">
                  <div 
                    class="herb-category-indicator"
                    :style="{ 
                      backgroundColor: herbalStore.categories.find(c => c.name === herb.category)?.color 
                    }"
                  ></div>
                  <div class="herb-info">
                    <h3>{{ herb.name }}</h3>
                    <div class="herb-category">
                      <span>{{ herb.category }}属性</span>
                    </div>
                    <div class="herb-effects">
                      <el-tag 
                        v-for="effect in herb.effects" 
                        :key="effect"
                        size="small"
                        class="effect-tag"
                      >
                        {{ effect }}
                      </el-tag>
                    </div>
                    <div class="herb-actions">
                      <el-button type="text" size="small">
                        查看详情
                      </el-button>
                    </div>
                  </div>
                </div>
              </el-card>
            </div>
          </div>
        </div>
      </div>

      <!-- 添加时间线折线图区域 -->
      <div class="timeline-section glassmorphism">
        <div class="timeline-chart">
          <div ref="timelineChartRef" class="chart"></div>
        </div>
      </div>
    </div>
    
    <!-- 药材详情弹窗 -->
    <el-dialog
      v-model="showHerbDetail"
      :title="selectedHerb?.name"
      width="80%"
      destroy-on-close
    >
      <div v-if="store.selectedHerbDetail">
        <!-- 添加调试信息 -->
        <pre v-if="false">{{ JSON.stringify(store.selectedHerbDetail, null, 2) }}</pre>
        
        <div class="herb-detail-header">
          <div 
            class="herb-category-tag"
            :style="{
              backgroundColor: herbalStore.categories.find(c => c.name === selectedHerb?.category)?.color 
            }"
          >
            {{ selectedHerb?.category }}
          </div>
          <h2>{{ selectedHerb?.name }}</h2>
        </div>
        
        <el-tabs type="border-card" class="herb-detail-tabs">
          <el-tab-pane label="基本信息">
            <div class="detail-grid">
              <!-- 五行属性 -->
              <div class="detail-item">
                <div class="detail-label">五行属性</div>
                <div class="detail-value">{{ selectedHerb?.category }}</div>
              </div>
              
              <!-- 功效作用 -->
              <div class="detail-item">
                <div class="detail-label">功效作用</div>
                <div class="detail-value">
                  <el-tag 
                    v-for="effect in (store.selectedHerbDetail?.effects || '').split('、')" 
                    :key="effect"
                    class="effect-detail-tag"
                  >
                    {{ effect }}
                  </el-tag>
                </div>
              </div>

              <!-- 成分信息 -->
              <div class="detail-item span-full">
                <div class="detail-label">成分信息</div>
                <div class="detail-value">{{ store.selectedHerbDetail?.components }}</div>
              </div>
              
              <!-- 安全性 -->
              <div class="detail-item span-full">
                <div class="detail-label">安全性</div>
                <div class="detail-value">{{ store.selectedHerbDetail?.safety }}</div>
              </div>
              
              <!-- 应用 -->
              <div class="detail-item span-full">
                <div class="detail-label">应用</div>
                <div class="detail-value">{{ store.selectedHerbDetail?.applications }}</div>
              </div>
              
              <!-- 禁忌 -->
              <div class="detail-item span-full">
                <div class="detail-label">禁忌</div>
                <div class="detail-value">{{ store.selectedHerbDetail?.contraindications }}</div>
              </div>
            </div>
          </el-tab-pane>
          
          <!-- 来源考证 -->
          <el-tab-pane label="来源考证">
            <div class="detail-item span-full">
              <div class="detail-value">{{ store.selectedHerbDetail?.origin }}</div>
            </div>
          </el-tab-pane>

          <!-- 典籍记载 -->
          <el-tab-pane label="典籍记载">
            <div class="ancient-records">
              <div class="ancient-book">
                <div class="book-content" v-if="store.selectedHerbDetail?.historical_records">
                  <p v-for="(record, index) in store.selectedHerbDetail.historical_records.split('\n')" 
                     :key="index">{{ record }}</p>
                </div>
                <div class="book-content" v-else>暂无历史记载</div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      <div v-else>
        <el-empty description="暂无详细数据"></el-empty>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
/* 主容器样式 */
.database-container {
  position: relative;
  padding: 10px 20px;
  min-height: 100vh;
  color: #32292F;
  overflow: hidden;
}

/* 古籍背景与科技感交互线条 */
.ancient-paper-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(to right, rgba(253, 245, 230, 0.5), rgba(255, 250, 240, 0.5)),
    linear-gradient(135deg, rgba(255,255,255,0.05) 25%, transparent 25%,
    transparent 50%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.05) 75%,
    transparent 75%, transparent);
  background-size: cover, 60px 60px;
  opacity: 0.12;
  z-index: -1;
}

/* 科技感交互线条 */
.tech-lines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 30% 20%, rgba(120, 204, 190, 0.05) 0%, transparent 15%),
    radial-gradient(circle at 70% 60%, rgba(171, 145, 68, 0.05) 0%, transparent 15%),
    radial-gradient(circle at 90% 30%, rgba(67, 124, 177, 0.05) 0%, transparent 15%);
  opacity: 0.6;
  z-index: -1;
}

/* 页面标题区域 */
.page-header {
  text-align: center;
  margin-bottom: 25px;
  padding-bottom: 20px;
  position: relative;
}

.page-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #8d6e63, transparent);
}

.page-header h1 {
  font-size: 38px;
  color: #3A2E39;
  margin-bottom: 12px;
  font-family: '楷体', serif;
  letter-spacing: 2px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: relative;
  display: inline-block;
}

.page-header h1::before,
.page-header h1::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40px;
  height: 2px;
  background: #8d6e63;
}

.page-header h1::before {
  left: -60px;
}

.page-header h1::after {
  right: -60px;
}

.subtitle {
  color: #795548;
  font-size: 16px;
  font-family: '宋体', serif;
  letter-spacing: 1px;
}

/* 内容区域布局 */
.database-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: calc(100vh - 20px);
}

.main-content {
  display: flex;
  gap: 10px;
  height: 70%;
}

/* 添加折线图区域 */
.timeline-section {
  height: calc(30vh - 10px);
  margin-top: 10px;
  margin-bottom: 0;
}

.timeline-chart {
  height: calc(100% - 30px);
  width: 100%;
  padding: 15px;
}

.timeline-section h2 {
  font-size: 18px;
  margin-bottom: 5px;
  padding-bottom: 5px;
}

/* 折线图玻璃拟态效果 */
.glassmorphism {
  background-color: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.05),
    0 0 0 1px rgba(255, 255, 255, 0.3),
    inset 0 0 0 1px rgba(255, 255, 255, 0.3);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  overflow: hidden;
}

.glassmorphism:hover {
  box-shadow: 
    0 8px 30px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.4),
    inset 0 0 0 1px rgba(255, 255, 255, 0.4);
}

/* 微光边框效果 */
.glassmorphism::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 10px;
  padding: 1px;
  background: linear-gradient(
    to right, 
    rgba(171, 145, 68, 0.5), 
    rgba(120, 204, 190, 0.5),
    rgba(67, 124, 177, 0.5)
  );
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  -webkit-mask-composite: xor;
  opacity: 0.3;
  transition: opacity 0.3s ease;
}

.glassmorphism:hover::before {
  opacity: 0.8;
}

/* 左侧分类筛选区域 */
.left-section {
  flex: 0 0 400px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  max-height: 100%;
}

.category-section, .data-charts {
  padding: 15px;
}

.category-section {
  flex: 0 0 auto;
  max-height: 150px; /* 减少五行分类区域的高度 */
}

.data-charts {
  flex: 1; /* 让词云图占据剩余空间 */
  display: flex;
  flex-direction: column;
}

.category-section h2, .data-charts h2 {
  font-size: 18px;
  margin-bottom: 10px;
  padding-bottom: 8px;
}

.category-buttons {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  margin-bottom: 12px;
}

.category-btn {
  position: relative;
  border: 1px solid transparent;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  background-color: var(--category-color);
  color: #3A2E39;
  font-weight: bold;
  font-family: '宋体', serif;
  border-radius: 20px;
  overflow: hidden;
  padding: 4px 12px;
  min-width: auto;
  flex: 0 1 auto;
  font-size: 14px;
}

.category-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, transparent 80%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.category-btn:hover::before, .category-btn.active::before {
  opacity: 0.4;
}

.category-btn:hover, .category-btn.active {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: rgba(93, 64, 55, 0.3);
}

.clear-btn {
  margin-top: 0;
  padding: 4px 12px;
  font-size: 14px;
}

.search-box {
  margin-bottom: 12px;
}

.chart-container {
  height: 280px;
  width: 100%;
  position: relative;
}

.chart-container::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 20px;
  background: linear-gradient(to top, rgba(255,255,255,0.1), transparent);
  pointer-events: none;
}

.chart {
  width: 100%;
  height: 100%;
}

.chart-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.7);
  pointer-events: none;
}

.chart-hint {
  display: flex;
  align-items: center;
  font-size: 16px;
  color: #795548;
  padding: 12px 20px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 50px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  font-family: '宋体', serif;
}

.chart-hint .el-icon {
  margin-right: 8px;
  font-size: 20px;
  color: #8d6e63;
}

/* 中间地图区域 */
.center-section {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.map-container {
  flex: 1;
  overflow: hidden;
  position: relative;
  background: url('/border/细的花.png') no-repeat center center;
  background-size: 100% 100%;
  padding: 20px;
}

.map-container::before {
  content: '';
  position: absolute;
  top: 30px;
  right: 30px;
  bottom: 30px;
  left: 30px;
  border: 1px dashed rgba(93, 64, 55, 0.2);
  border-radius: 5px;
  pointer-events: none;
  z-index: 1;
}

.china-map {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 2;
  padding: 20px;
}

.map-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(5px);
  pointer-events: none;
  z-index: 3;
  border-radius: 8px;
}

.map-hint {
  display: flex;
  align-items: center;
  font-size: 18px;
  color: #795548;
  padding: 15px 25px;
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  border-radius: 50px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05),
    0 0 0 1px rgba(255, 255, 255, 0.3),
    inset 0 0 0 1px rgba(255, 255, 255, 0.3);
  font-family: '宋体', serif;
}

.map-hint .el-icon {
  margin-right: 10px;
  font-size: 24px;
  color: #8d6e63;
}

.map-controls {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 3;
}

/* 为地图控件按钮组添加毛玻璃效果 */
.map-controls .el-button-group {
  padding: 5px;
  border-radius: 8px;
}

.map-controls .el-button {
  border: none;
  backdrop-filter: blur(5px);
  background-color: rgba(255, 255, 255, 0.6);
  color: #3A2E39;
  margin: 0 3px;
  transition: all 0.3s ease;
}

.map-controls .el-button:hover {
  background-color: rgba(255, 255, 255, 0.8);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* 右侧药食列表区域 */
.right-section {
  flex: 0 0 400px;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 100%;
}

.herbs-section {
  height: 100%;
  padding: 25px;
  display: flex;
  flex-direction: column;
}

.herbs-section h2 {
  font-size: 18px;
  color: #ffffff;
  margin: -10px -10px 15px -10px;
  padding: 15px;
  font-family: '楷体', serif;
  position: relative;
  letter-spacing: 1px;
  text-align: center;
  background-color: #674541;
  border-radius: 8px 8px 0 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3);
  overflow: hidden;
}

.herbs-section h2::before {
  content: '';
  position: absolute;
  top: -10%;
  left: -100%;
  width: 50%;
  height: 120%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: skewX(-25deg);
  animation: shine 3s infinite;
}

@keyframes shine {
  0% { left: -100%; }
  20% { left: 100%; }
  100% { left: 100%; }
}

.loading, .no-data {
  padding: 40px 20px;
  text-align: center;
  color: #795548;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.no-data-icon {
  font-size: 50px;
  margin-bottom: 15px;
  color: #d7ccc8;
}

.no-data p {
  font-size: 16px;
  opacity: 0.8;
}

/* 药食列表滚动样式 */
.herbs-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 10px;
  overflow-y: auto;
  padding: 15px 15px 15px 15px;
  flex: 1;
  max-height: calc(100vh - 250px);
  position: relative;

  background-size: 100% 100%;
  border-radius: 0 0 8px 8px;
  margin: -5px 0 0 0;
}

/* 药材卡片样式 */
.herb-card {
  height: 80px;
  min-width: 280px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;
  border: none;
  overflow: hidden;
  position: relative;
  margin-bottom: 2px;
  background-color: #f8f4e9;
  backdrop-filter: blur(3px);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.herb-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(148, 62, 54, 0.1);
  border-left: 3px solid rgba(148, 62, 54, 0.8);
}

.herb-card-active {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(148, 62, 54, 0.15);
  border-left: 3px solid rgba(148, 62, 54, 1);
  background-color: #f5f0e5;
}

/* 药材信息区域样式 */
.herb-info {
  padding: 10px;
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* 药材功效标签区域样式 */
.herb-effects {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
  overflow-y: auto;
  max-height: 60px; /* 从80px减小到60px */
  padding-right: 4px;
}

/* 功效标签样式 */
.effect-tag {
  background-color: rgba(148, 62, 54, 0.08);
  color: #943e36;
  border: 1px solid rgba(148, 62, 54, 0.15);
  border-radius: 12px;
  transition: all 0.3s ease;
  font-family: '宋体', serif;
  font-size: 12px;
  white-space: nowrap;
  display: inline-block;
  margin-bottom: 4px;
  padding: 2px 8px; /* 减小内边距 */
  line-height: 1.2; /* 减小行高 */
  height: auto; /* 自动调整高度 */
}

.effect-tag:hover {
  background-color: rgba(148, 62, 54, 0.15);
  transform: translateY(-1px);
}

.herb-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.herb-card:hover::before {
  opacity: 1;
}

.herb-card-active {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(93, 64, 55, 0.2);
}

.herb-card-content {
  display: flex;
  height: 100%;
}

.herb-category-indicator {
  width: 8px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.herb-category-indicator::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(255,255,255,0.5), transparent);
  opacity: 0.6;
}

.herb-info h3 {
  font-size: 18px;
  margin-top: -2px; /* 添加负边距使标题上移 */
  margin-bottom: 2px; /* 从6px减小到2px */
  font-family: '楷体', serif;
  letter-spacing: 1px;
  color: #943e36;
}

.herb-category {
  margin-bottom: 6px; /* 从10px减小到6px */
  font-size: 14px;
  color: #8d6e63;
  font-family: '宋体', serif;
}

.herb-actions {
  margin-top: auto;
  text-align: right;
}

.herb-actions .el-button {
  font-family: '宋体', serif;
  color: #943e36;
}

.herb-actions .el-button:hover {
  color: #7a2e27;
  text-decoration: underline;
}

/* 药材详情对话框样式 */
:deep(.herb-detail-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.herb-detail-dialog .el-dialog__header) {
  background-color: #f5f5f5;
  padding: 15px 20px;
  margin: 0;
  border-bottom: 1px solid rgba(93, 64, 55, 0.1);
}

:deep(.herb-detail-dialog .el-dialog__title) {
  font-family: '楷体', serif;
  color: #3A2E39;
  font-size: 20px;
  font-weight: normal;
}

:deep(.herb-detail-dialog .el-dialog__body) {
  padding: 0;
}

.herb-detail-container {
  position: relative;
}

.herb-detail-header {
  padding: 25px 20px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(93, 64, 55, 0.1);
}

.herb-category-badge {
  padding: 5px 15px;
  border-radius: 30px;
  color: #fff;
  font-weight: bold;
  font-size: 16px;
  margin-right: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
  min-width: 60px;
}

.herb-detail-header h2 {
  margin: 0;
  font-size: 28px;
  color: #3A2E39;
  font-family: '楷体', serif;
}

:deep(.herb-detail-tabs) {
  border: none;
  border-radius: 0;
}

:deep(.herb-detail-tabs .el-tabs__header) {
  margin: 0;
  background-color: #f9f9f9;
}

:deep(.herb-detail-tabs .el-tabs__nav) {
  border-radius: 0;
}

:deep(.herb-detail-tabs .el-tabs__item) {
  font-family: '宋体', serif;
  font-size: 16px;
  height: 50px;
  line-height: 50px;
}

.detail-grid {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.detail-item {
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}

.detail-label {
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #666;
}

.detail-value {
  line-height: 1.6;
  color: #333;
}

.ancient-records {
  padding: 1rem;
}

.book-content {
  line-height: 1.8;
  text-indent: 2em;
  margin-bottom: 1rem;
}

.effect-detail-tag {
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
}

.detail-charts {
  display: flex;
  padding: 20px;
  gap: 20px;
  height: 350px;
}

.detail-radar-chart,
.detail-bar-chart {
  flex: 1;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.03);
}

.ancient-records {
  padding: 20px;
}

.ancient-book {
  margin-bottom: 30px;
  background-image: linear-gradient(to right, rgba(253, 245, 230, 0.8), rgba(255, 250, 240, 0.8));
  background-size: cover;
  background-blend-mode: overlay;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
}

.book-title {
  font-family: '楷体', serif;
  font-size: 20px;
  color: #5d4037;
  border-bottom: 1px solid rgba(93, 64, 55, 0.2);
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.book-content {
  font-family: '楷体', serif;
  font-size: 16px;
  line-height: 1.8;
  color: #3A2E39;
  text-indent: 2em;
}

/* 词云图样式 */
.word-cloud-chart {
  width: 100%;
  height: 100%;
  min-height: 450px; /* 增加词云图的最小高度 */
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  padding: 15px;
}

.word-cloud-chart .chart {
  width: 100%;
  height: 100%;
  position: relative;
}

/* 响应式调整 */
@media (max-width: 1280px) {
  .database-content {
    flex-direction: column;
    height: auto;
  }
  
  .left-section {
    flex: 0 0 auto;
    width: 100%;
  }
  
  .center-section {
    height: 500px;
  }
  
  .right-section {
    flex: 0 0 auto;
    width: 100%;
  }
  
  .chart-container {
    height: 230px;
  }
  
  .detail-charts {
    flex-direction: column;
    height: auto;
  }
  
  .detail-radar-chart,
  .detail-bar-chart {
    height: 250px;
  }
}

/* 滚动条样式 */
.herb-effects::-webkit-scrollbar {
  width: 4px;
  height: 4px;
  background-color: transparent;
}

.herb-effects::-webkit-scrollbar-thumb {
  background-color: rgba(93, 64, 55, 0.15);
  border-radius: 2px;
}

.component-analysis {
  display: flex;
  padding: 20px;
  gap: 20px;
  height: 500px;
}

.chart-container {
  flex: 2;
  height: 100%;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.bubble-chart {
  width: 100%;
  height: 100%;
}

.component-legend {
  flex: 1;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  overflow-y: auto;
}

.component-legend h3 {
  margin-bottom: 16px;
  color: #333;
  font-size: 16px;
}

.component-text {
  font-size: 14px;
  line-height: 1.6;
  color: #666;
  white-space: pre-wrap;
}

/* 修复样式，统一标题外观 */
.herbs-section,
.category-section,
.data-charts {
  height: 100%;
  padding: 5px;
  display: flex;
  flex-direction: column;

  background-size: 100% 100%;
}

.herbs-section h2,
.category-section h2,
.data-charts h2 {
  font-size: 18px;
  color: #ffffff;
  margin: -10px -10px 15px -10px;
  padding: 15px;
  font-family: '楷体', serif;
  position: relative;
  letter-spacing: 1px;
  text-align: center;
  background-color: #674541;
  border-radius: 8px 8px 0 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3);
  overflow: hidden;
}

.herbs-section h2::before,
.category-section h2::before,
.data-charts h2::before {
  content: '';
  position: absolute;
  top: -10%;
  left: -100%;
  width: 50%;
  height: 120%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: skewX(-25deg);
  animation: shine 3s infinite;
}

@keyframes shine {
  0% { left: -100%; }
  20% { left: 100%; }
  100% { left: 100%; }
}
</style> 