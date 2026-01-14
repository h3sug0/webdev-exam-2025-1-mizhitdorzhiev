let mapObject;
let mapMarkers = [];
let markerCluster;

const langResources = [
    {
        id: 1,
        name: 'Библиотека им. Ленина',
        type: 'library',
        coords: [55.751574, 37.610348],
        address: 'Воздвиженка ул., 3/5, Москва',
        hours: 'Пн-Вс: 9:00-21:00',
        phone: '+7 (495) 695-92-06',
        description: 'Крупнейшая библиотека с иностранной литературой.'
    },
    {
        id: 2,
        name: 'Lingvo Cafe',
        type: 'cafe',
        coords: [55.7558, 37.6173],
        address: 'Тверская ул., 1, Москва',
        hours: 'Ежедневно: 10:00-22:00',
        phone: '+7 (495) 123-45-67',
        description: 'Кафе для практики языков.'
    },
    {
        id: 3,
        name: 'МГУ',
        type: 'education',
        coords: [55.7039, 37.5287],
        address: 'Ленинские горы, 1, Москва',
        hours: 'Пн-Пт: 9:00-18:00',
        phone: '+7 (495) 939-10-00',
        description: 'Университет с курсами иностранных языков.'
    },
    {
        id: 4,
        name: 'Private Lingvo Center',
        type: 'private',
        coords: [55.7602, 37.6185],
        address: 'Красная площадь, 1, Москва',
        hours: 'Пн-Пт: 9:00-21:00, Сб-Вс: 10:00-18:00',
        phone: '+7 (495) 333-22-11',
        description: 'Частный центр с занятиями.'
    },
    {
        id: 5,
        name: 'Культурный центр на Арбате',
        type: 'community',
        coords: [55.7522, 37.5931],
        address: 'Арбат, 46, Москва',
        hours: 'Ежедневно: 8:00-23:00',
        phone: '+7 (495) 312-36-48',
        description: 'Центр с клубами.'
    },
    {
        id: 6,
        name: 'Национальная библиотека',
        type: 'library',
        coords: [55.7491, 37.6184],
        address: 'Моховая ул., 18, Москва',
        hours: 'Пн-Пт: 9:00-21:00, Сб: 9:00-18:00',
        phone: '+7 (495) 310-71-37',
        description: 'Библиотека с изданиями.'
    },
    {
        id: 7,
        name: 'Polyglot Club',
        type: 'cafe',
        coords: [55.7661, 37.6325],
        address: 'Проспект Мира, 74, Москва',
        hours: 'Вт-Вс: 14:00-22:00',
        phone: '+7 (495) 987-65-43',
        description: 'Клуб для практики.'
    },
    {
        id: 8,
        name: 'Language School',
        type: 'private',
        coords: [55.7453, 37.6018],
        address: 'Ул. Рубинштейна, 15, Москва',
        hours: 'Пн-Пт: 9:00-21:00, Сб: 10:00-17:00',
        phone: '+7 (495) 456-78-90',
        description: 'Школа с программами.'
    },
    {
        id: 9,
        name: 'Политех Центр',
        type: 'education',
        coords: [55.7833, 37.6075],
        address: 'Политехническая ул., 29, Москва',
        hours: 'Пн-Пт: 9:00-20:00',
        phone: '+7 (495) 552-78-99',
        description: 'Центр с языками.'
    },
    {
        id: 10,
        name: 'Лофт Культура',
        type: 'community',
        coords: [55.7669, 37.6322],
        address: 'Проспект Мира, 74, Москва',
        hours: 'Ежедневно: 10:00-22:00',
        phone: '+7 (495) 458-50-05',
        description: 'Культурный центр с воркшопами.'
    }
];

function initMapObject() {
    ymaps.ready(() => {
        mapObject = new ymaps.Map('map', {
            center: [55.7558, 37.6173],
            zoom: 10,
            controls: ['zoomControl', 'fullscreenControl']
        });

        markerCluster = new ymaps.Clusterer({
            preset: 'islands#blueClusterIcons',
            groupByCoordinates: false,
            clusterDisableClickZoom: false,
            clusterHideIconOnBalloonOpen: false,
            geoObjectHideIconOnBalloonOpen: false
        });

        generateMarkers(langResources);
        setupMapEvents();
    });
}

function generateMarkers(data) {
    mapMarkers.forEach(pm => mapObject.geoObjects.remove(pm));
    mapMarkers = [];
    markerCluster.removeAll();

    data.forEach(resource => {
        const placemark = new ymaps.Placemark(
            resource.coords,
            {
                balloonContentHeader: `<h6 class="mb-2">${resource.name}</h6>`,
                balloonContentBody: `
                    <div style="max-width: 300px;">
                        <p class="mb-2"><strong>Тип:</strong> ${getTypeText(resource.type)}</p>
                        <p class="mb-2"><strong>Адрес:</strong> ${resource.address}</p>
                        <p class="mb-2"><strong>Часы:</strong> ${resource.hours}</p>
                        <p class="mb-2"><strong>Телефон:</strong> <a href="tel:${resource.phone}">${resource.phone}</a></p>
                        <p class="mb-0"><strong>Описание:</strong> ${resource.description}</p>
                    </div>
                `,
                hintContent: resource.name
            },
            {
                preset: getIconPreset(resource.type),
                iconColor: getIconColor(resource.type)
            }
        );

        mapMarkers.push(placemark);
        markerCluster.add(placemark);
    });

    mapObject.geoObjects.add(markerCluster);
}

function getIconPreset(type) {
    const presets = {
        'education': 'islands#blueEducationIcon',
        'community': 'islands#orangeCommunityIcon',
        'library': 'islands#blueLibraryIcon',
        'private': 'islands#violetPrivateIcon',
        'cafe': 'islands#redCafeIcon'
    };
    return presets[type] || 'islands#grayIcon';
}

function getIconColor(type) {
    const colors = {
        'education': ' #3b5998',
        'community': '#ff6b35',
        'library': '#0d6efd',
        'private': '#9b59b6',
        'cafe': '#e74c3c'
    };
    return colors[type] || '#808080';
}

function getTypeText(type) {
    const types = {
        'education': 'Образовательное учреждение',
        'community': 'Общественный центр',
        'library': 'Библиотека',
        'private': 'Частный центр',
        'cafe': 'Языковое кафе'
    };
    return types[type] || type;
}

function filterResources() {
    const searchText = document.getElementById('resource-search').value.toLowerCase();
    const typeFilter = document.getElementById('resource-type-filter').value;

    let filtered = langResources;

    if (searchText) {
        filtered = filtered.filter(r => 
            r.name.toLowerCase().includes(searchText) ||
            r.address.toLowerCase().includes(searchText) ||
            r.description.toLowerCase().includes(searchText)
        );
    }

    if (typeFilter) {
        filtered = filtered.filter(r => r.type === typeFilter);
    }

    generateMarkers(filtered);

    if (filtered.length > 0) {
        mapObject.setBounds(mapObject.geoObjects.getBounds(), {
            checkZoomRange: true,
            zoomMargin: 50
        });
    }
}

function resetMap() {
    document.getElementById('resource-search').value = '';
    document.getElementById('resource-type-filter').selectedIndex = 0;
    generateMarkers(langResources);
    mapObject.setCenter([55.7558, 37.6173], 10);
}

function setupMapEvents() {
    document.getElementById('search-on-map').addEventListener('click', filterResources);
    document.getElementById('reset-map').addEventListener('click', resetMap);
    document.getElementById('resource-search').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') filterResources();
    });
}

if (typeof ymaps !== 'undefined') {
    initMapObject();
}