let courses = [];
let tutors = [];
let filteredCourses = [];
let selectedTutor = null;
let selectedCourse = null;
let currentCoursePage = 1;
const ITEMS_PER_PAGE = 5;

document.addEventListener('DOMContentLoaded', () => {
    loadCourses();
    loadTutors();
    initSearchListeners();
    initOrderForm();
});

function showNotification(message, type = 'success') {
    const notificationArea = document.getElementById('notification-area');
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show notification`;
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    notificationArea.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 5000);
}

async function loadCourses() {
    try {
        courses = await api.getCourses();
        filteredCourses = courses;
        renderCourses();
    } catch (error) {
        showNotification('Ошибка загрузки программ: ' + error.message, 'danger');
        console.error('Error loading courses:', error);
    }
}

async function loadTutors() {
    try {
        tutors = await api.getTutors();
        renderTutors();
        populateLanguageFilter();
    } catch (error) {
        showNotification('Ошибка загрузки наставников: ' + error.message, 'danger');
        console.error('Error loading tutors:', error);
    }
}

function renderCourses() {
    const coursesList = document.getElementById('courses-list');
    const startIndex = (currentCoursePage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const coursesToShow = filteredCourses.slice(startIndex, endIndex);

    if (coursesToShow.length === 0) {
        coursesList.innerHTML = '<div class="col-12"><p class="text-center text-muted">Программы не найдены</p></div>';
        return;
    }

    coursesList.innerHTML = coursesToShow.map(course => `
        <div class="col-md-6 col-lg-4">
            <div class="card course-card h-100">
                <div class="card-body">
                    <h5 class="card-title">${course.name}</h5>
                    <p class="card-text text-muted">${course.description.substring(0, 100)}...</p>
                    <div class="mb-2">
                        <span class="badge bg-success">${course.level}</span>
                    </div>
                    <p class="mb-1"><strong>Преподаватель:</strong> ${course.teacher}</p>
                    <p class="mb-1"><strong>Продолжительность:</strong> ${course.total_length} недель</p>
                    <p class="mb-1"><strong>Часов в неделю:</strong> ${course.week_length}</p>
                    <p class="mb-3"><strong>Стоимость:</strong> ${course.course_fee_per_hour} ₽/час</p>
                    <button class="btn btn-success w-100" onclick="openOrderModal(${course.id})">
                        Подать заявку
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    renderCoursesPagination();
}

function renderCoursesPagination() {
    const pagination = document.getElementById('courses-pagination');
    const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);

    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }

    pagination.style.display = 'block';
    const ul = pagination.querySelector('ul');
    ul.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentCoursePage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.addEventListener('click', (e) => {
            e.preventDefault();
            currentCoursePage = i;
            renderCourses();
            document.getElementById('courses').scrollIntoView({ behavior: 'smooth' });
        });
        ul.appendChild(li);
    }
}

function renderTutors() {
    const tutorsList = document.getElementById('tutors-list');
    const searchLanguage = document.getElementById('tutor-search-language').value;
    const searchLevel = document.getElementById('tutor-search-level').value;
    const searchExperience = document.getElementById('tutor-search-experience').value;

    let filtered = tutors;

    if (searchLanguage) {
        filtered = filtered.filter(tutor => 
            tutor.languages_offered.includes(searchLanguage)
        );
    }

    if (searchLevel) {
        filtered = filtered.filter(tutor => tutor.language_level === searchLevel);
    }
    
    if (searchExperience) {
        const minExp = parseInt(searchExperience);
        filtered = filtered.filter(tutor => tutor.work_experience >= minExp);
    }

    if (filtered.length === 0) {
        tutorsList.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Наставники не найдены</td></tr>';
        return;
    }

    tutorsList.innerHTML = filtered.map(tutor => `
        <tr class="${selectedTutor && selectedTutor.id === tutor.id ? 'tutor-selected' : ''}" 
            onclick="selectTutor(${tutor.id})">
            <td>
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}&size=50&background=random" 
                     alt="${tutor.name}" 
                     class="rounded-circle" 
                     width="50" 
                     height="50">
            </td>
            <td>${tutor.name}</td>
            <td><span class="badge bg-info">${tutor.language_level}</span></td>
            <td>${tutor.languages_spoken.join(', ')}</td>
            <td>${tutor.work_experience}</td>
            <td>${tutor.price_per_hour} ₽</td>
            <td>
                <button class="btn btn-sm btn-success" onclick="openOrderModal(null, ${tutor.id})">
                    Заявка
                </button>
            </td>
        </tr>
    `).join('');
}

