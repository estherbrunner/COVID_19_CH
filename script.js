var oldDate = null;
console.logCopy = console.log.bind(console);
console.log = function(arguments) {
  if (arguments.length) {
    var d = new Date();
    if (oldDate == null) {
      timestamp = '';
    } else {
      var diff = d-oldDate;
      var msec = diff;
      var ss = Math.floor(msec / 1000);
      msec -= ss * 1000;
      var timestamp = '[' + ss + ':' + msec + '] ';
    }
    oldDate = d;
    this.logCopy(timestamp, arguments);
  }
};

const cantons = ['AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH', 'FL'];

const names = {
  "CH": "Schweiz",
  "AG": "Aargau",
  "AI": "Appenzell Innerrhoden",
  "AR": "Appenzell Ausserrhoden",
  "BE": "Bern",
  "BL": "Basel Land",
  "BS": "Basel Stadt",
  "FR": "Freiburg",
  "GE": "Genf",
  "GL": "Glarus",
  "GR": "Graubünden",
  "JU": "Jura",
  "LU": "Luzern",
  "NE": "Neuenburg",
  "NW": "Nidwalden",
  "OW": "Obwalden",
  "SG": "St. Gallen",
  "SH": "Schaffhausen",
  "SO": "Solothurn",
  "SZ": "Schwyz",
  "TG": "Thurgau",
  "TI": "Tessin",
  "UR": "Uri",
  "VD": "Waadt",
  "VS": "Wallis",
  "ZG": "Zug",
  "ZH": "Zürich",
  "FL": "Fürstentum Liechtenstein",
  101: "Affoltern",
  102: "Andelfingen",
  103: "Bülach",
  104: "Dielsdorf",
  105: "Hinwil",
  106: "Horgen",
  107: "Meilen",
  108: "Pfäffikon",
  109: "Uster",
  110: "Winterthur",
  111: "Dietikon",
  112: "Zürich"
};

const ageGroups = ['0 - 9', '10 - 19', '20 - 29', '30 - 39', '40 - 49', '50 - 59', '60 - 69', '70 - 79', '80+'];

var verbose = true;
var dataSourceCantons = 'BAG'; // Cantons
var cantonsData = [];
var casesData;
var byAgeData;
var dataPerDay = [];
var zipDataPerDay = [];
var dateOffset = 0;
var chartPeriodLength = 60;
var canvasHeight = document.body.clientWidth < 421 ? 210 : 300;
var proxyURL = 'https://cors-anywhere.herokuapp.com/';
Chart.defaults.global.defaultFontFamily = "IBM Plex Sans";
document.getElementById("loaded").style.display = 'none';

//console.log("START");
if (dataSourceCantons === 'BAG') {
  getCases();
} else {
  getCantons();
}

/**
 * Load BAG cases data
 */
function getCases() {
  var url = 'https://www.covid19.admin.ch/api/data/context';
  d3.json(url, function(error, jsondata) {
    var casesURL = jsondata.sources.individual.json.daily.cases;
    var byAgeURL = jsondata.sources.individual.json.weekly.byAge.cases;
    d3.queue()
    .defer(d3.json, "kantone.json")
    .defer(d3.json, casesURL)
    .defer(d3.json, byAgeURL)
    .await(function(error, topo, cases, byAge) {
      casesData = cases;
      byAgeData = byAge;

      // console.log(casesData);
      // console.log(byAgeData);

      var source = document.getElementById('ch_source__name');
      source.innerHTML = 'des BAG';
      var updated = document.getElementById('ch_source__updated');
      updated.innerHTML = formatDate(new Date(jsondata.sourceDate.split('_')[0]));

      var projection = d3.geoMercator()
        .center([8.3, 46.8])
        .scale(11000);
      drawMap('#map_cantons', topo, projection, null, function() {
        getCanton(25, processData); // ZH
      });
    });
  });
}

/**
 * Load data for cantons
 * 
 * @param {integer} i - index of canton
 * @param {function} callback - function to call after data is loaded
 */
function getCanton(i, callback) {
  // var url = "https://raw.githubusercontent.com/openZH/covid_19/master/COVID19_Fallzahlen_CH_total_v2.csv";
  var url = 'https://raw.githubusercontent.com/openZH/covid_19/master/fallzahlen_kanton_total_csv_v2/COVID19_Fallzahlen_Kanton_'+cantons[i]+'_total.csv';
  if (cantons[i] == "FL") {
    var url = 'https://raw.githubusercontent.com/openZH/covid_19/master/fallzahlen_kanton_total_csv_v2/COVID19_Fallzahlen_FL_total.csv';
  }
  d3.csv(url, function(error, csvdata) {
    if (error != null) {
      console.log(error.responseURL + " not found");
    } else {
      for (var x = 0; x < csvdata.length; x++) {
        if (!csvdata[x].abbreviation_canton_and_fl) continue;
        var splitDate = csvdata[x].date.split('.');
        if (splitDate.length > 1) {
          csvdata[x].date = splitDate[2] + '-' + splitDate[1] + '-' + splitDate[0];
        }
        cantonsData.push(csvdata[x]);
      }
      if (verbose) {
        console.log("added " + csvdata.length + " rows for " + cantons[i]);
      }
    }
    if (typeof callback === 'function') callback();
  });
}

function processData() {
  document.getElementById("loadingspinner").style.display = 'none';
  document.getElementById("loaded").style.display = 'block';
  getDataPerDay();
  drawCantonTable();
  drawBarChart('CH', dataPerDay.slice(dataPerDay.length - chartPeriodLength - dateOffset - 3, dataPerDay.length - dateOffset - 3), 'index'); // exclude last 3 days because of insufficient data
  var canton = 'ZH';
  var filteredData = dataPerDay.map(function(d) {
    return d.canton.filter(function(dd) { return dd.Canton === canton; })[0];
  });
  var dataForTodayUnavailable = (!dataPerDay[dataPerDay.length - 1].canton.length);
  drawBarChart(canton, filteredData.slice(dataPerDay.length - chartPeriodLength - dateOffset - dataForTodayUnavailable, dataPerDay.length - dateOffset - dataForTodayUnavailable), 'overview_zh');
  // getDistricts();
  getZIP();
  addEventListeners();
}

