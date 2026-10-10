CREATE TABLE IF NOT EXISTS `birthday_email_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `birthday` DATE NOT NULL,
  `year_sent` INT NOT NULL,
  `sent_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` VARCHAR(20) NOT NULL DEFAULT 'SENT',
  `error_message` TEXT NULL,
  UNIQUE KEY `idx_user_year` (`user_id`, `year_sent`),
  KEY `idx_sent_at` (`sent_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
