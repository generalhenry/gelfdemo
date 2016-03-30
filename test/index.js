describe('gelf forwarder', function() {
  var dockerMock = require('docker-mock');
  before(function (done) {
    var GelfServer = require('graygelf/server');
    var gelfServer = this.gelfServer = GelfServer().listen(5000);
    process.env.DOCKER_HOST = '127.0.0.1';
    process.env.DOCKER_PORT = 5354;
    process.env.LOG_HOST = '127.0.0.1';
    dockerMock.listen(process.env.DOCKER_PORT, done);

    require('../server.js');
  });
  describe('docker events', function () {
    it('should connect to the docker events', function (done) {
      this.gelfServer.once('message', function (message) {
        if (message._status == null) {
          return done(new Error('bad docker event message'));
        }
        done();
      });
      dockerMock.events.stream.emit('data', dockerMock.events.generateEvent());
    });
    it('should forward gelf messages', function (done) {
      this.gelfServer.on('message', function (message) {
        if (message.short_message === 'forward me') {
          done();
          this.gelfServer.close();
        }
      });
      var log = require('graygelf')('127.0.0.1');
      log.info('forward me');
    });
  });
});
