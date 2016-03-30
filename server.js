var GelfServer = require('graygelf/server');
var GelfClient = require('graygelf');
var Docker = require('dockerode');
var DockerEvents = require('docker-events');

var gelfServer = GelfServer();
var gelfClient = GelfClient({
  host: process.env.LOG_HOST || 'logstash.swarm',
  port: process.env.LOG_PORT || 5000
});
var docker = new Docker({
  host: process.env.DOCKER_HOST,
  port: process.env.DOCKER_PORT
});
var dockerEvents = new DockerEvents({
  docker: docker
});

dockerEvents.on('error', function (err) {
  console.error('docker event error');
  console.error(err);
});

gelfServer.on('error', function (err) {
  console.error('gelf server error');
  console.error(err);
});

gelfClient.on('error', function (err) {
  console.error('gelf client error');
  console.error(err);
});

// connect to docker events

dockerEvents.on('connect', function() {
  console.log('connected to docker api');
});

dockerEvents.on('disconnect', function() {
  console.log('disconnected to docker api; reconnecting');
});

// forward docker events to gelf

dockerEvents.on('_message', function(message) {
  gelfClient.info.a('', '', message);
});

// forward gelf messages

gelfServer.pipe(gelfClient);

// init

gelfServer.listen(12201, function() {
  console.log('server started');
});

dockerEvents.start();
