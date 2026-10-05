const express = require('express');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

const fs = require('fs');
app.use(express.json());
const staticDir = fs.existsSync(path.join(__dirname, 'proyecto')) ? 'proyecto' : 'public';
app.use(express.static(path.join(__dirname, staticDir)));

// Pool de conexión a Neon PostgreSQL
const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    })
    : null;

// Helper para consultas
async function query(text, params) {
    if (!pool) {
        throw new Error("DATABASE_URL no está configurada en las variables de entorno.");
    }
    return pool.query(text, params);
}

// 1. Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { usuario, contrasena } = req.body;
        const result = await query(
            `SELECT p.id_psico, p.usuario, p.primer_nombre, p.apellido_paterno, p.apellido_materno, 
                    p.correo_institucional, p.id_cargo, c.nombre_cargo
             FROM psicologo p
             LEFT JOIN cargo c ON p.id_cargo = c.id_cargo
             WHERE p.usuario = $1 AND p.contrasena = $2`,
            [usuario, contrasena]
        );
        if (result.rows.length > 0) {
            res.json({ success: true, user: result.rows[0] });
        } else {
            res.status(401).json({ success: false, error: 'Usuario o contraseña incorrectos' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Listar Psicólogos
app.get('/api/psicologos', async (req, res) => {
    try {
        const busqueda = (req.query.busqueda || '').trim().toLowerCase();
        let result;
        if (busqueda) {
            result = await query(
                `SELECT p.id_psico, p.primer_nombre, p.apellido_paterno, p.apellido_materno, 
                        c.nombre_cargo, p.correo_institucional, p.telefono
                 FROM psicologo p
                 JOIN cargo c ON p.id_cargo = c.id_cargo
                 WHERE LOWER(p.primer_nombre || ' ' || p.apellido_paterno || ' ' || c.nombre_cargo) LIKE $1
                 ORDER BY p.id_psico`,
                [`%${busqueda}%`]
            );
        } else {
            result = await query(
                `SELECT p.id_psico, p.primer_nombre, p.apellido_paterno, p.apellido_materno, 
                        c.nombre_cargo, p.correo_institucional, p.telefono
                 FROM psicologo p
                 JOIN cargo c ON p.id_cargo = c.id_cargo
                 ORDER BY p.id_psico`
            );
        }
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Registrar Psicólogo
app.post('/api/psicologos', async (req, res) => {
    try {
        const b = req.body;
        await query(
            `INSERT INTO psicologo (
                usuario, contrasena, primer_nombre, segundo_nombre, 
                apellido_paterno, apellido_materno, cedula, genero, 
                correo_institucional, telefono, casa, calle, corregimiento, id_cargo
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
            [
                b.user, b.password, b.primer_nombre, b.segundo_nombre || '',
                b.primer_apellido, b.segundo_apellido, b.cedula, b.genero,
                b.correo, b.telefono, b.casa || '', b.calle, b.corregimiento,
                parseInt(b.id_cargo, 10) || 2
            ]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// 4. Listar Citas
app.get('/api/citas', async (req, res) => {
    try {
        const fecha = req.query.fecha;
        let sql = `
            SELECT c.id_cita, TO_CHAR(c.fecha, 'YYYY-MM-DD') as fecha, c.hora, c.id_servicio, s.nombre_servicio,
                   COALESCE(e.primer_nombre || ' ' || e.apellido_paterno,
                            pr.primer_nombre || ' ' || pr.apellido_paterno,
                            a.primer_nombre || ' ' || a.apellido_paterno) AS nombre_paciente,
                   COALESCE(e.cedula, pr.cedula, a.cedula) AS cedula_paciente,
                   CASE 
                       WHEN c.id_estudiante IS NOT NULL THEN 'Estudiante'
                       WHEN c.id_prof IS NOT NULL THEN 'Profesor'
                       WHEN c.id_admin IS NOT NULL THEN 'Administrativo'
                       ELSE 'General'
                   END AS tipo_paciente
            FROM cita c
            LEFT JOIN servicio s ON c.id_servicio = s.id_servicio
            LEFT JOIN estudiante e ON c.id_estudiante = e.id_paciente
            LEFT JOIN profesor pr ON c.id_prof = pr.id_paciente
            LEFT JOIN administrativo a ON c.id_admin = a.id_paciente
        `;
        let params = [];
        if (fecha) {
            sql += ` WHERE TO_CHAR(c.fecha, 'YYYY-MM-DD') = $1`;
            params.push(fecha);
        }
        sql += ` ORDER BY c.fecha DESC, c.hora DESC`;
        const result = await query(sql, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Agendar Cita
app.post('/api/citas', async (req, res) => {
    try {
        const { fecha, hora, tipo_paciente, cedula, id_servicio, id_psicologo } = req.body;
        let id_est = null, id_prof = null, id_adm = null;

        const tipo = (tipo_paciente || 'estudiante').toLowerCase();
        let checkSql = '';
        if (tipo === 'estudiante') checkSql = 'SELECT id_paciente FROM estudiante WHERE cedula = $1 LIMIT 1';
        else if (tipo === 'profesor') checkSql = 'SELECT id_paciente FROM profesor WHERE cedula = $1 LIMIT 1';
        else checkSql = 'SELECT id_paciente FROM administrativo WHERE cedula = $1 LIMIT 1';

        const checkRes = await query(checkSql, [cedula]);
        if (checkRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: `No se encontró ${tipo_paciente} con cédula '${cedula}'` });
        }

        const idPac = checkRes.rows[0].id_paciente;
        if (tipo === 'estudiante') id_est = idPac;
        else if (tipo === 'profesor') id_prof = idPac;
        else id_adm = idPac;

        await query(
            `INSERT INTO cita (fecha, hora, id_servicio, id_estudiante, id_prof, id_admin, id_psicologo)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [fecha, hora, parseInt(id_servicio, 10), id_est, id_prof, id_adm, parseInt(id_psicologo, 10) || 1]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// 6. Listar Expedientes
app.get('/api/expedientes', async (req, res) => {
    try {
        const busqueda = (req.query.busqueda || '').trim().toLowerCase();
        const term = `%${busqueda}%`;
        const result = await query(
            `SELECT id_paciente, primer_nombre, apellido_paterno, cedula, correo_institucional, 'Estudiante' AS tipo
             FROM estudiante
             WHERE LOWER(primer_nombre || ' ' || apellido_paterno || ' ' || cedula) LIKE $1
             UNION ALL
             SELECT id_paciente, primer_nombre, apellido_paterno, cedula, correo_institucional, 'Profesor' AS tipo
             FROM profesor
             WHERE LOWER(primer_nombre || ' ' || apellido_paterno || ' ' || cedula) LIKE $1
             UNION ALL
             SELECT id_paciente, primer_nombre, apellido_paterno, cedula, correo_institucional, 'Administrativo' AS tipo
             FROM administrativo
             WHERE LOWER(primer_nombre || ' ' || apellido_paterno || ' ' || cedula) LIKE $1
             ORDER BY primer_nombre`,
            [term]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. Crear Expediente
app.post('/api/expedientes', async (req, res) => {
    try {
        const b = req.body;
        const tipo = (b.tipo || 'estudiante').toLowerCase();
        if (tipo === 'estudiante') {
            await query(
                `INSERT INTO estudiante (
                    primer_nombre, segundo_nombre, apellido_paterno, apellido_materno,
                    cedula, genero, correo_institucional, casa, calle, corregimiento, id_carrera, telefono
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                [
                    b.primer_nombre, b.segundo_nombre || '', b.apellido_paterno, b.apellido_materno,
                    b.cedula, b.genero, b.correo, b.casa || '', b.calle, b.corregimiento,
                    parseInt(b.id_carrera, 10) || 1, b.telefono
                ]
            );
        } else if (tipo === 'profesor') {
            await query(
                `INSERT INTO profesor (
                    primer_nombre, segundo_nombre, apellido_paterno, apellido_materno,
                    cedula, genero, correo_institucional, telefono_personal, casa, calle, corregimiento, id_facultad
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                [
                    b.primer_nombre, b.segundo_nombre || '', b.apellido_paterno, b.apellido_materno,
                    b.cedula, b.genero, b.correo, b.telefono, b.casa || '', b.calle, b.corregimiento,
                    parseInt(b.id_facultad, 10) || 6
                ]
            );
        } else {
            await query(
                `INSERT INTO administrativo (
                    primer_nombre, segundo_nombre, apellido_paterno, apellido_materno,
                    cedula, genero, correo_institucional, telefono_personal, casa, calle, corregimiento, departamento
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                [
                    b.primer_nombre, b.segundo_nombre || '', b.apellido_paterno, b.apellido_materno,
                    b.cedula, b.genero, b.correo, b.telefono, b.casa || '', b.calle, b.corregimiento,
                    b.departamento || 'General'
                ]
            );
        }
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// 8. Notas de Paciente
app.get('/api/pacientes/:id/notas', async (req, res) => {
    try {
        const idPaciente = parseInt(req.params.id, 10);
        const tipo = (req.query.tipo || 'estudiante').toLowerCase();

        const tabla = tipo === 'estudiante' ? 'estudiante' : (tipo === 'profesor' ? 'profesor' : 'administrativo');
        const pacRes = await query(`SELECT * FROM ${tabla} WHERE id_paciente = $1 LIMIT 1`, [idPaciente]);
        const paciente = pacRes.rows[0] || null;

        const colId = tipo === 'estudiante' ? 'id_estudiante' : (tipo === 'profesor' ? 'id_prof' : 'id_admin');
        const notasRes = await query(
            `SELECT id_nota, TO_CHAR(fecha_creacion, 'YYYY-MM-DD HH24:MI') as fecha_creacion, observacion 
             FROM nota WHERE ${colId} = $1 ORDER BY fecha_creacion DESC`,
            [idPaciente]
        );

        res.json({ paciente, notas: notasRes.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 9. Guardar Nota
app.post('/api/notas', async (req, res) => {
    try {
        const { id_paciente, tipo_paciente, observacion, id_psico } = req.body;
        const tipo = (tipo_paciente || 'estudiante').toLowerCase();
        const idEst = tipo === 'estudiante' ? id_paciente : null;
        const idProf = tipo === 'profesor' ? id_paciente : null;
        const idAdm = tipo === 'administrativo' ? id_paciente : null;

        await query(
            `INSERT INTO nota (id_estudiante, id_prof, id_admin, id_psico, observacion)
             VALUES ($1, $2, $3, $4, $5)`,
            [idEst, idProf, idAdm, id_psico || null, observacion]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// 10. Reporte Diario
app.get('/api/reportes/diario', async (req, res) => {
    try {
        const fecha = req.query.fecha || new Date().toISOString().substring(0, 10);
        
        // Citas del día
        const sqlCitas = `
            SELECT c.id_cita, TO_CHAR(c.fecha, 'YYYY-MM-DD') as fecha, c.hora, c.id_servicio, s.nombre_servicio,
                   c.id_psicologo,
                   COALESCE(ps.primer_nombre || ' ' || ps.apellido_paterno, 'No asignado') AS nombre_psicologo,
                   COALESCE(e.primer_nombre || ' ' || e.apellido_paterno,
                            pr.primer_nombre || ' ' || pr.apellido_paterno,
                            a.primer_nombre || ' ' || a.apellido_paterno) AS nombre_paciente,
                   COALESCE(e.cedula, pr.cedula, a.cedula) AS cedula_paciente,
                   CASE 
                       WHEN c.id_estudiante IS NOT NULL THEN 'Estudiante'
                       WHEN c.id_prof IS NOT NULL THEN 'Profesor'
                       WHEN c.id_admin IS NOT NULL THEN 'Administrativo'
                       ELSE 'General'
                   END AS tipo_paciente,
                   COALESCE(car.nombre_carrera, fac.nombre_facultad, a.departamento, 'N/A') AS detalle_adscripcion
            FROM cita c
            LEFT JOIN servicio s ON c.id_servicio = s.id_servicio
            LEFT JOIN psicologo ps ON c.id_psicologo = ps.id_psico
            LEFT JOIN estudiante e ON c.id_estudiante = e.id_paciente
            LEFT JOIN carrera car ON e.id_carrera = car.id_carrera
            LEFT JOIN profesor pr ON c.id_prof = pr.id_paciente
            LEFT JOIN facultad fac ON pr.id_facultad = fac.id_facultad
            LEFT JOIN administrativo a ON c.id_admin = a.id_paciente
            WHERE TO_CHAR(c.fecha, 'YYYY-MM-DD') = $1
            ORDER BY c.hora ASC
        `;
        const citasRes = await query(sqlCitas, [fecha]);
        const citas = citasRes.rows;

        // Notas del día
        const sqlNotas = `
            SELECT n.id_nota, TO_CHAR(n.fecha_creacion, 'YYYY-MM-DD HH24:MI') as fecha_creacion, n.observacion,
                   COALESCE(e.primer_nombre || ' ' || e.apellido_paterno,
                            pr.primer_nombre || ' ' || pr.apellido_paterno,
                            a.primer_nombre || ' ' || a.apellido_paterno) AS nombre_paciente,
                   COALESCE(e.cedula, pr.cedula, a.cedula) AS cedula_paciente,
                   COALESCE(ps.primer_nombre || ' ' || ps.apellido_paterno, 'Especialista') AS psicologo_nota
            FROM nota n
            LEFT JOIN estudiante e ON n.id_estudiante = e.id_paciente
            LEFT JOIN profesor pr ON n.id_prof = pr.id_paciente
            LEFT JOIN administrativo a ON n.id_admin = a.id_paciente
            LEFT JOIN psicologo ps ON n.id_psico = ps.id_psico
            WHERE TO_CHAR(n.fecha_creacion, 'YYYY-MM-DD') = $1
            ORDER BY n.fecha_creacion ASC
        `;
        const notasRes = await query(sqlNotas, [fecha]);
        const notas = notasRes.rows;

        const total_citas = citas.length;
        const estudiantes = citas.filter(c => c.tipo_paciente === 'Estudiante').length;
        const profesores = citas.filter(c => c.tipo_paciente === 'Profesor').length;
        const administrativos = citas.filter(c => c.tipo_paciente === 'Administrativo').length;

        const servicios_count = {};
        citas.forEach(c => {
            const srv = c.nombre_servicio || 'Sin especificar';
            servicios_count[srv] = (servicios_count[srv] || 0) + 1;
        });

        const psicologos_count = {};
        citas.forEach(c => {
            const psi = c.nombre_psicologo || 'No asignado';
            psicologos_count[psi] = (psicologos_count[psi] || 0) + 1;
        });

        res.json({
            fecha,
            metricas: {
                total_citas,
                estudiantes,
                profesores,
                administrativos,
                servicios: servicios_count,
                psicologos: psicologos_count,
                total_notas: notas.length
            },
            citas,
            notas
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fallback al index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Servidor Node.js DNOP corriendo en el puerto ${port}`);
});
