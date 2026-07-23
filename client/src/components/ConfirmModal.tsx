'use client'

import Modal from './Modal'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  onCancel?: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
}

export function ConfirmModal({ open, onClose, onConfirm, onCancel, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel' }: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} panelClassName="max-w-md">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <div className="mt-2 text-sm text-slate-700">{message}</div>
      <div className="mt-4 flex gap-3 justify-end">
        <button type="button" onClick={() => { onClose(); onCancel?.() }} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
          {cancelLabel}
        </button>
        <button type="button" onClick={() => { onConfirm(); onClose() }} className="rounded-lg bg-gradient-to-r from-brand-blue to-brand-sky px-4 py-2 text-sm font-medium text-white hover:from-brand-blue/90 hover:to-brand-sky/90 transition-colors">
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}