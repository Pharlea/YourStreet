import InteractiveTabs, { TabType } from "./InteractiveTabs";
import InfoPanel from "./InfoPanel";
import FeatureList from "./FeatureList";

interface LeftSectionProps {
  activePanel: TabType | null;
  onPanelToggle: (panel: TabType) => void;
}

export default function LeftSection({ activePanel, onPanelToggle }: LeftSectionProps) {
  return (
    <div className="lg:w-1/2 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 p-8 lg:p-16 flex flex-col justify-center items-center relative overflow-hidden">
      {/* Decoração de fundo */}
      <div className="absolute inset-0 opacity-10">
        <img
          src="https://images.unsplash.com/photo-1771098302693-335a74ac1e6d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMGNpdHlzY2FwZSUyMGlsbHVzdHJhdGlvbiUyMG1pbmltYWx8ZW58MXx8fHwxNzcyMjMyMDYxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 max-w-lg w-full text-center lg:text-left space-y-6">
        {/* Botões interativos como tabs */}
        <InteractiveTabs activePanel={activePanel} onPanelToggle={onPanelToggle} />

        {/* Painéis informativos com animação */}
        {activePanel && <InfoPanel type={activePanel} />}

        <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] xl:text-5xl text-black" style={{ lineHeight: '1.25' }}>
          <span className="font-semibold">Sua rua melhor começa</span>
          <br />
          <span className="font-bold">com você.</span>
        </h1>

        <p className="text-lg lg:text-xl text-black/80 leading-relaxed">
          Conectando cidadãos para resolver problemas reais da cidade.
        </p>

        <FeatureList />
      </div>
    </div>
  );
}