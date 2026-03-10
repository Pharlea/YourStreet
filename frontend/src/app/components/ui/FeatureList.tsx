const features = [
  "Relate problemas nas ruas e bairros",
  "Compartilhe ocorrências com a comunidade",
  "Transforme seu bairro juntos"
];

export default function FeatureList() {
  return (
    <div className="pt-6 space-y-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
      {features.map((feature, index) => (
        <div key={index} className="flex items-center gap-3 text-black/80 font-medium">
          <svg className="w-5 h-5 text-black flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path 
              fillRule="evenodd" 
              d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" 
              clipRule="evenodd" 
            />
          </svg>
          <span className="leading-relaxed">{feature}</span>
        </div>
      ))}
    </div>
  );
}