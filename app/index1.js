var path = require('path');
var content = require('./content.js');
var content2 = 'hello';

document.write(content2);

if (module.hot) {
  module.hot.accept();
  module.hot.dispose(function() {
    clearInterval(timer);
  });
}