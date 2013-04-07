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
        debug('`'+ e + '` event on',  file)
        bundle(b)
      })
    })

    // force-regen on startup
    bundle(b)

    function bundle(b) {
      b.bundle(onBundle).on('error', onErr)
    }
    function onBundle(err, src) {
      if (err) log(err.stack)
      fs.writeFile(output, src, 'utf8', onWrite)
    }
    function onWrite (err) {
      if (err) log(err.stack)
      log(new Date().toISOString(), 'updated', prettypath)
    }
  })
  return bundles;
}

function onErr(err) {
  log(err.stack)
}

function log() {
  var args = [].slice.call(arguments)
  console.log.apply(console, ['browserify-watcher:'].concat(args))
}
