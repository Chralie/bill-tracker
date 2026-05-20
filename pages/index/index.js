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
    loadingMore: false, // 加载更多中
    hasMore: true,      // 是否还有更多数据
    swipedId: '',       // 当前左滑打开的记录 _id
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
    if (this.data.hasMore && !this.data.loading && !this.data.loadingMore) {
      this.loadMoreRecords();
    }
  },

  // 加载本月账单记录（统计 + 首页列表）
  async loadRecords() {
    this.setData({ loading: true });
    this._skip = 0;

    try {
      const month = this.data.currentMonth;
      const whereClause = {
        record_date: db.RegExp({ regexp: `^${month}`, options: 'i' }),
      };

      // 并行：全量统计查询 + 首页 20 条列表
      const [statsRes, listRes] = await Promise.all([
        db.collection('billing_records').where(whereClause).limit(200).get(),
        db.collection('billing_records')
          .where(whereClause)
          .orderBy('record_date', 'desc')
          .orderBy('create_time', 'desc')
          .limit(20)
          .get(),
      ]);

      const allRecords = statsRes.data;
      const totalExpense = allRecords
        .filter(r => r.type === 'expense')
        .reduce((sum, r) => sum + r.amount, 0);
      const totalIncome = allRecords
        .filter(r => r.type === 'income')
        .reduce((sum, r) => sum + r.amount, 0);

      const records = listRes.data.map(r => ({
        ...r,
        _translateX: 0,
        _hasTransition: false,
      }));

      this.setData({
        recordList: records,
        totalExpense,
        totalIncome,
        loading: false,
        hasMore: listRes.data.length >= 20,
      });
    } catch (err) {
      console.error('加载账单失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  // 加载更多（滚动到底部）
  async loadMoreRecords() {
    if (this.data.loadingMore || !this.data.hasMore) return;
    this.setData({ loadingMore: true });

    try {
      this._skip += 20;
      const month = this.data.currentMonth;
      const res = await db.collection('billing_records')
        .where({
          record_date: db.RegExp({ regexp: `^${month}`, options: 'i' }),
        })
        .orderBy('record_date', 'desc')
        .orderBy('create_time', 'desc')
        .skip(this._skip)
        .limit(20)
        .get();

      const newRecords = res.data.map(r => ({
        ...r,
        _translateX: 0,
        _hasTransition: false,
      }));

      this.setData({
        recordList: [...this.data.recordList, ...newRecords],
        loadingMore: false,
        hasMore: newRecords.length >= 20,
      });
    } catch (err) {
      console.error('加载更多失败:', err);
      this.setData({ loadingMore: false });
    }
  },

  // 左滑 - 触摸开始
  onTouchStart(e) {
    const id = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;

    this._touchStartX = e.touches[0].clientX;
    this._touchStartY = e.touches[0].clientY;
    this._swipeItemId = id;
    this._swipeItemIndex = index;
    this._swiping = false;

    // 如果另一条记录已打开，先关闭它
    if (this.data.swipedId && this.data.swipedId !== id) {
      const openIndex = this.data.recordList.findIndex(r => r._id === this.data.swipedId);
      if (openIndex >= 0) {
        this.setData({
          [`recordList[${openIndex}]._translateX`]: 0,
          [`recordList[${openIndex}]._hasTransition`]: true,
          swipedId: '',
        });
      }
    }
  },

  // 左滑 - 触摸移动（跟手）
  onTouchMove(e) {
    if (this._swipeItemIndex === undefined) return;

    const deltaX = e.touches[0].clientX - this._touchStartX;
    const deltaY = e.touches[0].clientY - this._touchStartY;

    if (!this._swiping) {
      if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
        this._swiping = true;
      } else if (Math.abs(deltaY) > 10) {
        this._swipeItemIndex = undefined;
        return;
      } else {
        return;
      }
    }

    const offset = Math.max(-280, Math.min(0, deltaX));
    this.setData({
      [`recordList[${this._swipeItemIndex}]._translateX`]: offset,
    });
  },

  // 左滑 - 触摸结束（自动吸边）
  onTouchEnd(e) {
    if (!this._swiping || this._swipeItemIndex === undefined) {
      this._swipeItemIndex = undefined;
      this._swiping = false;
      return;
    }

    const id = this._swipeItemId;
    const index = this._swipeItemIndex;
    const currentOffset = this.data.recordList[index]._translateX;

    this._swipeItemIndex = undefined;
    this._swiping = false;

    if (currentOffset < -140) {
      this.setData({
        [`recordList[${index}]._translateX`]: -280,
        [`recordList[${index}]._hasTransition`]: true,
        swipedId: id,
      });
    } else {
      this.setData({
        [`recordList[${index}]._translateX`]: 0,
        [`recordList[${index}]._hasTransition`]: true,
        swipedId: '',
      });
    }
  },

  // 点击记录项 - 关闭已打开的滑动
  onRecordTap(e) {
    if (this.data.swipedId) {
      const id = e.currentTarget.dataset.id;
      if (id !== this.data.swipedId) {
        const openIndex = this.data.recordList.findIndex(r => r._id === this.data.swipedId);
        if (openIndex >= 0) {
          this.setData({
            [`recordList[${openIndex}]._translateX`]: 0,
            [`recordList[${openIndex}]._hasTransition`]: true,
            swipedId: '',
          });
        }
      }
    }
  },

  // 编辑账单记录
  onEditRecord(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ swipedId: '' });
    wx.navigateTo({
      url: `/pages/add-record/add-record?id=${id}`,
    });
  },

  // 删除账单记录
  async onDeleteRecord(e) {
    const id = e.currentTarget.dataset.id;

    const confirm = await wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
    });

    if (!confirm.confirm) return;

    try {
      await db.collection('billing_records').doc(id).remove();
      wx.showToast({ title: '已删除', icon: 'success' });
      this.setData({ swipedId: '' });
      this.loadRecords();
    } catch (err) {
      console.error('删除记录失败:', err);
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
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

  // 底部导航
  onNavTap(e) {
    const page = e.currentTarget.dataset.page;
    if (page === 'index') return;
    wx.redirectTo({ url: `/pages/${page}/${page}` });
  },
});
