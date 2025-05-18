//엘리먼트 변수 - '선택한 장소/경로'
const empty = document.getElementById('empty');
const locationInfo = document.getElementById('location-info');
const locationModify = document.getElementById('location-modify');
const pathInfo = document.getElementById('path-info');

const locationName = document.getElementById('location-name');
const nameModifyText = document.getElementById('name-modify-text');
const pathName = document.getElementById('path-name');

const nameModifyButton = document.getElementById('name-modify-button');
const locationDeleteButton = document.getElementById('location-delete');
const pathDeleteButton = document.getElementById('path-delete');

const setStartButton = document.getElementById('set-start');
const setEndButton = document.getElementById('set-end');

const nameModifyForm = document.getElementById('name-modify-form');
const nameModifyCancel = document.getElementById('name-modify-cancel');

//엘리먼트 변수 - '경로 생성'
const startText = document.getElementById('start');
const endText = document.getElementById('end');
const pathMakingButton = document.getElementById('path-making-button');

//엘리먼트 변수 - '지도 초기화'
const resetPath = document.getElementById('reset-path');
const resetAll = document.getElementById('reset-all');

//엘리먼트 변수 - '공유'
const shareWebsite = document.getElementById('share-website');
const shareMap = document.getElementById('share-map');


//장소 및 경로 클래스 & 저장 변수 및 배열 & 관련 함수
class Location {
    constructor(name, latlng, id) {
        this.name = name;
        this.latlng = latlng;
        this.marker = L.marker(latlng);
        this.isRegistered = false;
        this.id = id;
    }

    showMarker(layer, onClick) {
        this.marker.addTo(layer).on('click', onClick);
    }
}

class Path {
    constructor(start, end) {
        this.start = start;
        this.end = end;
        this.polyline = L.polyline([start.latlng, end.latlng], {weight: 5});
    }

    showPath(layer, onClick) {
        this.polyline.addTo(layer).on('click', onClick);
    }
}

let currentObject = null;
let startLocation = null;
let endLocation = null;
let locations = [];
let paths = [];

function locationOfMarker(marker) {
    for (let i = 0; i < locations.length; i++) {
        if (marker == locations[i].marker) {
            return locations[i];
        }
    }
    return null;
}

function pathOfPolyline(polyline) {
    for (let i = 0; i < paths.length; i++) {
        if (polyline == paths[i].polyline) {
            return paths[i];
        }
    }
    return null;
}

function getLocationById(id) {
    for (let i = 0; i < locations.length; i++) {
        if (locations[i].id == id) return locations[i];
    }
    return null;
}

function makeLocationId() {
    let result;
    loop: for (result = 0; result < 2000000000; result++) {
        for (let i = 0; i < locations.length; i++) {
            if (result == locations[i].id) continue loop;
        }
        break;
    }
    if (result == 2000000000) return -1;
    return result;
}

function makeTempLocation(e) {
    let id = makeLocationId();
    if (id == -1) {
        alert("마커가 너무 많습니다.");
        return -1;
    }
    currentObject = new Location('새 장소', e.latlng, id);
    currentObject.showMarker(locationLayer, onMarkerClick);
    showModifyScreen(currentObject);
    return 0;
}

function registerLocation(location, name) {
    locations.push(location);
    location.isRegistered = true;
    location.name = name;
    updateCurrentObject(location);
    updateURL();
}

function modifyLocationName(location, name) {
    location.name = name;
    updateCurrentObject(location);
    updateURL();
}

function makePath(start, end) {
    if (start == null && end == null) {
        alert("출발 장소와 도착 장소를 지정해 주세요.");
        return -1;
    }
    if (start == null) {
        alert("출발 장소를 지정해 주세요.");
        return -1;
    }
    if (end == null) {
        alert("도착 장소를 지정해 주세요.");
        return -1;
    }
    if (start == end) {
        alert("출발 장소와 도착 장소가 동일합니다.");
        return -1;
    }
    currentObject = new Path(start, end);
    currentObject.showPath(pathLayer, onPolylineClick);
    paths.push(currentObject);
    showInfo(currentObject);
    updateURL();
    return 0;
}

function deleteLocation(location) {
    for (var i = 0; i < locations.length; i++) {
        if (locations[i] == location) {
            locationLayer.removeLayer(currentObject.marker);
            locations.splice(i, 1);
            break;
        }
    }
    for (var i = 0; i < paths.length; i++) {
        if (paths[i].start == location || paths[i].end == location) {
            deletePath(paths[i]);
            i--;
        }
    }
    if (startLocation == location) updateStartLocation(null);
    if (endLocation == location) updateEndLocation(null);
    updateURL();
}

function deleteCurrentLocation() {
    deleteLocation(currentObject);
    updateCurrentObject(null);
}

function deletePath(path) {
    for (var i = 0; i < paths.length; i++) {
        if (paths[i] == path) {
            pathLayer.removeLayer(path.polyline);
            paths.splice(i, 1);
            break;
        }
    }
    updateURL();
}

function deleteCurrentPath() {
    deletePath(currentObject);
    updateCurrentObject(null);
}

function updateCurrentObject(object) {
    currentObject = object;
    showInfo(currentObject);
}

function updateStartLocation(location) {
    startLocation = location;
    if (startLocation == null) {
        start.style.color = 'gray';
        start.innerText = '(출발 장소를 지정해 주세요)'
    }
    else {
        start.style.color = '';
        start.innerText = startLocation.name;
    }
}

function updateEndLocation(location) {
    endLocation = location;
    if (endLocation == null) {
        end.style.color = 'gray';
        end.innerText = '(도착 장소를 지정해 주세요)'
    }
    else {
        end.style.color = '';
        end.innerText = endLocation.name;
    }
}

//지도 정보 인코딩/디코딩 관련 함수
function locationEncode() {
    let list = [];
    for (let i = 0; i < locations.length; i++) {
        list.push(locations[i].name);
        list.push(locations[i].latlng);
        list.push(locations[i].id);
    }
    return btoa(encodeURIComponent(JSON.stringify(list)));
}

function pathEncode() {
    let list = [];
    for (let i = 0; i < paths.length; i++) {
        list.push(paths[i].start.id);
        list.push(paths[i].end.id);
    }
    return btoa(JSON.stringify(list));
}

function locationDecode(str) {
    let list = JSON.parse(decodeURIComponent(atob(str)));
    while (locations.length > 0) deleteLocation(locations[0]);
    for (let i = 0; i < list.length; i += 3) {
        let location = new Location(list[i], list[i+1], list[i+2]);
        location.showMarker(locationLayer, onMarkerClick);
        locations.push(location);
        location.isRegistered = true;
    }
}

function pathDecode(str) {
    let list = JSON.parse(atob(str));
    while (paths.length > 0) deleteLocation(paths[0]);
    for (let i = 0; i < list.length; i += 2) {
        let path = new Path(getLocationById(list[i]), getLocationById(list[i+1]));
        path.showPath(pathLayer, onPolylineClick);
        paths.push(path);
    }
}

function updateURL() {
    let url = new URL(location);
    url.searchParams.set("marker", locationEncode());
    url.searchParams.set("polyline", pathEncode());
    history.pushState({}, "", url);
}

//초기 세팅
const map = L.map('map').setView([37.545, 127.037], 15);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
const locationLayer = L.layerGroup([]).addTo(map);
const pathLayer = L.layerGroup([]).addTo(map);
const layerControl = L.control.layers(null, {"장소": locationLayer, "경로": pathLayer}).addTo(map);
map.on('click', onMapClick);

let url = new URL(location);
if (url.searchParams.get("marker") != null) locationDecode(url.searchParams.get("marker"));
if (url.searchParams.get("polyline") != null) pathDecode(url.searchParams.get("polyline"));
updateURL();

updateCurrentObject(null);
updateStartLocation(null);
updateEndLocation(null);

//지도 상호작용 관련 함수
function onMapClick(e) {
    if (currentObject instanceof Location && !currentObject.isRegistered) {
        locationLayer.removeLayer(currentObject.marker);
        currentObject = null;
    }
    makeTempLocation(e);
}

function onMarkerClick(e) {
    let clickedLocation = locationOfMarker(e.target);
    if (currentObject instanceof Location && !currentObject.isRegistered) {
        locationLayer.removeLayer(currentObject.marker);
        updateCurrentObject(null);
    }
    if (currentObject == clickedLocation) updateCurrentObject(null);
    else if (clickedLocation != null) {
        updateCurrentObject(clickedLocation);
    }
}

function onPolylineClick(e) {
    L.DomEvent.stopPropagation(e);
    let clickedPath = pathOfPolyline(e.target);
    if (currentObject instanceof Location && !currentObject.isRegistered) {
        locationLayer.removeLayer(currentObject.marker);
        updateCurrentObject(null);
    }
    if (currentObject == clickedPath) updateCurrentObject(null);
    else updateCurrentObject(clickedPath);
}

//'선택한 장소/경로' 관련 함수 & 버튼 설정
function showInfo(object) {
    if (object == null) {
        empty.style.display = '';
        locationInfo.style.display = 'none';
        locationModify.style.display = 'none';
        pathInfo.style.display = 'none';
    }
    else if (object instanceof Location) {
        empty.style.display = 'none';
        locationInfo.style.display = '';
        locationModify.style.display = 'none';
        pathInfo.style.display = 'none';
        locationName.innerText = object.name;
    }
    else if (object instanceof Path) {
        empty.style.display = 'none';
        locationInfo.style.display = 'none';
        locationModify.style.display = 'none';
        pathInfo.style.display = '';
        pathName.innerText = object.start.name + ' → ' + object.end.name;
    }
}

function showModifyScreen(location) {
    empty.style.display = 'none';
    locationInfo.style.display = 'none';
    locationModify.style.display = '';
    pathInfo.style.display = 'none';
    nameModifyText.value = location.name;
    nameModifyText.focus();
    nameModifyText.select();
}

nameModifyButton.addEventListener('click', function() {
    showModifyScreen(currentObject);
});

locationDeleteButton.addEventListener('click', deleteCurrentLocation);

pathDeleteButton.addEventListener('click', deleteCurrentPath);

setStartButton.addEventListener('click', function() {
    updateStartLocation(currentObject);
});

setEndButton.addEventListener('click', function() {
    updateEndLocation(currentObject);
});

nameModifyForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (!currentObject.isRegistered) registerLocation(currentObject, nameModifyText.value);
    else modifyLocationName(currentObject, nameModifyText.value);
});

nameModifyCancel.addEventListener('click', function() {
    if (!currentObject.isRegistered) {
        locationLayer.removeLayer(currentObject.marker);
        currentObject = null;
    }
    showInfo(currentObject);
});


//'경로 생성' 버튼 설정
pathMakingButton.addEventListener('click', function() {
    let result = makePath(startLocation, endLocation);
    if (result == 0) {
        updateStartLocation(endLocation);
        updateEndLocation(null);
    }
});

//'지도 초기화' 버튼 설정
resetPath.addEventListener('click', function() {
    while (paths.length > 0) deletePath(paths[0]);
});

resetAll.addEventListener('click', function() {
    while (locations.length > 0) deleteLocation(locations[0]);
});


//'공유' 버튼 설정
shareWebsite.addEventListener('click', function() {
    let url = new URL(location);
    navigator.clipboard.writeText(url.origin + url.pathname).then(
        function() {
            alert("링크를 클립보드에 복사했습니다.");
        },
        function() {
            alert("링크 복사에 실패했습니다. 잠시 후 다시 시도해 보세요.");
        }
    )
});

shareMap.addEventListener('click', function() {
    let url = new URL(location);
    navigator.clipboard.writeText(url.href).then(
        function() {
            alert("링크를 클립보드에 복사했습니다. (링크가 매우 길 수 있습니다.)");
        },
        function() {
            alert("링크 복사에 실패했습니다. 잠시 후 다시 시도해 보세요.");
        }
    )
});
