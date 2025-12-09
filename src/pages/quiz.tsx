import MiniSwordManIdle from "../assets/MiniSwordManIdle.gif";
import MiniSpear from "../assets/MiniSpearManIdle.gif";
import MiniArcher from "../assets/MiniArcherIdle.gif";
import Orc from "../assets/OrcIdle.gif";
import MiniMage from "../assets/MiniMageIdle.gif";
import MiniPrince from "../assets/MiniPrinceIdle.gif";

// Avatar character list (sync with avatar.tsx)
const miniSwordCrew = [
  {
    id: "idle",
    label: "Mini Swordman",
    image: MiniSwordManIdle,
  },
  {
    id: "idle1",
    label: "Mini Spearman",
    image: MiniSpear,
  },
  {
    id: "idle2",
    label: "Mini Archer",
    image: MiniArcher,
  },
  {
    id: "idle3",
    label: "Mini Mage",
    description:
      "A mystical spellcaster wielding arcane magic. Powerful ranged attacks with elemental fury and crowd control.",
    requiredLevel: 15,
    image: MiniMage,
  },
  {
    id: "idle4",
    label: "Mini Prince",
    description:
      "A noble warrior with balanced skills and royal abilities. Master of both offense and defense with inspiring presence.",
    requiredLevel: 15,
    image: MiniPrince,
  },
];
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";
import {
  getUser,
  updateUser,
  removeItemFromInventory,
  type InventoryItem,
} from "../services/users";
import { recordQuestCompletion } from "../services/questStats";
import type { GeneratedQuiz } from "../api/generate-quiz/generate_quiz";
import { useAuth } from "../contexts/authContexts/auth";

const INITIAL_LIVES = 3;

