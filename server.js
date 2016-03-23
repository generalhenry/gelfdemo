var GelfServer = require('graygelf/server');
var Docker = require('dockerode');
var DockerEvents = require('docker-events');

var gelfServer = GelfServer();
var docker = new Docker();
var dockerEvents = new DockerEvents({
  docker: docker
});

dockerEvents.on('connect', function() {
  console.log('connected to docker api');
});

dockerEvents.on('disconnect', function() {
  console.log('disconnected to docker api; reconnecting');
});

dockerEvents.on('_message', function(message) {
  console.log('daemon: ' +
    message.Action +
    ' ' +
    message.Actor.Attributes.name);
});

dockerEvents.start();

gelfServer
  .on('message', function (gelf) {
    console.log(gelf._container_name + ':' + gelf.short_message);
  })
  .listen(12201, function() {
    console.log('server started');

    exitOnSignal('SIGINT');
    exitOnSignal('SIGTERM');

    function exitOnSignal(signal) {
      process.on(signal, function () {
        console.log('stopping server...');
        process.exit();
      });
    }
  });
