/**
 * 金额：分 → 元
 * @param {number} cents - 金额（分）
 * @returns {string} 格式化的金额（元），保留两位小数
 */
function formatAmount(cents) {
  const yuan = (cents / 100).toFixed(2);
  return yuan;
}

/**
 * 金额：元 → 分
 * @param {number} yuan - 金额（元）
 * @returns {number} 金额（分）
 */
function yuanToCents(yuan) {
  return Math.round(yuan * 100);
}

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {Date} date - 日期对象
 * @returns {string}
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 获取今天的日期字符串
 * @returns {string} YYYY-MM-DD
 */
function getToday() {
  return formatDate(new Date());
}

/**
 * 获取当前月份 YYYY-MM
 * @returns {string}
 */
function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

module.exports = {
  formatAmount,
  yuanToCents,
  formatDate,
  getToday,
  getCurrentMonth,
};
