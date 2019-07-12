function degrees(x) {
  return 180 * x / Math.PI;
}

function radians(x) {
  return x / 180 * Math.PI;
}

function lg(x) {
  return Math.log(x) / Math.LN10;
}

function p10(x) {
  return Math.pow(10, x);
}

function abs(x) {
  rs = [];
  for (i = 0; i < x.length; ++i) {
    rs.push(Math.abs(x[i]));
  }
  return rs;
}

function clamp(x, xmin, xmax) {
  if (x > xmax)
    return xmax;
  if (x < xmin)
    return xmin;
  return x;
}

function matrix_mult(a, b) {
  var c = [];
  for (i = 0; i < a.length; ++i) {
    var row = [];
    for (j = 0; j < b[0].length; ++j) {
      row.push(0);
      for (k = 0; k < b.length; ++k) {
        row[j] += a[i][k] * b[k][j];
      }
    }
    c.push(row);
  }
  return c;
}

function ShowerCS(core, theta, phi) {
  this.update = function(core, theta, phi) {
    var ct = Math.cos(theta);
    var st = Math.sin(theta);
    var cp = Math.cos(phi);
    var sp = Math.sin(phi);

    // zaxis: -phi rotation
    var rot_phi = [[ cp, sp,  0],
                   [-sp, cp,  0],
                   [  0,  0,  1]];
    // yaxis: -theta rotation
    var rot_theta = [[ ct, 0, -st],
                     [0  , 1,   0],
                     [ st, 0,  ct]];

    // put them together
    this.rot = matrix_mult(rot_theta, rot_phi);
    this.core = core;
  }

  this.update(core, theta, phi);

  this.v = function(d) {
    var v = [0, 0, 0];
    for (j = 0; j < 3; ++j)
      for (i = 0; i < 2; ++i)
        v[j] += this.rot[j][i] * (d[i] - this.core[i]);
    return v;
  }

  this.r = function(d) {
    var v = this.v(d);
    return Math.sqrt(Math.pow(v[0], 2) + Math.pow(v[1], 2));
  }

  this.signr = function(d) {
    var v = this.v(d);
    var r = Math.sqrt(Math.pow(v[0], 2) + Math.pow(v[1], 2));
    if (v[0] < 0)
      return -r;
    return r;
  }

  this.dt = function(d) {
    var c = 0.299792458; // m / ns
    var v = this.v(d);
    return (d[2] - this.core[2] + v[2] / c);
  }

  return this;
}

function axes(container, id, box, margin, xscale, xlabel, yscale, ylabel) {
  var x = box[0] + margin.left;
  var y = box[1] + margin.top;
  var w = box[2] - margin.left - margin.right;
  var h = box[3] - margin.top - margin.bottom;

  var g_axes = container.append("g")
    .attr("id", id)
    .attr("class", "axes")
    .datum([x, y, w, h])
    ;

  g_axes.append("rect")
    .attr("id", "background")
    .attr("x", x)
    .attr("y", y)
    .attr("width", w)
    .attr("height", h)
    .attr("fill", "white")
    ;

  xscale.range([x, x + w]);
  yscale.range([h + y, y]);

  var xaxis = d3.svg.axis()
    .scale(xscale)
    .orient("bottom")
    .ticks(4)
    ;

  var yaxis = d3.svg.axis()
    .scale(yscale)
    .orient("left")
    .ticks(4)
    ;

  // add x-axis
  g_axes.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0" + "," + (y + h) + ")")
      .call(xaxis)
    .append("text")
      .attr("class", "label")
      .attr("x", x + w)
      .attr("y", "-0.3em")
      .style("text-anchor", "end")
      .text(xlabel)
      ;

  // add y-axis
  g_axes.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + x + ",0)")
      .call(yaxis)
    .append("text")
      .attr("class", "label")
      .attr("x", "0.2em")
      .attr("y", y)
      .attr("dy", "0.7em")
      .style("text-anchor", "start")
      .text(ylabel)
      ;

  // add clippath
  var svg = d3.select("#IceTopCanvas");
  if (svg.select("defs").empty())
    svg.append("defs");
  svg.select("defs").append("clipPath")
    .attr("id", id + "-clip")
    .append("rect")
    .attr("x", x)
    .attr("y", y)
    .attr("width", w)
    .attr("height", h)
    ;

  return [xaxis, yaxis];
}

function contains(selector, coord) {
  var box = d3.select(selector).datum();
  return 0 < (coord[0] - box[0]) &&
         0 < (coord[1] - box[1]) &&
         (coord[0] - box[0]) < box[2] &&
         (coord[1] - box[1]) < box[3];
}

function sigma_lgs(lgs) {
  var a = [-0.5519, -0.078];
  var b = [-0.373, -0.658, 0.158];
  var t = [0.340, 2.077];
  if (lgs > t[1])
    lgs = t[1];
  if (lgs < t[0])
    return p10(a[0] + a[1] * lgs);
  return p10(b[0] + b[1] * lgs + b[2] * lgs * lgs);
};

function ldf(r, s125, beta) {
  var lg_s125 = lg(s125);
  var kappa = 0.30264;
  var x = lg(r / 125);
  var lgs = lg_s125 - beta * x - kappa * x * x;
  var slgs = sigma_lgs(lgs);
  var s = p10(lgs);
  return [s, s * Math.LN10 * slgs];
}

// function arrow(theta, phi) {
//   var head_l = 10;
//   var head_r = 10;
//   var width = 3;
//   var length = 20;

//   "M 0 0 l 10 10 v -6 h 50 v -8 h -50 v -6 Z"
// }
