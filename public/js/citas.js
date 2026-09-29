// Lógica de citas y calendario interactivo
document.addEventListener("DOMContentLoaded", function() {
    const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const grid = document.getElementById("calendarioGrid");
    const selectMes = document.getElementById("selectMes");
    const selectAnio = document.getElementById("selectAnio");
    const inputFechaFiltro = document.getElementById("fecha_filtro");
    const btnFiltrar = document.getElementById("btnFiltrar");
    const btnMostrarTodas = document.getElementById("btnMostrarTodas");
    const tablaCitasBody = document.getElementById("tablaCitasBody");
    const btnMesAnterior = document.getElementById("btnMesAnterior");
    const btnMesSiguiente = document.getElementById("btnMesSiguiente");

    let citasGlobales = [];
    let fechaActual = new Date();

    // 1. Inicializar Selectores de Mes y Año
    nombresMeses.forEach((mes, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.text = mes;
        selectMes.appendChild(option);
    });

    const anioReal = new Date().getFullYear();
    for(let i = anioReal - 5; i <= anioReal + 5; i++) {
        const option = document.createElement("option");
        option.value = i;
        option.text = i;
        selectAnio.appendChild(option);
    }

    selectMes.value = fechaActual.getMonth();
    selectAnio.value = fechaActual.getFullYear();

    // 2. Cargar citas desde la API
    async function cargarCitas(fechaFiltro = '') {
        tablaCitasBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Cargando citas...</td></tr>';
        
        try {
            const url = fechaFiltro ? `/api/citas?fecha=${encodeURIComponent(fechaFiltro)}` : '/api/citas';
            const res = await fetch(url);
            const datos = await res.json();

            if (!res.ok) throw new Error(datos.error || 'Error al obtener citas');

            citasGlobales = datos || [];
            renderizarTabla(citasGlobales);
            renderizarCalendario();

        } catch (err) {
            console.error('Error al cargar citas:', err);
            tablaCitasBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red; padding: 20px;">Error al conectar con Neon: ${err.message}</td></tr>`;
        }
    }

    // 3. Renderizar filas de la tabla
    function renderizarTabla(citas) {
        if (!citas || citas.length === 0) {
            tablaCitasBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; font-weight: bold; color: #777; padding: 20px; background-color: #fafafa;">
                        No hay citas registradas para este criterio.
                    </td>
                </tr>
            `;
            return;
        }

        tablaCitasBody.innerHTML = citas.map(c => {
            const fechaStr = (c.fecha || '').substring(0, 10);
            const nombreCompleto = c.nombre_paciente || 'N/A';
            return `
                <tr class="fila-cita" data-fecha="${fechaStr}">
                    <td>${c.id_cita}</td>
                    <td>${fechaStr}</td>
                    <td>${escapeHtml(c.hora)}</td>
                    <td>${escapeHtml(nombreCompleto)}</td>
                    <td>${escapeHtml(c.cedula_paciente || 'N/A')}</td>
                    <td>${escapeHtml(c.tipo_paciente || 'General')}</td>
                    <td>${escapeHtml(c.nombre_servicio || 'Consulta')}</td>
                </tr>
            `;
        }).join('');
    }

    // 4. Renderizar Calendario
    function renderizarCalendario() {
        const mes = parseInt(selectMes.value, 10);
        const anio = parseInt(selectAnio.value, 10);

        grid.innerHTML = "";

        // Días de la semana
        const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
        diasSemana.forEach(dia => {
            const diaHeader = document.createElement("div");
            diaHeader.classList.add("dia-semana");
            diaHeader.innerText = dia;
            grid.appendChild(diaHeader);
        });

        const primerDia = new Date(anio, mes, 1).getDay();
        const diasEnMes = new Date(anio, mes + 1, 0).getDate();

        // Celdas vacías
        for (let i = 0; i < primerDia; i++) {
            const celdaVacia = document.createElement("div");
            celdaVacia.classList.add("dia", "vacio");
            grid.appendChild(celdaVacia);
        }

        // Extraer fechas que tienen citas
        const fechasConCitas = new Set(citasGlobales.map(c => (c.fecha || '').substring(0, 10)));

        // Celdas con días
        for (let dia = 1; dia <= diasEnMes; dia++) {
            const celda = document.createElement("div");
            celda.classList.add("dia");
            celda.innerText = dia;

            const mesFormat = String(mes + 1).padStart(2, "0");
            const diaFormat = String(dia).padStart(2, "0");
            const fechaStr = `${anio}-${mesFormat}-${diaFormat}`;

            if (fechasConCitas.has(fechaStr)) {
                celda.classList.add("con-cita");
                celda.title = "Hay citas programadas este día";
            }

            // Click para filtrar citas de este día
            celda.addEventListener("click", () => {
                document.querySelectorAll(".dia").forEach(d => d.classList.remove("seleccionado"));
                celda.classList.add("seleccionado");
                inputFechaFiltro.value = fechaStr;
                const filtradas = citasGlobales.filter(c => (c.fecha || '').substring(0, 10) === fechaStr);
                renderizarTabla(filtradas);
            });

            grid.appendChild(celda);
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Eventos
    btnFiltrar.addEventListener("click", () => {
        if (inputFechaFiltro.value) {
            cargarCitas(inputFechaFiltro.value);
        }
    });

    btnMostrarTodas.addEventListener("click", () => {
        inputFechaFiltro.value = '';
        cargarCitas();
    });

    selectMes.addEventListener("change", renderizarCalendario);
    selectAnio.addEventListener("change", renderizarCalendario);

    btnMesAnterior.addEventListener("click", () => {
        let m = parseInt(selectMes.value, 10) - 1;
        let a = parseInt(selectAnio.value, 10);
        if (m < 0) { m = 11; a--; }
        selectMes.value = m;
        selectAnio.value = a;
        renderizarCalendario();
    });

    btnMesSiguiente.addEventListener("click", () => {
        let m = parseInt(selectMes.value, 10) + 1;
        let a = parseInt(selectAnio.value, 10);
        if (m > 11) { m = 0; a++; }
        selectMes.value = m;
        selectAnio.value = a;
        renderizarCalendario();
    });

    // Carga inicial
    cargarCitas();
});
