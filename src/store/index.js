import { defineStore } from 'pinia'
import ExcelService from '../utils/ExcelService'

// 药食数据库相关状态
export const useHerbalStore = defineStore('herbal', {
  state: () => ({
    herbs: [],
    geoData: [], // 地理数据存储
    fiveElementData: [], // 五行数据存储
    detailedHerbData: [], // 存储详细药材数据
    selectedHerbDetail: null, // 添加选中的药材详情
    categories: [
      { name: '木', color: 'rgb(86, 160, 127)' },  // 绿色
      { name: '火', color: 'rgb(167, 107, 87)' },  // 棕色
      { name: '土', color: 'rgb(167, 157, 114)' }, // 黄褐色
      { name: '金', color: 'rgb(160, 135, 84)' },  // 金色
      { name: '水', color: 'rgb(106, 169, 190)' }  // 青蓝色
    ],
    selectedCategory: null,
    loading: false,
    error: null // 添加错误状态
  }),
  
  actions: {
    setSelectedCategory(category) {
      console.log('设置分类:', category)
      this.selectedCategory = category
    },
    
    async fetchFiveElementData() {
      try {
        const response = await fetch('/data/herbal_five_elements.json')
        this.fiveElementData = await response.json()
        console.log('五行数据加载成功:', this.fiveElementData.length)
      } catch (error) {
        console.error('五行数据加载失败:', error)
        this.fiveElementData = []
      }
    },
    
    async fetchDetailedHerbData() {
      console.log('开始加载详细数据...')
      this.loading = true
      this.error = null
      
      try {
        console.log('发起请求: /data/herbal_detailed_data.json')
        const response = await fetch('/data/herbal_detailed_data.json')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        console.log('请求成功,开始解析数据...')
        const text = await response.text()
        console.log('收到的原始数据:', text.substring(0, 200)) // 打印前200个字符
        
        try {
          const data = JSON.parse(text)
          console.log('数据解析成功,数据长度:', data.length)
          console.log('数据示例:', data[0]) // 打印第一条数据
          
          this.detailedHerbData = data
          console.log('详细数据已存储,当前数据量:', this.detailedHerbData.length)
          
          // 验证数据完整性
          const validData = data.every(item => item.name && item.components)
          console.log('数据完整性检查:', validData ? '通过' : '存在缺失字段')
          
          return true
        } catch (parseError) {
          console.error('数据解析失败:', parseError)
          console.log('原始数据内容:', text)
          this.error = '数据解析失败'
          this.detailedHerbData = []
          return false
        }
      } catch (error) {
        console.error('加载详细数据失败:', error)
        this.error = error.message
        this.detailedHerbData = []
        return false
      } finally {
        this.loading = false
        console.log('数据加载完成,状态:', {
          loading: this.loading,
          error: this.error,
          dataCount: this.detailedHerbData.length
        })
      }
    },
    
    async fetchGeoData() {
      try {
        const response = await fetch('/data/hebal_geo.json')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const text = await response.text() // 先获取文本内容
        try {
          this.geoData = JSON.parse(text) // 尝试解析JSON
          console.log('地理数据加载成功:', this.geoData.length)
        } catch (parseError) {
          console.error('地理数据解析失败:', parseError)
          console.log('收到的数据:', text.substring(0, 200)) // 打印前200个字符以便调试
          this.geoData = []
        }
      } catch (error) {
        console.error('地理数据加载失败:', error)
        this.geoData = []
      }
    },
    
    async fetchHerbs() {
      console.log('开始加载所有数据...')
      this.loading = true
      
      try {
        // 加载所有数据
        console.log('并行加载数据...')
        const results = await Promise.all([
          this.fetchGeoData(),
          this.fetchFiveElementData(),
          this.fetchDetailedHerbData()
        ])
        
        console.log('数据加载结果:', {
          geo: results[0],
          fiveElement: results[1],
          detailed: results[2]
        })
        
        // 整合数据
        console.log('开始整合数据...')
        const herbs = []
        
        // 遍历五行数据，作为基础数据
        this.fiveElementData.forEach((item, index) => {
          if (!item.药食) {
            console.log('跳过无名称条目:', item)
            return
          }
          
          console.log(`处理药材 ${index + 1}/${this.fiveElementData.length}: ${item.药食}`)
          
          // 查找匹配的详细数据
          const detailedData = this.detailedHerbData.find(
            d => d.name === item.药食
          )
          console.log('找到详细数据:', !!detailedData)
          
          // 查找匹配的地理数据
          const geoData = this.geoData.find(
            g => g.物质名称 === item.药食
          )
          console.log('找到地理数据:', !!geoData)
          
          // 创建基础药材对象
          const herb = {
            id: index + 1,
            name: item.药食,
            category: item.五行 || '未知',
            description: item.功效 || '',
            wuxing: {
              metal: parseFloat(item.金) || 0,
              wood: parseFloat(item.木) || 0,
              water: parseFloat(item.水) || 0,
              fire: parseFloat(item.火) || 0,
              earth: parseFloat(item.土) || 0
            },
            taste: (item.五味 || '').split('、').filter(Boolean),
            nature: item.四气 || '',
            meridians: (item.归经 || '').split('、').filter(Boolean),
            effects: detailedData ? 
              (detailedData.effects || detailedData.effect || '').split('、').filter(Boolean) : 
              (item.功效 || '').split('、').filter(Boolean),
            location: geoData ? geoData.产地.replace('中国', '').trim() : ''
          }
          
          console.log('生成药材对象:', {
            name: herb.name,
            category: herb.category,
            effectsCount: herb.effects.length,
            hasLocation: !!herb.location
          })
          
          herbs.push(herb)
        })
        
        console.log('数据整合完成:', {
          totalHerbs: herbs.length,
          categoryCounts: herbs.reduce((acc, herb) => {
            acc[herb.category] = (acc[herb.category] || 0) + 1
            return acc
          }, {})
        })
        
        this.herbs = herbs
      } catch (error) {
        console.error('加载数据失败:', error)
        this.error = error.message
      } finally {
        this.loading = false
        console.log('数据加载流程完成,状态:', {
          loading: this.loading,
          error: this.error,
          herbsCount: this.herbs.length,
          detailedDataCount: this.detailedHerbData.length
        })
      }
    },
    
    getHerbDetail(herbName) {
      console.log('查找药材详情:', herbName)
      console.log('当前详细数据量:', this.detailedHerbData.length)
      
      if (!herbName) {
        console.error('药材名称为空')
        return null
      }
      
      if (this.detailedHerbData.length === 0) {
        console.error('详细数据未加载')
        return null
      }
      
      const detail = this.detailedHerbData.find(h => h.name === herbName)
      console.log('查找结果:', detail ? '找到' : '未找到')
      
      if (detail) {
        console.log('药材详情:', {
          name: detail.name,
          hasComponents: !!detail.components,
          hasEffects: !!detail.effects,
          hasOrigin: !!detail.origin
        })
        
        this.selectedHerbDetail = detail
        console.log('已更新选中的药材详情')
      } else {
        console.warn(`未找到药材 ${herbName} 的详细信息`)
        this.selectedHerbDetail = null
      }
      
      return detail
    }
  }
})

