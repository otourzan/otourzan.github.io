// Conversion utility class to convert dockerinspect output to run args.

export class  DockerConverter {

  private container: any
  private options: string[] = [];

  constructor(inspectionOutput: string) {
    const containersConfig = JSON.parse(inspectionOutput);
    this.container = containersConfig[0];
  }

  private addOption(name: string, option: any) {
    if(option)
      this.options.push(`--${name}=${option}`);
  }

  private addListOption(name: string, option: any[]) {
    if(!option)
      return;

    for (let opt of option) {
      this.options.push(`--${name}=${opt}`);
    }
  }

  private addPorts(): void {

    const netPorts = this.container.NetworkSettings?.Ports || {};
    const portBindings = this.container.HostConfig?.PortBindings || {};

    const ports = Object.assign({}, netPorts, portBindings);

    for(let portNProto in ports) {
      const bindingInfo = ports[portNProto];
      let [conatinerPort, proto] = portNProto.split('/');

      // add non tcp protos as trailing
      proto = proto == 'tcp' ? '' : '/' + proto;

      if(Object.keys(bindingInfo).length === 0) {
        this.options.push(`--expose ${conatinerPort}${proto}`);
      } else {
        let hostIP = bindingInfo[0]['HostIp'] + ':';
        let hostPort = bindingInfo[0]['HostPort'];

        if(hostPort == 0) {
          hostPort = '';
        }

        this.options.push(`-p ${hostIP}${hostPort}:${conatinerPort}${proto}`); 
      }
    }
  }

  private addLinks(): void {
    const links = this.container.HostConfig?.Links;

    if (!links)
      return;

    for(let link of links) {
      let [src, dst]: string[]|undefined[] = link.split(':');
      src = src?.split('/').pop();
      dst = dst?.split('/').pop();

      this.addOption('link', `${src}:${dst}`);
    }
  }

  private addRestartPolicy(): void {
    const restartPolicy = this.container.HostConfig?.RestartPolicy;

    if(!restartPolicy || restartPolicy.Name?.toLowerCase() == 'no')
      return;
    
    let policy: string = '';
    if(restartPolicy.Name == 'on-failure')
      policy = `${restartPolicy.Name}:${restartPolicy.MaximumRetryCount}`;
    else
      policy = `${restartPolicy.Name}`;
    
    this.addOption('restart', policy);
  }

  private addDevices(): void {

    const devices: [] = this.container.HostConfig?.Devices;
    if (!devices)
      return;

    for(let i in devices) {
      const dev: {[key:string]:string} = devices[i];

      const host = dev['PathOnHost'];
      const container = dev['PathInContainer'];
      const permissions = dev['CgroupPermissions'];

      let devOption = `${host}:${container}`;

      if(permissions !== 'rwm')
        devOption += permissions;
      
      this.addOption('device', devOption);
    }
  }

  private addLabels(): void {
    const labels: {[key:string]: string} = this.container.Config?.Labels;
    if (!labels)
      return;

    for(let l in labels) {
      const val = labels[l];
      this.addOption('label', `${l}=${val}`);
    }
  }

  private addLog(): void {
    const logConf = this.container.HostConfig?.LogConfig;

    const logType = logConf?.Type;
    const logOpts = logConf?.Config || {};

    if(logType != 'json-file')
      this.addOption('log-driver', logType);
    
    if(Object.keys(logOpts).length !== 0) {
      for(let key in logOpts){
        this.addOption('log-opt', `${key}=${logOpts[key]}`);
      }
    }
  }

  private addExtraHosts(): void {
    const extHosts: string[] = this.container.HostConfig?.ExtraHosts;
    if (!extHosts)
      return;

    for(let i in extHosts)
      this.addOption('add-host', extHosts[i]);
  }

  FormatCLI(containerName: string) :string {
    if(!this.container) {
      return "no container config";
    }

    let runCommand = 'docker run ';

    if(!containerName) {
      const name = this.container.Name.split('/')[1];
      this.options.push('--name=' + name);
    } else {
      this.options.push('--name=' + containerName);
    }

    const networkMode = this.container.HostConfig?.NetworkMode;
    if(networkMode != "default")
      this.options.push(`--network=${networkMode}`)

    this.addOption('hostname', this.container.Config?.Hostname);
    this.addOption('user', this.container.Config?.User);
    this.addOption('workdir', this.container.Config?.WorkingDir);

    this.addOption('mac-address',
      this.container.Config?.MacAddress ?? this.container.NetworkSettings?.MacAddress);
    this.addOption('privileged', this.container.HostConfig?.Privileged);
    this.addOption('runtime', this.container.HostConfig?.Runtime);

    
    this.addListOption('env', this.container.Config?.Env);
    
    this.addListOption('volume', this.container.Config?.Volumes);
    this.addListOption('volume', this.container.HostConfig?.Binds);
    this.addListOption('volumes-from', this.container.HostConfig?.VolumesFrom);
    
    this.addListOption('cap-add', this.container.HostConfig?.CapAdd);
    this.addListOption('cap-drop', this.container.HostConfig?.CapDrop);

    this.addPorts();
    this.addLinks();
    this.addRestartPolicy();
    this.addDevices();
    this.addLabels();
    this.addLog();
    this.addExtraHosts();
       
    this.addListOption('dns', this.container.HostConfig?.Dns);

    if(!this.container.Config?.AttachStdout)
        this.addOption('detach', true);

    if(this.container.Config?.Tty)
      this.options.push('-t');

    // Add IMAGE
    const image = this.container.Config?.Image
    if(!image) { throw new Error('No Image Found') };
    this.options.push( image);

    // Add CMD
    const cmds: string[] = this.container.Config?.Cmd;
    if (cmds) {
      let commands = '';
      for(let cmd of cmds) {
        commands += '"' + cmd.replace(/(["'$`\\])/g,'\\$1') + '" ';
      }
      this.options.push(commands);
    }

    const optionsStr = this.options.join(' ');
    runCommand += optionsStr;

    return runCommand;
  }
}