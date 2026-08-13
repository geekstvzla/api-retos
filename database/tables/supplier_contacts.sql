CREATE TABLE `supplier_contacts` (
  `supplier_contact_id` INT NOT NULL AUTO_INCREMENT,
  `supplier_id` INT NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `phone_number` VARCHAR(50) NULL,
  `whatsapp_number` VARCHAR(50) NULL,
  `status_id` INT NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`supplier_contact_id`),
  CONSTRAINT `fk_sc_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`) ON DELETE CASCADE
);
