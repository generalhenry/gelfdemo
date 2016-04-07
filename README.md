# gelf fowarder
Docker logging using gelf for container logging and
the docker event api for logging the daemon events

- connects to the docker daemon and so needs access to `/var/run/docker.sock`
- expects contains to be set to `--log-driver=gelf` so they send their logs
- expects it's own log driver to NOT be set to gelf (does not self filter)

to configure the destination set envs: `LOG_HOST` and `LOG_PORT`


typical usage:
```
docker build -t gelfforwarder .
docker run -d \
  -p 12201:12201/udp \
  --log-driver=json-file \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e LOG_HOST=<log host> \
  gelfforwarder
```
