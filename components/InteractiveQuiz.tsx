"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
}

interface InteractiveQuizProps {
  description?: string;
  questions: QuizQuestion[];
}

export default function InteractiveQuiz({ description, questions }: InteractiveQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(new Array(questions.length).fill(-1));
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setShowResults(true);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers(new Array(questions.length).fill(-1));
    setShowResults(false);
  };

  const calculateScore = () => {
    return selectedAnswers.reduce((score, answer, index) => {
      return answer === questions[index].answer ? score + 1 : score;
    }, 0);
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (showResults) {
    const score = calculateScore();
    const totalQuestions = questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Quiz Results</CardTitle>
          <CardDescription>Here&apos;s how you did on the quiz!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Display */}
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(score, totalQuestions)}`}>
              {score}/{totalQuestions}
            </div>
            <div className="text-lg text-gray-600 mt-2">
              {percentage}% Correct
            </div>
            <div className="mt-4">
              {percentage >= 80 && (
                <div className="text-green-600 font-semibold">🎉 Excellent work!</div>
              )}
              {percentage >= 60 && percentage < 80 && (
                <div className="text-yellow-600 font-semibold">👍 Good job!</div>
              )}
              {percentage < 60 && (
                <div className="text-red-600 font-semibold">💪 Keep practicing!</div>
              )}
            </div>
          </div>

          {/* Question Review */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Question Review</h3>
            {questions.map((question, index) => {
              const userAnswer = selectedAnswers[index];
              const isCorrect = userAnswer === question.answer;
              
              return (
                <Card key={index} className={`${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">Question {index + 1}</h4>
                      <span className={`text-sm font-semibold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3">{question.question}</p>
                    
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => {
                        const isUserAnswer = optionIndex === userAnswer;
                        const isCorrectAnswer = optionIndex === question.answer;
                        
                        return (
                          <div
                            key={optionIndex}
                            className={`p-2 rounded ${
                              isCorrectAnswer
                                ? 'bg-green-100 border border-green-300'
                                : isUserAnswer && !isCorrect
                                ? 'bg-red-100 border border-red-300'
                                : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center">
                              <span className="w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2 bg-gray-200 text-gray-700">
                                {String.fromCharCode(65 + optionIndex)}
                              </span>
                              {option}
                              {isCorrectAnswer && (
                                <span className="ml-auto text-green-600 font-semibold">Correct Answer</span>
                              )}
                              {isUserAnswer && !isCorrect && (
                                <span className="ml-auto text-red-600 font-semibold">Your Answer</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {question.explanation && (
                      <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                        <strong className="text-blue-800">Explanation:</strong>
                        <p className="text-blue-700 mt-1">{question.explanation}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Restart Button */}
          <div className="flex justify-center">
            <Button onClick={handleRestart} variant="outline">
              Take Quiz Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Interactive Quiz</CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
        <div className="text-sm text-gray-600">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Question */}
        <div>
          <h3 className="font-medium text-lg mb-4">{currentQuestion.question}</h3>
          
          <RadioGroup
            value={selectedAnswers[currentQuestionIndex] >= 0 ? selectedAnswers[currentQuestionIndex].toString() : ""}
            onValueChange={(value) => handleAnswerSelect(parseInt(value))}
            className="space-y-3"
          >
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2 bg-gray-200 text-gray-700">
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            onClick={handlePrevious}
            disabled={isFirstQuestion}
            variant="outline"
          >
            Previous
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={selectedAnswers[currentQuestionIndex] === -1}
          >
            {isLastQuestion ? 'Finish Quiz' : 'Next'}
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