// 药膳配方相关状态
export const useRecipeStore = defineStore('recipe', {
  state: () => ({
    recipes: [],
    categories: [],
    constitutions: [
      { id: 1, name: '平和质' },
      { id: 2, name: '气虚质' },
      { id: 3, name: '阳虚质' },
      { id: 4, name: '阴虚质' },
      { id: 5, name: '痰湿质' },
      { id: 6, name: '湿热质' },
      { id: 7, name: '血瘀质' },
      { id: 8, name: '气郁质' },
      { id: 9, name: '特禀质' }
    ],
    selectedConstitution: null,
    selectedRecipe: null,
    loading: false
  }),
  
  actions: {
    setSelectedConstitution(constitution) {
      this.selectedConstitution = constitution
      console.log('Store: 设置体质 -', constitution)
    },
    
    selectRecipe(recipe) {
      this.selectedRecipe = recipe
      console.log('Store: 设置药膳 -', recipe?.name)
    },
    
    async fetchRecipes() {
      if (this.recipes.length > 0) {
        console.log('Store: 已有药膳数据，跳过加载')
        return this.recipes
      }
      
      this.loading = true
      console.log('Store: 开始加载药膳数据')
      
      try {
        // 从Excel文件导入数据
        const excelFilePath = '/data/yaoshan_data.xlsx'; // 相对于public目录
        
        // 使用ExcelService导入药膳数据
        const recipesData = await ExcelService.importYaoshanData(excelFilePath);
        
        this.recipes = recipesData;
        console.log('Store: 药膳数据加载完成:', this.recipes.length);
        return this.recipes;
      } catch (error) {
        console.error('Store: 药膳数据加载错误:', error)
        
        // 如果导入失败，使用备用的硬编码数据确保程序可以运行
        this.recipes = [
          { 
            id: 1, 
            name: '四神汤', 
            source: '',
            suitableFor: ['脾虚', '气虚', '痰湿'],
            ingredients: [
              { name: '淮山药', amount: '15克' },
              { name: '茯苓', amount: '10克' },
              { name: '莲子', amount: '10克' },
              { name: '芡实', amount: '10克' },
              { name: '陈皮', amount: '3克' },
              { name: '生姜', amount: '3片' }
            ],
            foodIngredients: [], // 食材，Excel导入后会填充该字段
            effects: '健脾胃，补肺气，化痰湿。适用于脾胃虚弱，消化不良，腹胀，大便溏薄等症状。',
            effectTags: ['健脾胃', '补肺气', '化痰湿'], // 功效标签，Excel导入后会填充该字段
            preparation: '将所有材料加水煮沸后，转小火煮约40分钟，加入适量食盐调味即可。',
            usage: '每天一次，早餐或晚餐食用。',
            wuxingLogic: '四神汤以健脾为主，属土，茯苓、莲子化湿，山药、芡实补脾，配伍精妙。'
          },
          // 其他备用数据...
        ];
        
        return this.recipes;
      } finally {
        this.loading = false
      }
    },
    
    async fetchCategories() {
      if (this.categories.length > 0) {
        return this.categories;
      }
      
      try {
        // 使用ExcelService分析药膳数据，提取分类信息
        this.categories = ExcelService.analyzeCategories(this.recipes);
        return this.categories;
      } catch (error) {
        console.error('分类数据提取错误:', error);
        // 备用分类数据
        this.categories = [
          { name: '补气养血', count: 24, recipes: [] },
          { name: '健脾祛湿', count: 18, recipes: [] },
          { name: '滋阴补肾', count: 15, recipes: [] },
          { name: '清热解毒', count: 12, recipes: [] },
          { name: '润肺止咳', count: 10, recipes: [] }
        ];
        return this.categories;
      }
    }
  }
})

// 养生文化相关状态
export const useSeasonStore = defineStore('season', {
  state: () => ({
    solarTerms: [
      { id: 1, name: '立春', date: '2月4日前后', season: '春' },
      { id: 2, name: '雨水', date: '2月19日前后', season: '春' },
      { id: 3, name: '惊蛰', date: '3月6日前后', season: '春' },
      { id: 4, name: '春分', date: '3月21日前后', season: '春' },
      { id: 5, name: '清明', date: '4月5日前后', season: '春' },
      { id: 6, name: '谷雨', date: '4月20日前后', season: '春' },
      { id: 7, name: '立夏', date: '5月6日前后', season: '夏' },
      { id: 8, name: '小满', date: '5月21日前后', season: '夏' },
      { id: 9, name: '芒种', date: '6月6日前后', season: '夏' },
      { id: 10, name: '夏至', date: '6月21日前后', season: '夏' },
      { id: 11, name: '小暑', date: '7月7日前后', season: '夏' },
      { id: 12, name: '大暑', date: '7月23日前后', season: '夏' },
      { id: 13, name: '立秋', date: '8月8日前后', season: '秋' },
      { id: 14, name: '处暑', date: '8月23日前后', season: '秋' },
      { id: 15, name: '白露', date: '9月8日前后', season: '秋' },
      { id: 16, name: '秋分', date: '9月23日前后', season: '秋' },
      { id: 17, name: '寒露', date: '10月8日前后', season: '秋' },
      { id: 18, name: '霜降', date: '10月23日前后', season: '秋' },
      { id: 19, name: '立冬', date: '11月7日前后', season: '冬' },
      { id: 20, name: '小雪', date: '11月22日前后', season: '冬' },
      { id: 21, name: '大雪', date: '12月7日前后', season: '冬' },
      { id: 22, name: '冬至', date: '12月22日前后', season: '冬' },
      { id: 23, name: '小寒', date: '1月6日前后', season: '冬' },
      { id: 24, name: '大寒', date: '1月20日前后', season: '冬' }
    ],
    selectedTerm: null,
    loading: false
  }),
  
  actions: {
    setSelectedTerm(term) {
      this.selectedTerm = term
    },
    
    getSeasonalFoods(season) {
      const seasonalFoods = {
        '春': ['芽菜', '菠菜', '春笋', '荠菜', '香椿', '枸杞', '菊花'],
        '夏': ['苦瓜', '莲子', '薄荷', '赤小豆', '西瓜', '绿豆', '金银花'],
        '秋': ['山药', '芡实', '白芍', '白萝卜', '百合', '石斛', '甘蔗'],
        '冬': ['黑芝麻', '黑豆', '当归', '阿胶', '何首乌', '核桃', '龙眼肉']
      }
      
      return seasonalFoods[season] || []
    }
  }
})

