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

// create the master
setupMachine('swarm-master', true);

for (let i = 0; i < AgentCount; i++) {
  setupMachine(`swarm-agent-${leftPad(i, 2, '0')}`, false);
}

run(['hello-world'], 'swarm-master', true);

for(let machineName of machineList) {
  console.log(`
${machineName} logs:
  `);
  console.log(logs([`${machineName}/${machineName}-logs`],
    'swarm-master', true));
}

function setupMachine (machineName, swarm) {
  // create(machineName, swarm);
  build(['-t',
    ImageName,
    '.'], machineName);
  run(['-d',
    '-p', `${LoggerPort}:${LoggerPort}/udp`,
    '--log-driver=json-file',
    '--restart=always',
    '-v', '/var/run/docker.sock:/var/run/docker.sock',
    '--name', `${machineName}-logs`,
    ImageName], machineName);
  machineList.push(machineName);
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
  // handle swarm
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
    '--swarm-discovery', `token://${SwarmToken}`];
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
