import type { CSSProperties, PointerEvent } from 'react';
import { Flame } from 'lucide-react';
import { FAMILIES } from '../engine/catalog';
import type { FamilyId } from '../engine/catalog';
import { FireworkGlyph } from './FireworkGlyph';

type Props = {
  collection: 'classics' | 'grand';
  variant: 'edge' | 'dock';
  selectedId: FamilyId;
  available: boolean;
  canLaunchFamily: (id: FamilyId) => boolean;
  onSelect: (id: FamilyId) => void;
  onLaunchFamily: (id: FamilyId) => void;
  onDragStart?: (id: FamilyId, event: PointerEvent<HTMLButtonElement>) => void;
};

/** Direct-manipulation shortcuts; the detailed picker remains available in the HUD. */
export function FireworkShelf({ collection, variant, selectedId, available, canLaunchFamily, onSelect, onLaunchFamily, onDragStart }: Props) {
  const families = collection === 'classics' ? FAMILIES.slice(0, 5) : FAMILIES.slice(5);
  return <div
    className={`firework-shelf firework-shelf--${variant} firework-shelf--${collection}`}
    data-family-shelf={collection}
    role='group'
    aria-label={collection === 'classics' ? 'Classic fireworks' : 'Grand fireworks'}
  >
    {families.map(family => {
      const launchable = canLaunchFamily(family.id);
      return <div className='shelf-item' key={family.id} data-selected={family.id === selectedId} style={{ '--family-color': family.color } as CSSProperties}>
        <button
          className='shelf-icon'
          type='button'
          data-family-icon={family.id}
          aria-label={`${family.name}. ${launchable ? 'Drag into the sky for a burst or onto the terrace for a rocket. Tap to select.' : 'Select for the next firework.'}`}
          aria-pressed={family.id === selectedId}
          title={`${family.name}: ${family.note} ${launchable ? 'Drag into the sky for a burst or onto the terrace for a normal rocket.' : 'Select for the next firework.'}`}
          disabled={!available}
          onPointerDown={event => { if (launchable) onDragStart?.(family.id, event); }}
          onClick={() => onSelect(family.id)}
        ><FireworkGlyph family={family.id} color={family.color}/></button>
        {variant === 'edge' && <button
          className='shelf-quick-launch'
          type='button'
          data-family-launch={family.id}
          data-stage-control
          aria-label={`Launch ${family.name}`}
          title={`Launch ${family.name} from the terrace`}
          disabled={!launchable}
          onKeyDown={event => { if (event.repeat && ['Enter', ' '].includes(event.key)) event.preventDefault(); }}
          onClick={() => onLaunchFamily(family.id)}
        ><Flame size={19} aria-hidden='true'/></button>}
      </div>;
    })}
  </div>;
}
