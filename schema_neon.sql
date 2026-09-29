-- ==========================================================
-- SCRIPT DE BASE DE DATOS PARA NEON (POSTGRESQL) - DNOP
-- Dirección Nacional de Orientación Psicológica
-- ==========================================================

-- 1. TABLA: CARGO
CREATE TABLE IF NOT EXISTS cargo (
    id_cargo SERIAL PRIMARY KEY,
    nombre_cargo VARCHAR(50) NOT NULL
);

INSERT INTO cargo (id_cargo, nombre_cargo) VALUES 
(1, 'Directora'),
(2, 'Psicólogo General')
ON CONFLICT (id_cargo) DO NOTHING;

-- 2. TABLA: PSICOLOGO
CREATE TABLE IF NOT EXISTS psicologo (
    id_psico SERIAL PRIMARY KEY,
    usuario VARCHAR(90) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    primer_nombre VARCHAR(50) NOT NULL,
    segundo_nombre VARCHAR(50),
    apellido_paterno VARCHAR(50) NOT NULL,
    apellido_materno VARCHAR(50) NOT NULL,
    cedula VARCHAR(30) NOT NULL,
    genero VARCHAR(20) NOT NULL,
    correo_institucional VARCHAR(100) NOT NULL,
    telefono VARCHAR(30) NOT NULL,
    casa VARCHAR(50),
    calle VARCHAR(50) NOT NULL,
    corregimiento VARCHAR(50) NOT NULL,
    id_cargo INT NOT NULL REFERENCES cargo(id_cargo)
);

-- Psicólogos iniciales para login y pruebas
INSERT INTO psicologo (usuario, contrasena, primer_nombre, segundo_nombre, apellido_paterno, apellido_materno, cedula, genero, correo_institucional, telefono, casa, calle, corregimiento, id_cargo)
VALUES
('fatima', '1234', 'Fatima', 'Maria', 'Pérez', 'Gómez', '8-123-456', 'Femenino', 'fatima.maria@empresa.com', '61234567', 'Casa 15', 'Calle 50', 'Bethania', 1),
('rios', '1234', 'Carlos', 'Eduardo', 'Ríos', 'Sánchez', '8-456-789', 'Masculino', 'carlos.rios@empresa.com', '69876543', 'Casa 20', 'Calle 10', 'Bella Vista', 2),
('JuanD', 'JuanD1324', 'Juan', 'David', 'De León', 'Gómez', '8-789-012', 'Masculino', 'juan.deleon@empresa.com', '65432109', 'Casa 30', 'Calle 15', 'San Francisco', 2)
ON CONFLICT (usuario) DO NOTHING;

-- 3. TABLA: FACULTAD
CREATE TABLE IF NOT EXISTS facultad (
    id_facultad SERIAL PRIMARY KEY,
    nombre_facultad VARCHAR(200) NOT NULL
);

INSERT INTO facultad (id_facultad, nombre_facultad) VALUES 
(1, 'Ciencia y tecnología'),
(2, 'Ingeniería Civil'),
(3, 'Ingeniería Eléctrica'),
(4, 'Ingeniería Industrial'),
(5, 'Ingeniería Mecánica'),
(6, 'Ingeniería de Sistemas Computacionales')
ON CONFLICT (id_facultad) DO NOTHING;

-- 4. TABLA: CARRERA
CREATE TABLE IF NOT EXISTS carrera (
    id_carrera SERIAL PRIMARY KEY,
    nombre_carrera VARCHAR(100) NOT NULL,
    id_facu INT NOT NULL REFERENCES facultad(id_facultad)
);

INSERT INTO carrera (id_carrera, nombre_carrera, id_facu) VALUES
(1, 'Licenciatura en Ingeniería de Software', 6),
(2, 'Licenciatura en Ingeniería de Sistemas de Información', 6),
(3, 'Licenciatura en Ingeniería de Mantenimiento', 5),
(4, 'Licenciatura en Ingeniería Mecánica', 5),
(5, 'Licenciatura en Ingeniería Industrial', 4),
(6, 'Licenciatura en Gestión Administrativa', 4),
(7, 'Licenciatura en Ingeniería Electrónica Industrial', 3),
(8, 'Licenciatura en Ingeniería Electrónica', 3),
(9, 'Licenciatura en Ingeniería Ambiental', 2),
(10, 'Licenciatura en Ingeniería Geomatra', 2),
(11, 'Licenciatura en Ingeniería en Alimentos', 1),
(12, 'Licenciatura en Ingeniería Forestal', 1)
ON CONFLICT (id_carrera) DO NOTHING;

-- 5. TABLAS DE PACIENTES
-- 5.1 Estudiante
CREATE TABLE IF NOT EXISTS estudiante (
    id_paciente SERIAL PRIMARY KEY,
    primer_nombre VARCHAR(50) NOT NULL,
    segundo_nombre VARCHAR(50),
    apellido_paterno VARCHAR(50) NOT NULL,
    apellido_materno VARCHAR(50) NOT NULL,
    cedula VARCHAR(30) NOT NULL UNIQUE,
    genero VARCHAR(20) NOT NULL,
    correo_institucional VARCHAR(100) NOT NULL,
    casa VARCHAR(50),
    calle VARCHAR(50) NOT NULL,
    corregimiento VARCHAR(50) NOT NULL,
    id_carrera INT NOT NULL REFERENCES carrera(id_carrera),
    telefono VARCHAR(30)
);

