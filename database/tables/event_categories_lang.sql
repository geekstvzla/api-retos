CREATE TABLE `event_categories_lang` (
  `event_categories_lang_id` int NOT NULL AUTO_INCREMENT,
  `event_category_id` int NOT NULL,
  `language_id` int NOT NULL,
  `description` varchar(45) NOT NULL,
  `status_id` int NOT NULL,
  PRIMARY KEY (`event_categories_lang_id`)
) ENGINE=MyISAM;