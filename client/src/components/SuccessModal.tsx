'use client'

import Modal from './Modal'
import { CheckCircle, MessageCircle } from 'lucide-react'

interface SuccessModalProps {
  open: boolean
  onClose: () => void
  amount: string
}

export function SuccessModal({ open, onClose, amount }: SuccessModalProps) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText('+254705322372')
  }

  return (
    <Modal open={open} onClose={onClose} panelClassName="max-w-md rounded-3xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex-shrink-0">
          <CheckCircle className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900">Withdrawal Submitted</h3>
      </div>
      <div className="text-sm text-slate-700 mb-4">
        Withdrawal of <span className="font-semibold text-brand-blue">${amount}</span> submitted.
        Wait for 5-10 mins. The funds will be deposited to your EcoCash account.
      </div>
      <div className="rounded-xl bg-slate-50 p-4 mb-4 border border-gray-100">
        <p className="text-xs text-slate-500 mb-2">If it delays, contact us on WhatsApp:</p>
        <a href="https://wa.me/254705322372" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-lg font-semibold text-emerald-600 hover:text-emerald-700">
          <MessageCircle className="h-5 w-5" />
          +254705322372
        </a>
      </div>
      <div className="flex justify-end">
        <button type="button" onClick={onClose} className="rounded-xl bg-gradient-to-r from-brand-blue to-brand-sky px-5 py-2 text-sm font-medium text-white hover:from-brand-blue/90 hover:to-brand-sky/90 transition-all duration-200">
          OK
        </button>
      </div>
    </Modal>
  )
}