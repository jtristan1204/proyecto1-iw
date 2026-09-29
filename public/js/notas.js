// Lógica para cargar y visualizar anotaciones de un paciente
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const idPaciente = params.get('id_paciente');
    const tipo = params.get('tipo');

    const titulo = document.getElementById('tituloPaciente');
    const detalles = document.getElementById('detallesPaciente');
    const tabla = document.getElementById('tablaNotas');
    const btnNueva = document.getElementById('btnNuevaNota');

    if (!idPaciente || !tipo) {
        titulo.textContent = 'Paciente no especificado';
        detalles.textContent = 'Por favor regrese a la lista de expedientes y seleccione un paciente.';
        tabla.innerHTML = '<tr><td colspan="2" style="text-align:center; color:red;">Faltan parámetros de paciente.</td></tr>';
        btnNueva.style.display = 'none';
        return;
    }

    btnNueva.addEventListener('click', () => {
        window.location.href = `hacer-anotaciones.html?id_paciente=${idPaciente}&tipo=${encodeURIComponent(tipo)}`;
    });

    try {
        const res = await fetch(`/api/pacientes/${idPaciente}/notas?tipo=${encodeURIComponent(tipo)}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Error al obtener datos');

        // Mostrar datos del paciente
        const pac = data.paciente;
        if (pac) {
            titulo.textContent = `Expediente de ${pac.primer_nombre} ${pac.apellido_paterno}`;
            detalles.innerHTML = `
                <strong>Cédula:</strong> ${pac.cedula} | 
                <strong>Tipo:</strong> ${tipo} | 
                <strong>Correo:</strong> ${pac.correo_institucional} | 
                <strong>Género:</strong> ${pac.genero}
            `;
        }

        // Mostrar notas
        const notas = data.notas;
        if (!notas || notas.length === 0) {
            tabla.innerHTML = '<tr><td colspan="2" style="text-align:center; padding: 20px; color: #777;">No hay anotaciones registradas aún en el expediente de este paciente.</td></tr>';
            return;
        }

        tabla.innerHTML = notas.map(n => `
            <tr>
                <td style="font-weight: bold; color: #555;">${new Date(n.fecha_creacion).toLocaleString()}</td>
                <td style="white-space: pre-wrap; line-height: 1.5;">${escapeHtml(n.observacion)}</td>
            </tr>
        `).join('');

    } catch (err) {
        console.error('Error al cargar notas:', err);
        tabla.innerHTML = `<tr><td colspan="2" style="text-align:center; color:red; padding: 20px;">Error al conectar con Neon: ${err.message}</td></tr>`;
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
});
