function makeRequest(path, method) {
    if (!confirm("Are you sure you want to delete the data from database?")) { return; }

    fetch(path, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: null
    }).then(async (data) => {
        const result = await data.json();
        if (data.ok && result.success) {
            alert(result.message || "Successfully deleted");
            if (result.redirect) { window.location.href = result.redirect; }
        } else { alert(`Error: ${result.message}. Failure delete`); }
    }).catch(async (err) => {
        const result = await err.json();

        alert("Internal server error");
        console.error(result.message);

        if (result.redirect) { window.location.href = result.redirect; }
    });
}

document.getElementById('filmSearch').addEventListener('keyup', (event) => {
    let search = event.target.value.toLowerCase().trim();
    let rows = document.querySelectorAll('table tbody tr');

    rows.forEach(row => {
        let title = row.cells[0].textContent.toLowerCase();
        title.includes(search) ? row.style.display = "" : row.style.display = "none";
    });
});

function openAuth() { 
    document.getElementById('authModal').style.display = 'flex';
    document.getElementById('loginEmail').focus();
}
function closeAuth() { document.getElementById('authModal').style.display = 'none'; }

function toggleAuth(type) {
    const login = document.getElementById('loginForm');
    const register = document.getElementById('registerForm');

    if (type === 'register') {
        login.style.display = 'none';
        register.style.display = 'block';
    } else {
        login.style.display = 'block';
        register.style.display = 'none';
    }
}

window.onclick = (event) => { if (event.target == document.getElementById('authModal')) closeAuth(); }

async function handleRegister() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPass').value;

    !name ? document.getElementById('regName').classList.add('input-error')
        : document.getElementById('regName').classList.remove('input-error');

    !email ? document.getElementById('regEmail').classList.add('input-error')
        : document.getElementById('regEmail').classList.remove('input-error');

    !pass ? document.getElementById('regPass').classList.add('input-error')
        : document.getElementById('regPass').classList.remove('input-error');

    const data = {
        given_name: name,
        surname: document.getElementById('regSurname').value,
        email: email,
        password: pass,
        role_id: 2
    };

    const response = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    const result = await response.json();
    if (result.success) {
        alert("Реєстрація успішна!");
        location.reload();
    } else { alert("Помилка: " + result.message); }
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPass').value;

    const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const result = await response.json();
    if (result.success) {
        closeAuth();
        location.reload();
    } else {
        document.getElementById('loginEmail').value = "";
        document.getElementById('loginPass').value = "";
        alert("Невірний логін або пароль");
    }
}

async function handleLogout() {
    try {
        const response = await fetch('/auth/logout', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        result.success ? window.location.reload() : alert("Logout error");
    } catch (error) { console.error("Request error: ", error); }
}

