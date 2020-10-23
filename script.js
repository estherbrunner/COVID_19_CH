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

const cartesianAxesTypes = {
  LINEAR: 'linear',
  LOGARITHMIC: 'logarithmic'
};

var verbose = true;
var dataSourceCantons = 'BAG'; // Cantons
var bagData = [];
var cantonsData = [];
var dataPerDay = [];
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
  processActualData();
  drawBarChart('CH', dataPerDay, 'index', '#da291c');
  var canton = 'ZH';
  var filteredData = dataPerDay.map(function(d) {
    return d.canton.filter(function(dd) { return dd.Canton === canton; })[0];
  });
  drawBarChart(canton, filteredData, 'overview_zh', '#0076bd');
  getDistricts();
  getZIP();
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

function getDistricts() {
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
      drawMap('#map_zipcodes', topo, projection, 'PLZ', function() {
        drawPLZTable(csvdata);
      });
    });
}

function getDataPerDay() {
  var mostRecent = getTotalConfCases('ZH', getDateString(new Date()), false, true) ? 0 : 1;
  for (var j = 30; j >= mostRecent; j--) {
    var dateString = getDateString(new Date(), -j);
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
  // console.log("End preping CH cases");
  if (verbose) {
    console.log(dataPerDay);
  }
}

function processActualData() {
  var dataPerCanton = dataPerDay[dataPerDay.length - 1].bag.map(function(value, i) {
    return {
      'Canton': value.Canton,
      'NewConfCases_7days': value.NewConfCases_7days,
      'OldConfCases_7days': dataPerDay[dataPerDay.length - 8].bag[i].NewConfCases_7days,
      'Population': population[value.Canton],
      'Date': value.Date,
    }
  });
  var lastDate = dataPerDay[dataPerDay.length - 1].Date;
  var endDay = new Date(lastDate);
  var startDay = new Date(lastDate);
  startDay.setDate(startDay.getDate() - 13);
  var period = document.getElementById('canton_period__dates');
  period.innerHTML = '(' + formatDate(startDay) + ' – ' + formatDate(endDay) + ')';
  var updated = document.getElementById('ch_source__updated');
  updated.innerHTML = formatDate(endDay);
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
    /* td = document.createElement("td");
    td.appendChild(document.createTextNode(formatDate(new Date(cantonData.Date))));
    tr.appendChild(td); */
    td = document.createElement("td");
    td.className = 'cell cell--last-week';
    td.appendChild(document.createTextNode(formatNumber(cantonData.OldConfCases_7days)));
    tr.appendChild(td);
    td = document.createElement("td");
    td.className = 'cell cell--this-week';
    td.appendChild(document.createTextNode(formatNumber(cantonData.NewConfCases_7days)));
    tr.appendChild(td);
    td = document.createElement("td");
    td.className = 'cell cell--risk';
    td.innerHTML = getRiskAndChangeCanton(cantonData);
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
  }
  var h3 = document.createElement('h3');
  var casesLastWeek = filteredData[filteredData.length - 8].NewConfCases_7days;
  var casesThisWeek = filteredData[filteredData.length - 1].NewConfCases_7days;
  var risk = getRiskClass(casesLastWeek, casesThisWeek, population[place]);

  var riskLabel = '';
  if (risk.casesPerCapita >= 960) riskLabel = 'Extrem hohes Risiko:';
  else if (risk.casesPerCapita >= 480) riskLabel = 'Äusserst hohes Risiko:';
  else if (risk.casesPerCapita >= 240) riskLabel = 'Sehr hohes Risiko:';
  else if (risk.casesPerCapita >= 120) riskLabel = 'Hohes Risiko:';
  else if (risk.casesPerCapita >= 60) riskLabel = 'Erhöhtes Risiko:';
  else riskLabel = 'Mässiges Risiko:';

  var tendencyLabel = '';
  if (risk.percentChange >= 100) tendencyLabel = 'sehr schnell steigend';
  else if (risk.percentChange >= 50) tendencyLabel = 'schnell steigend';
  else if (risk.percentChange >= 10) tendencyLabel = 'steigend';
  else if (risk.percentChange <= -100) tendencyLabel = 'sehr schnell sinkend';
  else if (risk.percentChange <= -50) tendencyLabel = 'schnell sinkend';
  else if (risk.percentChange <= -10) tendencyLabel = 'sinkend';
  else tendencyLabel = 'gleichbleibend';

  h3.className = 'figure figure--' + risk.className;
  h3.innerHTML = '<span class="figure__card figure__card--absolute"><span class="figure__label">Neue Fälle:</span>' +
    '<span class="figure__number">' + formatNumber(casesLastWeek + casesThisWeek) + '</span>' +
    '<span class="figure__label figure__label--centered">in den letzten 2 Wochen</span>' +
    '<span class="figure__footer"><span class="figure__label figure__label--left figure__label--' + risk.className_lastWeek +
    '">Vorwoche: ' + formatNumber(casesLastWeek) + '</span>' +
    '<span class="figure__label figure__label--right figure__label--' + risk.className_thisWeek +
    '">Diese Woche: ' + formatNumber(casesThisWeek) + '</span></span></span>' +
    '<span class="figure__card figure__card--relative"><span class="figure__label">' + riskLabel + '</span>' +
    '<span class="figure__number">' + risk.casesPerCapita + '</span>' +
    '<span class="figure__label figure__label--centered">pro 100\'000 Einwohner\'innen</span>' +
    '<span class="figure_footer"><span class="figure__label figure__label--left">Tendenz: ' + tendencyLabel +
    ' (' + risk.symbol + (risk.percentChange > 0 ? '+' : '') + risk.percentChange + '%)</span></span></span>';
  article.appendChild(h3);
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
  var colors = filteredData.map(function(d) {
    if (d.NewConfCases_7dayAverage >= 960 * population[place] / 14) return '#102a45'; // dark blue
    else if (d.NewConfCases_7dayAverage >= 480 * population[place] / 14) return '#5f23a1'; // purple
    else if (d.NewConfCases_7dayAverage >= 240 * population[place] / 14) return '#b11c8c'; // pink
    else if (d.NewConfCases_7dayAverage >= 120 * population[place] / 14) return '#d35a45'; // red
    else if (d.NewConfCases_7dayAverage >= 60 * population[place] / 14) return '#d29601'; // orange
    return '#78db10'; // green
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
          backgroundColor: inDarkMode() ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
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
          pointBackgroundColor: colors,
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
      type: cartesianAxesTypes.LINEAR,
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
      return (value == 0) ? '' : '' + value;
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
          drawBarChart(id, filteredData, 'cantons', '#0076bd');
        }
      }
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

function lastBezirksData(data) {
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
}

function drawPLZTable(plzdata) {
  var tbody = document.getElementById("plzbody");
  var lastDate = plzdata[plzdata.length - 1].Date;
  var endDay = new Date(lastDate);
  var startDay = new Date(lastDate);
  startDay.setDate(startDay.getDate() - 13);
  var period = document.getElementById('zip_period__dates');
  period.innerHTML = '(' + formatDate(startDay) + ' – ' + formatDate(endDay) + ')';
  var updated = document.getElementById('zh_source__updated');
  updated.innerHTML = formatDate(endDay);
  var filteredPLZData = plzdata.filter(function(d) { if (d.Date == lastDate) return d; });
  for (var i=0; i<filteredPLZData.length; i++) {
    var singlePLZ = filteredPLZData[i];
    var plz = ""+singlePLZ.PLZ;
    var filterForPLZ = plzdata.filter(function(d) { if (d.PLZ == plz) return d; });
    var lastWeek = filterForPLZ[filterForPLZ.length - 8];
    singlePLZ.OldConfCases_7days = lastWeek.NewConfCases_7days;
    var name = plzNames[plz];
    if (name == undefined) name = '';
    var tr = document.createElement('tr');
    tr.id = 'row_' + plz;
    tr.className = 'row';
    tr.setAttribute('data-id', plz);
    var riskAndChange = '-';
    if (plz.length > 4) {
      name = plz;
      plz = '&nbsp;';
    } else {
      riskAndChange = getRiskAndChangePLZ(singlePLZ);
    }
    tr.innerHTML = '<td class="cell cell--id">' + plz + '</td>'
      + '<td class="cell cell--name">' + name + '</td>'
      + '<td class="cell cell--last-week">' + singlePLZ.OldConfCases_7days + '</td>'
      + '<td class="cell cell--this-week">' + singlePLZ.NewConfCases_7days + '</td>'
      + '<td class="cell cell--risk">' + riskAndChange + '</td>';
    tr.addEventListener('click', function(e) {
      var id = e.currentTarget.getAttribute('data-id');
      var evt = new MouseEvent('click');
      d3.select('#area_' + id).node().dispatchEvent(evt);
    });
    tbody.append(tr);
  }
}

function getRiskAndChangeCanton(singleCanton) {
  var risk = getRiskClass(singleCanton.OldConfCases_7days, singleCanton.NewConfCases_7days, singleCanton.Population);
  document.getElementById('area_' + singleCanton.Canton).classList.add('area--risk-' + risk.className);
  return '<span class="risk ' + risk.className + risk.tendency + '">' + risk.symbol + risk.casesPerCapita + '</span>';
};

function getRiskAndChangeDistrict(lastWeek, thisWeek, districtId) {
  var lastWeekParsed = parseInt(lastWeek.NewConfCases);
  var thisWeekParsed = parseInt(thisWeek.NewConfCases);
  var risk = getRiskClass(lastWeekParsed, thisWeekParsed, (parseInt(thisWeek.Population) / 100000));
  var svgPolygon = document.getElementById('area_' + districtId);
  if (svgPolygon) svgPolygon.classList.add('area--risk-' + risk.className);
  return '<span class="risk ' + risk.className + risk.tendency + '">' + risk.symbol + risk.casesPerCapita + '</span>';
};

function getRiskAndChangePLZ(singlePLZ) {
  var lastWeekParsed = parseInt(singlePLZ.OldConfCases_7days.split("-")[0]);
  var thisWeekParsed = parseInt(singlePLZ.NewConfCases_7days.split("-")[0]);
  // if (lastWeekParsed == 0) lastWeekParsed = 1; // assume 1
  // if (thisWeekParsed == 0) thisWeekParsed = 1; // assume 1
  var risk = getRiskClass(lastWeekParsed, thisWeekParsed, (parseInt(singlePLZ.Population) / 100000));
  var svgPolygon = document.getElementById('area_' + singlePLZ.PLZ);
  if (svgPolygon) svgPolygon.classList.add('area--risk-' + risk.className);
  return '<span class="risk ' + risk.className + risk.tendency + '">' + risk.symbol + risk.casesPerCapita + '</span>';
};

/**
 * Calculate risk
 * 
 * @param {number} casesLastWeek - sum of new cases 14 to 8 days ago
 * @param {number} casesThisWeek - sum of new cases 7 to 1 days ago
 * @param {number} population - in 100'000
 */
function getRiskClass(casesLastWeek, casesThisWeek, population) {
  var casesPerCapita_2weeks = Math.round((casesLastWeek + casesThisWeek) / population);
  var casesPerCapita_lastWeek = Math.round(casesLastWeek / population);
  var casesPerCapita_thisWeek = Math.round(casesThisWeek / population);

  var changeSymbol = '';
  if (casesThisWeek > (1.1 * casesLastWeek)) changeSymbol = '&#8599;&#xFE0E; '; // more than 10% increase
  else if (casesThisWeek < (0.9 * casesLastWeek)) changeSymbol = '&#8600;&#xFE0E; '; // more than 10% decrease

  var riskClass;
  if (casesPerCapita_2weeks >= 960) riskClass = 'deadly';
  else if (casesPerCapita_2weeks >= 480) riskClass = 'highest';
  else if (casesPerCapita_2weeks >= 240) riskClass = 'higher';
  else if (casesPerCapita_2weeks >= 120) riskClass = 'high';
  else if (casesPerCapita_2weeks >= 60) riskClass = 'medium';
  else if (casesPerCapita_2weeks >= 30) riskClass = 'low';
  else riskClass = 'lower';

  var riskClass_lastWeek;
  if (casesPerCapita_lastWeek >= 480) riskClass_lastWeek = 'deadly';
  else if (casesPerCapita_lastWeek >= 240) riskClass_lastWeek = 'highest';
  else if (casesPerCapita_lastWeek >= 120) riskClass_lastWeek = 'higher';
  else if (casesPerCapita_lastWeek >= 60) riskClass_lastWeek = 'high';
  else if (casesPerCapita_lastWeek >= 30) riskClass_lastWeek = 'medium';
  else if (casesPerCapita_lastWeek >= 15) riskClass_lastWeek = 'low';
  else riskClass_lastWeek = 'lower';

  var riskClass_thisWeek;
  if (casesPerCapita_thisWeek >= 480) riskClass_thisWeek = 'deadly';
  else if (casesPerCapita_thisWeek >= 240) riskClass_thisWeek = 'highest';
  else if (casesPerCapita_thisWeek >= 120) riskClass_thisWeek = 'higher';
  else if (casesPerCapita_thisWeek >= 60) riskClass_thisWeek = 'high';
  else if (casesPerCapita_thisWeek >= 30) riskClass_thisWeek = 'medium';
  else if (casesPerCapita_thisWeek >= 15) riskClass_thisWeek = 'low';
  else riskClass_thisWeek = 'lower';

  var tendencyClass = '';
  if (riskClass_lastWeek !== riskClass_thisWeek) tendencyClass = ' ' + riskClass_lastWeek + '2' + riskClass_thisWeek;

  return {
    casesPerCapita: casesPerCapita_2weeks,
    symbol: changeSymbol,
    percentChange: Math.round(100 * ((casesThisWeek / casesLastWeek) - 1)),
    className: riskClass,
    className_thisWeek: riskClass_thisWeek,
    className_lastWeek: riskClass_lastWeek,
    tendency: tendencyClass
  };
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
