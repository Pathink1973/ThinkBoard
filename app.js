// DOM Elements
const kanbanBoard = document.getElementById('kanbanBoard');
const taskModal = document.getElementById('taskModal');
const editTaskModal = document.getElementById('editTaskModal');
const categoryModal = document.getElementById('categoryModal');
const taskForm = document.getElementById('taskForm');
const editTaskForm = document.getElementById('editTaskForm');
const categoryForm = document.getElementById('categoryForm');
const categoryList = document.getElementById('categoryList');
const categoryFilter = document.getElementById('categoryFilter');
const kanbanViewBtn = document.getElementById('kanbanViewBtn');
const calendarViewBtn = document.getElementById('calendarViewBtn');
const kanbanView = document.getElementById('kanbanView');
const calendarView = document.getElementById('calendarView');
const settingsModal = document.getElementById('settingsModal');
const settingsBtn = document.getElementById('settingsBtn');
const closeSettingsModal = document.getElementById('closeSettingsModal');

// Buttons
const addTaskBtn = document.getElementById('addTaskBtn');
const newCategoryBtn = document.getElementById('newCategoryBtn');
const closeTaskModalBtn = document.getElementById('closeTaskModal');
const closeEditTaskModalBtn = document.getElementById('closeEditTaskModal');
const closeCategoryModalBtn = document.getElementById('closeCategoryModal');

// Initial Categories
const defaultCategories = [
    'Design Gráfico',
    'Design Editorial',
    'UI/UX Design',
    'Webdesign',
    'Ilustração',
    'Fotografia',
    'Motion Design'
];

// Initialize categories
function initializeCategories() {
    const categoryList = document.getElementById('categoryList');
    categoryList.innerHTML = defaultCategories.map(category => `
        <li class="category-item" onclick="filterByCategory('${category}')">
            <span class="category-icon">
                <i class="fas fa-folder"></i>
            </span>
            ${category}
        </li>
    `).join('');
    
    // Add "All Categories" option at the top
    categoryList.innerHTML = `
        <li class="category-item active" onclick="filterByCategory('all')">
            <span class="category-icon">
                <i class="fas fa-folder"></i>
            </span>
            Todas as Categorias
        </li>
    ` + categoryList.innerHTML;
}

// Category filtering
function filterByCategory(category) {
    // Update active state in sidebar
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('active');
        if (item.textContent.trim() === category || (category === 'all' && item.textContent.trim() === 'Todas as Categorias')) {
            item.classList.add('active');
        }
    });

    // Filter tasks
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const filteredTasks = category === 'all' ? tasks : tasks.filter(task => task.category === category);
    
    // Update columns with filtered tasks
    const columns = ['todo', 'doing', 'done'];
    columns.forEach(status => {
        const column = document.querySelector(`[data-status="${status}"]`);
        const tasksInColumn = filteredTasks.filter(task => task.status === status);
        
        column.innerHTML = `
            <h3>${status.charAt(0).toUpperCase() + status.slice(1)}</h3>
            ${tasksInColumn.map(task => createTaskCard(task)).join('')}
        `;
    });
    
    setupDragAndDrop();
}

// Add event listener for categories
document.addEventListener('DOMContentLoaded', () => {
    initializeCategories();
    renderTasks();
    setupDragAndDrop();
    updateTaskCounts();
    populateCategoryDropdowns();
});

// Modal handling functions
function openTaskModal() {
    taskModal.style.display = 'block';
}

function closeTaskModal() {
    taskModal.style.display = 'none';
    taskForm.reset();
}

function closeEditTaskModal() {
    editTaskModal.style.display = 'none';
    editTaskForm.reset();
    currentEditingTaskId = null;
}

function closeCategoryModal() {
    categoryModal.style.display = 'none';
    categoryForm.reset();
}

function openSettingsModal() {
    settingsModal.style.display = 'block';
}

function closeSettingsModalFn() {
    settingsModal.style.display = 'none';
}

