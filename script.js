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
  "CH": "Ganze Schweiz",
  "AG": "Kanton Aargau",
  "AI": "Kanton Appenzell Innerrhoden",
  "AR": "Kanton Appenzell Ausserrhoden",
  "BE": "Kanton Bern",
  "BL": "Kanton Basel Land",
  "BS": "Kanton Basel Stadt",
  "FR": "Kanton Freiburg",
  "GE": "Kanton Genf",
  "GL": "Kanton Glarus",
  "GR": "Kanton Graubünden",
  "JU": "Kanton Jura",
  "LU": "Kanton Luzern",
  "NE": "Kanton Neuenburg",
  "NW": "Kanton Nidwalden",
  "OW": "Kanton Obwalden",
  "SG": "Kanton St. Gallen",
  "SH": "Kanton Schaffhausen",
  "SO": "Kanton Solothurn",
  "SZ": "Kanton Schwyz",
  "TG": "Kanton Thurgau",
  "TI": "Kanton Tessin",
  "UR": "Kanton Uri",
  "VD": "Kanton Waadt",
  "VS": "Kanton Wallis",
  "ZG": "Kanton Zug",
  "ZH": "Kanton Zürich",
  "FL": "Fürstentum Liechtenstein"
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
var data = [];
var dataPerDay = [];
Chart.defaults.global.defaultFontFamily = "IBM Plex Sans";
document.getElementById("loaded").style.display = 'none';

//console.log("START");
getCanton(0);