function redrawData(diff) {
  dateOffset -= diff;

  enableDisableButtons();

  document.querySelector('#barchart_index').remove();
  drawBarChart('CH', dataPerDay.slice(dataPerDay.length - chartPeriodLength - dateOffset, dataPerDay.length - dateOffset), 'index');

  if (document.querySelector('#barchart_canton')) {
    document.querySelector('#barchart_canton').remove();
  }
  document.getElementById('confirmed_1').innerHTML = '';
  document.getElementById('confirmed_2').innerHTML = '';
  drawCantonTable();

  document.querySelector('#barchart_overview_zh').remove();
  var canton = 'ZH';
  var filteredData = dataPerDay.map(function(d) {
    return d.canton.filter(function(dd) { return dd.Canton === canton; })[0];
  });
  drawBarChart(canton, filteredData.slice(dataPerDay.length - chartPeriodLength - dateOffset, dataPerDay.length - dateOffset), 'overview_zh');

  document.getElementById('plzbody').innerHTML = '';
  if (document.querySelector('#barchart_zip')) {
    document.querySelector('#barchart_zip').remove();
  }
  drawPLZTable();
}

function enableDisableButtons() {
  var startDate = new Date('2020-08-02');
  var endDate = new Date(zipDataPerDay[zipDataPerDay.length - 1].Date);
  enableDisableButton('.period__button--prev-week', startDate, endDate, -7);
  enableDisableButton('.period__button--prev-day', startDate, endDate, -1);
  enableDisableButton('.period__button--next-day', startDate, endDate, 1);
  enableDisableButton('.period__button--next-week', startDate, endDate, 7);
}

function enableDisableButton(selector, startDate, endDate, diff) {
  var buttonDate = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - dateOffset + diff));
  if (buttonDate.getTime() >= startDate.getTime() && buttonDate.getTime() <= endDate.getTime()) {
    document.querySelectorAll(selector).forEach(function(btn) { btn.removeAttribute('disabled'); });
  } else {
    document.querySelectorAll(selector).forEach(function(btn) { btn.setAttribute('disabled', true); });
  }
}

function addEventListeners() {
  document.querySelectorAll('.period__button--prev-week').forEach(function(btn) { btn.addEventListener('click', function() { redrawData(-7); }); });
  document.querySelectorAll('.period__button--prev-day').forEach(function(btn) { btn.addEventListener('click', function() { redrawData(-1); }); });
  document.querySelectorAll('.period__button--next-day').forEach(function(btn) { btn.addEventListener('click', function() { redrawData(1); }); });
  document.querySelectorAll('.period__button--next-week').forEach(function(btn) { btn.addEventListener('click', function() { redrawData(7); }); });
}

function getCantons() {
  var url = 'https://raw.githubusercontent.com/rsalzer/COVID_19_BAG/master/data/casesPerCanton.csv';
  d3.queue()
    .defer(d3.json, "kantone.json")
    .defer(d3.csv, url)
    .await(function(error, topo, csvdata) {
      var projection = d3.geoMercator()
        .center([8.3, 46.8])
        .scale(11000);
      drawMap('#map_cantons', topo, projection, null, function() {
        var source = document.getElementById('ch_source__name');
        source.innerHTML = 'der Kantone';
        for (var i = 0; i < cantons.length; i++) {
          if (i === cantons.length - 1) {
            getCanton(i, processData);
          } else {
            getCanton(i);
          }
        }
      });
    });
}

function getZIP() {
  var url = 'https://raw.githubusercontent.com/openZH/covid_19/master/fallzahlen_plz/fallzahlen_kanton_ZH_plz.csv';
  d3.queue()
    .defer(d3.json, "https://raw.githubusercontent.com/openZH/covid_19/master/fallzahlen_plz/PLZ_gen_epsg4326_F_KTZH_2020.json")
    .defer(d3.csv, url)
    .await(function(error, topo, csvdata) {
      var projection = d3.geoMercator()
        .center([8.675, 47.43]) // GPS of location to zoom on
        .scale(33000);          // This is like the zoom
      getZIPDataPerDay(csvdata);
      drawMap('#map_zipcodes', topo, projection, 'PLZ', function() {
        drawPLZTable();
      });
    });
}

function getDataPerDay() {
  var mostRecent = new Date(casesData[casesData.length - 1].datum);
  var j = Math.floor((mostRecent - new Date('2020-06-01')) / (1000 * 60 * 60 * 24));
  for (j; j >= 0; j--) {
    var dateString = getDateString(mostRecent, -j);
    var singleDayObject = {
      Date: dateString,
      Population: casesData[0].pop,
      bag: [],
      canton: []
    };
    for (var i = 0; i < cantons.length - 1; i++) { // without FL
      singleDayObject.bag.push(getSingleDayObject(cantons[i], dateString, true));
    }
    singleDayObject.canton.push(getSingleDayObject('ZH', dateString, false)); // get cantonal data for 'ZH'
    if (dataSourceCantons == 'BAG') {
      var filteredData = casesData.filter(function(d) {
        if (d.datum == dateString && d.geoRegion == 'CH') return d;
      })[0];
      if (filteredData.sumTotal) {
        singleDayObject.TotalConfCases = filteredData.sumTotal;
        singleDayObject.NewConfCases_1day = filteredData.entries;
        singleDayObject.NewConfCases_7days = filteredData.sum7d;
        singleDayObject.NewConfCases_7dayAverage = filteredData.mean7d;
      }
    } else {
      singleDayObject.TotalConfCases = singleDayObject.bag.reduce(function(acc, val) { return acc + val.TotalConfCases; }, 0);
      singleDayObject.NewConfCases_1day = singleDayObject.bag.reduce(function(acc, val) { return acc + val.NewConfCases_1day; }, 0);
      singleDayObject.NewConfCases_7days = singleDayObject.bag.reduce(function(acc, val) { return acc + val.NewConfCases_7days; }, 0);
      if (singleDayObject.bag[0].NewConfCases_7dayAverage) {
        singleDayObject.NewConfCases_7dayAverage = singleDayObject.bag.reduce(function(acc, val) { return acc + val.NewConfCases_7dayAverage; }, 0);
      }
    }
    dataPerDay.push(singleDayObject);
  }
  if (verbose) {
    console.log(dataPerDay);
  }
}

function getZIPDataPerDay(zipdata) {
  var mostRecent = new Date(zipdata[zipdata.length - 1].Date);
  var j = Math.floor((mostRecent - new Date('2020-07-09')) / (1000 * 60 * 60 * 24));
  for (j; j >= 0; j--) {
    var dateString = getDateString(mostRecent, -j);
    zipDataPerDay.push({
      Date: dateString,
      data: zipdata.filter(function(d) { if (d.Date == dateString) return d; })
    });
  }
  if (verbose) {
    console.log(zipDataPerDay);
  }
}

