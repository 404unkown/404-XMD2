const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// WhatsApp message parser
function smsg(client, m, store) {
    if (!m) return m;
    let M = m.constructor.name === 'proto.WebMessageInfo' ? m : m.m;
    let type = Object.keys(M.message)[0];
    
    // Handle ephemeral messages
    if (type === 'ephemeralMessage') {
        M = M.message.ephemeralMessage.message;
        type = Object.keys(M)[0];
    }
    
    const sender = client.decodeJid(M.key.fromMe ? client.user.id : M.participant || M.key.remoteJid || M.from);
    
    return {
        id: M.key.id,
        from: M.key.remoteJid,
        sender: sender,
        body: type === 'conversation' ? M.message.conversation : 
              type === 'extendedTextMessage' ? M.message.extendedTextMessage.text || '' :
              type === 'imageMessage' ? M.message.imageMessage.caption || '' :
              type === 'videoMessage' ? M.message.videoMessage.caption || '' :
              type === 'audioMessage' ? M.message.audioMessage.caption || '' :
              type === 'documentMessage' ? M.message.documentMessage.caption || '' :
              type === 'stickerMessage' ? '[Sticker]' : '',
        isGroup: M.key.remoteJid.endsWith('@g.us'),
        quoted: M.message[type]?.contextInfo?.quotedMessage ? {
            id: M.message[type].contextInfo.stanzaId,
            from: M.message[type].contextInfo.participant,
            body: M.message[type].contextInfo.quotedMessage.conversation || 
                  M.message[type].contextInfo.quotedMessage.extendedTextMessage?.text || '',
            mentionedJid: M.message[type].contextInfo.mentionedJid || []
        } : null,
        mentions: M.message[type]?.contextInfo?.mentionedJid || [],
        type: type,
        m: m,
        key: M.key,
        message: M.message,
        reply: async (text, options = {}) => {
            return await client.sendMessage(M.key.remoteJid, { text: text, ...options }, { quoted: m });
        }
    };
}

// Check if string is a URL
function isUrl(url) {
    const pattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return pattern.test(url) || url.includes('http://') || url.includes('https://');
}

// Generate random message tag
function generateMessageTag() {
    return (1 + Math.random()).toString(36).substring(2) + (1 + Math.random()).toString(36).substring(2);
}

// Download buffer from URL
async function getBuffer(url, options = {}) {
    try {
        const res = await axios({
            method: 'get',
            url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                ...options.headers
            },
            responseType: 'arraybuffer',
            timeout: 30000,
            ...options
        });
        return res.data;
    } catch (err) {
        console.error('getBuffer error for URL:', url, '-', err.message);
        return null;
    }
}

// Get media size in readable format
function getSizeMedia(buffer) {
    if (!buffer) return '0 B';
    const bytes = buffer.length || buffer.byteLength || 0;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}

// Fetch JSON from URL
async function fetchJson(url, options = {}) {
    try {
        const res = await axios({
            method: options.method || 'GET',
            url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                ...options.headers
            },
            ...options
        });
        return res.data;
    } catch (err) {
        console.error('fetchJson error:', err.message);
        return null;
    }
}

// Simple await/sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Alias for sleep (for compatibility)
function await(ms) {
    return sleep(ms);
}

// Parse text for mentions
function parseMention(text = '') {
    return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net');
}

// Format seconds to HH:MM:SS
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

// Generate random filename
function randomFilename(ext) {
    return Date.now() + '_' + Math.random().toString(36).substring(2, 15) + '.' + ext;
}

module.exports = {
    smsg,
    isUrl,
    generateMessageTag,
    getBuffer,
    getSizeMedia,
    fetchJson,
    await,
    sleep,
    parseMention,
    formatTime,
    randomFilename
};