function populateLanguageFilter() {
    const filter = document.getElementById('tutor-search-language');
    const languages = new Set();
    tutors.forEach(tutor => {
        tutor.languages_offered.forEach(lang => languages.add(lang));
    });
    languages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang;
        option.textContent = lang;
        filter.appendChild(option);
    });
}

function initSearchListeners() {
    document.getElementById('search-courses').addEventListener('click', filterCourses);
    document.getElementById('course-search').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') filterCourses();
    });
    document.getElementById('course-level-filter').addEventListener('change', filterCourses);

    document.getElementById('tutor-search-language').addEventListener('change', renderTutors);
    document.getElementById('tutor-search-level').addEventListener('change', renderTutors);
    document.getElementById('tutor-search-experience').addEventListener('change', renderTutors);
}

function filterCourses() {
    const searchText = document.getElementById('course-search').value.toLowerCase().trim();
    const levelFilter = document.getElementById('course-level-filter').value;

    filteredCourses = courses.filter(course => {
        const matchesSearch = 
            course.name.toLowerCase().includes(searchText) ||
            course.description.toLowerCase().includes(searchText) ||
            course.teacher.toLowerCase().includes(searchText);

        const matchesLevel = !levelFilter || course.level === levelFilter;

        return matchesSearch && matchesLevel;
    });

    currentCoursePage = 1;
    renderCourses();
}

function selectTutor(tutorId) {
    selectedTutor = tutors.find(t => t.id === tutorId);
    renderTutors();
}

function openOrderModal(courseId = null, tutorId = null) {
    selectedCourse = courseId ? courses.find(c => c.id === courseId) : null;
    selectedTutor = tutorId ? tutors.find(t => t.id === tutorId) : null;

    document.getElementById('course-id').value = courseId || '';
    document.getElementById('tutor-id').value = tutorId || '';
    document.getElementById('course-name').value = selectedCourse ? selectedCourse.name : (selectedTutor ? `Занятия с ${selectedTutor.name}` : '');
    document.getElementById('teacher-name').value = selectedCourse ? selectedCourse.teacher : (selectedTutor ? selectedTutor.name : '');

    document.getElementById('duration-info').value = selectedCourse ? `${selectedCourse.total_length} недель` : 'Индивидуально';

    document.getElementById('persons').value = 1;
    document.getElementById('date-start').innerHTML = '<option value="">Выберите дату</option>';
    document.getElementById('time-start').innerHTML = '<option value="">Сначала выберите дату</option>';
    document.getElementById('time-start').disabled = true;

    document.querySelectorAll('#orderForm .form-check-input:not(:disabled)').forEach(cb => cb.checked = false);
    document.getElementById('total-price').textContent = '0';

    populateDates();
    const modal = new bootstrap.Modal(document.getElementById('orderModal'));
    modal.show();
}

function populateDates() {
    const dateSelect = document.getElementById('date-start');
    // Примерные даты (в реальном проекте можно генерировать динамически)
    const dates = ['2025-02-01', '2025-02-08', '2025-02-15', '2025-02-22'];
    dates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = new Date(date).toLocaleDateString('ru-RU');
        dateSelect.appendChild(option);
    });
}

function initOrderForm() {
    document.getElementById('date-start').addEventListener('change', onDateChange);
    document.getElementById('time-start').addEventListener('change', onTimeChange);
    document.getElementById('persons').addEventListener('input', calculatePrice);

    const checkboxes = ['supplementary', 'personalized', 'excursions', 'assessment', 'interactive'];
    checkboxes.forEach(id => {
        document.getElementById(id).addEventListener('change', calculatePrice);
    });

    document.getElementById('submitOrder').addEventListener('click', submitOrder);
}