// 将节气数据添加到store中
export const useSeasonsStore = defineStore('seasons', {
  state: () => ({
    currentSeason: '立春', // 默认节气
    seasons: [
      '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
      '立夏', '小满', '芒种', '夏至', '小暑', '大暑',
      '立秋', '处暑', '白露', '秋分', '寒露', '霜降',
      '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'
    ],
    seasonDetails: {
      '立春': {
        date: '2月3-5日',
        description: '春季的开始，万物复苏之际',
        climate: '乍暖还寒',
        healthTips: '养肝护肝，饮食宜温补'
      },
      '雨水': {
        date: '2月18-20日',
        description: '雨量增多，降水开始',
        climate: '降雨增多',
        healthTips: '防潮防湿，少食生冷'
      },
      // ... 其他节气的详细信息
    }
  }),
  
  getters: {
    getCurrentSeasonDetails: (state) => {
      return state.seasonDetails[state.currentSeason] || {};
    },
    getSeasonType: (state) => {
      const seasonIndex = state.seasons.indexOf(state.currentSeason);
      return Math.floor(seasonIndex / 6); // 0-春，1-夏，2-秋，3-冬
    }
  },
  
  actions: {
    setCurrentSeason(season) {
      if (this.seasons.includes(season)) {
        this.currentSeason = season;
      }
    },
    
    // 获取当前日期对应的节气
    calculateCurrentSeason() {
      // 简化版本，实际项目中可能需要更精确的计算
      const now = new Date();
      const month = now.getMonth();
      const day = now.getDate();
      
      // 简单映射月份到季节
      const monthToSeasonIndex = {
        0: 22, // 1月 - 小寒/大寒
        1: 0,  // 2月 - 立春/雨水
        2: 2,  // 3月 - 惊蛰/春分
        3: 4,  // 4月 - 清明/谷雨
        4: 6,  // 5月 - 立夏/小满
        5: 8,  // 6月 - 芒种/夏至
        6: 10, // 7月 - 小暑/大暑
        7: 12, // 8月 - 立秋/处暑
        8: 14, // 9月 - 白露/秋分
        9: 16, // 10月 - 寒露/霜降
        10: 18, // 11月 - 立冬/小雪
        11: 20  // 12月 - 大雪/冬至
      };
      
      // 获取基础索引
      let seasonIndex = monthToSeasonIndex[month];
      
      // 根据日期调整索引
      if (day >= 15) {
        seasonIndex += 1;
      }
      
      // 确保索引在有效范围内
      seasonIndex = seasonIndex % this.seasons.length;
      
      this.currentSeason = this.seasons[seasonIndex];
      return this.currentSeason;
    }
  }
}); 