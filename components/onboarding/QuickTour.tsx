'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

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
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)

  const step = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1

  // Criar container do portal
  useEffect(() => {
    const container = document.createElement('div')
    container.id = 'quicktour-portal'
    document.body.appendChild(container)
    setPortalContainer(container)

    return () => {
      if (document.body.contains(container)) {
        document.body.removeChild(container)
      }
    }
  }, [])

  // Atualizar posição do target
  useEffect(() => {
    if (!isOpen || !step?.target) {
      setTargetRect(null)
      return
    }

    const findAndHighlight = () => {
      const element = document.querySelector(step.target) as HTMLElement
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setTimeout(() => {
          setTargetRect(element.getBoundingClientRect())
        }, 400)
      } else {
        console.warn(`Target not found: ${step.target}`)
        setTargetRect(null)
      }
    }

    findAndHighlight()

    const handleResize = () => findAndHighlight()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isOpen, currentStep, step?.target])

  // Reset quando fecha
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0)
      setTargetRect(null)
    }
  }, [isOpen])

  if (!isOpen || !step || !portalContainer) {
    return null
  }

  const goNext = () => {
    console.log('goNext clicked, isLastStep:', isLastStep)
    if (isLastStep) {
      onFinish()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const goBack = () => {
    console.log('goBack clicked')
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const skipTour = () => {
    console.log('skipTour clicked')
    onSkip()
  }

  const getTooltipPosition = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      zIndex: 100000,
      width: 340,
      backgroundColor: '#ffffff',
      borderRadius: 12,
      padding: 24,
      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
    }

    if (!targetRect) {
      return {
        ...baseStyle,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
    }

    const placement = step.placement || 'bottom'
    const gap = 20

    switch (placement) {
      case 'top':
        return {
          ...baseStyle,
          top: targetRect.top - gap,
          left: targetRect.left + targetRect.width / 2,
          transform: 'translate(-50%, -100%)',
        }
      case 'right':
        return {
          ...baseStyle,
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.right + gap,
          transform: 'translateY(-50%)',
        }
      case 'left':
        return {
          ...baseStyle,
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.left - gap - 340,
          transform: 'translateY(-50%)',
        }
      case 'bottom':
      default:
        return {
          ...baseStyle,
          top: targetRect.bottom + gap,
          left: targetRect.left + targetRect.width / 2,
          transform: 'translateX(-50%)',
        }
    }
  }

  const content = (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999 }}>
      {/* Overlay escuro - NÃO fecha ao clicar */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          zIndex: 99999,
        }}
      />

      {/* Spotlight */}
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            border: '4px solid #3b82f6',
            borderRadius: 12,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.8), 0 0 20px rgba(59,130,246,0.5)',
            zIndex: 100000,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Tooltip */}
      <div style={getTooltipPosition()}>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1f2937', marginBottom: 8, marginTop: 0 }}>
          {step.title}
        </h3>
        <p style={{ fontSize: 15, color: '#4b5563', marginBottom: 16, lineHeight: 1.5 }}>
          {step.text}
        </p>

        {/* Indicador de passos */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
          {steps.map((_, i) => (
            <div
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: i === currentStep ? '#3b82f6' : '#d1d5db',
              }}
            />
          ))}
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={skipTour}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              fontSize: 14,
              cursor: 'pointer',
              padding: '8px 12px',
            }}
          >
            Pular tour
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            {currentStep > 0 && (
              <button
                type="button"
                onClick={goBack}
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  color: '#374151',
                  fontSize: 14,
                  fontWeight: 600,
                  padding: '10px 16px',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                Voltar
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              style={{
                background: '#3b82f6',
                border: 'none',
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 600,
                padding: '10px 20px',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              {isLastStep ? 'Finalizar' : 'Próximo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(content, portalContainer)
}

export default QuickTour
