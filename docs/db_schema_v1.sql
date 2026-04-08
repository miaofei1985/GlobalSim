-- GlobalSim Platform Database Schema V1.0
-- Phase 1: Core Infrastructure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (用户表)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(50),
    locale VARCHAR(10) DEFAULT 'zh-CN', -- 支持10语种
    is_verified BOOLEAN DEFAULT FALSE,
    verification_code VARCHAR(6),
    code_expires_at TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_ip INET,
    status VARCHAR(20) DEFAULT 'active' -- active, banned, frozen
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- 2. Wallets Table (钱包表 - 虚拟经济核心)
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    currency VARCHAR(10) DEFAULT 'GSB', -- GlobalSim Buckets
    balance DECIMAL(20, 2) DEFAULT 100000000.00, -- 新用户送1亿
    frozen_balance DECIMAL(20, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wallets_user_id ON wallets(user_id);

-- 3. Transactions Table (流水表 - 防刷与审计)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID REFERENCES wallets(id),
    type VARCHAR(20) NOT NULL, -- deposit, withdraw, transfer, trade_profit, trade_loss, bonus
    amount DECIMAL(20, 2) NOT NULL,
    balance_after DECIMAL(20, 2) NOT NULL,
    reference_id VARCHAR(255), -- 关联订单ID或转账单号
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_type ON transactions(type);

-- 4. Orders Table (订单表 - 交易核心)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    symbol VARCHAR(20) NOT NULL, -- e.g., AAPL, TSLA, ^GSPC
    side VARCHAR(10) NOT NULL, -- buy, sell
    type VARCHAR(10) NOT NULL, -- limit, market
    price DECIMAL(20, 4),
    quantity DECIMAL(20, 4) NOT NULL,
    filled_quantity DECIMAL(20, 4) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'pending', -- pending, partial_filled, filled, cancelled, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_symbol_status ON orders(symbol, status);

-- 5. Ads Table (广告位配置)
CREATE TABLE ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slot_name VARCHAR(50) NOT NULL, -- home_banner, kline_sidebar, etc.
    content_url TEXT,
    target_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Audit Logs (合规与风控审计)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action VARCHAR(50) NOT NULL, -- login, register, transfer, trade
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Initial Data: Insert a test admin user (password: admin123)
-- Note: In production, hash passwords properly via backend logic
INSERT INTO users (email, password_hash, nickname, locale, is_verified, status) 
VALUES ('admin@globalsim.com', '$2b$10$X7uO.q.dZ.w.e.r.t.y.u.i.o.p.a.s.d.f.g.h.j.k.l', 'SystemAdmin', 'en', TRUE, 'active');
