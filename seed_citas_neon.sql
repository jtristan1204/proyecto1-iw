-- ==============================================================================
-- SCRIPT DE DATOS DE PRUEBA PARA NEON POSTGRESQL (DNOP)
-- Pega y ejecuta este script directamente en la pestaña "SQL Editor" de Neon
-- ==============================================================================

-- 1. Asegurar pacientes adicionales (Estudiantes, Profesores, Administrativos)
INSERT INTO estudiante (primer_nombre, segundo_nombre, apellido_paterno, apellido_materno, cedula, genero, correo_institucional, casa, calle, corregimiento, id_carrera, telefono)
VALUES
('Sofía', 'Isabel', 'Mendoza', 'Castillo', '8-945-1234', 'Femenino', 'sofia.mendoza@utp.ac.pa', '14B', 'Vía Argentina', 'El Cangrejo', 1, '64221199'),
('Gabriel', 'Alexis', 'Chen', 'Zhang', '8-920-5678', 'Masculino', 'gabriel.chen@utp.ac.pa', '28', 'Calle 74', 'San Francisco', 5, '65338822'),
('Valeria', 'Nicole', 'Morales', 'Ruiz', '4-789-1011', 'Femenino', 'valeria.morales@utp.ac.pa', '105', 'Ave. Ricardo J. Alfaro', 'Betania', 9, '67884411'),
('Diego', 'Andrés', 'Herrera', 'Pimentel', '8-932-4455', 'Masculino', 'diego.herrera@utp.ac.pa', '4C', 'Condado del Rey', 'Ancón', 2, '61993377'),
('Camila', 'Andrea', 'Batista', 'Ortiz', '8-912-3344', 'Femenino', 'camila.batista@utp.ac.pa', '56', 'Transístmica', 'Pueblo Nuevo', 4, '63007788')
ON CONFLICT (cedula) DO NOTHING;

INSERT INTO profesor (primer_nombre, segundo_nombre, apellido_paterno, apellido_materno, cedula, genero, correo_institucional, telefono_personal, casa, calle, corregimiento, id_facultad)
VALUES
('Roberto', 'Javier', 'Méndez', 'Guardia', '8-432-876', 'Masculino', 'roberto.mendez@utp.ac.pa', '64112255', '89', 'El Dorado', 'Betania', 3),
('Carmen', 'Rosa', 'Solís', 'De Gracia', '8-312-980', 'Femenino', 'carmen.solis@utp.ac.pa', '65889922', '12A', 'Vía Brasil', 'Bella Vista', 4)
ON CONFLICT (cedula) DO NOTHING;

INSERT INTO administrativo (primer_nombre, segundo_nombre, apellido_paterno, apellido_materno, cedula, genero, correo_institucional, telefono_personal, casa, calle, corregimiento, departamento)
VALUES
('Ricardo', 'Antonio', 'Navarro', 'Vega', '8-543-219', 'Masculino', 'ricardo.navarro@utp.ac.pa', '62771144', '304', 'Costa del Este', 'Parque Lefevre', 'Bienestar Estudiantil'),
('Mariela', 'Inés', 'Paredes', 'Campos', '8-654-321', 'Femenino', 'mariela.paredes@utp.ac.pa', '63994400', '15', 'Obarrio', 'Bella Vista', 'Secretaría General')
ON CONFLICT (cedula) DO NOTHING;


-- 2. Limpiar citas previas del día actual si deseas reiniciar la jornada
-- (Opcional: borra sólo las citas de hoy antes de insertar para evitar duplicar si corres el script varias veces)
DELETE FROM cita WHERE fecha = CURRENT_DATE;

-- 3. Insertar citas para el día de HOY (CURRENT_DATE)
-- Cobertura completa de la jornada: 8:00 AM a 4:30 PM
-- Pacientes variados: Estudiantes, Profesores, Administrativos
-- Psicólogos asignados: 1 (Fátima Pérez), 2 (Carlos Ríos), 3 (Juan David De León)
-- Servicios: 1 (Consulta Inicial), 2 (Seguimiento), 3 (Orientación)

INSERT INTO cita (fecha, hora, id_servicio, id_estudiante, id_prof, id_admin, id_psicologo)
VALUES 
-- 08:00 AM - Estudiante (Consulta Inicial con Lic. Fátima Pérez)
(CURRENT_DATE, '08:00', 1, 1, NULL, NULL, 1),

-- 08:45 AM - Profesor (Orientación con Lic. Carlos Ríos)
(CURRENT_DATE, '08:45', 3, NULL, 1, NULL, 2),

-- 09:30 AM - Estudiante (Seguimiento con Lic. Juan David De León)
(CURRENT_DATE, '09:30', 2, 2, NULL, NULL, 3),

-- 10:15 AM - Administrativo (Consulta Inicial con Lic. Fátima Pérez)
(CURRENT_DATE, '10:15', 1, NULL, NULL, 1, 1),

-- 11:00 AM - Estudiante (Orientación con Lic. Carlos Ríos)
(CURRENT_DATE, '11:00', 3, 3, NULL, NULL, 2),

-- 11:45 AM - Estudiante (Consulta Inicial con Lic. Juan David De León)
(CURRENT_DATE, '11:45', 1, 4, NULL, NULL, 3),

-- 01:30 PM - Profesor (Seguimiento con Lic. Fátima Pérez)
(CURRENT_DATE, '13:30', 2, NULL, 2, NULL, 1),

-- 02:15 PM - Estudiante (Seguimiento con Lic. Carlos Ríos)
(CURRENT_DATE, '14:15', 2, 5, NULL, NULL, 2),

-- 03:00 PM - Administrativo (Orientación con Lic. Juan David De León)
(CURRENT_DATE, '15:00', 3, NULL, NULL, 2, 3),

-- 03:45 PM - Estudiante (Orientación con Lic. Fátima Pérez)
(CURRENT_DATE, '15:45', 3, 1, NULL, NULL, 1);


-- 4. Insertar observaciones y notas clínicas para el día de HOY
-- (Estas notas aparecerán en la sección "Observaciones Clínicas" del reporte PDF)
INSERT INTO nota (fecha_creacion, id_estudiante, id_prof, id_admin, id_psico, observacion)
VALUES
(CURRENT_TIMESTAMP - INTERVAL '6 hours', 1, NULL, NULL, 1, 'Paciente acude a sesión inicial por manejo de estrés ante periodo de exámenes parciales. Se establecen técnicas de respiración diafragmática y organización de horarios de estudio.'),
(CURRENT_TIMESTAMP - INTERVAL '4 hours', NULL, 1, NULL, 2, 'Sesión de orientación laboral y clima de aula. Se coordinan pautas para la gestión de dinámicas grupales con estudiantes de primer ingreso.'),
(CURRENT_TIMESTAMP - INTERVAL '2 hours', 2, NULL, NULL, 3, 'Evaluación de avance en plan terapéutico. El paciente reporta mejoría notable en calidad del sueño y mayor concentración en actividades académicas.'),
(CURRENT_TIMESTAMP - INTERVAL '45 minutes', NULL, NULL, 1, 1, 'Entrevista de seguimiento en salud ocupacional. Se acuerdan pausas activas y canalización ergonómica en su departamento.');