function getCanton(i) {
  // var url = "https://raw.githubusercontent.com/openZH/covid_19/master/COVID19_Fallzahlen_CH_total_v2.csv";
  var url = 'https://raw.githubusercontent.com/openZH/covid_19/master/fallzahlen_kanton_total_csv_v2/COVID19_Fallzahlen_Kanton_'+cantons[i]+'_total.csv';
  if (cantons[i] == "FL") {
    var url = 'https://raw.githubusercontent.com/openZH/covid_19/master/fallzahlen_kanton_total_csv_v2/COVID19_Fallzahlen_FL_total.csv';
  }
  d3.csv(url, function(error, csvdata) {
    if (error!=null) {
      console.log(error.responseURL+" not found");
    } else {
      for(var x=0; x<csvdata.length; x++) {
        if(!csvdata[x].abbreviation_canton_and_fl) continue;
        if(csvdata[x].date.split(".").length>1) {
          var splitDate = csvdata[x].date.split(".");
          var day = splitDate[0];
          var month = splitDate[1];
          var year = splitDate[2];
          csvdata[x].date = year+"-"+month+"-"+day;
        }
        data.push(csvdata[x]);
      }
      if (verbose) {
        console.log("added "+csvdata.length+" rows for "+cantons[i]);
      }
    }
    if(i<cantons.length-1) {
      getCanton(i+1);
    }
    else {
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
  barChartAllCH();
  barChartCases('ZH');
  /* for(var i=0; i<cantons.length; i++) {
    barChartCases(cantons[i]);
  } */
}

function getDataPerDay() {
  for (var j = 15; j > 0; j--) {
    var date = new Date();
    date.setDate(date.getDate() - j);
    var dateString = date.toISOString();
    dateString = dateString.substring(0,10);
    var singleDayObject = {};
    singleDayObject.date = dateString;
    singleDayObject.data = [];
    for (var i = 0; i < cantons.length - 1; i++) { //without FL
      var canton = cantons[i];
      var cantonTotal = getNumConf(canton, date, "ncumul_conf");
      if (dataPerDay.length) {
        cantonTotal.nchange_conf = cantonTotal.ncumul_conf - dataPerDay[dataPerDay.length - 1].data[i].ncumul_conf;
      }
      singleDayObject.data.push(cantonTotal);
    }
    var total = singleDayObject.data.reduce(function(acc, val) { return acc + val.ncumul_conf; }, 0);
    singleDayObject.total = total;
    if (dataPerDay.length) {
      var change = total - dataPerDay[dataPerDay.length - 1].total;
      singleDayObject.change = change;
    }
    dataPerDay.push(singleDayObject);
    if (verbose) {
      console.log(dateString + ': ' + total);
    }
  }
  // console.log("End preping CH cases");
  if (verbose) {
    console.log(dataPerDay);
  }
}

function processActualData() {
  var dataPerCanton = dataPerDay[dataPerDay.length - 1].data.map(function(value, i) {
    return {
      'abbreviation': value.canton,
      'nnew2weeks': dataPerDay.slice(-14).reduce(function(acc, v) { return acc + v.data[i].nchange_conf }, 0),
      'date': value.date,
    }
  });
  var firstTable = document.getElementById("confirmed_1");
  var secondTable = document.getElementById("confirmed_2");
  for (var i = 0; i < dataPerCanton.length; i++) {
    var table;
    if (i < dataPerCanton.length / 2) table = firstTable;
    else table = secondTable;
    var cantonData = dataPerCanton[i];
    var tr = document.createElement("tr");
    var td = document.createElement("td");
    var span = document.createElement("span");
    span.className = "flag " + cantonData.abbreviation;
    span.appendChild(document.createTextNode(cantonData.abbreviation));
    td.appendChild(span);
    tr.appendChild(td);
    td = document.createElement("td");
    td.appendChild(document.createTextNode(cantonData.date));
    tr.appendChild(td);
    td = document.createElement("td");
    var text = document.createTextNode(cantonData.nnew2weeks.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'"));
    td.appendChild(text);
    tr.appendChild(td);
    td = document.createElement("td");
    span = document.createElement("span");
    var casesPerCapita = Math.round(cantonData.nnew2weeks / population[cantonData.abbreviation]);
    if (casesPerCapita > 120) span.className = 'risk high';
    else if (casesPerCapita > 60) span.className = 'risk medium';
    else span.className = 'risk low';
    span.appendChild(document.createTextNode(casesPerCapita));
    td.appendChild(span);
    tr.appendChild(td);
    table.appendChild(tr);
  }
}

function barChartAllCH() {
  var place = "CH";
  var section = document.getElementById("index");
  var article = document.createElement("article");
  article.id="detail_"+place;
  var h3 = document.createElement("h3");
  h3.className = "flag "+place;
  var text = document.createTextNode(_(names[place]));
  h3.appendChild(text);
  article.appendChild(h3);
  var paragraph = document.createElement("p");
  var nnew2weeks = dataPerDay.slice(-14).reduce(function(accumulator, value) { return accumulator + value.change }, 0);
  // var nnew1week = dataPerDay.slice(-7).reduce(function(accumulator, value) { return accumulator + value.change }, 0);
  var casesPerCapita = Math.round(nnew2weeks / population[place]);
  if (casesPerCapita > 120) paragraph.className = 'risk high';
  else if (casesPerCapita > 60) paragraph.className = 'risk medium';
  else paragraph.className = 'risk low';
  text = document.createTextNode(nnew2weeks.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'") + ' Fälle in den letzten 2 Wochen; ' + casesPerCapita + ' pro 100\'000 Einwohner\'innen');
  paragraph.appendChild(text);
  article.appendChild(paragraph);
  var div = document.createElement("div");
  div.className = "canvas-dummy";
  div.id = "container_" + place;
  var canvas = document.createElement("canvas");
  canvas.id = place;
  canvas.height = 250;
  div.appendChild(canvas);
  article.appendChild(div);
  section.appendChild(article);
  var dateLabels = dataPerDay.map(function(d) {
    var dateSplit = d.date.split("-");
    var day = parseInt(dateSplit[2]);
    var month = parseInt(dateSplit[1]) - 1;
    var year = parseInt(dateSplit[0]);
    var date = new Date(year, month, day, 0, 0);
    return date;
  });
  var cases = dataPerDay.map(function(d) {return d.change});
  new Chart(canvas.id, {
    type: 'bar',
    options: {
      responsive: true,
      layout: {
        padding: {
          right: 20,
          left: 20,
          top: 20
        }
      },
      legend: {
        display: false
      },
      title: {
        display: false
      },
      tooltips: {
        enabled: false
      },
      scales: getScales(dateLabels[0].setHours(12, 0, 0)),
      plugins: {
        datalabels: getDataLabels()
      }
    },
    data: {
      labels: dateLabels,
      datasets: [
        {
          data: cases,
          fill: false,
          cubicInterpolationMode: 'monotone',
          spanGaps: true,
          borderColor: '#DA291C',
          backgroundColor: '#DA291C',
          datalabels: {
            align: 'end',
            anchor: 'end'
          }
        }
      ]
    }
  });
}

function getNumConf(canton, date, variable) {
  var dateString = date.toISOString();
  dateString = dateString.substring(0,10);
  var filteredData = data.filter(function(d) { if(d.abbreviation_canton_and_fl==canton && d.date==dateString && d[variable]!="") return d});
  if(filteredData.length>0) {
    if(filteredData.length>1) console.log("More than 1 line for "+canton+" date: "+dateString);
    var obj = {
      canton: canton,
      date: dateString,
    };
    obj[variable] = parseInt(filteredData[filteredData.length-1][variable]);
    return obj;
  }
  var dayBefore = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() - 1));
  return getNumConf(canton, dayBefore, variable);
}

function barChartCases(place) {
  var filteredData = dataPerDay.map(function(d) {
    return d.data.filter(function(dd) { return dd.canton === place; })[0];
  });
  var section = document.getElementById("detail");
  var article = document.createElement("article");
  article.id="detail_"+place;
  var h3 = document.createElement("h3");
  h3.className = "flag "+place;
  var text = document.createTextNode(_(names[place]));
  h3.appendChild(text);
  article.appendChild(h3);
  var paragraph = document.createElement("p");
  var nnew2weeks = filteredData.slice(-14).reduce(function(accumulator, value) { return accumulator + value.nchange_conf }, 0);
  // var nnew1week = dataPerDay.slice(-7).reduce(function(accumulator, value) { return accumulator + value.nchange_conf }, 0);
  var casesPerCapita = Math.round(nnew2weeks / population[place]);
  if (casesPerCapita > 120) paragraph.className = 'risk high';
  else if (casesPerCapita > 60) paragraph.className = 'risk medium';
  else paragraph.className = 'risk low';
  text = document.createTextNode(nnew2weeks.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'") + ' Fälle in den letzten 2 Wochen; ' + casesPerCapita + ' pro 100\'000 Einwohner\'innen');
  paragraph.appendChild(text);
  article.appendChild(paragraph);
  var div = document.createElement("div");
  div.className = "canvas-dummy";
  div.id = "container_"+place;
  var canvas = document.createElement("canvas");
  if (filteredData.length==0) {
    div.appendChild(document.createTextNode(_("Keine Daten")));
  } else {
    canvas.id = place;
    canvas.height = 250;
    div.appendChild(canvas);
  }
  article.appendChild(div);
  section.appendChild(article);
  var dateLabels = dataPerDay.map(function(d) {
    var dateSplit = d.date.split("-");
    var day = parseInt(dateSplit[2]);
    var month = parseInt(dateSplit[1]) - 1;
    var year = parseInt(dateSplit[0]);
    var date = new Date(year, month, day, 0, 0);
    return date;
  });
  var cases = filteredData.map(function(d) { if (d.nchange_conf) return d.nchange_conf });
  new Chart(canvas.id, {
    type: 'bar',
    options: {
      layout: {
        padding: {
          right: 20,
          left: 20,
          top: 20
        }
      },
      responsive: true,
      legend: {
        display: false
      },
      title: {
        display: false
      },
      tooltips: {
        enabled: false
      },
      scales: getScales(dateLabels[0].setHours(12, 0, 0)),
      plugins: {
        datalabels: getDataLabels()
      }
    },
    data: {
      labels: dateLabels,
      datasets: [
        {
          data: cases,
          fill: false,
          cubicInterpolationMode: 'monotone',
          spanGaps: true,
          borderColor: '#0076bd',
          backgroundColor: '#0076bd',
          datalabels: {
            align: 'end',
            anchor: 'end'
          }
        }
      ]
    }
  });
}

function getScales(startDate) {
  var endDate = new Date();
  endDate.setDate(endDate.getDate() - 1);
  endDate.setHours(12, 0, 0);
  return {
    xAxes: [{
      type: 'time',
      time: {
        tooltipFormat: 'DD.MM.YYYY',
        unit: 'day',
        displayFormats: {
          day: 'DD.MM'
        }
      },
      ticks: {
        min: startDate,
        max: endDate,
      },
      /* gridLines: {
        color: inDarkMode() ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
      } */
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
      return value > 0 ? "+" + value : value;
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
