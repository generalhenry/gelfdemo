#!/usr/bin/env node
'use strict';
const exec = require('child_process').execFileSync;
const leftPad = require('left-pad');

const Driver = 'virtualbox';
const LoggerPort = 12201;
const ImageName = 'logger';
const AgentCount = 2;
const SwarmToken = run(['swarm', 'create']);

let machineList = [];
let swarmMasterIP;

/*
  buisness
*/
setupMachine('swarm-master', true);

for (let i = 0; i < AgentCount; i++) {
  setupMachine(`swarm-agent-${leftPad(i, 2, '0')}`, false);
}

setupElk('swarm-master');

// wait for Java
exec('sleep', ['10']);

run(['hello-world'], 'swarm-master', true);

console.log(`kibana: http://${swarmMasterIP}:5601`)

/*
  /buisness
*/

function setupMachine (machineName, swarm) {
  create(machineName, swarm);
  if (machineName === 'swarm-master') {
    swarmMasterIP = inspect('swarm-master').Driver.IPAddress;
  }
  build(['-t',
    ImageName,
    '.'], machineName);
  run(['-d',
    '-p', `${LoggerPort}:${LoggerPort}/udp`,
    '--log-driver=json-file',
    '--restart=always',
    '-v', '/var/run/docker.sock:/var/run/docker.sock',
    '-e', `SWARM_MASTER_IP=${swarmMasterIP}`,
    '--name', `${machineName}-logs`,
    ImageName], machineName);
  machineList.push(machineName);
}

function setupElk (machineName) {
  run(['-d',
    '-p', '9200:9200',
    '-p', '9300:9300',
    '--restart=always',
    '--name', `elasticsearch-logs`,
    'elasticsearch',
    'elasticsearch', '-Des.network.host=0.0.0.0'], machineName);
  run(['-d',
    '-p', '5000:5000/udp',
    '--restart=always',
    '--name', `logstash-logs`,
    'logstash',
    'logstash', '-e',
    `input {
      gelf {
        type => docker
        port => 5000
      }
    }
    output {
      elasticsearch {
        hosts => "${swarmMasterIP}:9200"
      }
    }`], machineName);
  run(['-d',
    '-p', '5601:5601',
    '--restart=always',
    '-e', `ELASTICSEARCH_URL=http://${swarmMasterIP}:9200`,
    '--name', `kibana-logs`,
    'kibana'], machineName);
}

function env (machineName, swarm) {
  const info = inspect(machineName);
  return {
      PATH: '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
      DOCKER_TLS_VERIFY: +info.HostOptions.EngineOptions.TlsVerify,
      DOCKER_HOST: `tcp://${info.Driver.IPAddress}:${swarm? 3376: 2376}`,
      DOCKER_CERT_PATH: info.HostOptions.AuthOptions.StorePath,
      DOCKER_MACHINE_NAME: info.Driver.MachineName
  };
}

function run (args, machineName, swarm) {
  args = ['run'].concat(args);
  return exec('docker', args, {
    env: env(machineName, swarm)
  }).toString();
}

function build (args, machineName, swarm) {
  return exec('docker', ['build'].concat(args), {
    env: env(machineName, swarm)
  }).toString();
}

function logs (args, machineName, swarm) {
  return exec('docker', ['logs'].concat(args), {
    env: env(machineName, swarm)
  }).toString();
}

function inspect (machineName) {
  return JSON.parse(exec('docker-machine',
    machineName ? ['inspect', machineName] : ['inspect']
  ));
}

function create (machineName, master) {
  let args = ['create',
    '-d', Driver,
    '--engine-opt', 'log-driver=gelf',
    '--engine-opt', `log-opt="gelf-address=udp://0.0.0.0:${LoggerPort}"`,
    '--swarm',
    '--swarm-discovery', `token://${SwarmToken}`
  ];
  if (Driver === 'amazonec2') {
    args = args.concat([
      '--amazonec2-region', process.env.EC2_REGION,
      '--amazonec2-vpc-id', process.env.EC2_VPC,
      '--amazonec2-subnet-id', process.env.EC2_SUBNET
    ]);
  }
  if (master) {
    args.push('--swarm-master');
  }
  args.push(machineName);
  return exec('docker-machine', args);
}
/*
  cleanup
  docker-machine rm -f swarm-master swarm-agent-00 swarm-agent-01
*/
