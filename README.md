# 🌍 GlobalSim 寰宇模拟盘

> **沉浸式3D地球交互 × 全球股票模拟交易 × 实时弹幕竞技 × 10语种无缝切换的虚拟金融沙盒**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-green.svg)](https://nodejs.org/)
[![Vue](https://img.shields.io/badge/vue-3.4-green.svg)](https://vuejs.org/)

## 📋 项目简介

GlobalSim 是一个支持 1000 CCU 稳定运行的虚拟金融沙盒平台，提供：
- 🌐 **3D地球首页**: Three.js + GSAP 实现国家→交易所→交易大厅三级导航
- 📈 **专业K线**: TV Lightweight Charts引擎，11种周期+9大指标+画线工具
- 💬 **实时弹幕**: WebSocket推送，与K线时间轴对齐
- 💰 **虚拟经济**: 总量1千万亿GSB，新用户注册送1亿
- 🌍 **10语种**: zh-CN/en/hi/es/ar/bn/pt-BR/ru/ja/fr 无缝切换

## 🚀 快速开始

### 前置要求
- Node.js >= 18
- PostgreSQL >= 14
- Redis >= 7

### 安装步骤

```bash
# 克隆项目
git clone <repository-url>
cd globalsim-platform

# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 启动服务

```bash
# 启动后端
cd backend
npm run dev

# 启动前端
cd frontend
npm run dev
```

## 📁 目录结构

```
globalsim-platform/
├── backend/                 # 后端服务 (Node.js + Express)
│   ├── src/
│   │   ├── controllers/    # 控制器层
│   │   ├── models/         # 数据模型
│   │   ├── services/       # 业务逻辑
│   │   ├── middlewares/    # 中间件
│   │   ├── routes/         # 路由定义
│   │   └── utils/          # 工具函数
│   ├── config/             # 配置文件
│   ├── tests/              # 测试文件
│   └── package.json
├── frontend/               # 前端应用 (Vue 3 + TypeScript)
│   ├── src/
│   │   ├── components/     # 公共组件
│   │   ├── views/          # 页面视图
│   │   ├── stores/         # 状态管理
│   │   ├── locales/        # 国际化资源
│   │   ├── assets/         # 静态资源
│   │   └── utils/          # 工具函数
│   ├── public/             # 公共资源
│   └── package.json
├── docs/                   # 项目文档
├── scripts/                # 脚本工具
└── README.md
```

## 🗓️ 开发里程碑

| 阶段 | 周期 | 目标 |
|------|------|------|
| Phase 1 | W1-W2 | 基建与核心链路（注册、数据库、i18n、行情、撮合） |
| Phase 2 | W3-W5 | 3D地球与交易大厅（地球交互、K线、盘口、弹幕） |
| Phase 3 | W6-W7 | 核心逻辑与管理后台（MR-Bot、广告、RBAC） |
| Phase 4 | W8-W10 | 压测、合规与联调 |
| Phase 5 | W11-W12 | 灰度发布与运营准备 |

## 👥 技术栈

**前端**
- Vue 3 + TypeScript
- Three.js + GSAP (3D地球)
- Lightweight Charts (K线)
- vue-i18n (国际化)
- Pinia (状态管理)

**后端**
- Node.js + Express
- PostgreSQL (主数据库)
- Redis (缓存/队列)
- WebSocket (实时通信)
- JWT (认证)

## 📊 成功指标

- 用户指标: 注册转化率 ≥45% | 首单完成率 ≥60% | 7日留存 ≥35%
- 技术指标: 接口P95 <200ms | K线帧率 ≥55fps | WS稳定性 ≥99.5%

## 📄 许可证

MIT License
