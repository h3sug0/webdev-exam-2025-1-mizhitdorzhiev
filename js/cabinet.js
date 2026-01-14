let userOrders = [];
let currentOrdersPage = 1;
const ITEMS_PER_PAGE = 5;
let orderToRemove = null;
let currentProgram = null;
let programCache = {};

document.addEventListener('DOMContentLoaded', () => {
    fetchOrdersData();
    setupCabinetEvents();
});

function displayAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alert-container');
    const alertElem = document.createElement('div');
    alertElem.className = `alert alert-${type} alert-dismissible fade show`;
    alertElem.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    alertContainer.appendChild(alertElem);

    setTimeout(() => {
        alertElem.classList.add('fade-out');
        setTimeout(() => alertElem.remove(), 300);
    }, 5000);
}

async function fetchOrdersData() {
    try {
        userOrders = await api.getOrders();
        
        for (const order of userOrders) {
            if (order.course_id && !programCache[order.course_id]) {
                programCache[order.course_id] = await api.getCourse(order.course_id);
            }
        }
        
        displayOrders();
    } catch (error) {
        displayAlert('Ошибка загрузки заявок: ' + error.message, 'danger');
    }
}

function getProgramName(order) {
    if (order.course_id && programCache[order.course_id]) {
        return programCache[order.course_id].name;
    }
    return order.course_id ? `Программа #${order.course_id}` : `Наставник #${order.tutor_id}`;
}

function displayOrders() {
    const noOrders = document.getElementById('no-orders');
    const tableContainer = document.getElementById('orders-table-container');
    
    if (userOrders.length === 0) {
        noOrders.style.display = 'block';
        tableContainer.style.display = 'none';
        return;
    }
    
    noOrders.style.display = 'none';
    tableContainer.style.display = 'block';
    
    const start = (currentOrdersPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const ordersToShow = userOrders.slice(start, end);
    
    const list = document.getElementById('orders-list');
    list.innerHTML = ordersToShow.map((order, index) => `
        <tr>
            <td>${start + index + 1}</td>
            <td>${getProgramName(order)}</td>
            <td>${formatDate(order.date_start)} ${order.time_start}</td>
            <td>${order.price} ₽</td>
            <td>
                <button class="btn btn-sm btn-info me-1 mb-1" onclick="showOrderDetails(${order.id})">
                    <i class="bi bi-eye"></i> Подробнее
                </button>
                <button class="btn btn-sm btn-success me-1 mb-1" onclick="editOrder(${order.id})">
                    <i class="bi bi-pencil"></i> Изменить
                </button>
                <button class="btn btn-sm btn-danger mb-1" onclick="confirmDeleteOrder(${order.id})">
                    <i class="bi bi-trash"></i> Удалить
                </button>
            </td>
        </tr>
    `).join('');
    
    displayOrdersPaginator();
}

function displayOrdersPaginator() {
    const paginator = document.getElementById('orders-pagination');
    const totalPages = Math.ceil(userOrders.length / ITEMS_PER_PAGE);
    
    if (totalPages <= 1) {
        paginator.style.display = 'none';
        return;
    }
    
    paginator.style.display = 'block';
    const ul = paginator.querySelector('ul');
    ul.innerHTML = '';
    
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentOrdersPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.addEventListener('click', (e) => {
            e.preventDefault();
            currentOrdersPage = i;
            displayOrders();
        });
        ul.appendChild(li);
    }
}

