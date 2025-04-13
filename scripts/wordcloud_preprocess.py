import json
from collections import Counter

import jieba


def preprocess_wordcloud_data(input_file, output_file):
    # 读取原始数据
    with open(input_file, 'r', encoding='utf-8') as f:
        herbal_data = json.load(f)
    
    # 停用词列表
    stop_words = {
        '的', '和', '与', '或', '及', '能', '可', '为', 
        '一', '不', '在', '有', '是', '了', '很', '都', 
        '就', '又', '及时', '通过', '使', '因为', '所以'
    }
    
    # 存储所有分词结果
    all_words = []
    
    # 遍历每个药材
    for herb in herbal_data:
        # 尝试获取功效信息
        effects = herb.get('effects', '') or herb.get('effect', '')
        
        # 如果effects是列表，转换为字符串
        if isinstance(effects, list):
            effects = ''.join(effects)
        
        # 分词
        words = jieba.cut(effects, cut_all=False)
        
        # 过滤停用词和单字
        filtered_words = [
            word for word in words 
            if word not in stop_words and len(word) > 1
        ]
        
        all_words.extend(filtered_words)
    
    # 统计词频
    word_freq = Counter(all_words)
    
    # 排序并取前100个词
    top_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:100]
    
    # 转换为词云所需格式
    wordcloud_data = [
        {"name": word, "value": freq} 
        for word, freq in top_words
    ]
    
    # 保存结果
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(wordcloud_data, f, ensure_ascii=False, indent=2)
    
    print(f"处理完成，共生成{len(wordcloud_data)}个词")
    return wordcloud_data

# 示例使用
if __name__ == "__main__":
    input_file = '../public/data/herbal_detailed_data.json'
    output_file = '../public/data/wordcloud_data.json'
    preprocess_wordcloud_data(input_file, output_file) 