const Quiz = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const authContext = useAuth();
  const user = authContext?.currentUser;
  // Avatar state
  const [selectedCharacter, setSelectedCharacter] = useState<string>(
    miniSwordCrew[0].id
  );

  // Load selected character from Firestore
  useEffect(() => {
    const fetchSelectedCharacter = async () => {
      if (!user) return;
      const userData = await getUser(user.uid);
      if (userData && userData.selectedCharacter) {
        setSelectedCharacter(userData.selectedCharacter);
        // Prince starts with 4 hearts instead of 3
        if (userData.selectedCharacter === "idle4") {
          setLives(4);
        }
        // Initialize passive abilities based on selected character
        if (userData.selectedCharacter === "idle1") {
          // Mini Spearman: 2 free damage blocks
          setSpearmanBlocksRemaining(2);
        } else {
          setSpearmanBlocksRemaining(0);
        }
        // Archer dodges on wrong answers dynamically
        setArcherDodgeActive(userData.selectedCharacter === "idle2");
        // Mage: 3 charges to reveal answer
        setMageRevealChargesRemaining(userData.selectedCharacter === "idle3" ? 3 : 0);
        // Prince: Can heal once, and starts with 4 hearts
        setPrinceHealUsed(false);
      }
    };
    fetchSelectedCharacter();
  }, [user]);
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [completedQuestions, setCompletedQuestions] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [failed, setFailed] = useState(false);
  const [mageRevealChargesRemaining, setMageRevealChargesRemaining] = useState(0);
  const [princeHealUsed, setPrinceHealUsed] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [hint, setHint] = useState("");
  const [shieldActive, setShieldActive] = useState(false);
  const [luckyActive, setLuckyActive] = useState(false);
  const [spearmanBlocksRemaining, setSpearmanBlocksRemaining] = useState(0);
  const [archerDodgeActive, setArcherDodgeActive] = useState(false);

  useEffect(() => {
    const loadQuiz = async () => {
      if (!quizId || !user) return;
      try {
        const questsRef = collection(db, "quests");
        const q = query(questsRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          const quizData = data.quiz as GeneratedQuiz;
          if (quizData.id === quizId) {
            setQuiz(quizData);
            // Load how many questions have been answered correctly so far
            const completedCount = data.completedQuestions || 0;
            setCompletedQuestions(completedCount);

            // If this is a fresh run (e.g. after pressing "Restart Quest"),
            // always start from the first question.
            if (completedCount === 0) {
              setCurrentQuestionIndex(0);
            } else {
              // Otherwise, resume from the first question that is not yet correct.
              const firstIncompleteIndex = quizData.questions.findIndex(
                (q) => q.status !== "correct"
              );

              if (firstIncompleteIndex === -1) {
                // All questions are marked correct – jump past the end so the
                // victory / completion screen logic can handle it.
                setCurrentQuestionIndex(quizData.questions.length);
              } else {
                setCurrentQuestionIndex(firstIncompleteIndex);
              }
            }
          }
        });
        // Load inventory
        const userData = await getUser(user.uid);
        setInventory(userData?.inventory || []);
      } catch (error) {
        console.error("Error loading quiz/inventory:", error);
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

    // Update local question status so we know which ones were correct/wrong
    setQuiz((prevQuiz) => {
      if (!prevQuiz) return prevQuiz;
      const questions = [...prevQuiz.questions];
      questions[currentQuestionIndex] = {
        ...questions[currentQuestionIndex],
        status: isAnswerCorrect ? "correct" : "wrong",
      };
      return { ...prevQuiz, questions };
    });

    if (isAnswerCorrect && user) {
      // Increment completed questions count for boss health calculation
      setCompletedQuestions((prev) => prev + 1);
      // Update progress in Firebase and award EXP
      const updateProgressAndExp = async () => {
        try {
          const questsRef = collection(db, "quests");
          const q = query(questsRef, where("userId", "==", user.uid));
          const querySnapshot = await getDocs(q);

          querySnapshot.forEach(async (docSnapshot) => {
            const data = docSnapshot.data();
            const quizData = data.quiz as GeneratedQuiz;
            if (quizData.id === quizId) {
              const newCompleted = (data.completedQuestions || 0) + 1;
              const totalQuestions = quizData.questions.length;

              // Persist updated question status for this index
              const updatedQuestions = quizData.questions.map((q, idx) =>
                idx === currentQuestionIndex
                  ? { ...q, status: "correct" }
                  : q
              );

              await updateDoc(doc(db, "quests", docSnapshot.id), {
                completedQuestions: newCompleted,
                quiz: {
                  ...quizData,
                  questions: updatedQuestions,
                },
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
          console.error("Error updating progress/exp:", error);
        }
      };
      updateProgressAndExp();
    } else if (!isAnswerCorrect) {
      // Magic Shield: block one wrong answer
      if (shieldActive) {
        setShieldActive(false);
        return;
      }
      // Mini Spearman passive: 2 free damage blocks
      if (spearmanBlocksRemaining > 0) {
        setSpearmanBlocksRemaining((prev) => prev - 1);
        return; // Block the damage, prevent life loss
      }
      // Mini Archer passive: 30% chance to dodge an attack on wrong answer
      if (archerDodgeActive && Math.random() < 0.3) {
        return; // Dodge the damage, prevent life loss
      }
      // Lose a life on wrong answer
      setLives((prev) => {
        if (prev <= 1) {
          setFailed(true);
          return 0;
        }
        return prev - 1;
      });

      // Persist "wrong" status for this question in Firestore
      if (user && quizId) {
        const updateWrongStatus = async () => {
          try {
            const questsRef = collection(db, "quests");
            const q = query(questsRef, where("userId", "==", user.uid));
            const querySnapshot = await getDocs(q);

            querySnapshot.forEach(async (docSnapshot) => {
              const data = docSnapshot.data();
              const quizData = data.quiz as GeneratedQuiz;
              if (quizData.id === quizId) {
                const updatedQuestions = quizData.questions.map((q, idx) =>
                  idx === currentQuestionIndex ? { ...q, status: "wrong" } : q
                );

                await updateDoc(doc(db, "quests", docSnapshot.id), {
                  quiz: {
                    ...quizData,
                    questions: updatedQuestions,
                  },
                });
              }
            });
          } catch (error) {
            console.error("Error updating question status:", error);
          }
        };
        updateWrongStatus();
      }
    }
  };

  const nextQuestion = () => {
    if (!quiz) return;

    setHint("");

    // Find the next question after the current index that is not yet correct.
    // This ensures that when re-taking a quest with multiple wrong answers,
    // we jump from one fixed question directly to the next remaining wrong one.
    let nextIndex = -1;
    for (let i = currentQuestionIndex + 1; i < quiz.questions.length; i++) {
      const status = quiz.questions[i].status;
      if (status !== "correct") {
        nextIndex = i;
        break;
      }
    }

    if (nextIndex !== -1) {
      setCurrentQuestionIndex(nextIndex);
      setUserAnswer("");
      setIsCorrect(null);
      setShowFeedback(false);
    } else {
      // No more remaining incorrect/unanswered questions – advance past the
      // last question so that completion/victory screens can be shown.
      setCurrentQuestionIndex(quiz.questions.length);
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
        setInventory((inv) =>
          inv
            .map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i
            )
            .filter((i) => i.quantity > 0)
        );
        closeInventory();
      }
    } else if (item.name === "Clue Token") {
      // (Legacy: Clue Token logic, if needed)
      setCurrentQuestionIndex(quiz?.questions.length || 0);
      await removeItemFromInventory(user.uid, item.id, 1);
      setInventory((inv) =>
        inv
          .map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i
          )
          .filter((i) => i.quantity > 0)
      );
      closeInventory();
    } else if (item.name === "Speedrun Key") {
      // Instantly finish the quest and update progress/exp/coins
      if (!quiz) return;
      setCurrentQuestionIndex(quiz.questions.length);
      setCompletedQuestions(quiz.questions.length);
      // Update quest progress in Firestore
      const questsRef = collection(db, "quests");
      const q = query(questsRef, where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        const quizData = data.quiz as GeneratedQuiz;
        if (quizData.id === quizId) {
          await updateDoc(doc(db, "quests", docSnapshot.id), {
            completedQuestions: quiz.questions.length,
          });
        }
      }
      // Award EXP for all remaining questions
      const userData = await getUser(user.uid);
      let exp = userData?.exp ?? 0;
      let level = userData?.level ?? 1;
      const expToNext = 100 + (level - 1) * 50;
      exp += 20 * (quiz.questions.length - currentQuestionIndex); // 20 EXP per remaining question
      while (exp >= expToNext) {
        exp -= expToNext;
        level += 1;
      }
      await updateUser(user.uid, { exp, level });
      await recordQuestCompletion(user.uid);
      await removeItemFromInventory(user.uid, item.id, 1);
      setInventory((inv) =>
        inv
          .map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i
          )
          .filter((i) => i.quantity > 0)
      );
      closeInventory();
    } else if (item.name === "Magic Shield") {
      setShieldActive(true);
      await removeItemFromInventory(user.uid, item.id, 1);
      setInventory((inv) =>
        inv
          .map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i
          )
          .filter((i) => i.quantity > 0)
      );
      closeInventory();
    } else if (item.name === "Energy Drink") {
      // Skip question
      if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
        await removeItemFromInventory(user.uid, item.id, 1);
        setInventory((inv) =>
          inv
            .map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i
            )
            .filter((i) => i.quantity > 0)
        );
        setShowFeedback(false);
        setUserAnswer("");
        setIsCorrect(null);
        setHint("");
        setCurrentQuestionIndex((idx) => idx + 1);
        closeInventory();
      }
    } else if (item.name === "Lucky Charm") {
      setLuckyActive(true);
      await removeItemFromInventory(user.uid, item.id, 1);
      setInventory((inv) =>
        inv
          .map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i
          )
          .filter((i) => i.quantity > 0)
      );
      closeInventory();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (!showFeedback) {
        checkAnswer();
      } else {
        nextQuestion();
      }
    }
  };

  // =================================================================
  // Battle Arena Screens
  // =================================================================

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(to bottom, #1a0b2e, #3d1e6d)" }}
      >
        <div
          className="text-2xl font-bold text-white"
          style={{ fontFamily: "monospace", textShadow: "0 0 10px #fff" }}
        >
          Loading Arena...
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(to bottom, #1a0b2e, #3d1e6d)" }}
      >
        <div
          className="text-2xl font-bold text-red-400"
          style={{ fontFamily: "monospace", textShadow: "0 0 10px #f00" }}
        >
          Battle Not Found
        </div>
      </div>
    );
  }

  // Defeat Screen
  if (failed) {
    return (
      <div
        className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-8 z-50"
        style={{
          background:
            "linear-gradient(to bottom, #2d0b0b 0%, #6d1e1e 50%, #2d0b0b 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(255,255,255,0.03) 50px, rgba(255,255,255,0.03) 51px)`,
          }}
        />
        <div
          className="text-9xl mb-6 z-50"
          style={{ filter: "drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))" }}
        >
          💀
        </div>
        <div
          className="text-5xl font-bold mb-6 z-50"
          style={{
            fontFamily: "monospace",
            color: "#f8b4b4",
            textShadow: "0 0 15px #f00",
          }}
        >
          DEFEATED
        </div>
        <div
          className="text-2xl mb-6 z-50"
          style={{ fontFamily: "monospace", color: "#fecaca" }}
        >
          The boss was too strong.
        </div>
        <button
          onClick={() => navigate("/quest")}
          className="px-8 py-4 bg-gray-800 text-white font-bold rounded-lg z-50"
          style={{
            fontFamily: "monospace",
            textTransform: "uppercase",
            letterSpacing: "2px",
            border: "2px solid #71717a",
            boxShadow: "0 0 10px rgba(0,0,0,0.5)",
          }}
        >
          Retreat to Quests
        </button>
      </div>
    );
  }

  // Victory Screen (Perfect Quest)
  if (completedQuestions >= quiz.questions.length && quiz.questions.length > 0) {
    return (
      <div
        className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-8 z-50"
        style={{
          background:
            "linear-gradient(to bottom, #0b2d1d 0%, #1e6d45 50%, #0b2d1d 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(255,255,255,0.03) 50px, rgba(255,255,255,0.03) 51px)`,
          }}
        />
        <div
          className="text-9xl mb-6 z-50"
          style={{ filter: "drop-shadow(0 0 10px rgba(250, 204, 21, 0.7))" }}
        >
          🏆
        </div>
        <div
          className="text-5xl font-bold mb-6 z-50"
          style={{
            fontFamily: "monospace",
            color: "#bbf7d0",
            textShadow: "0 0 15px #fff",
          }}
        >
          VICTORY
        </div>
        <div
          className="text-2xl mb-6 z-50"
          style={{ fontFamily: "monospace", color: "#dcfce7" }}
        >
          You have defeated the boss!
        </div>
        <button
          onClick={() => navigate("/quest")}
          className="px-8 py-4 bg-yellow-500 text-black font-bold rounded-lg z-50"
          style={{
            fontFamily: "monospace",
            textTransform: "uppercase",
            letterSpacing: "2px",
            border: "2px solid #fde047",
            boxShadow: "0 0 20px rgba(250, 204, 21, 0.7)",
          }}
        >
          Back to Quests
        </button>
      </div>
    );
  }

  // Quest Completed (Not Perfect) Screen
  // Show this when user has gone through all questions but hasn't answered them all correctly
  if (currentQuestionIndex >= quiz.questions.length && completedQuestions < quiz.questions.length) {
    const score = completedQuestions;
    const total = quiz.questions.length;
    const percentage = Math.round((score / total) * 100);
    
    return (
      <div
        className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-8 z-50"
        style={{
          background:
            "linear-gradient(to bottom, #2d1b0b 0%, #6d4e1e 50%, #2d1b0b 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(255,255,255,0.03) 50px, rgba(255,255,255,0.03) 51px)`,
          }}
        />
        <div
          className="text-9xl mb-6 z-50"
          style={{ filter: "drop-shadow(0 0 10px rgba(255, 193, 7, 0.5))" }}
        >
          ⚔️
        </div>
        <div
          className="text-5xl font-bold mb-6 z-50"
          style={{
            fontFamily: "monospace",
            color: "#ffd89b",
            textShadow: "0 0 15px rgba(255, 193, 7, 0.7)",
          }}
        >
          QUEST COMPLETED
        </div>
        <div
          className="text-3xl font-bold mb-4 z-50"
          style={{
            fontFamily: "monospace",
            color: "#ffd89b",
            textShadow: "0 0 10px rgba(255, 193, 7, 0.5)",
          }}
        >
          Score: {score}/{total} ({percentage}%)
        </div>
        <div
          className="text-xl mb-6 z-50 text-center max-w-2xl px-4"
          style={{ fontFamily: "monospace", color: "#fecaca" }}
        >
          You've completed the quest, but not all answers were correct.
          <br />
          Try again to achieve a perfect score and claim full rewards!
        </div>
        <button
          onClick={() => navigate("/quest")}
          className="px-8 py-4 bg-orange-600 text-white font-bold rounded-lg z-50 hover:bg-orange-700 transition-all"
          style={{
            fontFamily: "monospace",
            textTransform: "uppercase",
            letterSpacing: "2px",
            border: "2px solid #f97316",
            boxShadow: "0 0 20px rgba(255, 193, 7, 0.5)",
          }}
        >
          Back to Quests
        </button>
      </div>
    );
  }

  // =================================================================
  // Main Battle Arena
  // =================================================================

  // Safety check: ensure currentQuestion exists before rendering
  if (!quiz || currentQuestionIndex >= quiz.questions.length) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(to bottom, #1a0b2e, #3d1e6d)" }}
      >
        <div
          className="text-2xl font-bold text-white"
          style={{ fontFamily: "monospace", textShadow: "0 0 10px #fff" }}
        >
          Loading...
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-8"
      style={{
        background:
          "linear-gradient(to bottom, #1a0b2e 0%, #3d1e6d 50%, #1a0b2e 100%)",
      }}
    >
      {/* Battle Arena Background Effects */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(255,255,255,0.03) 50px, rgba(255,255,255,0.03) 51px), repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(255,255,255,0.03) 50px, rgba(255,255,255,0.03) 51px)`,
        }}
      />

      {/* Player Avatar (Left) */}
      <div
        className="absolute left-8 bottom-24 z-10 flex flex-col items-center"
        style={{
          animation: "float 3s ease-in-out infinite",
        }}
      >
        <div className="mb-2">
          {(() => {
            const char =
              miniSwordCrew.find((c) => c.id === selectedCharacter) ||
              miniSwordCrew[0];
            return (
              <img
                src={char.image}
                alt={char.label}
                className="w-40 h-40 object-contain"
                style={{
                  imageRendering: "pixelated",
                  filter: "drop-shadow(0 0 10px rgba(34, 197, 94, 0.5))",
                }}
              />
            );
          })()}
        </div>
        <div className="px-4 py-2 bg-green-900/80 border-2 border-green-400 rounded-lg backdrop-blur-sm">
          <div
            className="text-green-300 font-bold text-sm"
            style={{ fontFamily: "monospace" }}
          >
            HERO
          </div>
          <div className="flex gap-1 mt-1">
            {Array.from({ length: lives }).map((_, i) => (
              <span key={i} style={{ fontSize: 20 }}>
                ❤️
              </span>
            ))}
            {Array.from({ length: INITIAL_LIVES - lives }).map((_, i) => (
              <span key={i} style={{ fontSize: 20, opacity: 0.3 }}>
                🤍
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Boss Character (Right) */}
      <div
        className="absolute right-8 bottom-24 z-10 flex flex-col items-center"
        style={{
          animation: "floatBoss 3.5s ease-in-out infinite",
        }}
      >
        <div className="mb-2">
          <img
            src={Orc}
            alt="Orc Boss"
            className="w-80 h-50 object-contain"
            style={{
              imageRendering: "pixelated",
              filter: "drop-shadow(0 0 20px rgba(220, 38, 38, 0.7))",
              transform: "scaleX(-1)",
            }}
          />
        </div>
        <div className="px-4 py-2 bg-red-900/80 border-2 border-red-400 rounded-lg backdrop-blur-sm">
          <div
            className="text-red-300 font-bold text-sm"
            style={{ fontFamily: "monospace" }}
          >
            BOSS
          </div>
          <div className="w-32 h-2 bg-red-950 rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
              style={{
                width: `${
                  ((quiz.questions.length - completedQuestions) /
                    quiz.questions.length) *
                  100
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Lightning Effects */}
      {showFeedback && (
        <div className="absolute inset-0 pointer-events-none z-0">
          {isCorrect ? (
            <div className="absolute inset-0 bg-green-500/10 animate-pulse" />
          ) : (
            <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
          )}
        </div>
      )}

      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          @keyframes floatBoss {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-15px) translateX(5px); }
          }
          input::placeholder {
            color: rgba(224, 176, 255, 0.3);
          }
        `}
      </style>

      {/* Controls & Status Effects */}
      <div className="mb-6 flex gap-2 items-center z-20">
        <button
          onClick={openInventory}
          className="ml-4 px-4 py-2 bg-yellow-400 text-black font-bold rounded shadow-lg hover:bg-yellow-300 transition-all duration-200"
          style={{
            fontFamily: "monospace",
            filter: "drop-shadow(0 0 5px rgba(250, 204, 21, 0.5))",
          }}
        >
          🎒 Inventory
        </button>

        {shieldActive && (
          <span
            className="ml-2 px-3 py-1 bg-blue-500/80 text-white rounded font-bold border-2 border-blue-300 animate-pulse"
            style={{
              fontFamily: "monospace",
              fontSize: 16,
              filter: "drop-shadow(0 0 5px rgba(59, 130, 246, 0.5))",
            }}
          >
            🛡️ Shield
          </span>
        )}
        {luckyActive && (
          <span
            className="ml-2 px-3 py-1 bg-pink-500/80 text-white rounded font-bold border-2 border-pink-300 animate-pulse"
            style={{
              fontFamily: "monospace",
              fontSize: 16,
              filter: "drop-shadow(0 0 5px rgba(236, 72, 153, 0.5))",
            }}
          >
            🍀 Lucky
          </span>
        )}
        {spearmanBlocksRemaining > 0 && (
          <span
            className="ml-2 px-3 py-1 bg-slate-600/80 text-white rounded font-bold border-2 border-slate-400 animate-pulse"
            style={{
              fontFamily: "monospace",
              fontSize: 16,
              filter: "drop-shadow(0 0 5px rgba(100, 116, 139, 0.5))",
            }}
          >
            🗡️ Blocks: {spearmanBlocksRemaining}
          </span>
        )}
        {archerDodgeActive && (
          <span
            className="ml-2 px-3 py-1 bg-purple-500/80 text-white rounded font-bold border-2 border-purple-300 animate-pulse"
            style={{
              fontFamily: "monospace",
              fontSize: 16,
              filter: "drop-shadow(0 0 5px rgba(168, 85, 247, 0.5))",
            }}
          >
            🏹 Dodge: 30%
          </span>
        )}
      </div>

      {/* Inventory Modal */}
      {isInventoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg border-4 border-purple-400 flex flex-col items-center relative"
            style={{ filter: "drop-shadow(0 0 20px rgba(168, 85, 247, 0.5))" }}
          >
            <button
              onClick={closeInventory}
              className="absolute top-4 right-4 text-3xl font-bold text-gray-700 hover:text-red-500"
              aria-label="Close Inventory"
            >
              ×
            </button>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">🎒</span>
              <span className="text-2xl font-bold text-purple-700">
                Inventory
              </span>
            </div>
            <div className="grid grid-cols-2 gap-6 w-full">
              {inventory.length === 0 ? (
                <div className="col-span-full text-center text-gray-500">
                  <div className="text-6xl mb-2">📦</div>
                  <p>No items in your inventory</p>
                </div>
              ) : (
                inventory
                  .filter((item) =>
                    [
                      "Healing Potion",
                      "Clue Token",
                      "Speedrun Key",
                      "Magic Shield",
                      "Energy Drink",
                      "Lucky Charm",
                    ].includes(item.name)
                  )
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={() => useItem(item)}
                      disabled={item.quantity <= 0}
                      className={`flex flex-col items-center bg-white rounded-xl shadow p-4 border-2 border-purple-300 hover:bg-purple-100 transition-all duration-200 ${
                        item.quantity <= 0
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <div className="text-5xl mb-2">
                        {typeof item.emoji === "string" &&
                        item.emoji.endsWith(".png") ? (
                          <img
                            src={item.emoji}
                            alt={item.name}
                            className="object-contain w-14 h-14"
                            style={{ imageRendering: "pixelated" }}
                          />
                        ) : (
                          item.emoji
                        )}
                      </div>
                      <div className="font-bold text-lg text-purple-800 mb-1">
                        {item.name}
                      </div>
                      <div className="text-gray-600 text-xs mb-1">
                        x{item.quantity}
                      </div>
                      <div className="text-gray-500 text-xs text-center">
                        {item.name === "Healing Potion" &&
                          "Restore 1 heart (if not full)"}
                        {item.name === "Clue Token" &&
                          "Show a hint for this question"}
                        {item.name === "Speedrun Key" &&
                          "Instantly finish a quest"}
                        {item.name === "Magic Shield" &&
                          "Block next wrong answer"}
                        {item.name === "Energy Drink" && "Skip this question"}
                        {item.name === "Lucky Charm" &&
                          "Auto-correct one wrong answer"}
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
        <div
          className="mb-4 text-center text-cyan-300 font-bold text-lg z-20"
          style={{
            fontFamily: "monospace",
            filter: "drop-shadow(0 0 5px rgba(20, 208, 230, 0.5))",
          }}
        >
          {hint}
        </div>
      )}

      {/* Main Content Area */}
      <div className="w-full max-w-4xl flex flex-col items-center z-20">
        {/* Question Box */}
        <div
          className="w-full max-w-3xl mb-8 text-center p-6 rounded-lg"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "2px solid rgba(168, 85, 247, 0.7)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 0 20px rgba(168, 85, 247, 0.5)",
          }}
        >
          <h1
            className="text-3xl md:text-4xl font-bold"
            style={{
              fontFamily: "monospace",
              color: "#f0e6ff",
              textShadow: "0 0 10px rgba(224, 176, 255, 0.7)",
            }}
          >
            {currentQuestion.question}
          </h1>
        </div>

        {/* Character Ability Buttons */}
        <div className="w-full max-w-2xl mb-6 flex gap-4 justify-center flex-wrap">
          {/* Mage: Reveal Answer Ability */}
          {selectedCharacter === "idle3" && mageRevealChargesRemaining > 0 && (
            <button
              onClick={() => {
                if (!showFeedback && mageRevealChargesRemaining > 0) {
                  setUserAnswer(currentQuestion.answer.toUpperCase());
                  setMageRevealChargesRemaining((prev) => prev - 1);
                }
              }}
              disabled={showFeedback || mageRevealChargesRemaining === 0}
              className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                fontFamily: "monospace",
                textTransform: "uppercase",
                fontSize: "12px",
                letterSpacing: "1px",
                border: "2px solid #3b82f6",
                boxShadow: "0 0 10px rgba(59, 130, 246, 0.5)",
              }}
            >
              🧙 Reveal ({mageRevealChargesRemaining})
            </button>
          )}
          
          {/* Prince: Heal Ability */}
          {selectedCharacter === "idle4" && !princeHealUsed && (
            <button
              onClick={() => {
                if (lives < 4 && !princeHealUsed) {
                  setLives(4);
                  setPrinceHealUsed(true);
                }
              }}
              disabled={lives === 4 || princeHealUsed}
              className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg shadow-lg hover:bg-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                fontFamily: "monospace",
                textTransform: "uppercase",
                fontSize: "12px",
                letterSpacing: "1px",
                border: "2px solid #a855f7",
                boxShadow: "0 0 10px rgba(168, 85, 247, 0.5)",
              }}
            >
              👑 Heal Once
            </button>
          )}
        </div>

        {/* Answer Input */}
        <div className="w-full max-w-2xl mb-8">
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={showFeedback}
            className="w-full text-center bg-transparent border-b-4 outline-none p-4"
            style={{
              fontFamily: "monospace",
              color: "#FFFFFF",
              fontSize: "32px",
              textTransform: "uppercase",
              letterSpacing: "2px",
              fontWeight: "bold",
              borderColor: "rgba(168, 85, 247, 0.8)",
              textShadow: "0 0 10px rgba(168, 85, 247, 0.5)",
              transition: "all 0.3s",
            }}
            placeholder="TYPE COMMAND..."
            autoFocus
          />
        </div>

        {/* Feedback & Action Buttons */}
        <div
          className="mb-8 flex flex-col items-center"
          style={{ minHeight: "150px" }}
        >
          {showFeedback ? (
            <>
              {isCorrect ? (
                <div
                  className="text-6xl mb-4"
                  style={{ color: "#22C55E", textShadow: "0 0 10px #22C55E" }}
                >
                  ✓
                </div>
              ) : (
                <div
                  className="text-6xl mb-4"
                  style={{ color: "#EF4444", textShadow: "0 0 10px #EF4444" }}
                >
                  ✗
                </div>
              )}
              {!isCorrect && (
                <div
                  className="text-xl mb-4"
                  style={{
                    fontFamily: "monospace",
                    color: "#f8b4b4",
                    textTransform: "uppercase",
                  }}
                >
                  Correct answer: {currentQuestion.answer}
                </div>
              )}
              <button
                onClick={nextQuestion}
                className="px-8 py-4 bg-purple-700 text-white font-bold rounded-lg shadow-lg hover:bg-purple-600 transition-all"
                style={{
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  border: "2px solid #c084fc",
                  boxShadow: "0 0 15px rgba(168, 85, 247, 0.7)",
                }}
              >
                {isLastQuestion ? "⚔️ Finish Battle ⚔️" : "Next Wave ➡️"}
              </button>
            </>
          ) : (
            userAnswer.trim() && (
              <button
                onClick={checkAnswer}
                className="px-8 py-4 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-500 transition-all"
                style={{
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  border: "2px solid #86efac",
                  boxShadow: "0 0 15px rgba(34, 197, 94, 0.7)",
                }}
              >
                Attack! 🗡️
              </button>
            )
          )}
        </div>

        {/* Progress */}
        <div
          className="mt-8 text-center"
          style={{
            fontFamily: "monospace",
            color: "#d8b4fe",
            fontSize: "18px",
            textTransform: "uppercase",
            textShadow: "0 0 5px rgba(216, 180, 254, 0.5)",
          }}
        >
          Wave {currentQuestionIndex + 1} of {quiz.questions.length}
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate("/quest")}
          className="mt-4 px-6 py-2 bg-gray-700/50 text-white rounded-md backdrop-blur-sm hover:bg-gray-600/70 transition-all"
          style={{
            fontFamily: "monospace",
            textTransform: "uppercase",
            letterSpacing: "1px",
            border: "2px solid #a1a1aa",
          }}
        >
          Retreat
        </button>
      </div>
    </div>
  );
};

export default Quiz;
