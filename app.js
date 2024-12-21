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

// Buttons
const addTaskBtn = document.getElementById('addTaskBtn');
const newCategoryBtn = document.getElementById('newCategoryBtn');
const closeTaskModalBtn = document.getElementById('closeTaskModal');
const closeEditTaskModalBtn = document.getElementById('closeEditTaskModal');
const closeCategoryModalBtn = document.getElementById('closeCategoryModal');

// Default categories (Native categories)
const defaultCategories = [
    'Design Gráfico',
    'Design Editorial',
    'UI/UX Design',
    'Webdesign',
    'Ilustração',
    'Fotografia',
    'Motion Design'
];

// Working categories array
let categories = [...defaultCategories];

// Load saved categories
const savedCategories = JSON.parse(localStorage.getItem('categories') || '[]');
if (savedCategories.length > 0) {
    categories = savedCategories;
}

// Initialize categories
function initializeCategories() {
    const categoryList = document.getElementById('categoryList');
    if (!categoryList) return;
    
    categoryList.innerHTML = categories.map(category => {
        const isNativeCategory = defaultCategories.includes(category);
        return `
            <li class="category-item ${isNativeCategory ? 'native-category' : ''}" onclick="filterByCategory('${category}')">
                <span class="category-icon">
                    <i class="fas fa-folder"></i>
                </span>
                <span class="category-name">${category}</span>
                ${!isNativeCategory ? `
                    <button class="delete-category" onclick="deleteCategory('${category}', event)" title="Excluir categoria">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                ` : ''}
            </li>
        `;
    }).join('');
    
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
    console.log('Filtering by category:', category);

    // Get all tasks
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    
    // Filter tasks by category
    const filteredTasks = category === 'all' ? tasks : tasks.filter(task => {
        console.log('Task category:', task.category, 'Selected category:', category);
        return task.category === category;
    });
    
    console.log('Filtered tasks:', filteredTasks);

    // Get task list containers
    const todoList = document.getElementById('todoList');
    const inProgressList = document.getElementById('inProgressList');
    const doneList = document.getElementById('doneList');

    if (!todoList || !inProgressList || !doneList) {
        console.error('Task list containers not found');
        return;
    }

    // Clear existing tasks
    todoList.innerHTML = '';
    inProgressList.innerHTML = '';
    doneList.innerHTML = '';

    // Create and append task cards
    filteredTasks.forEach(task => {
        const taskCard = createTaskCard(task);
        
        // Add drag event listeners
        taskCard.addEventListener('dragstart', () => {
            taskCard.classList.add('dragging');
        });
        
        taskCard.addEventListener('dragend', () => {
            taskCard.classList.remove('dragging');
        });

        // Add to appropriate list
        switch(task.status) {
            case 'todo':
                todoList.appendChild(taskCard);
                break;
            case 'doing':
                inProgressList.appendChild(taskCard);
                break;
            case 'done':
                doneList.appendChild(taskCard);
                break;
        }
    });

    // Update task counts for filtered view
    updateFilteredTaskCounts(filteredTasks);

    // Update category filter dropdown
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.value = category;
    }
}

function updateFilteredTaskCounts(filteredTasks) {
    const elements = {
        total: document.getElementById('totalTasks'),
        todo: document.getElementById('todoTasks'),
        inProgress: document.getElementById('inProgressTasks'),
        done: document.getElementById('doneTasks')
    };

    if (!elements.total || !elements.todo || !elements.inProgress || !elements.done) {
        console.warn('Task count elements not found');
        return;
    }

    const counts = {
        total: filteredTasks.length,
        todo: filteredTasks.filter(task => task.status === 'todo').length,
        inProgress: filteredTasks.filter(task => task.status === 'doing').length,
        done: filteredTasks.filter(task => task.status === 'done').length
    };

    try {
        elements.total.textContent = counts.total;
        elements.todo.textContent = counts.todo;
        elements.inProgress.textContent = counts.inProgress;
        elements.done.textContent = counts.done;
    } catch (error) {
        console.error('Error updating filtered task counts:', error);
    }
}

function populateCategoryDropdowns() {
    const categories = JSON.parse(localStorage.getItem('categories') || '[]');
    
    // Combine default and custom categories
    const allCategories = [...new Set([...defaultCategories, ...categories])];
    
    // Get all category dropdowns
    const dropdowns = [
        document.getElementById('categoryFilter'),
        document.getElementById('taskCategory'),
        document.getElementById('editTaskCategory')
    ];
    
    dropdowns.forEach(dropdown => {
        if (!dropdown) return;
        
        // Clear existing options except "All Categories" for filter
        const isFilter = dropdown.id === 'categoryFilter';
        dropdown.innerHTML = isFilter ? '<option value="all">Todas as Categorias</option>' : '';
        
        // Add category options
        allCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            dropdown.appendChild(option);
        });
    });
}

// Event listener for category filter
document.addEventListener('DOMContentLoaded', () => {
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            const selectedCategory = e.target.value;
            console.log('Category selected:', selectedCategory);
            filterByCategory(selectedCategory);
        });
    }
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
        id: Date.now().toString(), // Keep ID as string
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

function editTask(taskId, event) {
    if (event) {
        event.stopPropagation();
    }

    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const task = tasks.find(t => t.id === taskId.toString()); // Convert to string for comparison
    
    if (!task) return;

    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskDescription').value = task.description;
    document.getElementById('editTaskCategory').value = task.category;
    document.getElementById('editTaskDueDate').value = task.dueDate || '';
    document.getElementById('editTaskPriority').value = task.priority;

    editTaskModal.style.display = 'block';
}

function handleEditTaskSubmit(e) {
    e.preventDefault();
    
    const taskId = document.getElementById('editTaskId').value;
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const taskIndex = tasks.findIndex(task => task.id === taskId); // Compare strings
    
    if (taskIndex === -1) return;
    
    tasks[taskIndex] = {
        ...tasks[taskIndex],
        title: document.getElementById('editTaskTitle').value,
        description: document.getElementById('editTaskDescription').value,
        category: document.getElementById('editTaskCategory').value,
        dueDate: document.getElementById('editTaskDueDate').value || null,
        priority: document.getElementById('editTaskPriority').value,
    };
    
    localStorage.setItem('tasks', JSON.stringify(tasks));
    closeEditTaskModal();
    renderTasks();
}

function deleteTask(taskId, event) {
    if (event) {
        event.stopPropagation();
    }
    
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) {
        return;
    }

    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const updatedTasks = tasks.filter(task => task.id !== taskId.toString()); // Convert to string
    
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    renderTasks();
    updateTaskCounts();
}

function updateTaskStatus(taskId, newStatus) {
    if (!taskId || !newStatus) {
        console.warn('Invalid taskId or newStatus:', { taskId, newStatus });
        return;
    }

    // Convert taskId to string for comparison
    const taskIdStr = taskId.toString();
    
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const taskIndex = tasks.findIndex(task => task.id === taskIdStr);
    
    if (taskIndex === -1) {
        console.warn('Task not found:', taskIdStr);
        return;
    }

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
        default:
            console.warn('Unknown status:', newStatus);
            return;
    }
    
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks();
    updateTaskCounts();
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
                <button onclick="editTask('${task.id}', event)" class="edit-btn">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteTask('${task.id}', event)" class="delete-btn">
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
            const draggingElement = document.querySelector('.dragging');
            if (!draggingElement) return;
            
            const taskId = draggingElement.dataset.taskId; // Keep as string
            const columnElement = zone.closest('.board-column');
            if (!columnElement) return;
            
            const newStatus = columnElement.dataset.status;
            if (!newStatus) return;
            
            updateTaskStatus(taskId, newStatus);
        });
    });
}

function renderTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const todoList = document.getElementById('todoList');
    const inProgressList = document.getElementById('inProgressList');
    const doneList = document.getElementById('doneList');

    // Check if elements exist
    if (!todoList || !inProgressList || !doneList) {
        console.warn('Task list elements not found. Make sure the page is fully loaded.');
        return;
    }

    // Clear all lists
    todoList.innerHTML = '';
    inProgressList.innerHTML = '';
    doneList.innerHTML = '';

    // Filter and render tasks
    tasks.forEach(task => {
        const taskElement = createTaskCard(task);
        
        // Add to appropriate list
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

function updateTasksDisplay() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const todoList = document.getElementById('todoList');
    const inProgressList = document.getElementById('inProgressList');
    const doneList = document.getElementById('doneList');

    if (!todoList || !inProgressList || !doneList) {
        console.warn('Task list elements not found');
        return;
    }

    // Clear all lists
    todoList.innerHTML = '';
    inProgressList.innerHTML = '';
    doneList.innerHTML = '';

    // Filter and render tasks
    tasks.forEach(task => {
        const taskElement = createTaskCard(task);
        
        // Add to appropriate list
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

function updateTaskCounts() {
    // Get all task count elements by ID
    const elements = {
        total: document.getElementById('totalTasks'),
        todo: document.getElementById('todoTasks'),
        inProgress: document.getElementById('inProgressTasks'),
        done: document.getElementById('doneTasks')
    };

    // Check if all elements exist
    if (!elements.total || !elements.todo || !elements.inProgress || !elements.done) {
        console.warn('Task count elements not found:', {
            total: !!elements.total,
            todo: !!elements.todo,
            inProgress: !!elements.inProgress,
            done: !!elements.done
        });
        return;
    }

    // Get tasks and calculate counts
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const counts = {
        total: tasks.length,
        todo: tasks.filter(task => task.status === 'todo').length,
        inProgress: tasks.filter(task => task.status === 'doing').length,
        done: tasks.filter(task => task.status === 'done').length
    };

    // Update displays safely
    try {
        Object.keys(elements).forEach(key => {
            if (elements[key]) {
                elements[key].textContent = counts[key];
            }
        });
    } catch (error) {
        console.error('Error updating task counts:', error);
    }
}

// Event Listeners
// Moved inside DOMContentLoaded

window.addEventListener('click', (e) => {
    if (e.target === taskModal) closeTaskModal();
    if (e.target === editTaskModal) closeEditTaskModal();
    if (e.target === categoryModal) closeCategoryModal();
    if (e.target === settingsModal) closeSettingsModalFn();
});

function deleteCategory(categoryName, event) {
    // Prevent the click from triggering filterByCategory
    if (event) {
        event.stopPropagation();
    }

    if (defaultCategories.includes(categoryName)) {
        alert('Não é possível excluir categorias nativas do sistema.');
        return;
    }

    const confirmDelete = confirm(`Tem certeza que deseja excluir a categoria "${categoryName}"?`);
    if (confirmDelete) {
        // Check for tasks using this category
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const tasksUsingCategory = tasks.filter(task => task.category === categoryName);
        
        if (tasksUsingCategory.length > 0) {
            const moveToDefault = confirm(
                `Existem ${tasksUsingCategory.length} tarefa(s) usando esta categoria.\n` +
                'Deseja mover estas tarefas para a categoria "Design Gráfico"?'
            );
            
            if (moveToDefault) {
                // Move tasks to default category
                const updatedTasks = tasks.map(task => 
                    task.category === categoryName 
                        ? {...task, category: 'Design Gráfico'}
                        : task
                );
                localStorage.setItem('tasks', JSON.stringify(updatedTasks));
                renderTasks();
            }
        }
        
        // Remove the category
        categories = categories.filter(cat => cat !== categoryName);
        localStorage.setItem('categories', JSON.stringify(categories));
        
        // Update UI
        initializeCategories();
        populateCategoryDropdowns();
        filterByCategory('all'); // Reset to show all tasks
    }
}

function handleCategorySubmit(e) {
    e.preventDefault();
    
    const categoryName = document.getElementById('categoryName').value.trim();
    if (!categoryName) return;

    if (!categories.includes(categoryName)) {
        categories.push(categoryName);
        localStorage.setItem('categories', JSON.stringify(categories));
        initializeCategories();
        populateCategoryDropdowns();
    }

    closeCategoryModal();
    document.getElementById('categoryName').value = '';
}

// Backup functionality
function exportTasksToJSON() {
    try {
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const dataStr = JSON.stringify(tasks, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportName = 'thinkboard_backup_' + new Date().toISOString().slice(0, 10) + '.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportName);
        linkElement.click();
        
        console.log('Backup exported successfully:', {
            tasksCount: tasks.length,
            filename: exportName
        });
    } catch (error) {
        console.error('Error exporting tasks:', error);
        alert('Erro ao exportar as tarefas');
    }
}

function importTasksFromJSON(event) {
    try {
        const file = event.target.files[0];
        if (!file) {
            console.error('No file selected');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                // Validate backup data
                if (!Array.isArray(data)) {
                    throw new Error('Invalid backup format: data is not an array');
                }

                // Validate each task
                data.forEach((task, index) => {
                    if (!task.id || !task.title || !task.status) {
                        throw new Error(`Invalid task at index ${index}: missing required fields`);
                    }
                });

                // Store tasks
                localStorage.setItem('tasks', JSON.stringify(data));
                
                // Extract categories from tasks
                const taskCategories = [...new Set(data.map(task => task.category).filter(Boolean))];
                
                // Get existing categories
                const existingCategories = JSON.parse(localStorage.getItem('categories') || '[]');
                
                // Merge categories
                const allCategories = [...new Set([...existingCategories, ...taskCategories])];
                localStorage.setItem('categories', JSON.stringify(allCategories));

                // Update UI
                renderTasks();
                updateTaskCounts();
                populateCategoryDropdowns();

                console.log('Backup restored successfully:', {
                    tasksCount: data.length,
                    categories: allCategories
                });
            } catch (error) {
                console.error('Error parsing backup file:', error);
                alert('Erro ao restaurar o backup: ' + error.message);
            }
        };

        reader.onerror = function() {
            console.error('Error reading file');
            alert('Erro ao ler o arquivo de backup');
        };

        reader.readAsText(file);
    } catch (error) {
        console.error('Error in importTasksFromJSON:', error);
        alert('Erro ao processar o arquivo de backup');
    }
}

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get all required elements
    const addTaskBtn = document.getElementById('addTaskBtn');
    const newCategoryBtn = document.getElementById('newCategoryBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const closeTaskModalBtn = document.getElementById('closeTaskModal');
    const closeEditTaskModalBtn = document.getElementById('closeEditTaskModal');
    const closeCategoryModalBtn = document.getElementById('closeCategoryModal');
    const closeSettingsModalBtn = document.getElementById('closeSettingsModal');
    const taskForm = document.getElementById('taskForm');
    const editTaskForm = document.getElementById('editTaskForm');
    const categoryForm = document.getElementById('categoryForm');
    const taskModal = document.getElementById('taskModal');
    const categoryModal = document.getElementById('categoryModal');
    const settingsModal = document.getElementById('settingsModal');

    // Initialize components
    initializeCategories();
    renderTasks();
    setupDragAndDrop();
    updateTaskCounts();
    populateCategoryDropdowns();

    // Button click handlers
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => {
            if (taskModal) taskModal.style.display = 'block';
        });
    }

    if (newCategoryBtn) {
        newCategoryBtn.addEventListener('click', () => {
            if (categoryModal) categoryModal.style.display = 'block';
        });
    }

    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            if (settingsModal) settingsModal.style.display = 'block';
        });
    }

    // Close modal handlers
    if (closeTaskModalBtn) {
        closeTaskModalBtn.addEventListener('click', () => {
            if (taskModal) taskModal.style.display = 'none';
        });
    }

    if (closeEditTaskModalBtn) {
        closeEditTaskModalBtn.addEventListener('click', () => {
            const editTaskModal = document.getElementById('editTaskModal');
            if (editTaskModal) editTaskModal.style.display = 'none';
        });
    }

    if (closeCategoryModalBtn) {
        closeCategoryModalBtn.addEventListener('click', () => {
            if (categoryModal) categoryModal.style.display = 'none';
        });
    }

    if (closeSettingsModalBtn) {
        closeSettingsModalBtn.addEventListener('click', () => {
            if (settingsModal) settingsModal.style.display = 'none';
        });
    }

    // Form submit handlers
    if (taskForm) {
        taskForm.addEventListener('submit', handleTaskSubmit);
    }

    if (editTaskForm) {
        editTaskForm.addEventListener('submit', handleEditTaskSubmit);
    }

    if (categoryForm) {
        categoryForm.addEventListener('submit', handleCategorySubmit);
    }

    // Category filter handler
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            const selectedCategory = e.target.value;
            console.log('Category selected:', selectedCategory);
            filterByCategory(selectedCategory);
        });
    }

    // Set up action bar
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

    // Log initialization status
    console.log('App initialized with elements:', {
        addTaskBtn: !!addTaskBtn,
        newCategoryBtn: !!newCategoryBtn,
        settingsBtn: !!settingsBtn,
        taskForm: !!taskForm,
        categoryForm: !!categoryForm,
        categoryFilter: !!categoryFilter
    });
});

function updateTaskStatus(taskId, newStatus) {
    if (!taskId || !newStatus) {
        console.warn('Invalid taskId or newStatus:', { taskId, newStatus });
        return;
    }

    // Convert taskId to string for comparison
    const taskIdStr = taskId.toString();
    
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const taskIndex = tasks.findIndex(task => task.id === taskIdStr);
    
    if (taskIndex === -1) {
        console.warn('Task not found:', taskIdStr);
        return;
    }

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
        default:
            console.warn('Unknown status:', newStatus);
            return;
    }
    
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks();
    updateTaskCounts();
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        updateTaskCounts();
    } catch (error) {
        console.error('Error initializing task counts:', error);
    }
});

function handleTaskChange() {
    try {
        updateTaskCounts();
    } catch (error) {
        console.error('Error updating task counts after change:', error);
    }
}

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
