import React, { useState } from 'react'
import { useTheme } from '../../../App'
import { useToast } from '../../../toast/Toast'

const Backdrop = ({ onClose }) => (
  <div className="fixed inset-0 z-40" style={{ backgroundColor: '#0f172a80' }} onClick={onClose} />
)

const AddH1BCompanyRole = ({ isOpen, onClose, onSubmit, companyName }) => {
  const { theme } = useTheme()
  const showToast = useToast()
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [link, setLink] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const submit = async (e) => {
    e.preventDefault()
    if (!title.trim() || submitting) return
    setSubmitting(true)
    try {
      await onSubmit({ title, location, link })
      showToast('Role added successfully', 'success')
      setTitle(''); setLocation(''); setLink('')
    } catch (err) {
      showToast('Failed to add role', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden" style={{ backgroundColor: theme.background.primary, borderColor: theme.border.light }}>
          <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: theme.border.light }}>
            <h3 className="text-lg font-bold" style={{ color: theme.text.primary }}>Add Role • {companyName}</h3>
            <button onClick={onClose} className="p-2 rounded-lg" title="Close" style={{ color: theme.text.secondary, backgroundColor: theme.background.secondary }}>✕</button>
          </div>
          <form onSubmit={submit} className="p-5 space-y-4">
            <input disabled={submitting} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Role title" className="w-full px-4 py-3 rounded-xl border" style={{ backgroundColor: theme.background.secondary, color: theme.text.primary, borderColor: theme.border.light }} />
            <input disabled={submitting} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="w-full px-4 py-3 rounded-xl border" style={{ backgroundColor: theme.background.secondary, color: theme.text.primary, borderColor: theme.border.light }} />
            <input disabled={submitting} value={link} onChange={(e) => setLink(e.target.value)} placeholder="Job link (optional)" className="w-full px-4 py-3 rounded-xl border" style={{ backgroundColor: theme.background.secondary, color: theme.text.primary, borderColor: theme.border.light }} />
            <div className="pt-1 flex justify-end">
              <button disabled={submitting} type="submit" className="px-5 py-2.5 rounded-xl text-sm font-medium shadow-lg flex items-center gap-2" style={{ background: theme.gradients.primary, color: theme.text.inverse }}>
                {submitting && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                {submitting ? 'Adding...' : 'Add Role'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default AddH1BCompanyRole


