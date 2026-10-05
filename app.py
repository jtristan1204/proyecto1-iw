import os
import ssl
import sqlite3
import urllib.parse
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv

# Cargar variables de entorno desde .env si existe
load_dotenv()

# Detectar automáticamente si la carpeta de frontend es 'proyecto' o 'public'
_base_dir = os.path.dirname(__file__)
static_dir = "proyecto" if os.path.exists(os.path.join(_base_dir, "proyecto")) else "public"
app = Flask(__name__, static_folder=static_dir, static_url_path="")

# ==============================================================================
# CONEXIÓN A BASE DE DATOS (NEON POSTGRESQL O SQLITE LOCAL DE RESPALDO)
# ==============================================================================
def get_db():
    db_url = os.environ.get("DATABASE_URL", "").strip()
    if db_url.startswith("jdbc:"):
        db_url = db_url[5:]

    if db_url.startswith("postgres"):
        try:
            import pg8000
            parsed = urllib.parse.urlparse(db_url)
            if not parsed.username or not parsed.password:
                print("[AVISO] DATABASE_URL no contiene usuario/contraseña. Usando base local SQLite.")
                raise ValueError("Falta usuario o contraseña en DATABASE_URL")

            ssl_ctx = ssl.create_default_context()
            conn = pg8000.connect(
                user=parsed.username,
                password=parsed.password,
                host=parsed.hostname,
                port=parsed.port or 5432,
                database=parsed.path.lstrip("/"),
                ssl_context=ssl_ctx
            )
            return conn, "postgres"
        except Exception as e:
            # Fallback seguro a SQLite local si la conexión a Neon falla
            pass

    # SQLite local para desarrollo inmediato sin configuración previa
    db_path = os.path.join(os.path.dirname(__file__), "dnop_local.db")
    init_sqlite = not os.path.exists(db_path)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    if init_sqlite:
        init_local_sqlite(conn)
    return conn, "sqlite"

def execute_query(conn, db_type, sql, params=()):
    cursor = conn.cursor()
    if db_type == "sqlite":
        # En SQLite los placeholders son '?' en lugar de '%s'
        cursor.execute(sql.replace("%s", "?"), params)
    else:
        cursor.execute(sql, params)
    return cursor

def fetchall_dict(cursor):
    if not cursor.description:
        return []
    columns = [col[0].lower() for col in cursor.description]
    results = []
    for row in cursor.fetchall():
        results.append(dict(zip(columns, row)))
    return results

def fetchone_dict(cursor):
    rows = fetchall_dict(cursor)
    return rows[0] if rows else None

