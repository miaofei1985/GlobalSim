# GlobalSim Backend

后端服务基于 Node.js + Express，提供 RESTful API 和 WebSocket 实时通信。

## 目录结构

```
backend/
├── src/
│   ├── index.js            # 应用入口
│   ├── app.js              # Express 应用配置
│   ├── controllers/        # 控制器层
│   │   ├── auth.controller.js      # 认证相关
│   │   ├── user.controller.js      # 用户相关
│   │   ├── wallet.controller.js    # 钱包相关
│   │   ├── order.controller.js     # 订单相关
│   │   ├── market.controller.js    # 行情相关
│   │   └── admin.controller.js     # 管理后台
│   ├── models/             # 数据模型
│   │   ├── User.js         # 用户模型
│   │   ├── Wallet.js       # 钱包模型
│   │   ├── Order.js        # 订单模型
│   │   ├── Transaction.js  # 流水模型
│   │   └── Advertisement.js # 广告模型
│   ├── services/           # 业务逻辑
│   │   ├── auth.service.js         # 认证服务
│   │   ├── email.service.js        # 邮件服务
│   │   ├── matching.service.js     # 撮合引擎
│   │   ├── mr-bot.service.js       # 均值回归机器人
│   │   ├── market-data.service.js  # 行情数据
│   │   └── risk-control.service.js # 风控服务
│   ├── middlewares/        # 中间件
│   │   ├── auth.middleware.js      # JWT 认证
│   │   ├── rate-limit.middleware.js # 限流
│   │   ├── validation.middleware.js # 验证
│   │   └── error.middleware.js     # 错误处理
│   ├── routes/             # 路由定义
│   │   ├── index.js        # 路由汇总
│   │   ├── auth.routes.js  # 认证路由
│   │   ├── user.routes.js  # 用户路由
│   │   ├── wallet.routes.js # 钱包路由
│   │   ├── order.routes.js # 订单路由
│   │   ├── market.routes.js # 行情路由
│   │   └── admin.routes.js # 管理后台路由
│   └── utils/              # 工具函数
│       ├── logger.js       # 日志工具
│       ├── response.js     # 统一响应
│       ├── constants.js    # 常量定义
│       └── helpers.js      # 辅助函数
├── config/
│   ├── index.js            # 配置汇总
│   ├── database.js         # 数据库配置
│   ├── redis.js            # Redis 配置
│   └── mailer.js           # 邮件配置
├── tests/                  # 测试文件
├── scripts/                # 脚本工具
│   ├── migrate.js          # 数据库迁移
│   └── seed.js             # 种子数据
├── package.json
└── .env.example            # 环境变量示例
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

### 3. 启动服务

开发模式：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

## API 文档

启动服务后访问 `http://localhost:3000/api-docs` 查看 Swagger 文档。

## 核心模块

### 认证模块
- 邮箱注册 + 6 位验证码
- JWT Token 认证
- 多语言邮件模板

### 撮合引擎
- 内存订单簿
- 限价/市价单支持
- MR-Bot 均值回归算法

### 风控系统
- 请求限流（20 次/日）
- 转账限额（50 亿/日）
- 对倒检测
- 设备指纹

## 测试

```bash
npm test
```
