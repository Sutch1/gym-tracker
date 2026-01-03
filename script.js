// Default workout types
const defaultTypes = ['Kozy', 'Záda', 'Nohy', 'Ruce'];

// Register Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {
        // Service Worker registration failed, app will still work online
    });
}

// Initialize app
function initApp() {
    if (!localStorage.getItem('workoutTypes')) {
        localStorage.setItem('workoutTypes', JSON.stringify(defaultTypes));
    }
    if (!localStorage.getItem('exercises')) {
        localStorage.setItem('exercises', JSON.stringify({}));
    }
    if (!localStorage.getItem('trainings')) {
        localStorage.setItem('trainings', JSON.stringify({}));
    }
    renderTabs();
    renderContent();
    renderCalendar();
}

// Get all workout types
function getWorkoutTypes() {
    return JSON.parse(localStorage.getItem('workoutTypes') || '[]');
}

// Get exercises for a type
function getExercises(type) {
    const allExercises = JSON.parse(localStorage.getItem('exercises') || '{}');
    return allExercises[type] || [];
}

// Save exercise
function saveExercises() {
    localStorage.setItem('exercises', JSON.stringify(window.exercisesData || {}));
}

// Render tabs
function renderTabs() {
    const types = getWorkoutTypes();
    const tabsContainer = document.getElementById('tabsContainer');
    tabsContainer.innerHTML = '';

    types.forEach((type, index) => {
        const tab = document.createElement('button');
        tab.className = `tab ${index === 0 ? 'active' : ''}`;
        tab.textContent = type;
        tab.onclick = () => switchTab(type);
        tabsContainer.appendChild(tab);
    });

    // Přidej listener pro scroll detekci
    updateScrollIndicators();
    tabsContainer.addEventListener('scroll', updateScrollIndicators);
}

// Detekuj scroll a zobraz šipky
function updateScrollIndicators() {
    const container = document.getElementById('tabsContainer');
    const hasScrollLeft = container.scrollLeft > 0;
    const hasScrollRight = container.scrollLeft < (container.scrollWidth - container.clientWidth - 10);

    if (hasScrollLeft) {
        container.classList.add('can-scroll-left');
    } else {
        container.classList.remove('can-scroll-left');
    }

    if (hasScrollRight) {
        container.classList.add('can-scroll-right');
    } else {
        container.classList.remove('can-scroll-right');
    }
}

// Switch tab
function switchTab(type) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

    // Show selected section
    const types = getWorkoutTypes();
    const index = types.indexOf(type);
    if (index >= 0) {
        document.querySelectorAll('.tab')[index].classList.add('active');
    }

    // Create section if doesn't exist
    let section = document.getElementById(type.toLowerCase());
    if (!section) {
        section = document.createElement('div');
        section.id = type.toLowerCase();
        section.className = 'section active';
        document.querySelector('.content').appendChild(section);
    } else {
        section.classList.add('active');
    }

    renderExercises(type);
}

// Render exercises for a type
function renderExercises(type) {
    const exercises = getExercises(type);
    const section = document.getElementById(type.toLowerCase());
    
    let html = `<button class="add-exercise-btn" onclick="openAddExerciseModal('${type}')">+ Přidat cvičení</button>`;

    if (exercises.length === 0) {
        html += `<div class="empty-state">
            <p>Zatím žádné cvičení</p>
            <p style="font-size: 12px; margin-top: 10px;">Klikněte na tlačítko výše pro přidání prvního cvičení</p>
        </div>`;
    } else {
        exercises.forEach((exercise, index) => {
            html += `
            <div class="exercise-card">
                <div class="exercise-header">
                    <div class="exercise-name">${exercise.name}</div>
                    <div class="exercise-actions">
                        <button class="btn-sm btn-edit-ex" onclick="openEditExerciseModal('${type}', ${index})">Upravit</button>
                        <button class="btn-sm btn-history" onclick="openHistoryModal('${type}', ${index})">Historie</button>
                        <button class="btn-sm btn-delete" onclick="deleteExercise('${type}', ${index})">Smazat</button>
                    </div>
                </div>
                <div class="exercise-details">
                    <div class="detail-item">
                        <div class="detail-label">Váha</div>
                        <div class="detail-value">${exercise.weight} kg</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Opakování</div>
                        <div class="detail-value">${exercise.reps}x</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Série</div>
                        <div class="detail-value">${exercise.sets}x</div>
                    </div>
                </div>
                ${exercise.description ? `<div class="exercise-description">📝 ${exercise.description}</div>` : ''}
            </div>
            `;
        });
    }

    section.innerHTML = html;
}

