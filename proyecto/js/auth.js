// Manejo de autenticación de psicólogos
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formLogin');
    const errorBox = document.getElementById('loginError');
    const btnSubmit = document.getElementById('btnSubmit');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorBox.style.display = 'none';
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Verificando...';

        const usuario = document.getElementById('user').value.trim();
        const contrasena = document.getElementById('password').value;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario, contrasena })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                // Guardar usuario logueado en localStorage
                localStorage.setItem('dnop_user', JSON.stringify(data.user));
                window.location.href = 'home.html';
            } else {
                errorBox.textContent = data.error || 'Usuario o contraseña incorrectos.';
                errorBox.style.display = 'block';
            }
        } catch (err) {
            console.error('Error al iniciar sesión:', err);
            errorBox.textContent = 'No se pudo conectar con el servidor. Intenta de nuevo.';
            errorBox.style.display = 'block';
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Iniciar Sesión';
        }
    });
});
