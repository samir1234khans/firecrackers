export const SHOW_THEMES = ['moonlit', 'golden', 'prismatic'] as const;
export type ShowTheme = typeof SHOW_THEMES[number];
export type EndlessTheme = ShowTheme | 'cycle';
export const THEME_NAMES: Record<ShowTheme, string> = { moonlit: 'Moonlit Silver', golden: 'Golden Celebration', prismatic: 'Prismatic Grand' };
export const PHRASE_SECONDS = 15;
export const SCORE_SECONDS = 90;
export const SCORE_GRID = .3125; // Eighth notes at 96 BPM; quantity never changes tempo.
export const themeValue = (v: unknown): ShowTheme => SHOW_THEMES.includes(v as ShowTheme) ? v as ShowTheme : 'prismatic';
export const endlessThemeValue = (v: unknown): EndlessTheme => v === 'cycle' ? v : themeValue(v);
export type ShowCue = Readonly<{ impact: number; family: number; placement: number; apex: number; featured: boolean }>;
const HERO_TIMES = [5, 17.5, 30, 42.5, 55, 70];
const HEROES: Record<ShowTheme, readonly number[]> = { moonlit: [3, 7, 11, 9, 3, 11], golden: [0, 2, 8, 10, 12, 4], prismatic: [1, 5, 6, 7, 9, 4] };
const CONNECTORS: Record<ShowTheme, readonly number[]> = { moonlit: [3, 2, 1, 2], golden: [0, 2, 0, 1], prismatic: [1, 2, 3, 0] };
const PLACEMENTS = [.5, .2, .8, .2, .8, .5];
const APICES = [.35, .50, .70];
function score(theme: ShowTheme): readonly ShowCue[] {
    const cues: ShowCue[] = HERO_TIMES.map((impact, i) => Object.freeze({ impact, family: HEROES[theme][i], placement: PLACEMENTS[i], apex: APICES[i % 3], featured: true }));
    // Leave breathing space around the hero structures, especially composite children.
    for (let i = 0; i < 25; i++) {
        const impact = 7.5 + i * 2.5;
        if (HERO_TIMES.some(t => Math.abs(t - impact) < 2.5)) continue;
        cues.push(Object.freeze({ impact, family: CONNECTORS[theme][i % 4], placement: i % 2 ? .8 : .2, apex: APICES[i % 3], featured: false }));
    }
    return Object.freeze(cues.sort((a, b) => a.impact - b.impact));
}
export const SHOW_SCORES = Object.freeze({ moonlit: score('moonlit'), golden: score('golden'), prismatic: score('prismatic') });

/** A shared fixed-clock score, independent of admission and audio availability. */
export class CinematicDirector {
    theme: ShowTheme = 'prismatic';
    choice: EndlessTheme = 'cycle';
    pendingTheme: EndlessTheme | null = null;
    start = 0;
    phase = 0;
    cycle = 0;
    phrase = 0;
    generation = 0;
    admitted = 0;
    skipped = 0;
    lastAdmission = -100;
    maxImpactError = 0;
    private cursor = 0;
    private previousPhrase = -1;
    reset(time: number, choice: EndlessTheme) {
        this.start = time; this.choice = choice; this.theme = choice === 'cycle' ? 'moonlit' : choice;
        this.pendingTheme = null; this.phase = this.cycle = this.phrase = this.cursor = this.admitted = this.skipped = this.maxImpactError = 0;
        this.lastAdmission = time - 100; this.previousPhrase = 0; this.generation++;
    }
    request(choice: EndlessTheme) { if (choice !== (this.pendingTheme ?? this.choice)) this.pendingTheme = choice; }
    update(time: number) {
        const elapsed = Math.max(0, time - this.start), phrase = Math.floor((elapsed + 1e-8) / PHRASE_SECONDS);
        const cycle = Math.floor((elapsed + 1e-8) / SCORE_SECONDS);
        // Use the same epsilon-resolved cycle for phase and cue reset. A floating
        // 89.999999999 boundary must not reset the next cycle's cursor at its end.
        this.phase = Math.max(0, elapsed - cycle * SCORE_SECONDS); this.phrase = phrase % 6;
        if (phrase !== this.previousPhrase) {
            if (this.pendingTheme !== null) {
                this.choice = this.pendingTheme; this.pendingTheme = null; this.generation++;
            }
            const theme = this.choice === 'cycle' ? SHOW_THEMES[cycle % 3] : this.choice;
            if (theme !== this.theme || cycle !== this.cycle) {
                this.theme = theme;
                // At a mid-score theme switch skip expired entries instead of replaying an opening.
                this.cursor = SHOW_SCORES[theme].findIndex(cue => cue.impact > this.phase);
                if (this.cursor < 0) this.cursor = SHOW_SCORES[theme].length;
                this.generation++;
            }
            this.previousPhrase = phrase;
        }
        this.cycle = cycle;
    }
    get cue(): ShowCue | undefined { return SHOW_SCORES[this.theme][this.cursor]; }
    get nextFeature(): ShowCue | undefined { return SHOW_SCORES[this.theme].find((cue, i) => i >= this.cursor && cue.featured); }
    get density() { return [.75, .9, 1, 1.1, 1.25, .85][this.phrase]; }
    get connector() { return CONNECTORS[this.theme][this.admitted % 4]; }
    complete(admitted: boolean, time: number) { this.cursor++; if (admitted) { this.admitted++; this.lastAdmission = time; } else this.skipped++; }
    placement(index: number) { return PLACEMENTS[index % 6]; }
    apex(index: number) { return APICES[index % 3]; }
    snapshot() { return { theme: this.theme, choice: this.choice, pendingTheme: this.pendingTheme, phase: this.phase, phrase: this.phrase, cycle: this.cycle,
        generation: this.generation, admitted: this.admitted, skipped: this.skipped, maxImpactError: this.maxImpactError, pendingCapacity: 8 }; }
}
