-- ============================================================
-- Boots'N Pots - Banco de dados (MySQL/MariaDB - XAMPP)
-- Importe no phpMyAdmin ou rode: mysql -u root < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS bootsnpots
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bootsnpots;

-- Usuários (login e perfil) -----------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  avatar     VARCHAR(32)  NULL,                   -- código do avatar pré-definido
  token      VARCHAR(64)  NULL,
  criado_em  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_email (email),
  UNIQUE KEY uk_token (token)
) ENGINE=InnoDB;

-- Plantas descobertas por cada usuário (histórico) ------------
CREATE TABLE IF NOT EXISTS plantas_usuario (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario      INT UNSIGNED NOT NULL,
  nome_comum      VARCHAR(150) NOT NULL,
  nome_cientifico VARCHAR(150) NOT NULL,
  confianca       TINYINT UNSIGNED NULL,          -- % da identificação (Pl@ntNet)
  foto            VARCHAR(255) NULL,              -- nome do arquivo em uploads/
  latitude        DECIMAL(10,7) NULL,             -- onde a planta foi encontrada
  longitude       DECIMAL(10,7) NULL,
  local_descricao VARCHAR(200) NULL,              -- texto livre ("jardim da frente")
  achado_em       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_usuario_data (id_usuario, achado_em),
  CONSTRAINT fk_plantas_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Pastas e SUBPASTAS do usuário (árvore: id_pasta_pai) --------
CREATE TABLE IF NOT EXISTS pastas (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario   INT UNSIGNED NOT NULL,
  nome         VARCHAR(100) NOT NULL,
  id_pasta_pai INT UNSIGNED NULL,                 -- NULL = pasta raiz
  criado_em    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_usuario (id_usuario),
  KEY idx_pai (id_pasta_pai),
  CONSTRAINT fk_pastas_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuarios (id) ON DELETE CASCADE,
  CONSTRAINT fk_pastas_pai FOREIGN KEY (id_pasta_pai)
    REFERENCES pastas (id) ON DELETE CASCADE       -- apagar pasta = apagar subpastas
) ENGINE=InnoDB;

-- Relação N:N: uma planta pode estar em várias pastas ----------
CREATE TABLE IF NOT EXISTS pasta_plantas (
  id_pasta  INT UNSIGNED NOT NULL,
  id_planta INT UNSIGNED NOT NULL,
  PRIMARY KEY (id_pasta, id_planta),
  CONSTRAINT fk_pp_pasta FOREIGN KEY (id_pasta)
    REFERENCES pastas (id) ON DELETE CASCADE,
  CONSTRAINT fk_pp_planta FOREIGN KEY (id_planta)
    REFERENCES plantas_usuario (id) ON DELETE CASCADE
) ENGINE=InnoDB;
