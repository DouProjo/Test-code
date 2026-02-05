// Google API Configuration
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE'; // Replace with your actual Client ID
const SCOPES = 'https://www.googleapis.com/auth/calendar';

// Task App with Points, Streaks, and Prizes
class TaskMaster {
    constructor() {
        this.tasks = [];
        this.categories = [];
        this.points = 0;
        this.streak = 0;
        this.lastCompletedDate = null;
        this.completedToday = 0;
        this.unlockedPrizes = [];
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.googleAuth = null;
        this.googleCalendarEvents = [];
        
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.setupGoogleAuth();
        this.render();
        this.checkStreakReset();
        this.renderCalendar();
    }

    setupGoogleAuth() {
        // Initialize Google Sign-In
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: this.handleGoogleSignIn.bind(this)
        });

        // Render the sign-in button
        google.accounts.id.renderButton(
            document.getElementById('googleSignInButton'),
            { 
                theme: 'outline',
                size: 'large',
                text: 'signin_with'
            }
        );

        // Check if user is already signed in
        google.accounts.id.prompt((notification) => {
            // Handle prompts
        });
    }

    handleGoogleSignIn(response) {
        // Decode JWT to get user info
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const userInfo = JSON.parse(jsonPayload);
        this.updateUserUI(userInfo);
        
        // Load Google Calendar API
        this.loadGoogleCalendar();
    }

    updateUserUI(userInfo) {
        document.getElementById('googleSignInButton').style.display = 'none';
        document.getElementById('userInfo').style.display = 'flex';
        document.getElementById('userProfilePic').src = userInfo.picture;
        document.getElementById('userName').textContent = userInfo.name;
        
        document.getElementById('signOutBtn').addEventListener('click', () => {
            google.accounts.id.disableAutoSelect();
            document.getElementById('googleSignInButton').style.display = 'block';
            document.getElementById('userInfo').style.display = 'none';
            document.getElementById('syncGoogleBtn').style.display = 'none';
        });

        // Show sync button
        document.getElementById('syncGoogleBtn').style.display = 'inline-block';
    }

    loadGoogleCalendar() {
        gapi.load('client', () => {
            gapi.client.init({
                apiKey: 'YOUR_GOOGLE_API_KEY_HERE', // Replace with your API key
                scope: SCOPES,
            }).then(() => {
                this.loadCalendarList();
                document.getElementById('syncGoogleBtn').addEventListener('click', () => this.syncGoogleCalendar());
            });
        });
    }

    loadCalendarList() {
        gapi.client.calendar.calendarList.list().then((response) => {
            const calendars = response.result.items;
            const select = document.getElementById('calendarSelect');
            select.innerHTML = '<option value="">Select a calendar</option>';
            
            calendars.forEach(calendar => {
                const option = document.createElement('option');
                option.value = calendar.id;
                option.textContent = calendar.summary;
                select.appendChild(option);
            });
            
            document.getElementById('calendarSelect').style.display = 'inline-block';
        });
    }

    syncGoogleCalendar() {
        const calendarId = document.getElementById('calendarSelect').value;
        if (!calendarId) {
            alert('Please select a calendar');
            return;
        }

        // Get current month's tasks as events
        const eventsToSync = this.getMonthTasks();
        
        eventsToSync.forEach(task => {
            const event = {
                summary: task.text,
                description: `Priority: ${task.priorityLabel} | Points: ${task.points}`,
                start: {
                    date: task.dateAdded
                },
                end: {
                    date: task.dateAdded
                }
            };

            gapi.client.calendar.events.insert({
                calendarId: calendarId,
                resource: event
            }).then(() => {
                this.showNotification('Event synced to Google Calendar!');
            });
        });
    }

    getMonthTasks() {
        const month = this.currentDate.getMonth();
        const year = this.currentDate.getFullYear();
        
        return this.tasks.filter(task => {
            const taskDate = new Date(task.dateAdded);
            return taskDate.getMonth() === month && taskDate.getFullYear() === year;
        });
    }

    setupEventListeners() {
        // Dashboard listeners
        document.getElementById('addBtn').addEventListener('click', () => this.addTaskDashboard());
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTaskDashboard();
        });

        // Tasks tab listeners
        document.getElementById('addCategoryBtn').addEventListener('click', () => this.addCategory());
        document.getElementById('categoryInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addCategory();
        });

        document.getElementById('addBtnCategory').addEventListener('click', () => this.addTaskCategory());
        document.getElementById('taskInputCategory').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTaskCategory();
        });

        // Reset and Clear
        document.getElementById('resetBtn').addEventListener('click', () => this.resetDaily());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAllData());

        // Calendar listeners
        document.getElementById('prevMonthBtn').addEventListener('click', () => this.previousMonth());
        document.getElementById('nextMonthBtn').addEventListener('click', () => this.nextMonth());

        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
    }

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));

        // Show selected tab
        document.getElementById(`${tabName}-tab`).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    }

    // Category Methods
    addCategory() {
        const input = document.getElementById('categoryInput');
        const categoryName = input.value.trim();
        const color = document.getElementById('categoryColor').value;

        if (!categoryName) {
            this.showNotification('Please enter a category name!', 'error');
            return;
        }

        const category = {
            id: Date.now(),
            name: categoryName,
            color: color,
            tasks: []
        };

        this.categories.push(category);
        input.value = '';
        
        this.saveToStorage();
        this.renderCategories();
        this.updateCategorySelect();
        this.showNotification(`Category "${categoryName}" created! 📂`);
    }

    deleteCategory(categoryId) {
        if (confirm('Delete this category and move its tasks to uncategorized?')) {
            const category = this.categories.find(c => c.id === categoryId);
            
            // Move tasks back to main tasks
            if (category) {
                category.tasks.forEach(taskId => {
                    const task = this.tasks.find(t => t.id === taskId);
                    if (task) {
                        task.categoryId = null;
                    }
                });
            }

            this.categories = this.categories.filter(c => c.id !== categoryId);
            this.saveToStorage();
            this.renderCategories();
            this.updateCategorySelect();
        }
    }

    renderCategories() {
        const grid = document.getElementById('categoriesGrid');
        
        if (this.categories.length === 0) {
            grid.innerHTML = '<p class="empty-message">No categories yet. Create one to organize your tasks! 📂</p>';
            return;
        }

        grid.innerHTML = this.categories.map(category => {
            const categoryTasks = this.tasks.filter(t => t.categoryId === category.id);
            
            return `
                <div class="category-card">
                    <div class="category-header" style="background-color: ${category.color}">
                        <div class="category-title">${category.name}</div>
                        <button class="category-delete-btn" onclick="app.deleteCategory(${category.id})">✕</button>
                    </div>
                    <div class="category-tasks" data-category-id="${category.id}" ondrop="app.handleDrop(event)" ondragover="app.handleDragOver(event)" ondragleave="app.handleDragLeave(event)">
                        ${categoryTasks.length === 0 
                            ? '<p class="empty-category-message">Drag tasks here</p>'
                            : categoryTasks.map(task => `
                                <div class="category-task-item" draggable="true" data-task-id="${task.id}" ondragstart="app.handleDragStart(event)" ondragend="app.handleDragEnd(event)">
                                    <span class="category-task-name">${task.text}</span>
                                    <button class="category-task-remove" onclick="app.removeTaskFromCategory(${task.id})">✕</button>
                                </div>
                            `).join('')
                        }
                    </div>
                </div>
            `;
        }).join('');
    }

    updateCategorySelect() {
        const select = document.getElementById('categorySelect');
        select.innerHTML = '<option value="">No Category</option>';
        
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });
    }

    // Drag and Drop Methods
    handleDragStart(event) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('taskId', event.target.dataset.taskId);
        event.target.classList.add('dragging');
    }

    handleDragEnd(event) {
        event.target.classList.remove('dragging');
        document.querySelectorAll('.category-tasks').forEach(el => {
            el.classList.remove('drag-over');
        });
    }

    handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        event.currentTarget.classList.add('drag-over');
    }

    handleDragLeave(event) {
        event.currentTarget.classList.remove('drag-over');
    }

    handleDrop(event) {
        event.preventDefault();
        const taskId = parseInt(event.dataTransfer.getData('taskId'));
        const categoryId = parseInt(event.currentTarget.dataset.categoryId);
        
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.categoryId = categoryId;
            this.saveToStorage();
            this.renderCategories();
            this.showNotification('Task moved to category! 📂');
        }

        event.currentTarget.classList.remove('drag-over');
    }

    removeTaskFromCategory(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.categoryId = null;
            this.saveToStorage();
            this.renderCategories();
        }
    }

    // Task Methods
    addTaskDashboard() {
        const input = document.getElementById('taskInput');
        const priority = document.getElementById('priority').value;
        const taskText = input.value.trim();

        if (!taskText) {
            this.showNotification('Please enter a task!', 'error');
            return;
        }

        this.createTask(taskText, priority);
        input.value = '';
        document.getElementById('priority').value = '3';
    }

    addTaskCategory() {
        const input = document.getElementById('taskInputCategory');
        const priority = document.getElementById('priorityCategory').value;
        const categoryId = document.getElementById('categorySelect').value;
        const taskText = input.value.trim();

        if (!taskText) {
            this.showNotification('Please enter a task!', 'error');
            return;
        }

        this.createTask(taskText, priority, categoryId);
        input.value = '';
        document.getElementById('priorityCategory').value = '3';
        document.getElementById('categorySelect').value = '';
    }

    createTask(taskText, priority, categoryId = null) {
        const task = {
            id: Date.now(),
            text: taskText,
            completed: false,
            priority: parseInt(priority),
            points: parseInt(priority),
            priorityLabel: { 1: 'Low', 3: 'Medium', 5: 'High' }[priority],
            dateAdded: new Date().toDateString(),
            dateCompleted: null,
            categoryId: categoryId ? parseInt(categoryId) : null
        };

        this.tasks.push(task);
        this.saveToStorage();
        this.render();
        this.showNotification('Task added! 🎯');
    }

    completeTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        if (task.completed) {
            task.completed = false;
            task.dateCompleted = null;
            this.points -= task.points;
            this.completedToday--;
            this.showNotification('Task uncompleted ↩️');
        } else {
            task.completed = true;
            task.dateCompleted = new Date().toDateString();
            this.points += task.points;
            this.completedToday++;
            
            this.updateStreak();
            this.checkAchievements(task.points);
            
            this.showNotification(`+${task.points} points! ⭐`);
        }

        this.saveToStorage();
        this.render();
    }

    deleteTask(taskId) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex > -1) {
            const task = this.tasks[taskIndex];
            if (task.completed) {
                this.points -= task.points;
                this.completedToday--;
            }
            this.tasks.splice(taskIndex, 1);
            this.saveToStorage();
            this.render();
            this.showNotification('Task deleted');
        }
    }

    updateStreak() {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (this.lastCompletedDate === null) {
            this.streak = 1;
        } else {
            const lastDate = new Date(this.lastCompletedDate);
            const lastDateStr = lastDate.toDateString();
            const yesterdayStr = yesterday.toDateString();
            const todayStr = today.toDateString();

            if (lastDateStr === yesterdayStr || lastDateStr === todayStr) {
                if (lastDateStr === yesterdayStr) {
                    this.streak++;
                }
            } else {
                this.streak = 1;
            }
        }

        this.lastCompletedDate = new Date().toDateString();
    }

    checkStreakReset() {
        const today = new Date().toDateString();
        if (this.lastCompletedDate !== null) {
            const lastDate = new Date(this.lastCompletedDate);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastDate.toDateString() !== today && lastDate.toDateString() !== yesterday.toDateString()) {
                this.streak = 0;
            }
        }
    }

    checkAchievements(points) {
        const achievements = [
            { id: 'bronze', points: 10, message: '🥉 Unlocked Bronze Achievement! You earned 10 points!' },
            { id: 'silver', points: 25, message: '🥈 Unlocked Silver Achievement! You earned 25 points!' },
            { id: 'gold', points: 50, message: '🥇 Unlocked Gold Achievement! You earned 50 points!' },
            { id: 'platinum', points: 100, message: '👑 Unlocked Platinum Achievement! You earned 100 points!' },
            { id: 'streak7', streak: 7, message: '🔥 Unlocked "On Fire" Achievement! 7-day streak!' },
            { id: 'streak30', streak: 30, message: '💎 Unlocked Diamond Achievement! 30-day streak!' }
        ];

        achievements.forEach(achievement => {
            if (!this.unlockedPrizes.includes(achievement.id)) {
                let unlocked = false;
                
                if (achievement.points && this.points >= achievement.points) {
                    unlocked = true;
                }
                if (achievement.streak && this.streak >= achievement.streak) {
                    unlocked = true;
                }

                if (unlocked) {
                    this.unlockedPrizes.push(achievement.id);
                    this.showAchievementNotification(achievement.message);
                }
            }
        });
    }

    resetDaily() {
        const today = new Date().toDateString();
        
        this.tasks = this.tasks.filter(task => {
            if (task.completed && task.dateCompleted === today) {
                return false;
            }
            return true;
        });

        this.completedToday = 0;
        this.saveToStorage();
        this.render();
        this.showNotification('Daily tasks reset! Ready for tomorrow? 🚀');
    }

    clearAllData() {
        if (confirm('⚠️ Are you sure you want to clear ALL data? This cannot be undone!')) {
            this.tasks = [];
            this.categories = [];
            this.points = 0;
            this.streak = 0;
            this.lastCompletedDate = null;
            this.completedToday = 0;
            this.unlockedPrizes = [];
            
            this.saveToStorage();
            this.render();
            this.showNotification('All data cleared!');
        }
    }

    // Calendar Methods
    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        document.getElementById('currentMonth').textContent = 
            new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const calendar = document.getElementById('calendar');
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        let html = '<div class="calendar-header">';
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
            html += `<div class="calendar-day-header">${day}</div>`;
        });
        html += '</div>';

        html += '<div class="calendar">';

        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            html += `<div class="calendar-date other-month">${daysInPrevMonth - i}</div>`;
        }

        // Current month days
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toDateString();
            const todayStr = today.toDateString();
            
            const dayTasks = this.tasks.filter(t => t.dateAdded === dateStr);
            const hasEvents = dayTasks.length > 0;

            let classes = 'calendar-date';
            if (dateStr === todayStr) classes += ' today';
            if (dateStr === this.selectedDate.toDateString()) classes += ' selected';
            if (hasEvents) classes += ' has-events';

            html += `<div class="${classes}" onclick="app.selectDate(new Date(${year}, ${month}, ${day}))">${day}</div>`;
        }

        // Next month days
        const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
        for (let day = 1; day <= totalCells - firstDay - daysInMonth; day++) {
            html += `<div class="calendar-date other-month">${day}</div>`;
        }

        html += '</div>';
        calendar.innerHTML = html;

        this.renderCalendarEvents();
    }

    selectDate(date) {
        this.selectedDate = date;
        this.renderCalendar();
        this.renderCalendarEvents();
    }

    renderCalendarEvents() {
        const dateStr = this.selectedDate.toDateString();
        document.getElementById('selectedDate').textContent = this.selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
        });

        const dayTasks = this.tasks.filter(t => t.dateAdded === dateStr);
        const eventsList = document.getElementById('eventsList');

        if (dayTasks.length === 0) {
            eventsList.innerHTML = '<p class="empty-message">No events on this date</p>';
            return;
        }

        eventsList.innerHTML = dayTasks.map(task => `
            <div class="event-item">
                <div class="event-info">
                    <h4>${task.text}</h4>
                    <div class="event-time">Priority: ${task.priorityLabel} • Points: ${task.points}</div>
                    <span class="event-type">${task.completed ? '✓ Completed' : '⏳ Pending'}</span>
                </div>
            </div>
        `).join('');
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }

    // Storage Methods
    saveToStorage() {
        const data = {
            tasks: this.tasks,
            categories: this.categories,
            points: this.points,
            streak: this.streak,
            lastCompletedDate: this.lastCompletedDate,
            completedToday: this.completedToday,
            unlockedPrizes: this.unlockedPrizes
        };
        localStorage.setItem('taskMasterData', JSON.stringify(data));
    }

    loadFromStorage() {
        const data = localStorage.getItem('taskMasterData');
        if (data) {
            const parsed = JSON.parse(data);
            this.tasks = parsed.tasks || [];
            this.categories = parsed.categories || [];
            this.points = parsed.points || 0;
            this.streak = parsed.streak || 0;
            this.lastCompletedDate = parsed.lastCompletedDate || null;
            this.completedToday = parsed.completedToday || 0;
            this.unlockedPrizes = parsed.unlockedPrizes || [];
        }
    }

    // Render Methods
    render() {
        this.updateStats();
        this.renderTasks();
        this.renderPrizes();
        this.renderCategories();
        this.updateCategorySelect();
    }

    updateStats() {
        document.getElementById('points').textContent = this.points;
        document.getElementById('streak').textContent = this.streak;
        document.getElementById('tasksToday').textContent = this.completedToday;
    }

    renderTasks() {
        const tasksList = document.getElementById('tasksList');
        const today = new Date().toDateString();

        const todayTasks = this.tasks.filter(task => task.dateAdded === today && !task.categoryId);

        if (todayTasks.length === 0) {
            tasksList.innerHTML = '<p class="empty-message">No tasks yet. Add one to get started! 🚀</p>';
            return;
        }

        tasksList.innerHTML = todayTasks.map(task => {
            return `
                <div class="task-item ${task.completed ? 'completed' : ''}">
                    <input 
                        type="checkbox" 
                        class="task-checkbox"
                        ${task.completed ? 'checked' : ''}
                        onchange="app.completeTask(${task.id})"
                    >
                    <div class="task-content">
                        <div class="task-text">
                            ${task.text}
                            <span class="task-priority priority-${task.priorityLabel.toLowerCase()}">
                                ${task.priorityLabel}
                            </span>
                            <span class="task-points">+${task.points} pts</span>
                            ${task.completed ? '<span class="task-completed-badge">✓ Completed</span>' : ''}
                        </div>
                    </div>
                    <button class="delete-btn" onclick="app.deleteTask(${task.id})">Delete</button>
                </div>
            `;
        }).join('');
    }

    renderPrizes() {
        const prizeIds = ['bronze', 'silver', 'gold', 'platinum', 'streak7', 'streak30'];
        
        prizeIds.forEach(prizeId => {
            const element = document.getElementById(`prize-${prizeId}`);
            const card = element.closest('.prize-card');
            
            if (this.unlockedPrizes.includes(prizeId)) {
                element.textContent = '✓';
                card.classList.add('unlocked');
            } else {
                element.textContent = '🔒';
                card.classList.remove('unlocked');
            }
        });
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showAchievementNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 4000);
    }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TaskMaster();
});
