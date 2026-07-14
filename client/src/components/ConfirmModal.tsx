'use client'

import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'

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
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                  {title}
                </Dialog.Title>
                <div className="mt-2 text-sm text-gray-600">{message}</div>
                <div className="mt-4 flex gap-3 justify-end">
                  <button type="button" onClick={() => { onClose(); onCancel?.() }} className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    {cancelLabel}
                  </button>
                  <button type="button" onClick={() => { onConfirm(); onClose() }} className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue/90">
                    {confirmLabel}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}