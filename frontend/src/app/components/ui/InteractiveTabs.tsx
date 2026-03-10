import { useState } from "react";

export type TabType = "map" | "community" | "idea";

interface InteractiveTabsProps {
  activePanel: TabType | null;
  onPanelToggle: (panel: TabType) => void;
}

export default function InteractiveTabs({ activePanel, onPanelToggle }: InteractiveTabsProps) {
  const tabs = [
    {
      id: "map" as TabType,
      label: "Como o Mapa Funciona",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
        />
      ),
      activeColor: "bg-yellow-400 shadow-lg -translate-y-0.5",
      inactiveColor: "bg-black/10 hover:bg-black/20"
    },
    {
      id: "community" as TabType,
      label: "Rede Colaborativa",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      ),
      activeColor: "bg-yellow-400 shadow-lg -translate-y-0.5",
      inactiveColor: "bg-yellow-400/30 hover:bg-yellow-400/50"
    },
    {
      id: "idea" as TabType,
      label: "Propósito da Plataforma",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      ),
      activeColor: "bg-yellow-400 shadow-lg -translate-y-0.5",
      inactiveColor: "bg-black/10 hover:bg-black/20"
    }
  ];

  return (
    <div className="flex justify-center lg:justify-start gap-4 mb-8">
      {tabs.map((tab) => {
        const isActive = activePanel === tab.id;
        const textColor = isActive 
          ? "text-white" 
          : tab.id === "community" ? "text-yellow-700" : "text-black";
        
        return (
          <button
            key={tab.id}
            onClick={() => onPanelToggle(tab.id)}
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transform transition-all duration-300 cursor-pointer focus:outline-none focus:ring-4 focus:ring-yellow-500/50 hover:scale-110 hover:shadow-lg ${
              isActive ? tab.activeColor : tab.inactiveColor
            }`}
            aria-label={tab.label}
          >
            <svg
              className={`w-8 h-8 transition-colors ${textColor}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {tab.icon}
            </svg>
          </button>
        );
      })}
    </div>
  );
}