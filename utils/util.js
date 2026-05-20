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

/**
 * 获取当前时间 HH:mm
 * @returns {string}
 */
function getCurrentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

/**
 * 获取指定日期所在周的周一日期
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {string} YYYY-MM-DD
 */
function getMonday(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return formatDate(d);
}

/**
 * 获取周的日期范围（周一到周日）
 * @param {string} dateStr - 该周内的任意日期 YYYY-MM-DD
 * @returns {{ start: string, end: string }}
 */
function getWeekRange(dateStr) {
  const monday = getMonday(dateStr);
  const d = new Date(monday);
  d.setDate(d.getDate() + 6);
  return { start: monday, end: formatDate(d) };
}

/**
 * 获取月的日期范围
 * @param {string} yearMonth - YYYY-MM
 * @returns {{ start: string, end: string }}
 */
function getMonthRange(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return {
    start: `${yearMonth}-01`,
    end: `${yearMonth}-${String(lastDay).padStart(2, '0')}`,
  };
}

/**
 * 获取年的日期范围
 * @param {number|string} year
 * @returns {{ start: string, end: string }}
 */
function getYearRange(year) {
  const y = typeof year === 'string' ? parseInt(year, 10) : year;
  return { start: `${y}-01-01`, end: `${y}-12-31` };
}

/**
 * 日期加减周数
 * @param {string} dateStr - YYYY-MM-DD
 * @param {number} n - 周数（正数向后，负数向前）
 * @returns {string} YYYY-MM-DD
 */
function addWeeks(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n * 7);
  return formatDate(d);
}

/**
 * 月份加减
 * @param {string} yearMonth - YYYY-MM
 * @param {number} n - 月数
 * @returns {string} YYYY-MM
 */
function addMonths(yearMonth, n) {
  const [year, month] = yearMonth.split('-').map(Number);
  const d = new Date(year, month - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * 年份加减
 * @param {string} yearStr - YYYY
 * @param {number} n
 * @returns {string} YYYY
 */
function addYears(yearStr, n) {
  return String(parseInt(yearStr, 10) + n);
}

/**
 * 获取中文星期标签
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {string} 周一 ~ 周日
 */
function getDayLabel(dateStr) {
  const labels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const d = new Date(dateStr);
  return labels[d.getDay()];
}

/**
 * 获取中文月份标签
 * @param {string|number} month - 月份 (1-12)
 * @returns {string} 1月 ~ 12月
 */
function getMonthLabel(month) {
  const m = typeof month === 'string' ? parseInt(month, 10) : month;
  return `${m}月`;
}

/**
 * 获取指定月份的天数
 * @param {string} yearMonth - YYYY-MM
 * @returns {number}
 */
function getDaysInMonth(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

module.exports = {
  formatAmount,
  yuanToCents,
  formatDate,
  getToday,
  getCurrentMonth,
  getCurrentTime,
  getMonday,
  getWeekRange,
  getMonthRange,
  getYearRange,
  addWeeks,
  addMonths,
  addYears,
  getDayLabel,
  getMonthLabel,
  getDaysInMonth,
};