// Task Functions
function handleTaskSubmit(event) {
    event.preventDefault();
    
    const taskTitle = document.getElementById('taskTitle');
    const taskDescription = document.getElementById('taskDescription');
    const taskDueDate = document.getElementById('taskDueDate');
    const taskCategory = document.getElementById('taskCategory');
    const taskPriority = document.getElementById('taskPriority');

    const task = {
        id: Date.now().toString(),
        title: taskTitle.value,
        description: taskDescription.value,
        category: taskCategory.value,
        dueDate: taskDueDate.value || null,
        priority: taskPriority.value,
        status: 'todo',
        createdAt: new Date().toISOString()
    };

    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));

    closeTaskModal();
    renderTasks();
    updateTaskCounts();
}

function editTask(taskId) {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskDescription').value = task.description;
    document.getElementById('editTaskDueDate').value = task.dueDate;
    document.getElementById('editTaskCategory').value = task.category;
    document.getElementById('editTaskPriority').value = task.priority;

    editTaskModal.style.display = 'block';
}

function handleEditTaskSubmit(e) {
    e.preventDefault();

    const taskId = document.getElementById('editTaskId').value;
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const taskIndex = tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) return;

    const updatedTask = {
        title: document.getElementById('editTaskTitle').value,
        description: document.getElementById('editTaskDescription').value,
        category: document.getElementById('editTaskCategory').value,
        dueDate: document.getElementById('editTaskDueDate').value || null,
        priority: document.getElementById('editTaskPriority').value
    };

    tasks[taskIndex] = { ...tasks[taskIndex], ...updatedTask };

    localStorage.setItem('tasks', JSON.stringify(tasks));
    closeEditTaskModal();
    renderTasks();
}

function deleteTask(taskId) {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    renderTasks();
    updateTaskCounts();
}

function updateTaskStatus(taskId, newStatus) {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex !== -1) {
        tasks[taskIndex].status = newStatus;
        
        // Update progress based on status
        switch (newStatus) {
            case 'todo':
                tasks[taskIndex].progress = 0;
                break;
            case 'doing':
                tasks[taskIndex].progress = 50;
                break;
            case 'done':
                tasks[taskIndex].progress = 100;
                break;
        }
        
        localStorage.setItem('tasks', JSON.stringify(tasks));
        updateTasksDisplay();
        updateTaskCounts();
    }
}

function getProgressBarColor(status) {
    switch(status) {
        case 'todo':
            return '#ff9f1a'; // Orange
        case 'doing':
            return '#2196f3'; // Blue
        case 'done':
            return '#4caf50'; // Green
        default:
            return '#e0e0e0'; // Grey
    }
}

function createTaskCard(task) {
    const priorityColors = {
        low: 'green',
        medium: 'orange',
        high: 'red'
    };

    // Set progress based on status if not already set
    if (task.progress === undefined) {
        switch (task.status) {
            case 'todo':
                task.progress = 0;
                break;
            case 'doing':
                task.progress = 50;
                break;
            case 'done':
                task.progress = 100;
                break;
            default:
                task.progress = 0;
        }
    }

    const taskElement = document.createElement('div');
    taskElement.className = 'task-card';
    taskElement.draggable = true;
    taskElement.dataset.taskId = task.id;
    taskElement.dataset.status = task.status;

    const progressColor = getProgressBarColor(task.status);

    taskElement.innerHTML = `
        <div class="task-header" style="border-left: 4px solid ${priorityColors[task.priority]}">
            <h4>${task.title}</h4>
            <div class="task-actions">
                <button onclick="editTask('${task.id}')" class="edit-btn">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteTask('${task.id}')" class="delete-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <p>${task.description}</p>
        <div class="task-meta">
            <div class="status-selector">
                <select onchange="updateTaskStatus('${task.id}', this.value)" class="status-select">
                    <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>Por Fazer</option>
                    <option value="doing" ${task.status === 'doing' ? 'selected' : ''}>Em Progresso</option>
                    <option value="done" ${task.status === 'done' ? 'selected' : ''}>Concluído</option>
                </select>
            </div>
            <div class="task-footer">
                <span class="task-category">${task.category}</span>
                ${task.dueDate ? `<span class="task-due-date">${task.dueDate}</span>` : ''}
                <span class="task-priority priority-${task.priority}">
                    <i class="fas fa-flag"></i> 
                    ${task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                </span>
            </div>
        </div>
        <div class="progress-container">
            <div class="progress-bar">
                <div class="progress" style="width: ${task.progress}%"></div>
            </div>
            <span class="progress-text">${task.progress}%</span>
        </div>
    `;

    return taskElement;
}

