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

const population = {
  "CH": 85.45,
  "AG": 6.78,
  "AI": 0.16,
  "AR": 0.55,
  "BE": 10.35,
  "BL": 2.88,
  "BS": 1.95,
  "FR": 3.19,
  "GE": 4.99,
  "GL": 0.40,
  "GR": 1.98,
  "JU": 0.73,
  "LU": 4.10,
  "NE": 1.77,
  "NW": 0.43,
  "OW": 0.38,
  "SG": 5.08,
  "SH": 0.82,
  "SO": 2.73,
  "SZ": 1.59,
  "TG": 2.76,
  "TI": 3.53,
  "UR": 0.36,
  "VD": 7.99,
  "VS": 3.44,
  "ZG": 1.27,
  "ZH": 15.21
};

var verbose = true;
var dataSourceCantons = 'BAG'; // Cantons
var bagData = [];
var cantonsData = [];
var dataPerDay = [];
var zipDataPerDay = [];
var dateOffset = 0;
Chart.defaults.global.defaultFontFamily = "IBM Plex Sans";
document.getElementById("loaded").style.display = 'none';

//console.log("START");
getCantons();

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
  drawBarChart('CH', dataPerDay.slice(dataPerDay.length - 30 - dateOffset, dataPerDay.length - dateOffset), 'index');
  var canton = 'ZH';
  var filteredData = dataPerDay.map(function(d) {
    return d.canton.filter(function(dd) { return dd.Canton === canton; })[0];
  });
  drawBarChart(canton, filteredData.slice(dataPerDay.length - 30 - dateOffset, dataPerDay.length - dateOffset), 'overview_zh');
  // getDistricts();
  getZIP();
  addEventListeners();
}

function redrawData(diff) {
  dateOffset -= diff;

  enableDisableButtons();

  document.querySelector('#index article').remove();
  drawBarChart('CH', dataPerDay.slice(dataPerDay.length - 30 - dateOffset, dataPerDay.length - dateOffset), 'index');

  document.getElementById('confirmed_1').innerHTML = '';
  document.getElementById('confirmed_2').innerHTML = '';
  drawCantonTable();

  document.querySelector('#overview_zh article').remove();
  var canton = 'ZH';
  var filteredData = dataPerDay.map(function(d) {
    return d.canton.filter(function(dd) { return dd.Canton === canton; })[0];
  });
  drawBarChart(canton, filteredData.slice(dataPerDay.length - 30 - dateOffset, dataPerDay.length - dateOffset), 'overview_zh');

  document.getElementById('plzbody').innerHTML = '';
  drawPLZTable();
}

function enableDisableButtons() {
  var startDate = new Date('2020-07-17');
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
        if (dataSourceCantons === 'BAG') {
          source.innerHTML = 'des BAG';
          bagData = csvdata;
          getCanton(25, processData); // ZH
        } else {
          source.innerHTML = 'der Kantone';
          for (var i = 0; i < cantons.length; i++) {
            if (i === cantons.length - 1) {
              getCanton(i, processData);
            } else {
              getCanton(i);
            }
          }
        }
      });
    });
}

