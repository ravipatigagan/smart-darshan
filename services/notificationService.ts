
import { StaffRole, EnterpriseGatewayConfig } from '../types';

/**
 * Rectified Notification Dispatcher
 * Strategy: Attempts Cloud API -> Checks for Local Relay (FastAPI) -> Falls back to Simulation Protocol
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

  // Protocol link for manual failover
  const directLink = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(fullMessage)}`;

  // SMS Simulation Mode (Per Requirement: No external API)
  if (type === 'SMS') {
    // In a real app, this would call a gateway. Here we simulate the successful dispatch.
    await new Promise(resolve => setTimeout(resolve, 600)); 
    console.log(`[SMS SIMULATION] To: ${cleanPhone} | Msg: ${fullMessage}`);
    return { 
      success: true, 
      mode: 'SMS_SIMULATION', 
      status: "SMS alert delivered (simulation mode)", 
      directLink 
    };
  }

  const { whatsappToken, phoneNumberId, relayUrl } = config;

  // 1. WhatsApp Simulation / Virtual Mode
  if (!phoneNumberId || phoneNumberId.trim() === '') {
    await new Promise(resolve => setTimeout(resolve, 800)); 
    return { 
      success: true, 
      mode: 'VIRTUAL_RELAY', 
      status: "WhatsApp Simulation: Delivered",
      warning: "Virtual Session: Confirming via Manual Dispatch.",
      directLink
    };
  }

  // 2. Custom Relay Mode
  if (relayUrl && relayUrl.startsWith('http')) {
    try {
      const response = await fetch(relayUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: cleanPhone, message: fullMessage, role })
      });
      if (response.ok) return { success: true, mode: 'REST_RELAY', status: "SENT", directLink };
    } catch (e) {
      console.warn("Relay unreachable. Falling back to direct cloud API.");
    }
  }

  // 3. Direct Cloud API (May hit CORS)
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
    return { 
      success: false, 
      error: "Protocol Blocked: Browser CORS Policy Intervention.", 
      directLink 
    };
  }
};
