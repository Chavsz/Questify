import { useState, useEffect } from "react";
import { useTheme } from "../components/theme";
import { IoSunnyOutline } from "react-icons/io5";
import { FaRegMoon } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { 
  FaLaptop, 
  FaRuler, 
  FaGlobe,  
  FaUpload, 
  FaCube, 
  FaStar,
  FaFire,
  FaCheckCircle
} from "react-icons/fa";
import { generateQuizFromFile } from "../api/generate-quiz/generate_quiz";
import type { GeneratedQuiz } from "../api/generate-quiz/generate_quiz";
import { db } from "../firebase";
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { useAuth } from "../contexts/authContexts/auth";
import { getUser, updateUser, type InventoryItem } from "../services/users";

interface QuestItem {
  id: string;
  name: string;
  details: string;
  status: 'completed' | 'in-progress' | 'not-started';
  progress: string;
  progressText: string;
  icon: React.ReactNode;
  coins?: string;
  quizId?: string;
}

const Quest = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const authContext = useAuth();
  const user = authContext?.currentUser;
  const navigate = useNavigate();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [streak, setStreak] = useState<number | null>(null);
  const [loadingStreak, setLoadingStreak] = useState(true);
  useEffect(() => {
    const fetchStreak = async () => {
      if (!user) {
        setStreak(null);
        setLoadingStreak(false);
        return;
      }
      try {
        const userData = await getUser(user.uid);
        setStreak(userData && typeof userData.streak === 'number' ? userData.streak : 0);
      } catch (e) {
        setStreak(0);
      } finally {
        setLoadingStreak(false);
      }
    };
    fetchStreak();
  }, [user]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quests, setQuests] = useState<QuestItem[]>([]);

  // Load quests from Firebase
  useEffect(() => {
    const loadQuests = async () => {
      if (!user) return;
      try {
        const questsRef = collection(db, 'quests');
        const q = query(questsRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const loadedQuests: QuestItem[] = [];
        let awarded = false;
        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          const quizData = data.quiz as GeneratedQuiz;
          let status: 'completed' | 'in-progress' | 'not-started' = 'not-started';
          const totalQuestions = quizData.questions.length;
          const completedQuestions = data.completedQuestions || 0;
          if (completedQuestions === 0) {
            status = 'not-started';
          } else if (completedQuestions === totalQuestions) {
            status = 'completed';
            // Award exp and coins if not already awarded (add a field to mark awarded)
            if (!data.rewarded) {
              const userData = await getUser(user.uid);
              let exp = userData?.exp ?? 0;
              let level = userData?.level ?? 1;
              let coins = userData?.coins ?? 1250;
              const expToNext = 100 + (level - 1) * 50;
              exp += 100; // Award 100 exp per quest
              coins += 100; // Award 100 coins per quest
              if (exp >= expToNext) {
                exp -= expToNext;
                level += 1;
              }
              await updateUser(user.uid, { exp, level, coins });
              await updateDoc(doc(db, 'quests', docSnap.id), { rewarded: true });
              awarded = true;
            }
          } else {
            status = 'in-progress';
          }
          const progress = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0;
          let icon = <FaLaptop className="text-blue-500 text-2xl" />;
          if (quizData.sourceFile.includes('.pdf')) {
            icon = <FaLaptop className="text-blue-500 text-2xl" />;
          } else if (quizData.sourceFile.includes('.pptx')) {
            icon = <FaRuler className="text-gray-500 text-2xl" />;
          } else if (quizData.sourceFile.includes('.docx')) {
            icon = <FaGlobe className="text-blue-500 text-2xl" />;
          }
          loadedQuests.push({
            id: docSnap.id,
            name: quizData.title,
            details: `Based on: ${quizData.sourceFile} • ${totalQuestions} questions`,
            status,
            progress: `${progress}%`,
            progressText: `${completedQuestions}/${totalQuestions} completed`,
            icon,
            quizId: quizData.id
          });
        }
        setQuests(loadedQuests);
        if (awarded) {
          // Optionally, show a notification or reload to reflect new exp/coins
        }
      } catch (error) {
        console.error('Error loading quests:', error);
      }
    };
    loadQuests();
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <FaCheckCircle className="text-xs" />
            COMPLETED
          </span>
        );
      case 'in-progress':
        return (
          <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <FaFire className="text-xs" />
            IN PROGRESS
          </span>
        );
      case 'not-started':
        return (
          <span className="bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-bold">
            NOT STARTED
          </span>
        );
      default:
        return null;
    }
  };

  const getQuestItemClasses = (status: string) => {
    const baseClasses = "bg-white rounded-xl p-6 mb-4 flex items-center cursor-pointer border-l-4 hover:shadow-xl hover:scale-[1.02] shadow-md";
    switch (status) {
      case 'completed':
        return `${baseClasses} border-l-green-500 bg-green-50/30`;
      case 'in-progress':
        return `${baseClasses} border-l-orange-500 bg-orange-50/30`;
      case 'not-started':
        return `${baseClasses} border-l-gray-400 bg-gray-50/30`;
      default:
        return baseClasses;
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }
    
    if (!user) {
      alert('Please log in to generate quizzes');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Generate quiz from file
      const generatedQuiz = await generateQuizFromFile(selectedFile);
      
      // Save to Firebase
      const questsRef = collection(db, 'quests');
      await addDoc(questsRef, {
        userId: user.uid,
        quiz: generatedQuiz,
        completedQuestions: 0,
        createdAt: new Date()
      });
      
      alert(`Successfully generated quiz "${generatedQuiz.title}" with ${generatedQuiz.questions.length} questions!`);
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      
      // Reload quests
      window.location.reload();
    } catch (error: any) {
      console.error('Error generating quiz:', error);
      alert(`Error generating quiz: ${error.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const closeInventoryModal = () => setIsInventoryModalOpen(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const fetchInventory = async () => {
    if (!user) {
      setInventory([]);
      return;
    }
    const userData = await getUser(user.uid);
    setInventory(userData?.inventory || []);
  };
  useEffect(() => {
    fetchInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  const checkInventory = async () => {
    await fetchInventory();
    setIsInventoryModalOpen(true);
  };

  const renderInventoryModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl border border-gray-500 flex flex-col items-center">
        <button
          onClick={closeInventoryModal}
          className="absolute top-4 right-4 text-2xl font-bold text-gray-700 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow"
          aria-label="Close Inventory"
        >
          ×
        </button>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl font-bold text-indigo-600">Backpack</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 w-full">
          {inventory.length === 0 ? (
            <div className="col-span-full text-center text-gray-500">
              <div className="text-6xl mb-2">📦</div>
              <p>No items in your backpack</p>
            </div>
          ) : (
            inventory.map(item => (
              <div key={item.id} className="flex flex-col items-center bg-white rounded-xl shadow p-4 border-2 border-gray-500">
                <div className="text-5xl mb-2">{item.emoji}</div>
                <div className="font-bold text-lg text-indigo-600 mb-1">{item.name}</div>
                <div className="text-gray-600 font-semibold">x{item.quantity}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const embarkOnQuest = () => {
    const inProgressQuest = quests.find(quest => quest.status === 'in-progress');
    if (inProgressQuest) {
      alert('Continuing your in-progress quest: Algebra Fundamentals');
    } else {
      alert('Select a quest from the list to begin your adventure!');
    }
  };

  const viewQuest = (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (quest && quest.quizId) {
      navigate(`/quiz/${quest.quizId}`);
    } else {
      alert('Quiz not found');
    }
  };

  return (
    <div className="min-h-screen" >
      <div className="max-w-7xl mx-auto p-5 min-h-screen flex flex-col">
        {/* Header */}
        <header className={`flex justify-between items-center mb-8 p-6 rounded-2xl shadow-lg ${
          isDarkMode 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-purple-200'
        }`}>
          <div className="flex items-center gap-8">
            <div className={`px-6 py-4 rounded-xl font-bold text-lg shadow-md ${
              isDarkMode 
                ? 'bg-purple-600 text-white' 
                : 'bg-linear-to-r from-purple-600 to-indigo-600 text-white'
            }`}>
              🎮 Questify
            </div>
            <div className={`px-6 py-4 rounded-xl font-bold text-lg shadow-md ${
              isDarkMode 
                ? 'bg-orange-600 text-white' 
                : 'bg-linear-to-r from-orange-500 to-red-500 text-white'
            }`}>
              🔥 Streak: {loadingStreak ? '...' : `${streak ?? 0} day${streak === 1 ? '' : 's'}`}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium hover:scale-105 shadow-md ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600' 
                  : 'bg-white hover:bg-gray-50 text-purple-900 border border-purple-300'
              }`}
            >
              {isDarkMode ? <IoSunnyOutline /> : <FaRegMoon />}
              <span>{isDarkMode ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </header>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 flex-1 mb-8">
          {/* Left Sidebar - Avatar */}
          <aside className="flex flex-col">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} text-white  p-6 rounded-2xl text-center font-bold shadow-lg`}>
              <h3 className="text-xl font-bold mb-6">Avatar Character</h3>
              <div className="relative">
                <div className="w-64 h-64 bg-linear-to-br from-indigo-400 to-purple-600 rounded-2xl flex items-center justify-center text-8xl shadow-lg">
                  ⚔️
                </div>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <FaStar className="text-white text-lg" />
                </div>
              </div>
            </div>
          </aside>

          {/* Quest List Container */}
          <main className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} text-white  rounded-2xl p-8 flex flex-col shadow-lg`}>
            <h2 className="text-3xl font-bold mb-8 text-center text-white">Your Study Quests</h2>
            <div className="flex-1 overflow-y-auto max-h-[600px] space-y-4">
              {quests.map(quest => (
                <div
                  key={quest.id}
                  className={getQuestItemClasses(quest.status)}
                  onClick={() => viewQuest(quest.id)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="shrink-0">{quest.icon}</div>
                    <div className="flex-1">
                      <div className="font-bold text-xl mb-2">{quest.name}</div>
                      <div className="text-sm text-gray-600 mb-3">{quest.details}</div>
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusBadge(quest.status)}
                        {quest.coins && (
                          <span className="text-green-600 font-semibold text-sm">{quest.coins}</span>
                        )}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            quest.status === 'completed' ? 'bg-green-500' :
                            quest.status === 'in-progress' ? 'bg-orange-500' : 'bg-gray-400'
                          }`}
                          style={{ width: quest.progress }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end text-sm text-gray-600 shrink-0 ml-4 mt-2">
                    <div className="text-2xl font-bold text-purple-600">{quest.progress}</div>
                    <div className="text-sm">{quest.progressText}</div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm('Restart this quest? Progress will be reset.')) {
                            await updateDoc(doc(db, 'quests', quest.id), { completedQuestions: 0 });
                            window.location.reload();
                          }
                        }}
                        className="px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-white rounded font-bold text-xs shadow"
                      >
                        Restart
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm('Delete this quest? This cannot be undone.')) {
                            await deleteDoc(doc(db, 'quests', quest.id));
                            window.location.reload();
                          }
                        }}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded font-bold text-xs shadow"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>

        {/* Bottom Navigation */}
        <nav className="flex justify-end gap-4">
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-indigo-600 text-white border-none p-6 rounded-xl font-bold text-base cursor-pointer hover:bg-indigo-700 hover:-translate-y-1"
          >
            <span>Upload Resource</span>
          </button>
          <button 
            onClick={checkInventory}
            className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-black'} p-6 rounded-xl font-bold text-base cursor-pointer hover:-translate-y-1 border border-gray-600`}
          >
            <span>Check Inventory</span>
          </button>
          {isInventoryModalOpen && renderInventoryModal()}
          <button 
            onClick={embarkOnQuest}
            className="bg-red-600 hover:bg-red-700  text-white border-none p-6 rounded-xl font-bold text-base cursor-pointer hover:-translate-y-1"
          >
            <span>Embark on Quest</span>
          </button>
        </nav>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} text-purple-900 rounded-2xl p-8 max-w-lg w-11/12 shadow-2xl`}>
            <h2 className="text-3xl font-bold mb-6 text-center text-purple-600">Upload Study Material</h2>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-6 cursor-pointer hover:border-purple-500 hover:bg-purple-50/30"
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              <FaUpload className="text-6xl text-purple-500 mb-4 mx-auto" />
              <p className="text-lg font-semibold mb-2">Click to upload</p>
              <p className="text-gray-500 text-sm">PDF, PPTX, DOCX (Max 50MB)</p>
            </div>
            <input 
              type="file" 
              id="fileInput" 
              className="hidden" 
              accept=".pdf,.pptx,.docx" 
              onChange={handleFileSelect}
            />
            {selectedFile && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg text-center text-green-700 font-semibold">
                ✓ Selected: {selectedFile.name}
              </div>
            )}
            <div className="flex gap-4">
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="flex-1 p-4 border-none rounded-xl font-bold cursor-pointer hover:-translate-y-1 bg-gray-200 text-gray-600 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpload}
                disabled={isGenerating}
                className="flex-1 p-4 border-none rounded-xl font-bold cursor-pointer hover:-translate-y-1 bg-linear-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Generating...' : 'Generate Quest'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quest;