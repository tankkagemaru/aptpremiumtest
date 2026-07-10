// Enhanced Grammar & Vocabulary Test with Session Integration
// Compatible with QUESTION_BANK structure

class GrammarTest {
    constructor() {
        this.totalQuestions = 25;
        this.multipleChoiceCount = 20;
        this.dropdownCount = 5;
        this.currentQuestionIndex = 0;
        this.selectedQuestions = [];
        this.userAnswers = [];
        this.bookmarkedQuestions = new Set();
        this.startTime = null;
        this.timerDuration = 30 * 60; // 30 minutes in seconds
        this.timerInterval = null;
        this.remainingTime = this.timerDuration;
        
        // Get student info from session (no modal needed)
        const session = sessionManager.getStudentInfo();
        if (!session) {
            alert('Session expired. Please login again.');
            window.location.href = '../../index.html';
            return;
        }
        
        this.studentInfo = {
            name: session.name,
            email: session.email,
            studentId: session.studentIdNumber,
            testDate: new Date().toLocaleDateString('en-GB'),
            testTime: new Date().toLocaleTimeString('en-GB')
        };
        this.testId = '';
        
        this.init();
    }

    init() {
        // Display student name in navigation
        const nameElement = document.getElementById('student-display-name');
        if (nameElement) {
            nameElement.textContent = this.studentInfo.name;
        }
        
        // Start test immediately (no modal)
        this.startTest();
    }

    startTest() {
        // Generate test ID
        this.testId = this.generateTestId();
        
        // Show test interface
        document.getElementById('test-container').style.display = 'block';
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.style.display = 'block';
        }
        
