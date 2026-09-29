// Lógica para enviar anotaciones a la base de datos
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const idPaciente = params.get('id_paciente');
    const tipo = params.get('tipo');

    const form = document.getElementById('formAnotacion');
    const alerta = document.getElementById('alertaNota');
    const btnGuardar = document.getElementById('btnGuardarNota');
    const btnCancelar = document.getElementById('btnCancelar');
    const legend = document.getElementById('legendPaciente');

    if (idPaciente && tipo) {
        legend.textContent = `Nueva Nota para Paciente #${idPaciente} (${tipo})`;
    }

    btnCancelar.addEventListener('click', () => {
        window.location.href = `notas.html?id_paciente=${idPaciente}&tipo=${encodeURIComponent(tipo)}`;
    });

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        alerta.style.display = 'none';
        btnGuardar.disabled = true;
        btnGuardar.textContent = 'Guardando anotación en Neon...';

        const observacion = document.getElementById('anotacion').value.trim();
        const user = JSON.parse(localStorage.getItem('dnop_user') || 'null');
        const idPsico = user ? user.id_psico : null;

        const payload = {
            id_paciente: parseInt(idPaciente, 10),
            tipo_paciente: tipo,
            observacion: observacion,
            id_psico: idPsico
        };

        try {
            const res = await fetch('/api/notas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await res.json();

            if (res.ok && result.success) {
                alerta.textContent = '¡Anotación guardada exitosamente en la base de datos!';
                alerta.style.background = '#d4edda';
                alerta.style.color = '#155724';
                alerta.style.display = 'block';

                setTimeout(() => {
                    window.location.href = `notas.html?id_paciente=${idPaciente}&tipo=${encodeURIComponent(tipo)}`;
                }, 1500);
            } else {
                alerta.textContent = result.error || 'Ocurrió un error al guardar la anotación.';
                alerta.style.background = '#f8d7da';
                alerta.style.color = '#721c24';
                alerta.style.display = 'block';
                btnGuardar.disabled = false;
                btnGuardar.textContent = 'Guardar Anotación en Neon';
            }
        } catch (err) {
            console.error('Error al guardar anotación:', err);
            alerta.textContent = 'Error de conexión con el servidor. Intente nuevamente.';
            alerta.style.background = '#f8d7da';
            alerta.style.color = '#721c24';
            alerta.style.display = 'block';
            btnGuardar.disabled = false;
            btnGuardar.textContent = 'Guardar Anotación en Neon';
        }
    });
});
