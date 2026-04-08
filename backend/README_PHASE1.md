# GlobalSim Backend - Phase 1 Development Guide

## 📋 W1-W2 核心任务清单

### ✅ 已完成 (Completed)

1. **数据库建模** (`docs/db_schema_v1.sql`)
   - users 表 (用户信息 + 验证码 + 多语种支持)
   - wallets 表 (虚拟钱包 + 1 亿 GSB 初始资金)
   - transactions 表 (流水记录 + 审计追踪)
   - orders 表 (订单管理 + 撮合基础)
   - ads 表 (广告位配置)
   - audit_logs 表 (合规审计日志)

2. **邮箱注册全流程**
   - `src/services/authService.js` - 注册/验证/重发验证码逻辑
   - `src/services/emailService.js` - 10 语种邮件模板 (zh-CN/en/hi/es/ar/bn/pt-BR/ru/ja/fr)
   - `src/routes/auth.js` - RESTful API 端点
   - 支持 6 位验证码 + 10 分钟过期 + 频控防护

3. **i18n 框架基础**
   - 10 语种邮件模板已内置
   - locale 字段贯穿用户表/注册流程
   - RTL 布局支持 (阿拉伯语)

4. **风控与限流**
   - `src/middleware/rateLimiter.js`
     - 通用 API: 100 次/15 分钟
     - 认证接口: 10 次/15 分钟
     - 邮件发送: 5 次/小时 (防刷关键)
     - 转账限制: 20 次/日 (虚拟经济规格)

5. **安全与加密**
   - bcryptjs 密码哈希
   - JWT Token 认证
   - Helmet 安全头
   - CORS 跨域配置

---

## 🚀 快速启动指南

### 前置要求
- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 6.0

### 安装步骤

```bash
# 1. 进入后端目录
cd backend

# 2. 安装依赖
npm install

# 3. 复制环境变量配置
cp .env.example .env

# 4. 编辑 .env 文件，填入你的配置
# - 数据库连接信息
# - SMTP 邮件服务配置
# - JWT 密钥

# 5. 创建数据库并执行 schema
createdb globalsim
psql -d globalsim -f ../docs/db_schema_v1.sql

# 6. 启动开发服务器
npm run dev
```

### 测试注册流程

```bash
# 注册用户
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "nickname": "TestUser",
    "locale": "zh-CN"
  }'

# 验证邮箱 (查看邮件获取验证码)
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "code": "123456"
  }'

# 登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

---

## 📁 项目结构

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js      # PostgreSQL 连接池
│   │   └── redis.js         # Redis 客户端
│   ├── middleware/
│   │   ├── auth.js          # JWT 认证中间件
│   │   └── rateLimiter.js   # 限流中间件
│   ├── routes/
│   │   └── auth.js          # 认证路由
│   ├── services/
│   │   ├── authService.js   # 注册/登录业务逻辑
│   │   └── emailService.js  # 邮件发送 (10 语种)
│   ├── utils/
│   │   └── crypto.js        # 密码哈希/JWT/验证码生成
│   └── index.js             # 应用入口
├── logs/                    # 日志目录
├── tests/                   # 测试用例
├── docs/
│   └── db_schema_v1.sql     # 数据库脚本
├── .env.example             # 环境变量模板
└── package.json
```

---

## 🔌 API 文档

### 认证相关

| 方法 | 路径 | 描述 | 限流 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | 10 次/15min |
| POST | `/api/auth/verify` | 邮箱验证 | - |
| POST | `/api/auth/resend-code` | 重发验证码 | 5 次/小时 |
| POST | `/api/auth/login` | 用户登录 | 10 次/15min |

### 健康检查

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/health` | 数据库+Redis 连接状态 |
| GET | `/api` | API 概览 |

---

## ⚠️ 注意事项

1. **邮件服务**: 生产环境需配置真实 SMTP 服务 (推荐 SendGrid/AWS SES)
2. **数据库迁移**: 每次 schema 变更需记录版本并执行迁移脚本
3. **密钥管理**: `.env` 文件严禁提交到 Git
4. **日志轮转**: 生产环境需配置日志归档策略

---

## 📊 下一步计划 (W1 剩余任务)

- [ ] 行情 API 接入 (Twelve Data)
- [ ] 撮合引擎原型 (内存订单簿)
- [ ] 单元测试覆盖 (目标 80%)
- [ ] Swagger/OpenAPI 文档

---

**状态**: Phase 1 基建完成度 60%  
**负责人**: 后端开发组  
**更新时间**: W1 Day 3
