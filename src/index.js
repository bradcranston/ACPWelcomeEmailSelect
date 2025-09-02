// Global data storage
let coursesData = [];
let selectedCourse = null;

// Function that FileMaker will call to load course data
window.loadCourseData = function(data) {
    try {
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    coursesData = Array.isArray(parsedData) ? parsedData : (parsedData.value || []);
        renderCourseList();
        console.log('Course data loaded:', coursesData.length, 'courses');
    } catch (error) {
        console.error('Error parsing course data:', error);
        showError('Failed to load course data');
    }
};

// Function that FileMaker can call to get the selected course
window.getSelectedCourse = function() {
    return selectedCourse;
};

// Function to create the main interface
function createInterface() {
    document.body.innerHTML = `
        <div class="container">
            <h1 style="margin-bottom: 1.2em;">Select a Course</h1>
            <div class="filter-bar" style="margin-bottom: 1.5em; margin-top: -0.5em; display: flex; justify-content: center;">
                <input type="text" id="courseFilterInput" placeholder="Filter by course name..." 
                    style="font-size: 1.1em; padding: 0.6em 1em; border-radius: 6px; border: 1px solid #ccc; width: 350px; max-width: 100%; box-shadow: 0 1px 2px rgba(0,0,0,0.04); background: #fafbfc; transition: border 0.2s;" />
            </div>
            <div id="courseList" class="course-list"></div>
            <div id="selectedCourseInfo" class="selected-course-info" style="display: none;">
                <h2>Selected Course</h2>
                <div id="selectedCourseDetails"></div>
                <button id="confirmSelection">Confirm Selection</button>
                <button id="clearSelection">Clear Selection</button>
            </div>
            <div id="errorMessage" class="error-message" style="display: none;"></div>
        </div>
    `;
    setupEventListeners();
    const filterInput = document.getElementById('courseFilterInput');
    if (filterInput) {
        filterInput.addEventListener('input', () => {
            renderCourseList();
        });
    }
}

// Setup event listeners
function setupEventListeners() {
    const confirmSelection = document.getElementById('confirmSelection');
    const clearSelection = document.getElementById('clearSelection');
    confirmSelection.addEventListener('click', () => {
        if (selectedCourse) {
            selectedCourse.mode = 'selected';
            callFileMakerScript('Send Welcome Email', JSON.stringify(selectedCourse));
            showSuccess('Course selection confirmed and sent to FileMaker!');
        }
    });
    clearSelection.addEventListener('click', () => {
        selectedCourse = null;
        document.getElementById('selectedCourseInfo').style.display = 'none';
        document.querySelectorAll('.course-item').forEach(item => {
            item.classList.remove('selected');
        });
    });
}

// Render the course list
function renderCourseList(filteredCourses = null) {
    const courseList = document.getElementById('courseList');
    let courses = filteredCourses || coursesData;
    // Sort by courseName (case-insensitive)
    courses = [...courses].sort((a, b) => {
        const nameA = (a.courseName || '').toLowerCase();
        const nameB = (b.courseName || '').toLowerCase();
        return nameA.localeCompare(nameB);
    });
    // Filter by input if present
    const filterInput = document.getElementById('courseFilterInput');
    const filterValue = filterInput ? filterInput.value.trim().toLowerCase() : '';
    if (filterValue) {
        courses = courses.filter(course => (course.courseName || '').toLowerCase().includes(filterValue));
    }
    if (courses.length === 0) {
        courseList.innerHTML = '<div class="no-courses">No courses found</div>';
        return;
    }
    courseList.innerHTML = courses.map(course => `
        <div class="course-item" data-course-name="${escapeHtml(course.courseName || '')}" onclick="selectCourse('${escapeHtml(course.courseName || '')}')">
            <h3 class="course-title">${escapeHtml(course.courseName || 'Untitled Course')}</h3>
        </div>
    `).join('');
}

