# 极简记账本

## 项目概述

个人财务记录微信小程序。核心功能：记账、查看账单、分类管理、统计分析。目标用户为个人使用。

## 技术栈

- **框架**：微信小程序原生框架
- **语言**：JavaScript
- **样式**：原生 WXSS
- **后端/数据**：微信云开发（云数据库，无云函数）
- **图表**：纯 CSS（conic-gradient 环形图、div 柱状图/进度条），无第三方库
- **AppID**：wxba67fb0e0a2a1673
- **GitHub**：git@github.com:Chralie/bill-tracker.git

## 页面清单（4 页）

### 1. 首页 `pages/index/index` — 账单列表
- 月度统计卡片（绿色渐变：支出/收入/结余）
- 月份切换选择器（picker mode="date" fields="month"）
- 账单记录列表（按 record_date desc 排序，limit 20）
- 左滑操作：跟手滑动 → 吸边，露出编辑（橙色）和删除（红色）按钮
- 下拉刷新
- **已知问题**：统计仅基于前 20 条记录计算，超出 20 条时数据不完整；分页未实现

### 2. 统计分析 `pages/statistics/statistics` — 数据分析
- 周期切换：周 / 月 / 年
- 周期导航：◀ 前后翻页 ▶，未来周期置灰
- 绿色渐变汇总卡片：支出/收入/结余/日均支出
- 环形分类占比图（CSS conic-gradient，320→240rpx，中心显示总支出）
- 图例列表：色点 + 分类名 + 金额 + 百分比
- 周视图：7 柱图（已替换为环形图）
- 月视图：每日列表（已替换为环形图）
- 年视图：环形图 + 12 月柱图（横向滚动，260rpx 高，min-width 960rpx）
- 收入分类分布（进度条）
- 数据查询：`record_date` gte/lte 范围查询，limit 100 条
- 100 条上限提示
- 下拉刷新

### 3. 记一笔 `pages/add-record/add-record` — 添加/编辑账单
- 收支类型切换（支出 红色 / 收入 绿色）
- 金额输入（元为单位输入，存储时转为分）
- 分类网格选择（4 列，从 categories 集合加载）
- 日期 + 时间独立选择器
- 备注输入（最长 50 字）
- 编辑模式：通过 URL 参数 `?id=xxx` 传入，加载已有记录
- 右上角 📂 分类管理入口（navigateTo 跳转）
- **重要**：`record_date` 格式为 `"YYYY-MM-DD HH:mm"`（零填充 24 小时制）

### 4. 分类管理 `pages/category-manage/category-manage` — 分类管理
- 支出分类列表 + 收入分类列表
- 添加自定义分类（弹窗输入名称，默认图标 📌）
- 删除自定义分类（预设分类不可删）
- **无底部导航栏**（通过记一笔页面进入，原生返回按钮返回）
- **已知问题**：删除分类后不会更新已有账单记录的 category_id

## 底部导航栏

3 标签，`wx.redirectTo` 切换：

```
[📋 账单] → [📊 统计] → [✏️ 记一笔]
```

- 分类管理不在导航栏中，从记一笔右上角进入
- 每页有独立的 onNavTap handler，guard 判断当前页避免重复跳转

## 云数据库设计

### billing_records（账单记录）

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 自动生成 |
| amount | number | 金额（**分**，整数存储） |
| category_id | string | 分类 ID |
| category_name | string | 分类名称（冗余存储） |
| type | string | 'expense' / 'income' |
| record_date | string | **"YYYY-MM-DD HH:mm"**（零填充，字符串字典序 = 时间序） |
| note | string | 备注，可选 |
| create_time | Date | 创建时间（仅新建时写入，编辑时不更新） |

### categories（分类）

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 自动生成 |
| name | string | 分类名称 |
| icon | string | emoji 图标 |
| type | string | 'expense' / 'income' |
| is_preset | boolean | 预设分类不可删除 |
| sort_order | number | 排序序号 |

**预设分类**：餐饮🍽️ 交通🚗 购物🛍️ 居住🏠 娱乐🎮 医疗💊 其他支出📌 / 工资💰 兼职💼 其他收入📌

## 核心工具函数 `utils/util.js`

| 函数 | 用途 |
|------|------|
| `formatAmount(c)` | 分 → 元字符串 |
| `yuanToCents(y)` | 元 → 分 |
| `formatDate(d)` | Date → "YYYY-MM-DD" |
| `getToday()` | 今天日期字符串 |
| `getCurrentMonth()` | 当前 "YYYY-MM" |
| `getCurrentTime()` | 当前 "HH:mm" |
| `getMonday(d)` | 获取周一日期 |
| `getWeekRange(d)` | 周一至周日范围 |
| `getMonthRange(ym)` | 月初至月末范围 |
| `getYearRange(y)` | 年初至年末范围 |
| `addWeeks/Months/Years()` | 周期加减 |
| `getDayLabel(d)` | 中文星期标签 |
| `getMonthLabel(m)` | "1月"~"12月" |
| `getDaysInMonth(ym)` | 月份天数 |

## 关键技术决策

1. **金额存储**：以"分"为单位整数存储，前端展示时 `/100`
2. **日期存储**：字符串 `"YYYY-MM-DD HH:mm"`，利用零填充特性使字符串字典序 = 时间序，支持 gte/lte 范围查询
3. **无云函数**：全部客户端查询 + 聚合，保持简单
4. **无第三方图表库**：纯 CSS conic-gradient 实现环形图，div 实现柱状图/进度条
5. **导航方式**：底部 3 标签用 redirectTo（替换栈），记一笔→分类管理用 navigateTo（保留返回）
6. **分类入口**：从记一笔右上角进入分类管理，而非底部导航栏独立标签
7. **图标方案**：分类使用 emoji，统计页从 categories 集合加载 icon 做映射
8. **8 色调色板**：`#07c160 #ffa940 #597ef7 #e74c3c #36cfc9 #9254de #f759ab #ffc53d`

## 设计规范

- 主色 `#07c160`（WeChat 绿），危险 `#e74c3c`（红），警告 `#ffa940`（橙）
- 汇总卡片渐变：`linear-gradient(135deg, #07c160, #06ad56)`
- 卡片：12rpx 圆角，24rpx 内边距，白色背景，**无阴影**（平面风格）
- 页面背景：`#f5f5f5`
- 环形图：240rpx 直径，中心孔 120rpx，margin-bottom 16rpx
- 柱状图：260rpx 高，年视图横向滚动 min-width 960rpx
- 容器 padding-bottom：40rpx
- 底部导航：约 80rpx + safe-area，position: fixed

## 待解决问题

1. **首页分页**：`pages/index/index.js:83` TODO，20 条后无法加载更多，统计数据也不完整
2. **云开发环境 ID**：`app.js:12` 仍为占位符 `'your-env-id'`
3. **分类删除级联**：删除分类后已有账单的 category_id 变成孤儿引用
4. **账单记录无 update_time**：无法追踪最后修改时间
5. **金额除以 100 无 2 位小数**：WXML 中直接 `/100`，1250 显示 "12.5" 而非 "12.50"
6. **底部导航 CSS 重复**：4 页 WXSS 中各有一份相同的 `.bottom-nav` / `.nav-item` 样式
