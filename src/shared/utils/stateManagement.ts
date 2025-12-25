/**
 * State management utilities for rollback patterns
 * Provides utilities for managing state rollback in async operations
 */

/**
 * Creates a state rollback manager
 * Useful for optimistic updates that may need to be rolled back on error
 */
export class StateRollbackManager<T> {
  private previousState: T | null = null;

  /**
   * Saves the current state for potential rollback
   */
  saveState(state: T): void {
    this.previousState = state;
  }

  /**
   * Gets the previous state for rollback
   */
  getPreviousState(): T | null {
    return this.previousState;
  }

  /**
   * Clears the saved state
   */
  clear(): void {
    this.previousState = null;
  }

  /**
   * Checks if there's a saved state
   */
  hasPreviousState(): boolean {
    return this.previousState !== null;
  }
}

/**
 * Creates a new state rollback manager instance
 */
export function createStateRollbackManager<T>(): StateRollbackManager<T> {
  return new StateRollbackManager<T>();
}

