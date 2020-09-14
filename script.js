var data;

var oldDate = null;
console.logCopy = console.log.bind(console);
console.log = function(arguments)
{
    if (arguments.length)
    {
        var d = new Date();
        if(oldDate==null) timestamp = '';
        else {
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
var dataSourceCantons = 'BAG';
var data = [];
var dataPerDay = [];
Chart.defaults.global.defaultFontFamily = "IBM Plex Sans";
document.getElementById("loaded").style.display = 'none';

//console.log("START");
getCantons();

function getCanton(i) {
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
        data.push(csvdata[x]);
      }
      if (verbose) {
        console.log("added " + csvdata.length + " rows for " + cantons[i]);
      }
    }
    if (i < cantons.length - 1) {
      getCanton(i + 1);
    } else {
      processData();
    }
  });
}

function processData() {
  document.getElementById("loadingspinner").style.display = 'none';
  document.getElementById("loaded").style.display = 'block';
  getDataPerDay();
  // console.log("Process actual");
  processActualData();
  drawBarChart('CH', dataPerDay, 'index', '#da291c');
  var canton = 'ZH';
  var filteredData = dataPerDay.map(function(d) {
    return d.data.filter(function(dd) { return dd.Canton === canton; })[0];
  });
  drawBarChart(canton, filteredData, 'overview_zh', '#0076bd');
  /* for(var i=0; i<cantons.length; i++) {
    barChartCases(cantons[i]);
  } */
  getDistricts();
  getZIP();
}

