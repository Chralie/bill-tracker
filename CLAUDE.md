# 极简记账本

## 项目概述

个人财务记录微信小程序。核心功能：记账、查看账单、分类管理。目标用户为个人使用，后续可扩展待办/习惯打卡模块。

## 技术栈

- **框架**：微信小程序原生框架
- **语言**：JavaScript
- **样式**：原生 WXSS
- **后端/数据**：微信云开发（云数据库 + 云函数）
- **UI 组件**：无第三方组件库，手写 WXSS（学习目的）

## 项目结构

```
/
├── app.js                 # 小程序入口，注册小程序，初始化云开发
├── app.json               # 小程序配置（页面路由、窗口样式、tabBar 等）
├── app.wxss               # 全局样式
├── project.config.json    # 项目配置（AppID、云开发根目录、编译设置等）
├── pages/                 # 页面目录
│   ├── index/             # 首页 - 账单列表 + 月度统计
│   │   ├── index.js
│   │   ├── index.json
│   │   ├── index.wxml
│   │   └── index.wxss
│   ├── add-record/        # 记一笔 - 添加/编辑账单
│   │   ├── add-record.js
│   │   ├── add-record.json
│   │   ├── add-record.wxml
│   │   └── add-record.wxss
│   └── category-manage/   # 分类管理 - 预设分类 + 自定义分类
│       ├── category-manage.js
│       ├── category-manage.json
│       ├── category-manage.wxml
│       └── category-manage.wxss
├── cloudfunctions/        # 云函数目录（目前为空，按需添加）
├── utils/                 # 工具函数
│   └── util.js            # 日期格式化、金额格式化等
└── images/                # 图标等静态资源
```

## 命名规范

- 页面目录/文件名：kebab-case（`add-record`、`category-manage`）
- 变量/函数：camelCase
- CSS class：kebab-case
- 数据库集合名：snake_case（`billing_records`、`categories`）

## 云数据库设计

### billing_records（账单记录）

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 自动生成 |
| _openid | string | 自动生成，用户标识 |
| amount | number | 金额（分，整数存储避免浮点精度问题） |
| category_id | string | 分类 ID |
| category_name | string | 分类名称（冗余，避免每次关联查询） |
| type | string | 类型：'expense'（支出）/ 'income'（收入）|
| note | string | 备注，可选 |
| record_date | string | 记账日期，格式 YYYY-MM-DD |
| create_time | Date | 创建时间 |

### categories（分类）

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 自动生成 |
| _openid | string | 自动生成，用户标识 |
| name | string | 分类名称 |
| icon | string | 图标 emoji |
| type | string | 'expense' / 'income' |
| is_preset | boolean | 是否预设分类 |
| sort_order | number | 排序序号 |

## 开发约定

- 每次修改后需在微信开发者工具中预览验证
- 云函数修改后需右键 → "上传并部署"
- 金额在前端以"元"为单位展示，存储时转为"分"（避免浮点精度问题）
- 页面数据通过云数据库直接查询，不经过不必要的云函数中转
- 错误处理：每个云 API 调用需 `.catch()` 并用 `wx.showToast()` 提示用户

## 当前状态

- **项目阶段**：从零开始，项目骨架已创建
- **待完成**：需要在微信开发者工具中创建项目、初始化云开发环境后继续开发

## 环境准备（下一步）

1. 安装微信开发者工具：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
2. 注册小程序账号：https://mp.weixin.qq.com/，获取 AppID
3. 用微信开发者工具打开本项目目录
4. 在 project.config.json 中填入你的 AppID
5. 在微信开发者工具中点击"云开发"按钮，创建云开发环境
6. 在云开发控制台中创建数据库集合：`billing_records`、`categories`
