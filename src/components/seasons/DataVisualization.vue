<template>
  <div class="visualization-container">
    <div class="visualization-header">
      <h2>养生数据分析</h2>
      <div class="view-selector">
        <button 
          :class="['view-btn', { active: currentView === 'network' }]" 
          @click="currentView = 'network'">
          食材关联
        </button>
        <button 
          :class="['view-btn', { active: currentView === 'recommendation' }]" 
          @click="currentView = 'recommendation'">
          药膳推荐
        </button>
      </div>
    </div>
    
    <!-- 食材关联网络图 -->
    <div v-show="currentView === 'network'" class="network-view">
      <div class="network-loading" v-if="isLoading">
        <div class="spinner"></div>
        <span>加载中...</span>
      </div>
      <div class="network-container" ref="networkRef"></div>
      <div class="network-legend">
        <div class="legend-item">
          <span class="dot constitution"></span>
          <span>体质</span>
        </div>
        <div class="legend-item">
          <span class="dot symptom"></span>
          <span>症状</span>
        </div>
        <div class="legend-item">
          <span class="dot recipe"></span>
          <span>药膳</span>
        </div>
      </div>
    </div>

    <!-- 药膳推荐视图 -->
    <div v-show="currentView === 'recommendation'" class="recommendation-view">
      <div class="constitution-summary">
        <div class="summary-item">
          <span class="label">当前体质：</span>
          <span class="value">{{ userConstitution.type }}</span>
        </div>
        <div class="summary-item">
          <span class="label">养生需求：</span>
          <span class="value">
            <span v-for="need in userConstitution.features" 
                  :key="need" 
                  class="need-tag">
              {{ getNeedLabel(need) }}
            </span>
          </span>
        </div>
      </div>
      
      <div class="recommendation-list">
        <div v-for="(recipe, index) in recommendedRecipes" 
             :key="index" 
             class="recipe-card">
          <div class="recipe-header">
            <h3>{{ recipe.name }}</h3>
            <div class="recipe-score">
              匹配度：{{ recipe.matchScore }}%
            </div>
          </div>
          
          <div class="match-details">
            <div class="match-item">
              <span class="match-label">体质匹配：</span>
              <div class="progress-bar-container">
                <div class="progress-bar constitution" 
                     :style="{width: `${(recipe.constitutionMatchScore / 40) * 100}%`}">
                </div>
              </div>
              <span class="match-value">{{ recipe.constitutionMatchScore }}/40</span>
            </div>
            <div class="match-item">
              <span class="match-label">需求匹配：</span>
              <div class="progress-bar-container">
                <div class="progress-bar needs" 
                     :style="{width: `${(recipe.needMatchScore / 30) * 100}%`}">
                </div>
              </div>
              <span class="match-value">{{ recipe.needMatchScore }}/30</span>
            </div>
          </div>
          
          <div class="recipe-content">
            <div class="recipe-info">
              <div class="benefits">
                <p>{{ recipe.benefits }}</p>
              </div>
              <div class="herbs">
                <span class="herb-label">药材：</span>
                <span>{{ recipe.herbs }}</span>
              </div>
            </div>
            <button class="detail-btn" @click="showRecipeDetail(recipe)">
              查看详情
            </button>
          </div>
        </div>
      </div>
    </div>
  
  </div>
</template>

<script setup>
import * as echarts from 'echarts';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
// 移除 echarts-gl 引用，改用标准图表
// import 'echarts-gl';
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

// 当前视图
const currentView = ref('network');
// 加载状态
const isLoading = ref(false);

// 网络图实例
let networkChart = null;
const networkRef = ref(null);