var bagData;
function getCantons() {
  var url = 'https://raw.githubusercontent.com/rsalzer/COVID_19_BAG/master/data/casesPerCanton.csv';
  d3.queue()
    .defer(d3.json, "kantone.json")
    .defer(d3.csv, url)
    .await(function(error, topo, csvdata) {
      var projection = d3.geoMercator()
        .center([8.3, 46.8])
        .scale(4200);
      drawMap('#kantonssvg', topo, projection, null, function() {
        if (dataSourceCantons === 'BAG') {
          bagData = csvdata;
          processData();
        } else {
          getCanton(0);
        }
        // fillTable(csvdata);
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
        .scale(21000);          // This is like the zoom
      drawMap('#bezirkssvg', topo, projection, 'BEZ_ID', function() {
        lastBezirksData(csvdata);
        // fillTable(csvdata);
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
        .scale(21000);          // This is like the zoom
      drawMap('#plzsvg', topo, projection, 'PLZ', function() {
        drawPLZTable(csvdata);
        // fillTable(csvdata);
      });
    });
}

function getDataPerDay() {
  for (var j = 30; j > 0; j--) {
    var dateString = getDateString(new Date(), -j);
    var singleDayObject = {
      Date: dateString,
      data: []
    };
    for (var i = 0; i < cantons.length - 1; i++) { // without FL
      singleDayObject.data.push(getSingleDayObject(cantons[i], dateString));
    }
    singleDayObject.TotalConfCases = singleDayObject.data.reduce(function(acc, val) { return acc + val.TotalConfCases; }, 0);
    singleDayObject.NewConfCases_1day = singleDayObject.data.reduce(function(acc, val) { return acc + val.NewConfCases_1day; }, 0);
    singleDayObject.NewConfCases_7days = singleDayObject.data.reduce(function(acc, val) { return acc + val.NewConfCases_7days; }, 0);
    if (singleDayObject.data[0].NewConfCases_7dayAverage) {
      singleDayObject.NewConfCases_7dayAverage = singleDayObject.data.reduce(function(acc, val) { return acc + val.NewConfCases_7dayAverage; }, 0);
    }
    dataPerDay.push(singleDayObject);
  }
  // console.log("End preping CH cases");
  if (verbose) {
    console.log(dataPerDay);
  }
}

function processActualData() {
  var dataPerCanton = dataPerDay[dataPerDay.length - 1].data.map(function(value, i) {
    return {
      'Canton': value.Canton,
      'NewConfCases_7days': value.NewConfCases_7days,
      'OldConfCases_7days': dataPerDay[dataPerDay.length - 8].data[i].NewConfCases_7days,
      'Population': population[value.Canton],
      'Date': value.Date,
    }
  });
  var table;
  var firstTable = document.getElementById("confirmed_1");
  var secondTable = document.getElementById("confirmed_2");
  for (var i = 0; i < dataPerCanton.length; i++) {
    if (i < dataPerCanton.length / 2) table = firstTable;
    else table = secondTable;
    var cantonData = dataPerCanton[i];
    var tr = document.createElement("tr");
    var td = document.createElement("td");
    var span = document.createElement("span");
    span.className = "flag " + cantonData.Canton;
    span.appendChild(document.createTextNode(names[cantonData.Canton]));
    td.appendChild(span);
    tr.appendChild(td);
    /* td = document.createElement("td");
    td.appendChild(document.createTextNode(formatDate(new Date(cantonData.Date))));
    tr.appendChild(td); */
    td = document.createElement("td");
    td.appendChild(document.createTextNode(formatNumber(cantonData.OldConfCases_7days)));
    tr.appendChild(td);
    td = document.createElement("td");
    td.appendChild(document.createTextNode(formatNumber(cantonData.NewConfCases_7days)));
    tr.appendChild(td);
    td = document.createElement("td");
    td.innerHTML = getRiskAndChangeCanton(cantonData);
    tr.appendChild(td);
    table.appendChild(tr);
  }
}

/**
 * Get single day object
 * 
 * @param {string} canton - 2 letter identifier of canton
 * @param {string} dateString - ISO formatted date string
 * @returns {object} - single day object
 */
function getSingleDayObject(canton, dateString) {
  var today = getTotalConfCases(canton, dateString);
  var yesterday = getTotalConfCases(canton, getDateString(new Date(dateString), -1));
  var minus4days = getTotalConfCases(canton, getDateString(new Date(dateString), -4));
  var plus3days = getTotalConfCases(canton, getDateString(new Date(dateString), +3));
  var minus7days = getTotalConfCases(canton, getDateString(new Date(dateString), -7));
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
 * @returns {number} - total number of confirmed cases
 */
function getTotalConfCases(canton, dateString) {
  var filteredData;
  var variable;
  if (dataSourceCantons === 'BAG') {
    variable = canton;
    filteredData = bagData.filter(function(d) {
      if (d.date == dateString && d[canton] != '') return d;
    });
  } else {
    variable = 'ncumul_conf';
    filteredData = data.filter(function(d) {
      if (d.abbreviation_canton_and_fl == canton && d.date == dateString && d[variable] != '') return d;
    });
  }
  if (filteredData.length > 0) {
    return parseInt(filteredData[filteredData.length - 1][variable]);
  }
  // else try day before
  return null; // getTotalConfCases(canton, getDateString(new Date(dateString), -1));
}

/**
 * Draw bar chart
 * 
 * @param {string} place - 'CH' or canton abbreviation
 * @param {object} filteredData - prefiltered data for place and date range
 * @param {string} sectionId - section to render chart to
 * @param {string} color - color of bars
 */
function drawBarChart(place, filteredData, sectionId, color) {
  var section = document.getElementById(sectionId);
  var article = document.createElement("article");
  var h3 = document.createElement("h3");
  var nnew2weeks = filteredData[filteredData.length - 1].NewConfCases_7days + filteredData[filteredData.length - 8].NewConfCases_7days;
  var casesPerCapita = Math.round(nnew2weeks / population[place]);
  if (casesPerCapita > 120) h3.className = 'risk high';
  else if (casesPerCapita > 60) h3.className = 'risk medium';
  else h3.className = 'risk low';
  text = document.createTextNode(formatNumber(nnew2weeks) + ' neue Fälle in den letzten 2 Wochen; ' + casesPerCapita + ' pro 100\'000 Einwohner\'innen');
  h3.appendChild(text);
  article.appendChild(h3);
  var div = document.createElement("div");
  div.className = "canvas-dummy";
  div.id = "container_"+place;
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
  var dateLabels = filteredData.map(function(d) { return d.Date });
  var cases = filteredData.map(function(d) { return d.NewConfCases_1day });
  var averages = filteredData.map(function(d) { return Math.round(d.NewConfCases_7dayAverage) });
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
      scales: getScales(dateLabels), // .setHours(12, 0, 0)),
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
          fill: false,
          cubicInterpolationMode: 'monotone',
          spanGaps: true,
          borderColor: color,
          backgroundColor: color,
          datalabels: {
            align: 'end',
            anchor: 'end'
          }
        },
        {
          data: averages,
          order: 0,
          type: 'line',
          pointRadius: 0,
          borderColor: inDarkMode() ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
          borderWidth: 3,
          datalabels: {
            display: false
          }
        }
      ]
    }
  });
}

function getScales(dateLabels) {
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
    } /* ,
    formatter: function(value) {
      return value > 0 ? "+" + value : value;
    } */
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

function getSiblings(element, selector) {
	var siblings = [];
  var sibling = element.parentNode.firstChild;

	while (sibling) {
		if (sibling.nodeType === 1 && sibling !== element && sibling.matches(selector)) {
			siblings.push(sibling);
		}
		sibling = sibling.nextSibling
	}

	return siblings;
}

