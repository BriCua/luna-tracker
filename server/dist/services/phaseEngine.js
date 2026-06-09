import { differenceInDays, addDays, format } from 'date-fns';
export const PHASES = {
    menstruation: {
        key: 'menstruation',
        name: 'Menstruation',
        color: '#e57373',
        dayRange: [1, 5],
        tips: {
            diet: 'Iron-rich foods (spinach, lentils, red meat). Stay hydrated. Reduce caffeine.',
            activity: 'Light walks, gentle yoga. Rest is completely valid.',
            howToTreat: 'Be extra patient. Ask what she needs — sometimes space, sometimes comfort. No pressure.',
            howToTalk: 'Keep it calm and low-effort. Avoid debates or big decisions. Just be present.',
        },
    },
    follicular: {
        key: 'follicular',
        name: 'Follicular',
        color: '#81c784',
        dayRange: [6, 13],
        tips: {
            diet: 'Light, fresh foods. Eggs, fermented foods, broccoli. Great time for new recipes.',
            activity: 'Energy is rising — cardio, strength training, trying new workouts.',
            howToTreat: 'She\'s sociable and optimistic. Great time for dates and new experiences.',
            howToTalk: 'She\'s open and communicative. Good time for important conversations.',
        },
    },
    ovulation: {
        key: 'ovulation',
        name: 'Ovulation',
        color: '#ffb74d',
        dayRange: [14, 16],
        tips: {
            diet: 'Anti-inflammatory foods — leafy greens, berries, zinc-rich foods.',
            activity: 'Peak energy. High-intensity workouts, group activities.',
            howToTreat: 'She\'s at her most confident and social. Plan something special.',
            howToTalk: 'Best time for deep conversations. She\'s articulate and empathetic right now.',
        },
    },
    luteal: {
        key: 'luteal',
        name: 'Luteal',
        color: '#9575cd',
        dayRange: [17, 28],
        tips: {
            diet: 'Magnesium-rich foods (dark chocolate, nuts, seeds). Complex carbs help mood. Reduce salt.',
            activity: 'Moderate — pilates, swimming, walks. Avoid overexertion.',
            howToTreat: 'She may need more reassurance. Check in often. Small gestures matter a lot.',
            howToTalk: 'She may be more sensitive. Choose words carefully, be extra affirming.',
        },
    },
};
export function getCurrentPhase(lastPeriodDate, cycleLength = 28) {
    const today = new Date();
    const start = new Date(lastPeriodDate);
    const rawDay = differenceInDays(today, start);
    const isLate = rawDay >= cycleLength;
    const daysLate = isLate ? rawDay - cycleLength + 1 : 0;
    // if late, freeze at last day of cycle instead of rolling over
    const dayOfCycle = isLate ? cycleLength : (rawDay % cycleLength) + 1;
    const entries = Object.entries(PHASES);
    for (const [key, phase] of entries) {
        const [min, max] = phase.dayRange;
        const effectiveMax = key === 'luteal' ? cycleLength : max;
        if (dayOfCycle >= min && dayOfCycle <= effectiveMax) {
            return { ...phase, dayOfCycle, cycleLength, isLate, daysLate };
        }
    }
    // fallback — should never reach here with correct inputs
    return { ...PHASES.luteal, dayOfCycle, cycleLength, isLate, daysLate };
}
export function getNextPeriodDate(lastPeriodDate, cycleLength = 28) {
    const today = new Date();
    const start = new Date(lastPeriodDate);
    const rawDay = differenceInDays(today, start);
    // if already late, daysUntil is 0 — period was expected already
    const daysUntil = Math.max(0, cycleLength - rawDay);
    return {
        date: format(addDays(start, cycleLength), 'yyyy-MM-dd'),
        daysUntil,
    };
}
