// Session Manager for UPSI Language Assessment Platform
// Handles login, logout, session persistence, and test history tracking

class SessionManager {
    constructor() {
        this.storageKey = 'upsi_user_session';
        this.historyKey = 'upsi_test_history';
    }

    // Generate unique UUID for student
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Login and create session
    login(studentInfo) {
        const session = {
            studentId: this.generateUUID(),
            name: studentInfo.name,
            email: studentInfo.email,
            studentIdNumber: studentInfo.studentId || 'N/A',
            loginTime: new Date().toISOString(),
            loginDate: new Date().toLocaleDateString('en-GB')
        };
        
        localStorage.setItem(this.storageKey, JSON.stringify(session));
        
        // Initialize empty test history if not exists
        if (!localStorage.getItem(this.historyKey)) {
            localStorage.setItem(this.historyKey, JSON.stringify([]));
        }
        
        return session;
    }

    // Check if user is logged in
    isLoggedIn() {
        return localStorage.getItem(this.storageKey) !== null;
    }

    // Get current student info
    getStudentInfo() {
        const session = localStorage.getItem(this.storageKey);
        return session ? JSON.parse(session) : null;
    }

    // Save test attempt
    saveTestAttempt(testData) {
        const session = this.getStudentInfo();
        if (!session) {
            console.error('No active session');
            return;
        }

        const history = this.getTestHistory();
        
        const testRecord = {
            ...testData,
            studentId: session.studentId,
            studentName: session.name,
            studentEmail: session.email,
            timestamp: Date.now(),
            submittedAt: new Date().toLocaleString('en-GB')
        };

        history.push(testRecord);
        localStorage.setItem(this.historyKey, JSON.stringify(history));
        
        return testRecord;
    }

    // Get all test history
    getTestHistory() {
        const history = localStorage.getItem(this.historyKey);
        return history ? JSON.parse(history) : [];
    }

    // Get test history by type
    getTestHistoryByType(testType) {
        const history = this.getTestHistory();
        const session = this.getStudentInfo();
        
        if (!session) return [];
        
        return history.filter(test => 
            test.testType === testType && 
            test.studentId === session.studentId
        );
    }

    // Get last test attempt by type
    getLastAttempt(testType) {
        const attempts = this.getTestHistoryByType(testType);
        if (attempts.length === 0) return null;
        
        // Sort by timestamp descending
        attempts.sort((a, b) => b.timestamp - a.timestamp);
        return attempts[0];
    }

    // Get test statistics
    getTestStats(testType) {
        const attempts = this.getTestHistoryByType(testType);
        
        if (attempts.length === 0) {
            return {
                attempts: 0,
                lastAttempt: null,
                bestScore: null,
                averageScore: null
            };
        }

        const scores = attempts
            .filter(a => a.score !== undefined)
            .map(a => parseFloat(a.percentage) || 0);

        return {
            attempts: attempts.length,
            lastAttempt: attempts[attempts.length - 1],
            bestScore: scores.length > 0 ? Math.max(...scores) : null,
            averageScore: scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null
        };
    }

    // Clear specific test history
    clearTestHistory(testType) {
        const history = this.getTestHistory();
        const session = this.getStudentInfo();
        
        if (!session) return;
        
        const filtered = history.filter(test => 
            !(test.testType === testType && test.studentId === session.studentId)
        );
        
        localStorage.setItem(this.historyKey, JSON.stringify(filtered));
    }

    // Clear all history for current user
    clearAllHistory() {
        const history = this.getTestHistory();
        const session = this.getStudentInfo();
        
        if (!session) return;
        
        const filtered = history.filter(test => test.studentId !== session.studentId);
        localStorage.setItem(this.historyKey, JSON.stringify(filtered));
    }

    // Logout
    logout() {
        localStorage.removeItem(this.storageKey);
        // Keep history for future logins
        window.location.href = 'index.html';
    }

    // Complete logout (clear everything)
    completeLogout() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.historyKey);
        window.location.href = 'index.html';
    }

    // Export history as JSON
    exportHistory() {
        const session = this.getStudentInfo();
        if (!session) return null;
        
        const history = this.getTestHistory().filter(
            test => test.studentId === session.studentId
        );
        
        return {
            student: {
                name: session.name,
                email: session.email,
                studentId: session.studentIdNumber
            },
            tests: history,
            exportDate: new Date().toISOString()
        };
    }

    // Download history as JSON file
    downloadHistory() {
        const data = this.exportHistory();
        if (!data) return;
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `test-history-${data.student.name.replace(/\s+/g, '-')}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Global session manager instance
const sessionManager = new SessionManager();