// Render all sections
function renderContent() {
    const types = getWorkoutTypes();
    types.forEach(type => {
        let section = document.getElementById(type.toLowerCase());
        if (!section) {
            section = document.createElement('div');
            section.id = type.toLowerCase();
            section.className = 'section';
            document.querySelector('.content').appendChild(section);
        }
    });
    switchTab(types[0]);
}

// Open add exercise modal
function openAddExerciseModal(type) {
    window.currentType = type;
    document.getElementById('addExerciseModal').classList.add('show');
    document.getElementById('exerciseName').focus();
}

// Close add exercise modal
function closeAddExerciseModal() {
    document.getElementById('addExerciseModal').classList.remove('show');
    document.getElementById('exerciseForm').reset();
    window.currentExerciseIndex = null;
}

// Save exercise
function saveExercise(event) {
    event.preventDefault();
    
    // Pokud editujeme
    if (window.currentExerciseIndex !== null && window.currentExerciseIndex !== undefined) {
        saveEditedExercise();
        return;
    }
    
    const type = window.currentType;
    const name = document.getElementById('exerciseName').value;
    const weight = document.getElementById('exerciseWeight').value;
    const reps = document.getElementById('exerciseReps').value;
    const sets = document.getElementById('exerciseSets').value;
    const description = document.getElementById('exerciseDescription').value;

    const allExercises = JSON.parse(localStorage.getItem('exercises') || '{}');
    if (!allExercises[type]) {
        allExercises[type] = [];
    }

    const exerciseData = {
        name,
        weight: weight || '0',
        reps: reps || '0',
        sets: sets || '0',
        description,
        history: [{
            date: new Date().toLocaleString('cs-CZ'),
            weight: weight || '0',
            reps: reps || '0',
            sets: sets || '0',
            description: description
        }]
    };

    allExercises[type].push(exerciseData);

    localStorage.setItem('exercises', JSON.stringify(allExercises));
    closeAddExerciseModal();
    renderExercises(type);
}

// Open edit exercise modal
function openEditExerciseModal(type, index) {
    const allExercises = JSON.parse(localStorage.getItem('exercises') || '{}');
    const exercise = allExercises[type][index];
    
    window.currentType = type;
    window.currentExerciseIndex = index;
    
    document.getElementById('exerciseName').value = exercise.name;
    document.getElementById('exerciseWeight').value = exercise.weight;
    document.getElementById('exerciseReps').value = exercise.reps;
    document.getElementById('exerciseSets').value = exercise.sets;
    document.getElementById('exerciseDescription').value = exercise.description;
    
    document.getElementById('addExerciseModal').classList.add('show');
}

// Save edited exercise
function saveEditedExercise() {
    const type = window.currentType;
    const index = window.currentExerciseIndex;
    const weight = document.getElementById('exerciseWeight').value;
    const reps = document.getElementById('exerciseReps').value;
    const sets = document.getElementById('exerciseSets').value;

    const allExercises = JSON.parse(localStorage.getItem('exercises') || '{}');
    const exercise = allExercises[type][index];
    
    // Přidej do historie
    if (!exercise.history) {
        exercise.history = [];
    }
    
    exercise.history.push({
        date: new Date().toLocaleString('cs-CZ'),
        weight: weight || '0',
        reps: reps || '0',
        sets: sets || '0',
        description: document.getElementById('exerciseDescription').value
    });
    
    // Aktualizuj hodnoty
    exercise.weight = weight || '0';
    exercise.reps = reps || '0';
    exercise.sets = sets || '0';
    exercise.description = document.getElementById('exerciseDescription').value;

    localStorage.setItem('exercises', JSON.stringify(allExercises));
    closeAddExerciseModal();
    renderExercises(type);
}