# ==============================================================================
# INICIALIZADOR DE BASE DE DATOS LOCAL SQLITE
# ==============================================================================
def init_local_sqlite(conn):
    schema = """
    CREATE TABLE IF NOT EXISTS cargo (id_cargo INTEGER PRIMARY KEY, nombre_cargo TEXT NOT NULL);
    INSERT OR IGNORE INTO cargo VALUES (1, 'Directora'), (2, 'Psicólogo General');

    CREATE TABLE IF NOT EXISTS psicologo (
        id_psico INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT UNIQUE NOT NULL,
        contrasena TEXT NOT NULL,
        primer_nombre TEXT NOT NULL,
        segundo_nombre TEXT,
        apellido_paterno TEXT NOT NULL,
        apellido_materno TEXT NOT NULL,
        cedula TEXT NOT NULL,
        genero TEXT NOT NULL,
        correo_institucional TEXT NOT NULL,
        telefono TEXT NOT NULL,
        casa TEXT,
        calle TEXT NOT NULL,
        corregimiento TEXT NOT NULL,
        id_cargo INTEGER NOT NULL
    );
    INSERT OR IGNORE INTO psicologo (id_psico, usuario, contrasena, primer_nombre, segundo_nombre, apellido_paterno, apellido_materno, cedula, genero, correo_institucional, telefono, casa, calle, corregimiento, id_cargo)
    VALUES 
    (1, 'fatima', '1234', 'Fatima', 'Maria', 'Pérez', 'Gómez', '8-123-456', 'Femenino', 'fatima.maria@empresa.com', '61234567', 'Casa 15', 'Calle 50', 'Bethania', 1),
    (2, 'rios', '1234', 'Carlos', 'Eduardo', 'Ríos', 'Sánchez', '8-456-789', 'Masculino', 'carlos.rios@empresa.com', '69876543', 'Casa 20', 'Calle 10', 'Bella Vista', 2),
    (3, 'JuanD', 'JuanD1324', 'Juan', 'David', 'De León', 'Gómez', '8-789-012', 'Masculino', 'juan.deleon@empresa.com', '65432109', 'Casa 30', 'Calle 15', 'San Francisco', 2);

    CREATE TABLE IF NOT EXISTS facultad (id_facultad INTEGER PRIMARY KEY, nombre_facultad TEXT NOT NULL);
    INSERT OR IGNORE INTO facultad VALUES 
    (1, 'Ciencia y tecnología'), (2, 'Ingeniería Civil'), (3, 'Ingeniería Eléctrica'),
    (4, 'Ingeniería Industrial'), (5, 'Ingeniería Mecánica'), (6, 'Ingeniería de Sistemas Computacionales');

    CREATE TABLE IF NOT EXISTS carrera (id_carrera INTEGER PRIMARY KEY, nombre_carrera TEXT NOT NULL, id_facu INTEGER NOT NULL);
    INSERT OR IGNORE INTO carrera VALUES
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
    (12, 'Licenciatura en Ingeniería Forestal', 1);

    CREATE TABLE IF NOT EXISTS estudiante (
        id_paciente INTEGER PRIMARY KEY AUTOINCREMENT,
        primer_nombre TEXT NOT NULL, segundo_nombre TEXT,
        apellido_paterno TEXT NOT NULL, apellido_materno TEXT NOT NULL,
        cedula TEXT UNIQUE NOT NULL, genero TEXT NOT NULL,
        correo_institucional TEXT NOT NULL, casa TEXT, calle TEXT NOT NULL,
        corregimiento TEXT NOT NULL, id_carrera INTEGER NOT NULL, telefono TEXT
    );
    INSERT OR IGNORE INTO estudiante (id_paciente, primer_nombre, segundo_nombre, apellido_paterno, apellido_materno, cedula, genero, correo_institucional, casa, calle, corregimiento, id_carrera, telefono)
    VALUES
    (1, 'Ana', 'Lucia', 'González', 'Mora', '8-999-111', 'Femenino', 'ana.gonzalez@utp.ac.pa', '12', 'Via España', 'Bella Vista', 1, '62112233'),
    (2, 'Pedro', 'Antonio', 'Rodríguez', 'Santos', '8-888-222', 'Masculino', 'pedro.rodriguez@utp.ac.pa', '45', 'Calle 50', 'San Francisco', 2, '63445566');

    CREATE TABLE IF NOT EXISTS profesor (
        id_paciente INTEGER PRIMARY KEY AUTOINCREMENT,
        primer_nombre TEXT NOT NULL, segundo_nombre TEXT,
        apellido_paterno TEXT NOT NULL, apellido_materno TEXT NOT NULL,
        cedula TEXT UNIQUE NOT NULL, genero TEXT NOT NULL,
        correo_institucional TEXT NOT NULL, telefono_personal TEXT,
        casa TEXT, calle TEXT NOT NULL, corregimiento TEXT NOT NULL, id_facultad INTEGER NOT NULL
    );
    INSERT OR IGNORE INTO profesor (id_paciente, primer_nombre, segundo_nombre, apellido_paterno, apellido_materno, cedula, genero, correo_institucional, telefono_personal, casa, calle, corregimiento, id_facultad)
    VALUES (1, 'Martín', 'Alberto', 'Castillo', 'Torres', '8-777-333', 'Masculino', 'martin.castillo@utp.ac.pa', '64778899', '23', 'Transístmica', 'Betania', 6);

    CREATE TABLE IF NOT EXISTS administrativo (
        id_paciente INTEGER PRIMARY KEY AUTOINCREMENT,
        primer_nombre TEXT NOT NULL, segundo_nombre TEXT,
        apellido_paterno TEXT NOT NULL, apellido_materno TEXT NOT NULL,
        cedula TEXT UNIQUE NOT NULL, genero TEXT NOT NULL,
        correo_institucional TEXT NOT NULL, telefono_personal TEXT,
        casa TEXT, calle TEXT NOT NULL, corregimiento TEXT NOT NULL, departamento TEXT
    );
    INSERT OR IGNORE INTO administrativo (id_paciente, primer_nombre, segundo_nombre, apellido_paterno, apellido_materno, cedula, genero, correo_institucional, telefono_personal, casa, calle, corregimiento, departamento)
    VALUES (1, 'Elena', 'Beatriz', 'Vargas', 'Pardo', '8-666-444', 'Femenino', 'elena.vargas@utp.ac.pa', '65990011', '67', 'Tumba Muerto', 'Pueblo Nuevo', 'Recursos Humanos');

    CREATE TABLE IF NOT EXISTS servicio (id_servicio INTEGER PRIMARY KEY, nombre_servicio TEXT NOT NULL);
    INSERT OR IGNORE INTO servicio VALUES (1, 'Consulta Inicial'), (2, 'Seguimiento'), (3, 'Orientación');

    CREATE TABLE IF NOT EXISTS cita (
        id_cita INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha TEXT NOT NULL,
        hora TEXT NOT NULL,
        id_servicio INTEGER NOT NULL,
        id_estudiante INTEGER,
        id_prof INTEGER,
        id_admin INTEGER,
        id_psicologo INTEGER
    );
    INSERT OR IGNORE INTO cita (id_cita, fecha, hora, id_servicio, id_estudiante, id_psicologo)
    VALUES (1, date('now'), '09:00', 1, 1, 1);

    CREATE TABLE IF NOT EXISTS nota (
        id_nota INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha_creacion TEXT DEFAULT (datetime('now', 'localtime')),
        id_estudiante INTEGER,
        id_prof INTEGER,
        id_admin INTEGER,
        id_psico INTEGER,
        observacion TEXT NOT NULL
    );
    INSERT OR IGNORE INTO nota (id_nota, id_estudiante, observacion)
    VALUES (1, 1, 'Primera sesión de orientación vocacional. El estudiante muestra gran motivación y claridad de objetivos.');
    """
    conn.executescript(schema)
    conn.commit()