// Drag and Drop
function setupDragAndDrop() {
    const draggables = document.querySelectorAll('.task-card');
    const dropZones = document.querySelectorAll('.task-list');

    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', () => {
            draggable.classList.add('dragging');
        });

        draggable.addEventListener('dragend', () => {
            draggable.classList.remove('dragging');
        });
    });

    dropZones.forEach(zone => {
        zone.addEventListener('dragover', e => {
            e.preventDefault();
            const draggable = document.querySelector('.dragging');
            if (draggable) {
                zone.appendChild(draggable);
            }
        });

        zone.addEventListener('drop', e => {
            e.preventDefault();
            const taskId = document.querySelector('.dragging').dataset.taskId;
            const newStatus = zone.parentElement.dataset.status;
            updateTaskStatus(taskId, newStatus);
        });
    });
}

function renderTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const todoList = document.getElementById('todoList');
    const inProgressList = document.getElementById('inProgressList');
    const doneList = document.getElementById('doneList');

    // Clear all lists
    todoList.innerHTML = '';
    inProgressList.innerHTML = '';
    doneList.innerHTML = '';

    // Filter and render tasks
    tasks.forEach(task => {
        const taskElement = createTaskCard(task);
        switch(task.status) {
            case 'todo':
                todoList.appendChild(taskElement);
                break;
            case 'doing':
                inProgressList.appendChild(taskElement);
                break;
            case 'done':
                doneList.appendChild(taskElement);
                break;
        }
    });

    setupDragAndDrop();
    updateTaskCounts();
}

function updateTaskCounts() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    
    // Count tasks in each status
    const counts = {
        total: tasks.length,
        todo: tasks.filter(t => t.status === 'todo').length,
        doing: tasks.filter(t => t.status === 'doing').length,
        done: tasks.filter(t => t.status === 'done').length
    };

    // Update the count displays
    document.getElementById('totalTasks').textContent = counts.total;
    document.getElementById('todoTasks').textContent = counts.todo;
    document.getElementById('inProgressTasks').textContent = counts.doing;
    document.getElementById('doneTasks').textContent = counts.done;
}

function populateCategoryDropdowns() {
    const categories = defaultCategories;
    const dropdowns = ['taskCategory', 'editTaskCategory'];
    
    dropdowns.forEach(dropdownId => {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            dropdown.innerHTML = `
                <option value="">Selecione Categoria</option>
                ${categories.map(category => `
                    <option value="${category}">${category}</option>
                `).join('')}
            `;
        }
    });
}

// Event Listeners
addTaskBtn.addEventListener('click', openTaskModal);
closeTaskModalBtn.addEventListener('click', closeTaskModal);
closeEditTaskModalBtn.addEventListener('click', closeEditTaskModal);
closeCategoryModalBtn.addEventListener('click', closeCategoryModal);
newCategoryBtn.addEventListener('click', () => categoryModal.style.display = 'block');
taskForm.addEventListener('submit', handleTaskSubmit);
editTaskForm.addEventListener('submit', handleEditTaskSubmit);
categoryForm.addEventListener('submit', handleCategorySubmit);
settingsBtn.addEventListener('click', openSettingsModal);
closeSettingsModal.addEventListener('click', closeSettingsModalFn);

// State
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || defaultCategories;
let currentEditingTaskId = null;

// Initialize categories if empty
if (!localStorage.getItem('categories')) {
    localStorage.setItem('categories', JSON.stringify(defaultCategories));
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    categories = JSON.parse(localStorage.getItem('categories')) || defaultCategories;
    renderTasks();
    renderCategories();
    updateTaskCounts();
    populateCategoryDropdowns();
    setupDragAndDrop();
});

// Category Functions
function handleCategorySubmit(e) {
    e.preventDefault();
    
    const categoryName = document.getElementById('categoryName').value;
    if (!categories.includes(categoryName)) {
        categories.push(categoryName);
        saveCategories();
        renderCategories();
        populateCategoryDropdowns();
    }

    closeCategoryModal();
    categoryForm.reset();
}

