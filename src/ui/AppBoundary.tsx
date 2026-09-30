import { Component } from 'react';
import type { ReactNode } from 'react';
import { RotateCcw, Monitor } from 'lucide-react';

/** A React failure should show recovery actions, never remove the entire website. */
export class AppBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    render() {
        if (!this.state.failed) return this.props.children;
        return <section className='boot-shell' data-boot-state='error' role='alert'>
            <h1>Sky interrupted</h1>
            <p>Reload to resume. Your preferences are saved.</p>
            <div className='boot-actions'>
                <button onClick={() => location.reload()}><RotateCcw size={16} aria-hidden='true'/>Reload website</button>
                <a href='?backend=canvas'><Monitor size={16} aria-hidden='true'/>Open compatibility mode</a>
            </div>
        </section>;
    }
}
