
// ======================================
// 1. GET HTML ELEMENTS
// ======================================

const taskForm = document.getElementById("taskForm");

const taskId = document.getElementById("taskId");
const taskTitle = document.getElementById("taskTitle");
const taskCategory = document.getElementById("taskCategory");
const taskDate = document.getElementById("taskDate");
const taskPriority = document.getElementById("taskPriority");

const saveBtn = document.getElementById("saveBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const taskList = document.getElementById("taskList");
const message = document.getElementById("message");

const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");
const loadSampleBtn = document.getElementById("loadSampleBtn");

// Dashboard elements
const totalCount = document.getElementById("totalCount");
const pendingCount = document.getElementById("pendingCount");
const completedCount = document.getElementById("completedCount");
const todayCount = document.getElementById("todayCount");


// ======================================
// 2. LOAD TASKS FROM LOCAL STORAGE
// ======================================

let tasks = [];

try {
    tasks = JSON.parse(
        localStorage.getItem("studyflow_tasks_v1")
    ) || [];
} catch (error) {
    console.error("Could not load saved tasks:", error);
    tasks = [];
}


// ======================================
// 3. SAVE TASKS
// ======================================

function saveTasks() {
    localStorage.setItem(
        "studyflow_tasks_v1",
        JSON.stringify(tasks)
    );
}


// ======================================
// 4. GET TODAY'S DATE
// ======================================

function getTodayDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// Set today's date as the default due date.
taskDate.value = getTodayDate();


// ======================================
// 5. SHOW MESSAGE
// ======================================

function showMessage(text, type = "success") {
    message.textContent = text;
    message.className = `mt-3 text-${type}`;

    setTimeout(() => {
        message.textContent = "";
    }, 3000);
}


// ======================================
// 6. UPDATE DASHBOARD COUNTERS
// ======================================

function updateDashboard() {

    // Total number of tasks
    const total = tasks.length;

    // Number of completed tasks
    const completed = tasks.filter(
        task => task.completed === true
    ).length;

    // Number of pending tasks
    const pending = total - completed;

    // Number of tasks due today
    const today = getTodayDate();

    const todayTasks = tasks.filter(
        task => task.dueDate === today
    ).length;

    // Display the numbers
    totalCount.textContent = total;
    pendingCount.textContent = pending;
    completedCount.textContent = completed;
    todayCount.textContent = todayTasks;
}


// ======================================
// 7. DISPLAY ALL TASKS
// ======================================

function displayTasks() {

    // Clear previous task cards
    taskList.replaceChildren();

    // Read search and filter values
    const searchText = searchInput.value.toLowerCase().trim();
    const filterValue = filterSelect.value;

    // Filter tasks
    const filteredTasks = tasks.filter(task => {

        const matchesSearch =
            task.title.toLowerCase().includes(searchText) ||
            task.category.toLowerCase().includes(searchText);

        const matchesFilter =
            filterValue === "all" ||
            (filterValue === "pending" && !task.completed) ||
            (filterValue === "completed" && task.completed);

        return matchesSearch && matchesFilter;
    });

    // Show empty message
    if (filteredTasks.length === 0) {

        const emptyMessage = document.createElement("p");

        emptyMessage.className = "text-muted";

        emptyMessage.textContent =
            tasks.length === 0
                ? "No tasks added yet. Add your first task!"
                : "No tasks match your search or filter.";

        taskList.appendChild(emptyMessage);

        updateDashboard();
        return;
    }

    // Display each task
    filteredTasks.forEach(task => {

        const taskCard = document.createElement("div");
        taskCard.className = "task-item";

        // Main task details
        const taskMain = document.createElement("div");
        taskMain.className = "task-main";

        const title = document.createElement("h5");
        title.className = "task-title";

        if (task.completed) {
            title.classList.add("done");
        }

        title.textContent = task.title;

        const details = document.createElement("p");
        details.className = "task-meta";

        details.textContent =
            `${task.category} | Due: ${task.dueDate}`;

        const priority = document.createElement("span");
        priority.className = `priority ${task.priority}`;
        priority.textContent = `${task.priority} Priority`;

        taskMain.appendChild(title);
        taskMain.appendChild(details);
        taskMain.appendChild(priority);

        // Action buttons
        const actions = document.createElement("div");
        actions.className = "task-actions";

        // Complete checkbox
        const completeLabel = document.createElement("label");
        completeLabel.className = "complete-label";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;

        checkbox.addEventListener("change", () => {
            toggleTask(task.id);
        });

        completeLabel.appendChild(checkbox);
        completeLabel.appendChild(
            document.createTextNode("Done")
        );

        // Edit button
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "btn btn-warning btn-sm";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", () => {
            editTask(task.id);
        });

        // Delete button
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "btn btn-danger btn-sm";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", () => {
            deleteTask(task.id);
        });

        actions.appendChild(completeLabel);
        actions.appendChild(editButton);
        actions.appendChild(deleteButton);

        // Add details and actions to card
        taskCard.appendChild(taskMain);
        taskCard.appendChild(actions);

        taskList.appendChild(taskCard);
    });

    // Always update dashboard after rendering
    updateDashboard();
}


