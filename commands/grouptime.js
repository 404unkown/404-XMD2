// commands/grouptime.js
const fs = require('fs');
const path = require('path');

// Import isAdmin
const isAdmin = require('../lib/isAdmin');

// Function to format time
function clockString(ms) {
  let h = Math.floor(ms / 3600000);
  let m = Math.floor(ms / 60000) % 60;
  let s = Math.floor(ms / 1000) % 60;
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}

// Store active timers
const activeTimers = new Map();

async function grouptimeCommand(sock, chatId, message, args, senderId) {
  try {
    // Check if in group
    if (!chatId.endsWith('@g.us')) {
      await sock.sendMessage(chatId, {
        text: '❌ This command can only be used in groups!',
        ...global.channelInfo
      }, { quoted: message });
      return;
    }

    // Check admin status using your isAdmin function
    const adminStatus = await isAdmin(sock, chatId, senderId);
    
    if (!adminStatus.isSenderAdmin && !message.key.fromMe) {
      await sock.sendMessage(chatId, {
        text: '❌ Only group admins can use this command!',
        ...global.channelInfo
      }, { quoted: message });
      return;
    }

    if (!adminStatus.isBotAdmin) {
      await sock.sendMessage(chatId, {
        text: '❌ Bot must be admin to use this command!',
        ...global.channelInfo
      }, { quoted: message });
      return;
    }

    // Define action mapping (English only)
    let isClose = {
      'open': 'not_announcement',
      'on': 'not_announcement',
      '1': 'not_announcement',
      'close': 'announcement',
      'off': 'announcement',
      '0': 'announcement',
    }[(args[0] || '')];

    // Show help with list if no valid action
    if (isClose === undefined) {
      let nombre = [ 
        'Open group for 1 hour', 
        'Close group for 1 hour', 
        'Open group for 2 hours', 
        'Close group for 2 hours', 
        'Open group for 3 hours', 
        'Close group for 3 hours', 
        'Open group for 4 hours', 
        'Close group for 4 hours', 
        'Open group for 5 hours', 
        'Close group for 5 hours', 
        'Open group for 6 hours', 
        'Close group for 6 hours', 
        'Open group for 7 hours', 
        'Close group for 7 hours', 
        'Open group for 10 hours',
        'Close group for 10 hours',
        'Open group for 12 hours',
        'Close group for 12 hours',
        'Open group for 24 hours',
        'Close group for 24 hours'
      ];

      let descripción = [ 
        'Open group for 1 hour', 
        'Close group for 1 hour\n', 
        'Open group for 2 hours', 
        'Close group for 2 hours\n', 
        'Open group for 3 hours', 
        'Close group for 3 hours\n',  
        'Open group for 4 hours', 
        'Close group for 4 hours\n', 
        'Open group for 5 hours', 
        'Close group for 5 hours\n', 
        'Open group for 6 hours', 
        'Close group for 6 hours\n', 
        'Open group for 7 hours', 
        'Close group for 7 hours\n', 
        'Open group for 10 hours',
        'Close group for 10 hours\n', 
        'Open group for 12 hours',
        'Close group for 12 hours\n', 
        'Open group for 24 hours',
        'Close group for 24 hours'
      ];

      let comando = [ 
        "open 1", "close 1", 
        "open 2", "close 2",
        "open 3", "close 3",
        "open 4", "close 4",
        "open 5", "close 5",
        "open 6", "close 6",
        "open 7", "close 7",
        "open 10", "close 10",
        "open 12", "close 12",
        "open 24", "close 24"
      ];

      // Create list message format
      let caption = `⚠️ *INCORRECT USE*\n\n*To open group for 1 hour:*\n*${global.PREFIX || '.'}grouptime open 1*\n\n*To close group for 1 hour:*\n*${global.PREFIX || '.'}grouptime close 1*`;

      // Send the help message
      await sock.sendMessage(chatId, {
        text: caption,
        ...global.channelInfo
      }, { quoted: message });

      // Also send the list of options
      let optionsText = `📋 *Available Time Options:*\n\n`;
      for (let i = 0; i < nombre.length; i++) {
        optionsText += `• *${nombre[i]}*\n  Command: ${global.PREFIX || '.'}grouptime ${comando[i]}\n\n`;
      }
      
      await sock.sendMessage(chatId, {
        text: optionsText,
        ...global.channelInfo
      });
      
      return;
    }

    // Get duration
    const duration = args[1] ? parseInt(args[1]) : null;
    
    if (duration && (isNaN(duration) || duration < 1 || duration > 24)) {
      await sock.sendMessage(chatId, {
        text: '❌ Invalid duration! Please use a number between 1 and 24 hours.',
        ...global.channelInfo
      }, { quoted: message });
      return;
    }

    // Calculate timeout (86400000 ms = 24 hours, so divide by 24 to get per hour)
    let timeoutset = 86400000 * (duration || 0) / 24;

    // Clear any existing timer
    if (activeTimers.has(chatId)) {
      clearTimeout(activeTimers.get(chatId));
      activeTimers.delete(chatId);
    }

    // Update group setting
    await sock.groupSettingUpdate(chatId, isClose);

    // Send success message
    const actionText = isClose === 'announcement' ? 'CLOSED' : 'OPENED';
    const durationText = duration ? `for ${clockString(timeoutset)}` : '';
    
    await sock.sendMessage(chatId, {
      text: `✅ *SUCCESS*\n\nGroup has been ${actionText} ${durationText}`,
      ...global.channelInfo
    }, { quoted: message });

    // Set timer if duration specified
    if (duration) {
      const timer = setTimeout(async () => {
        try {
          // Reverse the setting
          const reverseSetting = isClose === 'announcement' ? 'not_announcement' : 'announcement';
          await sock.groupSettingUpdate(chatId, reverseSetting);
          
          const reverseActionText = reverseSetting === 'announcement' ? 'CLOSED' : 'OPENED';
          
          await sock.sendMessage(chatId, {
            text: `🔄 *Automatic Update*\n\nGroup has been automatically ${reverseActionText}!`,
            ...global.channelInfo
          });
          
          // Remove timer from map
          activeTimers.delete(chatId);
          
        } catch (error) {
          console.error('Auto group update error:', error);
        }
      }, timeoutset);

      // Store timer
      activeTimers.set(chatId, timer);
      
      // Inform about auto timer
      const revertAction = isClose === 'announcement' ? 'opened' : 'closed';
      await sock.sendMessage(chatId, {
        text: `⏰ *Timer Set*\n\nGroup will be automatically ${revertAction} after ${duration} hour${duration > 1 ? 's' : ''}.`,
        ...global.channelInfo
      }, { quoted: message });
    }

  } catch (error) {
    console.error('Grouptime command error:', error);
    
    let errorMessage = '❌ Failed to update group settings.';
    
    if (error.message.includes('not an admin')) {
      errorMessage = '❌ Bot is not an admin or has insufficient permissions.';
    } else if (error.message.includes('404')) {
      errorMessage = '❌ Group not found or bot was removed.';
    }
    
    await sock.sendMessage(chatId, {
      text: `${errorMessage}\n\nError: ${error.message}`,
      ...global.channelInfo
    }, { quoted: message });
  }
}

module.exports = grouptimeCommand;