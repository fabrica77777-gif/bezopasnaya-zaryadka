'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Lock,
  Star,
  Trophy,
  Flame,
  ChevronRight,
  ChevronLeft,
  Home as HomeIcon,
  RotateCcw,
  Shield,
  CheckCircle2,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  ALL_QUESTIONS,
  getCurrentSeason,
  getQuestionsForSeasonAndLocation,
  SEASON_LABELS,
  LOCATION_LABELS,
  type Season,
  type Location,
  type QuizQuestion,
} from '@/lib/quiz-data';
import { EXERCISE_COMPLEXES, type Exercise } from '@/lib/exercises-data';

// ─── Types ───────────────────────────────────────────────────────────────────

type Screen = 'welcome' | 'gymnastics' | 'location-select' | 'quiz' | 'results' | 'parent-dashboard';

interface UserProgress {
  totalStars: number;
  exercisesCompleted: number;
  quizzesCompleted: number;
  correctAnswers: number;
  totalAnswers: number;
  streakDays: number;
  lastPlayDate: string;
  achievements: string[];
  quizHistory: { questionId: number; correct: boolean; date: string }[];
}

const AVATARS = ['🦊', '🐻', '🐰', '🦁', '🐼', '🐸'];

const DEFAULT_PROGRESS: UserProgress = {
  totalStars: 0,
  exercisesCompleted: 0,
  quizzesCompleted: 0,
  correctAnswers: 0,
  totalAnswers: 0,
  streakDays: 0,
  lastPlayDate: '',
  achievements: [],
  quizHistory: [],
};

function loadProgress(): UserProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  try {
    const data = localStorage.getItem('bz-progress');
    return data ? { ...DEFAULT_PROGRESS, ...JSON.parse(data) } : DEFAULT_PROGRESS;
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function saveProgress(p: UserProgress) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('bz-progress', JSON.stringify(p));
  } catch {
    // ignore
  }
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function updateStreak(progress: UserProgress): UserProgress {
  const today = todayStr();
  if (progress.lastPlayDate === today) return progress;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);
  const streak = progress.lastPlayDate === yStr ? progress.streakDays + 1 : 1;
  return { ...progress, streakDays: streak, lastPlayDate: today };
}

// ─── Confetti Component ──────────────────────────────────────────────────────

function Confetti() {
  const colors = ['#10B981', '#F59E0B', '#FBBF24', '#34D399', '#EF4444', '#8B5CF6', '#EC4899'];
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 3;
        const duration = 2 + Math.random() * 3;
        const size = 6 + Math.random() * 8;
        const color = colors[i % colors.length];
        return (
          <div
            key={i}
            className="confetti-piece absolute top-0"
            style={{
              left: `${left}%`,
              width: `${size}px`,
              height: `${size * 0.6}px`,
              backgroundColor: color,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Circular Timer Component ────────────────────────────────────────────────

function CircularTimer({ value, max, size = 120 }: { value: number; max: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = max > 0 ? value / max : 0;
  const dashOffset = circumference * (1 - progress);
  const isLow = value <= 5 && value > 0;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isLow ? '#EF4444' : '#10B981'}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <span
        className={`absolute text-3xl font-bold ${isLow ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Floating Stars Animation ────────────────────────────────────────────────

function FloatingStars({ count = 6 }: { count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="floating-star absolute text-2xl"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            animationDelay: `${i * 0.7}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
          }}
        >
          ✨
        </span>
      ))}
    </div>
  );
}

// ─── Welcome Screen ──────────────────────────────────────────────────────────

