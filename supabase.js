import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from './supabase'
import * as XLSX from 'xlsx'

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = ['Elétrica', 'Pesada', 'Medição', 'Manual', 'Hidráulica', 'Outra']
const USER_KEY = 'ft_username'

const STATUS = {
  available: { label: 'Disponível', color: '#22c55e', bg: '#052e16' },
  out:       { label: 'Em Obra',    color: '#f97316', bg: '#1c0a00' },
  overdue:   { label: 'Atrasado',   color: '#ef4444', bg: '#200000' },
}

const TABS = [
  { id: 'dashboard',   label: 'Início',      icon: '◈' },
  { id: 'ferramentas', label: 'Ferramentas', icon: '⚙' },
  { id: 'obras',       label: 'Obras',       icon: '⬡' },
  { id: 'historico',   label: 'Histórico',   icon: '≡' },
]

// ─── Shared UI ────────────────────────────────────────────────────────────────
function Badge({ status }) {
  const s = STATUS[status]
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.color}40`,
      padding: '3px 10px', borderRadius: 99, fontSize: 10,
      fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>{s.label}</span>
  )
}

function Btn({ children, onClick, variant = 'primary', full, small, disabled }) {
  const bgs = { primary: '#d97706', blue: '#1d4ed8', green: '#15803d', ghost: 'transparent', danger: '#b91c1c' }
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: full ? '100%' : 'auto',
      padding: small ? '7px 14px' : '11px 20px',
      borderRadius: 9,
      border: variant === 'ghost' ? '1px solid #2a2a2a' : 'none',
      background: bgs[variant] || bgs.primary,
      color: variant === 'ghost' ? '#777' : '#fff',
      fontSize: small ? 12 : 13, fontWeight: 700,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      fontFamily: 'inherit', letterSpacing: '0.02em',
      transition: 'opacity 0.15s, transform 0.1s',
    }}
      onPointerDown={e => !disabled && (e.currentTarget.style.transform = 'scale(0.96)')}
      onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
    >{children}</button>
  )
}

const inputBase = {
  width: '100%', background: '#161616', border: '1px solid #252525',
  borderRadius: 9, padding: '11px 13px', color: '#fff', fontSize: 14,
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: 'block', fontSize: 10, color: '#666', marginBottom: 6, letterSpacing: '0.09em', textTransform: 'uppercase' }}>{label}</label>}
      {children}
    </div>
  )
}

function Input({ label, ...props }) {
  return (
    <Field label={label}>
      <input {...props} style={inputBase}
        onFocus={e => (e.target.style.borderColor = '#d97706')}
        onBlur={e => (e.target.style.borderColor = '#252525')} />
    </Field>
  )
}

function SelectField({ label, children, ...props }) {
  return (
    <Field label={label}>
      <select {...props} style={{ ...inputBase, cursor: 'pointer' }}>{children}</select>
    </Field>
  )
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'fadeIn 0.18s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#111', borderRadius: '20px 20px 0 0',
        border: '1px solid #222', borderBottom: 'none',
        width: '100%', maxWidth: 560,
        maxHeight: '92dvh', overflowY: 'auto',
        padding: '20px 20px 44px',
        animation: 'slideUp 0.22s ease',
      }}>
        <div style={{ width: 36, height: 4, background: '#2a2a2a', borderRadius: 99, margin: '0 auto 18px' }} />
        {title && <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 800, marginBottom: 18 }}>{title}</h2>}
        {children}
      </div>
    </div>
  )
}

function Toast({ msg, type }) {
  return (
    <div style={{
      position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)',
      zIndex: 300,
      background: type === 'error' ? '#1c0000' : '#052e16',
      border: `1px solid ${type === 'error' ? '#ef444455' : '#22c55e55'}`,
      color: type === 'error' ? '#f87171' : '#4ade80',
      padding: '12px 22px', borderRadius: 12, fontSize: 13, fontWeight: 600,
      boxShadow: '0 8px 40px #0009', whiteSpace: 'nowrap',
      animation: 'slideUp 0.2s ease',
    }}>{msg}</div>
  )
}

function Spinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60dvh', gap: 16 }}>
      <div style={{ width: 32, height: 32, border: '3px solid #222', borderTop: '3px solid #d97706', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: '#555', fontSize: 12 }}>Carregando...</span>
    </div>
  )
}

function SyncDot({ online }) {
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
      background: online ? '#22c55e' : '#ef4444',
      marginLeft: 6, boxShadow: online ? '0 0 6px #22c55e88' : 'none',
      verticalAlign: 'middle',
    }} />
  )
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    const trimmed = name.trim()
    if (trimmed.length < 2) { setError('Digite pelo menos 2 caracteres.'); return }
    onLogin(trimmed)
  }

  return (
    <div style={{
      minHeight: '100dvh', background: '#0a0a0a', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 32, fontFamily: "'DM Mono', monospace",
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: 'center', animation: 'slideUp 0.3s ease' }}>
        <div style={{
          width: 72, height: 72, background: '#d97706', borderRadius: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, margin: '0 auto 16px',
          boxShadow: '0 0 40px #d9770633',
        }}>🔧</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>
          FerramentasTrack
        </h1>
        <p style={{ color: '#555', fontSize: 12 }}>Controle de ferramentas para obras</p>
      </div>

      {/* Card */}
      <div style={{
        background: '#111', border: '1px solid #1e1e1e', borderRadius: 20,
        padding: '32px 28px', width: '100%', maxWidth: 360,
        animation: 'slideUp 0.35s ease',
      }}>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 24, lineHeight: 1.6 }}>
          Digite seu nome para entrar.<br />
          <span style={{ color: '#555', fontSize: 11 }}>Suas ações ficarão registradas no sistema.</span>
        </p>

        <Field label="Seu nome">
          <input
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Ex: Carlos Mendes"
            autoFocus
            style={{
              ...inputBase,
              fontSize: 16,
              borderColor: error ? '#ef4444' : '#252525',
            }}
            onFocus={e => (e.target.style.borderColor = error ? '#ef4444' : '#d97706')}
            onBlur={e => (e.target.style.borderColor = error ? '#ef4444' : '#252525')}
          />
          {error && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 6 }}>{error}</p>}
        </Field>

        <Btn full onClick={handleSubmit}>Entrar no App →</Btn>
      </div>

      <p style={{ color: '#333', fontSize: 11, marginTop: 28, textAlign: 'center' }}>
        Sem senha — só seu nome é necessário
      </p>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem(USER_KEY) || null)

  const [tools,   setTools]   = useState([])
  const [sites,   setSites]   = useState([])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [online,  setOnline]  = useState(true)

  const [tab,    setTab]    = useState('dashboard')
  const [modal,  setModal]  = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [form,   setForm]   = useState({})
  const [saving, setSaving] = useState(false)
  const [toast,  setToast]  = useState(null)

  const today = new Date().toISOString().split('T')[0]

  const handleLogin = (name) => {
    localStorage.setItem(USER_KEY, name)
    setCurrentUser(name)
  }

  const handleLogout = () => {
    localStorage.removeItem(USER_KEY)
    setCurrentUser(null)
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }

  const setF = key => e => setForm(f => ({ ...f, [key]: e.target.value }))
  const closeModal = () => { setModal(null); setForm({}) }

  // Load data
  useEffect(() => {
    if (!currentUser) return
    async function load() {
      try {
        const [t, s, r] = await Promise.all([
          supabase.from('tools').select('*').order('created_at'),
          supabase.from('sites').select('*').order('created_at'),
          supabase.from('records').select('*').order('created_at'),
        ])
        if (t.error || s.error || r.error) throw new Error()
        setTools(t.data); setSites(s.data); setRecords(r.data)
        setOnline(true)
      } catch {
        setOnline(false)
        showToast('Sem conexão com o banco de dados.', 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [currentUser])

  // Realtime
  useEffect(() => {
    if (!currentUser) return
    const channel = supabase.channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tools' }, p => {
        if (p.eventType === 'INSERT') setTools(v => [...v, p.new])
        if (p.eventType === 'UPDATE') setTools(v => v.map(r => r.id === p.new.id ? p.new : r))
        if (p.eventType === 'DELETE') setTools(v => v.filter(r => r.id !== p.old.id))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sites' }, p => {
        if (p.eventType === 'INSERT') setSites(v => [...v, p.new])
        if (p.eventType === 'UPDATE') setSites(v => v.map(r => r.id === p.new.id ? p.new : r))
        if (p.eventType === 'DELETE') setSites(v => v.filter(r => r.id !== p.old.id))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'records' }, p => {
        if (p.eventType === 'INSERT') setRecords(v => [...v, p.new])
        if (p.eventType === 'UPDATE') setRecords(v => v.map(r => r.id === p.new.id ? p.new : r))
        if (p.eventType === 'DELETE') setRecords(v => v.filter(r => r.id !== p.old.id))
      })
      .subscribe(status => setOnline(status === 'SUBSCRIBED'))
    return () => supabase.removeChannel(channel)
  }, [currentUser])

  // Helpers
  const getToolStatus = useCallback((toolId) => {
    const active = records.find(r => r.tool_id === toolId && !r.actual_return)
    if (!active) return 'available'
    return active.return_date < today ? 'overdue' : 'out'
  }, [records, today])

  const getActiveRecord = useCallback((toolId) =>
    records.find(r => r.tool_id === toolId && !r.actual_return), [records])

  const stats = useMemo(() => ({
    total:     tools.length,
    available: tools.filter(t => getToolStatus(t.id) === 'available').length,
    out:       tools.filter(t => getToolStatus(t.id) === 'out').length,
    overdue:   tools.filter(t => getToolStatus(t.id) === 'overdue').length,
  }), [tools, getToolStatus])

  const filteredTools = useMemo(() => tools.filter(t => {
    const s = getToolStatus(t.id)
    return (filter === 'all' || s === filter) &&
      (t.name.toLowerCase().includes(search.toLowerCase()) ||
       t.serial.toLowerCase().includes(search.toLowerCase()))
  }), [tools, filter, search, getToolStatus])

  // Actions
  const handleSend = async () => {
    if (!form.toolId || !form.siteId || !form.responsible || !form.deliveryDate || !form.returnDate) {
      showToast('Preencha todos os campos obrigatórios.', 'error'); return
    }
    setSaving(true)
    const { error } = await supabase.from('records').insert({
      tool_id: +form.toolId, site_id: +form.siteId,
      responsible: form.responsible,
      delivery_date: form.deliveryDate,
      return_date: form.returnDate,
      actual_return: null,
      notes: form.notes || '',
      created_by: currentUser,
    })
    setSaving(false)
    if (error) { showToast('Erro ao salvar.', 'error'); return }
    closeModal(); showToast('Saída registrada!')
  }

  const handleReturn = async (recordId) => {
    setSaving(true)
    const { error } = await supabase.from('records')
      .update({ actual_return: today, returned_by: currentUser })
      .eq('id', recordId)
    setSaving(false)
    if (error) { showToast('Erro ao registrar devolução.', 'error'); return }
    closeModal(); showToast('Devolução registrada!')
  }

  const handleAddTool = async () => {
    if (!form.toolName?.trim() || !form.toolSerial?.trim() || !form.toolCategory) {
      showToast('Preencha todos os campos.', 'error'); return
    }
    setSaving(true)
    const { error } = await supabase.from('tools').insert({
      name: form.toolName.trim(), serial: form.toolSerial.trim(), category: form.toolCategory,
    })
    setSaving(false)
    if (error?.code === '23505') { showToast('Serial já cadastrado.', 'error'); return }
    if (error) { showToast('Erro ao salvar.', 'error'); return }
    closeModal(); showToast(`"${form.toolName.trim()}" cadastrada!`)
  }

  const handleAddSite = async () => {
    if (!form.siteName?.trim() || !form.siteAddress?.trim()) {
      showToast('Preencha todos os campos.', 'error'); return
    }
    setSaving(true)
    const { error } = await supabase.from('sites').insert({
      name: form.siteName.trim(), address: form.siteAddress.trim(),
    })
    setSaving(false)
    if (error) { showToast('Erro ao salvar.', 'error'); return }
    closeModal(); showToast(`Obra "${form.siteName.trim()}" cadastrada!`)
  }

  const handleExport = () => {
    try {
      const wb = XLSX.utils.book_new()
      const histData = records.map(r => {
        const tool = tools.find(t => t.id === r.tool_id)
        const site = sites.find(s => s.id === r.site_id)
        return {
          'Ferramenta': tool?.name || '', 'Serial': tool?.serial || '', 'Categoria': tool?.category || '',
          'Obra': site?.name || '', 'Endereço': site?.address || '',
          'Responsável': r.responsible,
          'Data de Entrega': r.delivery_date, 'Prev. Devolução': r.return_date,
          'Devolução Real': r.actual_return || '',
          'Status': r.actual_return ? 'Devolvida' : r.return_date < today ? 'Atrasada' : 'Em Obra',
          'Registrado por': r.created_by || '',
          'Devolução registrada por': r.returned_by || '',
          'Observações': r.notes || '',
        }
      })
      const ws1 = XLSX.utils.json_to_sheet(histData.length ? histData : [{ 'Sem registros': '' }])
      ws1['!cols'] = [22,12,12,22,35,18,14,16,14,12,18,20,22].map(w => ({ wch: w }))
      XLSX.utils.book_append_sheet(wb, ws1, 'Histórico')

      const ws2 = XLSX.utils.json_to_sheet(tools.map(t => {
        const s = getToolStatus(t.id); const rec = getActiveRecord(t.id)
        return {
          'Nome': t.name, 'Serial': t.serial, 'Categoria': t.category,
          'Status': STATUS[s].label,
          'Obra Atual': sites.find(s => s.id === rec?.site_id)?.name || '—',
          'Responsável': rec?.responsible || '—',
          'Devolução Prevista': rec?.return_date || '—',
        }
      }))
      XLSX.utils.book_append_sheet(wb, ws2, 'Ferramentas')

      const ws3 = XLSX.utils.json_to_sheet(sites.map(s => {
        const active = records.filter(r => r.site_id === s.id && !r.actual_return)
        return {
          'Obra': s.name, 'Endereço': s.address, 'Qtd. Ativas': active.length,
          'Ferramentas': active.map(r => tools.find(t => t.id === r.tool_id)?.name).join(', ') || '—',
        }
      }))
      XLSX.utils.book_append_sheet(wb, ws3, 'Obras')

      XLSX.writeFile(wb, `FerramentasTrack_${today}.xlsx`)
      showToast('Planilha exportada! ✅')
    } catch { showToast('Erro ao exportar.', 'error') }
  }

  // ── Render login ─────────────────────────────────────────────────────────────
  if (!currentUser) return <LoginScreen onLogin={handleLogin} />
  if (loading) return <Spinner />

  // ── Render app ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0a', color: '#fff', fontFamily: "'DM Mono', monospace", paddingBottom: 84 }}>

      {toast && <Toast {...toast} />}

      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: '#0d0d0d', borderBottom: '1px solid #181818',
        padding: '0 16px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 'env(safe-area-inset-top)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: '#d97706', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🔧</div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14 }}>
            FerramentasTrack <SyncDot online={online} />
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Btn small variant="green" onClick={handleExport}>↓</Btn>
          {/* User chip */}
          <button onClick={() => setModal('user')} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: '#1a1a1a', border: '1px solid #2a2a2a',
            borderRadius: 99, padding: '5px 12px 5px 8px',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#000' }}>
              {currentUser[0].toUpperCase()}
            </div>
            <span style={{ color: '#aaa', fontSize: 11, fontWeight: 700, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser}</span>
          </button>
        </div>
      </div>

      {/* Page */}
      <div style={{ padding: '20px 16px', maxWidth: 640, margin: '0 auto' }}>

        {/* ══ DASHBOARD ══ */}
        {tab === 'dashboard' && (
          <div style={{ animation: 'slideUp 0.2s ease' }}>
            <div style={{ marginBottom: 22 }}>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800 }}>
                Olá, {currentUser.split(' ')[0]} 👋
              </h1>
              <p style={{ color: '#555', fontSize: 12, marginTop: 3 }}>Status em tempo real das ferramentas</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Total no Inventário', value: stats.total,     color: '#aaa',    icon: '🔩' },
                { label: 'Disponíveis',          value: stats.available, color: '#22c55e', icon: '✅' },
                { label: 'Em Obra',              value: stats.out,       color: '#f97316', icon: '🏗️' },
                { label: 'Devoluções Atrasadas', value: stats.overdue,   color: '#ef4444', icon: '⚠️' },
              ].map(s => (
                <div key={s.label} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 14, padding: '16px 18px' }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#555', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {stats.overdue > 0 && (
              <div style={{ background: '#160000', border: '1px solid #ef444430', borderRadius: 12, padding: '14px 16px', marginBottom: 18 }}>
                <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', marginBottom: 10 }}>⚠️ DEVOLUÇÕES ATRASADAS</div>
                {tools.filter(t => getToolStatus(t.id) === 'overdue').map(t => {
                  const r = getActiveRecord(t.id)
                  const site = sites.find(s => s.id === r?.site_id)
                  return (
                    <div key={t.id} style={{ fontSize: 12, color: '#fca5a5', marginBottom: 6, lineHeight: 1.6 }}>
                      <strong>{t.name}</strong><br />
                      <span style={{ color: '#888' }}>{site?.name} · {r?.responsible} · Previsto: {r?.return_date}</span>
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Btn full onClick={() => setModal('send')}>+ Registrar Saída de Ferramenta</Btn>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Btn full variant="blue" onClick={() => setModal('addTool')}>+ Nova Ferramenta</Btn>
                <Btn full variant="blue" onClick={() => setModal('addSite')}>+ Nova Obra</Btn>
              </div>
            </div>
          </div>
        )}

        {/* ══ FERRAMENTAS ══ */}
        {tab === 'ferramentas' && (
          <div style={{ animation: 'slideUp 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800 }}>Ferramentas</h1>
                <p style={{ color: '#555', fontSize: 11, marginTop: 1 }}>{tools.length} cadastradas</p>
              </div>
              <Btn small variant="blue" onClick={() => setModal('addTool')}>+ Nova</Btn>
            </div>

            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍  Buscar por nome ou serial..."
              style={{ ...inputBase, marginBottom: 10 }} />

            <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
              {['all', 'available', 'out', 'overdue'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '6px 13px', borderRadius: 99,
                  border: `1px solid ${filter === f ? '#d97706' : '#1e1e1e'}`,
                  background: filter === f ? '#1e1e1e' : 'transparent',
                  color: filter === f ? '#d97706' : '#555',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
                }}>{f === 'all' ? 'Todos' : STATUS[f]?.label}</button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredTools.length === 0 && (
                <div style={{ color: '#333', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>Nenhuma ferramenta encontrada.</div>
              )}
              {filteredTools.map(tool => {
                const status = getToolStatus(tool.id)
                const rec = getActiveRecord(tool.id)
                const site = sites.find(s => s.id === rec?.site_id)
                return (
                  <div key={tool.id} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: rec ? 8 : 0 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{tool.name}</div>
                        <div style={{ fontSize: 11, color: '#555' }}>{tool.serial} · {tool.category}</div>
                      </div>
                      <Badge status={status} />
                    </div>
                    {rec && (
                      <div style={{ background: '#161616', borderRadius: 8, padding: '9px 11px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, fontSize: 11, color: '#777', lineHeight: 1.7 }}>
                          📍 {site?.name}<br />
                          👤 {rec.responsible} · Dev: <span style={{ color: rec.return_date < today ? '#ef4444' : '#888' }}>{rec.return_date}</span><br />
                          <span style={{ color: '#444' }}>Saída por: {rec.created_by}</span>
                        </div>
                        <Btn small variant="ghost" onClick={() => { setForm({ recordId: rec.id, toolName: tool.name }); setModal('return') }}>Devolver</Btn>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ══ OBRAS ══ */}
        {tab === 'obras' && (
          <div style={{ animation: 'slideUp 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800 }}>Obras</h1>
                <p style={{ color: '#555', fontSize: 11, marginTop: 1 }}>{sites.length} cadastradas</p>
              </div>
              <Btn small variant="blue" onClick={() => setModal('addSite')}>+ Nova</Btn>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sites.map(site => {
                const active = records.filter(r => r.site_id === site.id && !r.actual_return)
                return (
                  <div key={site.id} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 14, padding: '16px' }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 2 }}>🏗️ {site.name}</div>
                    <div style={{ fontSize: 11, color: '#555', marginBottom: 12 }}>📍 {site.address}</div>
                    {active.length === 0
                      ? <div style={{ fontSize: 12, color: '#2a2a2a', fontStyle: 'italic' }}>Nenhuma ferramenta alocada.</div>
                      : active.map(r => {
                          const tool = tools.find(t => t.id === r.tool_id)
                          const overdue = r.return_date < today
                          return (
                            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#161616', borderRadius: 9, padding: '10px 12px', marginBottom: 6 }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{tool?.name}</div>
                                <div style={{ fontSize: 11, color: '#555' }}>
                                  {r.responsible} · Dev: <span style={{ color: overdue ? '#ef4444' : '#666' }}>{r.return_date}</span>
                                </div>
                              </div>
                              <Badge status={overdue ? 'overdue' : 'out'} />
                              <Btn small variant="ghost" onClick={() => { setForm({ recordId: r.id, toolName: tool?.name }); setModal('return') }}>Dev.</Btn>
                            </div>
                          )
                        })
                    }
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ══ HISTÓRICO ══ */}
        {tab === 'historico' && (
          <div style={{ animation: 'slideUp 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800 }}>Histórico</h1>
                <p style={{ color: '#555', fontSize: 11, marginTop: 1 }}>{records.length} registros</p>
              </div>
              <Btn small variant="green" onClick={handleExport}>↓ Exportar</Btn>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...records].reverse().map(r => {
                const tool = tools.find(t => t.id === r.tool_id)
                const site = sites.find(s => s.id === r.site_id)
                const status = r.actual_return ? 'available' : r.return_date < today ? 'overdue' : 'out'
                return (
                  <div key={r.id} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, padding: '13px 15px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{tool?.name}</div>
                      <Badge status={status} />
                    </div>
                    <div style={{ fontSize: 11, color: '#666', lineHeight: 1.9 }}>
                      🏗️ {site?.name}<br />
                      👤 {r.responsible}<br />
                      📤 Saída: {r.delivery_date} · Prev: <span style={{ color: r.return_date < today && !r.actual_return ? '#ef4444' : '#666' }}>{r.return_date}</span>
                      {r.actual_return && <><br />📥 Devolvida: <span style={{ color: '#22c55e' }}>{r.actual_return}</span> por <span style={{ color: '#888' }}>{r.returned_by}</span></>}
                      <br /><span style={{ color: '#3a3a3a' }}>Registrado por: {r.created_by}</span>
                      {r.notes && <><br />📝 {r.notes}</>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: '#0d0d0d', borderTop: '1px solid #181818',
        display: 'flex', paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '10px 4px 8px',
            background: 'none', border: 'none',
            color: tab === t.id ? '#d97706' : '#444',
            fontSize: 10, fontWeight: 700, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            fontFamily: 'inherit', letterSpacing: '0.04em', transition: 'color 0.15s',
          }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {/* FAB */}
      {tab !== 'historico' && (
        <button onClick={() => setModal('send')} style={{
          position: 'fixed', bottom: 80, right: 20, zIndex: 60,
          width: 52, height: 52, borderRadius: '50%',
          background: '#d97706', border: 'none', color: '#fff',
          fontSize: 26, cursor: 'pointer', boxShadow: '0 4px 20px #d9770655',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
          onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.9)')}
          onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
        >＋</button>
      )}

      {/* ══ MODAIS ══ */}

      {modal === 'user' && (
        <Modal title="Minha conta" onClose={closeModal}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, background: '#161616', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#000', flexShrink: 0 }}>
              {currentUser[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{currentUser}</div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>Usuário ativo</div>
            </div>
          </div>
          <p style={{ fontSize: 12, color: '#666', marginBottom: 20, lineHeight: 1.6 }}>
            Suas ações ficam registradas no histórico com seu nome. Para trocar de usuário, clique em Sair.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn full variant="danger" onClick={() => { handleLogout(); closeModal() }}>Sair / Trocar usuário</Btn>
            <Btn variant="ghost" onClick={closeModal}>✕</Btn>
          </div>
        </Modal>
      )}

      {modal === 'send' && (
        <Modal title="📤 Registrar Saída" onClose={closeModal}>
          <div style={{ background: '#161616', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 11, color: '#666' }}>
            Registrando como: <strong style={{ color: '#d97706' }}>{currentUser}</strong>
          </div>
          <SelectField label="Ferramenta disponível *" value={form.toolId || ''} onChange={setF('toolId')}>
            <option value="">Selecione...</option>
            {tools.filter(t => getToolStatus(t.id) === 'available').map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.serial})</option>
            ))}
          </SelectField>
          <SelectField label="Obra de destino *" value={form.siteId || ''} onChange={setF('siteId')}>
            <option value="">Selecione...</option>
            {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </SelectField>
          <Input label="Responsável pela ferramenta *" value={form.responsible || ''} onChange={setF('responsible')} placeholder="Quem vai usar a ferramenta?" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Input label="Data de entrega *" type="date" value={form.deliveryDate || today} onChange={setF('deliveryDate')} />
            <Input label="Prev. devolução *" type="date" value={form.returnDate || ''} onChange={setF('returnDate')} />
          </div>
          <Input label="Observações" value={form.notes || ''} onChange={setF('notes')} placeholder="Opcional..." />
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <Btn full onClick={handleSend} disabled={saving}>{saving ? 'Salvando...' : 'Confirmar Saída'}</Btn>
            <Btn variant="ghost" onClick={closeModal}>✕</Btn>
          </div>
        </Modal>
      )}

      {modal === 'return' && (
        <Modal title="📥 Registrar Devolução" onClose={closeModal}>
          <div style={{ background: '#161616', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 11, color: '#666' }}>
            Registrando como: <strong style={{ color: '#d97706' }}>{currentUser}</strong>
          </div>
          <p style={{ color: '#888', fontSize: 14, marginBottom: 22, lineHeight: 1.7 }}>
            Confirma a devolução de<br /><strong style={{ color: '#fff' }}>{form.toolName}</strong><br />
            em <strong style={{ color: '#d97706' }}>{today}</strong>?
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn full onClick={() => handleReturn(form.recordId)} disabled={saving}>{saving ? 'Salvando...' : 'Confirmar Devolução'}</Btn>
            <Btn variant="ghost" onClick={closeModal}>✕</Btn>
          </div>
        </Modal>
      )}

      {modal === 'addTool' && (
        <Modal title="🔩 Nova Ferramenta" onClose={closeModal}>
          <Input label="Nome da ferramenta *" value={form.toolName || ''} onChange={setF('toolName')} placeholder="Ex: Furadeira Dewalt 800W" />
          <Input label="Número de série / código *" value={form.toolSerial || ''} onChange={setF('toolSerial')} placeholder="Ex: DWT-007" />
          <SelectField label="Categoria *" value={form.toolCategory || ''} onChange={setF('toolCategory')}>
            <option value="">Selecione...</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </SelectField>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <Btn full variant="blue" onClick={handleAddTool} disabled={saving}>{saving ? 'Salvando...' : 'Cadastrar'}</Btn>
            <Btn variant="ghost" onClick={closeModal}>✕</Btn>
          </div>
        </Modal>
      )}

      {modal === 'addSite' && (
        <Modal title="🏗️ Nova Obra" onClose={closeModal}>
          <Input label="Nome da obra *" value={form.siteName || ''} onChange={setF('siteName')} placeholder="Ex: Reforma Jardins" />
          <Input label="Endereço completo *" value={form.siteAddress || ''} onChange={setF('siteAddress')} placeholder="Ex: Rua Augusta, 500 - SP" />
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <Btn full variant="blue" onClick={handleAddSite} disabled={saving}>{saving ? 'Salvando...' : 'Cadastrar'}</Btn>
            <Btn variant="ghost" onClick={closeModal}>✕</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