// 计算推荐药膳
const recommendedRecipes = computed(() => {
  // 检查数据是否存在
  if (!yaoshanData || !Array.isArray(yaoshanData)) {
    console.warn('药膳数据未加载');
    return [];
  }

  const recipes = yaoshanData;
  const constitution = props.userConstitution.type;
  const needs = props.userConstitution.features || [];
  
  // 定义季节因素和体质关系映射表
  const seasonConstitutionMap = {
    '春季': ['阳虚质', '血虚质'],
    '夏季': ['阴虚质', '湿热质'],
    '秋季': ['气虚质', '血瘀质'],
    '冬季': ['平和质', '痰湿质', '特禀质'],
    '四季': ['平和质']
  };
  
  // 当前季节是否适合该体质（季节加分因子）
  const currentSeason = getCurrentSeason(props.selectedSeason);
  const isSeasonMatchConstitution = seasonConstitutionMap[currentSeason]?.includes(constitution) || false;
  
  // 体质与功效关键词匹配表
  const constitutionKeywords = {
    '阳虚质': ['温阳', '助阳', '壮阳', '补阳', '暖肾', '肾阳'],
    '阴虚质': ['滋阴', '养阴', '清热', '润燥', '生津'],
    '气虚质': ['补气', '益气', '健脾', '补脾', '提神'],
    '血虚质': ['补血', '养血', '益精', '养心'],
    '痰湿质': ['化痰', '祛湿', '利水', '消水', '健脾', '温阳'],
    '湿热质': ['清热', '祛湿', '解毒', '利水', '通淋'],
    '血瘀质': ['活血', '化瘀', '行气', '止痛', '通络'],
    '气郁质': ['解郁', '理气', '疏肝', '舒肝', '调畅'],
    '特禀质': ['扶正', '固表', '温肺', '补肾'],
    '平和质': ['调理', '健脾', '益气', '养阴', '温阳']
  };
  
  // 需求关键词匹配表
  const needKeywords = {
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
  
  // 计算每个药膳的匹配分数
  const scoredRecipes = recipes.map(recipe => {
    // 确保 recipe 对象包含必要的属性
    if (!recipe || typeof recipe !== 'object' || !recipe.功效) {
      return null;
    }
    
    // 将功效分解为关键词组
    const benefitText = recipe.功效 || '';
    const benefitKeywords = benefitText.split(/[，。、；,.;]/g).filter(Boolean);
    
    // 1. 基础分数 (20分)
    let score = 20;
    
    // 2. 体质匹配度 (最高40分)
    let constitutionScore = 0;
    // 根据体质关键词计算匹配度
    const relevantKeywords = constitutionKeywords[constitution] || [];
    relevantKeywords.forEach(keyword => {
      if (benefitText.includes(keyword)) {
        constitutionScore += 10; // 每匹配一个关键词加10分
      }
    });
    // 限制体质最高分为40分
    constitutionScore = Math.min(constitutionScore, 40);
    score += constitutionScore;
    
    // 3. 养生需求匹配度 (最高30分)
    let needScore = 0;
    needs.forEach(need => {
      // 获取该需求的关键词
      const keywords = needKeywords[need] || [];
      // 计算该需求的匹配程度
      let matchDegree = 0;
      keywords.forEach(keyword => {
        // 完全匹配
        if (benefitText.includes(keyword)) {
          matchDegree += 2;
        } 
        // 部分匹配 (关键词被分解为单字检查)
        else if (keyword.length > 1) {
          const chars = keyword.split('');
          let partialMatches = 0;
          chars.forEach(char => {
            if (benefitText.includes(char)) {
              partialMatches++;
            }
          });
          // 超过半数字符匹配算部分匹配
          if (partialMatches >= chars.length / 2) {
            matchDegree += 1;
          }
        }
      });
      
      // 该需求的得分 = 匹配程度 * (30/需求总数/关键词数)
      needScore += matchDegree * (30 / (needs.length || 1) / (keywords.length || 1));
    });
    // 限制需求最高分为30分
    needScore = Math.min(needScore, 30);
    score += needScore;
    
    // 4. 食材与药材匹配度 (最高5分)
    const ingredients = (recipe.食材 || '').split(/[，。、；,.;]/g).filter(Boolean);
    const herbs = (recipe.药材 || '').split(/[，。、；,.;]/g).filter(Boolean);
    let ingredientScore = Math.min(ingredients.length + herbs.length, 5);
    score += ingredientScore;
    
    // 5. 季节匹配加分 (最高5分)
    if (isSeasonMatchConstitution) {
      score += 5;
    }
    
    return {
      name: recipe.药膳名,
      ingredients: recipe.食材.split('，'),
      herbs: recipe.药材,
      benefits: recipe.功效,
      image: '', // 可以添加默认图片或者从其他地方获取
      tags: recipe.药材.split('，'),
      matchScore: Math.round(score),
      constitutionMatchScore: constitutionScore,
      needMatchScore: needScore
    };
  }).filter(recipe => recipe !== null); // 过滤掉无效的药膳数据
  
  // 按匹配分数排序并返回前5个推荐
  return scoredRecipes
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
});

// 获取养生需求标签
const getNeedLabel = (need) => {
  const needMap = {
    'digestive': '调理脾胃',
    'sleep': '改善睡眠',
    'immune': '增强免疫',
    'energy': '提升精力',
    'shen': '温肾壮阳',
    'detox': '排毒养颜',
    'calm': '平静心神',
    'joints': '关节滋养',
    'blood': '调节血压',
    'respiratory': '呼吸道健康'
  };
  return needMap[need] || need;
};

// 辅助函数：根据节气获取当前季节
function getCurrentSeason(seasonName) {
  const springTerms = ['立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '二月', '三月'];
  const summerTerms = ['立夏', '小满', '芒种', '夏至', '小暑', '大暑', '四月', '五月'];
  const autumnTerms = ['立秋', '处暑', '白露', '秋分', '寒露', '霜降', '六月', '七月'];
  const winterTerms = ['立冬', '小雪', '大雪', '冬至', '小寒', '大寒', '腊月', '正月'];
  
  if (springTerms.some(term => seasonName.includes(term))) {
    return '春季';
  } else if (summerTerms.some(term => seasonName.includes(term))) {
    return '夏季';
  } else if (autumnTerms.some(term => seasonName.includes(term))) {
    return '秋季';
  } else if (winterTerms.some(term => seasonName.includes(term))) {
    return '冬季';
  }
  
  return '四季';
}

// 初始化网络图
const initNetworkChart = () => {
  if (!networkRef.value) return;
  
  try {
    // 销毁旧实例（如果存在）
    if (networkChart) {
      networkChart.dispose();
    }
    
    // 获取数据
    const constitutionName = props.userConstitution.type;
    const symptoms = (props.userConstitution.features || []).map(f => getNeedLabel(f));
    const recipes = recommendedRecipes.value;
    
    // 尝试使用树状结构
    const treeData = {
      name: constitutionName,
      itemStyle: {
        color: '#7e57c2',
        borderWidth: 0
      },
      children: []
    };
    
    // 为每个症状创建子节点
    symptoms.forEach(symptom => {
      const symptomNode = {
        name: symptom,
        itemStyle: {
          color: '#ff9800',
          borderWidth: 0
        },
        children: []
      };
      
      // 为每个症状添加匹配的药膳
      recipes.forEach(recipe => {
        // 检查该药膳是否与症状有关联
        const recipeBenefits = (recipe.benefits || '').split('，').filter(Boolean);
        const matchingBenefits = recipeBenefits.filter(benefit => 
          benefit.includes(symptom) || symptom.includes(benefit)
        );
        
        if (matchingBenefits.length > 0) {
          // 添加药膳到该症状下
          symptomNode.children.push({
            name: recipe.name,
            value: recipe.matchScore,
            itemStyle: {
              color: '#4caf50',
              borderWidth: 0
            }
          });
        }
      });
      
      // 如果有匹配的药膳，添加这个症状节点
      if (symptomNode.children.length > 0) {
        treeData.children.push(symptomNode);
      }
    });
    
    // 如果没有通过症状关联的药膳，直接添加到体质节点
    const linkedRecipeNames = new Set();
    treeData.children.forEach(symptomNode => {
      symptomNode.children.forEach(recipeNode => {
        linkedRecipeNames.add(recipeNode.name);
      });
    });
    
    recipes.forEach(recipe => {
      if (!linkedRecipeNames.has(recipe.name)) {
        treeData.children.push({
          name: recipe.name,
          value: recipe.matchScore,
          itemStyle: {
            color: '#4caf50',
            borderWidth: 0
          }
        });
      }
    });
    
    // 初始化图表
    networkChart = echarts.init(networkRef.value);
    
    // 尝试使用树状图
    if (treeData.children.length > 0) {
      const option = {
        title: {
          text: '体质-症状-药膳关联分析',
          left: 'center',
          top: 10,
          textStyle: {
            color: '#2c3e50',
            fontSize: 16,
            fontWeight: 'normal'
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: params => {
            const { name, value } = params.data;
            
            // 如果是药膳节点，显示匹配度
            const recipe = recommendedRecipes.value.find(r => r.name === name);
            if (recipe) {
              return `
                <div style="font-weight:bold">${name}</div>
                <div>匹配度: ${recipe.matchScore}%</div>
                <div>功效: ${recipe.benefits}</div>
              `;
            }
            
            return name;
          }
        },
        toolbox: {
          show: true,
          feature: {
            restore: { show: true },
            saveAsImage: { show: true }
          }
        },
        series: [
          {
            type: 'tree',
            data: [treeData],
            top: '10%',
            left: '2%',
            bottom: '2%',
            right: '15%',
            symbolSize: 12,
            orient: 'LR',
            expandAndCollapse: true,
            initialTreeDepth: 3,
            label: {
              position: 'right',
              verticalAlign: 'middle',
              align: 'left',
              fontSize: 12,
              formatter: (params) => {
                // 如果是药膳节点（没有children），显示名称和匹配度
                if (!params.data.children) {
                  const recipe = recommendedRecipes.value.find(r => r.name === params.name);
                  if (recipe) {
                    return `${params.name} (${recipe.matchScore}%)`;
                  }
                }
                return params.name;
              }
            },
            leaves: {
              label: {
                position: 'right',
                verticalAlign: 'middle',
                align: 'left'
              }
            },
            emphasis: {
              focus: 'descendant'
            },
            roam: true,
            lineStyle: {
              width: 1.5,
              curveness: 0.5
            }
          }
        ]
      };
      
      networkChart.setOption(option);
    } else {
      // 回退到桑基图
      const nodes = [];
      const links = [];
      
      // 添加体质节点
      nodes.push({
        name: constitutionName,
        itemStyle: {
          color: '#7e57c2',
          borderWidth: 0
        }
      });
      
      // 添加症状节点
      symptoms.forEach(symptom => {
        nodes.push({
          name: symptom,
          itemStyle: {
            color: '#ff9800',
            borderWidth: 0
          }
        });
        
        // 添加体质-症状连接
        links.push({
          source: constitutionName,
          target: symptom,
          value: 1,
          lineStyle: {
            color: 'rgba(126, 87, 194, 0.7)',
            width: 2
          }
        });
      });
      
      // 添加药膳节点和连接
      recipes.forEach(recipe => {
        // 添加药膳节点
        nodes.push({
          name: recipe.name,
          itemStyle: {
            color: '#4caf50',
            borderWidth: 0
          }
        });
        
        // 连接体质和药膳
        links.push({
          source: constitutionName,
          target: recipe.name,
          value: recipe.matchScore,
          lineStyle: {
            color: 'rgba(126, 87, 194, 0.5)',
            width: 2
          }
        });
        
        // 连接症状和药膳
        const recipeBenefits = (recipe.benefits || '').split('，').filter(Boolean);
        
        symptoms.forEach(symptom => {
          const matchingBenefits = recipeBenefits.filter(benefit => 
            benefit.includes(symptom) || symptom.includes(benefit)
          );
          
          if (matchingBenefits.length > 0) {
            links.push({
              source: symptom,
              target: recipe.name,
              value: matchingBenefits.length * 2,
              lineStyle: {
                color: 'rgba(76, 175, 80, 0.5)',
                width: 2
              }
            });
          }
        });
      });
      
      // 移除重复节点
      const uniqueNodes = Array.from(
        new Map(nodes.map(node => [node.name, node])).values()
      );
      
      const option = {
        title: {
          text: '体质-养生需求-药膳关联分析',
          left: 'center',
          top: 10,
          textStyle: {
            color: '#2c3e50',
            fontSize: 16,
            fontWeight: 'normal'
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: params => {
            const { name, dataType, value, data } = params;
            
            if (dataType === 'edge') {
              return `${data.source} → ${data.target}: ${value}`;
            }
            
            // 如果是药膳节点，显示匹配度
            const recipe = recommendedRecipes.value.find(r => r.name === name);
            if (recipe) {
              return `
                <div style="font-weight:bold">${name}</div>
                <div>匹配度: ${recipe.matchScore}%</div>
                <div>功效: ${recipe.benefits}</div>
              `;
            }
            
            return name;
          }
        },
        toolbox: {
          show: true,
          feature: {
            restore: { show: true },
            saveAsImage: { show: true }
          }
        },
        series: [
          {
            type: 'sankey',
            layout: 'none',
            emphasis: {
              focus: 'adjacency'
            },
            data: uniqueNodes,
            links: links,
            lineStyle: {
              color: 'gradient',
              curveness: 0.5,
              opacity: 0.7
            },
            itemStyle: {
              borderWidth: 0, // 移除描边
              color: params => params.data.itemStyle ? params.data.itemStyle.color : '#999'
            },
            label: {
              position: 'right',
              fontSize: 12,
              fontWeight: 500,
              formatter: (params) => {
                // 如果是药膳节点，显示名称和匹配度
                const recipe = recommendedRecipes.value.find(r => r.name === params.name);
                if (recipe) {
                  return `${params.name} (${recipe.matchScore}%)`;
                }
                return params.name;
              }
            },
            layoutIterations: 64,
            nodeWidth: 20,
            nodeGap: 12
          }
        ]
      };
      
      networkChart.setOption(option);
    }
    
    // 添加点击事件
    networkChart.on('click', params => {
      if (params.componentType === 'series') {
        const name = params.name;
        const recipe = recommendedRecipes.value.find(r => r.name === name);
        if (recipe) {
          showRecipeDetail(recipe);
        }
      }
    });
  } catch (error) {
    console.error('初始化树状图/桑基图失败:', error);
    
    // 尝试使用更简单的力导向图
    try {
      if (networkChart) {
        networkChart.dispose();
      }
      
      networkChart = echarts.init(networkRef.value);
      
      // 准备力导向图数据
      const nodes = [];
      const links = [];
      const categories = [
        { name: '体质', itemStyle: { color: '#7e57c2' } },
        { name: '症状', itemStyle: { color: '#ff9800' } },
        { name: '药膳', itemStyle: { color: '#4caf50' } }
      ];
      
      // 添加体质节点
      nodes.push({
        id: 0,
        name: props.userConstitution.type,
        symbolSize: 40,
        category: 0,
        label: {
          show: true
        }
      });
      
      // 症状节点
      const symptoms = (props.userConstitution.features || []).map(f => getNeedLabel(f));
      symptoms.forEach((symptom, index) => {
        nodes.push({
          id: index + 1,
          name: symptom,
          symbolSize: 30,
          category: 1
        });
        
        // 连接体质和症状
        links.push({
          source: 0,
          target: index + 1
        });
      });
      
      // 药膳节点
      recommendedRecipes.value.forEach((recipe, index) => {
        const nodeId = index + symptoms.length + 1;
        nodes.push({
          id: nodeId,
          name: recipe.name,
          symbolSize: 20 + recipe.matchScore / 5,
          category: 2,
          tooltip: {
            formatter: `${recipe.name}<br/>匹配度: ${recipe.matchScore}%<br/>功效: ${recipe.benefits}`
          }
        });
        
        // 连接体质和药膳
        links.push({
          source: 0,
          target: nodeId
        });
        
        // 连接症状和药膳
        const recipeBenefits = (recipe.benefits || '').split('，').filter(Boolean);
        symptoms.forEach((symptom, symptomIndex) => {
          const matchingBenefits = recipeBenefits.filter(benefit => 
            benefit.includes(symptom) || symptom.includes(benefit)
          );
          
          if (matchingBenefits.length > 0) {
            links.push({
              source: symptomIndex + 1,
              target: nodeId
            });
          }
        });
      });
      
      const option = {
        title: {
          text: '体质-症状-药膳关系图',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: params => {
            if (params.dataType === 'node') {
              const recipe = recommendedRecipes.value.find(r => r.name === params.name);
              if (recipe) {
                return `
                  <div style="font-weight:bold">${recipe.name}</div>
                  <div>匹配度: ${recipe.matchScore}%</div>
                  <div>功效: ${recipe.benefits}</div>
                `;
              }
              return params.name;
            }
            return '';
          }
        },
        legend: {
          data: categories.map(a => a.name),
          orient: 'vertical',
          right: 10,
          top: 'center',
          textStyle: {
            color: '#333'
          }
        },
        series: [
          {
            type: 'graph',
            layout: 'force',
            animation: false,
            draggable: true,
            roam: true,
            label: {
              show: true,
              position: 'right',
              formatter: (params) => {
                // 如果是药膳节点（类别2），显示名称和匹配度
                if (params.data.category === 2) {
                  const recipe = recommendedRecipes.value.find(r => r.name === params.name);
                  if (recipe) {
                    return `${params.name} (${recipe.matchScore}%)`;
                  }
                }
                return params.name;
              }
            },
            lineStyle: {
              color: 'source',
              curveness: 0.3,
              width: 1.5,
              opacity: 0.7
            },
            emphasis: {
              focus: 'adjacency',
              lineStyle: {
                width: 3
              }
            },
            force: {
              repulsion: 100,
              edgeLength: 100
            },
            data: nodes,
            links: links,
            categories: categories
          }
        ]
      };
      
      networkChart.setOption(option);
      
      // 添加点击事件
      networkChart.on('click', params => {
        if (params.dataType === 'node') {
          const name = params.name;
          const recipe = recommendedRecipes.value.find(r => r.name === name);
          if (recipe) {
            showRecipeDetail(recipe);
          }
        }
      });
    } catch (fallbackError) {
      console.error('备用图表也初始化失败:', fallbackError);
      
      // 如果力导向图也失败，使用简单的饼图
      try {
        if (networkChart) {
          networkChart.dispose();
        }
        
        networkChart = echarts.init(networkRef.value);
        
        const pieOption = {
          title: {
            text: '药膳匹配度分析',
            left: 'center'
          },
          tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
          },
          legend: {
            orient: 'vertical',
            left: 'left',
            data: recommendedRecipes.value.map(recipe => recipe.name)
          },
          series: [
            {
              name: '药膳匹配度',
              type: 'pie',
              radius: '60%',
              center: ['50%', '50%'],
              data: recommendedRecipes.value.map(recipe => ({
                name: recipe.name,
                value: recipe.matchScore,
                itemStyle: {
                  borderWidth: 0 // 移除描边
                }
              })),
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
              },
              label: {
                show: true,
                formatter: '{b}: {d}%'
              }
            }
          ]
        };
        
        networkChart.setOption(pieOption);
      } catch (error) {
        console.error('所有图表初始化都失败:', error);
      }
    }
  } finally {
    // 不管成功或失败，都隐藏加载状态
    isLoading.value = false;
  }
};

// 显示药膳详情
const showRecipeDetail = (recipe) => {
  // TODO: 实现药膳详情展示逻辑
  console.log('显示药膳详情:', recipe);
};

// 监听视图变化
watch(currentView, (newView) => {
  if (newView === 'network') {
    // 显示加载状态
    isLoading.value = true;
    
    // 延迟初始化图表，确保 DOM 已经渲染
    nextTick(() => {
      setTimeout(() => {
        initNetworkChart();
        isLoading.value = false;
      }, 300);
    });
  }
});

// 监听体质和需求变化
watch(() => props.userConstitution, () => {
  if (currentView.value === 'network') {
    // 显示加载状态
    isLoading.value = true;
    
    // 延迟初始化图表，确保 DOM 已经渲染
    nextTick(() => {
      setTimeout(() => {
        initNetworkChart();
        isLoading.value = false;
      }, 300);
    });
  }
}, { deep: true });

// 组件挂载
onMounted(() => {
  // 显示加载状态
  isLoading.value = true;
  
  // 延迟初始化图表，确保 DOM 已经渲染
  nextTick(() => {
    setTimeout(() => {
      initNetworkChart();
      isLoading.value = false;
    }, 300);
  });
});

// 组件卸载前清理
onBeforeUnmount(() => {
  if (networkChart) {
    networkChart.dispose();
    networkChart = null;
  }
});
</script>

<style scoped>
.visualization-container {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(8px);
  padding: 1.5rem;
  height: 65%;
  overflow: hidden;
}

.visualization-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  background: #8d6e63; /* 棕色背景 */
  padding: 5px 10px; /* 缩小内边距，让背景更紧凑 */
  border-radius: 6px; /* 圆角 */
  position: relative;
  top: -5px; /* 让整个背景上移 */
}

.visualization-header h2 {
  margin: 0;
  font-size: 1.2rem;
  color: white; /* 文字颜色变白，提高对比度 */
  display: block;
  line-height: 1.2; /* 让背景更贴合文字 */
}

.view-selector {
  display: flex;
  gap: 0.5rem;
}

.view-btn {
  padding: 0.4rem 0.8rem;
  background: rgba(255, 255, 255, 0.64);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  font-size: 0.85rem;
  color: #555;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-btn:hover {
  background: rgba(255, 255, 255, 0.9);
}

.view-btn.active {
  background: rgb(255, 255, 255);
  border: 1px solid rgba(255, 255, 255, 0.81);
  color: #7e57c2;
}

/* 药膳推荐视图样式 */
.recommendation-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: hidden;
}

