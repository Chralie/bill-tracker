const util = require('../../utils/util.js');

const COLOR_COUNT = 8;

// 缓存分类图标，避免每次都查数据库
let categoryIconMap = {};
let categoriesLoaded = false;

Page({
  data: {
    periodType: 'month',
    currentPeriod: '',
    periodStart: '',
    periodEnd: '',
    periodLabel: '',
    dateRangeText: '',
    canGoNext: true,

    totalExpense: 0,
    totalIncome: 0,
    balance: 0,
    avgDailyExpense: 0,
    recordCount: 0,
    reachedLimit: false,

    expenseCategories: [],
    incomeCategories: [],
    dailyTotals: [],

    loading: true,
    error: false,
    errorMsg: '',
  },

  onLoad() {
    this.setData({ currentPeriod: util.getCurrentMonth() });
    this.loadCategories().then(() => this.loadData());
  },

  onShow() {
    this.loadCategories().then(() => this.loadData());
  },

  onPullDownRefresh() {
    this.loadCategories().then(() => this.loadData()).then(() => wx.stopPullDownRefresh());
  },

  async loadCategories() {
    if (categoriesLoaded) return;
    try {
      const db = wx.cloud.database();
      const res = await db.collection('categories')
        .orderBy('sort_order', 'asc')
        .limit(50)
        .get();
      categoryIconMap = {};
      res.data.forEach(c => {
        categoryIconMap[c._id] = c.icon || '📌';
      });
      categoriesLoaded = true;
    } catch (err) {
      console.error('加载分类失败', err);
    }
  },

  // 周期类型切换
  onPeriodTypeChange(e) {
    const type = e.currentTarget.dataset.type;
    if (type === this.data.periodType) return;
    const now = new Date();
    let currentPeriod;
    if (type === 'week') {
      currentPeriod = util.getMonday(util.formatDate(now));
    } else if (type === 'month') {
      currentPeriod = util.getCurrentMonth();
    } else {
      currentPeriod = String(now.getFullYear());
    }
    this.setData({ periodType: type, currentPeriod });
    this.loadData();
  },

  // 上一周期
  onPrevPeriod() {
    const { periodType, currentPeriod } = this.data;
    let newPeriod;
    if (periodType === 'week') {
      newPeriod = util.addWeeks(currentPeriod, -1);
    } else if (periodType === 'month') {
      newPeriod = util.addMonths(currentPeriod, -1);
    } else {
      newPeriod = util.addYears(currentPeriod, -1);
    }
    this.setData({ currentPeriod: newPeriod });
    this.loadData();
  },

  // 下一周期
  onNextPeriod() {
    if (!this.data.canGoNext) return;
    const { periodType, currentPeriod } = this.data;
    let newPeriod;
    if (periodType === 'week') {
      newPeriod = util.addWeeks(currentPeriod, 1);
    } else if (periodType === 'month') {
      newPeriod = util.addMonths(currentPeriod, 1);
    } else {
      newPeriod = util.addYears(currentPeriod, 1);
    }
    this.setData({ currentPeriod: newPeriod });
    this.loadData();
  },

  // 底部导航
  onNavTap(e) {
    const page = e.currentTarget.dataset.page;
    if (page === 'statistics') return;
    wx.redirectTo({ url: `/pages/${page}/${page}` });
  },

  async loadData() {
    const { periodType, currentPeriod } = this.data;
    let periodStart, periodEnd, periodLabel, dateRangeText, dayCount;

    // 计算周期范围
    if (periodType === 'week') {
      const range = util.getWeekRange(currentPeriod);
      periodStart = range.start;
      periodEnd = range.end + ' 23:59';
      const [y, m] = periodStart.split('-');
      periodLabel = `${parseInt(m)}月${parseInt(periodStart.slice(8, 10))}日 - ${parseInt(range.end.slice(8, 10))}日`;
      dateRangeText = `${range.start} ~ ${range.end}`;
      dayCount = 7;
    } else if (periodType === 'month') {
      const range = util.getMonthRange(currentPeriod);
      periodStart = range.start;
      periodEnd = range.end + ' 23:59';
      const [y, m] = currentPeriod.split('-');
      periodLabel = `${y}年${parseInt(m)}月`;
      dateRangeText = `${range.start} ~ ${range.end}`;
      dayCount = util.getDaysInMonth(currentPeriod);
    } else {
      const range = util.getYearRange(currentPeriod);
      periodStart = range.start;
      periodEnd = range.end + ' 23:59';
      periodLabel = `${currentPeriod}年`;
      dateRangeText = `${range.start} ~ ${range.end}`;
      dayCount = 365;
    }

    // 判断是否可以翻到下一周期
    const today = util.getToday();
    let canGoNext;
    if (periodType === 'week') {
      const nextMonday = util.addWeeks(periodStart, 1);
      canGoNext = nextMonday <= today;
    } else if (periodType === 'month') {
      const [ny, nm] = util.addMonths(currentPeriod, 1).split('-').map(Number);
      const nextStart = `${ny}-${String(nm).padStart(2, '0')}-01`;
      canGoNext = nextStart <= today;
    } else {
      const nextYear = parseInt(currentPeriod, 10) + 1;
      canGoNext = `${nextYear}-01-01` <= today;
    }

    try {
      const db = wx.cloud.database();
      const _ = db.command;
      const res = await db.collection('billing_records')
        .where({
          record_date: _.gte(periodStart).and(_.lte(periodEnd))
        })
        .orderBy('record_date', 'desc')
        .limit(100)
        .get();

      const records = res.data;
      const reachedLimit = records.length === 100;

      // 按分类聚合
      const expenseMap = {};
      const incomeMap = {};
      let totalExpense = 0;
      let totalIncome = 0;
      const dailyMap = {};

      records.forEach(r => {
        if (r.type === 'expense') {
          totalExpense += r.amount;
          if (!expenseMap[r.category_id]) {
            expenseMap[r.category_id] = { name: r.category_name, icon: categoryIconMap[r.category_id] || '📌', total: 0 };
          }
          expenseMap[r.category_id].total += r.amount;
        } else {
          totalIncome += r.amount;
          if (!incomeMap[r.category_id]) {
            incomeMap[r.category_id] = { name: r.category_name, icon: categoryIconMap[r.category_id] || '📌', total: 0 };
          }
          incomeMap[r.category_id].total += r.amount;
        }

        // 按日期聚合（取前10位 YYYY-MM-DD）
        const dateKey = r.record_date.slice(0, 10);
        if (!dailyMap[dateKey]) {
          dailyMap[dateKey] = { expense: 0, income: 0 };
        }
        if (r.type === 'expense') {
          dailyMap[dateKey].expense += r.amount;
        } else {
          dailyMap[dateKey].income += r.amount;
        }
      });

      // 整理分类数组
      const sortByTotal = (a, b) => b.total - a.total;
      const expenseCategories = Object.values(expenseMap)
        .map((c, i) => ({
          ...c,
          percent: totalExpense > 0 ? Math.round((c.total / totalExpense) * 100) : 0,
          colorIndex: i % COLOR_COUNT,
        }))
        .sort(sortByTotal);

      const incomeCategories = Object.values(incomeMap)
        .map((c, i) => ({
          ...c,
          percent: totalIncome > 0 ? Math.round((c.total / totalIncome) * 100) : 0,
          colorIndex: i % COLOR_COUNT,
        }))
        .sort(sortByTotal);

      // 生成每日/每月趋势数据
      const dailyTotals = [];
      if (periodType === 'year') {
        const maxYearExpense = Math.max(1, ...Array.from({ length: 12 }, (_, m) => {
          const prefix = `${currentPeriod}-${String(m + 1).padStart(2, '0')}`;
          return Object.keys(dailyMap)
            .filter(d => d.startsWith(prefix))
            .reduce((s, d) => s + dailyMap[d].expense, 0);
        }));
        for (let m = 1; m <= 12; m++) {
          const prefix = `${currentPeriod}-${String(m).padStart(2, '0')}`;
          let expense = 0, income = 0;
          Object.keys(dailyMap).forEach(d => {
            if (d.startsWith(prefix)) {
              expense += dailyMap[d].expense;
              income += dailyMap[d].income;
            }
          });
          dailyTotals.push({
            label: util.getMonthLabel(m),
            expense,
            income,
            barPercent: Math.round((expense / maxYearExpense) * 100),
          });
        }
      } else {
        // 周视图：生成7天，月视图：生成N天
        const range = periodType === 'week' ? util.getWeekRange(currentPeriod) : util.getMonthRange(currentPeriod);
        const startD = new Date(range.start);
        const endD = new Date(range.end);
        const maxExpense = Math.max(1, ...Object.values(dailyMap).map(d => d.expense));
        for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
          const dateStr = util.formatDate(d);
          const dayData = dailyMap[dateStr] || { expense: 0, income: 0 };
          dailyTotals.push({
            date: dateStr,
            label: periodType === 'week' ? util.getDayLabel(dateStr) : d.getDate() + '日',
            expense: dayData.expense,
            income: dayData.income,
            barPercent: Math.round((dayData.expense / maxExpense) * 100),
          });
        }
      }

      const balance = totalIncome - totalExpense;
      const avgDailyExpense = Math.round(totalExpense / dayCount);

      this.setData({
        periodStart,
        periodEnd,
        periodLabel,
        dateRangeText,
        canGoNext,
        totalExpense,
        totalIncome,
        balance,
        avgDailyExpense,
        recordCount: records.length,
        reachedLimit,
        expenseCategories,
        incomeCategories,
        dailyTotals,
        loading: false,
        error: false,
      });
    } catch (err) {
      console.error('加载统计数据失败', err);
      this.setData({
        loading: false,
        error: true,
        errorMsg: '加载失败，请下拉重试',
      });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },
});
