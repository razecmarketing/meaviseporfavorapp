class TaskApp {
    constructor() {
        this.initializeEventListeners();
        this.renderCalendar();
    }

    initializeEventListeners() {
        document.getElementById('add-task').addEventListener('click', this.addTask.bind(this));
        document.getElementById('prev-month').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('next-month').addEventListener('click', () => this.changeMonth(1));
    }

    renderCalendar(date = new Date()) {
        const calendarGrid = document.getElementById('calendar-grid');
        const monthDisplay = document.getElementById('current-month');
        
        // Implementação do calendário interativo
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        monthDisplay.textContent = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        
        calendarGrid.innerHTML = '';
        
        // Adicionar dias vazios antes do primeiro dia do mês
        for (let i = 0; i < firstDay.getDay(); i++) {
            calendarGrid.appendChild(document.createElement('div'));
        }
        
        // Adicionar dias do mês
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dayElement = document.createElement('div');
            dayElement.textContent = day;
            dayElement.classList.add('calendar-day');
            calendarGrid.appendChild(dayElement);
        }
    }

    changeMonth(direction) {
        // Lógica para mudar de mês
        console.log(`Mudando mês na direção: ${direction}`);
    }

    addTask() {
        const title = document.getElementById('task-title').value;
        const datetime = document.getElementById('task-datetime').value;
        const phone = document.getElementById('phone-number').value;
        const description = document.getElementById('task-description').value;

        if (!title || !datetime || !phone) {
            alert('Por favor, preencha todos os campos');
            return;
        }

        // Aqui você implementaria a lógica de salvar a tarefa
        // Possivelmente usando localStorage ou uma API
        console.log('Tarefa adicionada:', { title, datetime, phone, description });

        // Limpar campos após adicionar
        this.clearTaskInputs();
        this.updateTasksList();
    }

    clearTaskInputs() {
        document.getElementById('task-title').value = '';
        document.getElementById('task-datetime').value = '';
        document.getElementById('phone-number').value = '';
        document.getElementById('task-description').value = '';
    }

    updateTasksList() {
        const tasksList = document.getElementById('upcoming-tasks');
        // Implementar lógica para mostrar tarefas salvas
    }
}

// Inicializar a aplicação
document.addEventListener('DOMContentLoaded', () => {
    new TaskApp();
});