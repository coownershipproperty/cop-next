import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toE164 } from '@/lib/phone'

function whatsappUrl(phone) {
  return phone ? `https://wa.me/${phone.replace(/\D/g, '')}` : null
}

function callId(call) {
  if (!call) return null
  return call.id || call.callId || call.telnyxCallControlId || call.telnyxSessionId || call.telnyxLegId || null
}

function errorMessage(error) {
  if (error instanceof Error) return error.message
  return error?.error?.message || error?.message || String(error || 'The call could not be started.')
}

async function adminRequest(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Your admin session has expired. Sign in again.')
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...(options.headers || {}),
    },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || 'The request could not be completed.')
  return payload
}

export default function LeadCommunicationPanel({ leadId, contactId, leadName, phone, email, country }) {
  const remoteAudioId = useId().replace(/:/g, '')
  const dialNumber = useMemo(() => toE164(phone, { country, email }), [phone, country, email])
  const whatsapp = useMemo(() => whatsappUrl(dialNumber), [dialNumber])
  const clientRef = useRef(null)
  const callRef = useRef(null)
  const callerIdRef = useRef(null)
  const readyRef = useRef(false)
  const lastLoggedRef = useRef('')
  const [state, setState] = useState('idle')
  const [callState, setCallState] = useState('')
  const [message, setMessage] = useState('')

  const logCall = useCallback(async (status, extra = {}) => {
    if (!dialNumber || lastLoggedRef.current === status) return
    lastLoggedRef.current = status
    await adminRequest('/api/admin/telnyx/calls', {
      method: 'POST',
      body: JSON.stringify({
        leadId,
        contactId,
        destinationNumber: dialNumber,
        callerNumber: callerIdRef.current,
        telnyxCallId: callId(callRef.current),
        status,
        state: callState,
        metadata: extra,
      }),
    }).catch(() => undefined)
  }, [callState, contactId, dialNumber, leadId])

  const handleNotification = useCallback((notification) => {
    if (notification.type !== 'callUpdate' || !notification.call) return
    const call = notification.call
    const nextState = call.state || 'unknown'
    callRef.current = call
    setCallState(nextState)
    if (nextState === 'active') {
      setState('active'); setMessage('Call connected.'); void logCall('answered', { state: nextState })
    } else if (nextState === 'hangup' || nextState === 'destroy') {
      setState('idle'); setMessage('Call ended.'); void logCall('ended', { state: nextState }); callRef.current = null
    } else if (['trying', 'requesting', 'early'].includes(nextState)) {
      setState('calling'); setMessage('Calling…')
    }
  }, [logCall])

  const connect = useCallback(async (credentials) => {
    if (clientRef.current && readyRef.current) return clientRef.current
    const { TelnyxRTC } = await import('@telnyx/webrtc')
    const client = new TelnyxRTC(credentials.auth.type === 'token'
      ? { login_token: credentials.auth.loginToken, enableCallReports: true }
      : { login: credentials.auth.login, password: credentials.auth.password, enableCallReports: true })
    client.remoteElement = remoteAudioId
    clientRef.current = client

    await new Promise((resolve, reject) => {
      let settled = false
      const timeout = window.setTimeout(() => {
        if (!settled) { settled = true; reject(new Error('The calling service did not become ready within 15 seconds.')) }
      }, 15000)
      client
        .on('telnyx.ready', () => {
          readyRef.current = true; setState('ready'); setMessage('Calling service connected.')
          if (!settled) { settled = true; window.clearTimeout(timeout); resolve() }
        })
        .on('telnyx.error', (error) => {
          const detail = errorMessage(error); setState('error'); setMessage(detail); void logCall('failed', { source: 'telnyx.error', error: detail })
          if (!settled) { settled = true; window.clearTimeout(timeout); reject(new Error(detail)) }
        })
        .on('telnyx.rtc.mediaError', (error) => {
          const detail = errorMessage(error); setState('error'); setMessage(detail); void logCall('failed', { source: 'media', error: detail })
          if (!settled) { settled = true; window.clearTimeout(timeout); reject(new Error(detail)) }
        })
        .on('telnyx.notification', handleNotification)
      client.connect().catch((error) => {
        if (!settled) { settled = true; window.clearTimeout(timeout); reject(error) }
      })
    })
    return client
  }, [handleNotification, logCall, remoteAudioId])

  async function startCall() {
    if (!dialNumber) { setState('error'); setMessage('Add a valid international phone number before calling.'); return }
    setState('connecting'); setMessage('Connecting to the calling service…'); lastLoggedRef.current = ''
    try {
      const credentials = await adminRequest('/api/admin/telnyx/token', { method: 'POST' })
      callerIdRef.current = credentials.callerId
      const client = await connect(credentials)
      setState('calling'); setMessage(`Calling ${dialNumber}…`); void logCall('started', { leadName })
      callRef.current = client.newCall({
        destinationNumber: dialNumber,
        callerNumber: credentials.callerId,
        callerName: 'Co-Ownership Property',
        remoteElement: remoteAudioId,
        audio: true,
        video: false,
      })
    } catch (error) {
      const detail = errorMessage(error)
      setState('error'); setMessage(detail); void logCall('failed', { error: detail })
    }
  }

  async function hangup() {
    if (!callRef.current) return
    setState('ending'); setMessage('Ending call…')
    await callRef.current.hangup().catch(() => undefined)
    callRef.current = null
    setState('idle'); setMessage('Call ended.'); void logCall('ended', { state: 'manual_hangup' })
  }

  useEffect(() => () => {
    void callRef.current?.hangup().catch(() => undefined)
    void clientRef.current?.disconnect().catch(() => undefined)
    readyRef.current = false
  }, [])

  const canCall = Boolean(dialNumber) && !['connecting', 'calling', 'active', 'ending'].includes(state)
  const canHangup = Boolean(callRef.current) && ['calling', 'active'].includes(state)

  return (
    <section className="admin-communication-toolbar" aria-label="Lead communication actions">
      <div className="admin-communication-phone">
        <small>LEAD PHONE</small>
        <strong>{dialNumber || phone || 'No phone on record'}</strong>
        {callState && <span>{callState}</span>}
      </div>
      <div className="admin-communication-actions">
        <button type="button" className="call" disabled={!canCall} onClick={startCall}>Call</button>
        <button type="button" disabled={!canHangup} onClick={hangup}>Hang up</button>
        {whatsapp ? <a className="whatsapp" href={whatsapp} target="_blank" rel="noreferrer">WhatsApp</a> : <button type="button" disabled>WhatsApp</button>}
        {email ? <a href={`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(email)}`} target="_blank" rel="noreferrer">Email</a> : <button type="button" disabled>Email</button>}
      </div>
      {message && <p className={state === 'error' ? 'error' : ''}>{message}</p>}
      <audio id={remoteAudioId} autoPlay />
    </section>
  )
}
