class TaskApp {
    constructor() {
        this.currentDate = new Date();
        this.deferredPrompt = null;
        this.selectedDate = null;
        
        this.initializeApp();
        this.initCancelTasksFeature();
        this.initSettingsFeature();
        this.loadSavedAppointments();
    }

    async initializeApp() {
        try {
            await this.waitForDOMLoaded();
            this.initializeEventListeners();
            this.renderCalendar();
            this.initThemeToggle();
            try {
                const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
                this.updateTasksList(tasks);
            } catch (error) {
                console.error('Error loading tasks from localStorage:', error);
            }
            this.initCalendarTouchInteraction();
            this.initNotificationPermission();
            this.initOfflineSupport();
            this.setupPWAInstallation();
        } catch (error) {
            console.error('App initialization error:', error);
        }
    }

    waitForDOMLoaded() {
        return new Promise(resolve => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }

    setupPWAInstallation() {
        const installButton = document.getElementById('install-app');
        let deferredPrompt;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installButton.style.display = 'block';
        });

        installButton.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`Installation outcome: ${outcome}`);
                installButton.style.display = 'none';
                deferredPrompt = null;
            }
        });

        window.addEventListener('appinstalled', () => {
            console.log('App installed successfully');
        });
    }

    async handleAppInstallation() {
        if (!this.deferredPrompt) return;

        try {
            const { outcome } = await this.deferredPrompt.prompt();
            console.log(`Installation outcome: ${outcome}`);
            
            this.deferredPrompt = null;
        } catch (error) {
            console.error('Installation error:', error);
        }
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
            this.updateThemeIcon(true);
        } else {
            this.updateThemeIcon(false);
        }

        themeSwitch.addEventListener('click', () => {
            const isDarkMode = document.body.classList.toggle('dark-mode');
            
            // Save theme preference
            const currentTheme = isDarkMode ? 'dark' : 'light';
            localStorage.setItem('theme', currentTheme);

            // Update theme icon
            this.updateThemeIcon(isDarkMode);
        });
    }

    updateThemeIcon(isDarkMode) {
        const themeSwitch = document.getElementById('theme-switch');
        const icon = themeSwitch.querySelector('i');
        
        if (isDarkMode) {
            icon.classList.remove('ri-moon-line');
            icon.classList.add('ri-sun-line');
        } else {
            icon.classList.remove('ri-sun-line');
            icon.classList.add('ri-moon-line');
        }
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
        try {
            const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            return tasks.filter(task => {
                const taskDate = new Date(task.datetime);
                return taskDate.getFullYear() === year && 
                       taskDate.getMonth() === month && 
                       taskDate.getDate() === day;
            });
        } catch (error) {
            console.error('Error getting tasks for day:', error);
            return [];
        }
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
        try {
            const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            tasks.push(task);
            localStorage.setItem('tasks', JSON.stringify(tasks));
        } catch (error) {
            console.error('Error saving task to localStorage:', error);
        }

        // Schedule notification
        this.scheduleNotification(task);

        this.clearTaskInputs();
        this.updateTasksList();
    }

    scheduleNotification(task) {
        const notificationTime = new Date(task.datetime).getTime() - Date.now();
        if (notificationTime > 0) {
            setTimeout(() => {
                this.sendLocalNotification(task);
                this.showFullScreenNotification(task);
            }, notificationTime);
        }
    }

    showFullScreenNotification(task) {
        const notificationSound = new Audio('path/to/sound.mp3'); 
        notificationSound.play();

        const fullScreenDiv = document.createElement('div');
        fullScreenDiv.style.position = 'fixed';
        fullScreenDiv.style.top = '0';
        fullScreenDiv.style.left = '0';
        fullScreenDiv.style.width = '100%';
        fullScreenDiv.style.height = '100%';
        fullScreenDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        fullScreenDiv.style.color = 'white';
        fullScreenDiv.style.display = 'flex';
        fullScreenDiv.style.justifyContent = 'center';
        fullScreenDiv.style.alignItems = 'center';
        fullScreenDiv.style.zIndex = '9999';
        fullScreenDiv.className = 'pulsing-message';
        fullScreenDiv.innerHTML = `<h1>${task.title}</h1><p>${task.description}</p>`;
        document.body.appendChild(fullScreenDiv);

        // Remover o modal quando o usuário clicar
        fullScreenDiv.addEventListener('click', () => {
            document.body.removeChild(fullScreenDiv);
        });
    }

    sendLocalNotification(task) {
        // Store notification in local storage for offline access
        try {
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
        } catch (error) {
            console.error('Error sending local notification:', error);
        }
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
        try {
            const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            this.updateTasksList(tasks);
        } catch (error) {
            console.error('Error syncing tasks:', error);
        }
    }

    syncData() {
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const userInfo = {
            name: document.getElementById('user-name').value,
            email: document.getElementById('user-email').value,
        };

        const feedbackElement = document.getElementById('sync-feedback');
        feedbackElement.style.display = 'block';
        feedbackElement.textContent = 'Sincronizando...';

        fetch('https://jsonplaceholder.typicode.com/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tasks, userInfo }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro na sincronização: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            feedbackElement.textContent = 'Dados sincronizados com sucesso!';
            console.log('Dados sincronizados com sucesso:', data);
        })
        .catch(error => {
            feedbackElement.textContent = 'Erro ao sincronizar dados: ' + error.message;
            console.error('Erro ao sincronizar dados:', error);
        });
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
        try {
            const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            this.updateTasksList(tasks);
        } catch (error) {
            console.error('Error loading tasks from localStorage:', error);
        }
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

    initCancelTasksFeature() {
        const cancelTasksButton = document.getElementById('cancel-tasks');
        cancelTasksButton.addEventListener('click', this.showCancelTasksModal.bind(this));
    }

    showCancelTasksModal() {
        // Create modal dynamically
        const modal = document.createElement('div');
        modal.classList.add('cancel-tasks-modal');
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Cancelar Compromissos</h3>
                <div id="tasks-to-cancel">
                    ${this.renderTasksToCancel()}
                </div>
                <div class="modal-actions">
                    <button id="cancel-selected-tasks">Cancelar Selecionados</button>
                    <button id="cancel-all-tasks">Cancelar Todos</button>
                    <button id="close-cancel-modal">Fechar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        document.getElementById('cancel-selected-tasks').addEventListener('click', this.cancelSelectedTasks.bind(this));
        document.getElementById('cancel-all-tasks').addEventListener('click', this.cancelAllTasks.bind(this));
        document.getElementById('close-cancel-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    renderTasksToCancel() {
        try {
            const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            if (tasks.length === 0) {
                return '<p>Não há tarefas para cancelar</p>';
            }

            return tasks.map(task => `
                <div class="cancel-task-item">
                    <input type="checkbox" id="task-${task.id}" value="${task.id}">
                    <label for="task-${task.id}">
                        ${task.title} - ${new Date(task.datetime).toLocaleString()}
                    </label>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error rendering tasks to cancel:', error);
            return '<p>Não há tarefas para cancelar</p>';
        }
    }

    cancelSelectedTasks() {
        const selectedTasks = Array.from(
            document.querySelectorAll('#tasks-to-cancel input:checked')
        ).map(checkbox => checkbox.value);

        if (selectedTasks.length === 0) {
            alert('Nenhuma tarefa selecionada');
            return;
        }

        try {
            let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            tasks = tasks.filter(task => !selectedTasks.includes(task.id.toString()));

            localStorage.setItem('tasks', JSON.stringify(tasks));
            this.updateTasksList(tasks);
        } catch (error) {
            console.error('Error canceling selected tasks:', error);
        }
        
        // Close the modal
        document.body.removeChild(document.querySelector('.cancel-tasks-modal'));
    }

    cancelAllTasks() {
        if (confirm('Tem certeza que deseja cancelar TODOS os compromissos?')) {
            try {
                localStorage.removeItem('tasks');
                this.updateTasksList([]);
            } catch (error) {
                console.error('Error canceling all tasks:', error);
            }
            
            // Close the modal
            document.body.removeChild(document.querySelector('.cancel-tasks-modal'));
        }
    }

    initSettingsFeature() {
        const settingsPanel = document.getElementById('settings-panel');
        const settingsButton = document.getElementById('settings');

        settingsButton.addEventListener('click', () => {
            if (settingsPanel.style.display === 'block') {
                settingsPanel.style.display = 'none';
            } else {
                settingsPanel.style.display = 'block';
            }
        });

        document.getElementById('close-settings').addEventListener('click', () => {
            settingsPanel.style.display = 'none';
        });

        const notificationToggle = document.getElementById('notification-toggle');
        const soundToggle = document.getElementById('sound-toggle');

        notificationToggle.addEventListener('change', function() {
            try {
                localStorage.setItem('notificationsEnabled', this.checked);
            } catch (error) {
                console.error('Error saving notification toggle:', error);
            }
        });

        soundToggle.addEventListener('change', function() {
            try {
                localStorage.setItem('soundEnabled', this.checked);
            } catch (error) {
                console.error('Error saving sound toggle:', error);
            }
        });

        // Recuperar as configurações ao iniciar o aplicativo
        try {
            const notificationsEnabled = localStorage.getItem('notificationsEnabled') === 'true';
            const soundEnabled = localStorage.getItem('soundEnabled') === 'true';
            notificationToggle.checked = notificationsEnabled;
            soundToggle.checked = soundEnabled;
        } catch (error) {
            console.error('Error loading settings:', error);
        }

        document.getElementById('sync-data').addEventListener('click', () => {
            this.syncData();
        });

        document.getElementById('reset-settings').addEventListener('click', () => {
            try {
                localStorage.clear();
                // Redefinir outras configurações se necessário
            } catch (error) {
                console.error('Error resetting settings:', error);
            }
        });
    }

    loadSavedAppointments() {
        try {
            const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
            const appointmentsList = document.getElementById('appointments-list');
            appointmentsList.innerHTML = '';

            appointments.forEach(appointment => {
                const appointmentElement = document.createElement('div');
                appointmentElement.classList.add('appointment-item');
                appointmentElement.innerHTML = `<h4>${appointment.title}</h4><p>${new Date(appointment.datetime).toLocaleString()}</p>`;
                appointmentsList.appendChild(appointmentElement);
            });
        } catch (error) {
            console.error('Error loading appointments from localStorage:', error);
        }
    }
}

export default TaskApp;

// Auto-initialize the app
if (typeof window !== 'undefined') {
    new TaskApp();
}