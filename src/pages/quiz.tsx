import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { getUser, updateUser, removeItemFromInventory, type InventoryItem } from "../services/users";
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
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [hint, setHint] = useState("");
  const [shieldActive, setShieldActive] = useState(false);
  const [luckyActive, setLuckyActive] = useState(false);

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
        // Load inventory
        const userData = await getUser(user.uid);
        setInventory(userData?.inventory || []);
      } catch (error) {
        console.error('Error loading quiz/inventory:', error);
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
    let isAnswerCorrect = 
      userAnswerLower === correctAnswer ||
      userAnswerLower.includes(correctAnswer) ||
      correctAnswer.includes(userAnswerLower);

    // Lucky Charm: auto-correct one wrong answer
    if (!isAnswerCorrect && luckyActive) {
      isAnswerCorrect = true;
      setLuckyActive(false);
    }

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
      // Magic Shield: block one wrong answer
      if (shieldActive) {
        setShieldActive(false);
        return;
      }
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

    setHint("");
    setHintUsed(false);

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
  // Inventory modal and item usage
  const openInventory = async () => {
    if (!user) return;
    const userData = await getUser(user.uid);
    setInventory(userData?.inventory || []);
    setIsInventoryOpen(true);
  };
  const closeInventory = () => setIsInventoryOpen(false);

  const useItem = async (item: InventoryItem) => {
    if (!user) return;
    if (item.name === "Healing Potion") {
      if (lives < INITIAL_LIVES) {
        setLives((l) => Math.min(INITIAL_LIVES, l + 1));
        await removeItemFromInventory(user.uid, item.id, 1);
        setInventory((inv) => inv.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0));
        closeInventory();
      }
    } else if (item.name === "Clue Token") {
      if (!hintUsed) {
        // Try to show a hint if available, else fallback
        const q = quiz?.questions[currentQuestionIndex] as any;
        setHint("Hint: " + (q?.hint || "No hint available."));
        setHintUsed(true);
        await removeItemFromInventory(user.uid, item.id, 1);
        setInventory((inv) => inv.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0));
        closeInventory();
      }
    } else if (item.name === "Magic Shield") {
      setShieldActive(true);
      await removeItemFromInventory(user.uid, item.id, 1);
      setInventory((inv) => inv.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0));
      closeInventory();
    } else if (item.name === "Energy Drink") {
      // Skip question
      if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
        await removeItemFromInventory(user.uid, item.id, 1);
        setInventory((inv) => inv.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0));
        setShowFeedback(false);
        setUserAnswer("");
        setIsCorrect(null);
        setHint("");
        setHintUsed(false);
        setCurrentQuestionIndex((idx) => idx + 1);
        closeInventory();
      }
    } else if (item.name === "Lucky Charm") {
      setLuckyActive(true);
      await removeItemFromInventory(user.uid, item.id, 1);
      setInventory((inv) => inv.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0));
      closeInventory();
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
      <div className="mb-6 flex gap-2 items-center">
        {Array.from({ length: lives }).map((_, i) => (
          <span key={i} style={{ fontSize: 32, color: '#D96B2B' }}>❤️</span>
        ))}
        {Array.from({ length: INITIAL_LIVES - lives }).map((_, i) => (
          <span key={i} style={{ fontSize: 32, color: '#ddd' }}>🤍</span>
        ))}
        <button onClick={openInventory} className="ml-4 px-4 py-2 bg-yellow-400 text-white rounded font-bold shadow hover:bg-yellow-500" style={{ fontFamily: 'monospace' }}>
          🎒 Inventory
        </button>
        {shieldActive && <span className="ml-2 px-2 py-1 bg-blue-200 text-blue-800 rounded font-bold" style={{ fontFamily: 'monospace', fontSize: 16 }}>🛡️ Shield</span>}
        {luckyActive && <span className="ml-2 px-2 py-1 bg-pink-200 text-pink-800 rounded font-bold" style={{ fontFamily: 'monospace', fontSize: 16 }}>🍀 Lucky</span>}
      </div>
            {/* Inventory Modal */}
            {isInventoryOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg border-4 border-yellow-400 flex flex-col items-center">
                  <button
                    onClick={closeInventory}
                    className="absolute top-4 right-4 text-2xl font-bold text-gray-700 hover:text-red-500 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow"
                    aria-label="Close Inventory"
                  >
                    ×
                  </button>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-4xl">🎒</span>
                    <span className="text-2xl font-bold text-yellow-700">Inventory</span>
                  </div>
                  <div className="grid grid-cols-2 gap-6 w-full">
                    {inventory.length === 0 ? (
                      <div className="col-span-full text-center text-gray-500">
                        <div className="text-6xl mb-2">📦</div>
                        <p>No items in your inventory</p>
                      </div>
                    ) : (
                      inventory.filter(item => ["Healing Potion","Clue Token","Magic Shield","Energy Drink","Lucky Charm"].includes(item.name)).map(item => (
                        <button key={item.id} onClick={() => useItem(item)} disabled={item.quantity <= 0}
                          className={`flex flex-col items-center bg-white rounded-xl shadow p-4 border-2 border-yellow-300 hover:bg-yellow-100 transition-all duration-200 ${item.quantity <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="text-5xl mb-2">{item.emoji}</div>
                          <div className="font-bold text-lg text-yellow-800 mb-1">{item.name}</div>
                          <div className="text-gray-600 text-xs mb-1">x{item.quantity}</div>
                          <div className="text-gray-500 text-xs text-center">
                            {item.name === "Healing Potion" && "Restore 1 heart (if not full)"}
                            {item.name === "Clue Token" && "Show a hint for this question"}
                            {item.name === "Magic Shield" && "Block next wrong answer"}
                            {item.name === "Energy Drink" && "Skip this question"}
                            {item.name === "Lucky Charm" && "Auto-correct one wrong answer"}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
            {/* Hint Display */}
            {hint && (
              <div className="mb-4 text-center text-blue-700 font-bold text-lg" style={{ fontFamily: 'monospace' }}>{hint}</div>
            )}
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

