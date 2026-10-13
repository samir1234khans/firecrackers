import { SEA_FLEET } from './SeaFleetState.js';
import { hash01 } from '../engine/catalog.js';
import { seaWardrobe, type SeaWardrobe } from './SeaWardrobe.js';

export type PassengerAge = 'child' | 'adult' | 'older';
export type PassengerSpec = {
  id: number; boat: number; seat: number; age: PassengerAge; operator: boolean; rower: boolean;
  x: number; z: number; facing: number; size: number; partner: number;
  enthusiasm: number; sociability: number; preference: number; cloth: string; skin: string;
} & SeaWardrobe;
const CLOTH = ['#456776', '#b39a71', '#8b667f', '#4d705d', '#a36b52', '#4f8286', '#c0b79e'];
const SKIN = ['#ba9275', '#ae8061', '#c9a285', '#967154', '#c29a7d'];
/** Stable fictional families, never wedding participants. Operators have dedicated stern seats. */
export const SEA_PASSENGERS: readonly PassengerSpec[] = SEA_FLEET.flatMap((boat, index) =>
  Array.from({ length: boat.people }, (_, seat) => {
    const id = index * 8 + seat;
    const child = seat >= boat.people - boat.children;
    const older = (index === 2 && seat === 1) || index === 4 || (index === 7 && seat === 1);
    const operator = seat === 0;
    const row = Math.floor((seat - 1) / 2);
    const firstChild = boat.people - boat.children, adults = Math.max(1, firstChild - 1);
    const partner = child ? firstChild > 1 ? 1 + (seat - firstChild) % adults : 0 :
      !operator && boat.children > 0 ? firstChild + (seat - 1) % boat.children :
      operator ? Math.min(1, boat.people - 1) : seat % 2 ? (seat + 1 < boat.people ? seat + 1 : seat - 1) : seat - 1;
    return {
      id, boat: index, seat, age: child ? 'child' : older ? 'older' : 'adult', operator,
      rower: operator && (index === 0 || index === 7),
      x: operator ? -1.65 : -.65 + row * 1.05, z: operator ? 0 : seat % 2 ? -.46 : .46,
      facing: operator ? 0 : seat % 2 ? -Math.PI / 2 : Math.PI / 2,
      size: child ? .73 : older ? .96 : 1,
      partner,
      enthusiasm: (child ? .72 : older ? .22 : .40) + hash01(id, 714) * .25,
      sociability: .25 + hash01(id, 941) * .7, preference: Math.floor(hash01(id, 1501) * 13),
      cloth: CLOTH[id % CLOTH.length], skin: SKIN[id % SKIN.length],
      ...seaWardrobe(id, child ? 'child' : older ? 'older' : 'adult', operator),
    } satisfies PassengerSpec;
  }));
export const PASSENGERS_BY_BOAT = SEA_FLEET.map((_, boat) => SEA_PASSENGERS.filter(person => person.boat === boat));
export const SEA_PERFORMANCES = ['quiet-watch', 'notice', 'look-up', 'point', 'smile', 'delighted-lean',
  'clap', 'raised-arm', 'family-turn', 'answer-nod', 'conversation', 'operator-glance'] as const;
export type SeaPerformance = typeof SEA_PERFORMANCES[number];