function renderCategories() {
    categoryList.innerHTML = '';
    categories.forEach(category => {
        const li = document.createElement('li');
        const isDefaultCategory = defaultCategories.includes(category);
        li.className = `category-item ${isDefaultCategory ? 'default-category' : ''}`;
        const taskCount = tasks.filter(task => task.category === category).length;
        
        li.innerHTML = `
            <div class="category-name">
                <i class="fas fa-folder"></i>
                ${category}
            </div>
            <div class="category-actions">
                <span class="category-count">${taskCount}</span>
                ${!isDefaultCategory ? `
                    <button class="delete-category" onclick="deleteCategory('${category}')" title="Excluir categoria">
                        <i class="fas fa-xmark"></i>
                    </button>
                ` : ''}
            </div>
        `;
        
        categoryList.appendChild(li);
    });

    // Update dropdowns
    populateCategoryDropdowns();
}

function deleteCategory(categoryName) {
    if (confirm(`Tem certeza que deseja excluir a categoria "${categoryName}"?`)) {
        // Find tasks using this category
        const tasksUsingCategory = tasks.filter(task => task.category === categoryName);
        
        if (tasksUsingCategory.length > 0) {
            const moveToDefault = confirm(
                `Existem ${tasksUsingCategory.length} tarefa(s) usando esta categoria.\n` +
                'Deseja mover estas tarefas para a categoria "Design Gráfico"?'
            );
            
            if (moveToDefault) {
                // Move tasks to default category
                tasks = tasks.map(task => 
                    task.category === categoryName 
                        ? {...task, category: 'Design Gráfico'}
                        : task
                );
                saveTasks();
            } else {
                return; // Cancel deletion if user doesn't want to move tasks
            }
        }
        
        // Remove the category
        categories = categories.filter(cat => cat !== categoryName);
        saveCategories();
        renderCategories();
        populateCategoryDropdowns();
        renderTasks();
    }
}

function filterCategories() {
    const selectedCategory = categoryFilter.value;
    const taskCards = document.querySelectorAll('.task-card');

    taskCards.forEach(card => {
        const taskId = parseInt(card.dataset.taskId);
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) return;

        if (selectedCategory === 'all' || task.category === selectedCategory) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });

    // Update column headers to show filtered counts
    updateTaskCounts();
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function saveCategories() {
    localStorage.setItem('categories', JSON.stringify(categories));
}

