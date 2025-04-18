"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import styles from "@/styles/layout/NavbarDropdown.module.css"
import { useAuth } from "@/lib/context/AuthContext"

interface NavItem {
  label: string
  href?: string
  onClick?: () => void
  icon?: string
}

interface NavbarDropdownProps {
  label: string
  items: NavItem[]
}

export default function NavbarDropdown({ label, items }: NavbarDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

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

  // Close dropdown when user state changes
  useEffect(() => {
    setIsOpen(false)
  }, [user])

  return (
    <div className={styles.dropdown} ref={dropdownRef}>
      <button
        className={styles.dropdownToggle}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {label === "Account" && user ? user.email : label}
        <span className={`${styles.arrow} ${isOpen ? styles.up : ""}`}>▼</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.dropdownMenu}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {label === "Account" && user && (
              <div className={styles.userInfo}>
                <p className={styles.userEmail}>{user.email}</p>
              </div>
            )}
            {items.map((item, index) => (
              item.href ? (
                <Link 
                  key={index} 
                  href={item.href} 
                  className={styles.dropdownItem} 
                  onClick={() => {
                    setIsOpen(false)
                    if (item.onClick) {
                      item.onClick()
                    }
                  }}
                >
                  {item.icon && <span className={styles.itemIcon}>{item.icon}</span>}
                  {item.label}
                </Link>
              ) : (
                <button 
                  key={index} 
                  className={styles.dropdownItem} 
                  onClick={() => {
                    setIsOpen(false)
                    if (item.onClick) {
                      item.onClick()
                    }
                  }}
                >
                  {item.icon && <span className={styles.itemIcon}>{item.icon}</span>}
                  {item.label}
                </button>
              )
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
