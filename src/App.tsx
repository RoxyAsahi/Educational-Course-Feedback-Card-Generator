/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenAI } from 'openai';
import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, 
  Plus, 
  Trash2, 
  Sparkles, 
  User, 
  BookOpen, 
  Calendar as CalendarIcon, 
  BarChart3, 
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  Save,
  FileText,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toPng } from 'html-to-image';
import { GoogleGenAI } from "@google/genai";
import { FeedbackData, DEFAULT_DATA, KnowledgePoint, SPRING_PRESET, AFTER_SCHOOL_PRESET } from './types';

const THEME_PRESETS = [
  { name: '经典蓝', color: '#007BFF' },
  { name: '活力橙', color: '#F39C12' },
  { name: '优雅紫', color: '#6F42C1' },
  { name: '清新绿', color: '#4ADE80' },
  { name: '深邃黑', color: '#1A1A1A' },
];

const PERFORMANCE_PRESETS = {
  attendance: ["准时", "迟到", "请假", "旷课"],
  interaction: ["100%-独立和思考", "80%-积极互动", "50%-被动回答", "需加强"],
  completion: ["100%", "90%", "80%", "70%以下"],
  classroom: [
    "听课时能集中注意力,在沟通环节积极参与讨论,当老师提出问题时能积极参与发言",
    "课堂表现积极，能够紧跟老师思路，但在独立思考环节还需更专注一些",
    "能够完成基础练习，但在高难度挑战题上表现出畏难情绪，需要多加鼓励",
    "专注度有待提高，容易受周围环境影响，建议课后多复习巩固基础知识"
  ]
};

interface SavedTemplate {
  id: string;
  name: string;
  data: FeedbackData;
  isSystem?: boolean;
  timestamp: number;
}