function inDarkMode() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return true;
  }
  return false;
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
  var width = parseInt(svg.style('width'));
  var height = parseInt(svg.style('height'));
  svg.selectAll('*').remove();
  projection.translate([width / 2, height / 2]);
  const path = d3.geoPath().projection(projection);

  // Draw the map
  svg.append('g')
    .selectAll('path')
    .data(topoData.features)
    .enter()
    .append('path')
    .attr('d', path)
    .attr('id', function(d) {
      var id = idAttribute ? d.properties[idAttribute] : d.id;
      if (id) return 'svg' + id;
      return false;
    })
    .style('stroke', inDarkMode() ? 'black' : 'white')
    .attr('fill', function(d) {
      var isLake = (d.properties.Ortschaftsname == 'See' || d.properties.BEZ_N == 'See');
      if (isLake) return inDarkMode() ? 'black' : 'white';
      return 'grey';
    });

  if (typeof callback === 'function') callback();
}

function lastBezirksData(data) {
  var table = document.getElementById("districtTable");
  for (var i = 101; i <= 112; i++) {
    var filtered = data.filter(function(d) { if (d.DistrictId == i) return d; } );
    var thisWeek = filtered[filtered.length - 1];
    var lastWeek = filtered[filtered.length - 2];

    if (i == 101) {
      var dateOfWeek = getDateOfISOWeek(lastWeek.Week, lastWeek.Year);
      var endDay = new Date(dateOfWeek);
      endDay.setDate(endDay.getDate() + 13);
      var text = `Wochen ${lastWeek.Week} und ${thisWeek.Week} (${formatDate(dateOfWeek)} – ${formatDate(endDay)})`;
      var lastTitle = document.getElementById("lastTitle");
      lastTitle.innerHTML = text;
    }

    var tr = document.createElement("tr");
    tr.id = i;
    var td = document.createElement("td");
    var span = document.createElement("span");
    span.className = "flag _"+i;
    var text = document.createTextNode(names[i]);
    span.appendChild(text);
    td.appendChild(span);
    tr.appendChild(td);
    td = document.createElement("td");
    td.appendChild(document.createTextNode(lastWeek.NewConfCases));
    tr.appendChild(td);
    td = document.createElement("td");
    td.appendChild(document.createTextNode(thisWeek.NewConfCases));
    tr.appendChild(td);
    td = document.createElement("td");
    td.innerHTML = getRiskAndChangeDistrict(lastWeek, thisWeek, i);
    tr.appendChild(td);

    table.appendChild(tr);
  }
}

var whichclicked = "";
function drawPLZTable(plzdata) {
  var tbody = document.getElementById("plzbody");
  var lastDate = plzdata[plzdata.length - 1].Date;
  var endDay = new Date(lastDate);
  var startDay = new Date(lastDate);
  startDay.setDate(startDay.getDate() - 13);
  var h3 = document.getElementById("lastPLZSubtitle");
  h3.innerHTML = h3.innerHTML + ' (' + formatDate(startDay) + ' – ' + formatDate(endDay) + ')';
  var filteredPLZData = plzdata.filter(function(d) { if(d.Date == lastDate) return d});
  for (var i=0; i<filteredPLZData.length; i++) {
    var singlePLZ = filteredPLZData[i];
    var plz = ""+singlePLZ.PLZ;
    var filterForPLZ = plzdata.filter(function(d) { if(d.PLZ == plz) return d});
    var lastWeek = filterForPLZ[filterForPLZ.length - 8];
    singlePLZ.OldConfCases_7days = lastWeek.NewConfCases_7days;
    var name = plzNames[plz];
    if(name == undefined) name = "";
    var tr = document.createElement("tr");
    tr.id = "plz" + plz;
    if (plz.length > 4) {
      tr.innerHTML = "<td>&nbsp;</td><td>"+plz+"</td><td>"+singlePLZ.OldConfCases_7days+"</td><td>"+singlePLZ.NewConfCases_7days+"</td><td>-</td>";
    } else {
      var riskAndChange = getRiskAndChangePLZ(singlePLZ);
      tr.innerHTML = "<td>"+plz+"</td><td>"+name+"</td><td>"+singlePLZ.OldConfCases_7days+"</td><td>"+singlePLZ.NewConfCases_7days+"</td><td>"+riskAndChange+"</td>";
    }
    // tr.onclick = clickElement;
    tbody.append(tr);
  }
}

