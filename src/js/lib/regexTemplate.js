var regex = function(parts) {
  var stripped = parts.raw.join("").replace(/\s|\n|\s*#.*$/gm, "");
  return new RegExp(stripped);
};

module.exports = regex;