import type { PointerEvent } from 'react';
import { FAMILIES } from '../engine/catalog';
import type { FamilyId } from '../engine/catalog';
import { FireworkGlyph } from './FireworkGlyph';
import '../styles/collection.css';

type Props = {
  selectedId: FamilyId;
  available: boolean;
  canLaunchFamily: (id: FamilyId) => boolean;
  onLaunchFamily: (id: FamilyId) => void;
  onDragStart: (id: FamilyId, event: PointerEvent<HTMLButtonElement>) => void;
  notice?: string;
  noticeFamilyId?: FamilyId;
};

/** The launch collection keeps its geometry throughout pointer dragging. */
export function BottomCollection({ selectedId, available, canLaunchFamily, onLaunchFamily, onDragStart, notice, noticeFamilyId }: Props) {
  return <div className='bottom-collection chrome' data-family-tray>
    <div className='bottom-collection-groups'>
      {(['classics', 'grand', 'signature'] as const).map((collection, index) => <div
        key={collection}
        className='bottom-collection-group'
        data-family-shelf={collection}
        role='group'
        aria-label={['Classics fireworks', 'Grand Collection fireworks', 'Signature fireworks'][index]}
      >
        <span className='bottom-collection-caption' aria-hidden='true'>{['Classics', 'Grand', 'Signature'][index]}</span>
        <div className='bottom-collection-icons'>
          {FAMILIES.slice(index * 5, index * 5 + 5).map(family => {
            const selected = family.id === selectedId;
            const launchable = canLaunchFamily(family.id);
            return <div className='bottom-collection-item' key={family.id} data-selected={selected}>
              <button
                type='button'
                className='bottom-collection-icon'
                data-family-icon={family.id}
                data-stage-control
                data-launchable={launchable}
                aria-label={`Launch ${family.name}`}
                aria-pressed={selected}
                title={`${family.name}. Tap to launch; drag into the sky for a burst or onto the terrace for a rocket.`}
                disabled={!available}
                onPointerDown={event => onDragStart(family.id, event)}
                onKeyDown={event => { if (event.repeat && ['Enter', ' '].includes(event.key)) event.preventDefault(); }}
                onClick={() => onLaunchFamily(family.id)}
              >
                <FireworkGlyph family={family.id} color={family.color}/>
                <span className='bottom-collection-name' aria-hidden='true'>{family.name}</span>
              </button>
              {(noticeFamilyId ?? selectedId) === family.id && notice && <span className='bottom-collection-notice' role='status'>{notice}</span>}
            </div>;
          })}
        </div>
      </div>)}
    </div>
  </div>;
}
