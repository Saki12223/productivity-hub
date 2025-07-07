// Initialize GSAP and Speech Synthesis
gsap.registerPlugin(ScrollTrigger);
const speech = window.speechSynthesis;

// Audio Context for sound effects
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let audioContextInitialized = false;
const initAudioContext = () => {
    if (!audioContextInitialized && audioContext.state === 'suspended') {
        audioContext.resume();
        audioContextInitialized = true;
    }
};

document.addEventListener('touchstart', initAudioContext, { once: true });

// Sound effect function
const playSound = (frequency, duration, type = 'sine') => {
    if (!audioContextInitialized) {
        initAudioContext();
        return;
    }
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
        console.log('Audio playback error:', error);
    }
};

// Speech synthesis function
const speak = (text, pitch = 1, rate = 1) => {
    // Cancel any ongoing speech
    speech.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = pitch;
    utterance.rate = rate;
    
    // Handle errors
    utterance.onerror = (event) => {
        console.log('Speech synthesis error:', event);
    };
    
    speech.speak(utterance);
};

// DOM Elements
const introOverlay = document.getElementById('introOverlay');
const currentDateEl = document.getElementById('currentDate');
const timerDisplay = document.getElementById('timerDisplay');
const startTimer = document.getElementById('startTimer');
const pauseTimer = document.getElementById('pauseTimer');
const resetTimer = document.getElementById('resetTimer');
const modeButtons = document.querySelectorAll('.mode-btn');
const taskList = document.getElementById('taskList');
const addTaskBtn = document.getElementById('addTask');
const progressChart = document.getElementById('progressChart');

