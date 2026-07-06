-- ============================================
-- XpenseIQ — MySQL Database Schema
-- Run this in MySQL Workbench or CLI
-- ============================================

CREATE DATABASE IF NOT EXISTS expense_tracker;
USE expense_tracker;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    name     VARCHAR(100) NOT NULL,
    email    VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    title        VARCHAR(200)   NOT NULL,
    amount       DECIMAL(10, 2) NOT NULL,
    category     VARCHAR(50)    NOT NULL,
    expense_date DATE           NOT NULL,
    user_id      BIGINT         NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