# ==============================================================================
# RUTAS DE LA API REST
# ==============================================================================

# 1. Autenticación de Psicólogos
@app.route("/api/auth/login", methods=["POST"])
def api_login():
    data = request.get_json() or {}
    usuario = data.get("usuario", "").strip()
    contrasena = data.get("contrasena", "").strip()

    if not usuario or not contrasena:
        return jsonify({"success": False, "error": "Debe ingresar usuario y contraseña"}), 400

    conn, db_type = get_db()
    try:
        sql = """
            SELECT p.id_psico, p.usuario, p.primer_nombre, p.apellido_paterno, p.apellido_materno, 
                   p.correo_institucional, p.id_cargo, c.nombre_cargo
            FROM psicologo p
            LEFT JOIN cargo c ON p.id_cargo = c.id_cargo
            WHERE p.usuario = %s AND p.contrasena = %s
        """
        cur = execute_query(conn, db_type, sql, (usuario, contrasena))
        user = fetchone_dict(cur)
        if user:
            return jsonify({"success": True, "user": user})
        else:
            return jsonify({"success": False, "error": "Usuario o contraseña incorrectos"}), 401
    finally:
        conn.close()

# 2. Listar Psicólogos (con filtro de búsqueda)
@app.route("/api/psicologos", methods=["GET"])
def api_get_psicologos():
    busqueda = request.args.get("busqueda", "").strip().lower()
    conn, db_type = get_db()
    try:
        if busqueda:
            term = f"%{busqueda}%"
            sql = """
                SELECT p.id_psico, p.primer_nombre, p.apellido_paterno, p.apellido_materno, 
                       c.nombre_cargo, p.correo_institucional, p.telefono
                FROM psicologo p
                JOIN cargo c ON p.id_cargo = c.id_cargo
                WHERE LOWER(p.primer_nombre || ' ' || p.apellido_paterno || ' ' || c.nombre_cargo) LIKE %s
                ORDER BY p.id_psico
            """
            cur = execute_query(conn, db_type, sql, (term,))
        else:
            sql = """
                SELECT p.id_psico, p.primer_nombre, p.apellido_paterno, p.apellido_materno, 
                       c.nombre_cargo, p.correo_institucional, p.telefono
                FROM psicologo p
                JOIN cargo c ON p.id_cargo = c.id_cargo
                ORDER BY p.id_psico
            """
            cur = execute_query(conn, db_type, sql)
        
        psicologos = fetchall_dict(cur)
        return jsonify(psicologos)
    finally:
        conn.close()