// ======================================
// 8. RESET FORM
// ======================================

function resetForm() {

    taskForm.reset();

    taskId.value = "";

    taskDate.value = getTodayDate();

    saveBtn.textContent = "Add Task";

    cancelEditBtn.classList.add("d-none");

}


// ======================================
// 9. ADD OR UPDATE TASK
// ======================================

taskForm.addEventListener("submit", function(event) {

    // Stop page refresh
    event.preventDefault();

    // Get form values
    const title = taskTitle.value.trim();
    const category = taskCategory.value;
    const dueDate = taskDate.value;
    const priority = taskPriority.value;

    // Validate title
    if (title.length < 3) {

        showMessage(
            "Task title must contain at least 3 characters.",
            "danger"
        );

        taskTitle.focus();
        return;
    }

    // Validate remaining fields
    if (!category || !dueDate || !priority) {

        showMessage(
            "Please fill in all the required fields.",
            "danger"
        );

        return;
    }

    // Check whether user is editing an existing task
    const existingId = taskId.value;

    if (existingId) {

        // Update existing task
        const index = tasks.findIndex(
            task => task.id === existingId
        );

        if (index !== -1) {

            tasks[index].title = title;
            tasks[index].category = category;
            tasks[index].dueDate = dueDate;
            tasks[index].priority = priority;

            saveTasks();
            resetForm();
            displayTasks();

            showMessage("Task updated successfully!");

        }

    } else {

        // Create new task
        const newTask = {

            id: (
                window.crypto &&
                typeof window.crypto.randomUUID === "function"
            )
                ? window.crypto.randomUUID()
                : String(Date.now()),

            title: title,
            category: category,
            dueDate: dueDate,
            priority: priority,
            completed: false
        };

        // Add task to array
        tasks.push(newTask);

        // Save and refresh
        saveTasks();
        resetForm();
        displayTasks();

        showMessage("Task added successfully!");

    }

});


// ======================================
// 10. EDIT TASK
// ======================================

function editTask(id) {

    const task = tasks.find(
        item => item.id === id
    );

    if (!task) {
        return;
    }

    taskId.value = task.id;
    taskTitle.value = task.title;
    taskCategory.value = task.category;
    taskDate.value = task.dueDate;
    taskPriority.value = task.priority;

    saveBtn.textContent = "Update Task";

    cancelEditBtn.classList.remove("d-none");

    taskForm.scrollIntoView({
        behavior: "smooth"
    });

}


// ======================================
// 11. DELETE TASK
// ======================================

function deleteTask(id) {

    const confirmation = confirm(
        "Are you sure you want to delete this task?"
    );

    if (!confirmation) {
        return;
    }

    tasks = tasks.filter(
        task => task.id !== id
    );

    saveTasks();
    displayTasks();

    showMessage("Task deleted successfully!");

}


// ======================================
// 12. COMPLETE OR UNCOMPLETE TASK
// ======================================

function toggleTask(id) {

    tasks = tasks.map(task => {

        if (task.id === id) {

            return {
                ...task,
                completed: !task.completed
            };

        }

        return task;

    });

    saveTasks();
    displayTasks();

}


// ======================================
// 13. CANCEL EDIT
// ======================================

cancelEditBtn.addEventListener("click", function() {

    resetForm();

    showMessage("Editing cancelled.", "secondary");

});


// ======================================
// 14. SEARCH TASKS
// ======================================

searchInput.addEventListener("input", function() {

    displayTasks();

});


// ======================================
// 15. FILTER TASKS
// ======================================

filterSelect.addEventListener("change", function() {

    displayTasks();

});


// ======================================
// 16. FETCH SAMPLE TASKS FROM API
// ======================================

loadSampleBtn.addEventListener("click", async function() {

    loadSampleBtn.disabled = true;
    loadSampleBtn.textContent = "Loading...";

    try {

        const response = await fetch(
            "https://jsonplaceholder.typicode.com/todos?_limit=5"
        );

        if (!response.ok) {
            throw new Error("API request failed");
        }

        const data = await response.json();

        const sampleTasks = data.map(item => ({

            id: (
                window.crypto &&
                typeof window.crypto.randomUUID === "function"
            )
                ? window.crypto.randomUUID()
                : String(Date.now() + item.id),

            title: item.title,

            category: "Study",

            dueDate: getTodayDate(),

            priority: "Medium",

            completed: false

        }));

        tasks.push(...sampleTasks);

        saveTasks();
        displayTasks();

        showMessage("Sample tasks loaded successfully!");

    } catch (error) {

        console.error("API Error:", error);

        showMessage(
            "Unable to load sample tasks. Check your internet connection.",
            "danger"
        );

    } finally {

        loadSampleBtn.disabled = false;
        loadSampleBtn.textContent = "Load Sample Tasks from API";

    }

});


// ======================================
// 17. INITIAL DISPLAY
// ======================================

// Display saved tasks and dashboard numbers
displayTasks();
