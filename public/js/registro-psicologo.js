// Registro de un nuevo psicólogo
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formRegistroPsicologo');
    const alerta = document.getElementById('mensajeAlerta');
    const btnGuardar = document.getElementById('btnGuardar');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        alerta.style.display = 'none';
        btnGuardar.disabled = true;
        btnGuardar.textContent = 'Guardando en Neon...';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Asegurar tipo numérico para id_cargo
        data.id_cargo = parseInt(data.id_cargo, 10);

        try {
            const res = await fetch('/api/psicologos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await res.json();

            if (res.ok && result.success) {
                alerta.textContent = '¡Psicólogo registrado exitosamente en la base de datos!';
                alerta.style.background = '#d4edda';
                alerta.style.color = '#155724';
                alerta.style.display = 'block';

                setTimeout(() => {
                    window.location.href = 'psicologos.html';
                }, 1500);
            } else {
                alerta.textContent = result.error || 'Ocurrió un error al registrar el psicólogo.';
                alerta.style.background = '#f8d7da';
                alerta.style.color = '#721c24';
                alerta.style.display = 'block';
                btnGuardar.disabled = false;
                btnGuardar.textContent = 'Registrar Psicólogo';
            }
        } catch (err) {
            console.error('Error al guardar psicólogo:', err);
            alerta.textContent = 'Error de conexión con el servidor. Intenta nuevamente.';
            alerta.style.background = '#f8d7da';
            alerta.style.color = '#721c24';
            alerta.style.display = 'block';
            btnGuardar.disabled = false;
            btnGuardar.textContent = 'Registrar Psicólogo';
        }
    });
});
