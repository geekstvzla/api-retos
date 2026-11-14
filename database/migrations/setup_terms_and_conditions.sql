-- ========================================================================
-- SISTEMA DE TÉRMINOS Y CONDICIONES (MODULARES)
-- Base de Datos: retos (Servidor Remoto / Local)
-- ========================================================================

-- ------------------------------------------------------------------------
-- 1. TABLA: term_categories (Catálogo de categorías reutilizables)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `term_categories` (
  `term_category_id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`term_category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Población de categorías base
INSERT INTO `term_categories` (`term_category_id`, `code`, `name`, `display_order`, `is_active`) VALUES
(1, 'HEALTH_WAIVER', 'Deslinde de Responsabilidad y Salud', 1, 1),
(2, 'RULES', 'Reglamento Técnico y de Conducta', 2, 1),
(3, 'REFUNDS', 'Política de Reembolsos y Devoluciones', 3, 1),
(4, 'KIT_SHIPPING', 'Retiro de Kit y Logística', 4, 1),
(5, 'MINORS_PARTICIPATION', 'Participación de Menores de Edad', 5, 1),
(6, 'IMAGE_RIGHTS', 'Cesión de Derechos de Imagen y Medios', 6, 1),
(7, 'FORCE_MAJEURE', 'Modificación de Evento y Fuerza Mayor', 7, 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `display_order` = VALUES(`display_order`);

-- ------------------------------------------------------------------------
-- 2. TABLA: event_edition_terms (Términos específicos por edición del evento)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `event_edition_terms` (
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
  KEY `idx_eet_edition` (`event_edition_id`),
  KEY `idx_eet_category` (`term_category_id`),
  CONSTRAINT `fk_eet_edition` FOREIGN KEY (`event_edition_id`) REFERENCES `event_edition` (`event_edition_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_eet_category` FOREIGN KEY (`term_category_id`) REFERENCES `term_categories` (`term_category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Si la tabla ya existía, garantizar que `content` sea TEXT:
ALTER TABLE `event_edition_terms` MODIFY COLUMN `content` TEXT NOT NULL;

-- ------------------------------------------------------------------------
-- 3. TABLA: event_edition_enrolled_user_terms (Registro legal inmutable)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `event_edition_enrolled_user_terms` (
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
  KEY `idx_eeut_enrolled_user` (`event_edition_enrolled_user_id`),
  KEY `idx_eeut_edition_term` (`event_edition_term_id`),
  CONSTRAINT `fk_eeut_enrolled_user` FOREIGN KEY (`event_edition_enrolled_user_id`) REFERENCES `event_edition_enrolled_users` (`event_edition_enrolled_user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_eeut_edition_term` FOREIGN KEY (`event_edition_term_id`) REFERENCES `event_edition_terms` (`event_edition_term_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Si la tabla ya existía, garantizar que `accepted_content_snapshot` sea TEXT:
ALTER TABLE `event_edition_enrolled_user_terms` MODIFY COLUMN `accepted_content_snapshot` TEXT NOT NULL;

-- ------------------------------------------------------------------------
-- 4. DATOS INICIALES DE EJEMPLO: Términos para Edición 21 (15K Cerro El Peñón)
-- (Cambiar `event_edition_id` al ID de la edición correspondiente en remoto si es diferente)
-- ------------------------------------------------------------------------
INSERT INTO `event_edition_terms` 
(`event_edition_id`, `term_category_id`, `title`, `summary`, `content`, `is_required`, `display_order`)
VALUES
(
  21,
  1,
  'Deslinde de Responsabilidad y Aptitud Médica',
  'Declaro que me encuentro en condiciones físicas y médicas óptimas para participar en este evento deportivo. Asumo voluntariamente todos los riesgos asociados con mi participación, incluidos caídas, contacto con otros participantes y condiciones climáticas',
  'Declaro que me encuentro en condiciones físicas y médicas óptimas para participar en este evento deportivo. Asumo voluntariamente todos los riesgos asociados con mi participación, incluidos caídas, contacto con otros participantes y condiciones climáticas. Eximo de toda responsabilidad legal y financiera a los organizadores, patrocinadores y colaboradores del evento.',
  1,
  1
),
(
  21,
  5,
  'Participación de Menores de Edad y Autorización del Representante',
  'Este evento no es apto para menores de edad. De participar es responsabilidad 100% del respresentante',
  'Este evento no es apto para menores de edad. De participar es responsabilidad 100% del respresentante',
  1,
  2
),
(
  21,
  3,
  'No Reembolso por Causas Atribuibles al Participante',
  'Una vez pagada la inscripción, no se realizarán devoluciones de dinero por ningún motivo atribuible al participante como: inasistencia, lesiones, enfermedad, problemas personales, errores al registrarse.',
  'Una vez formalizada y pagada la inscripción, la organización no realizará devoluciones ni reembolsos de dinero bajo ninguna circunstancia atribuible al participante. Esto incluye, de manera enunciativa mas no limitativa: inasistencia al evento, lesiones físicas, enfermedad, motivos personales o laborales, problemas de traslado, errores en la selección de categoría o talla durante el registro, o descalificación por incumplimiento del reglamento.',
  1,
  3
),
(
  21,
  7,
  'Suspensión, Modificación o Reprogramación por Fuerza Mayor',
  'En caso de suspensión, cambio de ruta o reprogramación del evento por clima extremo, emergencias o causas de fuerza mayor ajenas a la organización, la inscripción se trasladará a la nueva fecha sin derecho a reembolso.',
  '<p><strong>1. Causas de Fuerza Mayor:</strong> La organización se reserva el derecho de modificar horarios, recortar o alterar la ruta, posponer o suspender total o parcialmente el evento cuando existan circunstancias de fuerza mayor o caso fortuito ajenas a su control que pongan en riesgo la seguridad de los participantes, espectadores o personal. Esto incluye, de forma enunciativa mas no limitativa: condiciones climáticas extremas, desastres naturales, emergencias sanitarias, fallas en servicios públicos esenciales, alteraciones del orden público o disposiciones de las autoridades gubernamentales.</p>',
  1,
  4
),
(
  21,
  2,
  'Conducta y Derecho de Admisión',
  'El participante acepta reconoce que la organización se reserva el derecho de admisión y permanencia ante conductas antideportivas, falta de identificación o incumplimiento de normas de seguridad.',
  '<p><strong>Derecho de Admisión y Permanencia:</strong> La organización se reserva el derecho de admisión, permanencia y participación en el evento. Podrá negarse el acceso o proceder al retiro inmediato de cualquier participante o acompañante que presente signos de estar bajo los efectos del alcohol o sustancias psicotrópicas, mantenga conductas agresivas o antideportivas, falsifique datos o dorsales, incumpla las normas de seguridad e instrucciones del personal autorizado, así como la comportamiento hostil o grosero por parte del participante hacia la organización sin que ello genere derecho a reembolso alguno.</p>',
  1,
  5
),
(
  21,
  4,
  'Entrega de Kits, Horarios y Autorización de Retiro por Terceros',
  'La entrega de kits se realizará únicamente en las fechas, horarios y lugares establecidos por la organización. Si el participante no puede asistir personalmente, deberá enviar a un tercero con carta de autorización firmada y copia de la cédula de identidad.',
  '<p><strong>1. Fechas, Horarios y Lugar de Entrega:</strong> La entrega de kits de competencia se llevará a cabo exclusivamente en los días, horarios y lugares previamente establecidos y anunciados por la organización a través de sus canales oficiales. Es responsabilidad del participante verificar esta información con antelación. Una vez culminado el horario oficial de entrega, la organización no estará obligada a realizar entregas extemporáneas ni el día del evento.</p>',
  1,
  6
);