.constitution-summary {
  display: flex;
  gap: 1rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  align-items: center;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.summary-item .label {
  color: #666;
  font-size: 0.8rem;
  white-space: nowrap;
}

.summary-item .value {
  color: #2c3e50;
  font-weight: 500;
  font-size: 0.9rem;
}

.need-tag {
  display: inline-block;
  padding: 0.1rem 0.4rem;
  background: rgba(126, 87, 194, 0.1);
  border-radius: 12px;
  color: #7e57c2;
  font-size: 0.7rem;
  margin-right: 0.3rem;
}

.recommendation-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.recipe-card {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.recipe-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recipe-header h3 {
  margin: 0;
  font-size: 0.95rem;
  color: #2c3e50;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.recipe-score {
  padding: 0.2rem 0.4rem;
  background: rgba(126, 87, 194, 0.1);
  border-radius: 12px;
  color: #7e57c2;
  font-size: 0.7rem;
  font-weight: 500;
}

/* 新增匹配详情样式 */
.match-details {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 4px;
}

.match-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.match-label {
  width: 4rem;
  font-size: 0.75rem;
  color: #666;
  white-space: nowrap;
}

.match-value {
  font-size: 0.7rem;
  color: #666;
  min-width: 2.5rem;
  text-align: right;
}

.progress-bar-container {
  flex: 1;
  height: 0.5rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 3px;
}

.progress-bar.constitution {
  background: linear-gradient(to right, #7e57c2, #9575cd);
}

.progress-bar.needs {
  background: linear-gradient(to right, #4caf50, #8bc34a);
}

.recipe-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.8rem;
}

.recipe-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  overflow: hidden;
}

.benefits p {
  margin: 0;
  font-size: 0.75rem;
  color: #666;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.herbs {
  font-size: 0.7rem;
  color: #666;
}

.herb-label {
  color: #7e57c2;
  font-weight: 500;
}

.detail-btn {
  padding: 0.3rem 0.6rem;
  background: #7e57c2;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  align-self: center;
}

.detail-btn:hover {
  background: #6a3db5;
}

/* 网络图视图样式 */
.network-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
}

.network-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.spinner {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 4px solid rgba(126, 87, 194, 0.1);
  border-top-color: #7e57c2;
  animation: spin 1s infinite linear;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.network-container {
  flex: 1;
  min-height: 0;
}

.network-legend {
  display: flex;
  justify-content: center;
  gap: 2rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #666;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot.constitution {
  background: #7e57c2;
}

.dot.symptom {
  background: #ff9800;
}

.dot.recipe {
  background: #4caf50;
}
</style> 