// Task Management App - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskForm = document.getElementById('taskForm');
    const taskList = document.getElementById('taskList');
    const taskTitle = document.getElementById('taskTitle');
    const taskDescription = document.getElementById('taskDescription');
    const taskDueDate = document.getElementById('taskDueDate');
    const taskPriority = document.getElementById('taskPriority');
    const taskCategory = document.getElementById('taskCategory');
    const searchInput = document.getElementById('searchInput');
    const totalTasksElement = document.getElementById('totalTasks');
    const completedTasksElement = document.getElementById('completedTasks');
    const pendingTasksElement = document.getElementById('pendingTasks');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const themeToggle = document.getElementById('themeToggle');

    // Edit Task Modal Elements
    const editTaskId = document.getElementById('editTaskId');
    const editTaskTitle = document.getElementById('editTaskTitle');
    const editTaskDescription = document.getElementById('editTaskDescription');
    const editTaskDueDate = document.getElementById('editTaskDueDate');
    const editTaskPriority = document.getElementById('editTaskPriority');
    const editTaskCategory = document.getElementById('editTaskCategory');
    const saveEditBtn = document.getElementById('saveEditBtn');

    // Confirmation Modal Elements
    const confirmationModalElement = document.getElementById('confirmationModal');
    const confirmationModalTitle = document.getElementById('confirmationModalTitle');
    const confirmationModalText = document.getElementById('confirmationModalText');
    const confirmActionBtn = document.getElementById('confirmActionBtn');

    // Bootstrap Modals
    const taskDetailsModalElement = document.getElementById('taskDetailsModal');
    const editTaskModalElement = document.getElementById('editTaskModal');
    
    // Initialize Bootstrap modals
    let taskDetailsModal, editTaskModal, confirmationModal;
    
    if (window.bootstrap) {
        taskDetailsModal = new bootstrap.Modal(taskDetailsModalElement);
        editTaskModal = new bootstrap.Modal(editTaskModalElement);
        confirmationModal = new bootstrap.Modal(confirmationModalElement);
    }

    // Global Variables
    let tasks = [];
    let currentFilter = 'all';
    let currentSort = 'date-asc';

    // Initialize the app
    function init() {
        // Set today as the default due date for new tasks
        const today = new Date().toISOString().split('T')[0];
        if (taskDueDate) {
            taskDueDate.value = today;
        }
        
        // Load tasks from localStorage
        loadTasksFromLocalStorage();
        
        // Render tasks and update stats
        renderTasks();
        updateTaskStats();
        
        // Load theme preference
        loadThemePreference();
        
        // Event Listeners
        if (taskForm) {
            taskForm.addEventListener('submit', addTask);
        }
        
        if (taskList) {
            taskList.addEventListener('click', handleTaskActions);
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', filterTasks);
        }
        
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', confirmClearAll);
        }
        
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
        }
        
        if (saveEditBtn) {
            saveEditBtn.addEventListener('click', saveEditedTask);
        }
        
        // Filter and Sort Options
        document.querySelectorAll('.filter-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                currentFilter = e.target.dataset.filter;
                renderTasks();
            });
        });
        
        document.querySelectorAll('.sort-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                currentSort = e.target.dataset.sort;
                renderTasks();
            });
        });
    }

    // Load tasks from localStorage
    function loadTasksFromLocalStorage() {
        const storedTasks = localStorage.getItem('tasks');
        if (storedTasks) {
            try {
                tasks = JSON.parse(storedTasks);
            } catch (e) {
                console.error('Error parsing tasks from localStorage:', e);
                tasks = [];
            }
        }
    }

    // Save tasks to localStorage
    function saveTasksToLocalStorage() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Add a new task
    function addTask(e) {
        e.preventDefault();
        
        // Create a new task object
        const newTask = {
            id: Date.now().toString(),
            title: taskTitle.value.trim(),
            description: taskDescription.value.trim(),
            dueDate: taskDueDate.value,
            priority: taskPriority.value,
            category: taskCategory.value,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        // Add to tasks array
        tasks.push(newTask);
        
        // Save to localStorage
        saveTasksToLocalStorage();
        
        // Reset form
        taskForm.reset();
        
        // Set today as the default due date again
        const today = new Date().toISOString().split('T')[0];
        taskDueDate.value = today;
        
        // Re-render tasks and update stats
        renderTasks();
        updateTaskStats();
        
        // Show success notification
        showNotification('Task added successfully!', 'success');
    }

    // Render tasks to the DOM
    function renderTasks() {
        if (!taskList) return;
        
        // Filter tasks based on current filter
        let filteredTasks = filterTasksByStatus(tasks, currentFilter);
        
        // Filter tasks based on search input
        if (searchInput) {
            const searchTerm = searchInput.value.toLowerCase().trim();
            if (searchTerm) {
                filteredTasks = filteredTasks.filter(task => 
                    task.title.toLowerCase().includes(searchTerm) || 
                    task.description.toLowerCase().includes(searchTerm)
                );
            }
        }
        
        // Sort tasks
        filteredTasks = sortTasks(filteredTasks, currentSort);
        
        // Clear the task list
        taskList.innerHTML = '';
        
        // Check if there are any tasks
        if (filteredTasks.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state text-center py-5">
                    <i class="fas fa-clipboard-list empty-icon"></i>
                    <h3>No Tasks Found</h3>
                    <p>${searchInput && searchInput.value ? 'Try a different search term' : 'Add a new task to get started'}</p>
                </div>
            `;
            return;
        }
        
        // Render each task
        filteredTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            taskList.appendChild(taskElement);
        });
    }

    // Create a task element
    function createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.classList.add('task-item');
        taskElement.dataset.id = task.id;
        
        // Format the due date
        const formattedDate = formatDate(task.dueDate);
        
        // Check if task is overdue
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date().setHours(0, 0, 0, 0) && !task.completed;
        
        taskElement.innerHTML = `
            <div class="task-content">
                <div class="task-title ${task.completed ? 'completed' : ''}">
                    ${task.title}
                    ${isOverdue ? '<span class="badge bg-danger ms-2">Overdue</span>' : ''}
                </div>
                <div class="task-details">
                    <span class="task-detail">
                        <i class="far fa-calendar-alt"></i> ${formattedDate}
                    </span>
                    <span class="priority-badge priority-${task.priority}">
                        ${task.priority}
                    </span>
                    <span class="category-badge category-${task.category}">
                        ${task.category}
                    </span>
                </div>
            </div>
            <div class="task-actions">
                <button class="btn-view" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-complete" title="${task.completed ? 'Mark as Incomplete' : 'Mark as Complete'}">
                    <i class="fas ${task.completed ? 'fa-times' : 'fa-check'}"></i>
                </button>
                <button class="btn-edit" title="Edit Task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" title="Delete Task">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        
        return taskElement;
    }

    // Handle task actions (complete, edit, delete)
    function handleTaskActions(e) {
        const target = e.target;
        const taskElement = target.closest('.task-item');
        
        if (!taskElement) return;
        
        const taskId = taskElement.dataset.id;
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) return;
        
        // View task details
        if (target.closest('.btn-view')) {
            showTaskDetails(task);
        }
        
        // Toggle task completion
        if (target.closest('.btn-complete')) {
            toggleTaskCompletion(taskId);
        }
        
        // Edit task
        if (target.closest('.btn-edit')) {
            openEditTaskModal(task);
        }
        
        // Delete task
        if (target.closest('.btn-delete')) {
            confirmDeleteTask(taskId);
        }
    }

    // Show task details in modal
    function showTaskDetails(task) {
        const taskDetailsContent = document.getElementById('taskDetailsContent');
        if (!taskDetailsContent || !taskDetailsModal) return;
        
        // Format dates
        const formattedDueDate = formatDate(task.dueDate);
        const formattedCreatedDate = new Date(task.createdAt).toLocaleString();
        
        taskDetailsContent.innerHTML = `
            <div class="task-detail-item">
                <h5>Title</h5>
                <p>${task.title}</p>
            </div>
            <div class="task-detail-item">
                <h5>Description</h5>
                <p>${task.description || 'No description provided'}</p>
            </div>
            <div class="task-detail-item">
                <h5>Due Date</h5>
                <p>${formattedDueDate}</p>
            </div>
            <div class="task-detail-item">
                <h5>Priority</h5>
                <p><span class="priority-badge priority-${task.priority}">${task.priority}</span></p>
            </div>
            <div class="task-detail-item">
                <h5>Category</h5>
                <p><span class="category-badge category-${task.category}">${task.category}</span></p>
            </div>
            <div class="task-detail-item">
                <h5>Status</h5>
                <p>${task.completed ? 
                    '<span class="badge bg-success">Completed</span>' : 
                    '<span class="badge bg-warning">Pending</span>'}</p>
            </div>
            <div class="task-detail-item">
                <h5>Created</h5>
                <p>${formattedCreatedDate}</p>
            </div>
        `;
        
        taskDetailsModal.show();
    }

    // Toggle task completion status
    function toggleTaskCompletion(taskId) {
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
            // Toggle the completed status
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            
            // Save to localStorage
            saveTasksToLocalStorage();
            
            // Re-render tasks and update stats
            renderTasks();
            updateTaskStats();
            
            // Show notification
            const status = tasks[taskIndex].completed ? 'completed' : 'marked as pending';
            showNotification(`Task ${status}!`, 'success');
        }
    }

    // Open edit task modal
    function openEditTaskModal(task) {
        if (!editTaskModal) return;
        
        // Populate form fields with task data
        editTaskId.value = task.id;
        editTaskTitle.value = task.title;
        editTaskDescription.value = task.description || '';
        editTaskDueDate.value = task.dueDate || '';
        editTaskPriority.value = task.priority;
        editTaskCategory.value = task.category;
        
        // Show the modal
        editTaskModal.show();
    }

    // Save edited task
    function saveEditedTask() {
        const taskId = editTaskId.value;
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
            // Update task with edited values
            tasks[taskIndex].title = editTaskTitle.value.trim();
            tasks[taskIndex].description = editTaskDescription.value.trim();
            tasks[taskIndex].dueDate = editTaskDueDate.value;
            tasks[taskIndex].priority = editTaskPriority.value;
            tasks[taskIndex].category = editTaskCategory.value;
            
            // Save to localStorage
            saveTasksToLocalStorage();
            
            // Hide the modal
            if (editTaskModal) {
                editTaskModal.hide();
            }
            
            // Re-render tasks
            renderTasks();
            updateTaskStats();
            
            // Show notification
            showNotification('Task updated successfully!', 'success');
        }
    }

    // Confirm delete task
    function confirmDeleteTask(taskId) {
        if (!confirmationModal) return;
        
        confirmationModalTitle.textContent = 'Delete Task';
        confirmationModalText.textContent = 'Are you sure you want to delete this task? This action cannot be undone.';
        
        // Set up the confirm button action
        confirmActionBtn.onclick = () => {
            deleteTask(taskId);
            confirmationModal.hide();
        };
        
        // Show the confirmation modal
        confirmationModal.show();
    }

    // Delete task
    function deleteTask(taskId) {
        // Filter out the task with the given id
        tasks = tasks.filter(task => task.id !== taskId);
        
        // Save to localStorage
        saveTasksToLocalStorage();
        
        // Re-render tasks and update stats
        renderTasks();
        updateTaskStats();
        
        // Show notification
        showNotification('Task deleted successfully!', 'success');
    }

    // Confirm clear all tasks
    function confirmClearAll() {
        if (!confirmationModal) return;
        
        confirmationModalTitle.textContent = 'Clear All Tasks';
        confirmationModalText.textContent = 'Are you sure you want to delete all tasks? This action cannot be undone.';
        
        // Set up the confirm button action
        confirmActionBtn.onclick = () => {
            clearAllTasks();
            confirmationModal.hide();
        };
        
        // Show the confirmation modal
        confirmationModal.show();
    }

    // Clear all tasks
    function clearAllTasks() {
        // Clear tasks array
        tasks = [];
        
        // Save to localStorage
        saveTasksToLocalStorage();
        
        // Re-render tasks and update stats
        renderTasks();
        updateTaskStats();
        
        // Show notification
        showNotification('All tasks cleared!', 'success');
    }

    // Filter tasks by status
    function filterTasksByStatus(tasksArray, filter) {
        switch (filter) {
            case 'completed':
                return tasksArray.filter(task => task.completed);
            case 'active':
                return tasksArray.filter(task => !task.completed);
            case 'all':
            default:
                return [...tasksArray];
        }
    }

    // Sort tasks
    function sortTasks(tasksArray, sortBy) {
        const sortedTasks = [...tasksArray];
        
        switch (sortBy) {
            case 'date-asc':
                return sortedTasks.sort((a, b) => {
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                });
            case 'date-desc':
                return sortedTasks.sort((a, b) => {
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(b.dueDate) - new Date(a.dueDate);
                });
            case 'priority':
                const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
                return sortedTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
            default:
                return sortedTasks;
        }
    }

    // Filter tasks based on search input
    function filterTasks() {
        renderTasks();
    }

    // Update task statistics
    function updateTaskStats() {
        if (!totalTasksElement || !completedTasksElement || !pendingTasksElement) return;
        
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        
        totalTasksElement.textContent = totalTasks;
        completedTasksElement.textContent = completedTasks;
        pendingTasksElement.textContent = pendingTasks;
    }

    // Format date for display
    function formatDate(dateString) {
        if (!dateString) return 'No due date';
        
        try {
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        } catch (e) {
            console.error('Error formatting date:', e);
            return dateString;
        }
    }

    // Toggle dark/light theme
    function toggleTheme() {
        const body = document.body;
        const isDarkTheme = body.classList.toggle('dark-theme');
        
        // Update the theme toggle button icon
        const themeIcon = themeToggle.querySelector('i');
        if (themeIcon) {
            if (isDarkTheme) {
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
            } else {
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
            }
        }
        
        // Save theme preference
        localStorage.setItem('darkTheme', isDarkTheme);
        
        // Show notification
        showNotification(`${isDarkTheme ? 'Dark' : 'Light'} theme activated!`, 'info');
    }

    // Load theme preference
    function loadThemePreference() {
        const isDarkTheme = localStorage.getItem('darkTheme') === 'true';
        
        if (isDarkTheme) {
            document.body.classList.add('dark-theme');
            const themeIcon = themeToggle ? themeToggle.querySelector('i') : null;
            if (themeIcon) {
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
            }
        }
    }

    // Show notification
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add to the DOM
        document.body.appendChild(notification);
        
        // Show notification with animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Get notification icon based on type
    function getNotificationIcon(type) {
        switch (type) {
            case 'success':
                return 'fa-check-circle';
            case 'error':
                return 'fa-exclamation-circle';
            case 'warning':
                return 'fa-exclamation-triangle';
            case 'info':
            default:
                return 'fa-info-circle';
        }
    }

    // Initialize the app
    init();
});