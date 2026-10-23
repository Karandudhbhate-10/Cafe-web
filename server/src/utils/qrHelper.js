import QRCode from 'qrcode';
import os from 'os';
import { QR_BASE_URL } from '../config/env.js';
import { Config } from '../models/Config.js';

export const getLocalNetworkIP = () => {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      // Skip internal (i.e. 127.0.0.1) and non-ipv4
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
};

export const getEffectiveBaseUrl = async () => {
  try {
    const config = await Config.findOne({ key: 'qr_base_url' });
    if (config && config.value) {
      return config.value.replace(/\/$/, '');
    }
  } catch (err) {
    // fallback
  }

  // If QR_BASE_URL is localhost, default to local network IP so real phones on same Wi-Fi can scan!
  const localIp = getLocalNetworkIP();
  if (QR_BASE_URL.includes('localhost') && localIp !== 'localhost') {
    return `http://${localIp}:5173`;
  }

  return QR_BASE_URL.replace(/\/$/, '');
};

export const generateTableQRDataUrl = async (tableNumber, customBaseUrl = null) => {
  const baseUrl = customBaseUrl ? customBaseUrl.replace(/\/$/, '') : await getEffectiveBaseUrl();
  const targetUrl = `${baseUrl}/menu?table=${encodeURIComponent(tableNumber)}`;

  const dataUrl = await QRCode.toDataURL(targetUrl, {
    width: 480,
    margin: 2,
    color: {
      dark: '#2B1D17', // Espresso branded color
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'H',
  });

  return { dataUrl, targetUrl };
};

export const generateMasterQRDataUrl = async (customBaseUrl = null) => {
  const baseUrl = customBaseUrl ? customBaseUrl.replace(/\/$/, '') : await getEffectiveBaseUrl();
  const targetUrl = `${baseUrl}/menu`;

  const dataUrl = await QRCode.toDataURL(targetUrl, {
    width: 600,
    margin: 2,
    color: {
      dark: '#2B1D17', // Espresso branded color
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'H',
  });

  return { dataUrl, targetUrl };
};