function WelcomeScreen({
  onStart,
  progress,
}: {
  onStart: (name: string, avatar: string, season: Season) => void;
  progress: UserProgress;
}) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🦊');
  const [season, setSeason] = useState<Season>(getCurrentSeason());

  const seasons: Season[] = ['spring', 'summer', 'autumn', 'winter'];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-amber-50 via-emerald-50 to-green-50 p-4">
      <FloatingStars count={8} />

      <div className="relative z-10 w-full max-w-md">
        {/* Title */}
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-emerald-700 sm:text-5xl">
            Безопасная
          </h1>
          <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-amber-500 sm:text-5xl">
            Зарядка
          </h1>
          <p className="text-lg text-emerald-600">Зарядка + безопасность = ты супергерой! 💪🛡️</p>
        </div>

        {/* Avatar Selection */}
        <Card className="mb-4 border-2 border-emerald-200 bg-white/90 shadow-lg backdrop-blur-sm">
          <CardContent className="p-5">
            <p className="mb-3 text-center text-lg font-semibold text-emerald-700">Выбери аватар</p>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAvatar(a)}
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl transition-all duration-200 ${
                    avatar === a
                      ? 'scale-110 bg-emerald-100 shadow-md ring-2 ring-emerald-500'
                      : 'bg-gray-50 hover:bg-emerald-50 hover:scale-105'
                  }`}
                  aria-label={`Аватар ${a}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Name Input */}
        <Card className="mb-4 border-2 border-amber-200 bg-white/90 shadow-lg backdrop-blur-sm">
          <CardContent className="p-5">
            <p className="mb-3 text-center text-lg font-semibold text-amber-600">Как тебя зовут?</p>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Твоё имя (необязательно)"
              className="h-12 rounded-xl border-2 border-amber-200 bg-amber-50/50 text-center text-lg focus:border-amber-400 focus:ring-amber-400"
            />
          </CardContent>
        </Card>

        {/* Season Selection */}
        <Card className="mb-6 border-2 border-green-200 bg-white/90 shadow-lg backdrop-blur-sm">
          <CardContent className="p-5">
            <p className="mb-3 text-center text-lg font-semibold text-green-700">Время года</p>
            <div className="grid grid-cols-2 gap-2">
              {seasons.map((s) => (
                <button
                  key={s}
                  onClick={() => setSeason(s)}
                  className={`rounded-xl p-3 text-base font-medium transition-all duration-200 ${
                    season === s
                      ? 'bg-emerald-500 text-white shadow-md scale-105'
                      : 'bg-gray-50 text-gray-700 hover:bg-emerald-50 hover:scale-102'
                  }`}
                >
                  {SEASON_LABELS[s]}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Start Button */}
        <Button
          onClick={() => onStart(name || 'Герой', avatar, season)}
          className="h-16 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-amber-500 text-xl font-bold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-emerald-600 hover:to-amber-600"
          size="lg"
        >
          Начать! 🚀
        </Button>

        {/* Returning user info */}
        {progress.totalStars > 0 && (
          <div className="mt-4 flex items-center justify-center gap-3 text-amber-600">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            <span className="text-sm font-medium">
              У тебя уже {progress.totalStars} ⭐ и {progress.streakDays} дней подряд!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Gymnastics Screen ───────────────────────────────────────────────────────

function GymnasticsScreen({
  season,
  avatar,
  name,
  onComplete,
  onBack,
}: {
  season: Season;
  avatar: string;
  name: string;
  onComplete: () => void;
  onBack: () => void;
}) {
  const complex = EXERCISE_COMPLEXES[season] || EXERCISE_COMPLEXES.general;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(complex.exercises[0].duration);
  const [isComplete, setIsComplete] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentExercise = complex.exercises[currentIndex];
  const totalExercises = complex.exercises.length;

  useEffect(() => {
    if (isComplete) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsComplete(true);
          setShowCheck(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isComplete]);

  const handleNext = useCallback(() => {
    if (currentIndex < totalExercises - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setTimeLeft(complex.exercises[nextIndex].duration);
      setIsComplete(false);
      setShowCheck(false);
    } else {
      setAllDone(true);
    }
  }, [currentIndex, totalExercises, complex.exercises]);

  if (allDone) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-50 via-green-50 to-amber-50 p-4">
        <Confetti />
        <div className="relative z-10 w-full max-w-md text-center">
          <div className="mb-4 text-7xl">🎉</div>
          <h2 className="mb-2 text-3xl font-extrabold text-emerald-700">Зарядка завершена!</h2>
          <p className="mb-2 text-lg text-emerald-600">
            {name}, ты молодец! Все {totalExercises} упражнений выполнены! 💪
          </p>
          <div className="mb-6 flex items-center justify-center gap-2">
            <span className="animate-bounce text-3xl">⭐</span>
            <span className="animate-bounce text-3xl" style={{ animationDelay: '0.1s' }}>⭐</span>
            <span className="animate-bounce text-3xl" style={{ animationDelay: '0.2s' }}>⭐</span>
          </div>
          <p className="mb-6 text-amber-600 font-semibold">+3 ⭐ за зарядку!</p>
          <Button
            onClick={onComplete}
            className="h-14 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-500 text-xl font-bold text-white shadow-lg hover:scale-105 hover:from-amber-600 hover:to-emerald-600 transition-all duration-200"
          >
            К викторине! 🧠
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-emerald-50 via-green-50 to-amber-50 p-4">
      {/* Header */}
      <div className="mb-4 flex w-full max-w-md items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 rounded-xl bg-white/80 px-3 py-2 text-sm text-gray-600 shadow-sm hover:bg-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Назад
        </button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{avatar}</span>
          <span className="text-sm font-medium text-emerald-700">{name}</span>
        </div>
      </div>

      {/* Title */}
      <h2 className="mb-4 text-2xl font-bold text-emerald-700">{complex.title}</h2>

      {/* Progress bar */}
      <div className="mb-6 w-full max-w-md">
        <div className="mb-1 flex justify-between text-sm text-emerald-600">
          <span>Упражнение {currentIndex + 1} из {totalExercises}</span>
          <span>{Math.round(((currentIndex + (isComplete ? 1 : 0)) / totalExercises) * 100)}%</span>
        </div>
        <Progress
          value={((currentIndex + (isComplete ? 1 : 0)) / totalExercises) * 100}
          className="h-3 rounded-full"
        />
        <div className="mt-2 flex justify-between">
          {complex.exercises.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-all ${
                i < currentIndex
                  ? 'bg-emerald-500'
                  : i === currentIndex
                  ? isComplete
                    ? 'bg-emerald-500'
                    : 'bg-amber-400 scale-125'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Exercise Card */}
      <Card className="mb-6 w-full max-w-md border-2 border-emerald-200 bg-white/95 shadow-xl">
        <CardContent className="flex flex-col items-center p-6">
          {/* Exercise Emoji */}
          <div className={`mb-4 text-7xl transition-all duration-300 ${!isComplete ? 'animate-bounce-slow' : ''}`}>
            {currentExercise.emoji}
          </div>

          {/* Exercise Name */}
          <h3 className="mb-2 text-2xl font-bold text-emerald-700">{currentExercise.name}</h3>
          <p className="mb-4 text-center text-gray-600">{currentExercise.description}</p>

          {/* Timer or Check */}
          {showCheck ? (
            <div className="flex flex-col items-center animate-pop-in">
              <CheckCircle2 className="mb-2 h-20 w-20 text-emerald-500" />
              <p className="text-xl font-bold text-emerald-600">Отлично! ✅</p>
            </div>
          ) : (
            <CircularTimer value={timeLeft} max={currentExercise.duration} />
          )}
        </CardContent>
      </Card>

      {/* Next button */}
      {isComplete && (
        <Button
          onClick={handleNext}
          className="h-14 w-full max-w-md rounded-2xl bg-gradient-to-r from-emerald-500 to-amber-500 text-lg font-bold text-white shadow-lg transition-all duration-200 hover:scale-105 animate-pop-in"
        >
          {currentIndex < totalExercises - 1 ? (
            <>Следующее упражнение <ChevronRight className="ml-1 h-5 w-5" /></>
          ) : (
            <>Завершить зарядку! 🎉</>
          )}
        </Button>
      )}
    </div>
  );
}

// ─── Location Select Screen ──────────────────────────────────────────────────

function LocationSelectScreen({
  season,
  avatar,
  name,
  onSelectLocation,
  onBack,
}: {
  season: Season;
  avatar: string;
  name: string;
  onSelectLocation: (location: Location) => void;
  onBack: () => void;
}) {
  const locations: Location[] = ['computer', 'phone', 'home', 'street', 'school', 'park', 'forest'];
  const seasonColors: Record<Season, string> = {
    spring: 'from-pink-50 via-green-50 to-emerald-50',
    summer: 'from-yellow-50 via-amber-50 to-emerald-50',
    autumn: 'from-orange-50 via-amber-50 to-yellow-50',
    winter: 'from-blue-50 via-cyan-50 to-emerald-50',
    general: 'from-amber-50 via-emerald-50 to-green-50',
  };

  return (
    <div className={`flex min-h-screen flex-col items-center bg-gradient-to-b ${seasonColors[season] || seasonColors.general} p-4`}>
      {/* Header */}
      <div className="mb-4 flex w-full max-w-md items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 rounded-xl bg-white/80 px-3 py-2 text-sm text-gray-600 shadow-sm hover:bg-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Назад
        </button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{avatar}</span>
          <span className="text-sm font-medium text-emerald-700">{name}</span>
        </div>
      </div>

      <h2 className="mb-2 text-2xl font-bold text-emerald-700">Выбери место 🗺️</h2>
      <p className="mb-6 text-center text-gray-600">
        Где ты хочешь проверить свою безопасность?
      </p>

      <div className="grid w-full max-w-md grid-cols-2 gap-3">
        {locations.map((loc) => {
          const info = LOCATION_LABELS[loc];
          const questionCount = getQuestionsForSeasonAndLocation(season, loc).length;
          return (
            <button
              key={loc}
              onClick={() => questionCount > 0 ? onSelectLocation(loc) : undefined}
              disabled={questionCount === 0}
              className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-4 transition-all duration-200 ${
                questionCount > 0
                  ? 'border-emerald-200 bg-white/90 shadow-md hover:scale-105 hover:border-emerald-400 hover:shadow-lg active:scale-98'
                  : 'border-gray-200 bg-gray-100/80 opacity-50 cursor-not-allowed'
              }`}
            >
              <span className="text-4xl">{info.emoji}</span>
              <span className="text-base font-semibold text-emerald-700">{info.label}</span>
              <span className="text-xs text-gray-500">{questionCount} вопросов</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Quiz Screen ─────────────────────────────────────────────────────────────

function QuizScreen({
  season,
  location,
  avatar,
  name,
  onQuizComplete,
  onBack,
}: {
  season: Season;
  location: Location;
  avatar: string;
  name: string;
  onQuizComplete: (score: number, total: number) => void;
  onBack: () => void;
}) {
  const questions = getQuestionsForSeasonAndLocation(season, location);
  const shuffled = useRef(questions.sort(() => Math.random() - 0.5).slice(0, 7)).current;
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [shakeWrong, setShakeWrong] = useState(false);

  const question = shuffled[currentQ];
  const totalQ = shuffled.length;

  const handleAnswer = useCallback(
    (index: number) => {
      if (showResult) return;
      if (timerRef.current) clearInterval(timerRef.current);
      setSelected(index);
      setShowResult(true);

      const isCorrect = index === question.correctIndex;
      if (isCorrect) {
        setScore((s) => s + 2);
      } else {
        setShakeWrong(true);
        try {
          if (navigator.vibrate) navigator.vibrate(200);
        } catch {
          // ignore
        }
        setTimeout(() => setShakeWrong(false), 600);
      }
    },
    [showResult, question]
  );

  useEffect(() => {
    if (showResult) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Time ran out — treat as wrong answer
          setShowResult(true);
          setSelected(-1);
          setShakeWrong(true);
          try {
            if (navigator.vibrate) navigator.vibrate(200);
          } catch {
            // ignore
          }
          setTimeout(() => setShakeWrong(false), 600);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQ, showResult]);

  const handleNext = useCallback(() => {
    if (currentQ < totalQ - 1) {
      setCurrentQ((q) => q + 1);
      setSelected(null);
      setShowResult(false);
      setTimeLeft(30);
    } else {
      onQuizComplete(score + (selected === question.correctIndex ? 0 : 0), totalQ);
    }
  }, [currentQ, totalQ, score, selected, question.correctIndex, onQuizComplete]);

  if (!question) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-amber-50 to-emerald-50 p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <p className="text-lg text-gray-600">Вопросов для этого места пока нет 🤔</p>
          <Button onClick={onBack} className="mt-4">Выбрать другое место</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-amber-50 via-green-50 to-emerald-50 p-4">
      {/* Header */}
      <div className="mb-3 flex w-full max-w-md items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 rounded-xl bg-white/80 px-3 py-2 text-sm text-gray-600 shadow-sm hover:bg-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Места
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">{avatar}</span>
          <span className="text-sm font-medium text-emerald-700">{name}</span>
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-amber-100 px-3 py-1.5 text-sm font-bold text-amber-700">
          <Star className="h-4 w-4 fill-amber-500 text-amber-500" /> {score}
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4 w-full max-w-md">
        <div className="mb-1 flex justify-between text-sm text-emerald-600">
          <span>Вопрос {currentQ + 1} из {totalQ}</span>
          <span>{LOCATION_LABELS[location].emoji} {LOCATION_LABELS[location].label}</span>
        </div>
        <Progress value={((currentQ + 1) / totalQ) * 100} className="h-2.5 rounded-full" />
      </div>

      {/* Timer */}
      <div className="mb-4">
        <CircularTimer value={timeLeft} max={30} size={80} />
      </div>

      {/* Question Card */}
      <Card className={`mb-4 w-full max-w-md border-2 bg-white/95 shadow-xl transition-all ${
        shakeWrong ? 'border-red-400 animate-shake' : 'border-amber-200'
      }`}>
        <CardContent className="p-5">
          <div className="flex items-start gap-2 mb-4">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            <p className="text-lg font-medium leading-relaxed text-gray-800">{question.question}</p>
          </div>

          <div className="space-y-2">
            {question.options.map((opt, i) => {
              let optionStyle = 'border-gray-200 bg-gray-50 hover:border-emerald-300 hover:bg-emerald-50';
              if (showResult) {
                if (i === question.correctIndex) {
                  optionStyle = 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-400';
                } else if (i === selected && i !== question.correctIndex) {
                  optionStyle = 'border-red-400 bg-red-50 ring-2 ring-red-400';
                } else {
                  optionStyle = 'border-gray-200 bg-gray-50 opacity-50';
                }
              } else if (selected === i) {
                optionStyle = 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-400';
              }

              return (
                <button
                  key={i}
                  onClick={() => !showResult && handleAnswer(i)}
                  disabled={showResult}
                  className={`flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition-all duration-200 ${optionStyle} ${
                    !showResult ? 'active:scale-98' : ''
                  }`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                    showResult && i === question.correctIndex
                      ? 'bg-emerald-500 text-white'
                      : showResult && i === selected && i !== question.correctIndex
                      ? 'bg-red-500 text-white'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {opt.label}
                  </span>
                  <span className="text-sm leading-snug text-gray-700 pt-1">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {/* Result feedback */}
          {showResult && (
            <div className={`mt-4 rounded-xl p-3 animate-pop-in ${
              selected === question.correctIndex
                ? 'bg-emerald-50 border border-emerald-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {selected === question.correctIndex ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span className="font-bold text-emerald-600">Правильно! +2 очка 🎉</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="font-bold text-red-600">Неправильно 😔</span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{question.explanation}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next button */}
      {showResult && (
        <Button
          onClick={handleNext}
          className="h-12 w-full max-w-md rounded-2xl bg-gradient-to-r from-emerald-500 to-amber-500 text-lg font-bold text-white shadow-lg hover:scale-105 transition-all duration-200 animate-pop-in"
        >
          {currentQ < totalQ - 1 ? (
            <>Следующий вопрос <ChevronRight className="ml-1 h-5 w-5" /></>
          ) : (
            <>Результаты 📊</>
          )}
        </Button>
      )}
    </div>
  );
}

// ─── Results Screen ──────────────────────────────────────────────────────────

function ResultsScreen({
  score,
  totalQuestions,
  avatar,
  name,
  progress,
  onPlayAgain,
  onGoHome,
}: {
  score: number;
  totalQuestions: number;
  avatar: string;
  name: string;
  progress: UserProgress;
  onPlayAgain: () => void;
  onGoHome: () => void;
}) {
  const percentage = totalQuestions > 0 ? Math.round((score / (totalQuestions * 2)) * 100) : 0;
  const isGreat = percentage >= 80;
  const isGood = percentage >= 50 && percentage < 80;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-amber-50 via-emerald-50 to-green-50 p-4">
      {isGreat && <Confetti />}

      <div className="relative z-10 w-full max-w-md text-center">
        <div className="mb-4 text-6xl">{avatar}</div>

        <h2 className="mb-2 text-3xl font-extrabold text-emerald-700">
          {isGreat ? 'Супер!' : isGood ? 'Хорошо!' : 'Не сдавайся!'} 🌟
        </h2>

        <p className="mb-4 text-lg text-gray-600">
          {name}, вот твои результаты:
        </p>

        <Card className="mb-6 border-2 border-emerald-200 bg-white/95 shadow-xl">
          <CardContent className="p-6">
            <div className="mb-4">
              <div className="text-5xl font-extrabold text-emerald-600">{score}</div>
              <div className="text-gray-500">очков из {totalQuestions * 2} возможных</div>
            </div>

            <div className="mb-4">
              <Progress value={percentage} className="h-4 rounded-full" />
              <p className="mt-1 text-sm text-gray-500">{percentage}% правильных ответов</p>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-amber-500">
                  <Star className="h-5 w-5 fill-amber-400" />
                  <span className="text-xl font-bold">{progress.totalStars}</span>
                </div>
                <p className="text-xs text-gray-500">Всего звёзд</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-orange-500">
                  <Flame className="h-5 w-5" />
                  <span className="text-xl font-bold">{progress.streakDays}</span>
                </div>
                <p className="text-xs text-gray-500">Дней подряд</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-emerald-500">
                  <Trophy className="h-5 w-5" />
                  <span className="text-xl font-bold">{progress.achievements.length}</span>
                </div>
                <p className="text-xs text-gray-500">Достижений</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-violet-500">
                  <Zap className="h-5 w-5" />
                  <span className="text-xl font-bold">{progress.exercisesCompleted}</span>
                </div>
                <p className="text-xs text-gray-500">Зарядок</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        {progress.achievements.length > 0 && (
          <div className="mb-6">
            <p className="mb-2 text-sm font-semibold text-emerald-600">Достижения:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {progress.achievements.map((a, i) => (
                <Badge key={i} className="bg-amber-100 text-amber-700 border border-amber-300">
                  {a}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={onPlayAgain}
            className="h-14 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-amber-500 text-lg font-bold text-white shadow-lg hover:scale-105 transition-all duration-200"
          >
            <RotateCcw className="mr-2 h-5 w-5" /> Играть снова
          </Button>
          <Button
            onClick={onGoHome}
            variant="outline"
            className="h-12 w-full rounded-2xl border-2 border-emerald-300 text-emerald-600 hover:bg-emerald-50"
          >
            <HomeIcon className="mr-2 h-5 w-5" /> На главную
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Parent Dashboard ────────────────────────────────────────────────────────

function ParentDashboard({
  progress,
  onClose,
}: {
  progress: UserProgress;
  onClose: () => void;
}) {
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);

  const handlePinSubmit = () => {
    if (pin === '1234') {
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setPin('');
    }
  };

  if (!unlocked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <Card className="w-full max-w-sm border-2 border-amber-200 bg-white shadow-2xl">
          <CardContent className="p-6">
            <div className="mb-4 text-center">
              <Lock className="mx-auto mb-2 h-10 w-10 text-amber-500" />
              <h3 className="text-xl font-bold text-gray-800">Родительский доступ</h3>
              <p className="text-sm text-gray-500">Введите PIN-код</p>
            </div>
            <div className="mb-4 flex gap-2">
              <Input
                type="password"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setError(false); }}
                onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
                placeholder="••••"
                maxLength={4}
                className={`h-14 text-center text-2xl tracking-widest ${error ? 'border-red-400 animate-shake' : 'border-amber-200'}`}
              />
            </div>
            {error && <p className="mb-2 text-center text-sm text-red-500">Неверный PIN-код</p>}
            <div className="flex gap-2">
              <Button onClick={onClose} variant="outline" className="flex-1">Отмена</Button>
              <Button onClick={handlePinSubmit} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white">Войти</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const accuracy = progress.totalAnswers > 0
    ? Math.round((progress.correctAnswers / progress.totalAnswers) * 100)
    : 0;

  // Analyze weak topics
  const wrongQuestions = progress.quizHistory.filter((h) => !h.correct);
  const weakLocations = new Map<string, number>();
  wrongQuestions.forEach((h) => {
    const q = ALL_QUESTIONS.find((q) => q.id === h.questionId);
    if (q) {
      const loc = LOCATION_LABELS[q.location].label;
      weakLocations.set(loc, (weakLocations.get(loc) || 0) + 1);
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <Card className="w-full max-w-md border-2 border-emerald-200 bg-white shadow-2xl">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-emerald-700">📊 Статистика</h3>
            <Button onClick={onClose} variant="ghost" size="sm">✕</Button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600">{progress.exercisesCompleted}</p>
                <p className="text-xs text-gray-600">Зарядок выполнено</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">{progress.totalStars}</p>
                <p className="text-xs text-gray-600">Звёзд заработано</p>
              </div>
              <div className="rounded-xl bg-green-50 p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{progress.quizzesCompleted}</p>
                <p className="text-xs text-gray-600">Викторин пройдено</p>
              </div>
              <div className="rounded-xl bg-orange-50 p-3 text-center">
                <p className="text-2xl font-bold text-orange-600">{accuracy}%</p>
                <p className="text-xs text-gray-600">Точность ответов</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">Правильных ответов</p>
              <Progress value={accuracy} className="h-3" />
              <p className="mt-1 text-xs text-gray-500">
                {progress.correctAnswers} из {progress.totalAnswers}
              </p>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">Серия дней</p>
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <span className="text-lg font-bold text-orange-600">{progress.streakDays} дней</span>
              </div>
            </div>

            {weakLocations.size > 0 && (
              <>
                <Separator />
                <div>
                  <p className="mb-2 text-sm font-semibold text-red-600">⚠️ Темы для повторения:</p>
                  <div className="space-y-1">
                    {Array.from(weakLocations.entries())
                      .sort((a, b) => b[1] - a[1])
                      .map(([loc, count]) => (
                        <div key={loc} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-1.5">
                          <span className="text-sm text-red-700">{loc}</span>
                          <span className="text-xs text-red-500">{count} ошибок</span>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}

            {progress.achievements.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="mb-2 text-sm font-semibold text-gray-700">🏅 Достижения:</p>
                  <div className="flex flex-wrap gap-2">
                    {progress.achievements.map((a, i) => (
                      <Badge key={i} className="bg-amber-100 text-amber-700 border border-amber-300">
                        {a}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <Button onClick={onClose} className="mt-4 w-full bg-emerald-500 hover:bg-emerald-600 text-white">
            Закрыть
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Achievement Logic ───────────────────────────────────────────────────────

function checkAchievements(progress: UserProgress): string[] {
  const newAchievements: string[] = [...progress.achievements];
  const has = (name: string) => newAchievements.includes(name);
  const add = (name: string) => { if (!has(name)) newAchievements.push(name); };

  if (progress.exercisesCompleted >= 1) add('🏃 Первая зарядка');
  if (progress.exercisesCompleted >= 5) add('💪 5 зарядок');
  if (progress.exercisesCompleted >= 10) add('🏅 10 зарядок');
  if (progress.correctAnswers >= 1) add('🧠 Первый правильный ответ');
  if (progress.correctAnswers >= 10) add('🎯 10 правильных ответов');
  if (progress.correctAnswers >= 25) add('🏆 25 правильных ответов');
  if (progress.totalStars >= 10) add('⭐ 10 звёзд');
  if (progress.totalStars >= 50) add('🌟 50 звёзд');
  if (progress.totalStars >= 100) add('💫 100 звёзд');
  if (progress.streakDays >= 3) add('🔥 3 дня подряд');
  if (progress.streakDays >= 7) add('🔥 7 дней подряд');
  if (progress.quizzesCompleted >= 3) add('📚 3 викторины');

  return newAchievements;
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function Home() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [name, setName] = useState('Герой');
  const [avatar, setAvatar] = useState('🦊');
  const [season, setSeason] = useState<Season>(getCurrentSeason());
  const [location, setLocation] = useState<Location>('home');
  const [progress, setProgress] = useState<UserProgress>(() => {
    if (typeof window === 'undefined') return DEFAULT_PROGRESS;
    try {
      const data = localStorage.getItem('bz-progress');
      return data ? { ...DEFAULT_PROGRESS, ...JSON.parse(data) } : DEFAULT_PROGRESS;
    } catch {
      return DEFAULT_PROGRESS;
    }
  });
  const [quizScore, setQuizScore] = useState(0);
  const [quizTotal, setQuizTotal] = useState(0);
  const [showParent, setShowParent] = useState(false);
  const [gymnasticsDone, setGymnasticsDone] = useState(false);

  const updateProgress = useCallback((updater: (p: UserProgress) => UserProgress) => {
    setProgress((prev) => {
      const updated = updater(prev);
      const withAchievements = { ...updated, achievements: checkAchievements(updated) };
      saveProgress(withAchievements);
      return withAchievements;
    });
  }, []);

  const handleStart = useCallback((n: string, a: string, s: Season) => {
    setName(n);
    setAvatar(a);
    setSeason(s);
    setScreen('gymnastics');
  }, []);

  const handleGymnasticsComplete = useCallback(() => {
    setGymnasticsDone(true);
    updateProgress((p) => {
      const withStreak = updateStreak(p);
      return {
        ...withStreak,
        exercisesCompleted: withStreak.exercisesCompleted + 1,
        totalStars: withStreak.totalStars + 3,
      };
    });
    setScreen('location-select');
  }, [updateProgress]);

  const handleLocationSelect = useCallback((loc: Location) => {
    setLocation(loc);
    setScreen('quiz');
  }, []);

  const handleQuizComplete = useCallback((score: number, total: number) => {
    setQuizScore(score);
    setQuizTotal(total);
    updateProgress((p) => {
      const withStreak = updateStreak(p);
      return {
        ...withStreak,
        quizzesCompleted: withStreak.quizzesCompleted + 1,
        correctAnswers: withStreak.correctAnswers + Math.floor(score / 2),
        totalAnswers: withStreak.totalAnswers + total,
        totalStars: withStreak.totalStars + score,
      };
    });
    setScreen('results');
  }, [updateProgress]);

  const handlePlayAgain = useCallback(() => {
    setScreen('location-select');
  }, []);

  const handleGoHome = useCallback(() => {
    setScreen('welcome');
    setGymnasticsDone(false);
  }, []);

  const handleBackToGymnastics = useCallback(() => {
    if (gymnasticsDone) {
      setScreen('location-select');
    } else {
      setScreen('gymnastics');
    }
  }, [gymnasticsDone]);

  return (
    <div className="relative">
      {/* Parent Dashboard Lock Icon */}
      {screen !== 'welcome' && (
        <button
          onClick={() => setShowParent(true)}
          className="fixed bottom-4 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:shadow-lg"
          aria-label="Родительский доступ"
        >
          <Lock className="h-4 w-4 text-gray-400" />
        </button>
      )}

      {screen === 'welcome' && (
        <WelcomeScreen onStart={handleStart} progress={progress} />
      )}

      {screen === 'gymnastics' && (
        <GymnasticsScreen
          season={season}
          avatar={avatar}
          name={name}
          onComplete={handleGymnasticsComplete}
          onBack={handleGoHome}
        />
      )}

      {screen === 'location-select' && (
        <LocationSelectScreen
          season={season}
          avatar={avatar}
          name={name}
          onSelectLocation={handleLocationSelect}
          onBack={handleBackToGymnastics}
        />
      )}

      {screen === 'quiz' && (
        <QuizScreen
          season={season}
          location={location}
          avatar={avatar}
          name={name}
          onQuizComplete={handleQuizComplete}
          onBack={() => setScreen('location-select')}
        />
      )}

      {screen === 'results' && (
        <ResultsScreen
          score={quizScore}
          totalQuestions={quizTotal}
          avatar={avatar}
          name={name}
          progress={progress}
          onPlayAgain={handlePlayAgain}
          onGoHome={handleGoHome}
        />
      )}

      {showParent && (
        <ParentDashboard progress={progress} onClose={() => setShowParent(false)} />
      )}
    </div>
  );
}
