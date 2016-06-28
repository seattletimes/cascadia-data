module.exports = {
  map: function(a, c, f) {
    var result = [];
    var count = 0;

    var check = function(index, err, value) {
      if (err) {
        if (f) f(err);
        return;
      }
      result[index] = value;
      count++;
      if (count == a.length && f) f(null, result);
    };

    a.map(function(input, i) {
      c(input, check.bind(null, i));
    });
  }
}