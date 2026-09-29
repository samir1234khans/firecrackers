import { Component } from 'react';
import type { ReactNode } from 'react';

/** A React failure should show recovery actions, never remove the entire website. */
export class AppBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    render() {
        if (!this.state.failed) return this.props.children;
        return <section className='boot-shell' role='alert'>
            <p className='boot-label'>Firecrackers</p>
            <h1>Let’s bring the sky back.</h1>
            <p>The interface was interrupted. Your saved preferences are still here.</p>
            <div className='boot-actions'>
                <button onClick={() => location.reload()}>Reload website</button>
                <a href='?backend=canvas'>Open compatibility mode</a>
            </div>
        </section>;
    }
}
