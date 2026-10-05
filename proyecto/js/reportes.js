// ==========================================================
// LÓGICA DEL REPORTE DIARIO Y EXPORTACIÓN A PDF - DNOP
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {
    const inputFecha = document.getElementById("inputFecha");
    const btnHoy = document.getElementById("btnHoy");
    const btnAyer = document.getElementById("btnAyer");
    const btnConsultar = document.getElementById("btnConsultar");
    const btnDescargarPDF = document.getElementById("btnDescargarPDF");
    const btnImprimir = document.getElementById("btnImprimir");

    // Elementos de Métricas en Pantalla (KPIs)
    const kpiTotal = document.getElementById("kpiTotal");
    const kpiEstudiantes = document.getElementById("kpiEstudiantes");
    const kpiDocAdmin = document.getElementById("kpiDocAdmin");
    const kpiNotas = document.getElementById("kpiNotas");

    // Elementos de la Hoja de Reporte Imprimible
    const metaFechaTexto = document.getElementById("metaFechaTexto");
    const metaHoraEmision = document.getElementById("metaHoraEmision");
    const metaEspecialista = document.getElementById("metaEspecialista");
    const firmaPsicologoNombre = document.getElementById("firmaPsicologoNombre");

    const resumenTotalCitas = document.getElementById("resumenTotalCitas");
    const resumenEstudiantes = document.getElementById("resumenEstudiantes");
    const resumenDocentes = document.getElementById("resumenDocentes");
    const resumenAdmin = document.getElementById("resumenAdmin");
    const resumenServicios = document.getElementById("resumenServicios");

    const tablaCitas = document.getElementById("tablaReporteCitas");
    const listaNotas = document.getElementById("listaReporteNotas");

    // 1. Obtener información del usuario logueado
    const userLogueado = JSON.parse(localStorage.getItem("dnop_user") || "null");
    let nombreEspecialista = "Lic. Psicólogo General";
    if (userLogueado && userLogueado.primer_nombre) {
        nombreEspecialista = `Lic. ${userLogueado.primer_nombre} ${userLogueado.apellido_paterno}`;
    }
    metaEspecialista.textContent = nombreEspecialista;
    firmaPsicologoNombre.textContent = nombreEspecialista;

    // 2. Establecer fecha de hoy por defecto
    const hoyStr = obtenerFechaLocal(new Date());
    inputFecha.value = hoyStr;

    // 3. Función para formatear fecha YYYY-MM-DD
    function obtenerFechaLocal(d) {
        const anio = d.getFullYear();
        const mes = String(d.getMonth() + 1).padStart(2, "0");
        const dia = String(d.getDate()).padStart(2, "0");
        return `${anio}-${mes}-${dia}`;
    }

    // 4. Formatear fecha larga en español
    function formatearFechaLarga(fechaStr) {
        if (!fechaStr) return "-";
        const partes = fechaStr.split("-");
        if (partes.length !== 3) return fechaStr;
        const d = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
        return d.toLocaleDateString("es-PA", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }

    // 5. Cargar reporte desde la API
    async function cargarReporte(fecha) {
        tablaCitas.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px; color: #718096;">
                    Consultando datos del día ${fecha}...
                </td>
            </tr>
        `;
        listaNotas.innerHTML = `<li style="color: #718096;">Cargando notas...</li>`;

        try {
            const res = await fetch(`/api/reportes/diario?fecha=${encodeURIComponent(fecha)}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Error al obtener el reporte");

            // Metadatos
            metaFechaTexto.textContent = formatearFechaLarga(fecha);
            metaHoraEmision.textContent = new Date().toLocaleTimeString("es-PA", { hour: "2-digit", minute: "2-digit" });

            // KPIs en pantalla
            const m = data.metricas || {};
            kpiTotal.textContent = m.total_citas || 0;
            kpiEstudiantes.textContent = m.estudiantes || 0;
            kpiDocAdmin.textContent = (m.profesores || 0) + (m.administrativos || 0);
            kpiNotas.textContent = m.total_notas || 0;

            // Resumen en el documento
            resumenTotalCitas.textContent = m.total_citas || 0;
            resumenEstudiantes.textContent = m.estudiantes || 0;
            resumenDocentes.textContent = m.profesores || 0;
            resumenAdmin.textContent = m.administrativos || 0;

            // Desglose de servicios
            const srvObj = m.servicios || {};
            const srvKeys = Object.keys(srvObj);
            if (srvKeys.length > 0) {
                resumenServicios.textContent = srvKeys.map(k => `${k} (${srvObj[k]})`).join(" | ");
            } else {
                resumenServicios.textContent = "Ningún servicio registrado en la fecha.";
            }

            // Llenar tabla de citas
            const citas = data.citas || [];
            if (citas.length === 0) {
                tablaCitas.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 20px; color: #a0aec0; font-style: italic;">
                            No hay citas registradas para el día ${fecha}.
                        </td>
                    </tr>
                `;
            } else {
                tablaCitas.innerHTML = citas.map(c => {
                    return `
                        <tr>
                            <td style="font-weight: bold; color: #1a365d;">${escapeHtml(c.hora || "N/A")}</td>
                            <td>${escapeHtml(c.cedula_paciente || "N/A")}</td>
                            <td style="font-weight: 600;">${escapeHtml(c.nombre_paciente || "Sin nombre")}</td>
                            <td>${escapeHtml(c.tipo_paciente || "General")}</td>
                            <td>${escapeHtml(c.nombre_servicio || "Consulta")}</td>
                            <td>${escapeHtml(c.nombre_psicologo || "Especialista")}</td>
                        </tr>
                    `;
                }).join("");
            }

            // Llenar lista de notas (sin emojis)
            const notas = data.notas || [];
            if (notas.length === 0) {
                listaNotas.innerHTML = `<li style="color: #718096; font-style: italic; padding: 5px 0;">No se registraron notas de evolución clínica en esta fecha.</li>`;
            } else {
                listaNotas.innerHTML = notas.map(n => {
                    const horaNota = n.fecha_creacion ? n.fecha_creacion.substring(11, 16) : "";
                    const horaPrefijo = horaNota ? `[${horaNota}] ` : "";
                    return `
                        <li class="doc-item-nota">
                            <div class="doc-item-nota-header">
                                ${horaPrefijo}Paciente: ${escapeHtml(n.nombre_paciente || "N/A")} (${escapeHtml(n.cedula_paciente || "N/A")}) | Atendido por: ${escapeHtml(n.psicologo_nota || "Especialista")}
                            </div>
                            <div style="color: #2d3748; white-space: pre-wrap;">${escapeHtml(n.observacion || "")}</div>
                        </li>
                    `;
                }).join("");
            }

        } catch (err) {
            console.error("Error al cargar reporte:", err);
            tablaCitas.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: red; padding: 20px;">
                        Error al cargar datos del reporte: ${err.message}
                    </td>
                </tr>
            `;
        }
    }

    function escapeHtml(text) {
        if (!text) return "";
        return text.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // 6. Botones de filtro rápido
    btnHoy.addEventListener("click", () => {
        btnHoy.classList.add("activo");
        btnAyer.classList.remove("activo");
        inputFecha.value = hoyStr;
        cargarReporte(hoyStr);
    });

    btnAyer.addEventListener("click", () => {
        btnAyer.classList.add("activo");
        btnHoy.classList.remove("activo");
        const ayer = new Date();
        ayer.setDate(ayer.getDate() - 1);
        const ayerStr = obtenerFechaLocal(ayer);
        inputFecha.value = ayerStr;
        cargarReporte(ayerStr);
    });

    btnConsultar.addEventListener("click", () => {
        if (inputFecha.value) {
            btnHoy.classList.remove("activo");
            btnAyer.classList.remove("activo");
            cargarReporte(inputFecha.value);
        }
    });

    inputFecha.addEventListener("change", () => {
        btnHoy.classList.remove("activo");
        btnAyer.classList.remove("activo");
        if (inputFecha.value) {
            cargarReporte(inputFecha.value);
        }
    });

    // 7. Generación de PDF centrado con html2pdf.js (0 Emojis)
    btnDescargarPDF.addEventListener("click", async () => {
        const elemento = document.getElementById("hojaReporte");
        const fecha = inputFecha.value || "diario";

        const textoOriginal = btnDescargarPDF.textContent;
        btnDescargarPDF.disabled = true;
        btnDescargarPDF.textContent = "Generando PDF...";

        const opciones = {
            margin: 0,
            filename: `Reporte_Diario_DNOP_${fecha}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { 
                scale: 2, 
                useCORS: true, 
                letterRendering: true,
                scrollX: 0,
                scrollY: 0
            },
            jsPDF: { 
                unit: "mm", 
                format: "a4", 
                orientation: "portrait" 
            }
        };

        try {
            await html2pdf().set(opciones).from(elemento).save();
        } catch (error) {
            console.error("Error al exportar a PDF:", error);
            alert("Hubo un detalle al exportar a PDF. Puede usar el botón 'Imprimir' y seleccionar 'Guardar como PDF'.");
        } finally {
            btnDescargarPDF.disabled = false;
            btnDescargarPDF.textContent = textoOriginal;
        }
    });

    // 8. Botón de Imprimir
    btnImprimir.addEventListener("click", () => {
        window.print();
    });

    // Carga inicial con fecha de hoy
    cargarReporte(hoyStr);
});
