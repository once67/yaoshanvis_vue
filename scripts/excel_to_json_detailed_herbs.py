import json

import pandas as pd

# 读取Excel文件
df = pd.read_excel('../public/data/final_herbal_data_by_id.xlsx')

# 替换所有的 NaN 值为空字符串
df = df.fillna('')

# 将数据转换为字典列表
data = df.to_dict('records')

# 将数据保存为JSON文件
with open('../public/data/herbal_detailed_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("转换完成！详细药材数据已保存到 herbal_detailed_data.json") 