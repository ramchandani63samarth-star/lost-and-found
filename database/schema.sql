CREATE DATABASE IF NOT EXISTS community_lost_found;
USE community_lost_found;

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type ENUM('lost','found') NOT NULL,
  title VARCHAR(150) NOT NULL,
  category VARCHAR(60) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(150) NOT NULL,
  event_date DATE NOT NULL,
  image_url VARCHAR(500),
  status ENUM('active','claimed','returned','closed') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_items_type (type),
  INDEX idx_items_category (category),
  INDEX idx_items_location (location),
  INDEX idx_items_status (status)
);

CREATE TABLE IF NOT EXISTS claims (
  id INT PRIMARY KEY AUTO_INCREMENT,
  item_id INT NOT NULL,
  claimant_id INT NOT NULL,
  message TEXT NOT NULL,
  verification_question VARCHAR(255),
  verification_answer TEXT,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (claimant_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  message VARCHAR(500) NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
