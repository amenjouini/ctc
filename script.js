document.addEventListener('DOMContentLoaded', () => {
    // --- Game State Variables ---
    let mySecretCode = []; // Player's own code (can be set via modal)
    const opponentSecretCode = ['7', '8', '9', '5']; // FIXED Opponent's code for testing
    let currentGuess = ["", "", "", ""];
    let activePlayerInputIndex = 0; // For numpad input logic for player's guess
    let gameStarted = false;
    let gameOver = false;

    // --- UI Elements ---
    const modal = document.getElementById('set-code-modal');
    const modalCodeInputs = Array.from(document.querySelectorAll('#set-code-modal .modal-code-input'));
    const confirmCodeButton = document.getElementById('confirm-code-button');
    const modalError = document.getElementById('modal-error');
    const modalNumberPadContainer = document.getElementById('modal-number-pad');

    const playerSecretCodeDisplay = Array.from(document.querySelectorAll('#player-secret-code-display input'));
    const currentGuessInputs = Array.from(document.querySelectorAll('#current-guess-input-area .guess-input-player'));
    const submitGuessButton = document.getElementById('submit-guess-button');
    const clearGuessButton = document.getElementById('clear-guess-button');
    const gameNumberPadContainer = document.getElementById('game-number-pad');

    const guessesHistoryList = document.getElementById('guesses-history-list');
    const vFeedbackList = document.getElementById('v-feedback-list');
    const tFeedbackList = document.getElementById('t-feedback-list');
    // Opponent's guess display is not actively used in this local test of guessing opponent's code
    // const opponentGuessDisplayInputs = Array.from(document.querySelectorAll('#opponent-guess-display input'));
// --- Synchronized Scrolling ---
    let isSyncingScroll = false; // Flag to prevent recursive scroll events

    function syncScroll(sourceElement, targetElements) {
        if (isSyncingScroll) return;
        isSyncingScroll = true;

        const scrollTop = sourceElement.scrollTop;
        targetElements.forEach(target => {
            if (target.scrollTop !== scrollTop) {
                target.scrollTop = scrollTop;
            }
        });

        // Allow a very brief moment for scroll to apply before resetting flag
        requestAnimationFrame(() => {
            isSyncingScroll = false;
        });
    }

    guessesHistoryList.addEventListener('scroll', () => {
        syncScroll(guessesHistoryList, [vFeedbackList, tFeedbackList]);
    });

    vFeedbackList.addEventListener('scroll', () => {
        syncScroll(vFeedbackList, [guessesHistoryList, tFeedbackList]);
    });

    tFeedbackList.addEventListener('scroll', () => {
        syncScroll(tFeedbackList, [guessesHistoryList, vFeedbackList]);
    });
    // --- Initialize Number Pads ---
// --- Initialize Number Pads ---
let currentIndex = 1;

function handleImageInput(imgElement) {
    if (currentIndex > 4) return; // max 4 digits

    const targetImg = document.getElementById(`modal-code-${currentIndex}`);
    targetImg.src = imgElement.src; // Set the image
    targetImg.alt = imgElement.alt;
    currentIndex++;
}

    function createNumberPad(container, onInput, onClear) {
        container.innerHTML = ''; // Clear previous if any
        const imagePath = './assets/'; // Path to your numpad images

        for (let i = 0; i <= 9; i++) {
            const btn = document.createElement('button');
            btn.dataset.value = i.toString(); // Store the numeric value

            const img = document.createElement('img');
            img.src = `${imagePath}${i}.png`;
            img.alt = `Number ${i}`; // Alt text for accessibility

            btn.appendChild(img);
            btn.addEventListener('click', () => onInput(img));
            container.appendChild(btn);
        }

        if (onClear) {
            const clearBtn = document.createElement('button');
            clearBtn.textContent = 'CLR'; // You can also use an image for CLR
            // Example styling if CLR button is wider:
            // clearBtn.style.gridColumn = 'span 2'; // If its parent is a grid and needs spanning
            clearBtn.style.minWidth = '60px'; // Or just make it wider
            clearBtn.style.fontSize = '1em'; // Adjust if text looks too big/small
            clearBtn.addEventListener('click', onClear);
            container.appendChild(clearBtn);
        }
    }

    createNumberPad(document.getElementById('modal-number-pad'), handleImageInput, () => {
    // Clear function if needed
    for (let i = 1; i <= 4; i++) {
        const img = document.getElementById(`modal-code-${i}`);
        img.src = '';
        img.alt = '';
    }
    currentIndex = 1;
});

    // createNumberPad(modalNumberPadContainer, handleModalNumpadInput, clearModalInputs);
    // createNumberPad(gameNumberPadContainer, handleGameNumpadInputForPlayerGuess);

    // --- Modal Logic (Setting Player's Secret Code) ---
    let currentModalInputFocusIndex = 0;
    modalCodeInputs.forEach((input, index) => {
        input.addEventListener('focus', () => currentModalInputFocusIndex = index);
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && /^\d$/.test(e.target.value)) {
                if (index < modalCodeInputs.length - 1) {
                    modalCodeInputs[index + 1].focus();
                }
            } else if (e.target.value.length > 0) {
                e.target.value = e.target.value.slice(0, 1);
            }
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === "Backspace" && index > 0 && e.target.value === "") {
                modalCodeInputs[index - 1].focus();
            } else if (!/^\d$/.test(e.key) && e.key !== "Backspace" && e.key !== "Tab" && !e.key.includes("Arrow") && e.key !== "Delete" && !e.ctrlKey) {
                e.preventDefault();
            }
        });
    });

    function handleModalNumpadInput(digit) {
        modalCodeInputs[currentModalInputFocusIndex].value = digit;
        if (currentModalInputFocusIndex < modalCodeInputs.length - 1) {
            modalCodeInputs[currentModalInputFocusIndex + 1].focus();
        } else {
            modalCodeInputs[currentModalInputFocusIndex].focus();
        }
    }

    function clearModalInputs() {
        modalCodeInputs.forEach(input => input.value = '');
        modalCodeInputs[0].focus();
        modalError.textContent = "";
    }

    function showSetCodeModal() {
        modal.style.display = 'flex';
        clearModalInputs();
    }

    function hideSetCodeModal() {
        modal.style.display = 'none';
    }

    function validateCodeArray(codeArray) {
        return codeArray.length === 4 && codeArray.every(digit => digit !== "" && /^\d$/.test(digit));
    }

    confirmCodeButton.addEventListener('click', () => {
        const tempCode = modalCodeInputs.map(input => input.value);
        if (validateCodeArray(tempCode)) {
            mySecretCode = [...tempCode];
            modalError.textContent = "";
            hideSetCodeModal();
            displayMySecretCode();
            console.log("My code set to:", mySecretCode);
            // Start the game flow after player sets their code
            initializeGameAgainstBot();
        } else {
            modalError.textContent = "Please enter a valid 4-digit code.";
        }
    });

    function displayMySecretCode() {
        mySecretCode.forEach((digit, index) => {
            playerSecretCodeDisplay[index].value = digit;
        });
    }

    // --- Game Play Logic (Guessing Opponent's Code) ---
    function initializeGameAgainstBot() {
        gameStarted = true;
        gameOver = false;
        document.getElementById('ui-opponent-name').textContent = "Test Opponent"; // Set opponent name
        document.getElementById('ui-opponent-name-guess').textContent = "Test Opponent";

        guessesHistoryList.innerHTML = '';
        vFeedbackList.innerHTML = '';
        tFeedbackList.innerHTML = '';
        clearCurrentGuessDisplay();
        updateGameControlsState();
        console.log(`Game started. Try to guess the opponent's code: ${opponentSecretCode.join('')} (for testing)`);
        currentGuessInputs[0].focus(); // Focus the first input for player's guess
    }

    function updateGameControlsState() {
        const enableControls = gameStarted && !gameOver;
        submitGuessButton.disabled = !enableControls;
        clearGuessButton.disabled = !enableControls;
        gameNumberPadContainer.querySelectorAll('button').forEach(btn => btn.disabled = !enableControls);

        currentGuessInputs.forEach((input, idx) => {
            input.readOnly = !enableControls; // Make inputs editable only when game is active
            if (enableControls) {
                input.parentElement.classList.add('current-guess-row'); // Add red border
            } else {
                input.parentElement.classList.remove('current-guess-row'); // Remove red border
            }
        });
    }

    // Handle focus for numpad input
    currentGuessInputs.forEach((input, idx) => {
        input.addEventListener('focus', () => {
            activePlayerInputIndex = idx;
            input.classList.add('active-input'); // Optional: for distinct focus style
        });
        input.addEventListener('blur', () => {
            input.classList.remove('active-input');
        });
        // Manual input and navigation for testing if needed
        input.addEventListener('input', (e) => {
            currentGuess[idx] = e.target.value;
            if (e.target.value.length === 1 && /^\d$/.test(e.target.value)) {
                if (idx < currentGuessInputs.length - 1) {
                    currentGuessInputs[idx + 1].focus();
                }
            } else if (e.target.value.length > 0) {
                 e.target.value = e.target.value.slice(0,1);
            }
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === "Backspace" && idx > 0 && e.target.value === "") {
                 currentGuessInputs[idx - 1].focus();
            } else if (e.key === "Enter") {
                submitPlayerGuess();
            }
        });
    });

    function handleGameNumpadInputForPlayerGuess(digit) {
        if (!gameStarted || gameOver) return;

        currentGuessInputs[activePlayerInputIndex].value = digit;
        currentGuess[activePlayerInputIndex] = digit; // Update internal array

        // Auto-advance to the next input field
        if (activePlayerInputIndex < currentGuessInputs.length - 1) {
            activePlayerInputIndex++;
            currentGuessInputs[activePlayerInputIndex].focus();
        } else {
            // Stay on the last input or move focus to submit button (optional)
            currentGuessInputs[activePlayerInputIndex].focus();
        }
    }

    function clearCurrentGuessDisplay() {
        currentGuess = ["", "", "", ""];
        currentGuessInputs.forEach(input => input.value = "");
        activePlayerInputIndex = 0;
        if (gameStarted && !gameOver) {
            currentGuessInputs[0].focus();
        }
    }
    clearGuessButton.addEventListener('click', clearCurrentGuessDisplay);

    submitGuessButton.addEventListener('click', submitPlayerGuess);

    function submitPlayerGuess() {
        if (!gameStarted || gameOver) return;

        const playerGuessArray = currentGuessInputs.map(input => input.value);

        if (!validateCodeArray(playerGuessArray)) {
            alert("Please enter a complete 4-digit guess using the number pad.");
            return;
        }

        console.log("Player guesses:", playerGuessArray);
        const feedback = calculateFeedback(playerGuessArray, opponentSecretCode);
        console.log("Feedback:", feedback);

        addGuessToHistoryUI(playerGuessArray, feedback.v, feedback.t);

        if (feedback.t === 4) {
            handleGameWin();
        } else {
            clearCurrentGuessDisplay(); // Prepare for next guess
        }
    }

    function calculateFeedback(guess, secret) {
        let t = 0; // Taureaux (Bulls) - correct digit, correct position
        let v = 0; // Vaches (Cows) - correct digit, wrong position

        const n = secret.length;
        const tempGuess = [...guess];
        const tempSecret = [...secret];
        const secretDigitCounts = {};

        // First pass: Calculate Taureaux (Bulls)
        for (let i = 0; i < n; i++) {
            if (tempGuess[i] === tempSecret[i]) {
                t++;
                tempGuess[i] = null;  // Mark as checked for T
                tempSecret[i] = null; // Mark as checked for T
            }
        }

        // Prepare counts for Vaches calculation from remaining (non-Taureau) secret digits
        for (let i = 0; i < n; i++) {
            if (tempSecret[i] !== null) {
                secretDigitCounts[tempSecret[i]] = (secretDigitCounts[tempSecret[i]] || 0) + 1;
            }
        }
        
        // Calculate Vaches (Cows) from remaining (non-Taureau) guess digits
        for (let i = 0; i < n; i++) {
            if (tempGuess[i] !== null && secretDigitCounts[tempGuess[i]] && secretDigitCounts[tempGuess[i]] > 0) {
                v++;
                secretDigitCounts[tempGuess[i]]--; // Decrement count to avoid overcounting for V
            }
        }
        return { v, t };
    }

    function addGuessToHistoryUI(guessArray, vCount, tCount) {
        // Row for Guesses Column
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        const guessBoxesDiv = document.createElement('div');
        guessBoxesDiv.className = 'guess-boxes';
        guessArray.forEach(digit => {
            const span = document.createElement('span');
            span.textContent = digit;
            guessBoxesDiv.appendChild(span);
        });
        historyItem.appendChild(guessBoxesDiv);
        guessesHistoryList.appendChild(historyItem);
        guessesHistoryList.scrollTop = guessesHistoryList.scrollHeight;

        // V feedback
        const vItem = document.createElement('div');
        vItem.textContent = vCount;
        vFeedbackList.appendChild(vItem);
        vFeedbackList.scrollTop = vFeedbackList.scrollHeight;

        // T feedback
        const tItem = document.createElement('div');
        tItem.textContent = tCount;
        tFeedbackList.appendChild(tItem);
        tFeedbackList.scrollTop = tFeedbackList.scrollHeight;
    }

    function handleGameWin() {
        gameOver = true;
        updateGameControlsState();
        alert(`Congratulations! You cracked the code: ${opponentSecretCode.join('')}`);
        // TODO: Add a "Play Again" button or similar functionality
    }

    // --- Initial Setup ---
    updateGameControlsState(); // Initial state (controls disabled)
    showSetCodeModal(); // Start by asking player to set their own code.
                       // The game against the bot will start after this.

    // Example: If you want to bypass player setting their code for quick testing:
    // mySecretCode = ['1', '2', '3', '4']; displayMySecretCode(); initializeGameAgainstBot();
});