// Open history modal
function openHistoryModal(type, index) {
    const allExercises = JSON.parse(localStorage.getItem('exercises') || '{}');
    const exercise = allExercises[type][index];
    
    document.getElementById('historyExerciseName').textContent = exercise.name;
    
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    if (!exercise.history || exercise.history.length === 0) {
        historyList.innerHTML = '<p style="text-align: center; color: #8F91A2; padding: 20px;">Žádná história</p>';
    } else {
        // Obrátiť historii tak aby nejnovější byly nahoře
        const reversedHistory = [...exercise.history].reverse();
        reversedHistory.forEach((entry, idx) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            const descriptionText = entry.description ? `<div class="history-description">${entry.description}</div>` : '';
            historyItem.innerHTML = `
                <div class="history-date">${entry.date}</div>
                <div class="history-details">
                    <span>Váha: ${entry.weight} kg</span>
                    <span>Opakování: ${entry.reps}x</span>
                    <span>Série: ${entry.sets}x</span>
                </div>
                ${descriptionText}
            `;
            historyList.appendChild(historyItem);
        });
    }
    
    document.getElementById('historyModal').classList.add('show');
}

// Close history modal
function closeHistoryModal() {
    document.getElementById('historyModal').classList.remove('show');
}

// Delete exercise
function deleteExercise(type, index) {
    openConfirmModal('Opravdu chcete smazat toto cvičení?', () => {
        const allExercises = JSON.parse(localStorage.getItem('exercises') || '{}');
        allExercises[type].splice(index, 1);
        localStorage.setItem('exercises', JSON.stringify(allExercises));
        renderExercises(type);
    });
}

// Open manage types modal
function openManageTypesModal() {
    document.getElementById('manageTypesModal').classList.add('show');
    renderTypesList();
}

// Close manage types modal
function closeManageTypesModal() {
    document.getElementById('manageTypesModal').classList.remove('show');
}

// Render types list in modal
function renderTypesList() {
    const types = getWorkoutTypes();
    const typesList = document.getElementById('typesList');
    typesList.innerHTML = '';

    types.forEach((type, index) => {
        const item = document.createElement('div');
        item.className = 'type-item';
        item.innerHTML = `
            <div class="type-item-name">${type}</div>
            <div class="type-item-actions">
                <button class="btn-sm btn-edit" onclick="editType(${index})">Upravit</button>
                <button class="btn-sm btn-delete" onclick="deleteType(${index})">Smazat</button>
            </div>
        `;
        typesList.appendChild(item);
    });
}

// Add new type
function addNewType(event) {
    event.preventDefault();
    const name = document.getElementById('newTypeName').value.trim();
    
    if (name) {
        const types = getWorkoutTypes();
        if (!types.includes(name)) {
            types.push(name);
            localStorage.setItem('workoutTypes', JSON.stringify(types));
            document.getElementById('newTypeName').value = '';
            renderTabs();
            renderContent();
            renderTypesList();
        } else {
            alert('Tento typ již existuje!');
        }
    }
}

// Edit type
function editType(index) {
    const types = getWorkoutTypes();
    const oldName = types[index];
    const newName = prompt('Nové jméno typu:', oldName);
    
    if (newName && newName.trim() && newName !== oldName) {
        types[index] = newName.trim();
        localStorage.setItem('workoutTypes', JSON.stringify(types));
        
        // Rename exercises
        const allExercises = JSON.parse(localStorage.getItem('exercises') || '{}');
        if (allExercises[oldName]) {
            allExercises[newName] = allExercises[oldName];
            delete allExercises[oldName];
            localStorage.setItem('exercises', JSON.stringify(allExercises));
        }
        
        renderTabs();
        renderContent();
        renderTypesList();
    }
}