// Backup functionality
function exportTasksToJSON() {
    try {
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const categories = JSON.parse(localStorage.getItem('categories') || '[]');
        
        const backup = {
            tasks: tasks,
            categories: categories,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(backup, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `thinkboard-kanban-backup-${new Date().toISOString().slice(0,10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'toast-message success';
        successMessage.textContent = 'Backup created successfully!';
        document.body.appendChild(successMessage);
        
        setTimeout(() => {
            successMessage.remove();
        }, 3000);
    } catch (error) {
        console.error('Error creating backup:', error);
        const errorMessage = document.createElement('div');
        errorMessage.className = 'toast-message error';
        errorMessage.textContent = 'Error creating backup. Please try again.';
        document.body.appendChild(errorMessage);
        
        setTimeout(() => {
            errorMessage.remove();
        }, 3000);
    }
}

function importTasksFromJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backup = JSON.parse(e.target.result);
            
            // Validate backup format
            if (!backup.tasks || !backup.exportDate || !backup.version) {
                throw new Error('Invalid backup file format');
            }
            
            // Store the imported data
            localStorage.setItem('tasks', JSON.stringify(backup.tasks));
            if (backup.categories && backup.categories.length > 0) {
                localStorage.setItem('categories', JSON.stringify(backup.categories));
            }
            
            // Refresh the UI
            renderTasks();
            updateTaskCounts();
            renderCategories();
            
            // Show success message
            const successMessage = document.createElement('div');
            successMessage.className = 'toast-message success';
            successMessage.textContent = 'Backup restored successfully!';
            document.body.appendChild(successMessage);
            
            setTimeout(() => {
                successMessage.remove();
            }, 3000);
            
            // Reset file input
            event.target.value = '';
            
        } catch (error) {
            console.error('Error restoring backup:', error);
            const errorMessage = document.createElement('div');
            errorMessage.className = 'toast-message error';
            errorMessage.textContent = 'Error restoring backup. Please check your file.';
            document.body.appendChild(errorMessage);
            
            setTimeout(() => {
                errorMessage.remove();
            }, 3000);
            
            // Reset file input
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}

// Event Listeners for View Toggle
kanbanViewBtn.addEventListener('click', () => {
    kanbanView.classList.add('active');
    calendarView.classList.remove('active');
    kanbanViewBtn.classList.add('active');
    calendarViewBtn.classList.remove('active');
});

calendarViewBtn.addEventListener('click', () => {
    calendarView.classList.add('active');
    kanbanView.classList.remove('active');
    calendarViewBtn.classList.add('active');
    kanbanViewBtn.classList.remove('active');
    if (!calendar) {
        initializeCalendar();
    }
});

window.addEventListener('click', (e) => {
    if (e.target === taskModal) closeTaskModal();
    if (e.target === editTaskModal) closeEditTaskModal();
    if (e.target === categoryModal) closeCategoryModal();
    if (e.target === settingsModal) closeSettingsModalFn();
});

function updateTasksDisplay() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const todoList = document.getElementById('todoList');
    const inProgressList = document.getElementById('inProgressList');
    const doneList = document.getElementById('doneList');

    // Clear all lists
    todoList.innerHTML = '';
    inProgressList.innerHTML = '';
    doneList.innerHTML = '';

    // Filter and render tasks
    tasks.forEach(task => {
        const taskElement = createTaskCard(task);
        switch(task.status) {
            case 'todo':
                todoList.appendChild(taskElement);
                break;
            case 'doing':
                inProgressList.appendChild(taskElement);
                break;
            case 'done':
                doneList.appendChild(taskElement);
                break;
        }
    });

    setupDragAndDrop();
}

document.addEventListener('DOMContentLoaded', () => {
    const actionBar = document.querySelector('.action-bar');
    if (actionBar) {
        actionBar.insertAdjacentHTML('beforeend', `
            <button onclick="exportTasksToJSON()" class="action-button backup-btn">
                <i class="fas fa-download"></i> Backup Tasks
            </button>
            <label class="action-button restore-btn">
                <i class="fas fa-upload"></i> Restore Backup
                <input type="file" accept=".json" onchange="importTasksFromJSON(event)" style="display: none;">
            </label>
        `);
    }
    initializeCategories();
    renderTasks();
    setupDragAndDrop();
    updateTaskCounts();
    populateCategoryDropdowns();
});

// Calendar
function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
        },
        events: getCalendarEvents(),
        eventClick: function(info) {
            const taskId = parseInt(info.event.id);
            editTask(taskId);
        },
        eventDidMount: function(info) {
            const task = tasks.find(t => t.id === parseInt(info.event.id));
            if (!task) return;

            if (task.priority) {
                info.el.classList.add('priority');
            }
            
            const now = new Date();
            const dueDate = new Date(task.dueDate);
            
            if (task.status === 'done') {
                info.el.classList.add('completed');
            } else if (dueDate < now) {
                info.el.classList.add('overdue');
            }
        }
    });
    
    calendar.render();
}

function getCalendarEvents() {
    return tasks.map(task => ({
        id: task.id.toString(),
        title: task.title,
        start: task.dueDate,
        backgroundColor: getEventColor(task),
        borderColor: getEventColor(task),
        extendedProps: {
            category: task.category,
            status: task.status,
            priority: task.priority
        }
    }));
}

function getEventColor(task) {
    if (task.status === 'done') {
        return '#34C759';
    }
    
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    
    if (dueDate < now && task.status !== 'done') {
        return '#FF3B30';
    }
    
    switch(task.status) {
        case 'todo':
            return task.priority ? '#FF9500' : '#8E8E93';
        case 'inProgress':
            return '#007AFF';
        default:
            return '#8E8E93';
    }
}