        // Initialize test
        this.selectRandomQuestions();
        this.createQuestionNavigator();
        this.startTimer();
        this.loadQuestion();
        this.setupEventListeners();
    }

    generateTestId() {
        const session = sessionManager.getStudentInfo();
        const timestamp = Date.now();
        const randomNum = Math.floor(Math.random() * 1000);
        return `GRAM-${session.studentId.substring(0,8)}-${timestamp}-${randomNum}`;
    }

    selectRandomQuestions() {
        // Get questions from QUESTION_BANK
        const mcQuestions = QUESTION_BANK.multipleChoice;
        const dropdownQuestions = QUESTION_BANK.dropdown;

        // Shuffle function
        const shuffle = (array) => {
            const newArray = [...array];
            for (let i = newArray.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
            }
            return newArray;
        };

        // Select random questions
        const selectedMC = shuffle(mcQuestions).slice(0, this.multipleChoiceCount);
        const selectedDropdown = shuffle(dropdownQuestions).slice(0, this.dropdownCount);

        // Combine and shuffle all selected questions
        this.selectedQuestions = shuffle([...selectedMC, ...selectedDropdown]);
        
        // Initialize user answers array
        this.userAnswers = new Array(this.totalQuestions).fill(null);
    }

    loadQuestion() {
        const question = this.selectedQuestions[this.currentQuestionIndex];
        const questionContent = document.getElementById('question-content');
        
        // Update question number
        document.getElementById('question-number').textContent = 
            `Question ${this.currentQuestionIndex + 1} of ${this.totalQuestions}`;

        // Render question based on type
        if (question.type === 'multiple-choice') {
            questionContent.innerHTML = this.renderMultipleChoice(question);
        } else if (question.type === 'synonym' || question.type === 'definition' || 
                   question.type === 'sentence' || question.type === 'collocation' || 
                   question.type === 'word-family') {
            questionContent.innerHTML = this.renderDropdown(question);
        }

        // Restore previous answer if exists
        this.restoreAnswer();
        
        // Update navigation buttons
        this.updateNavigationButtons();
        
        // Update bookmark button state
        this.updateBookmarkButton();
    }

    renderMultipleChoice(question) {
        const currentAnswer = this.userAnswers[this.currentQuestionIndex];
        
        let html = `
            <div class="question">
                <p class="question-text">${question.text}</p>
                <div class="options">
        `;

        question.options.forEach(option => {
            const isChecked = currentAnswer === option.label ? 'checked' : '';
            html += `
                <label class="option">
                    <input type="radio" name="answer" value="${option.label}" ${isChecked}>
                    <span class="option-label">${option.label}</span>
                    <span class="option-text">${option.text}</span>
                </label>
            `;
        });

        html += `
                </div>
            </div>
        `;

        return html;
    }

    renderDropdown(question) {
        const currentAnswer = this.userAnswers[this.currentQuestionIndex];
        
        let html = `
            <div class="question">
                <p class="question-text">${question.text}</p>
                <div class="dropdown-questions">
        `;

        // Render each item in the dropdown question
        question.items.forEach((item, index) => {
            const itemAnswer = currentAnswer && currentAnswer[index] ? currentAnswer[index] : '';
            
            html += `
                <div class="dropdown-item">
                    <span class="dropdown-prompt">${item.text}</span>
                    <select name="answer-${index}" class="dropdown-select" data-index="${index}">
                        <option value="">-- Select --</option>
            `;

            item.options.forEach(option => {
                const isSelected = itemAnswer === option ? 'selected' : '';
                html += `<option value="${option}" ${isSelected}>${option}</option>`;
            });

            html += `
                    </select>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        return html;
    }

    restoreAnswer() {
        const currentAnswer = this.userAnswers[this.currentQuestionIndex];
        if (!currentAnswer) return;

        const question = this.selectedQuestions[this.currentQuestionIndex];
        
        if (question.type === 'multiple-choice') {
            const radio = document.querySelector(`input[value="${currentAnswer}"]`);
            if (radio) radio.checked = true;
        } else {
            // Dropdown questions - restore all answers
            if (Array.isArray(currentAnswer)) {
                currentAnswer.forEach((answer, index) => {
                    const select = document.querySelector(`select[name="answer-${index}"]`);
                    if (select && answer) {
                        select.value = answer;
                    }
                });
            }
        }
    }

    saveAnswer() {
        const question = this.selectedQuestions[this.currentQuestionIndex];
        
        if (question.type === 'multiple-choice') {
            const selected = document.querySelector('input[name="answer"]:checked');
            this.userAnswers[this.currentQuestionIndex] = selected ? selected.value : null;
        } else {
            // Dropdown questions - save all answers
            const selects = document.querySelectorAll('.dropdown-select');
            const answers = [];
            selects.forEach(select => {
                answers.push(select.value || null);
            });
            this.userAnswers[this.currentQuestionIndex] = answers;
        }
        
        this.updateQuestionNavigator();
    }

    createQuestionNavigator() {
        const grid = document.getElementById('question-nav-grid');
        grid.innerHTML = '';

        for (let i = 0; i < this.totalQuestions; i++) {
            const btn = document.createElement('button');
            btn.textContent = i + 1;
            btn.className = 'nav-number';
            btn.onclick = () => this.jumpToQuestion(i);
            grid.appendChild(btn);
        }

        this.updateQuestionNavigator();
    }

    updateQuestionNavigator() {
        const buttons = document.querySelectorAll('.nav-number');
        buttons.forEach((btn, index) => {
            btn.className = 'nav-number';
            
            if (index === this.currentQuestionIndex) {
                btn.classList.add('current');
            }
            if (this.userAnswers[index] !== null) {
                btn.classList.add('answered');
            }
            if (this.bookmarkedQuestions.has(index)) {
                btn.classList.add('bookmarked');
            }
        });
    }

    jumpToQuestion(index) {
        this.saveAnswer();
        this.currentQuestionIndex = index;
        this.loadQuestion();
    }

    nextQuestion() {
        this.saveAnswer();
        if (this.currentQuestionIndex < this.totalQuestions - 1) {
            this.currentQuestionIndex++;
            this.loadQuestion();
        }
    }

    previousQuestion() {
        this.saveAnswer();
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.loadQuestion();
        }
    }

    toggleBookmark() {
        if (this.bookmarkedQuestions.has(this.currentQuestionIndex)) {
            this.bookmarkedQuestions.delete(this.currentQuestionIndex);
        } else {
            this.bookmarkedQuestions.add(this.currentQuestionIndex);
        }
        this.updateBookmarkButton();
        this.updateQuestionNavigator();
    }

    updateBookmarkButton() {
        const btn = document.getElementById('bookmark-btn');
        if (this.bookmarkedQuestions.has(this.currentQuestionIndex)) {
            btn.textContent = '📚 Bookmarked';
            btn.classList.add('active');
        } else {
            btn.textContent = '📚 Bookmark';
            btn.classList.remove('active');
        }
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const submitBtn = document.getElementById('submit-btn');

        prevBtn.disabled = this.currentQuestionIndex === 0;
        
        if (this.currentQuestionIndex === this.totalQuestions - 1) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'block';
        } else {
            nextBtn.style.display = 'block';
            submitBtn.style.display = 'none';
        }
    }

    startTimer() {
        this.startTime = Date.now();
        this.updateTimerDisplay();
        
        this.timerInterval = setInterval(() => {
            this.remainingTime--;
            this.updateTimerDisplay();
            
            if (this.remainingTime <= 0) {
                this.submitTest();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.remainingTime / 60);
        const seconds = this.remainingTime % 60;
        document.getElementById('timer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    submitTest() {
        this.saveAnswer();
        
        if (confirm('Are you sure you want to submit the test?')) {
            clearInterval(this.timerInterval);
            this.showResults();
        }
    }

    checkAnswer(question, userAnswer) {
        if (question.type === 'multiple-choice') {
            const correctOption = question.options.find(opt => opt.correct);
            return userAnswer === correctOption.label;
        } else {
            // Dropdown questions - check all items
            if (!Array.isArray(userAnswer)) return false;
            
            let allCorrect = true;
            question.items.forEach((item, index) => {
                if (userAnswer[index] !== item.correct) {
                    allCorrect = false;
                }
            });
            return allCorrect;
        }
    }

    showResults() {
        clearInterval(this.timerInterval);
        
        // Calculate results
        const correctAnswers = this.userAnswers.filter((answer, index) => {
            const question = this.selectedQuestions[index];
            return this.checkAnswer(question, answer);
        }).length;

        const percentage = Math.round((correctAnswers / this.totalQuestions) * 100);
        const timeTaken = this.timerDuration - this.remainingTime;

        // Save to test history
        this.saveTestToHistory(correctAnswers, this.totalQuestions);

        // Display results
        document.getElementById('result-student-name').textContent = this.studentInfo.name;
        document.getElementById('result-test-id').textContent = this.testId;
        document.getElementById('result-date').textContent = this.studentInfo.testDate;
        document.getElementById('result-time').textContent = this.studentInfo.testTime;
        document.getElementById('percentage').textContent = `${percentage}%`;
        document.getElementById('correct-answers').textContent = correctAnswers;
        document.getElementById('time-taken').textContent = this.formatTime(timeTaken);

        // Show detailed results
        this.showDetailedResults();

        // Show results modal
        document.getElementById('results-modal').style.display = 'block';
        document.getElementById('test-container').style.display = 'none';
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.style.display = 'none';
    }

    showDetailedResults() {
        const detailedResults = document.getElementById('detailed-results');
        let html = '<h3>Detailed Results</h3><div class="results-list">';

        this.selectedQuestions.forEach((question, index) => {
            const userAnswer = this.userAnswers[index];
            const isCorrect = this.checkAnswer(question, userAnswer);

            let correctAnswerText = '';
            let userAnswerText = '';

            if (question.type === 'multiple-choice') {
                const correctOption = question.options.find(opt => opt.correct);
                correctAnswerText = `${correctOption.label}: ${correctOption.text}`;
                const userOption = question.options.find(opt => opt.label === userAnswer);
                userAnswerText = userOption ? `${userOption.label}: ${userOption.text}` : 'Not answered';
            } else {
                correctAnswerText = question.items.map(item => `${item.text} ${item.correct}`).join(', ');
                userAnswerText = userAnswer ? userAnswer.join(', ') : 'Not answered';
            }

            const statusClass = isCorrect ? 'correct' : 'incorrect';
            const statusIcon = isCorrect ? '✓' : '✗';

            html += `
                <div class="result-item ${statusClass}">
                    <div class="result-header">
                        <span class="question-num">Q${index + 1}</span>
                        <span class="status-icon">${statusIcon}</span>
                    </div>
                    <p class="question-text">${question.text}</p>
                    <p class="answer-info">
                        Your answer: <strong>${userAnswerText}</strong><br>
                        Correct answer: <strong>${correctAnswerText}</strong>
                    </p>
                </div>
            `;
        });

        html += '</div>';
        detailedResults.innerHTML = html;
    }

    saveTestToHistory(correctAnswers, totalQuestions) {
        const percentage = Math.round((correctAnswers / totalQuestions) * 100);
        const timeTaken = this.timerDuration - this.remainingTime;
        
        const testData = {
            testType: 'grammar',
            testId: this.testId,
            date: new Date().toLocaleDateString('en-GB'),
            time: new Date().toLocaleTimeString('en-GB'),
            score: `${correctAnswers}/${totalQuestions}`,
            totalQuestions: totalQuestions,
            percentage: percentage,
            duration: this.formatTime(timeTaken),
            status: 'completed'
        };
        
        sessionManager.saveTestAttempt(testData);
    }

    returnToDashboard() {
        if (confirm('Are you sure you want to return to dashboard? Your progress will be lost.')) {
            window.location.href = '../../dashboard.html';
        }
    }

    setupEventListeners() {
        // Navigation buttons
        document.getElementById('prev-btn').addEventListener('click', () => this.previousQuestion());
        document.getElementById('next-btn').addEventListener('click', () => this.nextQuestion());
        document.getElementById('submit-btn').addEventListener('click', () => this.submitTest());
        document.getElementById('bookmark-btn').addEventListener('click', () => this.toggleBookmark());

        // Auto-save on answer change
        document.addEventListener('change', (e) => {
            if (e.target.matches('input[name="answer"], select.dropdown-select')) {
                this.saveAnswer();
            }
        });
    }
}

// Email and download functions
// Real Email Implementation with EmailJS
function emailResults(event) {
    if (event) event.preventDefault();
    
    // Calculate results
    const correctAnswers = test.userAnswers.filter((answer, index) => {
        const question = test.selectedQuestions[index];
        return test.checkAnswer(question, answer);
    }).length;
    const percentage = Math.round((correctAnswers / test.totalQuestions) * 100);
    const timeTaken = test.formatTime(test.timerDuration - test.remainingTime);
    
    // Show loading message
    const loadingMsg = showMessage('Sending email...', 'info');
    
    // Prepare email data
    const emailData = {
        to_email: test.studentInfo.email,
        student_name: test.studentInfo.name,
        student_id: test.studentInfo.studentId,
        test_id: test.testId,
        test_date: test.studentInfo.testDate,
        test_time: test.studentInfo.testTime,
        score: `${correctAnswers}/${test.totalQuestions}`,
        percentage: `${percentage}%`,
        time_taken: timeTaken
    };
    
    // Send email using EmailJS
    emailjs.send(
        'service_wiqggep',
        'template_bv8hbow',
        emailData
    ).then(
        function(response) {
            console.log('SUCCESS!', response.status, response.text);
            loadingMsg.remove();
            showMessage('✅ Email sent successfully to ' + test.studentInfo.email, 'success');
        },
        function(error) {
            console.error('FAILED...', error);
            loadingMsg.remove();
            showMessage('❌ Failed to send email: ' + error.text, 'error');
        }
    );
}
// Helper function to show styled messages
// Real PDF Download Implementation with jsPDF
function downloadReport(event) {
    if (event) event.preventDefault();
    
    // Show loading message
    const loadingMsg = showMessage('Generating PDF...', 'info');
    
    try {
        // Access jsPDF from window
        const { jsPDF } = window.jspdf;
        
        if (!jsPDF) {
            throw new Error('jsPDF library not loaded. Please refresh the page.');
        }
        
        const doc = new jsPDF();
        
        // Calculate results
        const correctAnswers = test.userAnswers.filter((answer, index) => {
            const question = test.selectedQuestions[index];
            return test.checkAnswer(question, answer);
        }).length;
        const percentage = Math.round((correctAnswers / test.totalQuestions) * 100);
        const timeTaken = test.formatTime(test.timerDuration - test.remainingTime);
        
        // PDF Header - Teal background
        doc.setFillColor(33, 128, 141);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text('Grammar & Vocabulary Test Results', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text('UPSI Language Assessment', 105, 30, { align: 'center' });
        
        // Reset text color to black
        doc.setTextColor(0, 0, 0);
        
        // Student Information Section
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Student Information', 20, 55);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(11);
        doc.text('Name: ' + test.studentInfo.name, 20, 65);
        doc.text('Student ID: ' + test.studentInfo.studentId, 20, 72);
        doc.text('Test ID: ' + test.testId, 20, 79);
        doc.text('Date: ' + test.studentInfo.testDate, 20, 86);
        doc.text('Time: ' + test.studentInfo.testTime, 20, 93);
        
        // Test Results Box
        doc.setFillColor(240, 240, 240);
        doc.roundedRect(20, 105, 170, 40, 3, 3, 'F');
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Test Results', 25, 115);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(11);
        doc.text('Score: ' + correctAnswers + ' / ' + test.totalQuestions, 25, 125);
        doc.text('Percentage: ' + percentage + '%', 25, 132);
        doc.text('Time Taken: ' + timeTaken, 25, 139);
        
        // Detailed Results Section
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Detailed Results', 20, 160);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        
        let yPos = 170;
        test.selectedQuestions.forEach((question, index) => {
            // Check if need new page
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            
            const isCorrect = test.checkAnswer(question, test.userAnswers[index]);
            const userAnswer = test.userAnswers[index];
            
            // Question number and status
            doc.setFont(undefined, 'bold');
            if (isCorrect) {
                doc.setTextColor(33, 128, 141); // Teal for correct
            } else {
                doc.setTextColor(192, 21, 47); // Red for incorrect
            }
            doc.text('Q' + (index + 1) + '  ' + (isCorrect ? '\u2713' : '\u2717'), 20, yPos);
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');
            
            // Question text (truncate if too long)
            let questionText = question.text;
            if (questionText.length > 80) {
                questionText = questionText.substring(0, 80) + '...';
            }
            doc.text(questionText, 20, yPos + 5);
            
            // Answer information
            if (question.type === 'multiple-choice') {
                const correctOption = question.options.find(opt => opt.correct);
                const userOption = question.options.find(opt => opt.label === userAnswer);
                doc.setFontSize(9);
                
                if (userOption) {
                    doc.text('Your answer: ' + userOption.label + ': ' + userOption.text, 22, yPos + 10);
                } else {
                    doc.text('Your answer: Not answered', 22, yPos + 10);
                }
                
                if (!isCorrect && correctOption) {
                    doc.text('Correct answer: ' + correctOption.label + ': ' + correctOption.text, 22, yPos + 14);
                    yPos += 4;
                }
                doc.setFontSize(10);
            }
            
            yPos += 22;
        });
        
        // Footer on all pages
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setTextColor(128, 128, 128);
            doc.text('Page ' + i + ' of ' + pageCount, 105, 290, { align: 'center' });
            doc.text('Generated on ' + new Date().toLocaleString('en-GB'), 105, 295, { align: 'center' });
        }
        
        // Generate filename
        const fileName = 'Grammar_Test_' + test.studentInfo.name.replace(/\s+/g, '_') + '_' + Date.now() + '.pdf';
        
        // Save PDF
        doc.save(fileName);
        
        // Show success message
        loadingMsg.remove();
        showMessage('✅ PDF downloaded successfully!', 'success');
        
    } catch (error) {
        loadingMsg.remove();
        showMessage('❌ Failed to generate PDF: ' + error.message, 'error');
        console.error('PDF Generation Error:', error);
    }
}

function showMessage(text, type = 'info') {
    const colors = {
        info: 'var(--color-primary)',
        success: 'var(--color-success)',
        error: 'var(--color-error)'
    };
    
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--color-surface);
        color: var(--color-text);
        padding: 24px 32px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        z-index: 10000;
        text-align: center;
        border: 2px solid ${colors[type]};
        max-width: 400px;
    `;
    message.innerHTML = `
        <p style="margin: 0; font-size: 16px; line-height: 1.5;">${text}</p>
        ${type !== 'info' ? '<button onclick="this.parentElement.remove()" style="background: ' + colors[type] + '; color: white; border: none; padding: 8px 24px; border-radius: 6px; cursor: pointer; font-weight: 600; margin-top: 12px;">OK</button>' : ''}
    `;
    document.body.appendChild(message);
    
    if (type !== 'info') {
        setTimeout(() => {
            if (message.parentElement) message.remove();
        }, 5000);
    }
    
    return message;
}



// Global function for dashboard navigation
function returnToDashboard() {
    if (test && test.returnToDashboard) {
        test.returnToDashboard();
    } else {
        window.location.href = '../../dashboard.html';
    }
}

// Initialize test
const test = new GrammarTest();