// Intro Animation
window.addEventListener('load', () => {
    const timeline = gsap.timeline();
    
    timeline.from('.intro-logo i', {
        scale: 0,
        rotation: 360,
        duration: 1.5,
        ease: 'elastic.out(1, 0.3)'
    })
    .from('.intro-logo h1', {
        y: 50,
        opacity: 0,
        duration: 1
    }, '-=0.5')
    .to('.intro-text', {
        opacity: 1,
        duration: 1
    })
    .from('.creator-info', {
        y: 30,
        opacity: 0,
        duration: 1
    }, '-=0.5');

    // Create particle effect
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: 5px;
            height: 5px;
            background: white;
            border-radius: 50%;
        `;
        document.querySelector('.logo-particles').appendChild(particle);

        gsap.to(particle, {
            x: 'random(-100, 100)',
            y: 'random(-100, 100)',
            opacity: 0,
            duration: 'random(1, 2)',
            repeat: -1,
            delay: 'random(0, 2)',
            ease: 'power1.out'
        });
    }

    // Hide intro after animation
    setTimeout(() => {
        gsap.to(introOverlay, {
            opacity: 0,
            duration: 1,
            onComplete: () => introOverlay.style.display = 'none'
        });
    }, 4000);
});

// Set current date
const updateDate = () => {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = now.toLocaleDateString('en-US', options);
};
updateDate();

// Timer functionality
let timeLeft = 25 * 60; // 25 minutes in seconds
let timerId = null;

const updateTimerDisplay = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Voice announcements at specific intervals
    if (timeLeft === 300) { // 5 minutes left
        speak("5 minutes remaining");
        playSound(440, 0.2); // Play A4 note
    } else if (timeLeft === 60) { // 1 minute left
        speak("1 minute remaining");
        playSound(523.25, 0.2); // Play C5 note
    } else if (timeLeft === 30) { // 30 seconds left
        speak("30 seconds remaining");
        playSound(587.33, 0.2); // Play D5 note
    }
};

startTimer.addEventListener('click', () => {
    if (!timerId) {
        speak("Timer started");
        playSound(440, 0.1);
        timerId = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft === 0) {
                clearInterval(timerId);
                timerId = null;
                speak("Time's up! Great work!");
                playSound(880, 0.5, 'triangle'); // Play A5 note with triangle wave
            }
        }, 1000);
    }
});

pauseTimer.addEventListener('click', () => {
    clearInterval(timerId);
    timerId = null;
    startTimer.disabled = false;
    pauseTimer.disabled = true;
});

resetTimer.addEventListener('click', () => {
    clearInterval(timerId);
    timerId = null;
    timeLeft = 25 * 60;
    updateTimerDisplay();
    startTimer.disabled = false;
    pauseTimer.disabled = true;
});

modeButtons.forEach(button => {
    button.addEventListener('click', () => {
        modeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        const minutes = parseInt(button.dataset.time);
        timeLeft = minutes * 60;
        updateTimerDisplay();
        clearInterval(timerId);
        timerId = null;
        startTimer.disabled = false;
        pauseTimer.disabled = true;
    });
});

// Task Management
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

const createTaskElement = (task) => {
    const taskElement = document.createElement('div');
    taskElement.className = 'task-item';
    taskElement.innerHTML = `
        <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-id="${task.id}"></div>
        <div class="task-content ${task.completed ? 'completed' : ''}">${task.text}</div>
        <button class="delete-task" data-id="${task.id}">
            <i class="fas fa-trash"></i>
        </button>
    `;
    return taskElement;
};

const renderTasks = () => {
    taskList.innerHTML = '';
    tasks.forEach(task => {
        taskList.appendChild(createTaskElement(task));
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
    updateStats();
};

addTaskBtn.addEventListener('click', () => {
    const text = prompt('Enter task:');
    if (text) {
        tasks.push({
            id: Date.now(),
            text,
            completed: false
        });
        renderTasks();
        playSound(523.25, 0.1); // Play C5 note
        speak("Task added");
    }
});

taskList.addEventListener('click', (e) => {
    if (e.target.classList.contains('task-checkbox')) {
        const id = parseInt(e.target.dataset.id);
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            if (task.completed) {
                playSound(587.33, 0.1); // Play D5 note
                speak("Task completed");
            }
            renderTasks();
            updateStats();
        }
    } else if (e.target.classList.contains('delete-task') || e.target.parentElement.classList.contains('delete-task')) {
        const id = parseInt(e.target.dataset.id || e.target.parentElement.dataset.id);
        tasks = tasks.filter(t => t.id !== id);
        renderTasks();
    }
});

// Progress Chart
let chart = null;

const createChart = (type = 'focus') => {
    const ctx = progressChart.getContext('2d');
    const data = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            label: type === 'focus' ? 'Focus Hours' : type === 'tasks' ? 'Tasks Completed' : 'Wellness Score',
            data: Array.from({length: 7}, () => Math.floor(Math.random() * 10)),
            borderColor: '#4a90e2',
            backgroundColor: 'rgba(74, 144, 226, 0.1)',
            tension: 0.4,
            fill: true
        }]
    };

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
};

document.querySelectorAll('.chart-type').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.chart-type').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        createChart(button.dataset.type);
    });
});

// Modal Management
const openModal = (modalId) => {
    document.getElementById(modalId).style.display = 'block';
};

const closeModals = () => {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
};

document.querySelectorAll('.close-modal').forEach(button => {
    button.addEventListener('click', closeModals);
});

document.querySelectorAll('.quick-access-btn').forEach(button => {
    button.addEventListener('click', () => {
        const feature = button.dataset.feature;
        switch (feature) {
            case 'flashcards':
                openModal('flashcardsModal');
                break;
            case 'notes':
                openModal('notesModal');
                break;
            case 'meditation':
                openModal('meditationModal');
                break;
            case 'calories':
                openModal('calorieModal');
                break;
        }
    });
});

// Flashcards Management
let decks = JSON.parse(localStorage.getItem('flashcardDecks')) || [];
let currentDeck = null;
let currentCardIndex = 0;

const createDeck = () => {
    const name = prompt('Enter deck name:');
    if (name) {
        const deck = {
            id: Date.now(),
            name,
            cards: []
        };
        decks.push(deck);
        localStorage.setItem('flashcardDecks', JSON.stringify(decks));
        updateDeckSelect();
    }
};

const updateDeckSelect = () => {
    const select = document.getElementById('deckSelect');
    select.innerHTML = '<option value="">Select a Deck</option>';
    decks.forEach(deck => {
        const option = document.createElement('option');
        option.value = deck.id;
        option.textContent = deck.name;
        select.appendChild(option);
    });
};

document.getElementById('newDeck').addEventListener('click', createDeck);

// Meditation Timer
let meditationTimer = null;

const startMeditation = () => {
    if (!meditationTimer) {
        speak("Starting meditation session. Take a deep breath.");
        playSound(294, 1, 'sine'); // Play D4 note for 1 second
        const duration = parseInt(document.getElementById('meditationDuration').value) * 60;
        const type = document.getElementById('meditationType').value;
        let timeLeft = duration;

        document.querySelector('.meditation-setup').style.display = 'none';
        document.querySelector('.meditation-session').style.display = 'block';

        const updateDisplay = () => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            document.getElementById('meditationTimer').textContent = 
                `${minutes}:${seconds.toString().padStart(2, '0')}`;
        };

        meditationTimer = setInterval(() => {
            timeLeft--;
            updateDisplay();
            if (timeLeft === 0) {
                clearInterval(meditationTimer);
                meditationTimer = null;
                speak("Meditation session complete. Namaste!");
                playSound(440, 0.5, 'triangle'); // Play A4 note with triangle wave
                document.querySelector('.meditation-setup').style.display = 'block';
                document.querySelector('.meditation-session').style.display = 'none';
            }
        }, 1000);
    }
};

document.getElementById('startMeditation').addEventListener('click', startMeditation);

// Calorie Calculator
const calculateCalories = () => {
    const age = parseInt(document.getElementById('age').value);
    const gender = document.getElementById('gender').value;
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseInt(document.getElementById('height').value);
    const activity = parseFloat(document.getElementById('activity').value);

    if (age && weight && height) {
        let bmr;
        if (gender === 'male') {
            bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
        } else {
            bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
        }

        const maintenance = Math.round(bmr * activity);
        document.getElementById('maintenanceCalories').textContent = maintenance;
        document.getElementById('weightLossCalories').textContent = maintenance - 500;
        document.getElementById('weightGainCalories').textContent = maintenance + 500;

        document.querySelector('.calculator-results').style.display = 'grid';
    }
};

document.getElementById('calculateCalories').addEventListener('click', calculateCalories);

// Notes Management
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let currentNote = null;

const createNote = () => {
    const note = {
        id: Date.now(),
        title: 'Untitled Note',
        content: '',
        created: new Date().toISOString()
    };
    notes.unshift(note);
    currentNote = note;
    renderNotes();
    document.getElementById('noteTitle').value = note.title;
    document.getElementById('noteContent').value = note.content;
    localStorage.setItem('notes', JSON.stringify(notes));
};

const renderNotes = () => {
    const notesList = document.getElementById('notesList');
    notesList.innerHTML = '';
    notes.forEach(note => {
        const noteEl = document.createElement('div');
        noteEl.className = `note-item ${currentNote && note.id === currentNote.id ? 'active' : ''}`;
        noteEl.dataset.id = note.id;
        noteEl.innerHTML = `
            <h4>${note.title}</h4>
            <p>${new Date(note.created).toLocaleDateString()}</p>
        `;
        notesList.appendChild(noteEl);
    });
};

document.getElementById('newNote').addEventListener('click', createNote);

document.getElementById('notesList').addEventListener('click', (e) => {
    const noteItem = e.target.closest('.note-item');
    if (noteItem) {
        const id = parseInt(noteItem.dataset.id);
        currentNote = notes.find(n => n.id === id);
        document.getElementById('noteTitle').value = currentNote.title;
        document.getElementById('noteContent').value = currentNote.content;
        renderNotes();
    }
});

document.getElementById('saveNote').addEventListener('click', () => {
    if (currentNote) {
        currentNote.title = document.getElementById('noteTitle').value;
        currentNote.content = document.getElementById('noteContent').value;
        localStorage.setItem('notes', JSON.stringify(notes));
        renderNotes();
    }
});

// Stats Update
const updateStats = () => {
    const completedCount = tasks.filter(t => t.completed).length;
    document.getElementById('completedTasks').textContent = completedCount;
};

// Initialize
renderTasks();
createChart();
updateDeckSelect();
renderNotes();

// Handle Android back button
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registered');
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}

// Handle Android back button
window.addEventListener('popstate', (event) => {
    if (document.querySelector('.modal.active')) {
        closeModals();
        event.preventDefault();
        history.pushState(null, '');
    }
});

// Prevent double-tap zoom on Android
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap < DOUBLE_TAP_DELAY) {
        e.preventDefault();
    }
    lastTap = now;
}, false);

// Better touch handling for buttons
document.querySelectorAll('button, .nav-item').forEach(button => {
    button.addEventListener('touchstart', () => {
        button.classList.add('active');
    });
    
    button.addEventListener('touchend', () => {
        button.classList.remove('active');
    });
    
    // Prevent stuck active states
    button.addEventListener('touchcancel', () => {
        button.classList.remove('active');
    });
});

// Handle Android keyboard
const inputs = document.querySelectorAll('input[type="text"], input[type="number"], textarea');
inputs.forEach(input => {
    input.addEventListener('focus', () => {
        // Add a slight delay to ensure the keyboard is fully shown
        setTimeout(() => {
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    });
    
    input.addEventListener('blur', () => {
        window.scrollTo(0, 0);
    });
});
