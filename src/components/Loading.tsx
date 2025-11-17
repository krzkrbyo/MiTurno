import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className="h-8 w-8 text-primary" />
      </motion.div>
    </div>
  )
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={className}
    >
      <Loader2 className="h-4 w-4 text-primary" />
    </motion.div>
  )
}
