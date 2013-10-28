define(['one/one', 'two/two'], function(one, two) {
  return {
    name: 'four',
    one: one.name,
    two: two.name,
    three: two.three.name
  };
});