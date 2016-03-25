# gelfdemo
Demo of docker logging using gelf for container logging and
the docker event api for logging the daemon

Depends on docker and docker-machine

to run:

./loggingswarm.js

to use with amazonec2:

in loggingswarm.js change the Driver to 'amazonec2'.
Make sure you have a credentials file @ ~/.aws/credentials.
Set environmental variables for EC2_REGION, EC2_VPC, and EC2_SUBNET

to cleanup:

docker-machine rm -f swarm-master swarm-agent-00 swarm-agent-01

if things run well you should have a swarm with logging proxies on each host
and ELK setup on the master with a link to kibana.
