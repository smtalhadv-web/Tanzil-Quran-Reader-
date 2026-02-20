/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Book, 
  Search, 
  Play, 
  Pause, 
  Bookmark, 
  ChevronLeft, 
  ChevronRight,
  Settings,
  Menu,
  X,
  Volume2,
  List,
  ArrowRight,
  ArrowLeft,
  Info,
  Type,
  Moon,
  Sun,
  Share2,
  Trash2,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Types
interface Sura {
  id: number;
  name_arabic: string;
  name_complex: string;
  name_simple: string;
  verses_count: number;
  revelation_place: string;
}

interface Verse {
  id: number;
  verse_number: number;
  text_uthmani: string;
  text_indopak: string;
  translations?: { text: string; resource_id: number }[];
  audio?: { url: string };
}

interface BookmarkData {
  id: number;
  sura_number: number;
  ayah_number: number;
  created_at: string;
}

const QURAN_API = "https://api.quran.com/api/v4";

export default function App() {
  const [suras, setSuras] = useState<Sura[]>([]);
  const [currentSura, setCurrentSura] = useState<number>(1);
  const [currentAyah, setCurrentAyah] = useState<number>(1);
  const [currentJuz, setCurrentJuz] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [navigationMode, setNavigationMode] = useState<"chapter" | "juz" | "page">("chapter");
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [reciterId, setReciterId] = useState(7); // Default to Al-Afasy
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [activeVerse, setActiveVerse] = useState<number | null>(null);
  const [fontSize, setFontSize] = useState(24);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"translation" | "mushaf">("mushaf");
  const [scriptType, setScriptType] = useState<"uthmani" | "indopak">("uthmani");
  const [fontFamily, setFontFamily] = useState<"amiri" | "nastaliq" | "scheherazade" | "lateef" | "kufi">("amiri");
  const [lastRead, setLastRead] = useState<{ sura: number; ayah: number } | null>(null);

  const readerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSuras();
    fetchBookmarks();
    
    const savedLastRead = localStorage.getItem("lastRead");
    if (savedLastRead) {
      setLastRead(JSON.parse(savedLastRead));
    }
  }, []);

  useEffect(() => {
    fetchVerses(currentSura);
  }, [currentSura, scriptType, reciterId]);

  const fetchSuras = async () => {
    try {
      const res = await fetch(`${QURAN_API}/chapters?language=en`);
      const data = await res.json();
      setSuras(data.chapters);
    } catch (err) {
      console.error("Failed to fetch suras", err);
    }
  };

  const fetchVerses = async (suraNum: number) => {
    setLoading(true);
    try {
      const scriptField = scriptType === "uthmani" ? "text_uthmani" : "text_indopak";
      const res = await fetch(
        `${QURAN_API}/verses/by_chapter/${suraNum}?language=en&words=false&audio=${reciterId}&fields=${scriptField}&per_page=300`
      );
      const data = await res.json();
      setVerses(data.verses);
      
      // Update Juz and Page based on the first verse
      if (data.verses.length > 0) {
        const firstVerse = data.verses[0];
        // The API might not return juz/page in this specific call unless requested, 
        // but for now we'll just keep the state.
      }
    } catch (err) {
      console.error("Failed to fetch verses", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVersesByJuz = async (juzNum: number) => {
    setLoading(true);
    try {
      const scriptField = scriptType === "uthmani" ? "text_uthmani" : "text_indopak";
      const res = await fetch(
        `${QURAN_API}/verses/by_juz/${juzNum}?language=en&words=false&audio=${reciterId}&fields=${scriptField}&per_page=300`
      );
      const data = await res.json();
      setVerses(data.verses);
      if (data.verses.length > 0) {
        // Extract sura from first verse: "1:1" -> 1
        const suraId = parseInt(data.verses[0].verse_key.split(':')[0]);
        setCurrentSura(suraId);
      }
    } catch (err) {
      console.error("Failed to fetch juz", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVersesByPage = async (pageNum: number) => {
    setLoading(true);
    try {
      const scriptField = scriptType === "uthmani" ? "text_uthmani" : "text_indopak";
      const res = await fetch(
        `${QURAN_API}/verses/by_page/${pageNum}?language=en&words=false&audio=${reciterId}&fields=${scriptField}&per_page=300`
      );
      const data = await res.json();
      setVerses(data.verses);
      if (data.verses.length > 0) {
        const suraId = parseInt(data.verses[0].verse_key.split(':')[0]);
        setCurrentSura(suraId);
      }
    } catch (err) {
      console.error("Failed to fetch page", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuraChange = (id: number) => {
    setNavigationMode("chapter");
    setCurrentSura(id);
    fetchVerses(id);
  };

  const handleJuzChange = (id: number) => {
    setNavigationMode("juz");
    setCurrentJuz(id);
    fetchVersesByJuz(id);
  };

  const handlePageChange = (id: number) => {
    setNavigationMode("page");
    setCurrentPage(id);
    fetchVersesByPage(id);
  };

  const navigateNext = () => {
    if (navigationMode === "chapter" && currentSura < 114) handleSuraChange(currentSura + 1);
    else if (navigationMode === "juz" && currentJuz < 30) handleJuzChange(currentJuz + 1);
    else if (navigationMode === "page" && currentPage < 604) handlePageChange(currentPage + 1);
  };

  const navigatePrev = () => {
    if (navigationMode === "chapter" && currentSura > 1) handleSuraChange(currentSura - 1);
    else if (navigationMode === "juz" && currentJuz > 1) handleJuzChange(currentJuz - 1);
    else if (navigationMode === "page" && currentPage > 1) handlePageChange(currentPage - 1);
  };

  const fetchBookmarks = async () => {
    const res = await fetch("/api/bookmarks");
    const data = await res.json();
    setBookmarks(data);
  };

  const addBookmark = async (sura: number, ayah: number) => {
    await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sura_number: sura, ayah_number: ayah }),
    });
    fetchBookmarks();
  };

  const removeBookmark = async (id: number) => {
    await fetch(`/api/bookmarks/${id}`, { method: "DELETE" });
    fetchBookmarks();
  };

  const sharePage = () => {
    const url = window.location.href;
    const text = `Read Sura ${suras.find(s => s.id === currentSura)?.name_simple} on Tanzil Reader`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Tanzil Reader',
        text: text,
        url: url,
      }).catch(console.error);
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  const shareOnSocial = (platform: 'twitter' | 'facebook' | 'whatsapp') => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Read Sura ${suras.find(s => s.id === currentSura)?.name_simple} on Tanzil Reader`);
    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${text}%20${url}`;
        break;
    }

    window.open(shareUrl, '_blank');
  };

  const playVerseAudio = async (verseNum: number) => {
    const verse = verses.find(v => v.verse_number === verseNum);
    if (!verse?.audio?.url) {
      console.error("Audio URL not found for verse", verseNum);
      return;
    }

    if (currentAudio) {
      currentAudio.pause();
    }

    // Ensure URL is absolute
    const audioUrl = verse.audio.url.startsWith("http") 
      ? verse.audio.url 
      : `https:${verse.audio.url.startsWith("//") ? "" : "//audio.qurancdn.com/"}${verse.audio.url}`;
    
    const audio = new Audio(audioUrl);
    setCurrentAudio(audio);
    setActiveVerse(verseNum);
    setIsPlaying(true);
    
    const newLastRead = { sura: currentSura, ayah: verseNum };
    setLastRead(newLastRead);
    localStorage.setItem("lastRead", JSON.stringify(newLastRead));
    
    audio.play().catch(err => {
      console.error("Playback failed for URL:", audioUrl, err);
      setIsPlaying(false);
      setActiveVerse(null);
    });

    audio.onended = () => {
      setIsPlaying(false);
      setActiveVerse(null);
      
      // Auto-play next verse if available
      const nextVerse = verses.find(v => v.verse_number === verseNum + 1);
      if (nextVerse) {
        playVerseAudio(nextVerse.verse_number);
      }
    };
  };

  const togglePlay = () => {
    if (currentAudio) {
      if (isPlaying) {
        currentAudio.pause();
      } else {
        currentAudio.play().catch(err => console.error("Resume failed", err));
      }
      setIsPlaying(!isPlaying);
    } else if (verses.length > 0) {
      // If nothing is playing, start from the first verse
      playVerseAudio(verses[0].verse_number);
    }
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    setIsPlaying(false);
    setActiveVerse(null);
    setCurrentAudio(null);
  };

  const scrollToAyah = (ayahNum: number) => {
    const element = document.getElementById(`ayah-${ayahNum}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  useEffect(() => {
    if (activeVerse) {
      scrollToAyah(activeVerse);
    }
  }, [activeVerse]);

  return (
    <div className="flex h-screen bg-[#f4f4f4] text-[#333] font-inter overflow-hidden">
      {/* Tanzil-style Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 0 }}
        className="bg-[#eee] border-r border-[#ccc] flex flex-col overflow-hidden relative z-20 shadow-sm"
      >
        <div className="p-4 border-b border-[#ccc] bg-[#ddd] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Book className="w-5 h-5 text-[#555]" />
            <h1 className="font-bold text-sm uppercase tracking-tight text-[#444]">Tanzil Navigation</h1>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 hover:bg-[#ccc] rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
          {/* Navigation Selectors */}
          <div className="bg-white p-3 rounded border border-[#ccc] shadow-sm space-y-3">
            <div className="flex gap-1">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-[#777] uppercase">Sura</label>
                <select 
                  value={currentSura}
                  onChange={(e) => handleSuraChange(Number(e.target.value))}
                  className="w-full p-1.5 bg-[#f9f9f9] border border-[#ccc] rounded text-xs outline-none focus:border-[#5a5a40]"
                >
                  {suras.map(s => (
                    <option key={s.id} value={s.id}>{s.id}. {s.name_simple}</option>
                  ))}
                </select>
              </div>
              <div className="w-16 space-y-1">
                <label className="text-[10px] font-bold text-[#777] uppercase">Ayah</label>
                <select 
                  value={currentAyah}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCurrentAyah(val);
                    scrollToAyah(val);
                  }}
                  className="w-full p-1.5 bg-[#f9f9f9] border border-[#ccc] rounded text-xs outline-none focus:border-[#5a5a40]"
                >
                  {Array.from({ length: suras.find(s => s.id === currentSura)?.verses_count || 0 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end pb-0.5">
                <button 
                  onClick={() => scrollToAyah(currentAyah)}
                  className="p-1.5 bg-[#5a5a40] text-white rounded text-[10px] font-bold hover:bg-[#4a4a30]"
                >
                  GO
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#777] uppercase">Juz</label>
                <select 
                  value={currentJuz}
                  onChange={(e) => handleJuzChange(Number(e.target.value))}
                  className="w-full p-1.5 bg-[#f9f9f9] border border-[#ccc] rounded text-xs outline-none focus:border-[#5a5a40]"
                >
                  {Array.from({ length: 30 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#777] uppercase">Page</label>
                <select 
                  value={currentPage}
                  onChange={(e) => handlePageChange(Number(e.target.value))}
                  className="w-full p-1.5 bg-[#f9f9f9] border border-[#ccc] rounded text-xs outline-none focus:border-[#5a5a40]"
                >
                  {Array.from({ length: 604 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white p-3 rounded border border-[#ccc] shadow-sm space-y-2">
            <label className="text-[10px] font-bold text-[#777] uppercase">Search</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#999]" />
              <input 
                type="text" 
                placeholder="Search sura..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 bg-[#f9f9f9] border border-[#ccc] rounded text-xs outline-none focus:border-[#5a5a40]"
              />
            </div>
          </div>

          {/* Display Settings */}
          <div className="bg-white p-3 rounded border border-[#ccc] shadow-sm space-y-3">
            <label className="text-[10px] font-bold text-[#777] uppercase">Display Settings</label>
            
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-[#999] uppercase">Script</p>
              <div className="grid grid-cols-2 gap-1">
                <button 
                  onClick={() => setScriptType("uthmani")}
                  className={`py-1 text-[10px] rounded border ${scriptType === "uthmani" ? "bg-[#5a5a40] text-white border-[#5a5a40]" : "bg-white text-[#666] border-[#ccc]"}`}
                >
                  Uthmani
                </button>
                <button 
                  onClick={() => setScriptType("indopak")}
                  className={`py-1 text-[10px] rounded border ${scriptType === "indopak" ? "bg-[#5a5a40] text-white border-[#5a5a40]" : "bg-white text-[#666] border-[#ccc]"}`}
                >
                  Indo-Pak
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[9px] font-bold text-[#999] uppercase">Font</p>
              <select 
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value as any)}
                className="w-full p-1.5 bg-[#f9f9f9] border border-[#ccc] rounded text-xs outline-none"
              >
                <option value="amiri">Amiri</option>
                <option value="nastaliq">Nastaliq</option>
                <option value="scheherazade">Scheherazade</option>
                <option value="lateef">Lateef</option>
                <option value="kufi">Kufi</option>
              </select>
            </div>

            <div className="space-y-1">
              <p className="text-[9px] font-bold text-[#999] uppercase">Font Size</p>
              <div className="flex items-center gap-2">
                <input 
                  type="range" 
                  min="16" max="48" 
                  value={fontSize} 
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="flex-1 accent-[#5a5a40]"
                />
                <span className="text-[10px] font-bold text-[#666] w-5">{fontSize}</span>
              </div>
            </div>
          </div>

          {/* Bookmarks Management */}
          <div className="bg-white p-3 rounded border border-[#ccc] shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-[#777] uppercase">Bookmarks</label>
              <span className="text-[9px] text-[#999]">{bookmarks.length} saved</span>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar pr-1">
              {bookmarks.length === 0 ? (
                <p className="text-[10px] text-[#999] italic text-center py-2">No bookmarks yet</p>
              ) : (
                bookmarks.map((bm) => (
                  <div key={bm.id} className="group flex items-center justify-between p-1.5 hover:bg-[#f9f9f9] rounded border border-transparent hover:border-[#eee] transition-all">
                    <button 
                      onClick={() => handleSuraChange(bm.sura_number)}
                      className="text-[10px] text-[#555] hover:text-[#5a5a40] font-medium truncate flex-1 text-left"
                    >
                      Sura {bm.sura_number}:{bm.ayah_number}
                    </button>
                    <button 
                      onClick={() => removeBookmark(bm.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Share Section */}
          <div className="bg-white p-3 rounded border border-[#ccc] shadow-sm space-y-2">
            <label className="text-[10px] font-bold text-[#777] uppercase">Share Page</label>
            <div className="grid grid-cols-4 gap-1">
              <button 
                onClick={() => shareOnSocial('twitter')}
                className="p-2 bg-[#1DA1F2] text-white rounded flex items-center justify-center hover:opacity-90"
                title="Share on Twitter"
              >
                <ExternalLink className="w-3 h-3" />
              </button>
              <button 
                onClick={() => shareOnSocial('facebook')}
                className="p-2 bg-[#4267B2] text-white rounded flex items-center justify-center hover:opacity-90"
                title="Share on Facebook"
              >
                <ExternalLink className="w-3 h-3" />
              </button>
              <button 
                onClick={() => shareOnSocial('whatsapp')}
                className="p-2 bg-[#25D366] text-white rounded flex items-center justify-center hover:opacity-90"
                title="Share on WhatsApp"
              >
                <ExternalLink className="w-3 h-3" />
              </button>
              <button 
                onClick={sharePage}
                className="p-2 bg-[#5a5a40] text-white rounded flex items-center justify-center hover:opacity-90"
                title="Copy Link"
              >
                <Share2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Audio Settings */}
          <div className="bg-white p-3 rounded border border-[#ccc] shadow-sm space-y-2">
            <label className="text-[10px] font-bold text-[#777] uppercase">Recitation</label>
            <select 
              value={reciterId}
              onChange={(e) => setReciterId(Number(e.target.value))}
              className="w-full p-1.5 bg-[#f9f9f9] border border-[#ccc] rounded text-xs outline-none"
            >
              <option value={7}>Al-Afasy</option>
              <option value={1}>AbdulSamad</option>
              <option value={5}>Al-Husary</option>
              <option value={12}>Al-Minshawi</option>
            </select>
          </div>

          {/* Developer & Info Section */}
          <div className="bg-[#5a5a40]/5 p-3 rounded border border-[#5a5a40]/20 space-y-2">
            <div className="flex items-center gap-2">
              <Info className="w-3 h-3 text-[#5a5a40]" />
              <label className="text-[10px] font-bold text-[#5a5a40] uppercase">Developer Info</label>
            </div>
            <p className="text-[10px] text-[#555] leading-relaxed">
              Please pray for developer <span className="font-bold text-[#5a5a40]">SM Talha</span>.
            </p>
            <div className="pt-1 space-y-1">
              <p className="text-[9px] font-bold text-[#777] uppercase">Contribute</p>
              <a 
                href="tel:+923132020392" 
                className="text-[10px] text-[#5a5a40] hover:underline flex items-center gap-1"
              >
                +92 313 2020392
              </a>
            </div>
            <div className="pt-1 space-y-1">
              <p className="text-[9px] font-bold text-[#777] uppercase">Islamic Learning</p>
              <a 
                href="https://darsenizami.net" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] text-[#5a5a40] hover:underline flex items-center gap-1"
              >
                darsenizami.net <ExternalLink className="w-2 h-2" />
              </a>
            </div>
          </div>

          {/* Last Read */}
          {lastRead && (
            <button 
              onClick={() => setCurrentSura(lastRead.sura)}
              className="w-full p-2 bg-emerald-50 border border-emerald-200 rounded text-left hover:bg-emerald-100 transition-colors"
            >
              <p className="text-[9px] font-bold text-emerald-700 uppercase">Resume Reading</p>
              <p className="text-[10px] text-emerald-600">Sura {lastRead.sura}, Ayah {lastRead.ayah}</p>
            </button>
          )}
        </div>

        <div className="p-3 bg-[#ddd] border-t border-[#ccc]">
          <p className="text-[9px] text-[#777] text-center font-medium">
            Tanzil Reader • Developed by SM Talha
          </p>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-white">
        {/* Tanzil-style Top Bar */}
        <header className="h-10 bg-[#f9f9f9] border-b border-[#ccc] flex items-center px-4 justify-between select-none">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-1 hover:bg-[#eee] rounded">
                <Menu className="w-4 h-4 text-[#555]" />
              </button>
            )}
            <div className="flex items-center gap-2 text-xs font-bold text-[#555]">
              <span>{suras.find(s => s.id === currentSura)?.name_simple}</span>
              <span className="text-[#999]">|</span>
              <span className="font-amiri text-sm">{suras.find(s => s.id === currentSura)?.name_arabic}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={navigatePrev}
              className="p-1 hover:bg-[#eee] rounded text-[#777]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={navigateNext}
              className="p-1 hover:bg-[#eee] rounded text-[#777]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-[#ccc] mx-1" />
            <button 
              onClick={sharePage}
              className="p-1 hover:bg-[#eee] rounded text-[#777]"
              title="Share this page"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-[#ccc] mx-1" />
            <button 
              onClick={togglePlay}
              className="flex items-center gap-1 px-2 py-1 bg-[#5a5a40] text-white rounded text-[10px] font-bold hover:bg-[#4a4a30] transition-colors"
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {isPlaying ? "PAUSE" : "PLAY"}
            </button>
            {isPlaying && (
              <button 
                onClick={stopAudio}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </header>

        {/* Reader Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#fff] custom-scrollbar" ref={readerRef}>
          <div className="max-w-4xl mx-auto border border-[#eee] shadow-sm p-6 sm:p-10 bg-white min-h-full">
            {/* Bismillah */}
            {currentSura !== 1 && currentSura !== 9 && (
              <div className="text-center mb-10">
                <p className="font-amiri text-3xl text-[#222]">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <div className="w-8 h-8 border-2 border-[#eee] border-t-[#5a5a40] rounded-full animate-spin" />
                <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest">Loading...</p>
              </div>
            ) : (
              <div 
                className="text-right leading-[2.8] text-[#111] select-text" 
                style={{ 
                  fontSize: `${fontSize}px`,
                  fontFamily: `var(--font-${fontFamily})`
                }}
                dir="rtl"
              >
                {verses.map((verse) => (
                  <span 
                    key={verse.id}
                    id={`ayah-${verse.verse_number}`}
                    onClick={() => playVerseAudio(verse.verse_number)}
                    className={`cursor-pointer transition-colors rounded px-1 inline group/verse ${
                      activeVerse === verse.verse_number 
                        ? "bg-[#fff9c4] text-[#000] ring-1 ring-[#fbc02d]/30" 
                        : "hover:bg-[#f5f5f5]"
                    }`}
                  >
                    {scriptType === "uthmani" ? verse.text_uthmani : verse.text_indopak}
                    <span className="inline-flex items-center justify-center w-7 h-7 border border-[#ccc] rounded-full text-[0.4em] font-bold mx-1 text-[#777] align-middle translate-y-[-2px] font-inter relative">
                      {verse.verse_number}
                      <Bookmark 
                        onClick={(e) => {
                          e.stopPropagation();
                          addBookmark(currentSura, verse.verse_number);
                        }}
                        className="absolute -top-2 -right-2 w-3 h-3 text-[#ccc] hover:text-[#5a5a40] opacity-0 group-hover/verse:opacity-100 transition-all cursor-pointer"
                      />
                    </span>
                  </span>
                ))}
              </div>
            )}

            {/* Pagination Footer */}
            {!loading && (
              <div className="flex items-center justify-between mt-16 pt-8 border-t border-[#eee]">
                <button 
                  onClick={navigatePrev}
                  className="flex items-center gap-2 px-4 py-2 bg-[#f9f9f9] border border-[#ccc] rounded text-xs font-bold text-[#666] hover:bg-[#eee] transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  PREVIOUS
                </button>
                <div className="text-[10px] font-bold text-[#999] uppercase tracking-widest">
                  {navigationMode === "chapter" ? `Sura ${currentSura}` : navigationMode === "juz" ? `Juz ${currentJuz}` : `Page ${currentPage}`}
                </div>
                <button 
                  onClick={navigateNext}
                  className="flex items-center gap-2 px-4 py-2 bg-[#5a5a40] border border-[#5a5a40] rounded text-xs font-bold text-white hover:bg-[#4a4a30] transition-colors"
                >
                  NEXT
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #bbb;
        }
      `}</style>
    </div>
  );
}