-- 5.2 Profesor
CREATE TABLE IF NOT EXISTS profesor (
    id_paciente SERIAL PRIMARY KEY,
    primer_nombre VARCHAR(50) NOT NULL,
    segundo_nombre VARCHAR(50),
    apellido_paterno VARCHAR(50) NOT NULL,
    apellido_materno VARCHAR(50) NOT NULL,
    cedula VARCHAR(30) NOT NULL UNIQUE,
    genero VARCHAR(20) NOT NULL,
    correo_institucional VARCHAR(100) NOT NULL,
    telefono_personal VARCHAR(30),
    casa VARCHAR(50),
    calle VARCHAR(50) NOT NULL,
    corregimiento VARCHAR(50) NOT NULL,
    id_facultad INT NOT NULL REFERENCES facultad(id_facultad)
);

-- 5.3 Administrativo
CREATE TABLE IF NOT EXISTS administrativo (
    id_paciente SERIAL PRIMARY KEY,
    primer_nombre VARCHAR(50) NOT NULL,
    segundo_nombre VARCHAR(50),
    apellido_paterno VARCHAR(50) NOT NULL,
    apellido_materno VARCHAR(50) NOT NULL,
    cedula VARCHAR(30) NOT NULL UNIQUE,
    genero VARCHAR(20) NOT NULL,
    correo_institucional VARCHAR(100) NOT NULL,
    telefono_personal VARCHAR(30),
    casa VARCHAR(50),
    calle VARCHAR(50) NOT NULL,
    corregimiento VARCHAR(50) NOT NULL,
    departamento VARCHAR(100)
);

-- Pacientes iniciales de ejemplo
INSERT INTO estudiante (primer_nombre, segundo_nombre, apellido_paterno, apellido_materno, cedula, genero, correo_institucional, casa, calle, corregimiento, id_carrera, telefono)
VALUES
('Ana', 'Lucia', 'González', 'Mora', '8-999-111', 'Femenino', 'ana.gonzalez@utp.ac.pa', '12', 'Via España', 'Bella Vista', 1, '62112233'),
('Pedro', 'Antonio', 'Rodríguez', 'Santos', '8-888-222', 'Masculino', 'pedro.rodriguez@utp.ac.pa', '45', 'Calle 50', 'San Francisco', 2, '63445566')
ON CONFLICT (cedula) DO NOTHING;

INSERT INTO profesor (primer_nombre, segundo_nombre, apellido_paterno, apellido_materno, cedula, genero, correo_institucional, telefono_personal, casa, calle, corregimiento, id_facultad)
VALUES
('Martín', 'Alberto', 'Castillo', 'Torres', '8-777-333', 'Masculino', 'martin.castillo@utp.ac.pa', '64778899', '23', 'Transístmica', 'Betania', 6)
ON CONFLICT (cedula) DO NOTHING;

INSERT INTO administrativo (primer_nombre, segundo_nombre, apellido_paterno, apellido_materno, cedula, genero, correo_institucional, telefono_personal, casa, calle, corregimiento, departamento)
VALUES
('Elena', 'Beatriz', 'Vargas', 'Pardo', '8-666-444', 'Femenino', 'elena.vargas@utp.ac.pa', '65990011', '67', 'Tumba Muerto', 'Pueblo Nuevo', 'Recursos Humanos')
ON CONFLICT (cedula) DO NOTHING;

-- 6. TABLA: SERVICIO
CREATE TABLE IF NOT EXISTS servicio (
    id_servicio SERIAL PRIMARY KEY,
    nombre_servicio VARCHAR(50) NOT NULL
);

INSERT INTO servicio (id_servicio, nombre_servicio) VALUES 
(1, 'Consulta Inicial'),
(2, 'Seguimiento'),
(3, 'Orientación')
ON CONFLICT (id_servicio) DO NOTHING;

-- 7. TABLA: CITA
CREATE TABLE IF NOT EXISTS cita (
    id_cita SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    hora VARCHAR(20) NOT NULL,
    id_servicio INT NOT NULL REFERENCES servicio(id_servicio),
    id_estudiante INT REFERENCES estudiante(id_paciente),
    id_prof INT REFERENCES profesor(id_paciente),
    id_admin INT REFERENCES administrativo(id_paciente),
    id_psicologo INT REFERENCES psicologo(id_psico)
);

-- Citas de ejemplo
INSERT INTO cita (fecha, hora, id_servicio, id_estudiante, id_prof, id_admin, id_psicologo)
VALUES 
(CURRENT_DATE, '09:00', 1, 1, NULL, NULL, 1),
(CURRENT_DATE + INTERVAL '1 day', '10:30', 2, NULL, 1, NULL, 2);

-- 8. TABLA: NOTA (Anotaciones / Expediente clínico)
CREATE TABLE IF NOT EXISTS nota (
    id_nota SERIAL PRIMARY KEY,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_estudiante INT REFERENCES estudiante(id_paciente),
    id_prof INT REFERENCES profesor(id_paciente),
    id_admin INT REFERENCES administrativo(id_paciente),
    id_psico INT REFERENCES psicologo(id_psico),
    observacion TEXT NOT NULL
);

INSERT INTO nota (fecha_creacion, id_estudiante, observacion)
VALUES 
(CURRENT_TIMESTAMP, 1, 'Primera sesión de orientación vocacional. El estudiante muestra gran motivación y claridad de objetivos.');
