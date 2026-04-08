# GlobalSim Frontend

前端应用基于 Vue 3 + TypeScript，提供沉浸式 3D 地球交互和专业交易界面。

## 目录结构

```
frontend/
├── src/
│   ├── main.ts             # 应用入口
│   ├── App.vue             # 根组件
│   ├── components/         # 公共组件
│   │   ├── common/         # 通用组件
│   │   │   ├── Button.vue
│   │   │   ├── Input.vue
│   │   │   ├── Modal.vue
│   │   │   └── Loading.vue
│   │   ├── earth/          # 3D 地球组件
│   │   │   ├── EarthCanvas.vue
│   │   │   ├── CountryMarker.vue
│   │   │   └── ExchangeBubble.vue
│   │   ├── trading/        # 交易组件
│   │   │   ├── KLineChart.vue
│   │   │   ├── OrderBook.vue
│   │   │   ├── OrderForm.vue
│   │   │   └── PositionList.vue
│   │   ├── chat/           # 弹幕组件
│   │   │   ├── DanmakuLayer.vue
│   │   │   └── DanmakuInput.vue
│   │   └── wallet/         # 钱包组件
│   │       ├── BalanceCard.vue
│   │       ├── TransferForm.vue
│   │       └── TransactionList.vue
│   ├── views/              # 页面视图
│   │   ├── Home.vue        # 首页（3D 地球）
│   │   ├── TradingHall.vue # 交易大厅
│   │   ├── Wallet.vue      # 钱包页面
│   │   ├── Register.vue    # 注册页面
│   │   ├── Login.vue       # 登录页面
│   │   └── Admin.vue       # 管理后台
│   ├── stores/             # Pinia 状态管理
│   │   ├── user.store.js   # 用户状态
│   │   ├── wallet.store.js # 钱包状态
│   │   ├── order.store.js  # 订单状态
│   │   ├── market.store.js # 行情状态
│   │   └── danmaku.store.js # 弹幕状态
│   ├── locales/            # 国际化资源
│   │   ├── index.js        # i18n 配置
│   │   ├── zh-CN.js        # 简体中文
│   │   ├── en.js           # English
│   │   ├── hi.js           # हिन्दी
│   │   ├── es.js           # Español
│   │   ├── ar.js           # العربية (RTL)
│   │   ├── bn.js           # বাংলা
│   │   ├── pt-BR.js        # Português (Brasil)
│   │   ├── ru.js           # Русский
│   │   ├── ja.js           # 日本語
│   │   └── fr.js           # Français
│   ├── assets/             # 静态资源
│   │   ├── styles/         # 样式文件
│   │   │   ├── variables.scss
│   │   │   ├── mixins.scss
│   │   │   └── global.scss
│   │   ├── images/         # 图片资源
│   │   └── fonts/          # 字体文件
│   ├── router/             # 路由配置
│   │   └── index.js
│   ├── api/                # API 请求
│   │   ├── index.js        # Axios 实例
│   │   ├── auth.api.js     # 认证 API
│   │   ├── user.api.js     # 用户 API
│   │   ├── wallet.api.js   # 钱包 API
│   │   ├── order.api.js    # 订单 API
│   │   └── market.api.js   # 行情 API
│   └── utils/              # 工具函数
│       ├── format.js       # 格式化函数
│       ├── validation.js   # 验证函数
│       └── constants.js    # 常量定义
├── public/                 # 公共资源
│   ├── index.html
│   └── favicon.ico
├── vite.config.js          # Vite 配置
├── tsconfig.json           # TypeScript 配置
├── package.json
└── .env.example            # 环境变量示例
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173`

## 构建生产版本

```bash
npm run build
```

## 核心功能

### 3D 地球
- Three.js 渲染
- GSAP 动画
- 国家高亮
- 交易所气泡

### K 线图表
- Lightweight Charts 引擎
- 11 种周期切换
- 9 大技术指标
- 画线工具
- 复盘模式

### 实时弹幕
- WebSocket 推送
- 透明度调节
- 屏蔽词过滤
- 时间轴对齐

### 国际化
- 10 语种支持
- RTL 布局适配
- 本地化格式
- 动态切换

## 技术栈

- Vue 3 + TypeScript
- Pinia (状态管理)
- Vue Router (路由)
- vue-i18n (国际化)
- Three.js + GSAP (3D)
- Lightweight Charts (K 线)
- Socket.IO Client (实时通信)
- Axios (HTTP 请求)
- Vite (构建工具)
- Sass (样式预处理器)

## 代码规范

- ESLint + Prettier 代码格式化
- 组件命名：PascalCase
- 文件命名：kebab-case
- 严禁硬编码文本，全部使用 `$t('key')`

## 测试

```bash
npm test
```

覆盖率报告：
```bash
npm run test:coverage
```