function drawCantonTable() {
  var dataPerCanton = dataPerDay[dataPerDay.length - dateOffset - 4].bag.map(function(value, i) { // exclude last 3 days because of insufficent data
    return {
      'Canton': value.Canton,
      'NewConfCases_7days': value.NewConfCases_7days,
      'OldConfCases_7days': dataPerDay[dataPerDay.length - dateOffset - 11].bag[i].NewConfCases_7days,
      'Population': value.Population,
      'Date': value.Date,
    }
  });
  var lastDate = dataPerDay[dataPerDay.length - dateOffset - 4].Date;
  var endDay = new Date(lastDate);
  var startDay = new Date(lastDate);
  startDay.setDate(startDay.getDate() - 13);
  var period = document.getElementById('canton_period__dates');
  period.innerHTML = formatDate(startDay) + ' – ' + formatDate(endDay);
  var table;
  var firstTable = document.getElementById("confirmed_1");
  var secondTable = document.getElementById("confirmed_2");
  for (var i = 0; i < dataPerCanton.length; i++) {
    if (i < dataPerCanton.length / 2) table = firstTable;
    else table = secondTable;
    var cantonData = dataPerCanton[i];
    var tr = document.createElement('tr');
    tr.id = 'row_' + cantonData.Canton;
    tr.className = 'row';
    tr.setAttribute('data-id', cantonData.Canton);
    var td = document.createElement("td");
    td.className = 'cell cell--name';
    var span = document.createElement("span");
    span.className = 'flag flag--' + cantonData.Canton;
    span.appendChild(document.createTextNode(names[cantonData.Canton]));
    td.appendChild(span);
    tr.appendChild(td);
    var risk = getRiskObject(cantonData.OldConfCases_7days, cantonData.NewConfCases_7days, cantonData.Population);
    td = document.createElement("td");
    td.className = 'cell cell--' + risk.className;
    td.innerHTML = formatNumber(cantonData.OldConfCases_7days + cantonData.NewConfCases_7days) + '<br><strong>' + formatNumber(risk.incidence) + '</strong>';
    tr.appendChild(td);
    td = document.createElement("td");
    td.className = 'cell cell--' + risk.className_thisWeek;
    td.innerHTML = formatNumber(cantonData.NewConfCases_7days) + '<br><strong>' + formatNumber(risk.incidence_thisWeek) + '</strong>';
    tr.appendChild(td);
    td = document.createElement("td");
    td.className = 'cell cell--' + risk.tendency;
    td.innerHTML = '<strong>' + risk.changeString + '</strong>';
    document.getElementById('area_' + cantonData.Canton).setAttribute('class', 'area area--risk-' + risk.className_thisWeek);
    tr.addEventListener('click', function(e) {
      var id = e.currentTarget.getAttribute('data-id');
      var evt = new MouseEvent('click');
      d3.select('#area_' + id).node().dispatchEvent(evt);
    });
    tr.appendChild(td);
    table.appendChild(tr);
  }
}

/**
 * Get single day object
 * 
 * @param {string} canton - 2 letter identifier of canton
 * @param {string} dateString - ISO formatted date string
 * @param {boolean} useBAGData - use BAG data source, defaults to whether dataSourceCantons is 'BAG'
 * @returns {object} - single day object
 */
function getSingleDayObject(canton, dateString, useBAGData) {
  if (typeof useBAGData === 'undefined') useBAGData = (dataSourceCantons === 'BAG');
  var singleDayObject = {
    Canton: canton,
    Date: dateString
  };
  if (useBAGData) {
    var filteredData = casesData.filter(function(d) {
      if (d.datum == dateString && d.geoRegion == canton) return d;
    })[0];
    if (filteredData.sumTotal) {
      singleDayObject.TotalConfCases = filteredData.sumTotal;
      singleDayObject.NewConfCases_1day = filteredData.entries;
      singleDayObject.NewConfCases_7days = filteredData.sum7d;
      singleDayObject.NewConfCases_7dayAverage = filteredData.mean7d;
      singleDayObject.Population = filteredData.pop;
    }
  } else {
    var today = getTotalConfCases(canton, dateString, true);
    var yesterday = getTotalConfCases(canton, getDateString(new Date(dateString), -1), true);
    var minus4days = getTotalConfCases(canton, getDateString(new Date(dateString), -4), true);
    var plus3days = getTotalConfCases(canton, getDateString(new Date(dateString), +3), false);
    var minus7days = getTotalConfCases(canton, getDateString(new Date(dateString), -7), true);
    if (today) {
      singleDayObject.TotalConfCases = today;
      if (yesterday) singleDayObject.NewConfCases_1day = today - yesterday;
      if (minus7days) singleDayObject.NewConfCases_7days = today - minus7days;
      if (minus4days && plus3days) singleDayObject.NewConfCases_7dayAverage = (plus3days - minus4days) / 7;
    }
  }
  return singleDayObject;
}

/**
 * Get cumulated number of confirmed cases
 * 
 * @param {string} canton - 2 letter identifier of canton
 * @param {string} dateString - ISO formatted date string
 * @param {boolean} searchPast - if no data is available return data from last date with data?
 * @returns {number} - total number of confirmed cases
 */
function getTotalConfCases(canton, dateString, searchPast) {
  var variable = 'ncumul_conf';
  var filteredData = cantonsData.filter(function(d) {
    if (d.abbreviation_canton_and_fl == canton && d.date == dateString && d[variable] != '') return d;
  });
  if (filteredData.length > 0) {
    return parseInt(filteredData[filteredData.length - 1][variable]);
  }
  // else try day before
  if (searchPast) {
    return getTotalConfCases(canton, getDateString(new Date(dateString), -1), true);
  }
  return null;
}

/**
 * Draw bar chart
 * 
 * @param {string} place - 'CH' or canton abbreviation
 * @param {object} filteredData - prefiltered data for place and date range
 * @param {string} sectionId - section to render chart to
 */
