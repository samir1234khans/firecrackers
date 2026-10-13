
export type SeaOutfit = 'shirt' | 'tunic' | 'waistcoat' | 'pullover';
export type SeaWardrobe = { outfit: SeaOutfit; trousers: string; trim: string; layer: string; shoes: string; stripe: boolean };
const TROUSERS = ['#343f49', '#565044', '#374b48', '#4c4350'];
const TRIM = ['#d0bd98', '#a9b5ad', '#bbb0a7', '#819d9d'];
/** Authored everyday clothes for fictional people. No textures, physics or downloads. */
export function seaWardrobe(id: number, age: 'child' | 'adult' | 'older', operator: boolean): SeaWardrobe {
  const outfit = operator ? 'shirt' : age === 'older' ? (id % 2 ? 'waistcoat' : 'tunic') :
    age === 'child' ? (id % 3 === 0 ? 'tunic' : 'pullover') : (['shirt', 'tunic', 'waistcoat', 'pullover'] as const)[id % 4];
  return { outfit, trousers: TROUSERS[id % 4], trim: TRIM[id % 4],
    layer: ['#6b5440', '#344d50', '#685963', '#53604a'][id % 4],
    shoes: id % 2 ? '#514032' : '#292c30', stripe: age === 'child' && id % 2 === 0 };
}