// Delete type
function deleteType(index) {
    const types = getWorkoutTypes();
    const typeToDelete = types[index];
    
    openConfirmModal(`Opravdu chcete smazat "${typeToDelete}" včetně všech cvičení?`, () => {
        types.splice(index, 1);
        localStorage.setItem('workoutTypes', JSON.stringify(types));
        
        // Delete exercises for this type
        const allExercises = JSON.parse(localStorage.getItem('exercises') || '{}');
        delete allExercises[typeToDelete];
        localStorage.setItem('exercises', JSON.stringify(allExercises));
        
        renderTabs();
        renderContent();
        renderTypesList();
    });
}

// Close modals when clicking outside
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAddExerciseModal();
        closeManageTypesModal();
    }
});

// Calendar functions
let currentCalendarDate = new Date();
let selectedDateForTraining = null;

function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const container = document.getElementById('calendarContainer');
    container.innerHTML = '';
    
    // Header s navigací
    const header = document.createElement('div');
    header.className = 'calendar-header';
    header.innerHTML = `
        <button class="btn btn-secondary" onclick="previousMonth()">← Zpět</button>
        <h3 id="calendarMonth"></h3>
        <button class="btn btn-secondary" onclick="nextMonth()">Dále →</button>
    `;
    container.appendChild(header);
    
    // Aktualizuj měsíc a rok
    const monthNames = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];
    document.getElementById('calendarMonth').textContent = `${monthNames[month]} ${year}`;
    
    // Dny v týdnu
    const weekdays = document.createElement('div');
    weekdays.className = 'calendar-weekdays';
    const dayNames = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
    dayNames.forEach(day => {
        const dayEl = document.createElement('div');
        dayEl.className = 'weekday';
        dayEl.textContent = day;
        weekdays.appendChild(dayEl);
    });
    container.appendChild(weekdays);
    
    // Dny v měsíci
    const daysContainer = document.createElement('div');
    daysContainer.className = 'calendar-days';
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    
    // Dny z předchozího měsíce
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day other-month';
        dayEl.textContent = prevMonthLastDay - i;
        daysContainer.appendChild(dayEl);
    }
    
    // Dny aktuálního měsíce
    const trainings = JSON.parse(localStorage.getItem('trainings') || '{}');
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Resetuj čas aby se mohla porovnávat jen data
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement('div');
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dateObj = new Date(year, month, day);
        dateObj.setHours(0, 0, 0, 0);
        
        dayEl.className = 'calendar-day';
        dayEl.textContent = day;
        
        // Znač dnešní den
        if (today.getTime() === dateObj.getTime()) {
            dayEl.classList.add('today');
        }
        
        // Znač dny s tréninkem
        if (trainings[dateStr]) {
            dayEl.classList.add('has-training');
        }
        
        // Zakázat klikání na budoucí data
        if (dateObj > today) {
            dayEl.classList.add('future-day');
        } else {
            // Jen minulá a dnešní data jsou klikatelná
            dayEl.onclick = () => onCalendarDayClick(dateStr);
        }
        
        daysContainer.appendChild(dayEl);
    }
    
    // Dny z dalšího měsíce
    const totalCells = daysContainer.children.length - (startingDayOfWeek + daysInMonth);
    for (let i = 1; i <= totalCells + 6; i++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day other-month';
        dayEl.textContent = i;
        daysContainer.appendChild(dayEl);
    }
    
    container.appendChild(daysContainer);
}

function previousMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
}

function onCalendarDayClick(dateStr) {
    const trainings = JSON.parse(localStorage.getItem('trainings') || '{}');
    
    if (trainings[dateStr]) {
        // Pokud už má trénink, zobraz detail
        openEditTrainingModal(dateStr, trainings[dateStr]);
    } else {
        // Otevři modal pro výběr sekce
        selectedDateForTraining = dateStr;
        openLogTrainingModal();
    }
}

