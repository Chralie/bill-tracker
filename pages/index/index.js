// pages/index/index.js - 首页：账单列表 + 月度统计
const util = require('../../utils/util.js');
const db = wx.cloud.database();

Page({
  data: {
    currentMonth: util.getCurrentMonth(),
    totalExpense: 0,    // 本月总支出（分）
    totalIncome: 0,     // 本月总收入（分）
    recordList: [],     // 账单列表
    loading: false,
    hasMore: true,      // 是否还有更多数据
  },

  onLoad() {
    this.loadRecords();
  },

  onShow() {
    // 每次回到首页时刷新数据
    this.loadRecords();
  },

  onPullDownRefresh() {
    this.loadRecords().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreRecords();
    }
  },

  // 加载本月账单记录
  async loadRecords() {
    this.setData({ loading: true });

    try {
      const month = this.data.currentMonth;
      const res = await db.collection('billing_records')
        .where({
          record_date: db.RegExp({
            regexp: `^${month}`,
            options: 'i',
          }),
        })
        .orderBy('record_date', 'desc')
        .orderBy('create_time', 'desc')
        .limit(20)
        .get();

      const records = res.data;
      const totalExpense = records
        .filter(r => r.type === 'expense')
        .reduce((sum, r) => sum + r.amount, 0);
      const totalIncome = records
        .filter(r => r.type === 'income')
        .reduce((sum, r) => sum + r.amount, 0);

      this.setData({
        recordList: records,
        totalExpense,
        totalIncome,
        loading: false,
        hasMore: records.length >= 20,
      });
    } catch (err) {
      console.error('加载账单失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  // 加载更多（滚动到底部）
  async loadMoreRecords() {
    // TODO: 实现分页加载
  },

  // 跳转到记一笔页面
  goToAddRecord() {
    wx.navigateTo({
      url: '/pages/add-record/add-record',
    });
  },

  // 切换月份
  onMonthChange(e) {
    const month = e.detail.value;
    this.setData({ currentMonth: month }, () => {
      this.loadRecords();
    });
  },
});