async function showOrderDetails(orderId) {
    try {
        const order = await api.getOrder(orderId);
        const course = order.course_id ? await api.getCourse(order.course_id) : null;
        
        const content = document.getElementById('orderDetailsContent');
        content.innerHTML = `
            <div class="mb-3">
                <strong>Номер:</strong> ${order.id}
            </div>
            ${course ? `
                <div class="mb-3">
                    <strong>Программа:</strong> ${course.name}
                </div>
                <div class="mb-3">
                    <strong>Описание:</strong> ${course.description}
                </div>
                <div class="mb-3">
                    <strong>Преподаватель:</strong> ${course.teacher}
                </div>
            ` : `
                <div class="mb-3">
                    <strong>Наставник ID:</strong> ${order.tutor_id}
                </div>
            `}
            <div class="mb-3">
                <strong>Дата начала:</strong> ${formatDate(order.date_start)}
            </div>
            <div class="mb-3">
                <strong>Время:</strong> ${order.time_start}
            </div>
            <div class="mb-3">
                <strong>Продолжительность:</strong> ${order.duration} ч/нед
            </div>
            <div class="mb-3">
                <strong>Участники:</strong> ${order.persons}
            </div>
            <div class="mb-3">
                <strong>Стоимость:</strong> ${order.price} ₽
            </div>
        `;
        const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
        modal.show();
    } catch (error) {
        displayAlert('Ошибка просмотра заявки: ' + error.message, 'danger');
    }
}

async function editOrder(orderId) {
    try {
        const order = await api.getOrder(orderId);
        currentProgram = order.course_id ? await api.getCourse(order.course_id) : null;

        document.getElementById('edit-order-id').value = order.id;
        document.getElementById('edit-course-id').value = order.course_id || '';
        document.getElementById('edit-course-name').value = currentProgram ? currentProgram.name : 'Индивидуально';
        document.getElementById('edit-teacher-name').value = currentProgram ? currentProgram.teacher : '';
        document.getElementById('edit-duration-info').value = currentProgram ? `${currentProgram.total_length} недель` : 'Индивидуально';
        document.getElementById('edit-persons').value = order.persons;
        document.getElementById('edit-date-start').innerHTML = '<option value="">Выберите дату</option>';
        document.getElementById('edit-time-start').innerHTML = '<option value="">Выберите дату сначала</option>';
        document.getElementById('edit-time-start').disabled = true;

        // Установить чекбоксы
        document.getElementById('edit-early-registration-display').checked = order.early_registration;
        document.getElementById('edit-group-enrollment-display').checked = order.group_enrollment;
        document.getElementById('edit-intensive-course-display').checked = order.intensive_course;
        document.getElementById('edit-supplementary').checked = order.supplementary;
        document.getElementById('edit-personalized').checked = order.personalized;
        document.getElementById('edit-excursions').checked = order.excursions;
        document.getElementById('edit-assessment').checked = order.assessment;
        document.getElementById('edit-interactive').checked = order.interactive;

        populateEditDates(order.date_start);
        const modal = new bootstrap.Modal(document.getElementById('editOrderModal'));
        modal.show();
    } catch (error) {
        displayAlert('Ошибка редактирования: ' + error.message, 'danger');
    }
}

function populateEditDates(selectedDate) {
    const dateSelect = document.getElementById('edit-date-start');
    // Пример, замени
    const dates = ['2024-10-01', '2024-10-02', '2024-10-03'];
    dates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = formatDate(date);
        option.selected = date === selectedDate;
        dateSelect.appendChild(option);
    });
    if (selectedDate) onEditDateChange();
}

function onEditDateChange() {
    const date = document.getElementById('edit-date-start').value;
    const timeSelect = document.getElementById('edit-time-start');
    timeSelect.innerHTML = '<option value="">Выберите время</option>';
    timeSelect.disabled = !date;

    if (date) {
        const times = ['09:00', '10:00', '18:00'];
        times.forEach(time => {
            const option = document.createElement('option');
            option.value = time;
            option.textContent = `${time} - ${calculateEndTime(time, currentProgram ? currentProgram.week_length : 2)}`;
            timeSelect.appendChild(option);
        });
    }
    calculateEditPrice();
}

function onEditTimeChange() {
    calculateEditPrice();
}