function drawBarChart(place, filteredData, sectionId) {
  if (!filteredData || !filteredData[0]) {
    return; // fail gracefully
  }
  var section = document.getElementById(sectionId);
  var article = document.createElement('article');
  var pop = filteredData[0].Population ? filteredData[0].Population : 1539275; // fallback population size of ZH

  if (sectionId === 'index') {
    article.id = 'barchart_index';
  } else if (sectionId === 'overview_zh') {
    article.id = 'barchart_overview_zh';
  } else if (sectionId === 'cantons') {
    article.id = 'barchart_canton';
    if (document.getElementById(article.id)) {
      document.getElementById(article.id).remove();
    }
    var h3 = document.createElement('h3');
    h3.className = 'flag flag--' + place;
    h3.innerHTML = 'Kanton ' + names[place];
    article.appendChild(h3);
    var p = document.createElement('p');
    p.innerHTML = formatNumber(pop) + ' Einwohner\'innen';
    article.appendChild(p);
  } else if (sectionId === 'zipcodes') {
    article.id = 'barchart_zip';
    if (document.getElementById(article.id)) {
      document.getElementById(article.id).remove();
    }
    var h3 = document.createElement('h3');
    h3.innerHTML = place + ' ' + plzNames[place].replaceAll('<br/>', ' ');
    article.appendChild(h3);
    var p = document.createElement('p');
    p.innerHTML = formatNumber(pop) + ' Einwohner\'innen';
    article.appendChild(p);
  }

  var card = document.createElement('table');
  var casesLastWeek, casesThisWeek;
  if (sectionId === 'zipcodes') {
    casesLastWeek = parsePrevalenceRange(filteredData[filteredData.length - 8].NewConfCases_7days);
    casesThisWeek = parsePrevalenceRange(filteredData[filteredData.length - 1].NewConfCases_7days);
  } else {
    casesLastWeek = filteredData[filteredData.length - 8].NewConfCases_7days;
    casesThisWeek = filteredData[filteredData.length - 1].NewConfCases_7days;
  }
  var risk = getRiskObject(casesLastWeek, casesThisWeek, pop);
  var riskLabel = getRiskLabel(risk.incidence_thisWeek);
  var tendencyLabel = isNaN(risk.changePercentage) ? '' : getTendencyLabel(risk.changePercentage);

  card.className = 'figure figure--' + risk.className_thisWeek;
  card.innerHTML = '<thead><tr>'
    + '<th class="figure__column-header cell--' + risk.className + '" scope="col">14 Tage ab ' + formatDate(new Date(filteredData[filteredData.length - 14].Date)) + '</th>'
    + '<th class="figure__column-header" scope="col">7 Tage ab ' + formatDate(new Date(filteredData[filteredData.length - 7].Date)) + '</th>'
    + '<th class="figure__column-header" scope="col">Veränderung zur Vorwoche</th>'
    + '</tr></thead><tbody><tr>'
    + '<td class="cell cell--' + risk.className + '">' + formatNumber(casesLastWeek + casesThisWeek) + '<br/><strong>' + formatNumber(risk.incidence) + '</strong></td>'
    + '<td class="cell">' + formatNumber(casesThisWeek) + '<br/><strong class="figure__number">' + formatNumber(risk.incidence_thisWeek) + '</strong><br/>' + riskLabel + '</td>'
    + '<td class="cell cell--' + risk.tendency + '"><strong>' + risk.symbol + risk.changeString + '</strong><br/> ' + tendencyLabel + '</td>'
    + '</tr></tbody>';
  article.appendChild(card);
  var div = document.createElement("div");
  div.className = "canvas-dummy";
  div.id = "container_" + place;
  var canvas = document.createElement("canvas");
  if (filteredData.length == 0) {
    div.appendChild(document.createTextNode(_("Keine Daten")));
  } else {
    canvas.id = place;
    canvas.height = canvasHeight;
    div.appendChild(canvas);
  }
  article.appendChild(div);
  section.appendChild(article);

  if (sectionId === 'index' || sectionId === 'cantons') {
    drawAgeGraph(place, filteredData[0].Date, filteredData[filteredData.length - 1].Date, article.id);
  }

  var dateLabels = filteredData.map(function(d) {
    return d.Date;
  });
  var averages = filteredData.map(function(d) {
    if (d.NewConfCases_7dayAverage) return Math.round(100 * d.NewConfCases_7dayAverage) / 100;
    else if (d.NewConfCases_7days && (sectionId === 'zipcodes')) return Math.round(100 * parsePrevalenceRange(d.NewConfCases_7days) / 7) / 100;
  });
  var averageColors = filteredData.map(function(d) {
    var incidence;
    if (d.NewConfCases_7dayAverage) {
      incidence = 7 * 100000 * d.NewConfCases_7dayAverage / pop;
    } else if (d.NewConfCases_7days && (sectionId === 'zipcodes')) {
      if (d.NewConfCases_7days === '0-3') {
        if (pop < 2500) return '#8c8c8c'; // gray - cannot calculate incidence
        else if (pop < 5000) return '#ae997a';
        else if (pop < 10000) return '#b3b251';
      }
      incidence = 100000 * parsePrevalenceRange(d.NewConfCases_7days) / pop;
    }
    return getIncidenceColor(incidence, 1);
  });

  var datasets = [{
    data: averages,
    order: 0,
    label: '7 Tage Ø',
    type: 'line',
    pointRadius: 5,
    pointBorderWidth: 0,
    pointBorderColor: 'transparent',
    pointBackgroundColor: averageColors,
    spanGaps: true,
    borderColor: inDarkMode() ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
    backgroundColor: 'transparent'
  }];

  if (sectionId !== 'zipcodes') {
    var cases = filteredData.map(function(d) {
      return d.NewConfCases_1day;
    });
    var casesColors = filteredData.map(function(d) {
      var incidence = 7 * 100000 * d.NewConfCases_1day / pop;
      return getIncidenceColor(incidence, 0.5);
    });
    datasets.push({
      data: cases,
      order: 1,
      label: 'Neuinfektionen',
      type: 'bar',
      backgroundColor: casesColors
    });
  }

  new Chart(canvas.id, {
    type: 'bar',
    options: {
      layout: {
        padding: {
          left: 20,
          top: 20
        }
      },
      responsive: false,
      legend: {
        display: false
      },
      title: {
        display: false
      },
      tooltips: {
        enabled: true,
        mode: 'index'
      },
      scales: getScales()
    },
    data: {
      labels: dateLabels,
      datasets: datasets
    }
  });
}

/**
 * Calculate rgba color for incidence and a given opacity
 * 
 * @param {number} incidence - 7 day incidence
 * @param {number} opacity - [0 - 1]
 */
function getIncidenceColor(incidence, opacity) {
  if (incidence >= 960) return 'rgba(74, 37, 162, ' + opacity + ')'; // dark blue
  else if (incidence >= 480) return 'rgba(125, 42, 159, ' + opacity + ')'; // purple
  else if (incidence >= 240) return 'rgba(166, 53, 135, ' + opacity + ')'; // fuchsia
  else if (incidence >= 120) return 'rgba(197, 72, 96, ' + opacity + ')'; // pink
  else if (incidence >= 60) return 'rgba(213, 101, 52, ' + opacity + ')'; // red
  else if (incidence >= 30) return 'rgba(210, 138, 2, ' + opacity + ')'; // orange
  else if (incidence >= 15) return 'rgba(182, 178, 29, ' + opacity + ')'; // yellow
  return 'rgba(127, 213, 96, ' + opacity + ')'; // green
}

function getScales() {
  return {
    xAxes: [{
      type: 'time',
      stacked: true,
      offset: true,
      time: {
        tooltipFormat: 'DD.MM.YYYY',
        unit: 'day',
        displayFormats: {
          day: 'DD.MM.'
        }
      },
      gridLines: {
        display: false,
        offsetGridLines: true,
        color: inDarkMode() ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
      }
    }],
    yAxes: [{
      type: 'linear',
      stacked: true,
      position: 'right',
      ticks: {
        beginAtZero: true,
        suggestedMax: 10,
      },
      gridLines: {
        color: inDarkMode() ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
      }
    }]
  };
}

