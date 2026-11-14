'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Fallback content shown instead of the crashed section. */
  fallback: ReactNode
  /** Changing this value clears the error state (e.g. when the inputs change). */
  resetKey?: string
}

interface State {
  hasError: boolean
  resetKey?: string
}

// A rendering error inside one widget (e.g. the Leaflet map receiving a bad coordinate) must
// never take the whole page down — show the fallback and let the rest of the page keep working.
export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, resetKey: this.props.resetKey }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true }
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetKey !== state.resetKey) return { hasError: false, resetKey: props.resetKey }
    return null
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}