function getRiskAndChangeCanton(singleCanton) {
  var symbol = '';
  var className = '';
  if (singleCanton.NewConfCases_7days > singleCanton.OldConfCases_7days) symbol = "&#8599;&#xFE0E; ";
  else if (singleCanton.NewConfCases_7days < singleCanton.OldConfCases_7days) symbol = "&#8600;&#xFE0E; ";
  var casesPerCapita = Math.round((singleCanton.OldConfCases_7days + singleCanton.NewConfCases_7days) / singleCanton.Population);
  var svgPolygon = document.getElementById('svg' + singleCanton.Canton);
  if (casesPerCapita > 120) {
    className = 'risk high';
    if (svgPolygon) svgPolygon.setAttribute('fill', 'red');
  } else if (casesPerCapita > 60) {
    className = 'risk medium';
    if (svgPolygon) svgPolygon.setAttribute('fill', 'orange');
  } else {
    className = 'risk low';
    if (svgPolygon) svgPolygon.setAttribute('fill', 'green');
  }
  return '<span class="' + className + '">' + symbol + casesPerCapita + '</span>';
};

function getRiskAndChangeDistrict(lastWeek, thisWeek, districtId) {
  var lastWeekParsed = parseInt(lastWeek.NewConfCases);
  var thisWeekParsed = parseInt(thisWeek.NewConfCases);
  var symbol = '';
  var className = '';
  if (thisWeekParsed > lastWeekParsed) symbol = "&#8599;&#xFE0E; ";
  else if (thisWeekParsed < lastWeekParsed) symbol = "&#8600;&#xFE0E; ";
  var casesPerCapita = Math.round(100000 * (lastWeekParsed + thisWeekParsed) / parseInt(thisWeek.Population));
  var svgPolygon = document.getElementById('svg' + districtId);
  if (casesPerCapita > 120) {
    className = 'risk high';
    if (svgPolygon) svgPolygon.setAttribute('fill', 'red');
  } else if (casesPerCapita > 60) {
    className = 'risk medium';
    if (svgPolygon) svgPolygon.setAttribute('fill', 'orange');
  } else {
    className = 'risk low';
    if (svgPolygon) svgPolygon.setAttribute('fill', 'green');
  }
  return '<span class="' + className + '">' + symbol + casesPerCapita + '</span>';
};

function getRiskAndChangePLZ(singlePLZ) {
  var lastWeekParsed = parseInt(singlePLZ.OldConfCases_7days.split("-")[0]);
  var thisWeekParsed = parseInt(singlePLZ.NewConfCases_7days.split("-")[0]);
  var symbol = '';
  var className = '';
  if (thisWeekParsed > lastWeekParsed) symbol = "&#8599;&#xFE0E; ";
  else if (thisWeekParsed < lastWeekParsed) symbol = "&#8600;&#xFE0E; ";
  var casesPerCapita = Math.round(100000 * (lastWeekParsed + thisWeekParsed) / singlePLZ.Population);
  var svgPolygon = document.getElementById('svg' + singlePLZ.PLZ);
  if (casesPerCapita > 120) {
    className = 'risk high';
    if (svgPolygon) svgPolygon.setAttribute('fill', 'red');
  } else if (casesPerCapita > 60) {
    className = 'risk medium';
    if (svgPolygon) svgPolygon.setAttribute('fill', 'orange');
  } else {
    className = 'risk low';
    if (svgPolygon) svgPolygon.setAttribute('fill', 'green');
  }
  return '<span class="' + className + '">' + symbol + casesPerCapita + '</span>';
};

/* var old = null;
var scroll = true;
function clickElement(event) {
  var evt = new MouseEvent("mouseover");
  var which = event.currentTarget.id.replace("plz", "#svg");
  scroll = false;
  d3.select(which).node().dispatchEvent(evt);
  scroll = true;
  old = which;
}

function clickChange(event) {
  var evt = new MouseEvent("mouseover");
  var which = event.currentTarget.id.replace("plz", "#svg");
  which = which.replace("change", "");
  d3.select(which).node().dispatchEvent(evt);
  old = which;
} */

/**
 * Get human readable number string in format XX'XXX
 * 
 * @param {number} num
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
 * Get ISO 8601 date string from date object
 * 
 * @param {Date} date - date object
 * @param {number} offset - offset in days
 */
function getDateString(date, offset = 0) {
  if (offset) {
    var date = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() + offset));
  }
  return date.toISOString().substring(0, 10);
}

function getDateOfISOWeek(w, y) {
  var simple = new Date(y, 0, 1 + (w - 1) * 7);
  var dow = simple.getDay();
  var ISOweekStart = simple;
  if (dow <= 4)
      ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else
      ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
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
