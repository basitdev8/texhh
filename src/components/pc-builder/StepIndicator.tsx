"use client";

import React from "react";
import { PCComponentType } from "@/types";
import styles from "./StepIndicator.module.css";

interface StepIndicatorProps {
  steps: PCComponentType[];
  currentStep: PCComponentType;
  completed: Record<string, boolean>;
  onStepChange: (step: PCComponentType) => void;
}

export default function StepIndicator({
  steps,
  currentStep,
  completed,
  onStepChange,
}: StepIndicatorProps) {
  return (
    <nav className={styles.steps} aria-label="PC build progress">
      {steps.map((step, i) => {
        const isActive = step === currentStep;
        const isCompleted = completed[step];
        return (
          <React.Fragment key={step}>
            <button
              className={`${styles.step} ${isActive ? styles.stepActive : ""} ${
                !isActive && isCompleted ? styles.stepCompleted : ""
              }`}
              onClick={() => onStepChange(step)}
              type="button"
            >
              <span className={styles.stepNumber}>
                {isCompleted && !isActive ? "✓" : i + 1}
              </span>
              {step}
            </button>
            {i < steps.length - 1 && <span className={styles.divider} />}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
