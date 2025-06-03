import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './quiz.css';

const QuizApp = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [loading, setLoading] = useState(false);

  const difficulties = [
    { id: 'easy', name: 'Easy' },
    { id: 'medium', name: 'Medium' },
    { id: 'hard', name: 'Hard' }
  ];

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('https://opentdb.com/api_category.php');
        const data = await response.json();
        setCategories(data.trivia_categories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Start quiz with selected category and difficulty
  const startQuiz = async (categoryId, difficulty) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://opentdb.com/api.php?amount=10&category=${categoryId}&difficulty=${difficulty}&type=multiple`
      );
      const data = await response.json();
      
      // Process questions to decode HTML entities
      const processedQuestions = data.results.map(question => ({
        ...question,
        question: decodeHTMLEntities(question.question),
        correct_answer: decodeHTMLEntities(question.correct_answer),
        incorrect_answers: question.incorrect_answers.map(ans => decodeHTMLEntities(ans))
      }));
      
      setQuestions(processedQuestions);
      setSelectedCategory(
        categories.find(cat => cat.id === categoryId)?.name || 'General Knowledge'
      );
      setSelectedDifficulty(difficulty);
      setQuizStarted(true);
      setCurrentQuestionIndex(0);
      setScore(0);
      setQuizCompleted(false);
    } catch (error) {
      console.error('Error fetching questions:', error);
      // If no questions found for selected difficulty, try without difficulty filter
      if (difficulty !== 'any') {
        alert(`No questions found for ${difficulty} difficulty. Trying with any difficulty...`);
        startQuiz(categoryId, 'any');
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to decode HTML entities
  const decodeHTMLEntities = (text) => {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
  };

  // Handle answer selection
  const handleAnswerSelect = (answer) => {
    if (selectedAnswer !== null) return; // Prevent multiple selections
    
    setSelectedAnswer(answer);
    const correct = answer === questions[currentQuestionIndex].correct_answer;
    setIsCorrect(correct);
    
    if (correct) {
      setScore(prevScore => prevScore + 1);
    }

    // Move to next question after a delay
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      } else {
        setQuizCompleted(true);
      }
    }, 1500);
  };

  // Reset quiz
  const resetQuiz = () => {
    setQuizStarted(false);
    setQuizCompleted(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setSelectedDifficulty(null);
  };

  // Shuffle array function
  const shuffleArray = (array) => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  // Get current question with shuffled answers
  const getCurrentQuestion = () => {
    if (!questions.length || currentQuestionIndex >= questions.length) return null;
    
    const question = questions[currentQuestionIndex];
    const allAnswers = shuffleArray([
      ...question.incorrect_answers, 
      question.correct_answer
    ]);
    
    return {
      ...question,
      allAnswers
    };
  };

  const currentQuestion = getCurrentQuestion();

  return (
    <div className="quiz-app">
      <AnimatePresence mode="wait">
        {!quizStarted && !quizCompleted && (
          <motion.div
            key="category-selection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="category-selection"
          >
            <h1>Quiz Categories</h1>
            <p>Select a category and difficulty to start the quiz</p>
            
            <div className="difficulty-selector">
              <h3>Select Difficulty:</h3>
              <div className="difficulty-buttons">
                {difficulties.map(difficulty => (
                  <motion.button
                    key={difficulty.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`difficulty-button ${selectedDifficulty === difficulty.id ? 'active' : ''}`}
                    onClick={() => setSelectedDifficulty(difficulty.id)}
                  >
                    {difficulty.name}
                  </motion.button>
                ))}
              </div>
            </div>
            
            <div className="categories-grid">
              {categories.map(category => (
                <motion.div
                  key={category.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`category-card ${selectedCategory === category.id ? 'selected' : ''}`}
                  onClick={() => selectedDifficulty && startQuiz(category.id, selectedDifficulty)}
                >
                  {category.name}
                  {selectedDifficulty && (
                    <span className="difficulty-badge">{selectedDifficulty}</span>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="loading-screen"
          >
            <div className="spinner"></div>
            <p>Loading questions...</p>
          </motion.div>
        )}

        {quizStarted && !quizCompleted && currentQuestion && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="quiz-container"
          >
            <div className="quiz-header">
              <div>
                <h2>{selectedCategory}</h2>
                <span className="difficulty-tag">{selectedDifficulty}</span>
              </div>
              <div className="score-tracker">
                Question {currentQuestionIndex + 1} of {questions.length}
                <span>Score: {score}</span>
              </div>
            </div>

            <div className="progress-container">
              <div 
                className="progress-bar" 
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>

            <motion.div
              key={`question-${currentQuestionIndex}`}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="question-card"
            >
              <h3 className="question-text">{currentQuestion.question}</h3>
              
              <div className="answers-grid">
                {currentQuestion.allAnswers.map((answer, index) => {
                  let answerClass = '';
                  if (selectedAnswer !== null) {
                    if (answer === currentQuestion.correct_answer) {
                      answerClass = 'correct';
                    } else if (answer === selectedAnswer && answer !== currentQuestion.correct_answer) {
                      answerClass = 'incorrect';
                    }
                  }
                  
                  return (
                    <motion.button
                      key={index}
                      whileHover={{ scale: selectedAnswer === null ? 1.03 : 1 }}
                      whileTap={{ scale: selectedAnswer === null ? 0.97 : 1 }}
                      className={`answer-button ${answerClass}`}
                      onClick={() => handleAnswerSelect(answer)}
                      disabled={selectedAnswer !== null}
                    >
                      {answer}
                      {answerClass === 'correct' && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="feedback-icon"
                        >
                          ✓
                        </motion.span>
                      )}
                      {answerClass === 'incorrect' && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="feedback-icon"
                        >
                          ✗
                        </motion.span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}

        {quizCompleted && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="results-container"
          >
            <h1>Quiz Completed!</h1>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="score-circle"
              style={{
                background: `conic-gradient(#4CAF50 ${(score / questions.length) * 100}%, #f44336 0)`
              }}
            >
              <div className="score-text">
                {score}/{questions.length}
              </div>
            </motion.div>
            <p className="score-message">
              You scored {score} out of {questions.length} correct answers!
            </p>
            <div className="quiz-details">
              <p>Category: {selectedCategory}</p>
              <p>Difficulty: {selectedDifficulty}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="restart-button"
              onClick={resetQuiz}
            >
              Try Another Quiz
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuizApp;