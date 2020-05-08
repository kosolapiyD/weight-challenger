$(document).ready(function () {
    // person modal init
    $('#newPersonModal').modal({
        // callback for modal close
        complete: function () {
            // reset all the inputs
            inputPerson.val('');
            inputPerson.trigger('blur');
            removeAlertClasses();
        }
    });
    // weight modal init
    $('#newWeightModal').modal({
        // callback for modal close
        complete: function () {
            // reset all the inputs
            $('#innerWeightPanel').html('');
        }
    });
    loadEventListeners();
});

let allDataGlobalArray = [];
let namesGlobalArray = [];

var firebaseConfig = {
    apiKey: "AIzaSyAUCO7Szf4XvqjoT5Bvk2eITeR0BpYejQk",
    authDomain: "weight-challenger-app.firebaseapp.com",
    databaseURL: "https://weight-challenger-app.firebaseio.com",
    projectId: "weight-challenger-app",
    storageBucket: "weight-challenger-app.appspot.com",
    messagingSenderId: "240302590167",
    appId: "1:240302590167:web:ce9422f67cdf650a3c0892",
    measurementId: "G-6CHFHXLQF6",
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

const weightRef = firebase.database().ref('weights');
weightRef.on("value", function (snapshot) {
    if (snapshot.exists()) {
        onSuccessHandler(snapshot.val())
    } else {
        console.log("no data");
    }
}, function (errorObject) {
    onErrorHandler(errorObject);
});

const newWeightBtn = $('#newWeightBtn');
const saveWeightDataBtn = $('#saveWeightDataBtn');
const savePersonBtn = $('#savePersonBtn');
const inputPerson = $('.input-person');

function loadEventListeners() {
    // open weight modal form
    $(newWeightBtn).on('click', openWeightForm);
    // save the new person data
    $(savePersonBtn).on('click', saveNewPersonData);
    // in new person modal input fields and labels
    $(inputPerson).on('focus', removeAlertClasses);
    // in new weights modal weight inputs and labels
    $(document).on('focus', '.input-weight-num', removeAlertClassesFromWeightModal);
    // save new weights data
    $(saveWeightDataBtn).on('click', saveNewWeights);
}

function onSuccessHandler(data) {
    // copy the array with spread operator
    allDataGlobalArray = [...data]
    sortDataForMainPlaces(data);
    $('#weeklyWeightTable').html('');
    sortDataForWeeks(data);
}

function onErrorHandler(errorObject) {
    console.log("Firebase read failed: " + errorObject.code);
    $('#container').append('<h1>Firebase read failed</h1>');
}

let forMainPlacesDataArr = [];
function sortDataForMainPlaces(data) {
    // grouped by name
    const groupedByNameData = _.groupBy(data, 'name');
    // reset empty on each func call
    forMainPlacesDataArr = [];
    $.each(groupedByNameData, function (name, value) {
        // each participant data sorted by created date
        const orderedDatesArray = _.sortBy(value, function (v) {
            return new Date(v.created);
        });
        // get the weight for each participant from the farest date 
        const weightAtTheBeginning = orderedDatesArray[0].weight;
        const currentWeight = orderedDatesArray[orderedDatesArray.length - 1].weight;
        const currentPercentDifference = (((weightAtTheBeginning - currentWeight) / weightAtTheBeginning) * 100).toFixed(2);

        forMainPlacesDataArr.push({
            'name': name,
            'lost': parseFloat(currentPercentDifference),
            'started_weight': weightAtTheBeginning,
            'current_weight': currentWeight
        })
    })
    buildMainPlacesTable(forMainPlacesDataArr);
}

function buildMainPlacesTable(data) {
    const orderedMainPlacesArray = _.orderBy(data, ['lost'], ['desc']);
    // using it in modals form to add new participants
    const namesArr = [];
    // append this items once only before the for each
    const firstPlacesTitles = `<div id="firstPlacesTitles">
        <span class="place-title"></span>
        <span id="placeTitleLost" class="place-title">Lost</span>
        <span class="place-title">Started</span>
        <span class="place-title">Current</span>
        </div>`
    $('#first3Places').html(firstPlacesTitles);
    $('#restOfPlaces').html(`<div id="restPlacesTable"></div>`);
    // all places for each
    $.each(orderedMainPlacesArray, function (key, value) {
        namesArr.push(value.name.toLowerCase());
        const placeItem = `<div id="place${key + 1}" class="places-main">
            <label id="numCell${key + 1}">${key + 1}</label>
            <label class="place-name places-data">${value.name}</label>
            <label class="place-lost places-data">${value.lost} %</label>
            <label class="places-data">${value.started_weight}</label>
            <label class="places-data">${value.current_weight}</label>
            </div>`
        // first 3 places and the rest
        let elementToAppend = key < 3 ? '#first3Places' : '#restPlacesTable'
        $(elementToAppend).append(placeItem);
    })
    namesGlobalArray = [...namesArr];
}

let lastDate;
function sortDataForWeeks(data) {
    // ordered by week
    const orderedByDate = _.orderBy(data, ['created'], ['asc']);
    // grouped for each week
    const groupedByWeekData = _.groupBy(orderedByDate, 'created');
    lastDate = Object.keys(groupedByWeekData).pop();
    let weeksCounter = 1;
    builWeeklyWeightTable(groupedByWeekData, weeksCounter)
}

function builWeeklyWeightTable(groupedByWeekData, weeksCounter, ) {
    // iterate trough each week
    $.each(groupedByWeekData, function (d, value) {
        // for new person that just added has to be no date
        if (d !== "") {
            const dFormatted = new Date(d);
            const options = { month: 'long', day: 'numeric' };
            const date = dFormatted.toLocaleDateString('en', options);
            // desc ordered by percent weight lost for one week
            const orderedByPercent = _.orderBy(value, ['lost_percent'], ['desc']);
            const weekItem = `<div id="weekCount${weeksCounter}" class="week-card">
            <span class="week-date">${date}</span></div>`
            $('#weeklyWeightTable').append(weekItem);

            for (let i = 0; i < orderedByPercent.length; i++) {
                const name = orderedByPercent[i].name;
                const currentW = orderedByPercent[i].weight;
                const lostWPercent = orderedByPercent[i].lost_percent;
                const inWeekItems = `<div><label class="in-week-data-left in-week-data">${name}</label>
                <label class="in-week-data-center in-week-data">${currentW}</label>
                <label class="in-week-data-right in-week-data">${lostWPercent} %</label>
                </div>`
                $('#weekCount' + weeksCounter).append(inWeekItems);
            }
            weeksCounter++
        }
    });
}

function saveNewPersonData() {
    const name = $(input_name_val).val();
    const weight = $(input_weight_val).val();
    const nameExist = namesGlobalArray.includes(name.toLowerCase());
    if (name === "" || weight === "") {
        if (name === "") {
            addAlertClasses('name');
        }
        if (weight === "") {
            addAlertClasses('weight');
            if (name !== "") addAlertClasses('name', nameExist);
        }
    } else {
        addAlertClasses('name', nameExist);
        if (!nameExist) {
            const person = {
                'name': name,
                'weight': weight,
                "prev_weight": 0,
                "lost_percent": 0,
                "created": ""
            }
            allDataGlobalArray.push(person);
            $('#newPersonModal').modal('close');
        }
    }
    saveToFirebase(allDataGlobalArray);
}

function removeAlertClasses() {
    inputPerson.removeClass('empty-field-border empty-field-text');
    $(`#input_name_val`).next().text('ENTER YOUR NAME');
}

function addAlertClasses(element, nameExist) {
    if (nameExist !== false) {
        $(`#input_${element}_val`).addClass('empty-field-border');
        $(`#input_${element}_val`).next().addClass('empty-field-text');
    }
    if (nameExist) {
        $(`#input_${element}_val`).next().text('THIS NAME IS ALREADY EXIST');
    }
}

function openWeightForm() {
    const currentDate = new Date().toISOString().split('T')[0];
    // cannot weight twice at the same day
    if (currentDate === lastDate) {
        $('#innerWeightPanel').append('<div><h3 style="color: #26a69a;">You already weighted today!<br>Try again tomorrow...</h3></div>');
        $('#saveWeightDataBtn').text('close');
        return;
    }
    const names = forMainPlacesDataArr.reverse();
    for (let i = 0; i < names.length; i++) {
        const name = names[i].name
        const prevW = names[i].current_weight
        const weightItem = `<div class="weight-item">
            <div class="input-field col s12">
            <i class="material-icons prefix active">account_circle</i>
            <input type="text" class="input-weight-name" value=${name} data-prevkg=${prevW} disabled>
            <label for="icon_prefix" class="input-person-label active">NAME</label>
            </div>
            <div class="input-field col s12">
            <i class="material-icons prefix">fitness_center</i>
            <input type="number" class="input-weight-num">
            <label for="icon_fitness_center" class="input-weight-label">add your weight</label>
            </div></div>`
        $('#innerWeightPanel').append(weightItem);
    }
}

function saveNewWeights() {
    let validFieldsCount = 0;
    $('.input-weight-num').each(function () {
        if ($(this).val() === "") {
            $(this).addClass('empty-field-border');
            $(this).next().addClass('empty-field-text');
        } else {
            validFieldsCount++
        }
    });
    // all the fields not empty if validFieldsCount equals to all fields length
    if (validFieldsCount === $('.input-weight-num').length) {
        $('.weight-item').each(function () {
            const name = $(this).find('.input-weight-name').val();
            const weight = $(this).find('.input-weight-num').val();
            const prevW = $(this).find('.input-weight-name').data("prevkg");
            const currentDate = new Date().toISOString().split('T')[0];
            const lost = (((prevW - weight) / prevW) * 100).toFixed(2);
            const newWeights = {
                'name': name,
                'weight': parseFloat(weight),
                "prev_weight": prevW,
                "lost_percent": parseFloat(lost),
                "created": currentDate
            }
            allDataGlobalArray.push(newWeights);
        });
        saveToFirebase(allDataGlobalArray);
        $('#newWeightModal').modal('close');
    }
}

// onfocus on any '.input-weight-num' field removes the alert classe
function removeAlertClassesFromWeightModal() {
    $(this).removeClass('empty-field-border');
    $(this).next().removeClass('empty-field-text');
}

function saveToFirebase(data) {
    weightRef.set(data);
}
