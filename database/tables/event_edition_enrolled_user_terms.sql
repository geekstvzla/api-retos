CREATE TABLE `event_edition_enrolled_user_terms` (
  `enrolled_term_acceptance_id` BIGINT NOT NULL AUTO_INCREMENT,
  `event_edition_enrolled_user_id` INT NOT NULL,
  `event_edition_term_id` INT NOT NULL,
  `user_id` INT NULL,
  `is_accepted` TINYINT(1) NOT NULL DEFAULT 1,
  `accepted_content_snapshot` TEXT NOT NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(255) NULL,
  `accepted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`enrolled_term_acceptance_id`),
  CONSTRAINT `fk_eeut_enrolled_user` FOREIGN KEY (`event_edition_enrolled_user_id`) REFERENCES `event_edition_enrolled_users` (`event_edition_enrolled_user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_eeut_edition_term` FOREIGN KEY (`event_edition_term_id`) REFERENCES `event_edition_terms` (`event_edition_term_id`)
);
