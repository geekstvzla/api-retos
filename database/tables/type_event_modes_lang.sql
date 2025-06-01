CREATE TABLE `type_event_modes_lang` (
  `type_event_modes_lang_id` int NOT NULL AUTO_INCREMENT,
  `type_event_mode_id` int NOT NULL,
  `language_id` int NOT NULL,
  `description` varchar(45) NOT NULL,
  `status_id` int NOT NULL,
  PRIMARY KEY (`type_event_modes_lang_id`)
) ENGINE=MyISAM;