/*
Redefine
Copyright 2011 LinkedIn

Licensed under the Apache License, Version 2.0 (the 'License');
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an 'AS
IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
express or implied.   See the License for the specific language
governing permissions and limitations under the License.
*/

/*
from including script tags...
<script src="redefine.js"></script>
<script src="modules/four.js"></script>
<script src="mockfour.js"></script>
*/

// debugger;
// var x = redefine()
// var y = x.save.as('four')
// var z = y.let('one/one').be('one')
// var q = z.from.redefine()

redefine()
  .save.as('four')
  .let('one/one').be({
    name: 'one'
  })
  .let('two/two').be({
    name: 'two',
    three: {
      name: 'three'
    }
  });

var four = redefine.exports('four');

if (typeof console !== 'undefined' && console.log) {
  console.log('the exports for the fourth define call are...', four);
}
if (typeof JSON !== 'undefined' && JSON.stringify) {
  document.getElementById('output').innerHTML = JSON.stringify(four);
}