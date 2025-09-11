import { UpdateState, UpdateEvent, UpdateCallback } from './types'
import * as logger from '@promptx/logger'

interface StateTransition {
  from: UpdateState[]
  to: UpdateState
  event?: UpdateEvent
  guard?: () => boolean
}

export class UpdateStateMachine {
  private state: UpdateState = UpdateState.IDLE
  private listeners: Map<UpdateEvent, Set<UpdateCallback>> = new Map()
  private transitions: StateTransition[] = [
    // Start checking
    { from: [UpdateState.IDLE, UpdateState.ERROR], to: UpdateState.CHECKING },
    
    // Check results
    { from: [UpdateState.CHECKING], to: UpdateState.UPDATE_AVAILABLE },
    { from: [UpdateState.CHECKING], to: UpdateState.IDLE }, // No update available
    
    // Download flow
    { from: [UpdateState.UPDATE_AVAILABLE], to: UpdateState.DOWNLOADING },
    { from: [UpdateState.UPDATE_AVAILABLE], to: UpdateState.READY_TO_INSTALL }, // Auto-download may skip downloading state
    { from: [UpdateState.DOWNLOADING], to: UpdateState.READY_TO_INSTALL },
    
    // After install/restart
    { from: [UpdateState.READY_TO_INSTALL], to: UpdateState.IDLE },
    
    // Error handling
    { 
      from: [
        UpdateState.CHECKING, 
        UpdateState.DOWNLOADING, 
        UpdateState.UPDATE_AVAILABLE
      ], 
      to: UpdateState.ERROR 
    }
  ]

  constructor() {
    this.validateTransitions()
  }

  private validateTransitions(): void {
    const states = Object.values(UpdateState)
    const fromStates = new Set<UpdateState>()
    const toStates = new Set<UpdateState>()
    
    this.transitions.forEach(transition => {
      transition.from.forEach(s => fromStates.add(s))
      toStates.add(transition.to)
    })
    
    const unreachable = states.filter(s => 
      s !== UpdateState.IDLE && !toStates.has(s)
    )
    
    if (unreachable.length > 0) {
      logger.warn(`UpdateStateMachine: Unreachable states detected: ${unreachable.join(', ')}`)
    }
  }

  canTransition(to: UpdateState): boolean {
    return this.transitions.some(t => 
      t.from.includes(this.state) && t.to === to
    )
  }

  transition(to: UpdateState): boolean {
    if (!this.canTransition(to)) {
      logger.error(`UpdateStateMachine: Invalid transition from ${this.state} to ${to}`)
      return false
    }

    const oldState = this.state
    this.state = to
    
    logger.info(`UpdateStateMachine: State transition ${oldState} → ${to}`)
    this.emit('state-changed', { from: oldState, to })
    
    return true
  }

  getCurrentState(): UpdateState {
    return this.state
  }

  reset(): void {
    const oldState = this.state
    this.state = UpdateState.IDLE
    if (oldState !== UpdateState.IDLE) {
      this.emit('state-changed', { from: oldState, to: UpdateState.IDLE })
    }
  }

  on(event: UpdateEvent, callback: UpdateCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: UpdateEvent, callback: UpdateCallback): void {
    this.listeners.get(event)?.delete(callback)
  }

  once(event: UpdateEvent, callback: UpdateCallback): void {
    const wrapper = (data?: any) => {
      callback(data)
      this.off(event, wrapper)
    }
    this.on(event, wrapper)
  }

  emit(event: UpdateEvent, data?: any): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        logger.error(`UpdateStateMachine: Error in event listener for ${event}:`, error)
      }
    })
  }

  getStateInfo(): { 
    current: UpdateState, 
    possibleTransitions: UpdateState[] 
  } {
    const possibleTransitions = this.transitions
      .filter(t => t.from.includes(this.state))
      .map(t => t.to)
    
    return {
      current: this.state,
      possibleTransitions: [...new Set(possibleTransitions)]
    }
  }
}