var isNumber = /^-?\d[\d.,]*$/;

var cast = function(str) {
  if (typeof str != "string") return str;
  if (str == "true" || str == "false") {
    return str == "true" ? true : false;
  }
  if (isNumber.test(str)) {
    return parseFloat(str.replace(/,/g, ""));
  }
  return str;
};

var parseLine = function(line) {
  var columns = [];
  var buffer = "";
  var quoted = false;
  for (var i = 0; i < line.length; i++) {
    var char = line[i];
    switch (char) {
      case `"`:
        //handle escaped quotes
        if (line[i+1] == `"` && line[i+2] == `"`) {
          buffer += `"`;
          i += 2;
        } else {
          quoted = !quoted;
        }
        break;

      case ",":
        if (!quoted) {
          columns.push(buffer);
          buffer = "";
          break;
        }

      default:
        buffer += char;
    }
  }
  if (buffer) {
    columns.push(buffer);
  }
  return columns;
}

module.exports = function(text, noHeader) {
  var lines = text.replace(/\r/g, "").split("\n");
  var header = parseLine(lines.shift());
  lines = lines.map(function(l) {
    var values = parseLine(l).map(cast);
    var named = {};
    values.forEach(function(v, index) {
      var key = header[index] || index;
      named[key] = v;
    })
    return named;
  });
  return lines;
}