/**
 * Draw age graph
 * 
 * @param {string} place - 'CH' or canton abbreviation
 * @param {Date} startDate - begin of period
 * @param {Date} endDate - end of period
 * @param {string} containerId - article to render table into
 */
function drawAgeGraph(place, startDate, endDate, containerId) {
  var container = document.getElementById(containerId);
  var isoWeekStart = getISOWeekOfDate(startDate);
  var isoWeekEnd = getISOWeekOfDate(endDate);
  var filteredData = byAgeData.filter(function(d) {
    return (d.geoRegion === place) && (d.datum >= isoWeekStart) && (d.datum <= isoWeekEnd);
  });

  var canvas = document.createElement('canvas');
  canvas.id = 'age_' + place;
  canvas.className = 'age-graph';
  canvas.height = 2 * canvasHeight / 3;
  container.appendChild(canvas);

  var week;
  var weeks = [];
  var weekLabels = [];
  var weekDatasets = [];
  var ageGroupData;
  var gradientFill;
  var i, j;
  for (i = 0; i < filteredData.length / 10; i++) {
    week = filteredData[i].datum;
    weeks.push(week);
    weekLabels.push(formatDate(getDateOfISOWeek(week.toString().substr(4, 2), week.toString().substr(0, 4))));
  }

  for (i = 0; i < ageGroups.length; i++) {
    ageGroupData = filteredData.filter(function(d) {
      return d.altersklasse_covid19 === ageGroups[i];
    });
    if (document.body.clientWidth < 421) {
      gradientFill = canvas.getContext('2d').createLinearGradient(40, 0, canvas.clientWidth - 10, 0);
    } else {
      gradientFill = canvas.getContext('2d').createLinearGradient(20, 0, canvas.clientWidth - 20, 0);
    }
    for (j = 0; j < ageGroupData.length; j++) {
      gradientFill.addColorStop(j / (ageGroupData.length -1), getIncidenceColor(ageGroupData[j].inz_entries, (i + 2) / 10));
    }
    weekDatasets.push({
      label: ageGroups[i],
      fill: i === 0 ? 'start' : '-1',
      backgroundColor: gradientFill,
      borderWidth: 1,
      borderColor: inDarkMode() ? '#000000' : '#ffffff',
      pointRadius: 0,
      pointBorderWidth: 0,
      data: ageGroupData.map(function(d) { return d.prct; })
    });
  }

  new Chart(canvas.id, {
    type: 'line',
    options: {
      responsive: false,
      legend: {
        display: false
      },
      title: {
        display: false
      },
      tooltips: {
        enabled: true,
        mode: 'index',
        intersect: false,
        position: 'nearest',
        callbacks: {
          label: function(tooltipItem, data) {
            var label = data.datasets[tooltipItem.datasetIndex].label || '';
            label += ': ' + tooltipItem.yLabel + '%';
            return label;
          }
        }
      },
      scales: {
        yAxes: [{
          stacked: true,
          display: false,
          ticks: {
            suggestedMax: 100,
            max: 100
          },
          gridLines: {
            color: inDarkMode() ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
          }
        }]
      }
    },
    data: {
      labels: weekLabels,
      datasets: weekDatasets
    }
  });
}

/**
 * Get whether app is in dark mode
 * 
 * @returns {boolean}
 */
