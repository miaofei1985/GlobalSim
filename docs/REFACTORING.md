# GlobalSim 代码重构说明

## 重构概述

本次重构对 GlobalSim 项目的后端和前端代码进行了结构化优化，采用更清晰的 MVC（Model-View-Controller）架构模式。

## 主要变更

### 后端重构

#### 1. 新增目录结构
```
backend/src/
├── config/          # 配置文件 (database, redis)
├── controllers/     # 控制器层 (新增)
│   ├── authController.js
│   └── marketController.js
├── middleware/      # 中间件 (auth, rateLimiter)
├── models/          # 数据模型层 (新增)
│   ├── UserModel.js
│   ├── WalletModel.js
│   └── StockModel.js
├── routes/          # 路由定义
├── services/        # 业务服务 (emailService)
├── utils/           # 工具函数 (crypto)
└── index.js         # 应用入口
```

#### 2. 核心改进

**Models 层 (数据访问层)**
- `UserModel.js`: 封装所有用户相关的数据库操作
  - `findByEmail(email)`
  - `findById(id)`
  - `create(userData, client)`
  - `verifyEmail(email, code)`
  - `updateVerificationCode(email, newCode, expiresAt)`
  - `updateLastLoginIP(userId, ip)`
  - `existsByEmail(email)`

- `WalletModel.js`: 封装钱包相关的数据库操作
  - `findByUserId(userId)`
  - `create(userId, currency, initialBalance, client)`
  - `updateBalance(walletId, amount, client)`
  - `freezeBalance(walletId, amount, client)`
  - `unfreezeBalance(walletId, amount, client)`
  - `getWithSufficientBalance(userId, requiredAmount)`

- `StockModel.js`: 封装股票相关的数据库操作
  - `findBySymbolAndExchange(symbol, exchange)`
  - `findWithFilters(exchange, tab, sector)`
  - `findDistinctSectors(exchange)`
  - `updatePrice(symbol, exchange, updateData)`
  - `findBySector(sector, exchange)`

**Controllers 层 (控制器层)**
- `authController.js`: 处理认证相关请求
  - `register(req, res)` - 用户注册
  - `verifyEmail(req, res)` - 邮箱验证
  - `resendCode(req, res)` - 重发验证码
  - `login(req, res)` - 用户登录

- `marketController.js`: 处理行情相关请求
  - `getStocks(req, res)` - 获取股票列表
  - `getSectors(req, res)` - 获取板块列表
  - `getStockDetail(req, res)` - 获取个股详情

**Routes 层 (路由层)**
- `routes/auth.js`: 简化为纯路由定义，调用 controller 处理业务
- `routes/market.js`: 改为 ES6 模块语法，调用 controller 处理业务

**Services 层 (服务层)**
- 保留 `emailService.js` 用于邮件发送
- 移除 `authService.js` 和 `stockService.js` (功能已移至 controllers + models)

#### 3. 代码质量提升

- ✅ 统一使用 ES6 模块语法 (`import`/`export`)
- ✅ 明确的职责分离 (MVC 模式)
- ✅ 更好的错误处理和事务管理
- ✅ JSDoc 注释完善
- ✅ 支持事务的数据库操作 (通过 client 参数)

### 前端现状

前端代码保持原有结构，已具备基本的模块化：
```
frontend/src/
├── api/           # API 调用封装
├── components/    # 公共组件 (待补充)
├── views/         # 页面视图 (待补充)
├── stores/        # Pinia 状态管理
├── router/        # 路由配置
├── i18n/          # 国际化
└── utils/         # 工具函数 (待补充)
```

## 使用示例

### 后端 API 调用

```javascript
// 用户注册
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "securePassword123",
  "nickname": "Trader",
  "locale": "zh-CN"
}

// 用户登录
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "securePassword123"
}

// 获取股票列表
GET /api/market/stocks?exchange=NYSE&tab=rising&sector=Technology

// 获取板块列表
GET /api/market/sectors?exchange=NASDAQ

// 获取个股详情
GET /api/market/stocks/AAPL?exchange=NASDAQ
```

### Model 层使用示例

```javascript
import UserModel from './models/UserModel.js';
import WalletModel from './models/WalletModel.js';

// 查找用户
const user = await UserModel.findByEmail('user@example.com');

// 创建用户和钱包 (带事务)
const client = await pool.connect();
try {
  await client.query('BEGIN');
  const user = await UserModel.create(userData, client);
  const wallet = await WalletModel.create(user.id, 'GSB', 100000000, client);
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

## 优势

1. **可维护性**: 清晰的层次结构，易于定位和修改代码
2. **可测试性**: 各层职责明确，便于单元测试
3. **可扩展性**: 新增功能时遵循既定模式
4. **代码复用**: Model 层可在多个 Controller 中复用
5. **事务支持**: 更好的数据库事务管理

## 后续建议

1. 添加前端视图组件 (views/)
2. 添加公共 UI 组件 (components/)
3. 添加工具函数库 (utils/)
4. 编写单元测试
5. 添加 API 文档 (Swagger/OpenAPI)
6. 实现 WebSocket 实时通信
7. 添加订单管理和交易功能

## 注意事项

- 确保数据库连接池配置合理
- 生产环境需修改默认 JWT_SECRET
- 配置正确的 SMTP 邮件服务
- 根据实际需求调整限流参数
