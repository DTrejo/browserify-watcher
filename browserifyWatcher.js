module.exports = browserifyWatcher

var path = require('path')
var fs = require('fs')
var browserify = require('browserify')
var debug = require('debug')('browserify-watcher')

//
// Takes a path to a js file, outputs browserified version, e.g.
// dir/filename.js -> dir/filename.min.js
//
function browserifyWatcher (jsfiles) {
  if (typeof jsfiles == 'string') jsfiles = [ jsfiles ]

  var bundles = []
  jsfiles.forEach(function(mainjs) {
    debug('processing', mainjs)
    var b = browserify(mainjs)
    bundles.push(b)

    var newname = path.basename(mainjs, '.js') + '.min.js'
    var output = path.join(path.dirname(mainjs), newname)
    var prettypath = path.relative(path.dirname(module.parent.filename), output)

    // force-regen on startup
    b.bundle(onBundle)

    // regen on change
    // TODO detect renames
    fs.watch(mainjs, function(e, filename) {
      b.bundle(onBundle)
    })

    function onBundle(err, src) {
      if (err) console.log('browserify-watcher:', err.stack)
      fs.writeFile(output, src, 'utf8', onWrite)
    }
    function onWrite (err) {
      if (err) console.log('browserify-watcher:', err.stack)
      console.log('Updated bundle -', new Date().toISOString(), '-', prettypath)
    }
    b.on('syntaxError', function(err) {
      console.log('browserify-watcher:', err.toString())
    })
  })
  return bundles;
}