function calculateEditPrice() {
    if (!currentProgram) return;

    const dateStart = document.getElementById('edit-date-start').value;
    const timeStart = document.getElementById('edit-time-start').value;
    const persons = parseInt(document.getElementById('edit-persons').value) || 1;

    if (!dateStart || !timeStart) {
        document.getElementById('edit-total-price').textContent = '0';
        return;
    }

    const feePerHour = currentProgram.course_fee_per_hour;
    const totalLength = currentProgram.total_length;
    const weekLength = currentProgram.week_length;
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

    document.getElementById('edit-early-registration-display').checked = isEarly;
    document.getElementById('edit-group-enrollment-display').checked = isGroup;
    document.getElementById('edit-intensive-course-display').checked = isIntensive;

    if (isIntensive) basePrice *= 1.2;

    if (document.getElementById('edit-supplementary').checked) basePrice += 2000 * persons;
    if (document.getElementById('edit-personalized').checked) basePrice += 1500 * totalLength;
    if (document.getElementById('edit-assessment').checked) basePrice += 300;
    if (document.getElementById('edit-excursions').checked) basePrice *= 1.25;
    if (document.getElementById('edit-interactive').checked) basePrice *= 1.5;

    let finalPrice = basePrice * persons;

    if (isEarly) finalPrice *= 0.9;
    if (isGroup) finalPrice *= 0.85;

    document.getElementById('edit-total-price').textContent = Math.ceil(finalPrice);
}

async function saveEditOrder() {
    const orderId = parseInt(document.getElementById('edit-order-id').value);
    
    const orderData = {
        tutor_id: 0,
        course_id: parseInt(document.getElementById('edit-course-id').value),
        date_start: document.getElementById('edit-date-start').value,
        time_start: document.getElementById('edit-time-start').value,
        duration: currentProgram.week_length,
        persons: parseInt(document.getElementById('edit-persons').value),
        price: parseInt(document.getElementById('edit-total-price').textContent),
        early_registration: document.getElementById('edit-early-registration-display').checked,
        group_enrollment: document.getElementById('edit-group-enrollment-display').checked,
        intensive_course: document.getElementById('edit-intensive-course-display').checked,
        supplementary: document.getElementById('edit-supplementary').checked,
        personalized: document.getElementById('edit-personalized').checked,
        excursions: document.getElementById('edit-excursions').checked,
        assessment: document.getElementById('edit-assessment').checked,
        interactive: document.getElementById('edit-interactive').checked
    };
    
    try {
        await api.updateOrder(orderId, orderData);
        displayAlert('Заявка обновлена!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('editOrderModal')).hide();
        programCache = {};
        fetchOrdersData();
    } catch (error) {
        displayAlert('Ошибка обновления: ' + error.message, 'danger');
    }
}

function confirmDeleteOrder(orderId) {
    orderToRemove = orderId;
    const modal = new bootstrap.Modal(document.getElementById('deleteOrderModal'));
    modal.show();
}

async function deleteOrder() {
    try {
        await api.deleteOrder(orderToRemove);
        displayAlert('Заявка удалена!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('deleteOrderModal')).hide();
        fetchOrdersData();
        orderToRemove = null;
    } catch (error) {
        displayAlert('Ошибка удаления: ' + error.message, 'danger');
    }
}

function setupCabinetEvents() {
    document.getElementById('edit-date-start').addEventListener('change', onEditDateChange);
    document.getElementById('edit-time-start').addEventListener('change', onEditTimeChange);
    document.getElementById('edit-persons').addEventListener('input', calculateEditPrice);
    ['edit-supplementary', 'edit-personalized', 'edit-excursions', 'edit-assessment', 'edit-interactive'].forEach(id => {
        document.getElementById(id).addEventListener('change', calculateEditPrice);
    });
    document.getElementById('saveEditOrder').addEventListener('click', saveEditOrder);
    document.getElementById('confirmDelete').addEventListener('click', deleteOrder);
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'short', day: 'numeric' });
}