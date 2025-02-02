class TaskApp {
    constructor() {
        this.currentDate = new Date();
        this.deferredPrompt = null;
        
        // Ensure DOM is fully loaded before initialization
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', this.initialize.bind(this));
        } else {
            this.initialize();
        }
    }

    initialize() {
        this.initializeEventListeners();
        this.renderCalendar();
        this.initThemeToggle();
        this.loadSavedTasks();
        this.initCalendarTouchInteraction();
        this.initNotificationPermission();
        this.initOfflineSupport();
        
        // Defer PWA installation setup to ensure DOM is ready
        this.setupPWAInstallation();
    }

    setupPWAInstallation() {
        const installButton = document.getElementById('install-pwa-button');
        
        if (!installButton) {
            console.error('Installation button not found');
            return;
        }

        // Hide install button initially
        installButton.style.display = 'none';

        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent default browser prompt
            e.preventDefault();
            
            // Store the event for later use
            this.deferredPrompt = e;
            
            // Show install button
            installButton.style.display = 'flex';
        });

        // Handle button click for installation
        installButton.addEventListener('click', async () => {
            if (!this.deferredPrompt) {
                console.log('No installation prompt available');
                return;
            }

            try {
                // Show installation prompt
                const { outcome } = await this.deferredPrompt.prompt();
                
                if (outcome === 'accepted') {
                    console.log('App installation accepted');
                } else {
                    console.log('App installation dismissed');
                }
                
                // Reset the deferred prompt
                this.deferredPrompt = null;
                
                // Hide install button
                installButton.style.display = 'none';
            } catch (error) {
                console.error('Installation error:', error);
            }
        });

        // Handle successful app installation
        window.addEventListener('appinstalled', () => {
            console.log('App installed successfully');
            installButton.style.display = 'none';
        });
    }

    initializeEventListeners() {
        document.getElementById('add-task').addEventListener('click', this.addTask.bind(this));
        document.getElementById('prev-month').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('next-month').addEventListener('click', () => this.changeMonth(1));
    }

    initThemeToggle() {
        const themeSwitch = document.getElementById('theme-switch');
        const savedTheme = localStorage.getItem('theme');

        // Set initial theme
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        }

        themeSwitch.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            
            // Save theme preference
            const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
            localStorage.setItem('theme', currentTheme);
        });
    }

    renderCalendar(date = new Date()) {
        this.currentDate = date;
        const calendarGrid = document.getElementById('calendar-grid');
        const monthDisplay = document.getElementById('current-month');
        
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        monthDisplay.textContent = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        
        calendarGrid.innerHTML = '';
        
        // Add empty days before first day of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('calendar-day', 'empty-day');
            calendarGrid.appendChild(emptyDay);
        }
        
        // Add days of the month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dayElement = document.createElement('div');
            dayElement.textContent = day;
            dayElement.classList.add('calendar-day');
            
            // Check if this day has tasks
            const tasksForDay = this.getTasksForDay(date.getFullYear(), date.getMonth(), day);
            if (tasksForDay.length > 0) {
                dayElement.classList.add('has-tasks');
            }
            
            calendarGrid.appendChild(dayElement);
        }
    }

    getTasksForDay(year, month, day) {
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        return tasks.filter(task => {
            const taskDate = new Date(task.datetime);
            return taskDate.getFullYear() === year && 
                   taskDate.getMonth() === month && 
                   taskDate.getDate() === day;
        });
    }

    initCalendarTouchInteraction() {
        const calendarGrid = document.getElementById('calendar-grid');
        let startX = 0;
        let isDragging = false;

        calendarGrid.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
        });

        calendarGrid.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const currentX = e.touches[0].clientX;
            const diffX = startX - currentX;

            // Detect significant horizontal swipe
            if (Math.abs(diffX) > 50) {
                this.changeMonth(diffX > 0 ? 1 : -1);
                isDragging = false;
            }
        });

        calendarGrid.addEventListener('touchend', () => {
            isDragging = false;
        });

        // Add click event to select specific date
        calendarGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('calendar-day') && !e.target.classList.contains('empty-day')) {
                const selectedDay = parseInt(e.target.textContent);
                this.selectSpecificDate(selectedDay);
            }
        });
    }

    selectSpecificDate(day) {
        const selectedDate = new Date(
            this.currentDate.getFullYear(), 
            this.currentDate.getMonth(), 
            day
        );
        
        // Highlight selected date
        const calendarGrid = document.getElementById('calendar-grid');
        const dayElements = calendarGrid.querySelectorAll('.calendar-day');
        dayElements.forEach(el => el.classList.remove('selected-day'));
        
        const selectedDayElement = Array.from(dayElements).find(el => 
            parseInt(el.textContent) === day
        );
        
        if (selectedDayElement) {
            selectedDayElement.classList.add('selected-day');
        }

        // Store the selected date for task creation
        this.selectedDate = selectedDate;

        // Update task input to only show time
        const taskDatetime = document.getElementById('task-time');
        taskDatetime.value = '';
    }

    initNotificationPermission() {
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Notification permission granted');
                }
            });
        }
    }

    addTask() {
        // Validate that a date has been selected
        if (!this.selectedDate) {
            alert('Por favor, selecione uma data no calendário primeiro');
            return;
        }

        const time = document.getElementById('task-time').value;
        const phone = document.getElementById('phone-number').value;
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-description').value;

        if (!time || !phone || !title) {
            alert('Por favor, preencha todos os campos');
            return;
        }

        // Combine selected date with input time
        const [hours, minutes] = time.split(':');
        const taskDateTime = new Date(
            this.selectedDate.getFullYear(), 
            this.selectedDate.getMonth(), 
            this.selectedDate.getDate(), 
            hours, 
            minutes
        );

        const task = { 
            id: Date.now(), 
            title, 
            datetime: taskDateTime.toISOString(), 
            phone, 
            description 
        };

        // Save task to local storage
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        tasks.push(task);
        localStorage.setItem('tasks', JSON.stringify(tasks));

        // Schedule notification
        this.scheduleNotification(task);

        this.clearTaskInputs();
        this.updateTasksList();
    }

    scheduleNotification(task) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const taskDate = new Date(task.datetime);
            
            // Create a local notification
            if ('serviceWorker' in navigator && 'showNotification' in ServiceWorkerRegistration.prototype) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification(task.title, {
                        body: `${task.description}\nHorário: ${taskDate.toLocaleTimeString()}`,
                        tag: task.id.toString(),
                        icon: 'app-icon.png',
                        vibrate: [200, 100, 200],
                        badge: 'app-icon.png'
                    });
                });
            }

            // Optional: Local SMS-like notification placeholder
            this.sendLocalNotification(task);
        }
    }

    sendLocalNotification(task) {
        // Store notification in local storage for offline access
        const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        notifications.push({
            id: task.id,
            title: task.title,
            description: task.description,
            datetime: task.datetime,
            phone: task.phone,
            read: false
        });
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }

    initOfflineSupport() {
        // Check for online/offline status
        window.addEventListener('online', () => {
            console.log('You are now online');
            this.syncTasks();
        });

        window.addEventListener('offline', () => {
            console.log('You are now offline');
        });
    }

    syncTasks() {
        // Placeholder for potential future server sync
        // Currently just ensures local storage is up to date
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        this.updateTasksList(tasks);
    }

    clearTaskInputs() {
        document.getElementById('task-title').value = '';
        document.getElementById('task-time').value = '';
        document.getElementById('phone-number').value = '';
        document.getElementById('task-description').value = '';
        this.selectedDate = null;
    }

    showDateDetails(date) {
        // This could be expanded to show existing tasks or open a modal for new task creation
        console.log(`Selected date: ${date.toLocaleDateString()}`);
    }

    changeMonth(direction) {
        const newDate = new Date(this.currentDate);
        newDate.setMonth(newDate.getMonth() + direction);
        this.renderCalendar(newDate);
    }

    loadSavedTasks() {
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        this.updateTasksList(tasks);
    }

    updateTasksList(tasks = []) {
        const tasksList = document.getElementById('upcoming-tasks');
        tasksList.innerHTML = '';

        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.classList.add('task-item');
            taskElement.innerHTML = `
                <h4>${task.title}</h4>
                <p>${new Date(task.datetime).toLocaleString()}</p>
                <p>${task.description}</p>
            `;
            tasksList.appendChild(taskElement);
        });
    }

}

export default TaskApp;