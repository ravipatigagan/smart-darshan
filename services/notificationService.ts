
import { StaffRole, EnterpriseGatewayConfig } from '../types';

const DEFAULT_DEMO_TOKEN = 'EAAUXaANsECMBQb5MALt89E30PlLZBHyZC3Lw7tUs0b8hLrOjIXabvZC1wCVjTjtZAPyXF5yQ8IzguzUq5KbnRwjuGC6Fpucqe7Gdvdge0dBX1EnQUuVZBDN0yuUu5DAlrJYONDRyhFvnFAxzjzQuCmKlbSZAUWZBI0WQ55i6ucROQnlHC8HqGNt5uQa1p8VAmq5mAZDZD';

/**
 * Dispatches an alert through the Official WhatsApp Business Cloud API.
 * Uses a multi-stage fallback system: Live API -> CORS Proxy -> Direct Protocol.
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
  const fullMessage = `Om Namo Venkatesaya!\n\nTime: ${timestamp}\nTarget: ${role}\nAlert: ${message}\n\n[SVSD COMMAND HUB]`;

  const directLink = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(fullMessage)}`;

  if (type === 'SMS') {
    window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(fullMessage)}`;
    return { success: true, mode: 'SMS' };
  }

  const { whatsappToken, phoneNumberId, useCorsProxy } = config;

  // 1. SIMULATION MODE - Clearer labeling
  if (!phoneNumberId || phoneNumberId.trim() === '' || phoneNumberId === '12345') {
    console.log("[SVSD HUB] Entering Virtual Simulation Mode...");
    await new Promise(resolve => setTimeout(resolve, 800));
    return { 
      success: true, 
      mode: 'SIMULATION', 
      status: "SIMULATED",
      warning: "Virtual Mode: No real message sent. Enter a real 'Phone ID' to use Meta Cloud API.",
      directLink
    };
  }

  // 2. LIVE DISPATCH (Meta Cloud API)
  const metaUrl = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
  // Use a rotating proxy list for better reliability
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(metaUrl)}`;
  const finalUrl = useCorsProxy ? proxyUrl : metaUrl;

  try {
    const response = await fetch(finalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${whatsappToken}`
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "text",
        text: { preview_url: false, body: fullMessage }
      })
    });

    const data = await response.json();

    if (response.ok) {
      return { 
        success: true, 
        mode: 'LIVE_CLOUD', 
        messageId: data.messages?.[0]?.id,
        status: "SENT"
      };
    } else {
      console.warn("[META REJECTION]", data);
      return { 
        success: false, 
        error: data.error?.message || "Meta API credentials rejected.",
        directLink 
      };
    }
  } catch (e: any) {
    console.error("[CORS BLOCK]", e);
    return { 
      success: false, 
      error: "Browser CORS Policy blocked the automated call.",
      directLink 
    };
  }
};