export default function App() {
  const geminiClient = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
  const openAIClient = (process.env.VITE_API_KEY && process.env.VITE_API_ENDPOINT) ? new OpenAI({
    apiKey: process.env.VITE_API_KEY,
    baseURL: process.env.VITE_API_ENDPOINT,
    dangerouslyAllowBrowser: true,
  }) : null;

  const [data, setData] = useState<FeedbackData>(() => {
    const today = new Date();
    return {
      ...DEFAULT_DATA,
      calendarYear: today.getFullYear(),
      calendarMonth: today.getMonth() + 1,
      calendarDays: [today.getDate()]
    };
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [cardHeight, setCardHeight] = useState(0);

  // Load templates on mount
  useEffect(() => {
    const saved = localStorage.getItem('feedback_templates');
    const systemPresets: SavedTemplate[] = [
      { id: 'sys-spring', name: '系统预设：春季班', data: SPRING_PRESET, isSystem: true, timestamp: Date.now() },
      { id: 'sys-afterschool', name: '系统预设：晚托班', data: AFTER_SCHOOL_PRESET, isSystem: true, timestamp: Date.now() }
    ];

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Filter out any old system presets that might have been saved to localStorage
        const userTemplates = parsed.filter((t: SavedTemplate) => !t.isSystem);
        setTemplates([...systemPresets, ...userTemplates]);
      } catch (e) {
        setTemplates(systemPresets);
      }
    } else {
      setTemplates(systemPresets);
    }
  }, []);

  // Save ONLY user templates to localStorage
  useEffect(() => {
    const userTemplates = templates.filter(t => !t.isSystem);
    localStorage.setItem('feedback_templates', JSON.stringify(userTemplates));
  }, [templates]);

  const triggerSuccess = (msg: string) => {
    setShowSuccess(msg);
    setTimeout(() => setShowSuccess(null), 2000);
  };

  const saveTemplate = () => {
    if (!templateName.trim()) {
      alert('请输入模板名称');
      return;
    }
    // Deep copy to prevent reference issues
    const templateData = JSON.parse(JSON.stringify(data));
    const newTemplate: SavedTemplate = {
      id: Math.random().toString(36).substr(2, 9),
      name: templateName,
      data: templateData,
      timestamp: Date.now()
    };
    setTemplates(prev => [newTemplate, ...prev]);
    setTemplateName('');
    setActiveTemplateId(newTemplate.id);
    triggerSuccess('模板已保存');
  };

  const updateTemplate = (id: string) => {
    if (confirm('确定要用当前内容覆盖此模板吗？')) {
      const templateData = JSON.parse(JSON.stringify(data));
      setTemplates(prev => prev.map(t => 
        t.id === id ? { ...t, data: templateData, timestamp: Date.now() } : t
      ));
      triggerSuccess('模板已更新');
    }
  };

  const resetToDefault = () => {
    if (confirm('确定要恢复到系统初始默认设置吗？当前所有未保存的修改将丢失。')) {
      const today = new Date();
      setData({
        ...DEFAULT_DATA,
        calendarYear: today.getFullYear(),
        calendarMonth: today.getMonth() + 1,
        calendarDays: [today.getDate()]
      });
      setActiveTemplateId(null);
      triggerSuccess('已恢复默认');
    }
  };

  const loadTemplate = (template: SavedTemplate) => {
    if (confirm(`确定要加载模板 "${template.name}" 吗？当前修改将被覆盖。`)) {
      // 1. Create a clean deep copy
      const loadedData = JSON.parse(JSON.stringify(template.data));
      
      // 2. Update date to today for better UX (optional, but usually desired for new feedback)
      const today = new Date();
      loadedData.calendarYear = today.getFullYear();
      loadedData.calendarMonth = today.getMonth() + 1;
      loadedData.calendarDays = [today.getDate()];

      // 3. Set the state
      setData(loadedData);
      setTemplateName(template.name.replace('系统预设：', ''));
      setActiveTemplateId(template.id);
      
      // 4. Force a complete re-render of the editor section
      setEditorKey(prev => prev + 1);
      
      triggerSuccess('模板已加载');
      
      // Scroll to top of editor
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const deleteTemplate = (id: string) => {
    if (confirm('确定要删除此模板吗？')) {
      setTemplates(prev => prev.filter(t => t.id !== id));
      if (activeTemplateId === id) setActiveTemplateId(null);
    }
  };

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current && cardRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const cardWidth = 1000; // Match CSS width
        const padding = 32;
        const availableWidth = containerWidth - padding;
        
        const newScale = availableWidth < cardWidth ? availableWidth / cardWidth : 1;
        setScale(newScale);
        setCardHeight(cardRef.current.offsetHeight);
      }
    };

    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) observer.observe(containerRef.current);
    if (cardRef.current) observer.observe(cardRef.current);
    updateScale();

    return () => observer.disconnect();
  }, []);

  const handleDownload = async () => {
    if (cardRef.current === null) return;
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true });
      const link = document.createElement('a');
      link.download = `反馈卡-${data.studentName}-${new Date().toLocaleDateString()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('oops, something went wrong!', err);
    }
  };

  const generateAIComment = async () => {
    setIsGenerating(true);
    try {
      const prompt = `
        你是一位资深的教培老师。请根据以下学生表现数据，写一段专业、客观且具有鼓励性的课后反馈评语。
        评语应包含：
        1. 课堂表现（积极性、专注度）。
        2. 知识点掌握情况（根据提供的知识点列表）。
        3. 改进建议或后续计划。
        
        学生姓名：${data.studentName}
        课程名称：${data.courseName}
        知识点：${data.knowledgePoints.map(p => `${p.point}(难度:${p.difficulty})`).join(', ')}
        统计数据：掌握知识量${data.stats.knowledgeCount}，做题量${data.stats.problemsSolved}，测试结果${data.stats.testResult}
        课堂表现：到课${data.performance.attendance}，互动${data.performance.interaction}，练习完成${data.performance.completion}
        
        请直接输出评语内容，不要包含任何多余的解释。字数在300-500字左右，分段清晰。
      `;

      let commentText = "";
      
      if (openAIClient) {
        console.log("使用 OpenAI 兼容端点生成...");
        const response = await openAIClient.chat.completions.create({
            model: process.env.VITE_API_MODEL || "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
        });
        commentText = response.choices[0]?.message?.content || "OpenAI 兼容模型返回内容为空。";
      } else if (geminiClient) {
        console.log("使用 Google Gemini 生成...");
        const response = await geminiClient.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
        });
        commentText = response.text || "Gemini 模型返回内容为空。";
      } else {
        commentText = "错误：AI 功能未配置。请在 .env 文件中设置 GEMINI_API_KEY 或 VITE_API_KEY/VITE_API_ENDPOINT。";
      }

      setData(prev => ({ ...prev, comprehensiveComment: commentText }));

    } catch (error) {
      console.error("AI 生成失败:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`AI 生成失败，请检查浏览器控制台日志。\n错误: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const addKnowledgePoint = () => {
    const newPoint: KnowledgePoint = {
      id: Math.random().toString(36).substr(2, 9),
      point: "新知识点",
      difficulty: 3,
      frequency: "90%",
      type: "编程题"
    };
    setData(prev => ({
      ...prev,
      knowledgePoints: [...prev.knowledgePoints, newPoint]
    }));
  };

  const removeKnowledgePoint = (id: string) => {
    setData(prev => ({
      ...prev,
      knowledgePoints: prev.knowledgePoints.filter(p => p.id !== id)
    }));
  };

  const updateKnowledgePoint = (id: string, field: keyof KnowledgePoint, value: any) => {
    setData(prev => ({
      ...prev,
      knowledgePoints: prev.knowledgePoints.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const toggleCalendarDay = (day: number) => {
    setData(prev => {
      const days = prev.calendarDays.includes(day)
        ? prev.calendarDays.filter(d => d !== day)
        : [...prev.calendarDays, day];
      return { ...prev, calendarDays: days };
    });
  };

  const getCalendarData = (year: number, month: number) => {
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    return { firstDayOfMonth, daysInMonth };
  };

  const { firstDayOfMonth, daysInMonth } = getCalendarData(data.calendarYear, data.calendarMonth);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row">
      {/* Mobile Preview Header (Visible only on mobile) */}
      <div className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex justify-between items-center">
        <h1 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
          <Sparkles className="text-blue-600" size={18} /> 实时预览
        </h1>
        <button 
          onClick={handleDownload}
          disabled={isGenerating}
          className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
        >
          {isGenerating ? '生成中...' : <><Download size={14} /> 下载卡片</>}
        </button>
      </div>

      {/* Left Panel: Editor (Order 2 on mobile, Order 1 on desktop) */}
      <div className="w-full lg:w-[400px] xl:w-[450px] p-6 bg-white shadow-xl overflow-y-auto h-auto lg:h-screen border-r border-slate-200 order-2 lg:order-1">
        <header className="mb-8 hidden lg:block">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="text-blue-600" />
            全人反馈卡生成器
          </h1>
          <p className="text-slate-500 text-sm mt-1">全人学生课后反馈工具</p>
        </header>

        <div key={editorKey} className="space-y-8">
          {/* Template Management */}
          <section className="bg-blue-50 p-4 rounded-xl border border-blue-100 relative">
            <AnimatePresence>
              {showSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] px-3 py-1 rounded-full shadow-lg z-50 flex items-center gap-1"
                >
                  <Sparkles size={10} /> {showSuccess}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold text-blue-800 uppercase tracking-wider flex items-center gap-2">
                <Save size={16} /> 模板管理
              </h2>
              <button 
                onClick={resetToDefault}
                className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium bg-white px-2 py-1 rounded border border-blue-100 shadow-sm"
                title="恢复系统初始设置"
              >
                <RotateCcw size={12} /> 恢复默认
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                placeholder="输入新模板名称"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                className="flex-1 p-2 text-sm border border-blue-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                onClick={saveTemplate}
                className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                <Plus size={16} /> 新建
              </button>
            </div>
            
            {templates.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                {templates.map(t => (
                  <div 
                    key={t.id} 
                    className={`flex items-center gap-2 p-2 rounded-md border transition-all ${
                      activeTemplateId === t.id 
                        ? 'bg-blue-100 border-blue-300 ring-1 ring-blue-200' 
                        : t.isSystem ? 'bg-amber-50 border-amber-100' : 'bg-white border-blue-100'
                    }`}
                  >
                    <div 
                      className="flex items-center gap-2 text-xs text-slate-700 flex-1 truncate"
                      title={t.isSystem ? '系统内置预设' : `保存于: ${new Date(t.timestamp).toLocaleString()}`}
                    >
                      <FileText size={14} className={activeTemplateId === t.id ? "text-blue-600 shrink-0" : t.isSystem ? "text-amber-500 shrink-0" : "text-blue-400 shrink-0"} />
                      <span className={`truncate ${activeTemplateId === t.id ? 'font-bold text-blue-800' : ''}`}>
                        {t.name}
                        {t.isSystem && <span className="ml-1 text-[10px] text-amber-600 font-normal">(系统)</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => loadTemplate(t)}
                        className={`text-[10px] px-2 py-1 rounded transition-colors font-medium ${
                          activeTemplateId === t.id 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                        }`}
                      >
                        加载
                      </button>
                      {!t.isSystem && (
                        <button 
                          onClick={() => updateTemplate(t.id)}
                          className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded hover:bg-emerald-600 hover:text-white transition-colors font-medium"
                          title="用当前内容覆盖此模板"
                        >
                          更新
                        </button>
                      )}
                      {!t.isSystem && (
                        <button 
                          onClick={() => deleteTemplate(t.id)}
                          className="text-slate-300 hover:text-red-500 p-1 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Basic Info */}
          <section>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <User size={16} /> 基本信息
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <label className="text-xs text-slate-500">卡片标题</label>
                <input 
                  type="text" 
                  value={data.cardTitle}
                  onChange={e => setData(prev => ({ ...prev, cardTitle: e.target.value }))}
                  className="w-full p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs text-slate-500">垂直标签文字 (原: 技能学堂)</label>
                <input 
                  type="text" 
                  value={data.skillSchoolTitle}
                  onChange={e => setData(prev => ({ ...prev, skillSchoolTitle: e.target.value }))}
                  className="w-full p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">学生姓名</label>
                <input 
                  type="text" 
                  value={data.studentName}
                  onChange={e => setData(prev => ({ ...prev, studentName: e.target.value }))}
                  className="w-full p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">课程名称</label>
                <input 
                  type="text" 
                  value={data.courseName}
                  onChange={e => setData(prev => ({ ...prev, courseName: e.target.value }))}
                  className="w-full p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs text-slate-500">日期范围</label>
                <input 
                  type="text" 
                  value={data.dateRange}
                  onChange={e => setData(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="w-full p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </section>

          {/* Theme Selector */}
          <section>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles size={16} /> 配色方案
            </h2>
            <div className="flex flex-wrap gap-3">
              {THEME_PRESETS.map(theme => (
                <button
                  key={theme.color}
                  onClick={() => setData(prev => ({ ...prev, themeColor: theme.color }))}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                    data.themeColor === theme.color 
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' 
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.color }} />
                  <span className="text-xs font-medium">{theme.name}</span>
                </button>
              ))}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-[10px] text-slate-400">自定义</span>
                <input 
                  type="color" 
                  value={data.themeColor}
                  onChange={e => setData(prev => ({ ...prev, themeColor: e.target.value }))}
                  className="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer"
                />
              </div>
            </div>
          </section>

          {/* Calendar Picker */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <CalendarIcon size={16} /> 日历设置
              </h2>
              <div className="flex gap-2">
                <select 
                  value={data.calendarYear}
                  onChange={e => setData(prev => ({ ...prev, calendarYear: parseInt(e.target.value), calendarDays: [] }))}
                  className="text-xs p-1 border border-slate-200 rounded"
                >
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}年</option>)}
                </select>
                <select 
                  value={data.calendarMonth}
                  onChange={e => setData(prev => ({ ...prev, calendarMonth: parseInt(e.target.value), calendarDays: [] }))}
                  className="text-xs p-1 border border-slate-200 rounded"
                >
                  {Array.from({ length: 12 }).map((_, i) => <option key={i+1} value={i+1}>{i+1}月</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                <div key={d} className="text-[10px] text-center text-slate-400 font-bold">{d}</div>
              ))}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8"></div>
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isActive = data.calendarDays.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => toggleCalendarDay(day)}
                    className={`h-8 text-xs rounded transition-colors ${isActive ? 'bg-orange-500 text-white font-bold' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Knowledge Points */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <BookOpen size={16} /> 知识点列表
              </h2>
              <button 
                onClick={addKnowledgePoint}
                className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1"
              >
                <Plus size={14} /> 添加
              </button>
            </div>
            <div className="space-y-3">
              {data.knowledgePoints.map((kp) => (
                <div key={kp.id} className="p-3 border border-slate-100 rounded-lg bg-slate-50 relative group">
                  <button 
                    onClick={() => removeKnowledgePoint(kp.id)}
                    className="absolute -right-2 -top-2 bg-red-100 text-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                  <div className="grid grid-cols-3 gap-2">
                    <input 
                      type="text" 
                      value={kp.point}
                      onChange={e => updateKnowledgePoint(kp.id, 'point', e.target.value)}
                      placeholder="知识点名称"
                      className="col-span-3 text-sm p-1 bg-transparent border-b border-slate-200 focus:border-blue-500 outline-none"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 shrink-0">难度</span>
                      <select 
                        value={kp.difficulty}
                        onChange={e => updateKnowledgePoint(kp.id, 'difficulty', parseInt(e.target.value))}
                        className="text-xs bg-transparent outline-none w-full"
                      >
                        {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}星</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 shrink-0">频率</span>
                      <input 
                        type="text" 
                        value={kp.frequency}
                        onChange={e => updateKnowledgePoint(kp.id, 'frequency', e.target.value)}
                        className="text-xs bg-transparent border-b border-slate-200 outline-none w-full"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 shrink-0">类型</span>
                      <input 
                        type="text" 
                        value={kp.type}
                        onChange={e => updateKnowledgePoint(kp.id, 'type', e.target.value)}
                        className="text-xs bg-transparent border-b border-slate-200 outline-none w-full"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Stats */}
          <section>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BarChart3 size={16} /> 统计卡设置
            </h2>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500">统计卡标题</label>
                <input 
                  type="text" 
                  value={data.statsTitle}
                  onChange={e => setData(prev => ({ ...prev, statsTitle: e.target.value }))}
                  className="w-full p-2 border border-slate-200 rounded-md text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">标签1 (知识)</label>
                  <input 
                    type="text" 
                    value={data.statsLabels.knowledge}
                    onChange={e => setData(prev => ({ ...prev, statsLabels: { ...prev.statsLabels, knowledge: e.target.value } }))}
                    className="w-full p-1 border border-slate-200 rounded-md text-xs"
                  />
                  <input 
                    type="number" 
                    value={data.stats.knowledgeCount}
                    onChange={e => setData(prev => ({ ...prev, stats: { ...prev.stats, knowledgeCount: parseInt(e.target.value) } }))}
                    className="w-full p-2 border border-slate-200 rounded-md text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">标签2 (做题)</label>
                  <input 
                    type="text" 
                    value={data.statsLabels.problems}
                    onChange={e => setData(prev => ({ ...prev, statsLabels: { ...prev.statsLabels, problems: e.target.value } }))}
                    className="w-full p-1 border border-slate-200 rounded-md text-xs"
                  />
                  <input 
                    type="number" 
                    value={data.stats.problemsSolved}
                    onChange={e => setData(prev => ({ ...prev, stats: { ...prev.stats, problemsSolved: parseInt(e.target.value) } }))}
                    className="w-full p-2 border border-slate-200 rounded-md text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">标签3 (测试)</label>
                  <input 
                    type="text" 
                    value={data.statsLabels.test}
                    onChange={e => setData(prev => ({ ...prev, statsLabels: { ...prev.statsLabels, test: e.target.value } }))}
                    className="w-full p-1 border border-slate-200 rounded-md text-xs"
                  />
                  <input 
                    type="text" 
                    value={data.stats.testResult}
                    onChange={e => setData(prev => ({ ...prev, stats: { ...prev.stats, testResult: e.target.value } }))}
                    className="w-full p-2 border border-slate-200 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Comments */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare size={16} /> 综合点评
              </h2>
              <button 
                onClick={generateAIComment}
                disabled={isGenerating}
                className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                {isGenerating ? "生成中..." : <><Sparkles size={12} /> AI 生成</>}
              </button>
            </div>
            <textarea 
              value={data.comprehensiveComment}
              onChange={e => setData(prev => ({ ...prev, comprehensiveComment: e.target.value }))}
              className="w-full h-48 p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="输入学生的综合表现点评..."
            />
          </section>

          {/* Performance */}
          <section className="pb-12">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BarChart3 size={16} /> 学习情况
            </h2>
            <div className="space-y-4">
              {/* Attendance */}
              <div className="space-y-2">
                <label className="text-xs text-slate-500">到课情况</label>
                <div className="flex flex-wrap gap-2">
                  {PERFORMANCE_PRESETS.attendance.map(opt => (
                    <button 
                      key={opt}
                      onClick={() => setData(prev => ({ ...prev, performance: { ...prev.performance, attendance: opt } }))}
                      className={`px-2 py-1 text-[10px] rounded border ${data.performance.attendance === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <input 
                  type="text" 
                  value={data.performance.attendance}
                  onChange={e => setData(prev => ({ ...prev, performance: { ...prev.performance, attendance: e.target.value } }))}
                  placeholder="自定义到课情况"
                  className="w-full p-2 border border-slate-200 rounded-md text-sm outline-none"
                />
              </div>

              {/* Interaction */}
              <div className="space-y-2">
                <label className="text-xs text-slate-500">课堂互动</label>
                <div className="flex flex-wrap gap-2">
                  {PERFORMANCE_PRESETS.interaction.map(opt => (
                    <button 
                      key={opt}
                      onClick={() => setData(prev => ({ ...prev, performance: { ...prev.performance, interaction: opt } }))}
                      className={`px-2 py-1 text-[10px] rounded border ${data.performance.interaction === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <input 
                  type="text" 
                  value={data.performance.interaction}
                  onChange={e => setData(prev => ({ ...prev, performance: { ...prev.performance, interaction: e.target.value } }))}
                  placeholder="自定义课堂互动"
                  className="w-full p-2 border border-slate-200 rounded-md text-sm outline-none"
                />
              </div>

              {/* Completion */}
              <div className="space-y-2">
                <label className="text-xs text-slate-500">练习完成</label>
                <div className="flex flex-wrap gap-2">
                  {PERFORMANCE_PRESETS.completion.map(opt => (
                    <button 
                      key={opt}
                      onClick={() => setData(prev => ({ ...prev, performance: { ...prev.performance, completion: opt } }))}
                      className={`px-2 py-1 text-[10px] rounded border ${data.performance.completion === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <input 
                  type="text" 
                  value={data.performance.completion}
                  onChange={e => setData(prev => ({ ...prev, performance: { ...prev.performance, completion: e.target.value } }))}
                  placeholder="自定义练习完成"
                  className="w-full p-2 border border-slate-200 rounded-md text-sm outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500">课堂表现描述</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {PERFORMANCE_PRESETS.classroom.map((opt, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setData(prev => ({ ...prev, performance: { ...prev.performance, classroomPerformance: opt } }))}
                      className={`px-2 py-1 text-[10px] rounded border text-left max-w-full truncate ${data.performance.classroomPerformance === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}
                      title={opt}
                    >
                      选项 {idx + 1}
                    </button>
                  ))}
                </div>
                <textarea 
                  value={data.performance.classroomPerformance}
                  onChange={e => setData(prev => ({ ...prev, performance: { ...prev.performance, classroomPerformance: e.target.value } }))}
                  className="w-full p-2 border border-slate-200 rounded-md text-sm outline-none h-20 resize-none"
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Right Panel: Preview (Order 1 on mobile, Order 2 on desktop) */}
      <div ref={containerRef} className="flex-1 p-4 lg:p-8 flex flex-col items-center justify-start lg:justify-center bg-slate-200 overflow-x-hidden order-1 lg:order-2 min-h-[300px]">
        <div className="mb-6 hidden lg:flex gap-4">
          <button 
            onClick={handleDownload}
            disabled={isGenerating}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50"
          >
            <Download size={20} /> {isGenerating ? '正在生成...' : '下载反馈卡'}
          </button>
        </div>

        {/* The Card Wrapper for Scaling */}
        <div 
          className="relative transition-all duration-300 ease-out"
          style={{ 
            width: 1000 * scale, 
            height: cardHeight * scale,
          }}
        >
          <div 
            className="absolute top-0 left-0 origin-top-left shadow-2xl"
            style={{ 
              transform: `scale(${scale})`,
              width: 1000,
            }}
          >
            <div ref={cardRef} className="feedback-card-container" style={{ backgroundColor: data.themeColor }}>
            {/* 1. Header */}
            <div className="header-title">{data.cardTitle}</div>
            <div className="info-bar">
              <div className="info-block bg-[#64B5F6]">{data.dateRange}</div>
              <div className="info-block bg-[#1976D2] justify-center text-lg">{data.studentName}</div>
              <div className="info-block bg-[#1565C0]">{data.courseName}</div>
            </div>

            <div className="card-body-grid" style={{ backgroundColor: data.themeColor }}>
              {/* Row 1 */}
              <div className="card-cell p-2">
                <div className="calendar-grid">
                  {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                    <div key={d} className="calendar-header">{d}</div>
                  ))}
                  {Array.from({ length: 42 }).map((_, i) => {
                    const day = i - firstDayOfMonth + 1;
                    const isCurrentMonth = day > 0 && day <= daysInMonth;
                    const isActive = data.calendarDays.includes(day);
                    return (
                      <div 
                        key={i} 
                        className={`calendar-cell ${isActive ? 'active' : ''} ${!isCurrentMonth ? 'text-slate-100' : ''}`}
                      >
                        {isCurrentMonth ? day : ''}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="vertical-slogan" style={{ backgroundColor: data.themeColor }}>
                {data.skillSchoolTitle.split('').map((char, i) => <div key={i}>{char}</div>)}
              </div>

              <div className="card-cell">
                <table className="k-table">
                  <thead>
                    <tr>
                      <th>今日知识点</th>
                      <th>难度系数</th>
                      <th>考试频率</th>
                      <th>考题类型</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.knowledgePoints.map(kp => (
                      <tr key={kp.id}>
                        <td className="text-left pl-4 font-bold">{kp.point}</td>
                        <td className="text-blue-500">
                          {'★'.repeat(kp.difficulty)}{'☆'.repeat(5 - kp.difficulty)}
                        </td>
                        <td>
                          <span className="badge-yellow">{kp.frequency}</span>
                        </td>
                        <td>
                          <span className="badge-green">{kp.type}</span>
                        </td>
                      </tr>
                    ))}
                    {Array.from({ length: Math.max(0, 4 - data.knowledgePoints.length) }).map((_, i) => (
                      <tr key={i} className="h-[32px]"><td></td><td></td><td></td><td></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Row 2 */}
              <div className="flex flex-col bg-white">
                <div className="stats-title-bar">{data.statsTitle}</div>
                <div className="stats-columns" style={{ backgroundColor: data.themeColor }}>
                  <div className="stats-col text-blue-600" dangerouslySetInnerHTML={{ __html: data.statsLabels.knowledge.replace(/\n/g, '<br/>') }} />
                  <div className="stats-col text-orange-500" dangerouslySetInnerHTML={{ __html: data.statsLabels.problems.replace(/\n/g, '<br/>') }} />
                  <div className="stats-col text-emerald-500" dangerouslySetInnerHTML={{ __html: data.statsLabels.test.replace(/\n/g, '<br/>') }} />
                </div>
              </div>

              <div className="comment-label !bg-[#FFF176] !border-none text-sm">综合情况</div>

              <div className="comment-container">
                <div className="comment-label border-l border-yellow-300">综合点评</div>
                <div className="comment-text">{data.comprehensiveComment}</div>
              </div>

              {/* Row 3 */}
              <div className="big-number-box" style={{ backgroundColor: data.themeColor }}>
                <div className="big-number bg-[#007BFF]">{data.stats.knowledgeCount}</div>
                <div className="big-number bg-[#F39C12]">{data.stats.problemsSolved}</div>
                <div className="big-number bg-[#20C997]">{data.stats.testResult}</div>
              </div>

              <div className="perf-label-v">学习情况</div>

              <div className="card-cell">
                <div className="perf-container">
                  <table className="perf-table">
                    <tbody>
                      <tr>
                        <td className="perf-tag">到课情况</td>
                        <td className="perf-content-box text-center">{data.performance.attendance}</td>
                        <td className="perf-tag">课堂互动</td>
                        <td className="perf-content-box text-center">{data.performance.interaction}</td>
                      </tr>
                      <tr>
                        <td className="perf-tag">课堂表现</td>
                        <td colSpan={3} className="perf-content-box text-xs leading-tight">
                          {data.performance.classroomPerformance}
                        </td>
                      </tr>
                      <tr>
                        <td className="perf-tag">课堂练习完成</td>
                        <td colSpan={3} className="perf-content-box text-center">{data.performance.completion}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
