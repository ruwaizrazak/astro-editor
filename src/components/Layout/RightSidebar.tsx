import React from 'react'

interface RightSidebarProps {
  children: React.ReactNode
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ children }) => {
  return (
    <div className="h-full flex flex-col bg-background border-l border-border overflow-hidden">
      {children}
    </div>
  )
}