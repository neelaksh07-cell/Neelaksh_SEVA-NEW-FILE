import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  BookOpen,
  ShieldAlert,
  ArrowRight,
  Award,
  SearchCheck,
} from 'lucide-react';
import { LEARNING_MODULES, LearningModule, SkillLevel } from '../data/learningContent';
import { LessonProgressMap } from '../utils/scamAnalyzer';

interface LearnSectionProps {
  progress: LessonProgressMap;
  onUpdateModuleScore: (moduleId: string, score: number, total: number) => void;
  onToggleCompleteLesson: (moduleId: string) => void;
  onInspectSimulationInChecker: (text: string) => void;
}

export const LearnSection: React.FC<LearnSectionProps> = ({
  progress,
  onUpdateModuleScore,
  onToggleCompleteLesson,
  onInspectSimulationInChecker,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<'All' | SkillLevel>('All');
  const [activeModuleId, setActiveModuleId] = useState<string>(LEARNING_MODULES[0].id);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  const filteredModules =
    selectedLevel === 'All'
      ? LEARNING_MODULES
      : LEARNING_MODULES.filter((m) => m.level === selectedLevel);

  const activeModule: LearningModule =
    filteredModules.find((m) => m.id === activeModuleId) ||
    filteredModules[0] ||
    LEARNING_MODULES[0];

  const handleSelectOption = (module: LearningModule, questionId: string, optionId: string) => {
    const nextAnswers = { ...selectedAnswers, [questionId]: optionId };
    setSelectedAnswers(nextAnswers);

    // Check if all questions in this module have been answered
    const allAnswered = module.quiz.every((q) => Boolean(nextAnswers[q.id]));
    if (allAnswered) {
      let correctCount = 0;
      for (const q of module.quiz) {
        const chosen = q.options.find((o) => o.id === nextAnswers[q.id]);
        if (chosen?.isCorrect) {
          correctCount += 1;
        }
      }
      onUpdateModuleScore(module.id, correctCount, module.quiz.length);
    }
  };

  const isCompleted = progress.completedLessonIds.includes(activeModule.id);
  const savedScore = progress.quizScores[activeModule.id];

  return (
    <div className="space-y-6">
      {/* Header & Level Filter Bar */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">
            Guided Learning Journey · Progress Tracked Locally
          </p>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
            Cyber Scam Awareness Modules & Practice Quizzes
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Study real-world scam patterns encountered across India, inspect clearly marked educational simulations, and test your knowledge.
          </p>
        </div>

        {/* Interactive Segmented Level Filter */}
        <div
          className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start md:self-center shrink-0"
          role="group"
          aria-label="Filter modules by skill level"
        >
          {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => {
                setSelectedLevel(lvl);
                const firstMatch =
                  lvl === 'All'
                    ? LEARNING_MODULES[0]
                    : LEARNING_MODULES.find((m) => m.level === lvl);
                if (firstMatch) setActiveModuleId(firstMatch.id);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedLevel === lvl
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lvl === 'All' ? 'All Levels (6)' : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Sandbox Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Module Selector List */}
        <div className="lg:col-span-4 space-y-3">
          {filteredModules.map((mod, idx) => {
            const isSelected = mod.id === activeModule.id;
            const modCompleted = progress.completedLessonIds.includes(mod.id);
            const modScore = progress.quizScores[mod.id];

            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => setActiveModuleId(mod.id)}
                className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-sky-50/90 border-sky-600'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span>
                    0{idx + 1}. {mod.level} · {mod.topicTag}
                  </span>
                  <span className="font-mono tabular-nums">{mod.readTime}</span>
                </div>
                <h2 className="mt-1.5 text-sm font-bold text-slate-900 leading-snug">
                  {mod.title}
                </h2>
                <div className="mt-2.5 flex items-center justify-between text-xs">
                  <span
                    className={
                      modCompleted
                        ? 'text-teal-700 font-semibold flex items-center gap-1'
                        : 'text-slate-500'
                    }
                  >
                    {modCompleted ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Completed</span>
                      </>
                    ) : (
                      'In progress'
                    )}
                  </span>
                  {modScore && (
                    <span className="font-mono tabular-nums text-slate-700">
                      Quiz: {modScore.score}/{modScore.total}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Detail Pane: Active Lesson, Educational Simulation & Quiz */}
        <div className="lg:col-span-8 space-y-6">
          {/* Lesson Overview & Key Takeaways */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <p className="text-xs text-sky-800 font-medium">
                  {activeModule.level} Level · {activeModule.topicTag} · {activeModule.readTime}
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  {activeModule.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => onToggleCompleteLesson(activeModule.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  isCompleted
                    ? 'bg-teal-50 border-teal-300 text-teal-900'
                    : 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>{isCompleted ? 'Lesson Completed' : 'Mark Lesson Complete'}</span>
              </button>
            </div>

            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              {activeModule.summary}
            </p>

            {/* How the Scam Works */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">
                How This Scam Typically Unfolds
              </h3>
              <ol className="space-y-2.5">
                {activeModule.howItWorks.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed">
                    <span className="font-mono text-xs font-bold text-sky-800 shrink-0 mt-0.5">
                      0{i + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Key Protection Rules */}
            <div className="pt-5 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-700" aria-hidden="true" />
                <h3 className="text-sm font-bold text-slate-900">
                  Key Safety Rules to Remember
                </h3>
              </div>
              <ul className="space-y-2">
                {activeModule.keyTakeaways.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-1" aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Simulated Scam Example (Clearly Marked as Educational Simulation) */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold text-amber-800">
                    EDUCATIONAL SIMULATION — NOT A REAL MESSAGE
                  </p>
                  <h3 className="text-base font-bold text-slate-900">
                    Simulated Scam Anatomy ({activeModule.simulation.channel})
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onInspectSimulationInChecker(activeModule.simulation.messageBody)}
                className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <SearchCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Send to Scam Checker</span>
              </button>
            </div>

            {/* Simulated Message Box */}
            <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs sm:text-sm space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-700 text-slate-400 text-xs">
                <span>Sender: {activeModule.simulation.senderHeader}</span>
                <span>{activeModule.simulation.timestamp}</span>
              </div>
              <p className="leading-relaxed text-slate-100 break-words">
                {activeModule.simulation.messageBody}
              </p>
            </div>

            {/* Red Flags Breakdown */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-900">
                Warning Signs Highlighted in This Simulation:
              </h4>
              <div className="divide-y divide-slate-100">
                {activeModule.simulation.redFlagsAnnotated.map((rf, i) => (
                  <div key={i} className="py-3 first:pt-0 last:pb-0">
                    <code className="text-xs font-mono bg-amber-50 text-amber-950 border border-amber-200 px-2 py-0.5 rounded">
                      {rf.snippet}
                    </code>
                    <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                      {rf.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-xs sm:text-sm text-teal-950">
              <strong>Safe Response:</strong> {activeModule.simulation.safeAction}
            </div>
          </div>

          {/* Interactive Quiz with Immediate Explanations */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-sky-700" aria-hidden="true" />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Scenario Practice Quiz ({activeModule.quiz.length} Questions)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select an answer to view a detailed explanation. Completing all questions saves your score locally.
                  </p>
                </div>
              </div>
              {savedScore && (
                <span className="text-xs font-mono tabular-nums font-semibold text-teal-800">
                  Recorded Score: {savedScore.score} / {savedScore.total}
                </span>
              )}
            </div>

            <div className="space-y-6">
              {activeModule.quiz.map((q, qIdx) => {
                const chosenOptionId = selectedAnswers[q.id];
                const chosenOption = q.options.find((o) => o.id === chosenOptionId);

                return (
                  <div key={q.id} className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                    <h4 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                      Question {qIdx + 1}: {q.question}
                    </h4>

                    <div className="space-y-2.5">
                      {q.options.map((opt) => {
                        const isPicked = chosenOptionId === opt.id;
                        let btnStyle = 'bg-white border-slate-200 text-slate-800 hover:border-sky-400';
                        if (isPicked) {
                          btnStyle = opt.isCorrect
                            ? 'bg-teal-50 border-teal-600 text-teal-950 font-medium'
                            : 'bg-red-50 border-red-500 text-red-950 font-medium';
                        }

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSelectOption(activeModule, q.id, opt.id)}
                            className={`w-full text-left p-3.5 rounded-lg border text-sm transition-colors flex items-start gap-3 cursor-pointer ${btnStyle}`}
                          >
                            <span className="font-mono text-xs font-bold uppercase mt-0.5 shrink-0">
                              {opt.id}.
                            </span>
                            <span className="flex-1">{opt.text}</span>
                            {isPicked && (
                              opt.isCorrect ? (
                                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" aria-hidden="true" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
                              )
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {chosenOption && (
                      <div
                        className={`p-4 rounded-lg border text-xs sm:text-sm leading-relaxed ${
                          chosenOption.isCorrect
                            ? 'bg-teal-50/90 border-teal-200 text-teal-950'
                            : 'bg-amber-50/90 border-amber-200 text-amber-950'
                        }`}
                      >
                        <p className="font-semibold">
                          {chosenOption.isCorrect
                            ? 'Correct Answer!'
                            : 'Not quite — here is why:'}
                        </p>
                        <p className="mt-1">{chosenOption.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
