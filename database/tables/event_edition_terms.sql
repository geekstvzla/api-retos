CREATE TABLE `event_edition_terms` (
  `event_edition_term_id` INT NOT NULL AUTO_INCREMENT,
  `event_edition_id` INT NOT NULL,
  `term_category_id` INT NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `summary` VARCHAR(255) NULL,
  `content` TEXT NOT NULL,
  `is_required` TINYINT(1) NOT NULL DEFAULT 1,
  `applies_to` ENUM('ALL', 'ADULTS_ONLY', 'MINORS_ONLY') NOT NULL DEFAULT 'ALL',
  `lang_id` VARCHAR(5) NOT NULL DEFAULT 'esp',
  `version` INT NOT NULL DEFAULT 1,
  `display_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`event_edition_term_id`),
  CONSTRAINT `fk_eet_edition` FOREIGN KEY (`event_edition_id`) REFERENCES `event_edition` (`event_edition_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_eet_category` FOREIGN KEY (`term_category_id`) REFERENCES `term_categories` (`term_category_id`)
);
