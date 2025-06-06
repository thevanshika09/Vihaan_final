import styles from "@/styles/verification/VerificationBadge.module.css"

interface VerificationBadgeProps {
  size?: "small" | "medium" | "large"
  className?: string
}

export default function VerificationBadge({ size = "medium", className }: VerificationBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[size]} ${className || ""}`}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.icon}>
        <path
          d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}
