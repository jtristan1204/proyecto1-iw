// Carga y búsqueda de expedientes de pacientes
document.addEventListener('DOMContentLoaded', () => {
    const tabla = document.getElementById('tablaExpedientes');
    const input = document.getElementById('inputBusqueda');
    const btnBuscar = document.getElementById('btnBuscar');
    const btnLimpiar = document.getElementById('btnLimpiar');

    async function cargarExpedientes(busqueda = '') {
        tabla.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Cargando expedientes...</td></tr>';

        try {
            const url = busqueda 
                ? `/api/expedientes?busqueda=${encodeURIComponent(busqueda)}`
                : '/api/expedientes';
            
            const res = await fetch(url);
            const datos = await res.json();

            if (!res.ok) throw new Error(datos.error || 'Error al obtener expedientes');

            if (!datos || datos.length === 0) {
                tabla.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">No se encontraron expedientes.</td></tr>';
                return;
            }

            tabla.innerHTML = datos.map(p => `
                <tr>
                    <td>${escapeHtml(p.primer_nombre)}</td>
                    <td>${escapeHtml(p.apellido_paterno)}</td>
                    <td>${escapeHtml(p.cedula)}</td>
                    <td>${escapeHtml(p.correo_institucional)}</td>
                    <td><span style="font-weight: bold; color: #2c3e50;">${escapeHtml(p.tipo)}</span></td>
                    <td>
                        <button onclick="window.location.href='notas.html?id_paciente=${p.id_paciente}&tipo=${encodeURIComponent(p.tipo)}'" style="padding: 6px 12px; cursor: pointer; background: #3498db; color: white; border: none; border-radius: 4px;">
                            Ver Anotaciones
                        </button>
                    </td>
                </tr>
            `).join('');

        } catch (err) {
            console.error('Error cargando expedientes:', err);
            tabla.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red; padding: 20px;">Error al conectar con Neon: ${err.message}</td></tr>`;
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

    btnBuscar.addEventListener('click', () => {
        cargarExpedientes(input.value.trim());
    });

    input.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            cargarExpedientes(input.value.trim());
        }
    });

    btnLimpiar.addEventListener('click', () => {
        input.value = '';
        cargarExpedientes();
    });

    cargarExpedientes();
});