# 3. Registrar Psicólogo
@app.route("/api/psicologos", methods=["POST"])
def api_post_psicologo():
    data = request.get_json() or {}
    conn, db_type = get_db()
    try:
        sql = """
            INSERT INTO psicologo (
                usuario, contrasena, primer_nombre, segundo_nombre, 
                apellido_paterno, apellido_materno, cedula, genero, 
                correo_institucional, telefono, casa, calle, corregimiento, id_cargo
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            data.get("user"),
            data.get("password"),
            data.get("primer_nombre"),
            data.get("segundo_nombre", ""),
            data.get("primer_apellido"),
            data.get("segundo_apellido"),
            data.get("cedula"),
            data.get("genero"),
            data.get("correo"),
            data.get("telefono"),
            data.get("casa", ""),
            data.get("calle"),
            data.get("corregimiento"),
            int(data.get("id_cargo", 2))
        )
        execute_query(conn, db_type, sql, params)
        conn.commit()
        return jsonify({"success": True, "message": "Psicólogo registrado exitosamente"})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 400
    finally:
        conn.close()

# 4. Listar Citas (con filtro por fecha)
@app.route("/api/citas", methods=["GET"])
def api_get_citas():
    fecha_filtro = request.args.get("fecha", "").strip()
    conn, db_type = get_db()
    try:
        if fecha_filtro:
            sql = """
                SELECT c.id_cita, CAST(c.fecha AS TEXT) as fecha, c.hora, c.id_servicio, s.nombre_servicio,
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
                WHERE CAST(c.fecha AS TEXT) LIKE %s
                ORDER BY c.fecha DESC, c.hora DESC
            """
            cur = execute_query(conn, db_type, sql, (f"{fecha_filtro}%",))
        else:
            sql = """
                SELECT c.id_cita, CAST(c.fecha AS TEXT) as fecha, c.hora, c.id_servicio, s.nombre_servicio,
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
                ORDER BY c.fecha DESC, c.hora DESC
            """
            cur = execute_query(conn, db_type, sql)

        citas = fetchall_dict(cur)
        return jsonify(citas)
    finally:
        conn.close()

# 5. Agendar Cita
@app.route("/api/citas", methods=["POST"])
def api_post_cita():
    data = request.get_json() or {}
    fecha = data.get("fecha")
    hora = data.get("hora")
    tipo = data.get("tipo_paciente", "Estudiante")
    cedula = data.get("cedula", "").strip()
    id_servicio = int(data.get("id_servicio", 1))
    id_psicologo = int(data.get("id_psicologo", 1))

    conn, db_type = get_db()
    try:
        id_est = None
        id_prof = None
        id_adm = None

        # Localizar el ID del paciente según la cédula y tipo
        if tipo.lower() == "estudiante":
            cur = execute_query(conn, db_type, "SELECT id_paciente FROM estudiante WHERE cedula = %s LIMIT 1", (cedula,))
            row = fetchone_dict(cur)
            if not row:
                return jsonify({"success": False, "error": f"No se encontró un Estudiante con cédula '{cedula}'"}), 404
            id_est = row["id_paciente"]
        elif tipo.lower() == "profesor":
            cur = execute_query(conn, db_type, "SELECT id_paciente FROM profesor WHERE cedula = %s LIMIT 1", (cedula,))
            row = fetchone_dict(cur)
            if not row:
                return jsonify({"success": False, "error": f"No se encontró un Profesor con cédula '{cedula}'"}), 404
            id_prof = row["id_paciente"]
        else:
            cur = execute_query(conn, db_type, "SELECT id_paciente FROM administrativo WHERE cedula = %s LIMIT 1", (cedula,))
            row = fetchone_dict(cur)
            if not row:
                return jsonify({"success": False, "error": f"No se encontró un Administrativo con cédula '{cedula}'"}), 404
            id_adm = row["id_paciente"]

        sql = """
            INSERT INTO cita (fecha, hora, id_servicio, id_estudiante, id_prof, id_admin, id_psicologo)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        execute_query(conn, db_type, sql, (fecha, hora, id_servicio, id_est, id_prof, id_adm, id_psicologo))
        conn.commit()
        return jsonify({"success": True, "message": "Cita agendada exitosamente"})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 400
    finally:
        conn.close()

