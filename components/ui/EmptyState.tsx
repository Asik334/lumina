import { motion } from 'framer-motion'

interface EmptyStateProps {
  emoji?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ emoji = '✨', title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-20 text-center px-4"
    >
      <div className="w-20 h-20 rounded-2xl glass border border-white/10 flex items-center justify-center mb-6 text-3xl">
        {emoji}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-sm max-w-xs leading-relaxed mb-6">{description}</p>
      )}
      {action}
    </motion.div>
  )
}
