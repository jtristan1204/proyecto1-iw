// Cargar y buscar psicólogos desde la API
document.addEventListener('DOMContentLoaded', () => {
    const tabla = document.getElementById('tablaPsicologos');
    const inputBuscador = document.getElementById('buscador');
    const btnBuscar = document.getElementById('btnBuscar');
    const btnLimpiar = document.getElementById('btnLimpiar');

    async function cargarPsicologos(busqueda = '') {
        tabla.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Cargando psicólogos...</td></tr>';
        
        try {
            const url = busqueda 
                ? `/api/psicologos?busqueda=${encodeURIComponent(busqueda)}`
                : '/api/psicologos';
            
            const res = await fetch(url);
            const datos = await res.json();

            if (!res.ok) throw new Error(datos.error || 'Error al obtener psicólogos');

            if (!datos || datos.length === 0) {
                tabla.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">No se encontraron psicólogos registrados.</td></tr>';
                return;
            }

            tabla.innerHTML = datos.map(p => `
                <tr>
                    <td>${escapeHtml(p.primer_nombre)}</td>
                    <td>${escapeHtml(p.apellido_paterno)}</td>
                    <td>${escapeHtml(p.nombre_cargo || 'Psicólogo')}</td>
                    <td>${escapeHtml(p.correo_institucional)}</td>
                    <td>${escapeHtml(p.telefono)}</td>
                </tr>
            `).join('');

        } catch (err) {
            console.error('Error cargando psicólogos:', err);
            tabla.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red; padding: 20px;">Error al conectar con la base de datos: ${err.message}</td></tr>`;
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
        cargarPsicologos(inputBuscador.value.trim());
    });

    inputBuscador.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            cargarPsicologos(inputBuscador.value.trim());
        }
    });

    btnLimpiar.addEventListener('click', () => {
        inputBuscador.value = '';
        cargarPsicologos();
    });

    // Cargar inicial
    cargarPsicologos();
});