# 6. Listar Expedientes (Estudiantes, Profesores, Administrativos)
@app.route("/api/expedientes", methods=["GET"])
def api_get_expedientes():
    busqueda = request.args.get("busqueda", "").strip().lower()
    conn, db_type = get_db()
    try:
        term = f"%{busqueda}%" if busqueda else "%"
        sql = """
            SELECT id_paciente, primer_nombre, apellido_paterno, cedula, correo_institucional, 'Estudiante' AS tipo
            FROM estudiante
            WHERE LOWER(primer_nombre || ' ' || apellido_paterno || ' ' || cedula) LIKE %s
            UNION ALL
            SELECT id_paciente, primer_nombre, apellido_paterno, cedula, correo_institucional, 'Profesor' AS tipo
            FROM profesor
            WHERE LOWER(primer_nombre || ' ' || apellido_paterno || ' ' || cedula) LIKE %s
            UNION ALL
            SELECT id_paciente, primer_nombre, apellido_paterno, cedula, correo_institucional, 'Administrativo' AS tipo
            FROM administrativo
            WHERE LOWER(primer_nombre || ' ' || apellido_paterno || ' ' || cedula) LIKE %s
            ORDER BY primer_nombre
        """
        cur = execute_query(conn, db_type, sql, (term, term, term))
        pacientes = fetchall_dict(cur)
        return jsonify(pacientes)
    finally:
        conn.close()

