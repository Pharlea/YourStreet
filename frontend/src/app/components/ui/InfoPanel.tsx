import { TabType } from "./InteractiveTabs";

interface InfoPanelProps {
  type: TabType;
}

const panelData = {
  map: {
    title: "Como o Mapa Funciona",
    icon: (
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" 
      />
    ),
    points: [
      "Marque ocorrências diretamente no mapa da cidade",
      "Cada ponto representa um problema real relatado",
      "Inclua fotos, descrição e nível de urgência",
      "Atualização em tempo real",
      "Mais confirmações = maior relevância"
    ],
    quote: "Visualize os problemas da sua região em segundos."
  },
  community: {
    title: "Rede Colaborativa",
    icon: (
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
      />
    ),
    points: [
      "Comente e apoie ocorrências de outros moradores",
      "Confirme que o problema também afeta você",
      "A comunidade fortalece a visibilidade dos casos",
      "Incentive a colaboração entre cidadãos",
      "Gerem pressão positiva por soluções"
    ],
    quote: "Problemas compartilhados geram soluções coletivas."
  },
  idea: {
    title: "Propósito da Plataforma",
    icon: (
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
      />
    ),
    points: [
      "Conectar cidadãos para melhorar bairros",
      "Criar um canal organizado de visibilidade pública",
      "Facilitar comunicação sobre problemas urbanos",
      "Incentivar responsabilidade coletiva",
      "Transformar reclamações em mobilização estruturada"
    ],
    quote: "Tecnologia a favor da transformação urbana."
  }
};

export default function InfoPanel({ type }: InfoPanelProps) {
  const data = panelData[type];
  
  return (
    <div 
      className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg mb-6 animate-[slideIn_0.3s_ease-out]"
      style={{ 
        animation: 'slideIn 0.3s ease-out',
        fontFamily: 'Poppins, sans-serif'
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {data.icon}
        </svg>
        <h3 className="text-lg font-semibold text-black">{data.title}</h3>
      </div>
      
      <div className="space-y-2 text-sm text-black/80">
        {data.points.map((point, index) => (
          <p key={index}>• {point}</p>
        ))}
        
        <div className="mt-4 pt-4 border-t border-black/10">
          <p className="text-black font-medium italic">
            "{data.quote}"
          </p>
        </div>
      </div>
    </div>
  );
}