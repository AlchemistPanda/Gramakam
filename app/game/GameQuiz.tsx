'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Gift } from 'lucide-react';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const quizQuestions: QuizQuestion[] = [
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

interface GameQuizProps {
  onCorrect: () => void;
  onIncorrect: () => void;
  isOpen: boolean;
}

export default function GameQuiz({ onCorrect, onIncorrect, isOpen }: GameQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  if (!isOpen) return null;

  const question = quizQuestions[currentQuestion];

  const handleAnswer = (optionIndex: number) => {
    if (answered) return;
    setSelectedAnswer(optionIndex);
    const correct = optionIndex === question.correctAnswer;
    setIsCorrect(correct);
    setAnswered(true);
  };

  const handleContinue = () => {
    if (isCorrect) {
      onCorrect();
    } else {
      onIncorrect();
    }
    // Reset for next time
    setSelectedAnswer(null);
    setAnswered(false);
    setCurrentQuestion((prev) => (prev + 1) % quizQuestions.length);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-charcoal border-2 border-amber-400/40 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Gift size={20} className="text-white" />
            <h2 className="text-white font-bold text-lg">Bonus Question</h2>
          </div>
          <p className="text-white/80 text-sm">Answer correctly to earn an extra life!</p>
        </div>

        {/* Question */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-white font-semibold text-lg leading-relaxed mb-1">{question.question}</h3>
            <p className="text-white/40 text-xs">Question {currentQuestion + 1} of {quizQuestions.length}</p>
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
                    ? isCorrect
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
                    isCorrect ? (
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

          {/* Explanation */}
          {answered && (
            <div className={`mb-6 p-3 rounded-lg ${isCorrect ? 'bg-green-500/10 border border-green-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
              <p className={`text-sm ${isCorrect ? 'text-green-300' : 'text-amber-300'}`}>
                {question.explanation}
              </p>
            </div>
          )}

          {/* CTA Button */}
          {answered && (
            <button
              onClick={handleContinue}
              className={`w-full font-bold py-3 rounded-lg transition-all ${
                isCorrect
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              {isCorrect ? '🎉 Continue Playing' : 'Try Next Question'}
            </button>
          )}

          {!answered && (
            <p className="text-white/40 text-xs text-center">
              Select an option to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
