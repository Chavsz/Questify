import { useState } from "react";
import { useTheme } from "../components/theme";
import { IoSunnyOutline } from "react-icons/io5";
import { FaRegMoon } from "react-icons/fa";
import { Link } from "react-router-dom";
import { 
  FaLaptop, 
  FaRuler, 
  FaGlobe, 
  FaFlask, 
  FaHome, 
  FaUpload, 
  FaCube, 
  FaStar,
  FaFire,
  FaCheckCircle
} from "react-icons/fa";

interface QuestItem {
  id: string;
  name: string;
  details: string;
  status: 'completed' | 'in-progress' | 'not-started';
  progress: string;
  progressText: string;
  icon: React.ReactNode;
  coins?: string;
}

const Quest = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const quests: QuestItem[] = [
    {
      id: 'quest1',
      name: 'Introduction to Programming',
      details: 'Based on: Python_Basics.pdf • 20 questions',
      status: 'completed',
      progress: '100%',
      progressText: '20/20 completed',
      icon: <FaLaptop className="text-blue-500 text-2xl" />,
      coins: '+500 coins earned'
    },
    {
      id: 'quest2',
      name: 'Algebra Fundamentals',
      details: 'Based on: Math_Chapter3.pptx • 15 questions',
      status: 'in-progress',
      progress: '60%',
      progressText: '9/15 completed',
      icon: <FaRuler className="text-gray-500 text-2xl" />
    },
    {
      id: 'quest3',
      name: 'World History 1900s',
      details: 'Based on: History_Notes.docx • 25 questions',
      status: 'not-started',
      progress: '0%',
      progressText: '0/25 completed',
      icon: <FaGlobe className="text-blue-500 text-2xl" />
    },
    {
      id: 'quest4',
      name: 'Chemistry Basics',
      details: 'Based on: Chemistry_101.pdf • 18 questions',
      status: 'not-started',
      progress: '0%',
      progressText: '0/18 completed',
      icon: <FaFlask className="text-green-500 text-2xl" />
    }
  ];

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
    const baseClasses = "bg-white rounded-xl p-6 mb-4 flex items-center transition-all duration-300 cursor-pointer border-l-4 hover:shadow-xl hover:scale-[1.02] shadow-md";
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

  const handleUpload = () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }
    
    alert(`Generating quest from "${selectedFile.name}"...\n\nThis will use AI to analyze your content and create interactive questions!`);
    setIsUploadModalOpen(false);
    setSelectedFile(null);
  };

  const navigateToHub = () => {
    console.log('Navigate to Hub');
  };

  const checkInventory = () => {
    alert('Opening inventory...\n\nHere you can view:\n• Healing Potions: 3\n• Clue Tokens: 5\n• Equipped Items\n• Available Items');
  };

  const embarkOnQuest = () => {
    const inProgressQuest = quests.find(quest => quest.status === 'in-progress');
    if (inProgressQuest) {
      alert('Continuing your in-progress quest: Algebra Fundamentals');
    } else {
      alert('Select a quest from the list to begin your adventure!');
    }
  };

  const viewQuest = (questId: string) => {
    alert(`Opening quest details for: ${questId}\n\nThis will show:\n• Quest overview\n• Number of questions\n• Rewards\n• Your progress`);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 to-indigo-100'} transition-colors duration-300`}>
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
              🔥 Streak: 5 days
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 shadow-md ${
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
                    <div className="shrink-0">
                      {quest.icon}
                    </div>
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
                  <div className="text-right text-sm text-gray-600 shrink-0 ml-4">
                    <div className="text-2xl font-bold text-purple-600">{quest.progress}</div>
                    <div className="text-sm">{quest.progressText}</div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>

        {/* Bottom Navigation */}
        <nav className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/Questify"
            onClick={navigateToHub}
            className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-purple-600'}  p-6 rounded-xl font-bold text-base cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col items-center gap-3 shadow-lg`}
          >
            <FaHome className="text-3xl text-gray-700" />
            <span>Back to Hub</span>
          </Link>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-linear-to-r from-purple-600 to-indigo-600 text-white border-none p-6 rounded-xl font-bold text-base cursor-pointer transition-all duration-300 hover:from-purple-700 hover:to-indigo-700 hover:-translate-y-1 hover:shadow-xl flex flex-col items-center gap-3 shadow-lg"
          >
            <FaUpload className="text-3xl text-white" />
            <span>Upload Resource</span>
          </button>
          <button 
            onClick={checkInventory}
            className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-purple-600'} p-6 rounded-xl font-bold text-base cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col items-center gap-3 shadow-lg`}
          >
            <FaCube className="text-3xl text-purple" />
            <span>Check Inventory</span>
          </button>
          <button 
            onClick={embarkOnQuest}
            className="bg-linear-to-r from-green-500 to-emerald-600 text-white border-none p-6 rounded-xl font-bold text-base cursor-pointer transition-all duration-300 hover:from-green-600 hover:to-emerald-700 hover:-translate-y-1 hover:shadow-xl flex flex-col items-center gap-3 shadow-lg"
          >
            <FaStar className="text-3xl text-white" />
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
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-6 cursor-pointer transition-all duration-300 hover:border-purple-500 hover:bg-purple-50/30"
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              <FaUpload className="text-6xl text-purple-500 mb-4 mx-auto" />
              <p className="text-lg font-semibold mb-2">Click to upload or drag and drop</p>
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
                className="flex-1 p-4 border-none rounded-xl font-bold cursor-pointer transition-all duration-300 hover:-translate-y-1 bg-gray-200 text-gray-600 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpload}
                className="flex-1 p-4 border-none rounded-xl font-bold cursor-pointer transition-all duration-300 hover:-translate-y-1 bg-linear-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
              >
                Generate Quest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quest;