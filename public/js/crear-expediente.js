// Manejo del formulario de creación de expedientes
document.addEventListener('DOMContentLoaded', () => {
    const selectTipo = document.getElementById('tipo');
    const secEst = document.getElementById('seccionEstudiante');
    const secProf = document.getElementById('seccionProfesor');
    const secAdm = document.getElementById('seccionAdministrativo');
    const form = document.getElementById('formExpediente');
    const alerta = document.getElementById('alertaExpediente');
    const btnGuardar = document.getElementById('btnGuardarExp');

    // Cambiar campos dinámicos según el tipo de paciente
    selectTipo.addEventListener('change', () => {
        const val = selectTipo.value;
        secEst.style.display = val === 'estudiante' ? 'block' : 'none';
        secProf.style.display = val === 'profesor' ? 'block' : 'none';
        secAdm.style.display = val === 'administrativo' ? 'block' : 'none';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        alerta.style.display = 'none';
        btnGuardar.disabled = true;
        btnGuardar.textContent = 'Guardando expediente en Neon...';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Parsear números si aplican
        if (data.id_carrera) data.id_carrera = parseInt(data.id_carrera, 10);
        if (data.id_facultad) data.id_facultad = parseInt(data.id_facultad, 10);

        try {
            const res = await fetch('/api/expedientes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await res.json();

            if (res.ok && result.success) {
                alerta.textContent = '¡Expediente creado exitosamente en la base de datos!';
                alerta.style.background = '#d4edda';
                alerta.style.color = '#155724';
                alerta.style.display = 'block';

                setTimeout(() => {
                    window.location.href = 'expedientes.html';
                }, 1500);
            } else {
                alerta.textContent = result.error || 'Ocurrió un error al crear el expediente.';
                alerta.style.background = '#f8d7da';
                alerta.style.color = '#721c24';
                alerta.style.display = 'block';
                btnGuardar.disabled = false;
                btnGuardar.textContent = 'Guardar Expediente';
            }
        } catch (err) {
            console.error('Error al guardar expediente:', err);
            alerta.textContent = 'Error de conexión con el servidor. Intenta de nuevo.';
            alerta.style.background = '#f8d7da';
            alerta.style.color = '#721c24';
            alerta.style.display = 'block';
            btnGuardar.disabled = false;
            btnGuardar.textContent = 'Guardar Expediente';
        }
    });
});