function onDateChange() {
    const selectedDate = document.getElementById('date-start').value;
    const timeSelect = document.getElementById('time-start');
    timeSelect.innerHTML = '<option value="">Выберите время</option>';
    timeSelect.disabled = !selectedDate;

    if (selectedDate) {
        // Примерные времена
        ['09:00', '10:00', '11:00', '18:00', '19:00'].forEach(time => {
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            timeSelect.appendChild(option);
        });
    }
    calculatePrice();
}

function onTimeChange() {
    calculatePrice();
}

function calculatePrice() {
    if (!selectedCourse && !selectedTutor) return;

    const dateStart = document.getElementById('date-start').value;
    const timeStart = document.getElementById('time-start').value;
    const persons = parseInt(document.getElementById('persons').value) || 1;

    if (!dateStart || !timeStart) {
        document.getElementById('total-price').textContent = '0';
        return;
    }

    const feePerHour = selectedCourse ? selectedCourse.course_fee_per_hour : (selectedTutor ? selectedTutor.price_per_hour : 0);
    const totalLength = selectedCourse ? selectedCourse.total_length : 8; // пример для индивидуальных
    const weekLength = selectedCourse ? selectedCourse.week_length : 2;

    const durationInHours = totalLength * weekLength;

    const isWeekend = isWeekendOrHoliday(dateStart);
    const weekendMultiplier = isWeekend ? 1.5 : 1;

    const [hours] = timeStart.split(':').map(Number);
    let morningSurcharge = (hours >= 9 && hours < 12) ? 400 : 0;
    let eveningSurcharge = (hours >= 18 && hours < 20) ? 1000 : 0;

    let basePrice = (feePerHour * durationInHours * weekendMultiplier) + morningSurcharge + eveningSurcharge;

    const isEarly = checkEarlyRegistration(dateStart);
    const isGroup = persons >= 5;
    const isIntensive = weekLength >= 5;

    document.getElementById('early-registration-display').checked = isEarly;
    document.getElementById('group-enrollment-display').checked = isGroup;
    document.getElementById('intensive-course-display').checked = isIntensive;

    if (isIntensive) basePrice *= 1.2;

    if (document.getElementById('supplementary').checked) basePrice += 2000 * persons;
    if (document.getElementById('personalized').checked) basePrice += 1500 * totalLength;
    if (document.getElementById('assessment').checked) basePrice += 300;
    if (document.getElementById('excursions').checked) basePrice *= 1.25;
    if (document.getElementById('interactive').checked) basePrice *= 1.5;

    let finalPrice = basePrice * persons;

    if (isEarly) finalPrice *= 0.9;
    if (isGroup) finalPrice *= 0.85;

    document.getElementById('total-price').textContent = Math.round(finalPrice);
}

function isWeekendOrHoliday(dateStr) {
    const date = new Date(dateStr);
    const day = date.getDay();
    return day === 0 || day === 6;
}

function checkEarlyRegistration(dateStr) {
    const startDate = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
    return diffDays >= 30;
}

async function submitOrder() {
    const orderData = {
        tutor_id: parseInt(document.getElementById('tutor-id').value) || 0,
        course_id: parseInt(document.getElementById('course-id').value) || 0,
        date_start: document.getElementById('date-start').value,
        time_start: document.getElementById('time-start').value,
        duration: selectedCourse ? selectedCourse.week_length : 2,
        persons: parseInt(document.getElementById('persons').value),
        price: parseInt(document.getElementById('total-price').textContent),
        early_registration: document.getElementById('early-registration-display').checked,
        group_enrollment: document.getElementById('group-enrollment-display').checked,
        intensive_course: document.getElementById('intensive-course-display').checked,
        supplementary: document.getElementById('supplementary').checked,
        personalized: document.getElementById('personalized').checked,
        excursions: document.getElementById('excursions').checked,
        assessment: document.getElementById('assessment').checked,
        interactive: document.getElementById('interactive').checked
    };

    if (!orderData.date_start || !orderData.time_start) {
        showNotification('Заполните дату и время', 'warning');
        return;
    }

    try {
        await api.createOrder(orderData);
        showNotification('Заявка успешно отправлена!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('orderModal')).hide();
    } catch (error) {
        showNotification('Ошибка отправки заявки: ' + error.message, 'danger');
    }
}