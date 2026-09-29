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

-- =====================================================================
-- PLANES DE ENTRENAMIENTO 
-- =====================================================================
CREATE TABLE IF NOT EXISTS planes_entrenamiento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  duracion_meses INT NOT NULL,
  meta_fisica VARCHAR(255) NOT NULL,
  nivel ENUM('principiante','intermedio','avanzado') NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_duracion CHECK (duracion_meses BETWEEN 1 AND 24),
  CONSTRAINT chk_precio CHECK (precio > 0)
) ENGINE=InnoDB;