function inDarkMode() {
  return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

/**
 * Draw SVG map
 * 
 * @param {string} container - selector of map container
 * @param {object} topoData - geoJSON to draw
 * @param {object} projection - d3 projection
 * @param {string} idAttribute - property to be used as identifier
 * @param {function} callback - function to call after map is drawn
 */
function drawMap(container, topoData, projection, idAttribute, callback) {
  var svg = d3.select(container);
  var width = parseInt(svg.attr('width'));
  var height = parseInt(svg.attr('height'));
  var selectedArea;
  var getId = function(d) { return (idAttribute ? d.properties[idAttribute] : d.id); };
  var getName = function(d) { return (d.properties.Ortschaftsname || names[d.id]); };
  var isLake = function(d) { return (d.properties.Ortschaftsname == 'See' || d.properties.BEZ_N == 'See'); };

  svg.selectAll('*').remove();
  projection.translate([width / 2, height / 2]);
  const path = d3.geoPath().projection(projection);

  // Draw the map
  svg
    .attr('preserveAspectRatio', 'xMidYMid')
    .attr('viewBox', '0 0 ' + width + ' ' + height)
    .append('g')
    .selectAll('path')
    .data(topoData.features)
    .enter()
    .append('path')
    .attr('d', path)
    .attr('id', function(d) {
      var id = getId(d);
      if (id) return 'area_' + id;
      return false;
    })
    .attr('class', function(d) {
      return (isLake(d) ? 'lake' : 'area');
    })
    .on('click', function(d) {
      var id = getId(d);
      if (id) {
        var selectedAreaClass = 'area--selected';
        var selectedRowClass = 'row--selected';
        if (selectedArea) {
          document.getElementById('area_' + selectedArea).classList.remove(selectedAreaClass);
          if (document.getElementById('row_' + selectedArea)) document.getElementById('row_' + selectedArea).classList.remove(selectedRowClass);
        }
        selectedArea = id;
        document.getElementById('area_' + id).classList.add(selectedAreaClass);
        if (document.getElementById('row_' + id)) document.getElementById('row_' + id).classList.add(selectedRowClass);
        if (container === '#map_cantons') {
          var filteredData = dataPerDay.map(function(d) {
            return d.bag.filter(function(dd) { return dd.Canton === id; })[0];
          });
          drawBarChart(id, filteredData.slice(dataPerDay.length - chartPeriodLength - dateOffset - 3, dataPerDay.length - dateOffset - 3), 'cantons'); // exclude last 3 days because of insufficient data
        } else if (container === '#map_zipcodes') {
          var filteredData = zipDataPerDay.map(function(d) {
            return d.data.filter(function(dd) { if (dd.PLZ == id) return dd; })[0];
          });
          drawBarChart(id, filteredData.slice(zipDataPerDay.length - chartPeriodLength - dateOffset, zipDataPerDay.length - dateOffset), 'zipcodes');
        }
      }
    })
    .append("svg:title")
    .text(function(d, i) {
      return getName(d);
    });

  var updateSize = function() {
    var w = svg.node().parentElement.getBoundingClientRect().width;
    var h = w * height / width;
    svg.attr('width', w);
    svg.attr('height', h);
    if (container === '#map_zipcodes') {
      d3.select('#scrolldiv').style('height', h + 'px');
    }
  };

  window.addEventListener('resize', updateSize);
  updateSize();
  
  if (typeof callback === 'function') callback();
}

function drawPLZTable() {
  var tbody = document.getElementById("plzbody");
  var lastDate = zipDataPerDay[zipDataPerDay.length - dateOffset - 1].Date;
  var endDay = new Date(lastDate);
  var startDay = new Date(lastDate);
  startDay.setDate(startDay.getDate() - 13);
  var period = document.getElementById('zip_period__dates');
  period.innerHTML = formatDate(startDay) + ' – ' + formatDate(endDay);
  var updated = document.getElementById('zh_source__updated');
  updated.innerHTML = formatDate(new Date(zipDataPerDay[zipDataPerDay.length - 1].Date));
  var filteredPLZData = zipDataPerDay[zipDataPerDay.length - dateOffset - 1].data;
  for (var i = 0; i < filteredPLZData.length; i++) {
    var singlePLZ = filteredPLZData[i];
    var plz = "" + singlePLZ.PLZ;
    var lastWeek = zipDataPerDay[zipDataPerDay.length - dateOffset - 8].data.filter(function(d) { if (d.PLZ == plz) return d; })[0];
    singlePLZ.OldConfCases_7days = lastWeek.NewConfCases_7days;
    var name = plzNames[plz];
    if (name == undefined) name = '';
    var tr = document.createElement('tr');
    tr.id = 'row_' + plz;
    tr.className = 'row';
    tr.setAttribute('data-id', plz);
    var lastWeekParsed = parsePrevalenceRange(singlePLZ.OldConfCases_7days);
    var thisWeekParsed = parsePrevalenceRange(singlePLZ.NewConfCases_7days);
    var newConfCases_14days = lastWeekParsed + thisWeekParsed;
    if (plz.length > 4) {
      name = plz;
      plz = '&nbsp;';
    } else {
      var risk = getRiskObject(lastWeekParsed, thisWeekParsed, parseInt(singlePLZ.Population));
      var svgPolygon = document.getElementById('area_' + singlePLZ.PLZ);
      if (svgPolygon) svgPolygon.setAttribute('class', 'area area--risk-' + risk.className_thisWeek);
    }
    if (newConfCases_14days < 3) {
      tr.innerHTML = '<td class="cell cell--id">' + plz + '</td>'
      + '<td class="cell cell--name">' + name + '</td>'
      + '<td class="cell">0-3</td>'
      + '<td class="cell">0-6</td>'
      + '<td class="cell"></td>';
    } else {
      tr.innerHTML = '<td class="cell cell--id">' + plz + '</td>'
        + '<td class="cell cell--name">' + name + '</td>'
        + '<td class="cell cell--' + (risk ? risk.className : 'unknown') + '">' + formatNumber(newConfCases_14days - 2) + '-' + formatNumber(newConfCases_14days + 2) + '<br/><strong>' + formatNumber(risk.incidence) + '</strong></td>'
        + '<td class="cell cell--' + (risk ? risk.className_thisWeek : 'unknown') + '">' + singlePLZ.NewConfCases_7days + '<br><strong>' + formatNumber(risk.incidence_thisWeek) + '</strong></td>'
        + '<td class="cell cell--' + (risk ? risk.tendency : 'unknown') + '"><strong>' + risk.changeString + '</strong></td>';
    }
    tr.addEventListener('click', function(e) {
      var id = e.currentTarget.getAttribute('data-id');
      var evt = new MouseEvent('click');
      d3.select('#area_' + id).node().dispatchEvent(evt);
    });
    tbody.append(tr);
  }
}

/**
 * Calculate risk
 * 
 * @param {number} casesLastWeek - sum of new cases 14 to 8 days ago
 * @param {number} casesThisWeek - sum of new cases 7 to 1 days ago
 * @param {number} population
 */
function getRiskObject(casesLastWeek, casesThisWeek, population) {
  var changePercent = NaN;
  var changeSymbol = '';
  var changeText = '';
  var tendencyClass = 'na';
  var riskClass = 'unknown';
  var riskClass_lastWeek = 'unknown';
  var riskClass_thisWeek = 'unknown';
  var incidenceSize = 100000;

  var newConfCases_14days = casesLastWeek + casesThisWeek;
  var incidence_14day = Math.round(incidenceSize * newConfCases_14days / population);
  var incidence_7dayOld = Math.round(incidenceSize * casesLastWeek / population);
  var incidence_7day = Math.round(incidenceSize * casesThisWeek / population);

  if (casesThisWeek > 1 || population >= 2500) {
    if (incidence_14day >= 30) {
      changePercent = Math.round(100 * ((casesThisWeek / casesLastWeek) - 1));
      if (isFinite(changePercent)) changeText = (changePercent > 0 ? '+' : '') + changePercent + '%';
      if (changePercent >= 19) changeSymbol = '&#8599;&#xFE0E; '; // at least 19% increase
      else if (changePercent <= -15) changeSymbol = '&#8600;&#xFE0E; '; // at least 15% decrease
      tendencyClass = getTendencyClass(changePercent);
    }

    riskClass = getRiskClass(incidence_14day / 2, population);
    riskClass_lastWeek = getRiskClass(incidence_7dayOld, population);
    riskClass_thisWeek = getRiskClass(incidence_7day, population);
  }

  return {
    incidence: incidence_14day,
    incidence_thisWeek: incidence_7day,
    incidence_lastWeek: incidence_7dayOld,
    symbol: changeSymbol,
    changePercentage: changePercent,
    changeString: changeText,
    className: riskClass,
    className_thisWeek: riskClass_thisWeek,
    className_lastWeek: riskClass_lastWeek,
    tendency: tendencyClass
  };
}

/**
 * Get human readable interpretation of change percentage
 * 
 * @param {number} change - change percentage
 * @param {string}
 */
function getTendencyLabel(change) {
  if (change >= 400) return 'Vervierfachung<br/>in 1 Woche';
  else if (change >= 100) return 'Verdoppelung<br/>in 1 Woche';
  else if (change >= 42) return 'Verdoppelung<br/>in 2 Wochen';
  else if (change >= 19) return 'Verdoppelung<br/>in 4 Wochen';
  else if (change <= -50) return 'Halbierung<br/>in 1 Woche';
  else if (change <= -30) return 'Halbierung<br/>in 2 Wochen';
  else if (change <= -15) return 'Halbierung<br/>in 4 Wochen';
  else return 'ungefähr<br/>gleichbleibend';
}

/**
 * Get CSS class for change percentage
 * 
 * @param {number} change - change percentage
 * @param {string}
 */
function getTendencyClass(change) {
  if (change >= 400) return 'increasing-fastest';
  else if (change >= 100) return 'increasing-faster';
  else if (change >= 42) return 'increasing-fast';
  else if (change >= 19) return 'increasing';
  else if (change <= -50) return 'decreasing-faster';
  else if (change <= -30) return 'decreasing-fast';
  else if (change <= -15) return 'decreasing';
  else return 'stable';
}

/**
 * Get human readable interpretation of risk level
 * 
 * @param {number} incidence - 7 day incidence
 * @returns {string}
 */
function getRiskLabel(incidence) {
  if (incidence >= 960) return 'entsetzlich hohes Risiko';
  else if (incidence >= 480) return 'extrem hohes Risiko';
  else if (incidence >= 240) return 'äusserst hohes Risiko';
  else if (incidence >= 120) return 'sehr hohes Risiko';
  else if (incidence >= 60) return 'hohes Risiko';
  else if (incidence >= 30) return 'erhöhtes Risiko';
  else if (incidence >= 15) return 'mässiges Risiko';
  else return 'niedriges Risiko';
}

/**
 * Get CSS class for risk level
 * 
 * @param {number} incidence - 7 day incidence
 * @param {number} population - population size
 * @returns {string} - classname 
 */
function getRiskClass(incidence, population) {
  var smallpop = false;
  if (population < 5000 && incidence < 60) smallpop = true;
  else if (population < 10000 && incidence < 30) smallpop = true;
  if (incidence >= 960) return 'terrible';
  else if (incidence >= 480) return 'extreme';
  else if (incidence >= 240) return 'highest';
  else if (incidence >= 120) return 'higher';
  else if (incidence >= 60) return 'high';
  else if (incidence >= 30) return 'medium' + (smallpop ? '-uncertain' : '');
  else if (incidence >= 15) return 'moderate' + (smallpop ? '-uncertain' : '');
  else return 'low';
}

/**
 * Get human readable number string in format XX'XXX
 * 
 * @param {number} num
 * @returns {string}
 */
function formatNumber(num) {
  return num.toString().replaceAll(/\B(?=(\d{3})+(?!\d))/g, "'");
}

/**
 * Get human readable date string in format DD.MM.
 * 
 * @param {Date} date - date object
 * @returns {string} - date string
 */
function formatDate(date) {
  var dd = date.getDate();
  var mm = date.getMonth() + 1;
  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;
  return dd + '.' + mm + '.';
}

/**
 * Get ISO 8601 date string in format YYYY-MM-DD
 * 
 * @param {Date} date - date object
 * @param {number} offset - offset in days
 * @returns {string} - date string
 */
function getDateString(date, offset = 0) {
  if (offset) {
    var date = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() + offset));
  }
  return date.toISOString().substring(0, 10);
}

