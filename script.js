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
  "ZH": "Ganzer Kanton Zürich",
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
  "ZH": 15.21,
  101: 0.55,
  102: 0.32,
  103: 1.55,
  104: 0.91,
  105: 0.97,
  106: 1.26,
  107: 1.05,
  108: 0.61,
  109: 1.33,
  110: 1.72,
  111: 0.93,
  112: 4.20
};

const colors2 = ["#a6cee3","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a","#ffff99","#b15928","#1f78b4"];
const colors3 = ["#a5df8a", "#ffff99", "#fdbf6f", "#fa9530", "#ff817e", "#e31a1d", "#b15928"];

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
  getBezirke();
  getPLZ();
}

function getBezirke() {
  var url = 'https://raw.githubusercontent.com/openZH/covid_19/master/fallzahlen_bezirke/fallzahlen_kanton_ZH_bezirk.csv';
  d3.queue()
    .defer(d3.json, "bezirke.json")
    .defer(d3.csv, url)
    .await(function(error, topo, csvdata) {
      drawBezirke(csvdata, topo);
    });
}

var plzdata = null;
var plzgeojson = null;
function getPLZ() {
  var url = 'https://raw.githubusercontent.com/openZH/covid_19/master/fallzahlen_plz/fallzahlen_kanton_ZH_plz.csv';
  d3.queue()
    .defer(d3.json, "https://raw.githubusercontent.com/openZH/covid_19/master/fallzahlen_plz/PLZ_gen_epsg4326_F_KTZH_2020.json")
    .defer(d3.csv, url)
    .await(function(error, topo, csvdata) {
      plzdata = csvdata;
      plzgeojson = topo;
      drawPLZ(csvdata, topo);
    });
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
    td.appendChild(document.createTextNode(formatDate(new Date(cantonData.date))));
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
  text = document.createTextNode(nnew2weeks.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'") + ' neue Fälle in den letzten 2 Wochen; ' + casesPerCapita + ' pro 100\'000 Einwohner\'innen');
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
  var section = document.getElementById("overview_zh");
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
  text = document.createTextNode(nnew2weeks.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'") + ' neue Fälle in den letzten 2 Wochen; ' + casesPerCapita + ' pro 100\'000 Einwohner\'innen');
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
      gridLines: {
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

function lastBezirksData(data) {
  var table = document.getElementById("districtTable");
  for(var i=101; i<=112; i++) {
    var filtered = data.filter(function(d) { if(d.DistrictId==i) return d});
    var last = filtered[filtered.length-1];

    if(i==101) {
      var week = last.Week;
      var dateOfWeek = getDateOfISOWeek(week, 2020);
      var endDay = new Date(dateOfWeek);
      endDay.setDate(endDay.getDate()+6);
      var text = `Woche ${week} (${formatDate(dateOfWeek)} - ${formatDate(endDay)})`;
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
    text = document.createTextNode(last.NewConfCases);
    td.appendChild(text);
    tr.appendChild(td);

    td = document.createElement("td");
    span = document.createElement("span");
    var casesPerCapita = Math.round(last.NewConfCases / population[i]);
    var svgPolygon = document.getElementById('svg' + i);
    if (casesPerCapita > 60) {
      span.className = 'risk high';
      if (svgPolygon) svgPolygon.setAttribute('fill', 'red');
    } else if (casesPerCapita > 30) {
      span.className = 'risk medium';
      if (svgPolygon) svgPolygon.setAttribute('fill', 'orange');
    } else {
      span.className = 'risk low';
      if (svgPolygon) svgPolygon.setAttribute('fill', 'green');
    }
    span.appendChild(document.createTextNode(casesPerCapita));
    td.appendChild(span);
    tr.appendChild(td);

    table.appendChild(tr);
  }
}

function drawBezirke(csvdata, topodata) {
  var svg = d3.select("#bezirkssvg"),//.style("background-color", 'red'),
    width = +svg.attr("width"),
    height = +svg.attr("height");
  svg.selectAll("*").remove();
  var smaller = width<height ? width : height;
  const projection = d3.geoMercator()
      .center([8.675, 47.43])                // GPS of location to zoom on
      .scale(40000*(smaller/600))            // This is like the zoom
      .translate([ width/2, height/2 ])
  const path = d3.geoPath().projection(projection);

  // Draw the map
  svg.append("g")
    .selectAll("path")
    .data(topodata.features)
    .enter()
    .append("path")
    .attr("fill", "grey")
    .attr("id", function(d,i) {
      var bez_id = "" + d.properties.BEZ_ID;
      return "svg" + bez_id;
    })
    .attr("d", path)
    .style("stroke", inDarkMode() ? "black" : "white");
  
  // Fill the table
  lastBezirksData(csvdata);
};

function drawPLZ(csvdata,topodata) {
  var svg = d3.select("#plzsvg"),//.style("background-color", 'red'),
    width = +svg.attr("width"),
    height = +svg.attr("height");
  svg.selectAll("*").remove();
  var smaller = width<height ? width : height;
  const projection = d3.geoMercator()
      .center([8.675, 47.43])                // GPS of location to zoom on
      .scale(40000*(smaller/600))            // This is like the zoom
      .translate([ width/2, height/2 ])
  const path = d3.geoPath().projection(projection);

  // Draw the map
  svg.append("g")
    .selectAll("path")
    .data(topodata.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("id", function(d,i) {
      var plz = "" + d.properties.PLZ;
      if (plz) return "svg" + plz;
      else return false;
    })
    .style("stroke", inDarkMode() ? "black" : "white")
    .attr('fill', getColor)
    // .on("mouseover", mouseOverHandlerPLZ)
    // .on("mouseout", mouseOutHandlerPLZ);

  // Fill the table
  drawPLZTable();
};

function getColor(d, i) {
  // var plz = ""+d.properties.PLZ;
  if(d.properties.Ortschaftsname=="See") return inDarkMode() ? "black" : "white";
  /* var filtered = plzdata.filter(function(d) { if(d.PLZ==plz) return d});
  if(filtered.length>0 && filtered[filtered.length-1].NewConfCases_7days != "0-3") {
    var cases = filtered[filtered.length-1].NewConfCases_7days;
    if(cases=="4-6") return colors3[0];
    else if(cases=="7-9") return colors3[1];
    else if(cases=="10-12") return colors3[2];
    else if(cases=="13-15") return colors3[3];
    else if(cases=="16-18") return colors3[4];
    else if(cases=="19-21") return colors3[5]
    else return colors3[6]; //>21
  } */
  return "grey";
}

/* function mouseOverHandlerPLZ(d, i) {
  if(old) {
    var evt2 = new MouseEvent("mouseout");
    d3.select(old).node().dispatchEvent(evt2);
    old = null;
  }
  if(d.properties.Ortschaftsname=="See") return;
  d3.select(this).attr("fill", "#5592ED");
  var tr = document.getElementById("plz"+d.properties.PLZ);
  var div = document.getElementById("scrolldiv");
  tr.className = "active";
  if(scroll) div.scrollTop = tr.offsetTop-175;
  if(document.getElementById("plzchange"+d.properties.PLZ)) document.getElementById("plzchange"+d.properties.PLZ).className = "active";
}

function mouseOutHandlerPLZ(d, i) {
  d3.select(this).attr("fill", getColor);
  document.getElementById("plz"+d.properties.PLZ).className = "";
  if(document.getElementById("plzchange"+d.properties.PLZ)) document.getElementById("plzchange"+d.properties.PLZ).className = "";
} */

var whichclicked = "";
function drawPLZTable() {
  var tbody = document.getElementById("plzbody");

  var lastDate = plzdata[plzdata.length-1].Date;
  var h3 = document.getElementById("lastPLZSubtitle");
  h3.innerHTML = h3.innerHTML + " " + formatDate(new Date(plzdata[plzdata.length-1].Date));
  var filteredPLZData = plzdata.filter(function(d) { if(d.Date==lastDate) return d});
  // var changes = [];
  for(var i=0; i<filteredPLZData.length; i++) {
    var singlePLZ = filteredPLZData[i];
    var plz = ""+singlePLZ.PLZ;
    var filterForPLZ = plzdata.filter(function(d) { if(d.PLZ==plz) return d});
    var lastWeek = filterForPLZ[filterForPLZ.length-8];
    singlePLZ.OldConfCases_7days = lastWeek.NewConfCases_7days;
    // singlePLZ.OldDate = lastWeek.Date;
    /* if (lastWeek.NewConfCases_7days != singlePLZ.NewConfCases_7days) {
      singlePLZ.oldNewConfCases_7days = yesterday.NewConfCases_7days;
      singlePLZ.oldDate = yesterday.Date;
      changes.push(singlePLZ);
    } */
    var name = plzNames[plz];
    if(name==undefined) name = "";
    var tr = document.createElement("tr");
    tr.id = "plz"+plz;
    if (plz.length > 4) {
      tr.innerHTML = "<td>&nbsp;</td><td>"+plz+"</td><td>"+singlePLZ.OldConfCases_7days+"</td><td>"+singlePLZ.NewConfCases_7days+"</td><td>-</td>";
    } else {
      var riskAndChange = getRiskAndChange(singlePLZ);
      tr.innerHTML = "<td>"+plz+"</td><td>"+name+"</td><td>"+singlePLZ.OldConfCases_7days+"</td><td>"+singlePLZ.NewConfCases_7days+"</td><td>"+riskAndChange+"</td>";
    }
    // tr.onclick = clickElement;
    tbody.append(tr);
  }
  // drawChangesTable(changes);
}

function getRiskAndChange(singlePLZ) {
  var population = singlePLZ.Population;
  var lastWeekParsed = parseInt(singlePLZ.OldConfCases_7days.split("-")[0]);
  var thisWeekParsed = parseInt(singlePLZ.NewConfCases_7days.split("-")[0]);
  var symbol = '';
  var className = '';
  if (thisWeekParsed > lastWeekParsed) symbol = "&#8599;&#xFE0E; ";
  else if (thisWeekParsed < lastWeekParsed) symbol = "&#8600;&#xFE0E; ";
  var casesPerCapita = Math.round(100000 * (lastWeekParsed + thisWeekParsed) / population);
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

/* function drawChangesTable(changes) {
  var tbody = document.getElementById("plzchangesbody");
  for(var i=0; i<changes.length; i++) {
    var change = changes[i];
    var yesterday = change.oldNewConfCases_7days;
    var today = change.NewConfCases_7days;
    if(i==0) {
      var tday = document.getElementById("tday");
      var yday = document.getElementById("yday");
      var dateSplit = change.Date.split("-");
      var day = parseInt(dateSplit[2]);
      var month = parseInt(dateSplit[1]);
      tday.innerHTML = day+"."+month+".";
      dateSplit = change.oldDate.split("-");
      day = parseInt(dateSplit[2]);
      month = parseInt(dateSplit[1]);
      yday.innerHTML = day+"."+month+".";
    }
    var yesterdayParsed = parseInt(yesterday.split("-")[0]);
    var todayParsed = parseInt(today.split("-")[0]);
    var symbol = "";
    if(todayParsed > yesterdayParsed) symbol = "&#8599;&#xFE0E;";
    else symbol = "&#8600;&#xFE0E;"
    //console.log("Changes: "+change.PLZ+" - Old: "+yesterday+" New: "+today);
    var tr = document.createElement("tr");
    tr.id = "plzchange"+change.PLZ;
    var population = '';
    population = change.Population.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "’");;
    var name = plzNames[change.PLZ];
    if(name==undefined) name = "";
    if(change.PLZ.length>4) {
      tr.innerHTML = "<td colspan=\"2\">"+change.PLZ+"</td><td style=\"text-align: right;\">"+population+"</td><td style=\"text-align: right;\">"+yesterday+"</td><td style=\"text-align: right;\">"+today+"</td><td>"+symbol+"</td>";
    }
    else {
      tr.innerHTML = "<td>"+change.PLZ+"</td><td>"+name+"</td><td>"+population+"</td><td>"+yesterday+"</td><td>"+today+"</td><td>"+symbol+"</td>";
    }
    tr.onclick = clickChange;
    tbody.append(tr);
  }
}

var old = null;
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

function formatDate(date) {
  var dd = date.getDate();
  var mm = date.getMonth()+1;
  if (dd<10) dd='0'+dd;
  if (mm<10) mm='0'+mm;
  return dd + "." + mm + ".";
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
