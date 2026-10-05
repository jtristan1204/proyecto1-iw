-- ==============================================================================
-- SCRIPT CORREGIDO PARA NEON (POSTGRESQL)
-- Solución: Vincula los pacientes buscando dinámicamente sus IDs reales
-- generados por Neon, evitando que salgan en "N/A" o "General".
-- ==============================================================================

-- 1. Asegurar que los estudiantes existan en la tabla estudiante
INSERT INTO estudiante (primer_nombre, segundo_nombre, apellido_paterno, apellido_materno, cedula, genero, correo_institucional, casa, calle, corregimiento, id_carrera, telefono)
VALUES
('Ana', 'Lucia', 'González', 'Mora', '8-999-111', 'Femenino', 'ana.gonzalez@utp.ac.pa', '12', 'Via España', 'Bella Vista', 1, '62112233'),
('Pedro', 'Antonio', 'Rodríguez', 'Santos', '8-888-222', 'Masculino', 'pedro.rodriguez@utp.ac.pa', '45', 'Calle 50', 'San Francisco', 2, '63445566'),
('Sofía', 'Isabel', 'Mendoza', 'Castillo', '8-945-1234', 'Femenino', 'sofia.mendoza@utp.ac.pa', '14B', 'Vía Argentina', 'El Cangrejo', 1, '64221199'),
('Gabriel', 'Alexis', 'Chen', 'Zhang', '8-920-5678', 'Masculino', 'gabriel.chen@utp.ac.pa', '28', 'Calle 74', 'San Francisco', 5, '65338822'),
('Valeria', 'Nicole', 'Morales', 'Ruiz', '4-789-1011', 'Femenino', 'valeria.morales@utp.ac.pa', '105', 'Ave. Ricardo J. Alfaro', 'Betania', 9, '67884411'),
('Diego', 'Andrés', 'Herrera', 'Pimentel', '8-932-4455', 'Masculino', 'diego.herrera@utp.ac.pa', '4C', 'Condado del Rey', 'Ancón', 2, '61993377')
ON CONFLICT (cedula) DO NOTHING;

-- 2. Asegurar que los profesores existan
INSERT INTO profesor (primer_nombre, segundo_nombre, apellido_paterno, apellido_materno, cedula, genero, correo_institucional, telefono_personal, casa, calle, corregimiento, id_facultad)
VALUES
('Martín', 'Alberto', 'Castillo', 'Torres', '8-777-333', 'Masculino', 'martin.castillo@utp.ac.pa', '64778899', '23', 'Transístmica', 'Betania', 6),
('Roberto', 'Javier', 'Méndez', 'Guardia', '8-432-876', 'Masculino', 'roberto.mendez@utp.ac.pa', '64112255', '89', 'El Dorado', 'Betania', 3)
ON CONFLICT (cedula) DO NOTHING;

-- 3. Asegurar que los administrativos existan
INSERT INTO administrativo (primer_nombre, segundo_nombre, apellido_paterno, apellido_materno, cedula, genero, correo_institucional, telefono_personal, casa, calle, corregimiento, departamento)
VALUES
('Elena', 'Beatriz', 'Vargas', 'Pardo', '8-666-444', 'Femenino', 'elena.vargas@utp.ac.pa', '65990011', '67', 'Tumba Muerto', 'Pueblo Nuevo', 'Recursos Humanos'),
('Ricardo', 'Antonio', 'Navarro', 'Vega', '8-543-219', 'Masculino', 'ricardo.navarro@utp.ac.pa', '62771144', '304', 'Costa del Este', 'Parque Lefevre', 'Bienestar Estudiantil')
ON CONFLICT (cedula) DO NOTHING;

-- 4. Borrar las citas que salieron con N/A (IDs 13 en adelante o fechas recientes)
DELETE FROM cita WHERE id_cita >= 13;

-- 5. Insertar las 10 citas vinculando automáticamente por cédula
-- (De esta forma NUNCA saldrán en N/A porque busca el id_paciente exacto en Neon)
INSERT INTO cita (fecha, hora, id_servicio, id_estudiante, id_prof, id_admin, id_psicologo)
VALUES 
-- 08:00 AM - Estudiante: Ana González
(CURRENT_DATE, '08:00', 1, (SELECT id_paciente FROM estudiante WHERE cedula = '8-999-111' LIMIT 1), NULL, NULL, 1),

-- 08:45 AM - Profesor: Martín Castillo
(CURRENT_DATE, '08:45', 3, NULL, (SELECT id_paciente FROM profesor WHERE cedula = '8-777-333' LIMIT 1), NULL, 2),

-- 09:30 AM - Estudiante: Pedro Rodríguez
(CURRENT_DATE, '09:30', 2, (SELECT id_paciente FROM estudiante WHERE cedula = '8-888-222' LIMIT 1), NULL, NULL, 3),

-- 10:15 AM - Administrativo: Elena Vargas
(CURRENT_DATE, '10:15', 1, NULL, NULL, (SELECT id_paciente FROM administrativo WHERE cedula = '8-666-444' LIMIT 1), 1),

-- 11:00 AM - Estudiante: Sofía Mendoza
(CURRENT_DATE, '11:00', 3, (SELECT id_paciente FROM estudiante WHERE cedula = '8-945-1234' LIMIT 1), NULL, NULL, 2),

-- 11:45 AM - Estudiante: Gabriel Chen
(CURRENT_DATE, '11:45', 1, (SELECT id_paciente FROM estudiante WHERE cedula = '8-920-5678' LIMIT 1), NULL, NULL, 3),

-- 01:30 PM - Profesor: Roberto Méndez
(CURRENT_DATE, '13:30', 2, NULL, (SELECT id_paciente FROM profesor WHERE cedula = '8-432-876' LIMIT 1), NULL, 1),

-- 02:15 PM - Estudiante: Valeria Morales
(CURRENT_DATE, '14:15', 2, (SELECT id_paciente FROM estudiante WHERE cedula = '4-789-1011' LIMIT 1), NULL, NULL, 2),

-- 03:00 PM - Administrativo: Ricardo Navarro
(CURRENT_DATE, '15:00', 3, NULL, NULL, (SELECT id_paciente FROM administrativo WHERE cedula = '8-543-219' LIMIT 1), 3),

-- 03:45 PM - Estudiante: Diego Herrera
(CURRENT_DATE, '15:45', 3, (SELECT id_paciente FROM estudiante WHERE cedula = '8-932-4455' LIMIT 1), NULL, NULL, 1);
