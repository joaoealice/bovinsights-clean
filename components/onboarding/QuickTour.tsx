'use client'

import React, { useState, useEffect } from 'react'

export interface TourStep {
  target: string
  title: string
  text: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

interface QuickTourProps {
  steps: TourStep[]
  onFinish: () => void
  onSkip: () => void
  isOpen: boolean
}

const QuickTour: React.FC<QuickTourProps> = ({ steps, onFinish, onSkip, isOpen }) => {
  const [currentStep, setCurrentStep] = useState(0)

  const step = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0)
    }
  }, [isOpen])

  if (!isOpen || !step) {
    return null
  }

  const handleNext = () => {
    if (isLastStep) {
      onFinish()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
        {/* Número do passo */}
        <div className="text-xs text-gray-500 mb-2">
          Passo {currentStep + 1} de {steps.length}
        </div>

        {/* Título */}
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {step.title}
        </h3>

        {/* Texto */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          {step.text}
        </p>

        {/* Indicadores de passo */}
        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentStep ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Botões */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={onSkip}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Pular
          </button>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Voltar
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600"
            >
              {isLastStep ? 'Começar!' : 'Próximo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuickTour
