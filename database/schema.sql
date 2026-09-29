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

-- =====================================================================
-- PLANES_CLIENTES
-- =====================================================================
CREATE TABLE IF NOT EXISTS planes_clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  plan_id INT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  estado ENUM('activo','finalizado','cancelado') NOT NULL DEFAULT 'activo',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pc_cliente FOREIGN KEY (cliente_id)
    REFERENCES clientes(id) ON DELETE RESTRICT,
  CONSTRAINT fk_pc_plan FOREIGN KEY (plan_id)
    REFERENCES planes_entrenamiento(id) ON DELETE RESTRICT,
  CONSTRAINT chk_fechas CHECK (fecha_fin > fecha_inicio)
) ENGINE=InnoDB;

-- =====================================================================
-- CONTRATOS 
-- =====================================================================
CREATE TABLE IF NOT EXISTS contratos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_cliente_id INT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  condiciones TEXT NOT NULL,
  estado ENUM('activo','cancelado','finalizado') NOT NULL DEFAULT 'activo',
  firmado BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_contrato_pc FOREIGN KEY (plan_cliente_id)
    REFERENCES planes_clientes(id) ON DELETE RESTRICT,
  CONSTRAINT chk_contrato_precio CHECK (precio > 0),
  CONSTRAINT chk_contrato_fechas CHECK (fecha_fin > fecha_inicio)
) ENGINE=InnoDB;

-- =====================================================================
-- SEGUIMIENTO_FISICO
-- =====================================================================
CREATE TABLE IF NOT EXISTS seguimiento_fisico (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_cliente_id INT NOT NULL,
  fecha DATE NOT NULL,
  peso_kg DECIMAL(5,2) NOT NULL,
  grasa_corporal DECIMAL(4,1) NULL,
  foto_ruta VARCHAR(255) NULL,
  notas VARCHAR(500) NULL,
  estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_seg_pc FOREIGN KEY (plan_cliente_id)
    REFERENCES planes_clientes(id) ON DELETE CASCADE,
  CONSTRAINT chk_peso CHECK (peso_kg BETWEEN 20 AND 300),
  CONSTRAINT chk_grasa CHECK (grasa_corporal IS NULL OR grasa_corporal BETWEEN 3 AND 60)
) ENGINE=InnoDB;

-- =====================================================================
-- TIPOS_MEDIDA
-- =====================================================================
CREATE TABLE IF NOT EXISTS tipos_medida (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL UNIQUE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO tipos_medida (nombre) VALUES
  ('Cintura'), ('Cadera'), ('Pecho'), ('Brazo'), ('Pierna')
ON DUPLICATE KEY UPDATE nombre = nombre;

-- =====================================================================
-- MEDIDAS_CORPORALES
-- =====================================================================
CREATE TABLE IF NOT EXISTS medidas_corporales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  seguimiento_id INT NOT NULL,
  tipo_medida_id INT NOT NULL,
  valor_cm DECIMAL(5,2) NOT NULL,
  CONSTRAINT fk_medida_seg FOREIGN KEY (seguimiento_id)
    REFERENCES seguimiento_fisico(id) ON DELETE CASCADE,
  CONSTRAINT fk_medida_tipo FOREIGN KEY (tipo_medida_id)
    REFERENCES tipos_medida(id) ON DELETE RESTRICT,
  CONSTRAINT chk_valor_cm CHECK (valor_cm > 0 AND valor_cm <= 300),
  CONSTRAINT uq_seg_tipo UNIQUE (seguimiento_id, tipo_medida_id)
) ENGINE=InnoDB;

-- =====================================================================
-- PLANES_NUTRICIONALES
-- =====================================================================
CREATE TABLE IF NOT EXISTS planes_nutricionales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_cliente_id INT NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  meta_calorica_diaria INT NOT NULL,
  descripcion TEXT NULL,
  estado ENUM('activo','inactivo','finalizado') NOT NULL DEFAULT 'activo',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_nut_pc FOREIGN KEY (plan_cliente_id)
    REFERENCES planes_clientes(id) ON DELETE CASCADE,
  CONSTRAINT chk_meta CHECK (meta_calorica_diaria BETWEEN 1000 AND 5000)
) ENGINE=InnoDB;

-- =====================================================================
-- ALIMENTOS
-- =====================================================================
CREATE TABLE IF NOT EXISTS alimentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_nutricional_id INT NOT NULL,
  fecha DATE NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  calorias INT NOT NULL,
  momento ENUM('desayuno','almuerzo','cena','snack') NOT NULL,
  CONSTRAINT fk_alimento_pn FOREIGN KEY (plan_nutricional_id)
    REFERENCES planes_nutricionales(id) ON DELETE CASCADE,
  CONSTRAINT chk_calorias CHECK (calorias > 0 AND calorias <= 5000)
) ENGINE=InnoDB;

-- =====================================================================
-- TRANSACCIONES_FINANCIERAS
-- =====================================================================
CREATE TABLE IF NOT EXISTS transacciones_financieras (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NULL,
  tipo ENUM('ingreso','egreso') NOT NULL,
  categoria VARCHAR(80) NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  descripcion VARCHAR(255) NULL,
  fecha DATE NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tx_cliente FOREIGN KEY (cliente_id)
    REFERENCES clientes(id) ON DELETE SET NULL,
  CONSTRAINT chk_monto CHECK (monto > 0)
) ENGINE=InnoDB;

-- =====================================================================
-- INSERT PLANES DE ENTRENAMIENTO
-- =====================================================================
INSERT INTO planes_entrenamiento
  (nombre, duracion_meses, meta_fisica, nivel, precio) VALUES
  ('Plan Basico', 1, 'Acondicionamiento general', 'principiante', 250.00),
  ('Plan Intermedio', 3, 'Ganancia muscular', 'intermedio', 600.00),
  ('Plan Avanzado', 6, 'Definicion y fuerza', 'avanzado', 1100.00)
ON DUPLICATE KEY UPDATE nombre = nombre;