# 7. Crear Expediente de Paciente
@app.route("/api/expedientes", methods=["POST"])
def api_post_expediente():
    data = request.get_json() or {}
    tipo = data.get("tipo", "estudiante").lower()
    conn, db_type = get_db()
    try:
        if tipo == "estudiante":
            sql = """
                INSERT INTO estudiante (
                    primer_nombre, segundo_nombre, apellido_paterno, apellido_materno,
                    cedula, genero, correo_institucional, casa, calle, corregimiento, id_carrera, telefono
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            params = (
                data.get("primer_nombre"), data.get("segundo_nombre", ""),
                data.get("apellido_paterno"), data.get("apellido_materno"),
                data.get("cedula"), data.get("genero"), data.get("correo"),
                data.get("casa", ""), data.get("calle"), data.get("corregimiento"),
                int(data.get("id_carrera", 1)), data.get("telefono")
            )
            execute_query(conn, db_type, sql, params)
        elif tipo == "profesor":
            sql = """
                INSERT INTO profesor (
                    primer_nombre, segundo_nombre, apellido_paterno, apellido_materno,
                    cedula, genero, correo_institucional, telefono_personal, casa, calle, corregimiento, id_facultad
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            params = (
                data.get("primer_nombre"), data.get("segundo_nombre", ""),
                data.get("apellido_paterno"), data.get("apellido_materno"),
                data.get("cedula"), data.get("genero"), data.get("correo"),
                data.get("telefono"), data.get("casa", ""), data.get("calle"),
                data.get("corregimiento"), int(data.get("id_facultad", 6))
            )
            execute_query(conn, db_type, sql, params)
        else: # administrativo
            sql = """
                INSERT INTO administrativo (
                    primer_nombre, segundo_nombre, apellido_paterno, apellido_materno,
                    cedula, genero, correo_institucional, telefono_personal, casa, calle, corregimiento, departamento
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            params = (
                data.get("primer_nombre"), data.get("segundo_nombre", ""),
                data.get("apellido_paterno"), data.get("apellido_materno"),
                data.get("cedula"), data.get("genero"), data.get("correo"),
                data.get("telefono"), data.get("casa", ""), data.get("calle"),
                data.get("corregimiento"), data.get("departamento", "General")
            )
            execute_query(conn, db_type, sql, params)

        conn.commit()
        return jsonify({"success": True, "message": "Expediente creado exitosamente"})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 400
    finally:
        conn.close()

# 8. Obtener Información de Paciente y sus Notas
@app.route("/api/pacientes/<int:id_paciente>/notas", methods=["GET"])
def api_get_notas(id_paciente):
    tipo = request.args.get("tipo", "estudiante").lower()
    conn, db_type = get_db()
    try:
        # Obtener datos de la persona
        tabla = "estudiante" if tipo == "estudiante" else ("profesor" if tipo == "profesor" else "administrativo")
        sql_pac = f"SELECT * FROM {tabla} WHERE id_paciente = %s LIMIT 1"
        cur = execute_query(conn, db_type, sql_pac, (id_paciente,))
        paciente = fetchone_dict(cur)

        # Obtener notas
        col_id = "id_estudiante" if tipo == "estudiante" else ("id_prof" if tipo == "profesor" else "id_admin")
        sql_notas = f"SELECT id_nota, CAST(fecha_creacion AS TEXT) as fecha_creacion, observacion FROM nota WHERE {col_id} = %s ORDER BY fecha_creacion DESC"
        cur_notas = execute_query(conn, db_type, sql_notas, (id_paciente,))
        notas = fetchall_dict(cur_notas)

        return jsonify({
            "paciente": paciente,
            "notas": notas
        })
    finally:
        conn.close()

# 9. Crear Nota / Anotación Clínica
@app.route("/api/notas", methods=["POST"])
def api_post_nota():
    data = request.get_json() or {}
    id_paciente = int(data.get("id_paciente"))
    tipo = data.get("tipo_paciente", "estudiante").lower()
    observacion = data.get("observacion", "").strip()
    id_psico = data.get("id_psico")

    if not observacion:
        return jsonify({"success": False, "error": "La observación no puede estar vacía"}), 400

    conn, db_type = get_db()
    try:
        id_est = id_paciente if tipo == "estudiante" else None
        id_prof = id_paciente if tipo == "profesor" else None
        id_adm = id_paciente if tipo == "administrativo" else None

        sql = """
            INSERT INTO nota (id_estudiante, id_prof, id_admin, id_psico, observacion)
            VALUES (%s, %s, %s, %s, %s)
        """
        execute_query(conn, db_type, sql, (id_est, id_prof, id_adm, id_psico, observacion))
        conn.commit()
        return jsonify({"success": True, "message": "Anotación guardada exitosamente"})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 400
    finally:
        conn.close()

# 10. Reporte Diario de Atenciones y Citas
@app.route("/api/reportes/diario", methods=["GET"])
def api_get_reporte_diario():
    fecha = request.args.get("fecha", "").strip()
    if not fecha:
        fecha = datetime.now().strftime("%Y-%m-%d")
    
    conn, db_type = get_db()
    try:
        # Citas del día con detalles
        sql_citas = """
            SELECT c.id_cita, CAST(c.fecha AS TEXT) as fecha, c.hora, c.id_servicio, s.nombre_servicio,
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
            WHERE CAST(c.fecha AS TEXT) LIKE %s
            ORDER BY c.hora ASC
        """
        cur = execute_query(conn, db_type, sql_citas, (f"{fecha}%",))
        citas = fetchall_dict(cur)

        # Notas u observaciones registradas en la fecha
        sql_notas = """
            SELECT n.id_nota, CAST(n.fecha_creacion AS TEXT) as fecha_creacion, n.observacion,
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
            WHERE CAST(n.fecha_creacion AS TEXT) LIKE %s
            ORDER BY n.fecha_creacion ASC
        """
        cur_notas = execute_query(conn, db_type, sql_notas, (f"{fecha}%",))
        notas = fetchall_dict(cur_notas)

        # Resumen / Métricas estadísticas
        total_citas = len(citas)
        estudiantes = sum(1 for c in citas if c.get("tipo_paciente") == "Estudiante")
        profesores = sum(1 for c in citas if c.get("tipo_paciente") == "Profesor")
        administrativos = sum(1 for c in citas if c.get("tipo_paciente") == "Administrativo")

        # Conteo por servicio
        servicios_count = {}
        for c in citas:
            srv = c.get("nombre_servicio") or "Sin especificar"
            servicios_count[srv] = servicios_count.get(srv, 0) + 1

        # Conteo por psicólogo
        psicologos_count = {}
        for c in citas:
            psi = c.get("nombre_psicologo") or "No asignado"
            psicologos_count[psi] = psicologos_count.get(psi, 0) + 1

        return jsonify({
            "fecha": fecha,
            "metricas": {
                "total_citas": total_citas,
                "estudiantes": estudiantes,
                "profesores": profesores,
                "administrativos": administrativos,
                "servicios": servicios_count,
                "psicologos": psicologos_count,
                "total_notas": len(notas)
            },
            "citas": citas,
            "notas": notas
        })
    finally:
        conn.close()

# ==============================================================================
# ENRUTADOR DE ARCHIVOS ESTÁTICOS
# ==============================================================================
@app.route("/")
def root():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/<path:path>")
def static_proxy(path):
    file_path = os.path.join(app.static_folder, path)
    if os.path.exists(file_path):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")

# ==============================================================================
# INICIO DEL SERVIDOR
# ==============================================================================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    test_conn, db_type = get_db()
    test_conn.close()

    print(f"==================================================")
    print(f" Servidor DNOP activo en http://localhost:{port}")
    if db_type == "postgres":
        print(f" Base de Datos: CONECTADO A NEON (PostgreSQL)")
    else:
        print(f" Base de Datos: LOCAL (SQLite - dnop_local.db)")
        print(f" [Aviso] Para conectar a Neon, define tu DATABASE_URL completa con usuario y clave.")
    print(f"==================================================")
    app.run(host="0.0.0.0", port=port, debug=True)