// Select a course
window.selectCourse = function(courseName) {
    const course = coursesData.find(c => c.courseName === courseName);
    if (!course) return;
    selectedCourse = course;
    document.querySelectorAll('.course-item').forEach(item => {
        item.classList.remove('selected');
    });
    document.querySelector(`[data-course-name="${escapeHtml(courseName)}"]`).classList.add('selected');
    const selectedInfo = document.getElementById('selectedCourseInfo');
    const selectedDetails = document.getElementById('selectedCourseDetails');
    selectedDetails.innerHTML = `<div class="selected-details"><h3>${escapeHtml(course.courseName)}</h3></div>`;
    selectedInfo.style.display = 'block';
    selectedInfo.scrollIntoView({ behavior: 'smooth' });
};

// Filter courses
// No filterCourses function needed; only courseName is used for selection

// Populate filter dropdowns
function populateFilters() {
    const termFilter = document.getElementById('termFilter');
    const typeFilter = document.getElementById('typeFilter');
    const teacherFilter = document.getElementById('teacherFilter');
    
    // Save current values
    const currentTermValue = termFilter.value;
    const currentTypeValue = typeFilter.value;
    const currentTeacherValue = teacherFilter.value;
    
    // Get unique values - no trimming to keep original values
    const terms = [...new Set(coursesData.map(c => c.term).filter(Boolean))].sort();
    const types = [...new Set(coursesData.map(c => c.type).filter(Boolean))].sort();
    const teachers = [...new Set(coursesData
        .filter(c => c.teacherFirst && c.teacherLast)
        .map(c => `${c.teacherFirst} ${c.teacherLast}`))].sort();
    
    // Populate term filter
    termFilter.innerHTML = '<option value="">All Terms</option>' + 
        terms.map(term => `<option value="${escapeHtml(term)}">${escapeHtml(term)}</option>`).join('');
    if (currentTermValue && terms.includes(currentTermValue)) {
        termFilter.value = currentTermValue;
    }
    
    // Populate type filter
    typeFilter.innerHTML = '<option value="">All Types</option>' + 
        types.map(type => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join('');
    if (currentTypeValue && types.includes(currentTypeValue)) {
        typeFilter.value = currentTypeValue;
    }
    
    // Populate teacher filter
    teacherFilter.innerHTML = '<option value="">All Teachers</option>' + 
        teachers.map(teacher => `<option value="${escapeHtml(teacher)}">${escapeHtml(teacher)}</option>`).join('');
    if (currentTeacherValue && teachers.includes(currentTeacherValue)) {
        teacherFilter.value = currentTeacherValue;
    }
}

// Update course count
function updateCourseCount(count) {
    const courseCount = document.getElementById('courseCount');
    courseCount.innerHTML = `Showing ${count} course${count !== 1 ? 's' : ''}`;
}

// Utility functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.className = 'success-message';
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
        errorDiv.className = 'error-message';
    }, 3000);
}

// Function to call FileMaker script
function callFileMakerScript(scriptName, parameter) {
    try {
        // Method 1: Try using FileMaker.PerformScript (FileMaker 19+)
        if (typeof FileMaker !== 'undefined' && FileMaker.PerformScript) {
            FileMaker.PerformScript(scriptName, parameter);
            return;
        }
        
        // Method 2: Try using window.FileMaker (alternative approach)
        if (typeof window.FileMaker !== 'undefined' && window.FileMaker.PerformScript) {
            window.FileMaker.PerformScript(scriptName, parameter);
            return;
        }
        
        // Method 3: Try using fmp:// URL scheme (older FileMaker versions)
        const encodedParam = encodeURIComponent(parameter);
        const fmpUrl = `fmp://$/${scriptName}?script=${scriptName}&param=${encodedParam}`;
        window.location.href = fmpUrl;
        
    } catch (error) {
        console.error('Error calling FileMaker script:', error);
        showError('Failed to communicate with FileMaker. Please ensure the webviewer is properly configured.');
    }
}

// Initialize the interface when the page loads
document.addEventListener('DOMContentLoaded', createInterface);