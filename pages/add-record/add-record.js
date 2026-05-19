// pages/add-record/add-record.js - 记一笔
const util = require('../../utils/util.js');
const db = wx.cloud.database();

Page({
  data: {
    // 表单字段
    amount: '',           // 金额（元，字符串便于输入）
    type: 'expense',      // expense | income
    categoryIndex: 0,     // 分类选中索引
    categories: [],       // 分类列表
    recordDate: util.getToday(),
    note: '',

    // 编辑模式
    isEdit: false,
    editId: '',

    // 提交中
    submitting: false,
  },

  onLoad(options) {
    // 如果是编辑模式，接收参数
    if (options.id) {
      this.setData({ isEdit: true, editId: options.id });
      this.loadRecord(options.id);
    }
    this.loadCategories();
  },

  // 加载分类列表
  async loadCategories() {
    try {
      const res = await db.collection('categories')
        .orderBy('sort_order', 'asc')
        .get();

      if (res.data.length > 0) {
        this.setData({ categories: res.data });
      } else {
        // 首次使用，初始化预设分类
        this.initPresetCategories();
      }
    } catch (err) {
      console.error('加载分类失败:', err);
      this.initPresetCategories();
    }
  },

  // 初始化预设分类
  async initPresetCategories() {
    const presets = [
      { name: '餐饮', icon: '🍽️', type: 'expense', is_preset: true, sort_order: 1 },
      { name: '交通', icon: '🚗', type: 'expense', is_preset: true, sort_order: 2 },
      { name: '购物', icon: '🛍️', type: 'expense', is_preset: true, sort_order: 3 },
      { name: '居住', icon: '🏠', type: 'expense', is_preset: true, sort_order: 4 },
      { name: '娱乐', icon: '🎮', type: 'expense', is_preset: true, sort_order: 5 },
      { name: '医疗', icon: '💊', type: 'expense', is_preset: true, sort_order: 6 },
      { name: '其他支出', icon: '📌', type: 'expense', is_preset: true, sort_order: 7 },
      { name: '工资', icon: '💰', type: 'income', is_preset: true, sort_order: 8 },
      { name: '兼职', icon: '💼', type: 'income', is_preset: true, sort_order: 9 },
      { name: '其他收入', icon: '📌', type: 'income', is_preset: true, sort_order: 10 },
    ];

    try {
      const promises = presets.map(cat => db.collection('categories').add({ data: cat }));
      await Promise.all(promises);
      const res = await db.collection('categories')
        .orderBy('sort_order', 'asc')
        .get();
      this.setData({ categories: res.data });
    } catch (err) {
      console.error('初始化预设分类失败:', err);
    }
  },

  // 加载待编辑的记录
  async loadRecord(id) {
    // TODO
  },

  // 金额输入
  onAmountInput(e) {
    this.setData({ amount: e.detail.value });
  },

  // 备注输入
  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },

  // 切换收支类型
  onTypeChange(e) {
    const type = e.currentTarget.dataset.type;
    if (type === this.data.type) return;
    this.setData({ type, categoryIndex: 0 });
  },

  // 选择分类
  onCategorySelect(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ categoryIndex: index });
  },

  // 选择日期
  onDateChange(e) {
    this.setData({ recordDate: e.detail.value });
  },

  // 提交
  async onSubmit() {
    const { amount, type, categories, categoryIndex, recordDate, note, submitting } = this.data;

    if (submitting) return;

    // 表单校验
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      wx.showToast({ title: '请输入有效金额', icon: 'none' });
      return;
    }

    const selectedCategory = categories[categoryIndex];
    if (!selectedCategory) {
      wx.showToast({ title: '请选择分类', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    try {
      await db.collection('billing_records').add({
        data: {
          amount: util.yuanToCents(amountNum),
          type,
          category_id: selectedCategory._id,
          category_name: selectedCategory.name,
          record_date: recordDate,
          note: note.trim() || '',
          create_time: new Date(),
        },
      });

      wx.showToast({ title: '记账成功', icon: 'success' });
      // 延迟返回，让用户看到成功提示
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    } catch (err) {
      console.error('保存失败:', err);
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  // 获取当前类型的分类
  getCategoriesByType() {
    return this.data.categories.filter(cat => cat.type === this.data.type);
  },
});
