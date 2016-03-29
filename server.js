var GelfServer = require('graygelf/server');
var GelfClient = require('graygelf');
var Docker = require('dockerode');
var DockerEvents = require('docker-events');

var gelfServer = GelfServer();
var gelfClient = GelfClient({ host: process.env.SWARM_MASTER_IP, port: 5000 });
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
  var short_message = 'daemon: ' +
    message.Action +
    ' ' +
    message.Actor.Attributes.name;
  gelfClient.info.a(short_message, '', message);
});

dockerEvents.start();

gelfServer.listen(12201, function() {
    console.log('server started');
  });

gelfServer.pipe(gelfClient);
