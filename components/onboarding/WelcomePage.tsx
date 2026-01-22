'use client'

import React from 'react';

interface WelcomePageProps {
  onStartTour: () => void;
  onSkip: () => void;
  onConfigureNow: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onStartTour, onSkip, onConfigureNow }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-2xl w-full text-center mx-4">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Bem-vindo ao Bovinsights
        </h1>
        <h2 className="text-xl text-gray-600 dark:text-gray-300 mb-6">
          Decisões mais inteligentes no manejo do gado, com dados simples e confiáveis.
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-xl mx-auto">
          O Bovinsights foi criado e codificado de dentro da porteira, por quem realmente sabe o que é lidar com o gado no dia a dia. Aqui você organiza seus lotes, acompanha peso, indicadores e histórico de forma clara, prática e sem complicação.
        </p>

        {/* Alerta de configuração inicial */}
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-6 text-left">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                Configuração inicial necessária
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Para que o sistema funcione corretamente, você precisa configurar:
              </p>
              <ul className="text-sm text-amber-700 dark:text-amber-300 mt-2 space-y-1">
                <li className="flex items-center gap-2">
                  <span>📍</span>
                  <strong>Localização da fazenda</strong> — para monitoramento do clima
                </li>
                <li className="flex items-center gap-2">
                  <span>💰</span>
                  <strong>Praça de atuação</strong> — para cotação da @ e valor do estoque
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onConfigureNow();
            }}
            className="w-full sm:w-auto bg-amber-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-75 transition-transform transform hover:scale-105"
          >
            Configurar agora
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onStartTour();
            }}
            className="w-full sm:w-auto bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors"
          >
            Conhecer o sistema primeiro
          </button>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSkip();
          }}
          className="mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium py-2 px-4"
        >
          Pular e configurar depois
        </button>
      </div>
    </div>
  );
};

export default WelcomePage;
