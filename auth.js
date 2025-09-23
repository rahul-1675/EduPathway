// This file handles Authentication and User Simulation
const protectedPages = ['dashboard.html', 'tasks.html', 'goals.html', 'calendar.html'];
const currentPage = window.location.pathname.split('/').pop();

if (protectedPages.includes(currentPage) && !sessionStorage.getItem('loggedInUser')) {
    window.location.href = 'login.html';
}
if ((currentPage === 'login.html' || currentPage === 'register.html') && sessionStorage.getItem('loggedInUser')) {
    window.location.href = 'dashboard.html';
}

function getUsers() {
    const users = localStorage.getItem('studyPlannerUsers');
    return users ? JSON.parse(users) : {};
}
function saveUsers(users) {
    localStorage.setItem('studyPlannerUsers', JSON.stringify(users));
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorEl = document.getElementById('registerError');
        if (password !== confirmPassword) {
            errorEl.textContent = 'Passwords do not match.';
            return;
        }
        const users = getUsers();
        if (users[username]) {
            errorEl.textContent = 'Username already exists.';
            return;
        }
        users[username] = { password: password };
        saveUsers(users);
        alert('Registration successful! Please log in.');
        window.location.href = 'login.html';
    });
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('loginError');
        const users = getUsers();
        const user = users[username];
        if (user && user.password === password) {
            sessionStorage.setItem('loggedInUser', username);
            window.location.href = 'dashboard.html';
        } else {
            errorEl.textContent = 'Invalid username or password.';
        }
    });
}