import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
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

/** Continuous left collection; only its real footprint obstructs stage input. */
export function BottomCollection({ selectedId, available, canLaunchFamily, onLaunchFamily, onDragStart, notice, noticeFamilyId }: Props) {
  const space = useRef<HTMLSpanElement>(null);
  const [columns, setColumns] = useState(2);
  useLayoutEffect(() => {
    const measure = () => {
      const bounds = space.current?.getBoundingClientRect();
      if (!bounds) return;
      const viewport = window.visualViewport;
      const height = Math.min(bounds.height, viewport?.height ?? window.innerHeight);
      const width = Math.min(bounds.width, viewport?.width ?? window.innerWidth);
      // At most 624px of icons, with safe top/bottom already removed by CSS.
      const next = width >= 680 && height >= FAMILIES.length * 48 ? 1
        : (viewport?.height ?? window.innerHeight) <= 600 || height < 7 * 48 ? 3 : 2;
      setColumns(next);
    };
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    if (space.current) observer?.observe(space.current);
    window.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('resize', measure);
    measure();
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('resize', measure);
    };
  }, []);
  return <>
    <span ref={space} className='collection-space-measure' aria-hidden='true'/>
    <div className='bottom-collection chrome' data-family-tray data-collection-columns={columns}
      style={{ '--collection-columns': columns } as CSSProperties} role='group' aria-label='Firework collection'>
      {FAMILIES.map((family, index) => {
        const selected = family.id === selectedId;
        const launchable = canLaunchFamily(family.id);
        return <div className='bottom-collection-item' key={family.id} data-selected={selected}
          data-family-shelf={index < 5 ? 'classics' : index < 10 ? 'grand' : 'signature'}>
          <button type='button' className='bottom-collection-icon' data-family-icon={family.id} data-stage-control
            data-launchable={launchable} aria-label={`Launch ${family.name}`} aria-pressed={selected}
            title={`${family.name}. Tap to launch; drag into the sky for a burst or onto the terrace for a rocket.`}
            disabled={!available} onPointerDown={event => onDragStart(family.id, event)}
            onKeyDown={event => { if (event.repeat && ['Enter', ' '].includes(event.key)) event.preventDefault(); }}
            onClick={() => onLaunchFamily(family.id)}>
            <FireworkGlyph family={family.id} color={family.color}/>
            <span className='bottom-collection-name' aria-hidden='true'>{family.name}</span>
          </button>
          {(noticeFamilyId ?? selectedId) === family.id && notice && <span className='bottom-collection-notice' role='status'>{notice}</span>}
        </div>;
      })}
    </div>
  </>;
}
