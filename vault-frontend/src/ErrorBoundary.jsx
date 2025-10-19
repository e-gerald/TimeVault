import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
    console.error("ErrorBoundary caught an error:", error, info);
  }

  render() {
    const { error, info } = this.state;
    if (error) {
      return (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          color: 'white',
          padding: 20,
          fontFamily: 'monospace',
          zIndex: 9999,
          overflow: 'auto'
        }}>
          <h1 style={{fontSize: 20, marginBottom: 8}}>Application error</h1>
          <div style={{whiteSpace: 'pre-wrap'}}>{String(error && error.toString())}</div>
          <details style={{marginTop: 12, whiteSpace: 'pre-wrap'}}>
            {info && info.componentStack ? info.componentStack : null}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}
