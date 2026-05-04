import type { Season } from './quiz-data';

export interface Exercise {
  id: number;
  name: string;
  emoji: string;
  duration: number; // seconds
  description: string;
}

export interface ExerciseComplex {
  season: Season;
  title: string;
  emoji: string;
  exercises: Exercise[];
}

const BASE_EXERCISES: Exercise[] = [
  { id: 1, name: 'Потягивания', emoji: '🙆‍♂️', duration: 20, description: 'Потяни руки вверх, хорошо потянись!' },
  { id: 2, name: 'Вращения головой', emoji: '🔄', duration: 15, description: 'Плавно вращай головой по кругу' },
  { id: 3, name: 'Махи руками', emoji: '💪', duration: 20, description: 'Махи руками вперёд и назад' },
  { id: 4, name: 'Приседания', emoji: '🦵', duration: 25, description: 'Приседай аккуратно, спина прямая' },
  { id: 5, name: 'Наклоны', emoji: '🦶', duration: 20, description: 'Наклоны влево и вправо' },
  { id: 6, name: 'Прыжки', emoji: '⭐', duration: 20, description: 'Прыгай на месте, высоко и весело!' },
];

const WINTER_WARMUP: Exercise[] = [
  { id: 1, name: 'Разогрев кистей', emoji: '🤲', duration: 15, description: 'Потри ладони друг о друга, пока не станут горячими!' },
  { id: 2, name: 'Потягивания', emoji: '🙆‍♂️', duration: 20, description: 'Потяни руки вверх, хорошо потянись!' },
  { id: 3, name: 'Вращения плечами', emoji: '🔄', duration: 15, description: 'Вращай плечами вперёд и назад' },
  { id: 4, name: 'Приседания', emoji: '🦵', duration: 25, description: 'Приседай аккуратно, спина прямая' },
  { id: 5, name: 'Наклоны', emoji: '🦶', duration: 20, description: 'Наклоны влево и вправо, тянемся к полу' },
  { id: 6, name: 'Прыжки с хлопком', emoji: '⭐', duration: 20, description: 'Прыгай и хлопай над головой!' },
];

const SUMMER_STRETCH: Exercise[] = [
  { id: 1, name: 'Потягивания', emoji: '🙆‍♂️', duration: 20, description: 'Мягко потяни руки вверх, растягивайся!' },
  { id: 2, name: 'Вращения головой', emoji: '🔄', duration: 15, description: 'Плавно вращай головой по кругу' },
  { id: 3, name: 'Махи руками', emoji: '💪', duration: 20, description: 'Широкие махи руками, как птица!' },
  { id: 4, name: 'Выпады', emoji: '🦵', duration: 25, description: 'Шагни вперёд и опустись вниз' },
  { id: 5, name: 'Наклоны к полу', emoji: '🦶', duration: 20, description: 'Тянемся руками к полу, не сгибая колени' },
  { id: 6, name: 'Прыжки', emoji: '⭐', duration: 20, description: 'Лёгкие прыжки на носочках!' },
];

const SPRING_ENERGY: Exercise[] = [
  { id: 1, name: 'Потягивания', emoji: '🙆‍♂️', duration: 20, description: 'Потяни руки высоко-высоко!' },
  { id: 2, name: 'Вращения головой', emoji: '🔄', duration: 15, description: 'Плавно вращай головой, разогревай шею' },
  { id: 3, name: 'Махи руками', emoji: '💪', duration: 20, description: 'Энергичные махи руками вперёд и назад!' },
  { id: 4, name: 'Приседания', emoji: '🦵', duration: 25, description: 'Глубокие приседания, спина прямая' },
  { id: 5, name: 'Наклоны в стороны', emoji: '🦶', duration: 20, description: 'Тянемся рукой вдоль ноги в каждую сторону' },
  { id: 6, name: 'Прыжки на месте', emoji: '⭐', duration: 20, description: 'Весёлые прыжки, как на скакалке!' },
];

const AUTUMN_BALANCE: Exercise[] = [
  { id: 1, name: 'Потягивания', emoji: '🙆‍♂️', duration: 20, description: 'Потяни руки вверх и в стороны' },
  { id: 2, name: 'Вращения головой', emoji: '🔄', duration: 15, description: 'Медленные вращения головой по кругу' },
  { id: 3, name: 'Махи руками', emoji: '💪', duration: 20, description: 'Круговые махи руками, как мельница!' },
  { id: 4, name: 'Приседания', emoji: '🦵', duration: 25, description: 'Приседай плавно, не торопись' },
  { id: 5, name: 'Наклоны', emoji: '🦶', duration: 20, description: 'Наклоны вперёд, тянемся к пальцам ног' },
  { id: 6, name: 'Прыжки', emoji: '⭐', duration: 20, description: 'Прыгай мягко, как осенний лист!' },
];

export const EXERCISE_COMPLEXES: Record<Season, ExerciseComplex> = {
  spring: {
    season: 'spring',
    title: 'Весенняя зарядка энергии 🌸',
    emoji: '🌸',
    exercises: SPRING_ENERGY,
  },
  summer: {
    season: 'summer',
    title: 'Летняя зарядка-растяжка ☀️',
    emoji: '☀️',
    exercises: SUMMER_STRETCH,
  },
  autumn: {
    season: 'autumn',
    title: 'Осенняя зарядка баланса 🍂',
    emoji: '🍂',
    exercises: AUTUMN_BALANCE,
  },
  winter: {
    season: 'winter',
    title: 'Зимняя зарядка-разогрев ❄️',
    emoji: '❄️',
    exercises: WINTER_WARMUP,
  },
  general: {
    season: 'general',
    title: 'Утренняя зарядка 🌟',
    emoji: '🌟',
    exercises: BASE_EXERCISES,
  },
};
