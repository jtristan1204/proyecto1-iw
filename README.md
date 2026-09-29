# 🏥 DNOP - Sistema de Orientación Psicológica
**Versión Moderna: HTML5, CSS3, JavaScript + Backend (Python Flask / Node.js) + Base de Datos Neon (PostgreSQL) + Hosting en Render**

---

## 📁 Estructura del Proyecto en `dnop-neon/`

```text
dnop-neon/
├── public/                       # Frontend puro (HTML, CSS, JS, Imágenes)
│   ├── css/                      # Tus estilos CSS originales (style1, citas, psicologos, etc.)
│   ├── img/                      # Todas las imágenes originales
│   ├── js/                       # Scripts JavaScript interactivos con fetch()
│   │   ├── auth.js               # Inicio de sesión
│   │   ├── citas.js              # Calendario y listado de citas
│   │   ├── registrar-cita.js     # Formulario para agendar cita
│   │   ├── psicologos.js         # Lista y buscador de especialistas
│   │   ├── registro-psicologo.js # Formulario de registro de especialista
│   │   ├── expedientes.js        # Consulta y búsqueda de expedientes
│   │   ├── crear-expediente.js   # Registro de estudiante, profesor o administrativo
│   │   ├── notas.js              # Historial clínico del paciente
│   │   └── hacer-anotaciones.js  # Redacción de notas clínicas
│   ├── index.html                # Login (reemplaza login.jsp)
│   ├── home.html                 # Panel de bienvenida y noticias
│   ├── citas.html                # Calendario y citas (reemplaza citas.jsp)
│   ├── registrar-cita.html       # Formulario agendar cita (reemplaza registrar_cita.jsp)
│   ├── psicologos.html           # Directorio (reemplaza psicologo.jsp)
│   ├── registro-psicologo.html   # Formulario psicólogo (reemplaza registro-psicologos.jsp)
│   ├── expedientes.html          # Expedientes (reemplaza expediente.jsp)
│   ├── crear-expediente.html     # Crear expediente (reemplaza crear_expediente.jsp)
│   ├── notas.html                # Notas de expediente (reemplaza notas.jsp)
│   ├── hacer-anotaciones.html    # Formulario de notas (reemplaza hacer_anotaciones.jsp)
│   └── sobre_nosotros.html       # Información del equipo de desarrollo
│
├── schema_neon.sql               # Script SQL listo para copiar y pegar en Neon (PostgreSQL)
├── app.py                        # Servidor Backend en Python Flask (con soporte para Neon y SQLite local)
├── requirements.txt              # Dependencias de Python para Render
├── server.js                     # Servidor Backend alternativo en Node.js Express
├── package.json                  # Dependencias de Node.js
└── .env.example                  # Plantilla para tu cadena de conexión
```

---

## ⚡ Paso 1: Crear la Base de Datos en Neon (Gratis, Sin Tarjeta)

1. Ingresa a **[neon.tech](https://neon.tech)** y regístrate gratis (puedes iniciar sesión con tu cuenta de GitHub o Google).
2. Haz clic en **Create Project**:
   * **Project name:** `dnop-db`
   * **Postgres version:** `16` (o la recomendada)
   * Haz clic en **Create Project**.
3. En el panel principal de Neon, verás la sección **Connection Details**:
   * Asegúrate de que esté seleccionado **Connection string** y copia la URL completa que se parece a:
     ```text
     postgresql://neondb_owner:xxxxxxxx@ep-cool-cloud-12345.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
4. Haz clic en la pestaña **SQL Editor** en el menú lateral de Neon:
   * Abre el archivo `schema_neon.sql` que se encuentra en esta carpeta.
   * Copia todo su contenido y pégalo en el **SQL Editor** de Neon.
   * Haz clic en **Run** (Ejecutar).
   * ¡Listo! Se habrán creado todas las tablas (`psicologo`, `estudiante`, `profesor`, `administrativo`, `cita`, `nota`, etc.) con datos iniciales de ejemplo.

---

## 💻 Paso 2: Probar el Proyecto en tu Computadora (Local)

1. Abre tu terminal de comandos dentro de la carpeta `dnop-neon`:
   ```bash
   cd "c:\Users\jtris\OneDrive\Desktop\Proyecto1 iw\dnop-neon"
   ```
2. Ejecuta el servidor:
   ```bash
   python app.py
   ```
3. Abre tu navegador web en:
   **[http://localhost:5000](http://localhost:5000)**
4. Inicia sesión con cualquiera de los usuarios de prueba:
   * **Usuario:** `rios` | **Contraseña:** `1234`
   * **Usuario:** `JuanD` | **Contraseña:** `JuanD1324`
   * **Usuario:** `fatima` | **Contraseña:** `1234`

> **Nota:** Si creas un archivo `.env` en `dnop-neon/` con tu `DATABASE_URL` de Neon:
> ```env
> DATABASE_URL=postgresql://neondb_owner:tu_password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require
> ```
> El servidor se conectará en vivo a Neon. Si no colocas nada, funcionará con la base de datos local SQLite de respaldo.

---

## 🚀 Paso 3: Desplegar en Render (Ponerlo en Vivo en Internet)

### A. Subir la carpeta a GitHub
1. Abre tu terminal en la carpeta `dnop-neon`:
   ```bash
   git init
   git add .
   git commit -m "Sistema DNOP con HTML, CSS, JS, Python y Neon"
   ```
2. En GitHub, crea un nuevo repositorio (por ejemplo, `dnop-web`).
3. Sube el código:
   ```bash
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/dnop-web.git
   git push -u origin main
   ```

### B. Crear el Servicio Web en Render
1. Ve a **[render.com](https://render.com)** e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **New +** > **Web Service**.
3. Selecciona tu repositorio de GitHub `dnop-web`.
4. Llena los datos del formulario:
   * **Name:** `dnop-sistema` (o el nombre que elijas)
   * **Language / Environment:** `Python 3`
   * **Build Command:** `pip install -r requirements.txt`
   * **Start Command:** `gunicorn app:app`
   * **Instance Type:** `Free`
5. Baja a la sección **Environment Variables** y agrega:
   * **Key:** `DATABASE_URL`
   * **Value:** *(Pega tu URL de conexión de Neon obtenida en el Paso 1)*
6. Haz clic en **Create Web Service**.
7. En 2 o 3 minutos, Render te proporcionará un enlace público HTTPS:
   `https://dnop-sistema.onrender.com`

¡Cualquier persona en el mundo podrá acceder, llenar formularios y los datos quedarán almacenados permanentemente en tu base de datos de Neon!
