import { useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import { FAMILIES, familyIndex } from '../engine/catalog';
import type { FamilyId } from '../engine/catalog';
import { FireworkGlyph } from './FireworkGlyph';
import '../styles/grand-collection.css';

type Props = { selectedId: FamilyId; available: boolean; onSelect: (id: FamilyId) => void; onDragStart?: (id: FamilyId, event: PointerEvent<HTMLButtonElement>) => void };
/** Two sets of five, never ten squeezed touch targets. Selection stays authoritative. */
export function FamilyPicker({ selectedId, available, onSelect, onDragStart }: Props) {
    const [collection, setCollection] = useState(Math.floor(familyIndex(selectedId) / 5));
    return <div className='collection-picker' data-collection={['classics', 'grand', 'signature'][collection]}>
        <div className='collection-switch' role='group' aria-label='Firework collections'>
            {['Classics', 'Grand collection', 'Signature'].map((label, i) => <button
                key={label} type='button' aria-pressed={collection === i} disabled={!available}
                onClick={() => setCollection(i)}>
                <span>{label}</span>
            </button>)}
        </div>
        <div className='flow-families' role='group' aria-label={['Classic firework styles', 'Grand firework styles', 'Signature firework styles'][collection]}>
            {FAMILIES.slice(collection * 5, collection * 5 + 5).map(family => <button
                key={family.id} type='button' className={`flow-family${family.id === selectedId ? ' selected' : ''}`}
                aria-label={family.name} aria-pressed={family.id === selectedId} title={`${family.name}: ${family.note}`}
                style={{ '--family-color': family.color } as CSSProperties} disabled={!available} onPointerDown={event => onDragStart?.(family.id, event)} onClick={() => onSelect(family.id)}>
                <span className='flow-family-art'><FireworkGlyph family={family.id} color={family.color}/></span>
                <span className='family-copy'><strong>{family.name}</strong></span>
            </button>)}
        </div>
    </div>;
}
