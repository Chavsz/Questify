import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { getUser, updateUser } from "../services/users";
import { recordQuestCompletion } from "../services/questStats";
import type { GeneratedQuiz } from "../api/generate-quiz/generate_quiz";
import { useAuth } from "../contexts/authContexts/auth";

const INITIAL_LIVES = 3;

const Quiz = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const authContext = useAuth();
  const user = authContext?.currentUser;
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const loadQuiz = async () => {
      if (!quizId || !user) return;

      try {
        const questsRef = collection(db, 'quests');
        const q = query(questsRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          const quizData = data.quiz as GeneratedQuiz;
          
          if (quizData.id === quizId) {
            setQuiz(quizData);
            // Start from the first unanswered question
            const completedCount = data.completedQuestions || 0;
            if (completedCount > 0) {
              setCurrentQuestionIndex(completedCount);
            }
          }
        });
      } catch (error) {
        console.error('Error loading quiz:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [quizId, user]);

  const checkAnswer = () => {
    if (!quiz || !userAnswer.trim() || failed) return;

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const correctAnswer = currentQuestion.answer.toLowerCase().trim();
    const userAnswerLower = userAnswer.toLowerCase().trim();

    // Check if answer is correct (allowing for partial matches)
    const isAnswerCorrect = 
      userAnswerLower === correctAnswer ||
      userAnswerLower.includes(correctAnswer) ||
      correctAnswer.includes(userAnswerLower);

    setIsCorrect(isAnswerCorrect);
    setShowFeedback(true);

    if (isAnswerCorrect && user) {
      // Update progress in Firebase and award EXP
      const updateProgressAndExp = async () => {
        try {
          const questsRef = collection(db, 'quests');
          const q = query(questsRef, where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);

          querySnapshot.forEach(async (docSnapshot) => {
            const data = docSnapshot.data();
            const quizData = data.quiz as GeneratedQuiz;
            if (quizData.id === quizId) {
              const newCompleted = (data.completedQuestions || 0) + 1;
              const totalQuestions = quizData.questions.length;
              await updateDoc(doc(db, 'quests', docSnapshot.id), {
                completedQuestions: newCompleted
              });
              // Award EXP for completing a question
              const userData = await getUser(user.uid);
              let exp = userData?.exp ?? 0;
              let level = userData?.level ?? 1;
              const expToNext = 100 + (level - 1) * 50;
              exp += 20; // Award 20 EXP per correct answer
              if (exp >= expToNext) {
                exp -= expToNext;
                level += 1;
              }
              await updateUser(user.uid, { exp, level });
              if (newCompleted >= totalQuestions && totalQuestions > 0) {
                await recordQuestCompletion(user.uid);
              }
            }
          });
        } catch (error) {
          console.error('Error updating progress/exp:', error);
        }
      };
      updateProgressAndExp();
    } else if (!isAnswerCorrect) {
      // Lose a life on wrong answer
      setLives((prev) => {
        if (prev <= 1) {
          setFailed(true);
          return 0;
        }
        return prev - 1;
      });
    }
  };

  const nextQuestion = () => {
    if (!quiz) return;

    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer("");
      setIsCorrect(null);
      setShowFeedback(false);
    } else {
      // Quiz completed
      navigate('/quest');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!showFeedback) {
        checkAnswer();
      } else {
        nextQuestion();
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-2xl font-bold" style={{ fontFamily: 'monospace' }}>Loading quiz...</div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-2xl font-bold" style={{ fontFamily: 'monospace' }}>Quiz not found</div>
      </div>
    );
  }

  // Guard: If finished, show completed message
  if (failed) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="text-4xl font-bold mb-6" style={{ fontFamily: 'monospace', color: '#8B2B2B' }}>
          Quest Failed!
        </div>
        <div className="text-2xl mb-6" style={{ fontFamily: 'monospace', color: '#D96B2B' }}>
          You lost all your hearts.
        </div>
        <button
          onClick={() => navigate('/quest')}
          className="px-8 py-4 bg-gray-800 text-white font-bold"
          style={{
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            border: '4px solid #000000',
            cursor: 'pointer'
          }}
        >
          Back to Quests
        </button>
      </div>
    );
  }
  if (currentQuestionIndex >= quiz.questions.length) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="text-4xl font-bold mb-6" style={{ fontFamily: 'monospace', color: '#8B2B2B' }}>
          Quiz Completed!
        </div>
        <button
          onClick={() => navigate('/quest')}
          className="px-8 py-4 bg-gray-800 text-white font-bold"
          style={{
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            border: '4px solid #000000',
            cursor: 'pointer'
          }}
        >
          Back to Quests
        </button>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      {/* Hearts/Lives Display */}
      <div className="mb-6 flex gap-2">
        {Array.from({ length: lives }).map((_, i) => (
          <span key={i} style={{ fontSize: 32, color: '#D96B2B' }}>❤️</span>
        ))}
        {Array.from({ length: INITIAL_LIVES - lives }).map((_, i) => (
          <span key={i} style={{ fontSize: 32, color: '#ddd' }}>🤍</span>
        ))}
      </div>
      <div className="w-full max-w-4xl flex flex-col items-center">
        {/* Question */}
        <div className="mb-8 text-center px-4">
          <h1 
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2"
            style={{ 
              fontFamily: 'monospace',
              color: '#8B2B2B',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              lineHeight: '1.3',
              wordBreak: 'break-word'
            }}
          >
            {currentQuestion.question}
          </h1>
        </div>

        {/* Answer Input Box */}
        <div className="w-full max-w-2xl mb-8">
          <div 
            className="relative"
            style={{
              border: '8px solid #000000',
              borderStyle: 'solid',
              backgroundColor: '#D96B2B',
              padding: '40px 20px',
              minHeight: '200px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            {!userAnswer && (
              <div 
                className="text-center mb-4"
                style={{
                  fontFamily: 'monospace',
                  color: '#F5D5B8',
                  fontSize: '18px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                TYPE YOUR ANSWER
              </div>
            )}
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={showFeedback}
              className="w-full text-center bg-transparent border-none outline-none"
              style={{
                fontFamily: 'monospace',
                color: '#FFFFFF',
                fontSize: '32px',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                fontWeight: 'bold'
              }}
              placeholder=""
              autoFocus
            />
          </div>
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div className="mb-8 flex flex-col items-center">
            {isCorrect ? (
              <div 
                className="text-6xl mb-4"
                style={{
                  fontFamily: 'monospace',
                  color: '#22C55E',
                  fontWeight: 'bold'
                }}
              >
                ✓
              </div>
            ) : (
              <div 
                className="text-6xl mb-4"
                style={{
                  fontFamily: 'monospace',
                  color: '#8B2B2B',
                  fontWeight: 'bold'
                }}
              >
                ✗
              </div>
            )}
            {!isCorrect && (
              <div 
                className="text-xl mb-4"
                style={{
                  fontFamily: 'monospace',
                  color: '#8B2B2B',
                  textTransform: 'uppercase'
                }}
              >
                Correct answer: {currentQuestion.answer}
              </div>
            )}
            <button
              onClick={nextQuestion}
              className="px-8 py-4 bg-gray-800 text-white font-bold"
              style={{
                fontFamily: 'monospace',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                border: '4px solid #000000',
                cursor: 'pointer'
              }}
            >
              {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
            </button>
          </div>
        )}

        {/* Submit Button (when answer not checked) */}
        {!showFeedback && userAnswer.trim() && (
          <button
            onClick={checkAnswer}
            className="px-8 py-4 bg-gray-800 text-white font-bold mb-4"
            style={{
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              border: '4px solid #000000',
              cursor: 'pointer'
            }}
          >
            Submit Answer
          </button>
        )}

        {/* Progress */}
        <div 
          className="mt-8 text-center"
          style={{
            fontFamily: 'monospace',
            color: '#8B2B2B',
            fontSize: '18px',
            textTransform: 'uppercase'
          }}
        >
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate('/quest')}
          className="mt-4 px-6 py-2 bg-gray-600 text-white"
          style={{
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            border: '3px solid #000000',
            cursor: 'pointer'
          }}
        >
          Back to Quests
        </button>
      </div>
    </div>
  );
};

export default Quiz;

