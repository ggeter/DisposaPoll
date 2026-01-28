// DisposaPoll Frontend Application

// Pages deployment - use Worker API URL
const API_BASE = 'https://disposapoll.geterco.workers.dev/api';
let currentPollCode = null;
let currentMagicLinks = null;
let refreshInterval = null;

// Initialize app on page load
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
        currentPollCode = code;
        loadPollByCode(code);
    } else {
        showView('create');
        initializeCreateForm();
    }
});

// View Management
function showView(viewName) {
    const views = ['create-view', 'owner-view', 'taker-view', 'viewer-view', 'loading'];
    views.forEach(v => document.getElementById(v).classList.add('hidden'));
    document.getElementById(`${viewName}-view`).classList.remove('hidden');
}

function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

function showError(message) {
    document.getElementById('error-text').textContent = message;
    document.getElementById('error-message').classList.remove('hidden');
    setTimeout(() => {
        document.getElementById('error-message').classList.add('hidden');
    }, 5000);
}

// Load poll by code
async function loadPollByCode(code) {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/polls/${code}`);
        if (!response.ok) {
            throw new Error('Invalid or expired poll link');
        }

        const data = await response.json();
        hideLoading();

        switch (data.mode) {
            case 'owner':
                renderOwnerView(data.poll, code);
                break;
            case 'taker':
                renderTakerView(data.poll, code);
                break;
            case 'viewer':
                renderViewerView(data.poll, code);
                break;
        }
    } catch (error) {
        hideLoading();
        showError(error.message);
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
    }
}

// ===== CREATE POLL =====

function initializeCreateForm() {
    addQuestionToForm(); // Add initial question

    document.getElementById('add-question-btn').addEventListener('click', addQuestionToForm);
    document.getElementById('create-poll-form').addEventListener('submit', handleCreatePoll);
}

let questionCounter = 0;

function addQuestionToForm() {
    const container = document.getElementById('questions-container');
    const questionId = ++questionCounter;

    const questionDiv = document.createElement('div');
    questionDiv.className = 'border rounded-lg p-4 mb-4 bg-gray-50';
    questionDiv.id = `question-${questionId}`;
    questionDiv.innerHTML = `
        <div class="flex justify-between items-start mb-3">
            <h4 class="font-semibold">Question ${questionId}</h4>
            <button type="button" onclick="removeQuestion(${questionId})" class="text-red-500 hover:text-red-700 text-sm">Remove</button>
        </div>
        <div class="mb-3">
            <input type="text" class="question-text w-full px-3 py-2 border rounded" placeholder="Enter question" required>
        </div>
        <div class="mb-3">
            <select class="question-type w-full px-3 py-2 border rounded" onchange="handleQuestionTypeChange(${questionId})">
                <option value="single">Single Choice</option>
                <option value="multiple">Multiple Choice</option>
                <option value="text">Text Response</option>
                <option value="rating">Rating (1-5)</option>
            </select>
        </div>
        <div class="options-container">
            <label class="block text-sm font-medium mb-2">Options</label>
            <div class="options-list space-y-2">
                <input type="text" class="option-input w-full px-3 py-2 border rounded text-sm" placeholder="Option 1">
                <input type="text" class="option-input w-full px-3 py-2 border rounded text-sm" placeholder="Option 2">
            </div>
            <button type="button" onclick="addOption(${questionId})" class="mt-2 text-blue-500 hover:text-blue-700 text-sm">+ Add Option</button>
        </div>
    `;

    container.appendChild(questionDiv);
}

function removeQuestion(id) {
    const element = document.getElementById(`question-${id}`);
    if (element) element.remove();
}

function handleQuestionTypeChange(id) {
    const questionDiv = document.getElementById(`question-${id}`);
    const type = questionDiv.querySelector('.question-type').value;
    const optionsContainer = questionDiv.querySelector('.options-container');

    if (type === 'text' || type === 'rating') {
        optionsContainer.classList.add('hidden');
    } else {
        optionsContainer.classList.remove('hidden');
    }
}

function addOption(questionId) {
    const questionDiv = document.getElementById(`question-${questionId}`);
    const optionsList = questionDiv.querySelector('.options-list');
    const optionCount = optionsList.querySelectorAll('.option-input').length + 1;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'option-input w-full px-3 py-2 border rounded text-sm';
    input.placeholder = `Option ${optionCount}`;
    optionsList.appendChild(input);
}

async function handleCreatePoll(e) {
    e.preventDefault();

    const title = document.getElementById('poll-title').value;
    const description = document.getElementById('poll-description').value;

    const questions = [];
    const questionDivs = document.querySelectorAll('[id^="question-"]');

    questionDivs.forEach(div => {
        const questionText = div.querySelector('.question-text').value;
        const questionType = div.querySelector('.question-type').value;

        const question = {
            questionText,
            questionType,
        };

        if (questionType === 'single' || questionType === 'multiple') {
            const optionInputs = div.querySelectorAll('.option-input');
            question.options = Array.from(optionInputs)
                .map(input => input.value.trim())
                .filter(opt => opt);
        }

        questions.push(question);
    });

    showLoading();

    try {
        const response = await fetch(`${API_BASE}/polls`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, questions }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create poll');
        }

        const data = await response.json();
        hideLoading();

        // Redirect to owner view
        window.location.href = `/?code=${data.magicLinks.owner}`;
    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

// ===== OWNER VIEW =====

function renderOwnerView(poll, code) {
    showView('owner');

    document.getElementById('owner-poll-title').textContent = poll.title;
    document.getElementById('owner-poll-description').textContent = poll.description || '';

    if (poll.isLocked) {
        document.getElementById('owner-lock-badge').classList.remove('hidden');
    }

    // Store magic links for copying
    currentMagicLinks = {
        owner: window.location.origin + '/?code=' + code,
        viewer: '',
        taker: ''
    };

    // We need to get the viewer and taker codes - they're not returned in the poll
    // For now, show the owner link
    document.getElementById('owner-link').value = currentMagicLinks.owner;

    // Render questions
    const questionsList = document.getElementById('owner-questions-list');
    questionsList.innerHTML = poll.questions.map((q, idx) => `
        <div class="border-b pb-4 mb-4 last:border-b-0">
            <div class="font-medium mb-2">${idx + 1}. ${q.questionText}</div>
            <div class="text-sm text-gray-600">Type: ${q.questionType}</div>
            ${q.options ? `<div class="text-sm text-gray-600 mt-1">Options: ${q.options.join(', ')}</div>` : ''}
        </div>
    `).join('');

    // Event listeners
    document.getElementById('copy-poll-btn').addEventListener('click', () => handleCopyPoll(code));
    document.getElementById('delete-poll-btn').addEventListener('click', () => handleDeletePoll(code));
}

async function handleCopyPoll(code) {
    if (!confirm('Create a copy of this poll with new magic links?')) return;

    showLoading();
    try {
        const response = await fetch(`${API_BASE}/polls/${code}/copy`, {
            method: 'POST',
        });

        if (!response.ok) throw new Error('Failed to copy poll');

        const data = await response.json();
        hideLoading();

        // Redirect to new poll
        window.location.href = `/?code=${data.magicLinks.owner}`;
    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

async function handleDeletePoll(code) {
    if (!confirm('Are you sure you want to delete this poll? This cannot be undone.')) return;

    showLoading();
    try {
        const response = await fetch(`${API_BASE}/polls/${code}`, {
            method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete poll');

        hideLoading();
        alert('Poll deleted successfully');
        window.location.href = '/';
    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

function copyLink(type) {
    const input = document.getElementById(`${type}-link`);
    input.select();
    document.execCommand('copy');
    
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    setTimeout(() => {
        button.textContent = originalText;
    }, 2000);
}

// ===== TAKER VIEW =====

async function renderTakerView(poll, code) {
    // Check if already participated
    const alreadyParticipated = await checkParticipation(code);

    showView('taker');

    document.getElementById('taker-poll-title').textContent = poll.title;
    document.getElementById('taker-poll-description').textContent = poll.description || '';

    if (alreadyParticipated) {
        document.getElementById('already-submitted').classList.remove('hidden');
        document.getElementById('submit-response-form').classList.add('hidden');
        return;
    }

    const container = document.getElementById('taker-questions-container');
    container.innerHTML = poll.questions.map((q, idx) => 
        renderQuestionInput(q, idx)
    ).join('');

    document.getElementById('submit-response-form').addEventListener('submit', (e) => handleSubmitResponse(e, poll, code));
}

function renderQuestionInput(question, index) {
    let inputHTML = '';

    switch (question.questionType) {
        case 'single':
            inputHTML = question.options.map(opt => `
                <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="question-${index}" value="${opt}" class="form-radio" required>
                    <span>${opt}</span>
                </label>
            `).join('');
            break;

        case 'multiple':
            inputHTML = question.options.map(opt => `
                <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" name="question-${index}" value="${opt}" class="form-checkbox">
                    <span>${opt}</span>
                </label>
            `).join('');
            break;

        case 'text':
            inputHTML = `<textarea name="question-${index}" class="w-full px-4 py-2 border rounded-lg" rows="3" required></textarea>`;
            break;

        case 'rating':
            inputHTML = `
                <div class="flex gap-2">
                    ${[1, 2, 3, 4, 5].map(rating => `
                        <label class="flex flex-col items-center cursor-pointer">
                            <input type="radio" name="question-${index}" value="${rating}" class="form-radio mb-1" required>
                            <span class="text-sm">${rating}</span>
                        </label>
                    `).join('')}
                </div>
            `;
            break;
    }

    return `
        <div class="border-b pb-6 mb-6">
            <div class="font-medium mb-4">${index + 1}. ${question.questionText}</div>
            <div class="space-y-2" data-question-id="${question.id}" data-question-type="${question.questionType}">
                ${inputHTML}
            </div>
        </div>
    `;
}

async function checkParticipation(code) {
    try {
        const response = await fetch(`${API_BASE}/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pollCode: code }),
        });

        if (response.ok) {
            const data = await response.json();
            return data.alreadyParticipated;
        }
    } catch (error) {
        return false;
    }
    return false;
}

async function handleSubmitResponse(e, poll, code) {
    e.preventDefault();

    const answers = [];
    const container = document.getElementById('taker-questions-container');
    const questionDivs = container.querySelectorAll('[data-question-id]');

    questionDivs.forEach(div => {
        const questionId = div.dataset.questionId;
        const questionType = div.dataset.questionType;
        let value;

        switch (questionType) {
            case 'single':
            case 'rating':
                const radio = div.querySelector('input[type="radio"]:checked');
                value = radio ? (questionType === 'rating' ? parseInt(radio.value) : radio.value) : null;
                break;

            case 'multiple':
                const checkboxes = div.querySelectorAll('input[type="checkbox"]:checked');
                value = Array.from(checkboxes).map(cb => cb.value);
                break;

            case 'text':
                const textarea = div.querySelector('textarea');
                value = textarea ? textarea.value : '';
                break;
        }

        answers.push({
            questionId,
            answerValue: {
                type: questionType,
                value,
            },
        });
    });

    showLoading();

    try {
        const response = await fetch(`${API_BASE}/responses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pollCode: code, answers }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to submit response');
        }

        hideLoading();

        // Show thank you message
        document.getElementById('submit-response-form').classList.add('hidden');
        document.getElementById('thank-you-message').classList.remove('hidden');

        // Generate QR code for sharing
        generateQRCode(`${window.location.origin}/?code=${code}`, 'share-qr');
    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

// ===== VIEWER VIEW =====

async function renderViewerView(poll, code) {
    showView('viewer');

    document.getElementById('viewer-poll-title').textContent = poll.title;
    document.getElementById('viewer-poll-description').textContent = poll.description || '';

    await loadAndDisplayResults(code);

    // Auto-refresh every 5 seconds
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => loadAndDisplayResults(code), 5000);
}

async function loadAndDisplayResults(code) {
    try {
        const response = await fetch(`${API_BASE}/results/${code}`);
        if (!response.ok) throw new Error('Failed to load results');

        const results = await response.json();

        document.getElementById('total-responses').textContent = results.totalResponses;

        const container = document.getElementById('results-container');
        container.innerHTML = results.questionResults.map(qr => 
            renderQuestionResult(qr)
        ).join('');
    } catch (error) {
        console.error('Failed to load results:', error);
    }
}

function renderQuestionResult(questionResult) {
    let chartHTML = '';

    switch (questionResult.questionType) {
        case 'single':
            chartHTML = renderSingleChoiceChart(questionResult.results.singleChoice);
            break;
        case 'multiple':
            chartHTML = renderMultipleChoiceChart(questionResult.results.multipleChoice);
            break;
        case 'text':
            chartHTML = renderTextResponses(questionResult.results.text);
            break;
        case 'rating':
            chartHTML = renderRatingChart(questionResult.results.rating);
            break;
    }

    return `
        <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-lg font-semibold mb-4">${questionResult.questionText}</h3>
            ${chartHTML}
        </div>
    `;
}

function renderSingleChoiceChart(data) {
    if (!data || !data.optionCounts) return '<p class="text-gray-500">No responses yet</p>';

    return Object.entries(data.optionCounts).map(([option, count]) => {
        const percentage = data.percentages[option] || 0;
        return `
            <div class="mb-4">
                <div class="flex justify-between mb-1">
                    <span class="text-sm font-medium">${option}</span>
                    <span class="text-sm text-gray-600">${count} (${percentage.toFixed(1)}%)</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-4">
                    <div class="bg-blue-600 h-4 rounded-full transition-all duration-300" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

function renderMultipleChoiceChart(data) {
    if (!data || !data.optionCounts) return '<p class="text-gray-500">No responses yet</p>';

    const maxCount = Math.max(...Object.values(data.optionCounts));

    return Object.entries(data.optionCounts).map(([option, count]) => {
        const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
        return `
            <div class="mb-4">
                <div class="flex justify-between mb-1">
                    <span class="text-sm font-medium">${option}</span>
                    <span class="text-sm text-gray-600">${count}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-4">
                    <div class="bg-purple-600 h-4 rounded-full transition-all duration-300" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

function renderTextResponses(data) {
    if (!data || !data.responses || data.responses.length === 0) {
        return '<p class="text-gray-500">No responses yet</p>';
    }

    return `
        <div class="space-y-2 max-h-96 overflow-y-auto">
            ${data.responses.map(response => `
                <div class="bg-gray-50 p-3 rounded border">
                    <p class="text-sm">${response}</p>
                </div>
            `).join('')}
        </div>
    `;
}

function renderRatingChart(data) {
    if (!data || !data.distribution) return '<p class="text-gray-500">No responses yet</p>';

    const maxCount = Math.max(...Object.values(data.distribution));

    return `
        <div class="mb-6">
            <div class="text-3xl font-bold text-center text-blue-600 mb-4">
                ${data.average.toFixed(1)} / 5.0
            </div>
            <div class="flex items-end justify-between h-40 gap-2">
                ${[1, 2, 3, 4, 5].map(rating => {
                    const count = data.distribution[rating] || 0;
                    const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    return `
                        <div class="flex-1 flex flex-col items-center">
                            <div class="text-sm font-medium mb-1">${count}</div>
                            <div class="w-full bg-blue-600 rounded-t transition-all duration-300" style="height: ${height}%"></div>
                            <div class="text-xs mt-1 font-medium">${rating}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// ===== QR CODE GENERATION =====

function generateQRCode(text, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    QRCode.toCanvas(text, { width: 200 }, (error, canvas) => {
        if (error) console.error(error);
        container.appendChild(canvas);
    });
}
