document.addEventListener('DOMContentLoaded', () => {
    const currentUser = sessionStorage.getItem('loggedInUser');
    let tasks = [];
    let goals = [];

    function loadData() {
        if (!currentUser) return;
        tasks = JSON.parse(localStorage.getItem(`tasks_${currentUser}`) || '[]');
        goals = JSON.parse(localStorage.getItem(`goals_${currentUser}`) || '[]');
    }
    function saveData() {
        if (!currentUser) return;
        localStorage.setItem(`tasks_${currentUser}`, JSON.stringify(tasks));
        localStorage.setItem(`goals_${currentUser}`, JSON.stringify(goals));
    }

    loadData();
    if (document.querySelector('#dashboardGoalsContainer')) {
        setCurrentDate(); renderUpcomingTasks(); updateDashboard();
    }
    if (document.querySelector('#taskListContainer')) {
        renderTasks('all'); setupTaskTabs();
    }
    if (document.querySelector('#goalListContainer')) {
        renderGoals(); updateGoalStats();
    }
    if (document.querySelector('#calendarGrid')) {
        initializeCalendar();
    }
    setupResponsiveSidebar();

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('loggedInUser');
            window.location.href = 'login.html';
        });
    }
    
    function initializeCalendar() {
        const calendarGrid = document.getElementById('calendarGrid');
        const monthYearDisplay = document.getElementById('monthYearDisplay');
        const prevMonthBtn = document.getElementById('prevMonthBtn');
        const nextMonthBtn = document.getElementById('nextMonthBtn');
        let currentDate = new Date();
        function renderCalendar(year, month) {
            calendarGrid.innerHTML = '';
            const today = new Date();
            monthYearDisplay.textContent = new Date(year, month).toLocaleString('en-US', { month: 'long', year: 'numeric' });
            const firstDayOfMonth = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            for (let i = 0; i < firstDayOfMonth; i++) {
                calendarGrid.innerHTML += `<div class="calendar-day other-month"></div>`;
            }
            for (let i = 1; i <= daysInMonth; i++) {
                let isTodayClass = (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) ? 'is-today' : '';
                const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                let eventsHTML = '<div class="calendar-events">';
                tasks.filter(t => t.dueDate === dateString).forEach(t => {
                    eventsHTML += `<div class="event task-event" title="${t.title}">✔️ ${t.title}</div>`;
                });
                goals.filter(g => g.deadline === dateString).forEach(g => {
                    eventsHTML += `<div class="event goal-event" title="${g.title}">🎯 ${g.title}</div>`;
                });
                eventsHTML += '</div>';
                calendarGrid.innerHTML += `<div class="calendar-day ${isTodayClass}"><div class="day-number">${i}</div>${eventsHTML}</div>`;
            }
        }
        prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(currentDate.getFullYear(), currentDate.getMonth()); });
        nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(currentDate.getFullYear(), currentDate.getMonth()); });
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
    }

    function getStatusIcon(status) {
        switch (status) {
            case 'completed': return '✅';
            case 'in-progress': return '⏳';
            default: return '🕒';
        }
    }
    function formatTime(minutes) {
        if (minutes <= 0) return '0 min';
        if (minutes < 1) return `${Math.round(minutes * 60)} sec`;
        if (minutes < 60) return `${Math.round(minutes)} min`;
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return `${hours} hr${mins > 0 ? ` ${mins} min` : ''}`;
    }
    function setCurrentDate() {
        const dateText = document.getElementById('dateText');
        if(dateText) {
            dateText.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }
    }
    function renderUpcomingTasks() {
        const container = document.getElementById('upcomingTasksContainer');
        if (!container) return;
        const upcoming = tasks.filter(task => task.status !== 'completed').sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 4);
        container.innerHTML = '';
        if (upcoming.length === 0) {
            container.innerHTML = '<p style="color: var(--text-light);">No upcoming tasks. Great job!</p>';
            return;
        }
        upcoming.forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.className = 'upcoming-task-item';
            const dueDate = new Date(task.dueDate + 'T00:00:00');
            const formattedDate = dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            taskEl.innerHTML = `<div class="info"><h4>${task.title}</h4><p>${task.subject || ''}</p></div><div class="due-date">${formattedDate}</div>`;
            container.appendChild(taskEl);
        });
    }
    function renderTasks(filter) {
        const container = document.getElementById('taskListContainer');
        if (!container) return;
        const filteredTasks = tasks.filter(task => filter === 'all' || task.status === filter);
        container.innerHTML = '';
        if (filteredTasks.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 1rem;">No tasks in this category.</p>';
            return;
        }
        filteredTasks.forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.className = 'task-item';
            const dueDate = new Date(task.dueDate + 'T00:00:00');
            const formattedDate = dueDate.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
            taskEl.innerHTML = `
                <div class="task-status-indicator" data-task-id="${task.id}" data-status="${task.status}" title="Click to change status">${getStatusIcon(task.status)}</div>
                <div class="task-content">
                    <h4>${task.title}</h4>
                    <p class="subject">${task.subject || ''}</p>
                    <p class="description">${task.description || ''}</p>
                </div>
                <div class="task-meta">
                    <span class="priority ${task.priority}">${task.priority}</span>
                    <div class="time-due">
                        <div>${formattedDate}</div>
                        <div>${formatTime(task.time)}</div>
                    </div>
                    <div class="task-actions">
                        <button class="action-btn edit-btn" data-task-id="${task.id}" title="Edit Task">📝</button>
                        <button class="action-btn delete-btn" data-task-id="${task.id}" title="Delete Task">🗑️</button>
                    </div>
                </div>`;
            container.appendChild(taskEl);
        });
    }
    function renderGoals() {
        const container = document.getElementById('goalListContainer');
        if (!container) return;
        container.innerHTML = '';
        if (goals.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 1rem;">No goals yet.</p>';
            return;
        }
        goals.forEach(goal => {
            const progress = calculateGoalProgress(goal);
            const dueDate = new Date(goal.deadline + 'T00:00:00');
            const formattedDate = dueDate.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
            const goalEl = document.createElement('div');
            goalEl.className = 'goal-item';
            goalEl.innerHTML = `
                <div class="goal-header">
                    <div class="icon">🎯</div>
                    <div class="goal-info">
                        <h4>${goal.title}</h4>
                        <p>${goal.description || ''}</p>
                        <div class="goal-meta">
                            <span class="tag">Academic</span>
                            <span>Due: ${formattedDate}</span>
                            <span class="time">Est: ${formatTime(goal.time)}</span>
                        </div>
                    </div>
                    <div class="card-actions">
                         <button class="action-btn edit-btn" data-goal-id="${goal.id}" title="Edit Goal">📝</button>
                         <button class="action-btn delete-btn" data-goal-id="${goal.id}" title="Delete Goal">🗑️</button>
                    </div>
                </div>
                <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${progress}%; background-color: var(--green-icon);"></div></div>
                <div class="milestones">
                    <h5>Milestones</h5>
                    ${goal.milestones.length > 0 ? goal.milestones.map((m, index) => `<div class="milestone"><input type="checkbox" id="m-${goal.id}-${index}" data-goal-id="${goal.id}" data-milestone-index="${index}" ${m.completed ? 'checked' : ''}><label for="m-${goal.id}-${index}">${m.text}</label></div>`).join('') : '<p style="color: var(--text-light); font-size: 0.8rem;">No milestones for this goal.</p>'}
                </div>`;
            container.appendChild(goalEl);
        });
    }
    function updateDashboard() {
        const goalsContainer = document.getElementById('dashboardGoalsContainer');
        if (!document.getElementById('totalTasksStat')) return;
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.status === 'completed').length;
        document.getElementById('totalTasksStat').textContent = totalTasks;
        document.getElementById('completedTasksStat').textContent = `+${completedTasks} completed`;
        document.getElementById('activeGoalsStat').textContent = goals.length;
        const taskMinutes = tasks.reduce((sum, task) => sum + Number(task.time || 0), 0);
        const goalMinutes = goals.reduce((sum, goal) => sum + Number(goal.time || 0), 0);
        const totalMinutes = taskMinutes + goalMinutes;
        const totalHours = (totalMinutes / 60).toFixed(1);
        document.getElementById('studyHoursStat').textContent = totalHours;
        const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        const { grade, detail } = getGradeFromPercentage(overallProgress);
        document.getElementById('averageGradeStat').textContent = grade;
        document.getElementById('gradeDetailStat').textContent = detail;
        goalsContainer.innerHTML = `<div class="content-card-header"><span class="icon">🎯</span><h2>Goal Progress</h2></div>`;
        if (goals.length === 0) {
            goalsContainer.innerHTML += '<p style="color: var(--text-light);">No goals set yet.</p>';
        } else {
            goals.slice(0, 2).forEach(goal => {
                const progress = calculateGoalProgress(goal);
                const goalEl = document.createElement('div');
                goalEl.className = 'progress-item';
                goalEl.innerHTML = `<div class="progress-item-header"><h4>${goal.title}</h4><span>${progress}%</span></div><div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${progress}%;"></div></div>`;
                goalsContainer.appendChild(goalEl);
            });
        }
    }
    function getGradeFromPercentage(p) {
        if (p >= 90) return { grade: 'A+', detail: 'Excellent!' };
        if (p >= 80) return { grade: 'A', detail: 'Great work!' };
        if (p >= 70) return { grade: 'B+', detail: 'Good job!' };
        if (p >= 60) return { grade: 'B', detail: 'Keep it up!' };
        if (p >= 50) return { grade: 'C', detail: 'Making progress!' };
        return { grade: 'N/A', detail: 'Get started!' };
    }
    function updateGoalStats() {
        const statsEl = document.getElementById('totalGoalsStat');
        if (!statsEl) return;
        statsEl.textContent = goals.length;
        const completedGoals = goals.filter(goal => calculateGoalProgress(goal) === 100).length;
        document.getElementById('completedGoalsStat').textContent = completedGoals;
        if (goals.length > 0) {
            const totalProgress = goals.reduce((sum, goal) => sum + calculateGoalProgress(goal), 0);
            const avgProgress = Math.round(totalProgress / goals.length);
            document.getElementById('avgProgressStat').textContent = `${avgProgress}%`;
        } else {
            document.getElementById('avgProgressStat').textContent = '0%';
        }
    }
    function calculateGoalProgress(goal) {
        if (!goal.milestones || goal.milestones.length === 0) return 0;
        const completedCount = goal.milestones.filter(m => m.completed).length;
        return Math.round((completedCount / goal.milestones.length) * 100);
    }
    
    // --- MODAL & FORM HANDLING ---
    const addTaskModal = document.getElementById('addTaskModal');
    const addTaskForm = document.getElementById('addTaskForm');
    function openEditTaskModal(task) {
        addTaskModal.querySelector('h2').textContent = 'Edit Task';
        addTaskModal.querySelector('.modal-button').textContent = 'Save Changes';
        addTaskForm.dataset.editingId = task.id;
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskSubject').value = task.subject;
        document.getElementById('taskDescription').value = task.description;
        document.getElementById('taskDueDate').value = task.dueDate;
        document.getElementById('taskPriority').value = task.priority;
        const timeValueInput = document.getElementById('taskTimeValue');
        const timeUnitSelect = document.getElementById('taskTimeUnit');
        if (task.time >= 60 && task.time % 60 === 0) {
            timeValueInput.value = task.time / 60;
            timeUnitSelect.value = 'hours';
        } else if (task.time < 1) {
            timeValueInput.value = task.time * 60;
            timeUnitSelect.value = 'seconds';
        } else {
            timeValueInput.value = task.time;
            timeUnitSelect.value = 'minutes';
        }
        addTaskModal.classList.add('visible');
    }
    if (addTaskForm) {
        addTaskForm.addEventListener('submit', e => {
            e.preventDefault();
            const editingId = Number(addTaskForm.dataset.editingId);
            const timeValue = document.getElementById('taskTimeValue').value;
            const timeUnit = document.getElementById('taskTimeUnit').value;
            let timeInMinutes = 0;
            if (timeUnit === 'hours') timeInMinutes = timeValue * 60;
            else if (timeUnit === 'seconds') timeInMinutes = timeValue / 60;
            else timeInMinutes = Number(timeValue);
            const taskData = { title: document.getElementById('taskTitle').value, subject: document.getElementById('taskSubject').value, description: document.getElementById('taskDescription').value, dueDate: document.getElementById('taskDueDate').value, priority: document.getElementById('taskPriority').value, time: timeInMinutes };
            if (editingId) {
                const task = tasks.find(t => t.id === editingId);
                Object.assign(task, taskData);
            } else {
                tasks.push({ ...taskData, id: Date.now(), status: 'pending' });
            }
            saveData();
            renderTasks(document.querySelector('#taskTabs .active').dataset.filter);
            renderUpcomingTasks(); updateDashboard(); closeTaskModal();
        });
    }
    function closeTaskModal() {
        addTaskModal.classList.remove('visible');
        addTaskForm.reset();
        delete addTaskForm.dataset.editingId;
        addTaskModal.querySelector('h2').textContent = 'Add New Task';
        addTaskModal.querySelector('.modal-button').textContent = 'Add Task';
    }
    const addGoalModal = document.getElementById('addGoalModal');
    const addGoalForm = document.getElementById('addGoalForm');
    function openEditGoalModal(goal) {
        addGoalModal.querySelector('h2').textContent = 'Edit Goal';
        addGoalModal.querySelector('.modal-button').textContent = 'Save Changes';
        addGoalForm.dataset.editingId = goal.id;
        document.getElementById('goalTitle').value = goal.title;
        document.getElementById('goalDescription').value = goal.description;
        document.getElementById('goalDeadline').value = goal.deadline;
        const timeValueInput = document.getElementById('goalTimeValue');
        const timeUnitSelect = document.getElementById('goalTimeUnit');
        if (goal.time >= 60 && goal.time % 60 === 0) {
            timeValueInput.value = goal.time / 60;
            timeUnitSelect.value = 'hours';
        } else {
            timeValueInput.value = goal.time;
            timeUnitSelect.value = 'minutes';
        }
        document.getElementById('goalMilestones').value = goal.milestones.map(m => m.text).join(', ');
        addGoalModal.classList.add('visible');
    }
    if (addGoalForm) {
        addGoalForm.addEventListener('submit', e => {
            e.preventDefault();
            const editingId = Number(addGoalForm.dataset.editingId);
            const timeValue = document.getElementById('goalTimeValue').value;
            const timeUnit = document.getElementById('goalTimeUnit').value;
            let timeInMinutes = 0;
            if (timeUnit === 'hours') timeInMinutes = timeValue * 60;
            else if (timeUnit === 'seconds') timeInMinutes = timeValue / 60;
            else timeInMinutes = Number(timeValue);
            const milestoneText = document.getElementById('goalMilestones').value;
            const goalData = { title: document.getElementById('goalTitle').value, description: document.getElementById('goalDescription').value, deadline: document.getElementById('goalDeadline').value, time: timeInMinutes, milestones: milestoneText ? milestoneText.split(',').map(text => ({ text: text.trim(), completed: false })) : [] };
            if (editingId) {
                const goal = goals.find(g => g.id === editingId);
                const existingMilestones = goal.milestones;
                Object.assign(goal, goalData);
                goal.milestones.forEach(newMilestone => {
                    const oldMilestone = existingMilestones.find(om => om.text === newMilestone.text);
                    if (oldMilestone) newMilestone.completed = oldMilestone.completed;
                });
            } else {
                goals.push({ ...goalData, id: Date.now() });
            }
            saveData();
            renderGoals(); updateGoalStats(); updateDashboard(); closeGoalModal();
        });
    }
    function closeGoalModal() {
        addGoalModal.classList.remove('visible');
        addGoalForm.reset();
        delete addGoalForm.dataset.editingId;
        addGoalModal.querySelector('h2').textContent = 'Create New Goal';
        addGoalModal.querySelector('.modal-button').textContent = 'Create Goal';
    }
    function setupTaskTabs() {
        const taskTabs = document.getElementById('taskTabs');
        if (taskTabs) {
            taskTabs.addEventListener('click', e => {
                if (e.target.tagName === 'BUTTON') {
                    document.querySelector('.tab-button.active').classList.remove('active');
                    e.target.classList.add('active');
                    renderTasks(e.target.dataset.filter);
                }
            });
        }
    }
    document.body.addEventListener('click', e => {
        const target = e.target;
        if (target.matches('.task-status-indicator')) {
            const taskId = Number(target.dataset.taskId);
            const task = tasks.find(t => t.id === taskId);
            if(task) {
                const currentStatus = target.dataset.status;
                if (currentStatus === 'pending') task.status = 'in-progress';
                else if (currentStatus === 'in-progress') task.status = 'completed';
                else task.status = 'pending';
                saveData();
                renderTasks(document.querySelector('#taskTabs .active').dataset.filter);
                updateDashboard(); renderUpcomingTasks();
            }
        }
        const actionBtn = target.closest('.action-btn');
        if (!actionBtn) return;
        const taskId = actionBtn.dataset.taskId;
        const goalId = actionBtn.dataset.goalId;
        if (actionBtn.matches('.edit-btn')) {
            if (taskId) openEditTaskModal(tasks.find(t => t.id === Number(taskId)));
            if (goalId) openEditGoalModal(goals.find(g => g.id === Number(goalId)));
        }
        if (actionBtn.matches('.delete-btn')) {
            if (taskId) {
                if (confirm('Are you sure you want to delete this task?')) {
                    tasks = tasks.filter(t => t.id !== Number(taskId));
                    saveData();
                    renderTasks(document.querySelector('#taskTabs .active').dataset.filter);
                    renderUpcomingTasks(); updateDashboard();
                }
            }
            if (goalId) {
                if (confirm('Are you sure you want to delete this goal?')) {
                    goals = goals.filter(g => g.id !== Number(goalId));
                    saveData();
                    renderGoals(); updateGoalStats(); updateDashboard();
                }
            }
        }
    });
    document.body.addEventListener('change', e => {
        if (e.target.matches('input[type="checkbox"][data-goal-id]')) {
            const goalId = Number(e.target.dataset.goalId);
            const goal = goals.find(g => g.id === goalId);
            if (goal) {
                goal.milestones[Number(e.target.dataset.milestoneIndex)].completed = e.target.checked;
                saveData();
                renderGoals(); updateGoalStats(); updateDashboard();
            }
        }
    });
    function setupResponsiveSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const openBtn = document.querySelector('.open-sidebar-btn');
        const closeBtn = document.querySelector('.close-sidebar-btn');
        const overlay = document.querySelector('.overlay');
        if (openBtn) openBtn.addEventListener('click', () => { sidebar.classList.add('is-open'); overlay.classList.add('is-visible'); });
        if (closeBtn) closeBtn.addEventListener('click', () => { sidebar.classList.remove('is-open'); overlay.classList.remove('is-visible'); });
        if (overlay) overlay.addEventListener('click', () => { sidebar.classList.remove('is-open'); overlay.classList.remove('is-visible'); });
    }
    document.getElementById('addTaskBtn')?.addEventListener('click', () => {
        addTaskForm.reset(); delete addTaskForm.dataset.editingId;
        addTaskModal.querySelector('h2').textContent = 'Add New Task';
        addTaskModal.querySelector('.modal-button').textContent = 'Add Task';
        addTaskModal.classList.add('visible');
    });
    document.getElementById('closeTaskModalBtn')?.addEventListener('click', closeTaskModal);
    document.getElementById('addGoalBtn')?.addEventListener('click', () => {
        addGoalForm.reset(); delete addGoalForm.dataset.editingId;
        addGoalModal.querySelector('h2').textContent = 'Create New Goal';
        addGoalModal.querySelector('.modal-button').textContent = 'Create Goal';
        addGoalModal.classList.add('visible');
    });
    document.getElementById('closeGoalModalBtn')?.addEventListener('click', closeGoalModal);
    window.addEventListener('click', e => {
        if (e.target === addTaskModal) closeTaskModal();
        if (e.target === addGoalModal) closeGoalModal();
    });
});