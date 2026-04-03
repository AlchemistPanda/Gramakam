'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Gift, Clock } from 'lucide-react';
import { soundManager } from '@/lib/sounds';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const allQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'In which year did Gramakam start?',
    options: ['2014', '2015', '2016', '2017'],
    correctAnswer: 2,
    explanation: 'Gramakam was first held in 2016, marking the beginning of this annual celebration of theatre and culture.',
  },
  {
    id: 'q2',
    question: 'What is the edition of Gramakam happening in 2026?',
    options: ['7th Edition', '8th Edition', '9th Edition', '10th Edition'],
    correctAnswer: 2,
    explanation: 'Gramakam 2026 is the 9th edition of the festival, celebrating its grand return after several years.',
  },
  {
    id: 'q3',
    question: 'What are the dates of Gramakam 2026?',
    options: ['April 15–18', 'April 18–22', 'April 20–23', 'April 25–28'],
    correctAnswer: 1,
    explanation: 'Gramakam 2026 will be held from April 18 to April 22 in Velur, Thrissur, Kerala.',
  },
  {
    id: 'q4',
    question: 'Where is Gramakam 2026 taking place?',
    options: ['Kochi, Kerala', 'Velur, Thrissur, Kerala', 'Thiruvananthapuram, Kerala', 'Kozhikode, Kerala'],
    correctAnswer: 1,
    explanation: 'Gramakam 2026 is being held in Velur, a historic cultural town in Thrissur district.',
  },
  {
    id: 'q5',
    question: 'Who organizes Gramakam?',
    options: ['Kerala Government', 'IF Creations', 'Thrissur Tourism Board', 'Kerala Arts Academy'],
    correctAnswer: 1,
    explanation: 'Gramakam is organized by IF Creations, dedicated to promoting theatre and cultural arts.',
  },
];

function getRandomQuestions(count: number): QuizQuestion[] {
  const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

interface GameQuizProps {
  isOpen: boolean;
  lifeNumber: number; // 1, 2, or 3
  onCorrect: () => void;
  onIncorrect: () => void;
}

export default function GameQuiz({ isOpen, lifeNumber, onCorrect, onIncorrect }: GameQuizProps) {
  const questionsToAsk = lifeNumber; // 1 question for life 1, 2 for life 2, 3 for life 3
  const timePerQuestion = lifeNumber === 1 ? 10 : lifeNumber === 2 ? 8 : 5;

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const [allCorrect, setAllCorrect] = useState(true);

  // Initialize questions
  useEffect(() => {
    if (isOpen) {
      const randomQuestions = getRandomQuestions(questionsToAsk);
      setQuestions(randomQuestions);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setAnswered(false);
      setTimeLeft(timePerQuestion);
      setAllCorrect(true);
    }
  }, [isOpen, questionsToAsk, timePerQuestion]);

  // Timer countdown
  useEffect(() => {
    if (!isOpen || answered || questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up - treat as incorrect
          handleAnswer(-1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, answered, questions]);

  if (!isOpen || questions.length === 0) return null;

  const question = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleAnswer = (optionIndex: number) => {
    if (answered) return;

    setSelectedAnswer(optionIndex);
    const correct = optionIndex === question.correctAnswer;

    if (!correct) {
      setAllCorrect(false);
      soundManager.playQuizIncorrect();
    } else {
      soundManager.playQuizCorrect();
    }

    setAnswered(true);
  };

  const handleContinue = () => {
    if (isLastQuestion || !allCorrect) {
      // Quiz ended - either last question or got one wrong
      if (allCorrect) {
        onCorrect();
      } else {
        onIncorrect();
      }
    } else {
      // Move to next question
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setAnswered(false);
      setTimeLeft(timePerQuestion);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-charcoal border-2 border-amber-400/40 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Gift size={20} className="text-white" />
              <h2 className="text-white font-bold text-lg">Save Your Life!</h2>
            </div>
            <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
              <Clock size={16} className="text-white" />
              <span className="text-white font-bold text-sm">{timeLeft}s</span>
            </div>
          </div>
          <p className="text-white/80 text-sm">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-white font-semibold text-lg leading-relaxed mb-4">{question.question}</h3>
            <div className="w-full bg-amber-500/20 rounded-lg h-1.5">
              <div
                className="bg-amber-400 h-1.5 rounded-lg transition-all duration-300"
                style={{ width: `${(timeLeft / timePerQuestion) * 100}%` }}
              />
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={answered}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${
                  selectedAnswer === index
                    ? index === question.correctAnswer
                      ? 'bg-green-500/20 border-2 border-green-500 text-green-300'
                      : 'bg-red-500/20 border-2 border-red-500 text-red-300'
                    : answered && index === question.correctAnswer
                      ? 'bg-green-500/20 border-2 border-green-500 text-green-300'
                      : answered
                        ? 'bg-white/5 border-2 border-white/10 text-white/40 cursor-not-allowed'
                        : 'bg-white/10 border-2 border-white/20 text-white hover:bg-white/20 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-sm font-bold">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span>{option}</span>
                  {answered && selectedAnswer === index && (
                    index === question.correctAnswer ? (
                      <CheckCircle size={18} className="ml-auto text-green-400" />
                    ) : (
                      <XCircle size={18} className="ml-auto text-red-400" />
                    )
                  )}
                  {answered && index === question.correctAnswer && selectedAnswer !== index && (
                    <CheckCircle size={18} className="ml-auto text-green-400" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Explanation & CTA */}
          {answered && (
            <>
              <div className={`mb-6 p-3 rounded-lg ${selectedAnswer === question.correctAnswer ? 'bg-green-500/10 border border-green-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
                <p className={`text-sm ${selectedAnswer === question.correctAnswer ? 'text-green-300' : 'text-amber-300'}`}>
                  {question.explanation}
                </p>
              </div>

              <button
                onClick={handleContinue}
                className={`w-full font-bold py-3 rounded-lg transition-all ${
                  selectedAnswer === question.correctAnswer
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                }`}
              >
                {isLastQuestion || !allCorrect
                  ? (selectedAnswer === question.correctAnswer ? '🎉 Continue Playing' : 'Back to Game')
                  : '→ Next Question'}
              </button>
            </>
          )}

          {!answered && (
            <p className="text-white/40 text-xs text-center">Select an option to continue</p>
          )}
        </div>
      </div>
    </div>
  );
}