function toggleCalendar() {
    const calendarSection = document.getElementById('calendarSection');
    calendarSection.style.display = calendarSection.style.display === 'none' ? 'flex' : 'none';
}

function openLogTrainingModal() {
    const types = getWorkoutTypes();
    const container = document.getElementById('trainingTypesSelect');
    container.innerHTML = '';
    
    types.forEach(type => {
        const btn = document.createElement('button');
        btn.className = 'training-type-btn';
        btn.textContent = type;
        btn.onclick = () => logTraining(type);
        container.appendChild(btn);
    });
    
    document.getElementById('logTrainingModal').classList.add('show');
}

function closeLogTrainingModal() {
    document.getElementById('logTrainingModal').classList.remove('show');
    selectedDateForTraining = null;
}

function logTraining(type) {
    if (!selectedDateForTraining) return;
    
    const trainings = JSON.parse(localStorage.getItem('trainings') || '{}');
    trainings[selectedDateForTraining] = type;
    localStorage.setItem('trainings', JSON.stringify(trainings));
    
    // Zavři modal
    document.getElementById('logTrainingModal').classList.remove('show');
    
    // Resetuj selectedDateForTraining
    selectedDateForTraining = null;
    
    // Aktualizuj kalendář
    renderCalendar();
}

function openEditTrainingModal(dateStr, type) {
    selectedDateForTraining = dateStr;
    document.getElementById('editTrainingDate').textContent = formatDateCz(dateStr);
    document.getElementById('editTrainingType').textContent = type;
    document.getElementById('editTrainingModal').classList.add('show');
}

function closeEditTrainingModal() {
    document.getElementById('editTrainingModal').classList.remove('show');
    selectedDateForTraining = null;
}

// Confirm modal helpers
function openConfirmModal(message, onConfirm) {
    window._confirmCallback = onConfirm;
    document.getElementById('confirmMessage').textContent = message;
    const modal = document.getElementById('confirmModal');
    if (modal) modal.classList.add('show');
}

function confirmOk() {
    const cb = window._confirmCallback;
    const modal = document.getElementById('confirmModal');
    if (modal) modal.classList.remove('show');
    window._confirmCallback = null;
    if (typeof cb === 'function') cb();
}

function confirmCancel() {
    const modal = document.getElementById('confirmModal');
    if (modal) modal.classList.remove('show');
    window._confirmCallback = null;
}

function editTrainingType() {
    if (!selectedDateForTraining) return;
    
    // Smaž starý trénink
    const trainings = JSON.parse(localStorage.getItem('trainings') || '{}');
    delete trainings[selectedDateForTraining];
    localStorage.setItem('trainings', JSON.stringify(trainings));
    
    // Zavři všechny modaly
    document.getElementById('editTrainingModal').classList.remove('show');
    document.getElementById('logTrainingModal').classList.remove('show');
    
    // Malá pauza a pak otevři modal pro výběr nové sekce
    setTimeout(() => {
        openLogTrainingModal();
    }, 100);
}

function deleteTraining() {
    if (!selectedDateForTraining) return;
    
    openConfirmModal('Smazat trénink?', () => {
        const trainings = JSON.parse(localStorage.getItem('trainings') || '{}');
        delete trainings[selectedDateForTraining];
        localStorage.setItem('trainings', JSON.stringify(trainings));
        
        selectedDateForTraining = null;
        document.getElementById('editTrainingModal').classList.remove('show');
        renderCalendar();
    });
}

function formatDateCz(dateStr) {
    const [year, month, day] = dateStr.split('-');
    const monthNames = ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'];
    const date = new Date(year, parseInt(month) - 1, day);
    const dayName = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'][date.getDay()];
    return `${dayName} ${parseInt(day)}. ${monthNames[parseInt(month) - 1]} ${year}`;
}

// Initialize app on load
window.addEventListener('load', initApp);

// Update scroll indicators on resize
window.addEventListener('resize', updateScrollIndicators);
