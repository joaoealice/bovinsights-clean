'use client'

import React from 'react';

interface WelcomePageProps {
  onStartTour: () => void;
  onSkip: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onStartTour, onSkip }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full text-center mx-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Bem-vindo ao Bovinsights
        </h1>
        <h2 className="text-xl text-gray-600 mb-6">
          Decisões mais inteligentes no manejo do gado, com dados simples e confiáveis.
        </h2>
        <p className="text-gray-700 mb-8 max-w-xl mx-auto">
          O Bovinsights foi criado e codificado de dentro da porteira, por quem realmente sabe o que é lidar com o gado no dia a dia. Aqui você organiza seus lotes, acompanha peso, indicadores e histórico de forma clara, prática e sem complicação.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onStartTour();
            }}
            className="w-full sm:w-auto bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-transform transform hover:scale-105"
          >
            Conhecer o sistema em 1 minuto
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSkip();
            }}
            className="w-full sm:w-auto text-sm text-gray-600 hover:text-gray-800 font-medium py-2 px-4"
          >
            Pular e ir direto ao painel
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
