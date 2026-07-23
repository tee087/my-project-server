'use client'

import { Dialog, Transition } from '@headlessui/react'
import { Fragment, ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  panelClassName?: string
}

export default function Modal({ open, onClose, children, panelClassName = '' }: ModalProps) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className={`w-full transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-2xl transition-all border-2 bg-[linear-gradient(#fff,#fff)_padding-box,linear-gradient(135deg,rgba(0,69,160,.06),rgba(56,189,248,.06),rgba(124,58,237,.06))_border-box] ${panelClassName}`}>
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