/**
 * Get first day of ISO week
 * 
 * @param {number} week - week of the year
 * @param {number} year - year
 * @returns {Date} - date object
 */
function getDateOfISOWeek(week, year) {
  var simple = new Date(year, 0, 1 + (week - 1) * 7);
  var dow = simple.getDay();
  var ISOweekStart = simple;
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() + 1 - simple.getDay());
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  return ISOweekStart;
}

/**
 * Get ISO week of date
 * 
 * @param {string} date - iso date string
 * @returns {number} - YYYYWW
 */
function getISOWeekOfDate(date) {
  var d = new Date(date);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
  return parseInt(d.getUTCFullYear() + ('' + weekNo).padStart(2, '0'), 10);
}

/**
 * Parse prevalence range
 * 
 * @param {string} range - lower bound - upper bound
 * @returns {number}
 */
function parsePrevalenceRange(range) {
  return parseInt(range.split("-")[0]) + 1;
}

var plzNames = {
  5462: "Siglistorf",
  6340: "Baar, Sihlbrugg",
  8001: "Zürich",
  8002: "Zürich",
  8003: "Zürich",
  8004: "Zürich",
  8005: "Zürich",
  8006: "Zürich",
  8008: "Zürich",
  8032: "Zürich",
  8037: "Zürich",
  8038: "Zürich",
  8041: "Zürich",
  8044: "Gockhausen,<br/>Zürich",
  8045: "Zürich",
  8046: "Zürich",
  8047: "Zürich",
  8048: "Zürich",
  8049: "Zürich",
  8050: "Zürich",
  8051: "Zürich",
  8052: "Zürich",
  8053: "Zürich",
  8055: "Zürich",
  8057: "Zürich",
  8064: "Zürich",
  8102: "Oberengstringen",
  8103: "Unterengstringen",
  8104: "Weiningen ZH",
  8105: "Regensdorf,<br/>Watt",
  8106: "Adlikon b. Regensd.",
  8107: "Buchs ZH",
  8108: "Dällikon",
  8109: "Kloster Fahr",
  8112: "Otelfingen",
  8113: "Boppelsen",
  8114: "Dänikon ZH",
  8115: "Hüttikon",
  8117: "Fällanden",
  8118: "Pfaffhausen",
  8121: "Benglen",
  8122: "Binz",
  8123: "Ebmatingen",
  8124: "Maur",
  8125: "Zollikerberg",
  8126: "Zumikon",
  8127: "Forch",
  8132: "Egg b. Zürich,<br/>Hinteregg",
  8133: "Esslingen",
  8134: "Adliswil",
  8135: "Langnau am Albis,<br/>Sihlbrugg Station,<br/>Sihlwald",
  8136: "Gattikon",
  8142: "Uitikon Waldegg",
  8143: "Stallikon,<br/>Uetliberg",
  8152: "Glattbrugg,<br/>Opfikon,<br/>Glattpark (Opfikon)",
  8153: "Rümlang",
  8154: "Oberglatt ZH",
  8155: "Niederhasli,<br/>Nassenwil",
  8156: "Oberhasli",
  8157: "Dielsdorf",
  8158: "Regensberg",
  8162: "Steinmaur,<br/>Sünikon",
  8164: "Bachs",
  8165: "Oberweningen,<br/>Schleinikon,<br/>Schöfflisdorf",
  8166: "Niederweningen",
  8172: "Niederglatt ZH",
  8173: "Neerach",
  8174: "Stadel b. Niederglatt",
  8175: "Windlach",
  8180: "Bülach",
  8181: "Höri",
  8182: "Hochfelden",
  8184: "Bachenbülach",
  8185: "Winkel",
  8187: "Weiach",
  8192: "Glattfelden,<br/>Zweidlen",
  8193: "Eglisau",
  8194: "Hüntwangen",
  8195: "Wasterkingen",
  8196: "Wil ZH",
  8197: "Rafz",
  8212: "Nohl,<br/>Neuhausen am Rheinfall",
  8245: "Feuerthalen",
  8246: "Langwiesen",
  8247: "Flurlingen",
  8248: "Uhwiesen",
  8302: "Kloten",
  8303: "Bassersdorf",
  8304: "Wallisellen",
  8305: "Dietlikon",
  8306: "Brüttisellen",
  8307: "Effretikon,<br/>Ottikon b. Kemptthal",
  8308: "Illnau,<br/>Agasul",
  8309: "Nürensdorf",
  8310: "Kemptthal,<br/>Grafstal",
  8311: "Brütten",
  8312: "Winterberg ZH",
  8314: "Kyburg",
  8315: "Lindau",
  8317: "Tagelswangen",
  8320: "Fehraltorf",
  8322: "Madetswil,<br/>Gündisau",
  8330: "Pfäffikon ZH",
  8331: "Auslikon",
  8332: "Russikon,<br/>Rumlikon",
  8335: "Hittnau",
  8340: "Hinwil",
  8342: "Wernetshausen",
  8344: "Bäretswil",
  8345: "Adetswil",
  8352: "Elsau,<br/>Ricketwil (Wintert.)",
  8353: "Elgg",
  8354: "Hofstetten ZH,<br/>Dickbuch",
  8355: "Aadorf",
  8363: "Bichelsee",
  8400: "Winterthur",
  8403: "Winterthur",
  8404: "Winterthur,<br/>Reutlingen (Wintert.),<br/>Stadel (Wintert.)",
  8405: "Winterthur",
  8406: "Winterthur",
  8408: "Winterthur",
  8409: "Winterthur",
  8412: "Aesch (Neftenbach),<br/>Riet (Neftenbach),<br/>Hünikon (Neftenbach)",
  8413: "Neftenbach",
  8414: "Buch am Irchel",
  8415: "Berg am Irchel,<br/>Gräslikon",
  8416: "Flaach",
  8418: "Schlatt ZH",
  8421: "Dättlikon",
  8422: "Pfungen",
  8424: "Embrach",
  8425: "Oberembrach",
  8426: "Lufingen",
  8427: "Freienstein,<br/>Rorbas",
  8428: "Teufen ZH",
  8442: "Hettlingen",
  8444: "Henggart",
  8447: "Dachsen",
  8450: "Andelfingen",
  8451: "Kleinandelfingen",
  8452: "Adlikon b. Andelf.",
  8453: "Alten",
  8457: "Humlikon",
  8458: "Dorf",
  8459: "Volken",
  8460: "Marthalen",
  8461: "Oerlingen",
  8462: "Rheinau",
  8463: "Benken ZH",
  8464: "Ellikon am Rhein",
  8465: "Rudolfingen,<br/>Wildensbuch",
  8466: "Trüllikon",
  8467: "Truttikon",
  8468: "Waltalingen,<br/>Guntalingen",
  8471: "Rutschwil (Dägerlen),<br/>Dägerlen,<br/>Oberwil (Dägerlen),<br/>Berg (Dägerlen),<br/>Bänk (Dägerlen)",
  8472: "Seuzach",
  8474: "Dinhard",
  8475: "Ossingen",
  8476: "Unterstammheim",
  8477: "Oberstammheim",
  8478: "Thalheim ad. Thur",
  8479: "Altikon",
  8482: "Sennhof (Winterthur)",
  8483: "Kollbrunn",
  8484: "Weisslingen,<br/>Neschwil,<br/>Theilingen",
  8486: "Rikon im Tösstal",
  8487: "Zell ZH,<br/>Rämismühle",
  8488: "Turbenthal",
  8489: "Wildberg,<br/>Schalchen,<br/>Ehrikon",
  8492: "Wila",
  8493: "Saland",
  8494: "Bauma",
  8495: "Schmidrüti",
  8496: "Steg im Tösstal",
  8497: "Fischenthal",
  8498: "Gibswil",
  8499: "Sternenberg",
  8500: "Frauenfeld,<br/>Gerlikon",
  8523: "Hagenbuch ZH",
  8525: "Wilen b. Neunforn,<br/>Niederneunforn",
  8542: "Wiesendangen",
  8543: "Bertschikon,<br/>Gundetswil,<br/>Kefikon ZH",
  8544: "Attikon",
  8545: "Rickenbach ZH,<br/>Rickenbach Sulz",
  8546: "Menzengrüt,<br/>Islikon,<br/>Kefikon TG",
  8548: "Ellikon an der Thur",
  8600: "Dübendorf",
  8602: "Wangen b. Dübendorf",
  8603: "Schwerzenbach",
  8604: "Volketswil",
  8605: "Gutenswil",
  8606: "Greifensee,<br/>Nänikon",
  8607: "Aathal-Seegräben",
  8608: "Bubikon",
  8610: "Uster",
  8614: "Bertschikon (Gossau ZH),<br/>Sulzbach",
  8615: "Wermatswil,<br/>Freudwil",
  8616: "Riedikon",
  8617: "Mönchaltorf",
  8618: "Oetwil am See",
  8620: "Wetzikon ZH",
  8623: "Wetzikon ZH",
  8624: "Grüt (Gossau ZH)",
  8625: "Gossau ZH",
  8626: "Ottikon (Gossau ZH)",
  8627: "Grüningen",
  8630: "Rüti ZH",
  8632: "Tann",
  8633: "Wolfhausen",
  8634: "Hombrechtikon",
  8635: "Dürnten",
  8636: "Wald ZH",
  8637: "Laupen ZH",
  8700: "Küsnacht ZH",
  8702: "Zollikon",
  8703: "Erlenbach ZH",
  8704: "Herrliberg",
  8706: "Meilen",
  8707: "Uetikon am See",
  8708: "Männedorf",
  8712: "Stäfa",
  8713: "Uerikon",
  8714: "Feldbach",
  8800: "Thalwil",
  8802: "Kilchberg ZH",
  8803: "Rüschlikon",
  8804: "Au ZH",
  8805: "Richterswil",
  8810: "Horgen",
  8815: "Horgenberg",
  8816: "Hirzel",
  8820: "Wädenswil",
  8824: "Schönenberg ZH",
  8825: "Hütten",
  8833: "Samstagern",
  8902: "Urdorf",
  8903: "Birmensdorf ZH",
  8904: "Aesch ZH",
  8906: "Bonstetten",
  8907: "Wettswil",
  8908: "Hedingen",
  8909: "Zwillikon",
  8910: "Affoltern am Albis",
  8911: "Rifferswil",
  8912: "Obfelden",
  8913: "Ottenbach",
  8914: "Aeugst am Albis,<br/>Aeugstertal",
  8915: "Hausen am Albis",
  8925: "Ebertswil",
  8926: "Kappel am Albis,<br/>Hauptikon,<br/>Uerzlikon",
  8932: "Mettmenstetten",
  8933: "Maschwanden",
  8934: "Knonau",
  8942: "Oberrieden",
  8951: "Fahrweid",
  8952: "Schlieren",
  8953: "Dietikon",
  8954: "Geroldswil",
  8955: "Oetwil a. d. Limmat"
};