/* function getDistricts() {
  var url = 'https://raw.githubusercontent.com/openZH/covid_19/master/fallzahlen_bezirke/fallzahlen_kanton_ZH_bezirk.csv';
  d3.queue()
    .defer(d3.json, "https://raw.githubusercontent.com/openZH/covid_19/master/fallzahlen_bezirke/BezirkeAlleSee_gen_epsg4326_F_KTZH_2020.json")
    .defer(d3.csv, url)
    .await(function(error, topo, csvdata) {
      var projection = d3.geoMercator()
        .center([8.675, 47.43]) // GPS of location to zoom on
        .scale(33000);          // This is like the zoom
      drawMap('#map_districts', topo, projection, 'BEZ_ID', function() {
        lastBezirksData(csvdata);
      });
    });
} */

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
  var mostRecent = new Date(bagData[bagData.length - 1].date);
  var j = Math.floor((mostRecent - new Date('2020-06-01')) / (1000 * 60 * 60 * 24));
  for (j; j >= 0; j--) {
    var dateString = getDateString(mostRecent, -j);
    var singleDayObject = {
      Date: dateString,
      bag: [],
      canton: []
    };
    for (var i = 0; i < cantons.length - 1; i++) { // without FL
      singleDayObject.bag.push(getSingleDayObject(cantons[i], dateString, true));
    }
    singleDayObject.canton.push(getSingleDayObject('ZH', dateString, false)); // get cantonal data for 'ZH'
    singleDayObject.TotalConfCases = singleDayObject.bag.reduce(function(acc, val) { return acc + val.TotalConfCases; }, 0);
    singleDayObject.NewConfCases_1day = singleDayObject.bag.reduce(function(acc, val) { return acc + val.NewConfCases_1day; }, 0);
    singleDayObject.NewConfCases_7days = singleDayObject.bag.reduce(function(acc, val) { return acc + val.NewConfCases_7days; }, 0);
    if (singleDayObject.bag[0].NewConfCases_7dayAverage) {
      singleDayObject.NewConfCases_7dayAverage = singleDayObject.bag.reduce(function(acc, val) { return acc + val.NewConfCases_7dayAverage; }, 0);
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
  var dataPerCanton = dataPerDay[dataPerDay.length - dateOffset - 1].bag.map(function(value, i) {
    return {
      'Canton': value.Canton,
      'NewConfCases_7days': value.NewConfCases_7days,
      'OldConfCases_7days': dataPerDay[dataPerDay.length - dateOffset - 8].bag[i].NewConfCases_7days,
      'Population': population[value.Canton],
      'Date': value.Date,
    }
  });
  var lastDate = dataPerDay[dataPerDay.length - dateOffset - 1].Date;
  var endDay = new Date(lastDate);
  var startDay = new Date(lastDate);
  startDay.setDate(startDay.getDate() - 13);
  var period = document.getElementById('canton_period__dates');
  period.innerHTML = formatDate(startDay) + ' – ' + formatDate(endDay);
  var updated = document.getElementById('ch_source__updated');
  updated.innerHTML = formatDate(new Date(dataPerDay[dataPerDay.length - 1].Date));
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
    td.className = 'cell cell--' + risk.className_thisWeek;
    td.innerHTML = formatNumber(cantonData.NewConfCases_7days) + '<br><strong>' + formatNumber(risk.incidence_thisWeek) + '</strong>';
    tr.appendChild(td);
    td = document.createElement("td");
    td.className = 'cell cell--' + risk.className;
    td.innerHTML = formatNumber(cantonData.OldConfCases_7days + cantonData.NewConfCases_7days) + '<br><strong>' + formatNumber(risk.incidence) + '</strong>';
    tr.appendChild(td);
    td = document.createElement("td");
    td.className = 'cell cell--' + risk.tendency;
    td.innerHTML = '<strong>' + (risk.percentChange > 0 ? '+' : '') + risk.percentChange + '%</strong>';
    document.getElementById('area_' + cantonData.Canton).setAttribute('class', 'area area--risk-' + risk.className);
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
  var today = getTotalConfCases(canton, dateString, true, useBAGData);
  var yesterday = getTotalConfCases(canton, getDateString(new Date(dateString), -1), true, useBAGData);
  var minus4days = getTotalConfCases(canton, getDateString(new Date(dateString), -4), true, useBAGData);
  var plus3days = getTotalConfCases(canton, getDateString(new Date(dateString), +3), false, useBAGData);
  var minus7days = getTotalConfCases(canton, getDateString(new Date(dateString), -7), true, useBAGData);
  var singleDayObject = {
    Canton: canton,
    Date: dateString
  };
  if (today) {
    singleDayObject.TotalConfCases = today;
    if (yesterday) singleDayObject.NewConfCases_1day = today - yesterday;
    if (minus7days) singleDayObject.NewConfCases_7days = today - minus7days;
    if (minus4days && plus3days) singleDayObject.NewConfCases_7dayAverage = (plus3days - minus4days) / 7;
  }
  return singleDayObject;
}

/**
 * Get cumulated number of confirmed cases
 * 
 * @param {string} canton - 2 letter identifier of canton
 * @param {string} dateString - ISO formatted date string
 * @param {boolean} searchPast - if no data is available return data from last date with data?
 * @param {boolean} useBAGData - use BAG data source
 * @returns {number} - total number of confirmed cases
 */
function getTotalConfCases(canton, dateString, searchPast, useBAGData) {
  var filteredData;
  var variable;
  if (useBAGData) {
    variable = canton;
    filteredData = bagData.filter(function(d) {
      if (d.date == dateString && d[canton] != '') return d;
    });
  } else {
    variable = 'ncumul_conf';
    filteredData = cantonsData.filter(function(d) {
      if (d.abbreviation_canton_and_fl == canton && d.date == dateString && d[variable] != '') return d;
    });
  }
  if (filteredData.length > 0) {
    return parseInt(filteredData[filteredData.length - 1][variable]);
  }
  // else try day before
  if (searchPast) {
    return getTotalConfCases(canton, getDateString(new Date(dateString), -1), true, useBAGData);
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
  var section = document.getElementById(sectionId);
  var article = document.createElement('article');

  if (sectionId === 'cantons') {
    article.id = 'barchart_canton';
    if (document.getElementById(article.id)) {
      document.getElementById(article.id).remove();
    }
    var h3 = document.createElement('h3');
    h3.className = 'flag flag--' + place;
    h3.innerHTML = 'Kanton ' + names[place];
    article.appendChild(h3);
    var p = document.createElement('p');
    p.innerHTML = formatNumber(Math.round(population[place] * 100000)) + ' Einwohner\'innen';
    article.appendChild(p);
  }

  var card = document.createElement('table');
  var casesLastWeek = filteredData[filteredData.length - 8].NewConfCases_7days;
  var casesThisWeek = filteredData[filteredData.length - 1].NewConfCases_7days;
  var risk = getRiskObject(casesLastWeek, casesThisWeek, population[place]);
  var riskLabel = getRiskLabel(risk.incidence / 2);
  var tendencyLabel = getTendencyLabel(risk.percentChange);

  card.className = 'figure figure--' + risk.className;
  card.innerHTML = '<thead><tr>'
    + '<th class="figure__row-header" scope="row">Zeitraum</th>'
    + '<th class="figure__column-header cell--' + risk.className_lastWeek + '" scope="col">Woche ab ' + formatDate(new Date(filteredData[filteredData.length - 14].Date)) + '</th>'
    + '<th class="figure__column-header cell--' + risk.className_thisWeek + '" scope="col">Woche ab ' + formatDate(new Date(filteredData[filteredData.length - 7].Date)) + '</th>'
    + '<th class="figure__column-header" scope="col">Letzte 2 Wochen</th>'
    + '</tr></thead><tbody><tr>'
    + '<th class="figure__row-header" scope="row">Neuinfektionen</th>'
    + '<td class="cell cell--' + risk.className_lastWeek + '">' + formatNumber(casesLastWeek) + '</td>'
    + '<td class="cell cell--' + risk.className_thisWeek + '">' + formatNumber(casesThisWeek) + '</td>'
    + '<td class="cell">' + formatNumber(casesLastWeek + casesThisWeek) + '</td>'
    + '</tr><tr>'
    + '<th class="figure__row-header" scope="row">Inzidenz</th>'
    + '<td class="cell cell--' + risk.className_lastWeek + '"><strong>' + formatNumber(risk.incidence_lastWeek) + '</strong></td>'
    + '<td class="cell cell--' + risk.className_thisWeek + '"><strong>' + formatNumber(risk.incidence_thisWeek) + '</strong></td>'
    + '<td rowspan="2" class="cell"><strong class="figure__number">' + formatNumber(risk.incidence) + '</strong><br>' + riskLabel + '</td>'
    + '</tr><tr>'
    + '<th class="figure__row-header" scope="row">Tendenz</th>'
    + '<td colspan="2"  class="cell cell--' + risk.tendency + '"><strong>' + risk.symbol + (risk.percentChange > 0 ? '+' : '') + risk.percentChange + '%</strong><br> ' + tendencyLabel + '</td>'
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
    canvas.height = 250;
    div.appendChild(canvas);
  }
  article.appendChild(div);
  section.appendChild(article);
  var dateLabels = filteredData.map(function(d) {
    return d.Date;
  });
  var cases = filteredData.map(function(d) {
    return d.NewConfCases_1day;
  });
  var averages = filteredData.map(function(d) {
    if (d.NewConfCases_7dayAverage) return Math.round(100 * d.NewConfCases_7dayAverage) / 100;
  });
  var averageColors = filteredData.map(function(d) {
    var incidence = 14 * d.NewConfCases_7dayAverage / population[place];
    if (incidence >= 1920) return '#4a25a2'; // dark blue
    else if (incidence >= 960) return '#7d2a9f'; // purple
    else if (incidence >= 480) return '#a63587'; // fuchsia
    else if (incidence >= 240) return '#c54860'; // pink
    else if (incidence >= 120) return '#d56534'; // red
    else if (incidence >= 60) return '#d28a02'; // orange
    return '#b6b21d'; // green
  });
  var casesColors = filteredData.map(function(d) {
    var incidence = 14 * d.NewConfCases_1day / population[place];
    if (incidence >= 1920) return inDarkMode() ? '#230559' : '#786dba'; // dark blue
    else if (incidence >= 960) return inDarkMode() ? '#440e59' : '#aa75c1'; // purple
    else if (incidence >= 480) return inDarkMode() ? '#601a4d' : '#d37db5'; // fuchsia
    else if (incidence >= 240) return inDarkMode() ? '#792a39' : '#f08a98'; // pink
    else if (incidence >= 120) return inDarkMode() ? '#894121' : '#fc9f76'; // red
    else if (incidence >= 60) return inDarkMode() ? '#8c5e0f' : '#f5bb64'; // orange
    return inDarkMode() ? '#807e22' : '#dad971'; // green
  });

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
        enabled: true
      },
      scales: getScales(),
      plugins: {
        datalabels: getDataLabels()
      }
    },
    data: {
      labels: dateLabels,
      datasets: [
        {
          data: cases,
          order: 1,
          type: 'bar',
          fill: false,
          cubicInterpolationMode: 'monotone',
          spanGaps: false,
          borderColor: 'transparent',
          backgroundColor: casesColors,
          datalabels: {
            align: 'end',
            anchor: 'end'
          }
        },
        {
          data: averages,
          order: 0,
          type: 'line',
          pointRadius: 5,
          pointBorderWidth: 0,
          pointBorderColor: 'transparent',
          pointBackgroundColor: averageColors,
          spanGaps: true,
          borderColor: inDarkMode() ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
          backgroundColor: 'transparent',
          datalabels: {
            display: false
          }
        }
      ]
    }
  });
}

