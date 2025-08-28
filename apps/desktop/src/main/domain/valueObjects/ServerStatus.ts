export enum ServerStatus {
  STOPPED = 'stopped',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  ERROR = 'error'
}

export class ServerStatusValue {
  private constructor(private readonly status: ServerStatus) {}

  static stopped(): ServerStatusValue {
    return new ServerStatusValue(ServerStatus.STOPPED)
  }

  static starting(): ServerStatusValue {
    return new ServerStatusValue(ServerStatus.STARTING)
  }

  static running(): ServerStatusValue {
    return new ServerStatusValue(ServerStatus.RUNNING)
  }

  static stopping(): ServerStatusValue {
    return new ServerStatusValue(ServerStatus.STOPPING)
  }

  static error(): ServerStatusValue {
    return new ServerStatusValue(ServerStatus.ERROR)
  }

  getValue(): ServerStatus {
    return this.status
  }

  isRunning(): boolean {
    return this.status === ServerStatus.RUNNING
  }

  isStopped(): boolean {
    return this.status === ServerStatus.STOPPED
  }

  canStart(): boolean {
    return this.status === ServerStatus.STOPPED || 
           this.status === ServerStatus.ERROR
  }

  canStop(): boolean {
    return this.status === ServerStatus.RUNNING
  }

  equals(other: ServerStatusValue): boolean {
    return this.status === other.status
  }

  toString(): string {
    return this.status
  }
}