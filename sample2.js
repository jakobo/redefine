/*
from including script tags...
<script src="redefine.js"></script>
<script src="one/one.js"></script>
<script src="two/two.js"></script>
<script src="two/three/three.js"></script>
<script src="four.js"></script>
*/

// debugger;
// var x = redefine()
// var y = x.save.as('my_four')
// var z = y.let('one/one').be('my_one')
// var q = z.from.redefine()

redefine()
  .save.as('my_one');
redefine()
  .save.as('my_two')
  .let('two/three/three').be('my_three');
redefine().save.as('my_three');
redefine()
  .save.as('my_four')
  .let('one/one').be('my_one').from.redefine()
  .let('two/two').be('my_two')
  .let('not/used').be('not_used_exports').from.exports();

var four = redefine.exports('my_four');

console.log('the exports for the fourth define call are...', four);