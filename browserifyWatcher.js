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

    // regen on change
    // TODO detect renames
    var seen = {}
    b.on('file', function(file, id, parent) {
      if (seen[file]) return
      seen[file] = true
      fs.watch(file, function(e) {
        log('`'+ e + '` event on',  file)
        b.bundle(onBundle)
      })
    })

    // force-regen on startup
    b.bundle(onBundle)

    function onBundle(err, src) {
      if (err) log(err.stack)
      fs.writeFile(output, src, 'utf8', onWrite)
    }
    function onWrite (err) {
      if (err) log(err.stack)
      log('Updated bundle at', new Date().toISOString(), '-', prettypath)
    }
    b.on('syntaxError', function(err) {
      log(err.toString())
    })
  })
  return bundles;
}

function log() {
  var args = [].slice.call(arguments)
  console.log.apply(console, ['browserify-watcher:'].concat(args))
}
