import React, { useState, useEffect,useRef } from 'react';
import '../index.css';
import * as faceapi from 'face-api.js';
import { db } from '../firebase'; // your firebase config file
import { collection, addDoc, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth } from '../firebase';
import { storage } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Image as ImageIcon } from 'lucide-react';
import DialogflowChat from './DialogflowChat'; // Assuming you have a DialogflowChat component

import { Heart, MessageCircle, Mic, Calendar, TrendingUp, Camera, Settings, User, Moon, Sun, Activity, Smile, Meh, Frown, MicOff, Play, Pause, Square, X } from 'lucide-react';

const WellnessDashboard = () => {
  const [user, setUser] = useState(null);
  const [currentMood, setCurrentMood] = useState('');
  const [journalEntry, setJournalEntry] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [moodHistory, setMoodHistory] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const journalListenerRef = useRef(null);
  const moodListenerRef = useRef(null);
  const voiceListenerRef = useRef(null);
  const [voiceRecordings, setVoiceRecordings] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingId, setCurrentPlayingId] = useState(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [lastProcessedResultIndex, setLastProcessedResultIndex] = useState(0);
  
  // Mood Selfie states
  //const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedEmotion, setDetectedEmotion] = useState(null);
  const [faceApiLoaded, setFaceApiLoaded] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [previewSrc, setPreviewSrc] = useState(null);

  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recognitionRef = useRef(null);
  const playingAudioRef = useRef(null);
  //const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const streamRef = useRef(null);


  useEffect(() => {
    // Timer to update clock
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    // Speech Recognition setup
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setSpeechSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
    }

    // Load Face-API.js models
    loadFaceApiModels();

    // Firebase Auth listener
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // Firestore journal listener
        const journalQuery = query(
          collection(db, 'journalEntries'),
          where('uid', '==', firebaseUser.uid)
        );

        const unsubscribeJournal = onSnapshot(journalQuery, (snapshot) => {
          const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setJournalEntries(entries);
        });
        journalListenerRef.current = unsubscribeJournal;

        // Firestore mood history listener
        const moodQuery = query(
          collection(db, 'moodHistory'),
          where('uid', '==', firebaseUser.uid)
        );

        const unsubscribeMood = onSnapshot(moodQuery, (snapshot) => {
          const moods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setMoodHistory(moods);
        });
        moodListenerRef.current = unsubscribeMood;

        // Firestore voice recordings listener
        const voiceQuery = query(
          collection(db, 'voiceRecordings'),
          where('uid', '==', firebaseUser.uid)
        );

        const unsubscribeVoice = onSnapshot(voiceQuery, (snapshot) => {
          const recordings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setVoiceRecordings(recordings);
        });
        voiceListenerRef.current = unsubscribeVoice;

      } else {
        setUser(null);
        setJournalEntries([]);
        setMoodHistory([]);
        setVoiceRecordings([]);

        if (journalListenerRef.current) journalListenerRef.current();
        if (moodListenerRef.current) moodListenerRef.current();
        if (voiceListenerRef.current) voiceListenerRef.current();
      }
    });

    // Cleanup on unmount
    return () => {
      clearInterval(timer);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());

      unsubscribeAuth();
      if (journalListenerRef.current) journalListenerRef.current();
      if (moodListenerRef.current) moodListenerRef.current();
    };
}, []);

useEffect(() => {
  if (!previewSrc || !faceApiLoaded) return;
  
  // Don't auto-analyze, let user trigger it manually
  console.log('Image preview set:', previewSrc);
}, [previewSrc, faceApiLoaded]);



