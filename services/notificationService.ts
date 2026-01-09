
import { StaffRole, EnterpriseGatewayConfig } from '../types';

/**
 * Rectified Notification Dispatcher
 * Strategy: Attempts Cloud API -> Checks for Local Relay (FastAPI) -> Falls back to Manual Protocol
 */
export const dispatchOfficialNotification = async (
  type: 'WHATSAPP' | 'SMS',
  targetPhone: string,
  message: string,
  role: StaffRole,
  config: EnterpriseGatewayConfig
) => {
  const cleanPhone = targetPhone.replace(/\D/g, '').trim();
  const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const fullMessage = `OM NAMO VENKATESAYA!\n\nTime: ${timestamp}\nRole: ${role}\nAlert: ${message}\n\n[SVSD COMMAND CENTER]`;

  // Protocol link for manual failover (this ALWAYS works)
  const directLink = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(fullMessage)}`;

  if (type === 'SMS') {
    window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(fullMessage)}`;
    return { success: true, mode: 'SMS', directLink };
  }

  const { whatsappToken, phoneNumberId, relayUrl } = config;

  // 1. Simulation / Virtual Mode
  if (!phoneNumberId || phoneNumberId.trim() === '') {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate backend handshake
    return { 
      success: true, 
      mode: 'VIRTUAL_RELAY', 
      status: "SYNC_READY",
      warning: "Virtual Session: Confirming via Manual Dispatch.",
      directLink
    };
  }

  // 2. Custom FastAPI / REST API Relay Mode (The "Rectified" Strategy)
  if (relayUrl && relayUrl.startsWith('http')) {
    try {
      const response = await fetch(relayUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: cleanPhone, message: fullMessage, role })
      });
      if (response.ok) return { success: true, mode: 'REST_RELAY', status: "SENT", directLink };
    } catch (e) {
      console.warn("FastAPI Relay unreachable. Falling back to direct cloud API.");
    }
  }

  // 3. Direct Cloud API (The legacy method - likely to hit CORS)
  const metaUrl = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
  
  try {
    const response = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${whatsappToken}`
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "text",
        text: { body: fullMessage }
      })
    });

    if (response.ok) {
      return { success: true, mode: 'CLOUD_API', status: "SENT", directLink };
    } else {
      const errData = await response.json();
      return { 
        success: false, 
        error: errData.error?.message || "Meta Authentication Failed", 
        directLink 
      };
    }
  } catch (e) {
    // This is where CORS usually fails. We return a specific status to App.tsx
    return { 
      success: false, 
      error: "Protocol Blocked: Browser CORS Policy Intervention.", 
      directLink 
    };
  }
};
