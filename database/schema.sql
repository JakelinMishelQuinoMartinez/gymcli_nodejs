-- =====================================================================
-- GymCLI 
-- =====================================================================
CREATE DATABASE IF NOT EXISTS gymcli_db;
USE gymcli_db;

-- =====================================================================
-- CLIENTES
-- =====================================================================
CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  telefono VARCHAR(20) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;