"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import styles from "@/styles/layout/ProfileDropdown.module.css"
import { useAuth } from "@/lib/context/AuthContext"

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user, logout } = useAuth()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  if (!user) {
    return (
      <Link href="/auth/login" className={styles.loginButton}>
        Login
      </Link>
    )
  }

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        className={styles.profileButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt={user.email || "User"} className={styles.avatar} />
        ) : (
          <div className={styles.avatarPlaceholder}>
            {user.email?.charAt(0).toUpperCase() || "U"}
          </div>
        )}
        <span className={styles.chevron}>▼</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{user.email}</p>
            <p className={styles.userEmail}>{user.email}</p>
          </div>

          <div className={styles.divider}></div>

          <ul className={styles.menuItems}>
            <li>
              <Link href="/profile" className={styles.menuItem}>
                <span className={styles.menuIcon}>👤</span>
                Profile
              </Link>
            </li>
            <li>
              <Link href="/referral" className={styles.menuItem}>
                <span className={styles.menuIcon}>🎁</span>
                Referrals
              </Link>
            </li>
            <li>
              <Link href="/wallet" className={styles.menuItem}>
                <span className={styles.menuIcon}>💰</span>
                Wallet
              </Link>
            </li>
            <li>
              <Link href="/settings" className={styles.menuItem}>
                <span className={styles.menuIcon}>⚙️</span>
                Settings
              </Link>
            </li>

            <div className={styles.divider}></div>

            <li>
              <button className={styles.logoutButton} onClick={logout}>
                <span className={styles.menuIcon}>🚪</span>
                Logout
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
