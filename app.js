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
        <li class="category-item">
            <span class="category-icon">
                <i class="fas fa-folder"></i>
            </span>
            ${category}
        </li>
    `).join('');
}

// Add event listener for categories
document.addEventListener('DOMContentLoaded', () => {
    initializeCategories();
    renderTasks();
    updateTaskCounts();
    setupDragAndDrop();
    
    // Add click event for category filtering
    document.getElementById('categoryList').addEventListener('click', (e) => {
        const categoryItem = e.target.closest('.category-item');
        if (categoryItem) {
            document.querySelectorAll('.category-item').forEach(item => {
                item.classList.remove('active');
            });
            categoryItem.classList.add('active');
            // Add your filtering logic here
        }
    });

    // Add task button event listener
    const addTaskBtn = document.getElementById('addTaskBtn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => {
            const taskModal = document.getElementById('taskModal');
            if (taskModal) {
                taskModal.style.display = 'block';
            }
        });
    }

    // Task form submission
    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', handleTaskSubmit);
    }

    // Close modal button
    const closeTaskModalBtn = document.getElementById('closeTaskModal');
    if (closeTaskModalBtn) {
        closeTaskModalBtn.addEventListener('click', () => {
            const taskModal = document.getElementById('taskModal');
            if (taskModal) {
                taskModal.style.display = 'none';
            }
        });
    }
});

// State
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || defaultCategories;
let currentEditingTaskId = null;

// Calendar
let calendar;

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

newCategoryBtn.addEventListener('click', () => categoryModal.style.display = 'block');

closeEditTaskModalBtn.addEventListener('click', () => {
    editTaskModal.style.display = 'none';
    editTaskForm.reset();
    currentEditingTaskId = null;
});
closeCategoryModalBtn.addEventListener('click', () => categoryModal.style.display = 'none');

editTaskForm.addEventListener('submit', handleEditTaskSubmit);
categoryForm.addEventListener('submit', handleCategorySubmit);
categoryFilter.addEventListener('change', filterCategories);

window.addEventListener('click', (e) => {
    if (e.target === taskModal) closeTaskModal();
    if (e.target === editTaskModal) closeEditTaskModal();
    if (e.target === categoryModal) closeCategoryModal();
});

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

// Modal handling functions
function openTaskModal() {
    const taskModal = document.getElementById('taskModal');
    if (taskModal) {
        taskModal.style.display = 'block';
    }
}

function closeTaskModal() {
    const taskModal = document.getElementById('taskModal');
    if (taskModal) {
        taskModal.style.display = 'none';
    }
}

// Task Functions
async function handleTaskSubmit(event) {
    event.preventDefault();
    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    
    try {
        const title = document.getElementById('taskTitle').value;
        const description = document.getElementById('taskDescription').value;
        const category = document.getElementById('taskCategory').value;
        const priority = document.getElementById('taskPriority').checked;
        const dueDate = document.getElementById('taskDueDate').value;
        const imageInput = document.getElementById('taskImage');

        let imageUrl = null;
        if (imageInput.files && imageInput.files[0]) {
            console.log('Image selected, attempting upload...');
            try {
                imageUrl = await uploadImage(imageInput.files[0]);
                console.log('Image uploaded successfully:', imageUrl);
            } catch (error) {
                console.error('Image upload error:', error);
                alert('Failed to upload image: ' + error.message);
                submitButton.disabled = false;
                return;
            }
        }

        const task = {
            id: Date.now(),
            title,
            description,
            category,
            priority,
            status: 'todo',
            dueDate,
            imageUrl
        };

        console.log('Creating task:', task);
        tasks.push(task);
        saveTasks();
        renderTasks();
        
        // Close modal and reset form
        taskModal.style.display = 'none';
        event.target.reset();
        
        // Reset image preview
        const imagePreview = document.getElementById('imagePreview');
        if (imagePreview) {
            imagePreview.innerHTML = '';
            imagePreview.classList.remove('has-image');
        }

        // Update UI elements
        if (typeof updateTaskCounts === 'function') {
            updateTaskCounts();
        }
        
        if (typeof calendar !== 'undefined' && calendar) {
            calendar.removeAllEvents();
            calendar.addEventSource(getCalendarEvents());
        }
    } catch (error) {
        console.error('Task creation failed:', error);
        alert('Failed to create task: ' + error.message);
    } finally {
        submitButton.disabled = false;
    }
}

async function handleEditTaskSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('editTaskTitle').value;
    const description = document.getElementById('editTaskDescription').value;
    const category = document.getElementById('editTaskCategory').value;
    const priority = document.getElementById('editTaskPriority').checked;
    const dueDate = document.getElementById('editTaskDueDate').value;
    const imageInput = document.getElementById('editTaskImage');

    const taskIndex = tasks.findIndex(task => task.id === currentEditingTaskId);
    if (taskIndex === -1) return;

    const updatedTask = {
        ...tasks[taskIndex],
        title,
        description,
        category,
        priority,
        dueDate
    };

    const updateTask = async (imageUrl = null) => {
        if (imageUrl) {
            updatedTask.imageUrl = imageUrl;
        }
        tasks[taskIndex] = updatedTask;
        saveTasks();
        renderTasks();
        if (calendar) {
            calendar.removeAllEvents();
            calendar.addEventSource(getCalendarEvents());
        }
        editTaskModal.style.display = 'none';
        editTaskForm.reset();
        currentEditingTaskId = null;
    };

    if (imageInput.files && imageInput.files[0]) {
        try {
            const imageUrl = await uploadImage(imageInput.files[0]);
            updateTask(imageUrl);
        } catch (error) {
            console.error('Error uploading image:', error);
            updateTask();
        }
    } else {
        // Keep the existing image if no new image is selected
        updateTask();
    }
}

async function uploadImage(file) {
    try {
        const formData = new FormData();
        formData.append('image', file);

        console.log('Starting upload...');
        
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Upload successful:', data);
        return data.imageUrl;
    } catch (error) {
        console.error('Upload failed:', error);
        throw new Error(`Upload failed: ${error.message}`);
    }
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    currentEditingTaskId = taskId;
    
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskDescription').value = task.description;
    document.getElementById('editTaskCategory').value = task.category;
    document.getElementById('editTaskPriority').checked = task.priority;
    document.getElementById('editTaskDueDate').value = task.dueDate;

    const imagePreview = document.getElementById('editImagePreview');
    if (task.imageUrl) {
        imagePreview.innerHTML = `<img src="${task.imageUrl}" alt="Task image">`;
        imagePreview.classList.add('has-image');
    } else {
        imagePreview.innerHTML = '';
        imagePreview.classList.remove('has-image');
    }

    editTaskModal.style.display = 'block';
}

function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasks();
    renderTasks();
    updateTaskCounts();
    if (calendar) {
        calendar.removeAllEvents();
        calendar.addEventSource(getCalendarEvents());
    }
}

function updateTaskStatus(taskId, newStatus) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        const oldStatus = task.status;
        task.status = newStatus;

        // Remove from old column
        const taskCard = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
        if (taskCard) {
            taskCard.remove();
        }

        // Add to new column
        const targetColumn = document.getElementById(`${newStatus}List`);
        if (targetColumn) {
            const newCard = createTaskCard(task);
            targetColumn.appendChild(newCard);
            
            // Update progress bar color based on new status
            const progressBar = newCard.querySelector('.progress-bar');
            if (progressBar) {
                updateProgressBarColor(progressBar, newStatus);
            }
        }

        saveTasks();
        updateTaskCounts();
    }
}

function moveTask(taskId, newStatus) {
    updateTaskStatus(taskId, newStatus);
    renderTasks(); // Re-render to ensure proper column placement
}

function handleDrop(e, status) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    updateTaskStatus(taskId, status);
    renderTasks();
}

function getProgressByStatus(status) {
    switch(status) {
        case 'todo': return 0;
        case 'inProgress': return 50;
        case 'done': return 100;
        default: return 0;
    }
}

function updateTaskProgress(taskId, progress) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.progress = progress;
        
        // Determine new status based on progress
        let newStatus;
        if (progress === 0) {
            newStatus = 'todo';
        } else if (progress === 100) {
            newStatus = 'done';
        } else {
            newStatus = 'inProgress';
        }
        
        // Always update status to ensure column movement
        if (task.status !== newStatus) {
            task.status = newStatus;
            updateTaskStatus(taskId, newStatus);
        } else {
            // Just update the progress bar if status hasn't changed
            const taskCard = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
            if (taskCard) {
                const progressBar = taskCard.querySelector('.progress-bar');
                const progressPercentage = taskCard.querySelector('.progress-percentage');
                if (progressBar && progressPercentage) {
                    progressBar.style.width = `${progress}%`;
                    progressPercentage.textContent = `${progress}%`;
                    updateProgressBarColor(progressBar, newStatus);
                }
            }
        }
        
        saveTasks();
        updateTaskCounts();
    }
}

function updateProgressBarColor(progressBar, status) {
    // Remove all existing color classes
    progressBar.classList.remove('todo-progress', 'inProgress-progress', 'done-progress');
    
    // Add the appropriate color class
    switch (status) {
        case 'todo':
            progressBar.classList.add('todo-progress');
            break;
        case 'inProgress':
            progressBar.classList.add('inProgress-progress');
            break;
        case 'done':
            progressBar.classList.add('done-progress');
            break;
    }
}

function renderTasks() {
    const todoList = document.getElementById('todoList');
    const inProgressList = document.getElementById('inProgressList');
    const doneList = document.getElementById('doneList');

    todoList.innerHTML = '';
    inProgressList.innerHTML = '';
    doneList.innerHTML = '';

    const currentFilter = categoryFilter.value;
    const filteredTasks = currentFilter === 'all' 
        ? tasks 
        : tasks.filter(task => task.category === currentFilter);

    filteredTasks.forEach(task => {
        const taskElement = createTaskCard(task);
        
        switch(task.status) {
            case 'todo':
                todoList.appendChild(taskElement);
                break;
            case 'inProgress':
                inProgressList.appendChild(taskElement);
                break;
            case 'done':
                doneList.appendChild(taskElement);
                break;
        }
    });

    updateTaskCounts();
    setupDragAndDrop();
}

function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.draggable = true;
    card.dataset.taskId = task.id;
    card.dataset.status = task.status;

    // Calculate progress based on status
    const progress = getProgressByStatus(task.status);

    // Image container
    if (task.imageUrl) {
        const imageContainer = document.createElement('div');
        imageContainer.className = 'task-image-container';
        
        const img = document.createElement('img');
        img.src = task.imageUrl;
        img.className = 'task-image';
        img.alt = task.title;
        
        const overlay = document.createElement('div');
        overlay.className = 'image-overlay';
        
        imageContainer.appendChild(img);
        imageContainer.appendChild(overlay);
        card.appendChild(imageContainer);
    }

    // Task header
    const header = document.createElement('div');
    header.className = 'task-header';
    
    const title = document.createElement('h3');
    title.className = 'task-title';
    title.textContent = task.title;
    
    const category = document.createElement('span');
    category.className = 'task-category';
    category.textContent = task.category;
    
    header.appendChild(title);
    card.appendChild(header);
    card.appendChild(category);

    // Task description
    if (task.description) {
        const description = document.createElement('p');
        description.className = 'task-description';
        description.textContent = task.description;
        card.appendChild(description);
    }

    // Progress section with click functionality
    const progressSection = document.createElement('div');
    progressSection.className = 'task-progress-section';
    
    const progressHeader = document.createElement('div');
    progressHeader.className = 'progress-header';
    
    const progressLabel = document.createElement('span');
    progressLabel.className = 'progress-label';
    progressLabel.textContent = 'Progress';
    
    const progressPercentage = document.createElement('span');
    progressPercentage.className = 'progress-percentage';
    progressPercentage.textContent = `${progress}%`;
    
    const progressBarContainer = document.createElement('div');
    progressBarContainer.className = 'progress-bar-container';
    
    // Make progress bar clickable
    progressBarContainer.addEventListener('click', (e) => {
        const rect = progressBarContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.round((x / rect.width) * 100);
        const clampedPercentage = Math.max(0, Math.min(100, percentage));
        updateTaskProgress(task.id, clampedPercentage);
    });
    
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.style.width = `${progress}%`;
    
    progressHeader.appendChild(progressLabel);
    progressHeader.appendChild(progressPercentage);
    progressBarContainer.appendChild(progressBar);
    progressSection.appendChild(progressHeader);
    progressSection.appendChild(progressBarContainer);
    
    card.appendChild(progressSection);

    // Status selector
    const statusContainer = document.createElement('div');
    statusContainer.className = 'status-selector';
    
    const statusSelect = document.createElement('select');
    statusSelect.className = 'status-select';
    
    const options = [
        { value: 'todo', text: 'Por Fazer' },
        { value: 'inProgress', text: 'Em Progresso' },
        { value: 'done', text: 'Concluído' }
    ];
    
    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;
        if (task.status === option.value) {
            opt.selected = true;
        }
        statusSelect.appendChild(opt);
    });
    
    statusSelect.addEventListener('change', (e) => {
        const newStatus = e.target.value;
        updateTaskStatus(task.id, newStatus);
    });
    
    statusContainer.appendChild(statusSelect);
    card.appendChild(statusContainer);

    // Task footer
    const footer = document.createElement('div');
    footer.className = 'task-footer';
    
    const meta = document.createElement('div');
    meta.className = 'task-meta';
    
    const date = document.createElement('span');
    date.className = 'task-date';
    date.innerHTML = `<i class="far fa-calendar"></i> ${new Date(task.createdAt || Date.now()).toLocaleDateString()}`;
    
    meta.appendChild(date);
    
    const actions = document.createElement('div');
    actions.className = 'task-actions';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'task-action-btn';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.onclick = () => editTask(task.id);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-action-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
    deleteBtn.onclick = () => deleteTask(task.id);
    
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    
    footer.appendChild(meta);
    footer.appendChild(actions);
    card.appendChild(footer);

    // Add drag and drop event listeners
    card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', task.id);
        card.classList.add('dragging');
    });

    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
    });

    return card;
}

function startTaskEdit(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    currentEditingTaskId = taskId;
    
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskDescription').value = task.description;
    document.getElementById('editTaskCategory').value = task.category;
    document.getElementById('editTaskPriority').checked = task.priority;
    document.getElementById('editTaskDueDate').value = task.dueDate;
    
    const imagePreview = document.getElementById('editImagePreview');
    if (task.imageUrl) {
        imagePreview.innerHTML = `<img src="${task.imageUrl}" alt="Task image">`;
        imagePreview.classList.add('has-image');
    } else {
        imagePreview.innerHTML = '';
        imagePreview.classList.remove('has-image');
    }
    
    editTaskModal.style.display = 'block';
}

function saveTaskEdit(taskId) {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (!taskElement) return;
    
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;

    const title = taskElement.querySelector('.edit-title').value;
    const description = taskElement.querySelector('.edit-description').value;
    const category = taskElement.querySelector('.edit-category').value;
    const priority = taskElement.querySelector('.priority-checkbox input').checked;
    const dueDate = taskElement.querySelector('.edit-due-date').value;

    tasks[taskIndex] = {
        ...tasks[taskIndex],
        title,
        description,
        category,
        priority,
        dueDate
    };

    saveTasks();
    taskElement.dataset.isEditing = 'false';
    renderTasks();
}

function cancelTaskEdit(taskId) {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (!taskElement) return;
    
    taskElement.dataset.isEditing = 'false';
    renderTasks();
}

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

    categoryModal.style.display = 'none';
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

function updateTaskCounts() {
    const totalTasks = tasks.length;
    const todoTasks = tasks.filter(task => task.status === 'todo').length;
    const inProgressTasks = tasks.filter(task => task.status === 'inProgress').length;
    const doneTasks = tasks.filter(task => task.status === 'done').length;

    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('todoTasks').textContent = todoTasks;
    document.getElementById('inProgressTasks').textContent = inProgressTasks;
    document.getElementById('doneTasks').textContent = doneTasks;
}

function populateCategoryDropdowns() {
    // Get all dropdowns
    const dropdowns = [
        document.getElementById('taskCategory'),
        document.getElementById('editTaskCategory'),
        document.getElementById('categoryFilter')
    ];

    // Ensure all dropdowns exist
    if (!dropdowns.every(dropdown => dropdown)) {
        console.error('Some category dropdowns are missing');
        return;
    }

    // Clear and populate each dropdown
    dropdowns.forEach(dropdown => {
        dropdown.innerHTML = dropdown === document.getElementById('categoryFilter')
            ? '<option value="all">Todas as Categorias</option>'
            : '';

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            dropdown.appendChild(option);
        });
    });

    console.log('Categories populated:', categories); // Debug log
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
            zone.appendChild(draggable);
        });

        zone.addEventListener('drop', e => {
            e.preventDefault();
            const taskId = parseInt(document.querySelector('.dragging').dataset.taskId);
            const newStatus = zone.parentElement.dataset.state;
            updateTaskStatus(taskId, newStatus);
        });
    });
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

// Utility Functions
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function saveCategories() {
    localStorage.setItem('categories', JSON.stringify(categories));
}

// Image upload preview handling
function handleImagePreview(file, previewElement) {
    if (!file) {
        previewElement.innerHTML = '';
        previewElement.classList.remove('has-image');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        previewElement.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        previewElement.classList.add('has-image');
    };
    reader.readAsDataURL(file);
}

// Add drag and drop support
document.querySelectorAll('.image-upload-container').forEach(container => {
    container.addEventListener('dragover', (e) => {
        e.preventDefault();
        container.classList.add('dragover');
    });

    container.addEventListener('dragleave', () => {
        container.classList.remove('dragover');
    });

    container.addEventListener('drop', (e) => {
        e.preventDefault();
        container.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const input = container.querySelector('input[type="file"]');
            const preview = container.querySelector('.image-preview-container');
            input.files = e.dataTransfer.files;
            handleImagePreview(file, preview);
        }
    });
});

// File input change handler
document.querySelectorAll('input[type="file"]').forEach(input => {
    input.addEventListener('change', (e) => {
        const preview = e.target.parentElement.querySelector('.image-preview-container');
        handleImagePreview(e.target.files[0], preview);
    });
});