function getScales() {
  return {
    xAxes: [{
      type: 'time',
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

function getDataLabels() {
  if (getDeviceState() == 2) return false;
  return {
    color: inDarkMode() ? '#ccc' : 'black',
    font: {
      weight: 'bold',
    },
    formatter: function(value) {
      return (value == 0) ? '' : '' + formatNumber(value);
    }
  };
}

// Create the state-indicator element
var indicator = document.createElement('div');
indicator.className = 'state-indicator';
document.body.appendChild(indicator);

// Create a method which returns device state
function getDeviceState() {
  return parseInt(window.getComputedStyle(indicator).getPropertyValue('z-index'), 10);
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
          document.getElementById('row_' + selectedArea).classList.remove(selectedRowClass);
        }
        selectedArea = id;
        document.getElementById('area_' + id).classList.add(selectedAreaClass);
        document.getElementById('row_' + id).classList.add(selectedRowClass);
        if (container === '#map_cantons') {
          var filteredData = dataPerDay.map(function(d) {
            return d.bag.filter(function(dd) { return dd.Canton === id; })[0];
          });
          drawBarChart(id, filteredData.slice(dataPerDay.length - 30 - dateOffset, dataPerDay.length - dateOffset), 'cantons');
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

/* function lastBezirksData(data) {
  var tbody = document.getElementById("districtTable");
  for (var i = 101; i <= 112; i++) {
    var filtered = data.filter(function(d) { if (d.DistrictId == i) return d; } );
    var thisWeek = filtered[filtered.length - 1];
    var lastWeek = filtered[filtered.length - 2];

    if (i == 101) {
      var dateOfWeek = getDateOfISOWeek(lastWeek.Week, lastWeek.Year);
      var endDay = new Date(dateOfWeek);
      endDay.setDate(endDay.getDate() + 13);
      var text = `Wochen ${lastWeek.Week} und ${thisWeek.Week} (${formatDate(dateOfWeek)} – ${formatDate(endDay)})`;
      var period = document.getElementById('district_period__dates');
      period.innerHTML = text;
    }

    var tr = document.createElement('tr');
    tr.id = 'row_' + i;
    tr.className = 'row';
    tr.setAttribute('data-id', i);
    var td = document.createElement("td");
    td.className = 'cell cell--name';
    var span = document.createElement("span");
    span.className = 'flag flag--' + i;
    var text = document.createTextNode(names[i]);
    span.appendChild(text);
    td.appendChild(span);
    tr.appendChild(td);
    td = document.createElement("td");
    td.className = 'cell cell--last-week';
    td.appendChild(document.createTextNode(lastWeek.NewConfCases));
    tr.appendChild(td);
    td = document.createElement("td");
    td.className = 'cell cell--this-week';
    td.appendChild(document.createTextNode(thisWeek.NewConfCases));
    tr.appendChild(td);
    td = document.createElement("td");
    td.className = 'cell cell--risk';
    td.innerHTML = getRiskAndChangeDistrict(lastWeek, thisWeek, i);
    tr.addEventListener('click', function(e) {
      var id = e.currentTarget.getAttribute('data-id');
      var evt = new MouseEvent('click');
      d3.select('#area_' + id).node().dispatchEvent(evt);
    });
    tr.appendChild(td);

    tbody.appendChild(tr);
  }
} */

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
    var changeString = '';
    var lastWeekParsed = parseInt(singlePLZ.OldConfCases_7days.split("-")[0]); // + 1;
    var thisWeekParsed = parseInt(singlePLZ.NewConfCases_7days.split("-")[0]); // + 1;
    if (plz.length > 4) {
      name = plz;
      plz = '&nbsp;';
    } else {
      var risk = getRiskObject(lastWeekParsed, thisWeekParsed, (parseInt(singlePLZ.Population) / 100000));
      var svgPolygon = document.getElementById('area_' + singlePLZ.PLZ);
      if (svgPolygon) svgPolygon.setAttribute('class', 'area area--risk-' + risk.className);
      changeString = (isFinite(risk.percentChange) ? (risk.percentChange > 0 ? '+' : '') + risk.percentChange + '%' : '');
    }
    tr.innerHTML = '<td class="cell cell--id">' + plz + '</td>'
      + '<td class="cell cell--name">' + name + '</td>'
      + '<td class="cell cell--' + (risk ? risk.className_thisWeek : 'unknown') + '">' + singlePLZ.NewConfCases_7days + '<br><strong>' + formatNumber(risk.incidence_thisWeek) + '</strong></td>'
      + '<td class="cell cell--' + (risk ? risk.className : 'unknown') + '">' + formatNumber(lastWeekParsed + thisWeekParsed) + '+<br/><strong>' + formatNumber(risk.incidence) + '</strong></td>'
      + '<td class="cell cell--' + (risk ? risk.tendency : 'unknown') + '"><strong>' + changeString + '</strong></td>';
    tr.addEventListener('click', function(e) {
      var id = e.currentTarget.getAttribute('data-id');
      var evt = new MouseEvent('click');
      d3.select('#area_' + id).node().dispatchEvent(evt);
    });
    tbody.append(tr);
  }
}

/* function getRiskAndChangeDistrict(lastWeek, thisWeek, districtId) {
  var lastWeekParsed = parseInt(lastWeek.NewConfCases);
  var thisWeekParsed = parseInt(thisWeek.NewConfCases);
  var risk = getRiskObject(lastWeekParsed, thisWeekParsed, (parseInt(thisWeek.Population) / 100000));
  var svgPolygon = document.getElementById('area_' + districtId);
  if (svgPolygon) svgPolygon.classList.add('area--risk-' + risk.className);
  return '<span class="risk ' + risk.className + risk.tendency + '">' + risk.symbol + formatNumber(risk.incidence) + '</span>';
}; */

/**
 * Calculate risk
 * 
 * @param {number} casesLastWeek - sum of new cases 14 to 8 days ago
 * @param {number} casesThisWeek - sum of new cases 7 to 1 days ago
 * @param {number} population - in 100'000
 */
function getRiskObject(casesLastWeek, casesThisWeek, population) {
  var incidence_14day = Math.round((casesLastWeek + casesThisWeek) / population);
  var incidence_7dayOld = Math.round(casesLastWeek / population);
  var incidence_7day = Math.round(casesThisWeek / population);

  var changePercentage = Math.round(100 * ((casesThisWeek / casesLastWeek) - 1));
  var changeSymbol = '';
  if (changePercentage >= 10) changeSymbol = '&#8599;&#xFE0E; '; // at least 10% increase
  else if (changePercentage <= -10) changeSymbol = '&#8600;&#xFE0E; '; // at least 10% decrease
  var tendencyClass = getTendencyClass(changePercentage);

  var riskClass = getRiskClass(incidence_14day / 2);
  var riskClass_lastWeek = getRiskClass(incidence_7dayOld);
  var riskClass_thisWeek = getRiskClass(incidence_7day);

  return {
    incidence: incidence_14day,
    incidence_thisWeek: incidence_7day,
    incidence_lastWeek: incidence_7dayOld,
    symbol: changeSymbol,
    percentChange: changePercentage,
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
  if (change >= 100) return 'unkontrolliert steigend';
  else if (change >= 50) return 'sehr schnell steigend';
  else if (change >= 25) return 'schnell steigend';
  else if (change >= 10) return 'steigend';
  else if (change <= -50) return 'sehr schnell sinkend';
  else if (change <= -25) return 'schnell sinkend';
  else if (change <= -10) return 'sinkend';
  else return 'gleichbleibend';
}

/**
 * Get CSS class for change percentage
 * 
 * @param {number} change - change percentage
 * @param {string}
 */
function getTendencyClass(change) {
  if (change >= 100) return 'increasing-fastest';
  else if (change >= 50) return 'increasing-faster';
  else if (change >= 25) return 'increasing-fast';
  else if (change >= 10) return 'increasing';
  else if (change <= -50) return 'decreasing-faster';
  else if (change <= -25) return 'decreasing-fast';
  else if (change <= -10) return 'decreasing';
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
  else return 'mässiges Risiko';
}

/**
 * Get CSS class for risk level
 * 
 * @param {number} incidence - 7 day incidence
 * @returns {string} - classname 
 */
function getRiskClass(incidence) {
  if (incidence >= 960) return 'terrible';
  else if (incidence >= 480) return 'extreme';
  else if (incidence >= 240) return 'highest';
  else if (incidence >= 120) return 'higher';
  else if (incidence >= 60) return 'high';
  else if (incidence >= 30) return 'medium';
  else return 'moderate';
}

/**
 * Get human readable number string in format XX'XXX
 * 
 * @param {number} num
 * @returns {string}
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
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
