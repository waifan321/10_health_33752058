# Create database script for Health and Fitness Tracker app

# Users table to store registered users (username, names, email, hashed password)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100),
    hashedPassword VARCHAR(255) NOT NULL,
    PRIMARY KEY(id)
);

# Audit table to record login attempts (successful and failed)
CREATE TABLE IF NOT EXISTS audit (
    id INT AUTO_INCREMENT,
    username VARCHAR(50),
    success TINYINT(1) NOT NULL,
    event_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    message VARCHAR(255),
    PRIMARY KEY(id)
);

# Create the database
CREATE DATABASE IF NOT EXISTS health;
USE health;

# Create the tables
# Workouts table to store fitness activities
CREATE TABLE IF NOT EXISTS workouts (
    id     INT AUTO_INCREMENT,
    user_id INT NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    duration_minutes INT,
    calories_burned INT,
    workout_date DATE NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);

# Health Metrics table to track daily health measurements
CREATE TABLE IF NOT EXISTS health_metrics (
    id INT AUTO_INCREMENT,
    user_id INT NOT NULL,
    metric_date DATE NOT NULL,
    weight_kg DECIMAL(5, 2),
    heart_rate INT,
    steps INT,
    sleep_hours DECIMAL(4, 2),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);

# Create the application user
CREATE USER IF NOT EXISTS 'health_app'@'localhost' IDENTIFIED BY 'qwertyuiop'; 
GRANT ALL PRIVILEGES ON health.* TO 'health_app'@'localhost';

