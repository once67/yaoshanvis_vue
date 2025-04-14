/**
 * 返回资源的完整路径，自动添加base前缀
 * @param {string} path - 相对于public目录的资源路径
 * @returns {string} - 带有BASE_URL前缀的完整路径
 */
export const getAssetPath = (path) => {
  // 确保path以/开头
  const formattedPath = path.startsWith('/') ? path : `/${path}`;
  // 拼接BASE_URL和路径
  return `${import.meta.env.BASE_URL}${formattedPath.substring(1)}`;
};

/**
 * 返回图片的完整路径
 * @param {string} path - 图片的相对路径
 * @returns {string} - 带有BASE_URL前缀的完整图片路径
 */
export const getImagePath = (path) => {
  return getAssetPath(path);
};

/**
 * 返回数据文件的完整路径
 * @param {string} path - 数据文件的相对路径
 * @returns {string} - 带有BASE_URL前缀的完整数据文件路径
 */
export const getDataPath = (path) => {
  return getAssetPath(path);
}; 