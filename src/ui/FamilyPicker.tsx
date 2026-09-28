import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { FAMILIES, familyIndex } from '../engine/catalog';
import type { FamilyId } from '../engine/catalog';
import { FireworkGlyph } from './FireworkGlyph';
import '../styles/grand-collection.css';

type Props = { selectedId: FamilyId; available: boolean; onSelect: (id: FamilyId) => void };
/** Two sets of five, never ten squeezed touch targets. Selection stays authoritative. */
export function FamilyPicker({ selectedId, available, onSelect }: Props) {
    const collection = familyIndex(selectedId) >= 5 ? 1 : 0;
    const remembered = useRef<FamilyId[]>(['gold-willow', 'aurora-crown']);
    useEffect(() => { remembered.current[collection] = selectedId; }, [collection, selectedId]);
    return <div className='collection-picker' data-collection={collection ? 'grand' : 'classics'}>
        <div className='collection-switch' role='group' aria-label='Firework collections'>
            {['Classics', 'Grand collection'].map((label, i) => <button
                key={label} type='button' aria-pressed={collection === i} disabled={!available}
                onClick={() => onSelect(remembered.current[i])}>
                <span>{label}</span><small>{i ? '06–10' : '01–05'}</small>
            </button>)}
        </div>
        <div className='flow-families' role='group' aria-label={collection ? 'Grand firework styles' : 'Classic firework styles'}>
            {FAMILIES.slice(collection * 5, collection * 5 + 5).map(family => <button
                key={family.id} type='button' className={`flow-family${family.id === selectedId ? ' selected' : ''}`}
                aria-label={family.name} aria-pressed={family.id === selectedId} title={`${family.name}: ${family.note}`}
                style={{ '--family-color': family.color } as CSSProperties} disabled={!available} onClick={() => onSelect(family.id)}>
                <span className='flow-family-art'><FireworkGlyph family={family.id} color={family.color}/></span>
                <span>{family.id === 'chrysanthemum' ? 'Chrysanth.' : family.short}</span>
            </button>)}
        </div>
    </div>;
}