// Fixed handleImageUpload function
const handleImageUpload = (event) => {
  const file = event.target.files[0];
  console.log('File selected:', file);
  
  if (!file) {
    console.log('No file selected');
    return;
  }
  
  if (!faceApiLoaded) {
    alert('AI models are still loading. Please wait a moment and try again.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const result = e.target.result;
    console.log('File read successfully, setting preview');
    setPreviewSrc(result);
    setDetectedEmotion(null); // Clear previous results
  };
  
  reader.onerror = (error) => {
    console.error('Error reading file:', error);
    alert('Error reading the selected file. Please try again.');
  };
  
  reader.readAsDataURL(file);
};

// Fixed analyzeImage function
const analyzeImage = async () => {
  if (!imageRef.current || !canvasRef.current || !previewSrc) {
    console.log('Missing required elements for analysis');
    return;
  }

  console.log('Starting image analysis...');
  setIsAnalyzing(true);
  
  try {
    // Ensure image is loaded
    const img = imageRef.current;
    if (!img.complete || !img.naturalWidth) {
      console.log('Image not fully loaded yet');
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        // If image is already loaded but onload didn't fire
        if (img.complete) resolve();
      });
    }

    const canvas = canvasRef.current;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    console.log('Canvas prepared, running face detection...');

    const detections = await faceapi
      .detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions();

    console.log('Detections:', detections);

    if (detections.length === 0) {
      alert("No face detected in the image. Please try with a clearer photo showing your face.");
      return;
    }

    const expressions = detections[0].expressions;
    const emotion = Object.keys(expressions).reduce((a, b) =>
      expressions[a] > expressions[b] ? a : b
    );
    const confidence = Math.round(expressions[emotion] * 100);

    const emotionToMood = {
      happy: "great",
      neutral: "okay", 
      sad: "sad",
      angry: "low",
      fearful: "low",
      disgusted: "low",
      surprised: "good",
    };

    const detectedMood = emotionToMood[emotion] || "okay";

    const result = {
      emotion,
      confidence,
      mood: detectedMood,
      timestamp: new Date().toLocaleString(),
    };

    console.log('Analysis result:', result);
    setDetectedEmotion(result);

    // Auto-save the mood
    await handleMoodSelect(detectedMood, true, `AI detected from selfie: ${emotion} (${confidence}% confidence)`);

  } catch (err) {
    console.error("Error during analysis:", err);
    alert("Failed to analyze image. Please try again.");
  } finally {
    setIsAnalyzing(false);
  }
};


  const loadFaceApiModels = async () => {
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceExpressionNet.loadFromUri('/models');
      setFaceApiLoaded(true);
      console.log('Face API models loaded successfully');
    } catch (error) {
      console.error('Error loading Face-API models:', error);
      alert('Failed to load AI models. Please try again.');
    }
  };

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };


  const moods = [
    { id: 'great', icon: '😊', color: 'bg-green-500', label: 'Great', score: 9 },
    { id: 'good', icon: '🙂', color: 'bg-blue-500', label: 'Good', score: 7 },
    { id: 'okay', icon: '😐', color: 'bg-yellow-500', label: 'Okay', score: 5 },
    { id: 'low', icon: '😔', color: 'bg-orange-500', label: 'Low', score: 3 },
    { id: 'sad', icon: '😢', color: 'bg-red-500', label: 'Sad', score: 1 }
  ];

  const handleMoodSelect = async (moodId, isAiDetected = false, note = '') => {
    setCurrentMood(moodId);
    const selectedMood = moods.find(m => m.id === moodId);

    const newMoodEntry = {
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(),
      mood: moodId,
      score: selectedMood.score,
      timestamp: Date.now(),
      isAiDetected,
      note,
      uid: user?.uid || ''  // assuming 'user' is in state
    };

    try {
      await addDoc(collection(db, 'moodHistory'), newMoodEntry);
    } catch (error) {
      console.error('Failed to save mood entry:', error);
      alert('Failed to save mood entry. Please try again.');
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
  
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
  
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
  
        const formData = new FormData();
        formData.append('file', audioBlob);
        formData.append('upload_preset', 'voice_uploads');
  
        try {
          const cloudinaryRes = await fetch('https://api.cloudinary.com/v1_1/drpqytgbz/video/upload', {
            method: 'POST',
            body: formData,
          });
  
          const cloudinaryData = await cloudinaryRes.json();
  
          if (!cloudinaryRes.ok) {
            console.error('Cloudinary upload error:', cloudinaryData);
            throw new Error(cloudinaryData.error?.message || 'Upload failed');
          }
  
          const audioUrl = cloudinaryData.secure_url;
  
          const newRecording = {
            id: Date.now(),
            uid: user.uid,
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            duration: recordingTime,
            url: audioUrl,
            timestamp: Date.now(),
          };
  
          await addDoc(collection(db, 'voiceRecordings'), newRecording);
          setVoiceRecordings((prev) => [...prev, newRecording]);
  
        } catch (error) {
          console.error('Error uploading to Cloudinary:', error);
          alert('Failed to upload recording');
        }
  
        stream.getTracks().forEach(track => track.stop());
      };
  
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      setLastProcessedResultIndex(0); // Reset the processed index
  
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
  
      if (speechSupported && recognitionRef.current) {
        // Fixed speech recognition handler
        recognitionRef.current.onresult = (event) => {
          let newTranscript = '';
          
          // Only process new results that haven't been processed yet
          for (let i = lastProcessedResultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            
            // Only add final results to avoid duplicates from interim results
            if (result.isFinal) {
              newTranscript += result[0].transcript + ' ';
            }
          }
          
          // Update the last processed index
          setLastProcessedResultIndex(event.results.length);
          
          // Only update journal entry if we have new final transcript
          if (newTranscript.trim()) {
            setJournalEntry(prev => prev + newTranscript);
          }
        };
  
        // Handle speech recognition errors
        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'no-speech') {
            // Restart recognition if no speech detected
            if (isRecording) {
              recognitionRef.current.start();
            }
          }
        };
  
        // Restart recognition when it ends (for continuous recording)
        recognitionRef.current.onend = () => {
          if (isRecording) {
            recognitionRef.current.start();
            setLastProcessedResultIndex(0); // Reset index when restarting
          }
        };
  
        recognitionRef.current.start();
      }
  
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };
  

  const stopVoiceRecording = () => {
  if (mediaRecorderRef.current && isRecording) {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setLastProcessedResultIndex(0); // Reset when stopping
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    if (speechSupported && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }
};

  const handleVoiceRecord = () => {
    if (isRecording) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  const playRecording = (recording) => {
    if (isPlaying && currentPlayingId === recording.id) {
      playingAudioRef.current?.pause();
      setIsPlaying(false);
      setCurrentPlayingId(null);
    } else {
      if (playingAudioRef.current) {
        playingAudioRef.current.pause();
      }
      
      playingAudioRef.current = new Audio(recording.url);
      playingAudioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentPlayingId(null);
      };
      
      playingAudioRef.current.play();
      setIsPlaying(true);
      setCurrentPlayingId(recording.id);
    }
  };

  const saveJournalEntry = async () => {
    if (!user) {
      alert('You must be logged in to save entries.');
      return;
    }

    if (journalEntry.trim()) {
      const newEntry = {
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        content: journalEntry,
        mood: currentMood,
        timestamp: Date.now(),
        uid: user.uid
      };

      try {
        await addDoc(collection(db, 'journalEntries'), newEntry);
        setJournalEntry('');
        alert('Journal entry saved!');
      } catch (error) {
        console.error('Error saving journal entry:', error);
        alert('Failed to save journal entry. Please try again.');
      }
    }
  };

  const analyzeMood = () => {
    if (journalEntry.trim()) {
      const positiveWords = ['happy', 'great', 'good', 'amazing', 'wonderful', 'fantastic', 'excellent', 'joy', 'love', 'excited'];
      const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'depressed', 'angry', 'frustrated', 'worried', 'anxious', 'stressed'];
      
      const words = journalEntry.toLowerCase().split(' ');
      const positiveCount = words.filter(word => positiveWords.includes(word)).length;
      const negativeCount = words.filter(word => negativeWords.includes(word)).length;
      
      let suggestedMood = 'okay';
      if (positiveCount > negativeCount) {
        suggestedMood = positiveCount > 2 ? 'great' : 'good';
      } else if (negativeCount > positiveCount) {
        suggestedMood = negativeCount > 2 ? 'sad' : 'low';
      }
      
      setCurrentMood(suggestedMood);
      alert(`Based on your journal entry, you seem to be feeling ${suggestedMood}. Would you like to log this mood?`);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMoodTrend = () => {
    if (moodHistory.length < 2) return { trend: 'neutral', percentage: 0 };
    
    const recent = moodHistory.slice(-7);
    const older = moodHistory.slice(-14, -7);
    
    const recentAvg = recent.reduce((sum, entry) => sum + entry.score, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, entry) => sum + entry.score, 0) / older.length : recentAvg;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    return {
      trend: change > 5 ? 'up' : change < -5 ? 'down' : 'neutral',
      percentage: Math.abs(Math.round(change))
    };
  };

  const FeatureCard = ({ icon: Icon, title, description, action, gradient, children }) => (
    <div className={`relative overflow-hidden rounded-2xl p-6 shadow-lg backdrop-blur-sm border border-white/20 ${gradient} transition-all duration-300 hover:scale-105 hover:shadow-xl`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
        </div>
        <p className="text-white/80 mb-4">{description}</p>
        {children}
        {action && (
          <button className="mt-4 px-6 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white font-medium hover:bg-white/30 transition-colors">
            {action}
          </button>
        )}
      </div>
    </div>
  );

  const MoodChart = () => {
    const chartData = moodHistory.slice(-7);
    const maxScore = Math.max(...chartData.map(d => d.score), 10);
    
    return (
      <div className="flex items-end gap-2 h-20">
        {chartData.map((data, index) => (
          <div key={index} className="flex flex-col items-center gap-1">
            <div 
              className={`w-6 rounded-t-lg transition-all duration-500 ${
                data.isAiDetected ? 'bg-gradient-to-t from-purple-500 to-pink-500' : 'bg-gradient-to-t from-blue-500 to-cyan-500'
              }`}
              style={{ height: `${(data.score / maxScore) * 100}%` }}
              title={data.isAiDetected ? 'AI Detected' : 'Manual Entry'}
            ></div>
            <span className="text-xs text-white/60">{new Date(data.date).getDate()}</span>
          </div>
        ))}
      </div>
    );
  };

  // Fixed CameraModal component
  const CameraModal = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Mood Selfie Analysis</h2>
              <button
                onClick={() => {
                  setShowMoodModal(false);
                  setPreviewSrc(null);
                  setDetectedEmotion(null);
                }}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* File Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Choose a photo of yourself
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full text-sm text-gray-300
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-pink-600 file:text-white
                  hover:file:bg-pink-700
                  file:cursor-pointer cursor-pointer
                  border border-gray-600 rounded-lg
                  focus:border-pink-500 focus:outline-none"
              />
            </div>

            {/* Image Preview */}
            {previewSrc && (
              <div className="mb-4">
                <img
                  ref={imageRef}
                  src={previewSrc}
                  alt="Preview"
                  className="w-full max-h-64 object-contain rounded-lg border-2 border-gray-600"
                  style={{ display: 'block' }}
                />
              </div>
            )}

            {/* Hidden Canvas */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Analyze Button */}
            {previewSrc && !isAnalyzing && !detectedEmotion && (
              <button
                onClick={analyzeImage}
                disabled={!faceApiLoaded}
                className="w-full mb-4 py-3 px-4 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
              >
                {faceApiLoaded ? 'Analyze My Mood' : 'Loading AI Models...'}
              </button>
            )}

            {/* Loading State */}
            {isAnalyzing && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-2"></div>
                <p className="text-white text-sm">Analyzing your expression...</p>
              </div>
            )}

            {/* Results */}
            {detectedEmotion && (
              <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg p-4 border border-purple-500/30">
                <h3 className="text-lg font-semibold text-white mb-3 text-center">Analysis Results</h3>
                <div className="space-y-2 text-center">
                  <p className="text-xl font-bold text-pink-300 capitalize">
                    {detectedEmotion.emotion}
                  </p>
                  <p className="text-sm text-purple-200">
                    Confidence: {detectedEmotion.confidence}%
                  </p>
                  <p className="text-sm text-blue-200">
                    Mood: <span className="font-semibold capitalize">{detectedEmotion.mood}</span>
                  </p>
                  <div className="mt-4 pt-3 border-t border-gray-600">
                    <p className="text-sm text-green-300">
                      ✅ Mood saved to your history!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Face API Status */}
            {!faceApiLoaded && (
              <div className="bg-yellow-900/50 border border-yellow-600/50 rounded-lg p-3 text-center">
                <p className="text-sm text-yellow-200">
                  🔄 Loading AI models... Please wait.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Debug function - add this temporarily to check if modal opens
  const debugModalOpen = () => {
    console.log('Modal button clicked');
    console.log('showMoodModal state:', showMoodModal);
    setShowMoodModal(true);
    console.log('setShowMoodModal(true) called');
  };

  const trendData = getMoodTrend();

  return (
    <div className={`min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900'}`}>
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 shadow-lg">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Mental Wellness Companion</h1>
              <p className="text-purple-200">Your personal space for emotional wellbeing</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-white font-medium">{currentTime.toLocaleDateString()}</p>
              <p className="text-purple-200 text-sm">{currentTime.toLocaleTimeString()}</p>
            </div>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-3 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
            >
              {isDarkMode ? <Sun className="w-6 h-6 text-white" /> : <Moon className="w-6 h-6 text-white" />}
            </button>
            <button className="p-3 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors">
              <User className="w-6 h-6 text-white" />
            </button>
          </div>
        </header>
         <div className="w-72">
            <DialogflowChat />
          </div>
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <FeatureCard
            icon={Smile}
            title="Mood Check-in"
            description="How are you feeling today?"
            gradient="bg-gradient-to-br from-green-500/80 to-emerald-600/80"
          >
            <div className="flex gap-2 flex-wrap mb-4">
              {moods.map(mood => (
                <button
                  key={mood.id}
                  onClick={() => handleMoodSelect(mood.id)}
                  className={`p-2 rounded-lg text-2xl transition-all ${
                    currentMood === mood.id 
                      ? 'bg-white/30 scale-110 ring-2 ring-white/50' 
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                  title={mood.label}
                >
                  {mood.icon}
                </button>
              ))}
            </div>
            {currentMood && (
              <p className="text-white/90 text-sm">
                Current mood: {moods.find(m => m.id === currentMood)?.label}
              </p>
            )}
          </FeatureCard>

          <FeatureCard
            icon={Mic}
            title="Voice Journal"
            description="Speak your thoughts freely"
            gradient="bg-gradient-to-br from-purple-500/80 to-violet-600/80"
          >
            <div className="flex items-center gap-4">
              <button
                onClick={handleVoiceRecord}
                className={`p-4 rounded-full transition-all ${
                  isRecording 
                    ? 'bg-red-500 animate-pulse' 
                    : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                {isRecording ? (
                  <Square className="w-6 h-6 text-white" />
                ) : (
                  <Mic className="w-6 h-6 text-white" />
                )}
              </button>
              <div className="flex-1">
                {isRecording && (
                  <div className="text-white/90">
                    <p className="text-sm">Recording...</p>
                    <p className="text-lg font-mono">{formatTime(recordingTime)}</p>
                  </div>
                )}
                {!speechSupported && (
                  <p className="text-white/60 text-xs">Speech recognition not supported</p>
                )}
              </div>
            </div>
          </FeatureCard>

          <FeatureCard
            icon={ImageIcon} // Use a relevant icon like 'ImageIcon' instead of Camera
            title="Mood Selfie"
            description="AI-powered mood detection from your facial expressions"
            gradient="bg-gradient-to-br from-pink-500/80 to-rose-600/80"
          >
            <div className="space-y-3">
              <button
                onClick={debugModalOpen} // Use this instead of () => setShowMoodModal(true)
                className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white font-medium hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
              >
                <ImageIcon className="w-5 h-5" />
                Upload Mood Selfie
              </button>

              {detectedEmotion && (
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <p className="text-white/90 text-sm">Last detected:</p>
                  <p className="text-white font-semibold capitalize">
                    {detectedEmotion.emotion}
                  </p>
                  <p className="text-white/70 text-xs">
                    {detectedEmotion.confidence}% confidence
                  </p>
                </div>
              )}
            </div>
          </FeatureCard>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Journal Entry */}
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-6 h-6" />
              Today's Journal
            </h2>
            <textarea
              value={journalEntry}
              onChange={(e) => setJournalEntry(e.target.value)}
              placeholder="How was your day? What's on your mind? Share your thoughts here..."
              className="w-full h-40 p-4 bg-white/10 backdrop-blur-sm rounded-xl text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              maxLength={2000}
            />
            <div className="flex justify-between items-center mt-4">
              <div className="flex gap-2">
                <button 
                  onClick={analyzeMood}
                  className="px-4 py-2 bg-purple-500/20 rounded-lg text-white hover:bg-purple-500/30 transition-colors"
                  disabled={!journalEntry.trim()}
                >
                  Analyze Mood
                </button>
                <button 
                  onClick={saveJournalEntry}
                  className="px-4 py-2 bg-blue-500/20 rounded-lg text-white hover:bg-blue-500/30 transition-colors"
                  disabled={!journalEntry.trim()}
                >
                  Save Entry
                </button>
              </div>
              <span className="text-white/60 text-sm">{journalEntry.length}/2000 characters</span>
            </div>
            <div className="mt-6 max-h-64 overflow-y-auto bg-white/10 rounded-lg p-4 border border-white/20 text-white">
              <h3 className="font-semibold mb-2">Your Past Journal Entries</h3>
              {journalEntries.length === 0 ? (
                <p>No entries yet.</p>
              ) : (
                journalEntries.map(entry => (
                  <div key={entry.id} className="mb-3 border-b border-white/20 pb-2">
                    <p><strong>{entry.date} {entry.time}</strong></p>
                    <p>{entry.content}</p>
                    <p className="text-sm text-white/60">Mood: {entry.mood}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Mood Trends */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Mood Trends
            </h2>
            <div className="mb-4">
              <p className="text-white/80 mb-2">7-day mood history</p>
              <MoodChart />
              <div className="flex justify-between text-xs text-white/60 mt-2">
                <span>🔵 Manual</span>
                <span>🟣 AI Detected</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/80">Trend</span>
                <span className={`font-semibold ${
                  trendData.trend === 'up' ? 'text-green-400' : 
                  trendData.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {trendData.trend === 'up' ? '↑' : trendData.trend === 'down' ? '↓' : '→'} {trendData.percentage}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">Entries</span>
                <span className="text-purple-400 font-semibold">{moodHistory.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">Recordings</span>
                <span className="text-blue-400 font-semibold">{voiceRecordings.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">AI Detections</span>
                <span className="text-pink-400 font-semibold">{moodHistory.filter(m => m.isAiDetected).length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Voice Recordings */}
        {voiceRecordings.length > 0 && (
          <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Mic className="w-6 h-6" />
              Voice Recordings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {voiceRecordings.slice(-6).map((recording) => (
                <div key={recording.id} className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{recording.date}</span>
                    <span className="text-white/60 text-sm">{formatTime(recording.duration)}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => playRecording(recording)}
                      className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                      disabled={!recording.url}
                    >
                      {isPlaying && currentPlayingId === recording.id ? (
                        <Pause className="w-4 h-4 text-white" />
                      ) : (
                        <Play className="w-4 h-4 text-white" />
                      )}
                    </button>
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                    </div>
                  </div>
                  <span className="text-white/40 text-xs">{recording.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activities */}
        <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Recent Activities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {moodHistory.slice(-3).map((entry, index) => (
              <div key={entry.id} className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-2 h-2 rounded-full ${moods.find(m => m.id === entry.mood)?.color || 'bg-gray-500'}`}></div>
                  <span className="text-white font-medium">
                    {entry.isAiDetected ? '🤖 ' : ''}
                    Mood: {moods.find(m => m.id === entry.mood)?.label}
                  </span>
                </div>
                <p className="text-white/60 text-sm">
                  {entry.isAiDetected ? 'AI detected mood' : 'Manual mood entry'}
                </p>
                {entry.note && (
                  <p className="text-white/50 text-xs mt-1">{entry.note}</p>
                )}
                <span className="text-white/40 text-xs">{entry.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add this debugging info temporarily */}
      {console.log('Render - showMoodModal:', showMoodModal)}

      {/* Camera Modal - put this at the very end of your return statement */}
      {showMoodModal && (
        <div>
          {console.log('Modal should be rendering now')}
          <CameraModal />
        </div>
      )}
    </div>
  );
};

export default WellnessDashboard;
