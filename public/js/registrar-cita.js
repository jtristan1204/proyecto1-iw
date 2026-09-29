// Lógica para agendar cita
document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('formCita');
    const selectPsicologo = document.getElementById('id_psicologo');
    const alerta = document.getElementById('alertaCita');
    const btnAgendar = document.getElementById('btnAgendar');

    // Cargar la lista de psicólogos en el select
    try {
        const res = await fetch('/api/psicologos');
        const psicologos = await res.json();
        if (psicologos && psicologos.length > 0) {
            selectPsicologo.innerHTML = psicologos.map(p => `
                <option value="${p.id_psico}">${p.primer_nombre} ${p.apellido_paterno} (${p.nombre_cargo || 'Especialista'})</option>
            `).join('');

            // Si hay un usuario logueado, preseleccionarlo
            const user = JSON.parse(localStorage.getItem('dnop_user') || 'null');
            if (user && user.id_psico) {
                selectPsicologo.value = user.id_psico;
            }
        } else {
            selectPsicologo.innerHTML = '<option value="1">Psicólogo General</option>';
        }
    } catch (e) {
        selectPsicologo.innerHTML = '<option value="1">Psicólogo General</option>';
    }

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        alerta.style.display = 'none';
        btnAgendar.disabled = true;
        btnAgendar.textContent = 'Guardando cita...';

        const payload = {
            fecha: document.getElementById('fecha').value,
            hora: document.getElementById('hora').value,
            tipo_paciente: document.getElementById('tipo_paciente').value,
            cedula: document.getElementById('cedula').value.trim(),
            id_servicio: parseInt(document.getElementById('id_servicio').value, 10),
            id_psicologo: parseInt(document.getElementById('id_psicologo').value, 10)
        };

        try {
            const res = await fetch('/api/citas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok && data.success) {
                alerta.textContent = '¡Cita agendada exitosamente en la base de datos!';
                alerta.style.background = '#d4edda';
                alerta.style.color = '#155724';
                alerta.style.display = 'block';

                setTimeout(() => {
                    window.location.href = 'citas.html';
                }, 1500);
            } else {
                alerta.textContent = data.error || 'No se pudo agendar la cita. Verifique la cédula del paciente.';
                alerta.style.background = '#f8d7da';
                alerta.style.color = '#721c24';
                alerta.style.display = 'block';
                btnAgendar.disabled = false;
                btnAgendar.textContent = 'Agendar Cita';
            }
        } catch (err) {
            console.error('Error al agendar cita:', err);
            alerta.textContent = 'Error al conectar con el servidor. Intente nuevamente.';
            alerta.style.background = '#f8d7da';
            alerta.style.color = '#721c24';
            alerta.style.display = 'block';
            btnAgendar.disabled = false;
            btnAgendar.textContent = 'Agendar Cita';
        }
    });
});
