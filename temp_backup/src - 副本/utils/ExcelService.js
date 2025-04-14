// Excel数据处理工具类
import * as XLSX from 'xlsx';
import { getDataPath } from './paths';

/**
 * Excel服务工具类
 * 用于处理Excel文件导入导出功能
 */
class ExcelService {
  /**
   * 从Excel文件中读取药膳数据
   * @param {string} filePath - Excel文件路径
   * @returns {Promise<Array>} 处理后的药膳数据数组
   */
  static async importYaoshanData(filePath) {
    try {
      console.log('开始从Excel读取药膳数据:', filePath);
      // 使用fetch加载文件并添加正确的路径前缀
      const fullPath = getDataPath(filePath);
      console.log('请求完整路径:', fullPath);
      const response = await fetch(fullPath);
      const arrayBuffer = await response.arrayBuffer();
      
      // 解析Excel文件
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // 将数据转换为JSON
      const rawData = XLSX.utils.sheet_to_json(worksheet);
      console.log('Excel原始数据读取完成, 条目数:', rawData.length);
      
      // 处理数据格式
      const processedData = rawData.map((item, index) => {
        // 提取药材并格式化为数组
        const ingredients = [];
        if (item['药材']) {
          const herbsText = item['药材'].toString();
          const herbs = herbsText.split(/[,，、]/);
          herbs.forEach(herb => {
            const trimmedHerb = herb.trim();
            if (trimmedHerb) {
              // 从药材文本中提取名称和用量
              const match = trimmedHerb.match(/(.+?)([0-9]+克|[0-9]+g|适量|少许|[0-9]+片|[0-9]+粒)?$/);
              if (match) {
                const name = match[1].trim();
                const amount = (match[2] || '适量').trim();
                ingredients.push({ name, amount });
              } else {
                ingredients.push({ name: trimmedHerb, amount: '适量' });
              }
            }
          });
        }
        
        // 处理食材
        const foodIngredients = [];
        if (item['食材']) {
          const foodsText = item['食材'].toString();
          const foods = foodsText.split(/[,，、]/);
          foods.forEach(food => {
            const trimmedFood = food.trim();
            if (trimmedFood) {
              // 从食材文本中提取名称和用量
              const match = trimmedFood.match(/(.+?)([0-9]+克|[0-9]+g|适量|少许|[0-9]+片|[0-9]+粒)?$/);
              if (match) {
                const name = match[1].trim();
                const amount = (match[2] || '适量').trim();
                foodIngredients.push({ name, amount });
              } else {
                foodIngredients.push({ name: trimmedFood, amount: '适量' });
              }
            }
          });
        }
        
        // 提取功效标签
        const effectTags = [];
        if (item['功效']) {
          const effectText = item['功效'].toString();
          // 提取短语作为标签（通常是逗号分隔的短语）
          const tags = effectText.split(/[,，、；;]/);
          tags.forEach(tag => {
            const trimmedTag = tag.trim();
            if (trimmedTag && trimmedTag.length < 15) { // 过滤过长的描述，只保留短标签
              effectTags.push(trimmedTag);
            }
          });
        }
        
        // 生成唯一ID
        const id = index + 1;
        
        // 构造处理后的数据对象
        return {
          id,
          name: item['药膳名'] || `未命名药膳${id}`,
          source: '',
          ingredients, // 药材数组
          foodIngredients, // 食材数组
          effects: item['功效'] || '',
          effectTags, // 功效标签数组
          preparation: item['做法'] || '',
          usage: item['食法'] || '',
          suitableFor: [], // 适用体质（后续可基于功效推断）
          wuxingLogic: '', // 五行配伍逻辑（需要后续分析）
          url: item['URL'] || ''
        };
      });
      
      console.log('药膳数据处理完成, 处理后条目数:', processedData.length);
      return processedData;
    } catch (error) {
      console.error('Excel数据导入错误:', error);
      throw error;
    }
  }
  
  /**
   * 分析药膳数据，提取分类信息
   * @param {Array} recipesData - 药膳数据数组
   * @returns {Object} 包含分类信息的对象
   */
  static analyzeCategories(recipesData) {
    const categories = {};
    
    // 统计功效标签
    recipesData.forEach(recipe => {
      if (recipe.effectTags && recipe.effectTags.length) {
        recipe.effectTags.forEach(tag => {
          if (!categories[tag]) {
            categories[tag] = {
              name: tag,
              count: 0,
              recipes: []
            };
          }
          categories[tag].count++;
          categories[tag].recipes.push(recipe.id);
        });
      }
    });
    
    // 转换为数组并按数量排序
    const categoryArray = Object.values(categories).sort((a, b) => b.count - a.count);
    
    // 只返回前10个主要分类
    return categoryArray.slice(0, 10);
  }
}

export default ExcelService; 