// pages/category-manage/category-manage.js - 分类管理
const db = wx.cloud.database();

Page({
  data: {
    expenseCategories: [],
    incomeCategories: [],
    showAddDialog: false,
    newCategoryName: '',
    addType: 'expense',
  },

  onLoad() {
    this.loadCategories();
  },

  onShow() {
    this.loadCategories();
  },

  async loadCategories() {
    try {
      const res = await db.collection('categories')
        .orderBy('sort_order', 'asc')
        .get();

      const expenseCategories = res.data.filter(c => c.type === 'expense');
      const incomeCategories = res.data.filter(c => c.type === 'income');

      this.setData({ expenseCategories, incomeCategories });
    } catch (err) {
      console.error('加载分类失败:', err);
    }
  },

  // 显示添加分类弹窗
  showAdd(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      showAddDialog: true,
      addType: type,
      newCategoryName: '',
    });
  },

  // 隐藏添加分类弹窗
  hideAdd() {
    this.setData({ showAddDialog: false, newCategoryName: '' });
  },

  // 输入分类名称
  onNameInput(e) {
    this.setData({ newCategoryName: e.detail.value });
  },

  // 添加自定义分类
  async addCategory() {
    const name = this.data.newCategoryName.trim();
    if (!name) {
      wx.showToast({ title: '请输入分类名称', icon: 'none' });
      return;
    }

    try {
      const sortOrder = this.data.addType === 'expense'
        ? this.data.expenseCategories.length + 1
        : this.data.incomeCategories.length + 1;

      await db.collection('categories').add({
        data: {
          name,
          icon: '📌',
          type: this.data.addType,
          is_preset: false,
          sort_order: sortOrder,
        },
      });

      wx.showToast({ title: '添加成功', icon: 'success' });
      this.hideAdd();
      this.loadCategories();
    } catch (err) {
      console.error('添加分类失败:', err);
      wx.showToast({ title: '添加失败', icon: 'none' });
    }
  },

  // 删除分类
  async deleteCategory(e) {
    const { id, name } = e.currentTarget.dataset;

    const confirm = await wx.showModal({
      title: '确认删除',
      content: `确定要删除"${name}"分类吗？`,
    });

    if (!confirm.confirm) return;

    try {
      await db.collection('categories').doc(id).remove();
      wx.showToast({ title: '已删除', icon: 'success' });
      this.loadCategories();
    } catch (err) {
      console.error('删除分类失败:', err);
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  },

});
