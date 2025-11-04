import React, { useState } from 'react'
import { useTheme } from '../../../App'
import { useToast } from '../../../toast/Toast'

const Backdrop = ({ onClose }) => (
  <div className="fixed inset-0 z-40" style={{ backgroundColor: '#0f172a80' }} onClick={onClose} />
)

const AddH1BCompany = ({ isOpen, onClose, onSubmit }) => {
  const { theme } = useTheme()
  const showToast = useToast()
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [supports, setSupports] = useState('yes')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim() || submitting) return
    setSubmitting(true)
    try {
      await onSubmit({ name, website, supports })
      showToast('Company added successfully', 'success')
      setName(''); setWebsite(''); setSupports('yes')
    } catch (err) {
      showToast('Failed to add company', 'error')
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
            <h3 className="text-lg font-bold" style={{ color: theme.text.primary }}>Add Company</h3>
            <button onClick={onClose} className="p-2 rounded-lg" title="Close" style={{ color: theme.text.secondary, backgroundColor: theme.background.secondary }}>✕</button>
          </div>
          <form onSubmit={submit} className="p-5 space-y-4">
            <input disabled={submitting} value={name} onChange={(e) => setName(e.target.value)} placeholder="Company name" className="w-full px-4 py-3 rounded-xl border" style={{ backgroundColor: theme.background.secondary, color: theme.text.primary, borderColor: theme.border.light }} />
            <input disabled={submitting} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Website (optional)" className="w-full px-4 py-3 rounded-xl border" style={{ backgroundColor: theme.background.secondary, color: theme.text.primary, borderColor: theme.border.light }} />
            <div className="flex items-center gap-3">
              <label className="text-sm" style={{ color: theme.text.secondary }}>Sponsorship</label>
              <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: theme.border.light }}>
                <button disabled={submitting} type="button" onClick={() => setSupports('yes')} className="px-4 py-2 text-sm font-medium" style={{ backgroundColor: supports === 'yes' ? theme.status.offer : theme.background.primary, color: supports === 'yes' ? theme.text.inverse : theme.text.primary }}>Supports</button>
                <button disabled={submitting} type="button" onClick={() => setSupports('no')} className="px-4 py-2 text-sm font-medium border-l" style={{ backgroundColor: supports === 'no' ? theme.status.rejected : theme.background.primary, color: supports === 'no' ? theme.text.inverse : theme.text.primary, borderColor: theme.border.light }}>No Support</button>
              </div>
            </div>
            <div className="pt-1 flex justify-end">
              <button disabled={submitting} type="submit" className="px-5 py-2.5 rounded-xl text-sm font-medium shadow-lg flex items-center gap-2" style={{ background: theme.gradients.primary, color: theme.text.inverse }}>
                {submitting && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                {submitting ? 'Adding...' : 'Add Company'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default AddH1BCompany


