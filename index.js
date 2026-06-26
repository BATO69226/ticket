const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const TOKEN = process.env.TOKEN;
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID;

if (!TOKEN) { console.error('[ERROR] TOKEN missing'); process.exit(1); }
if (!WELCOME_CHANNEL_ID) { console.error('[ERROR] WELCOME_CHANNEL_ID missing'); process.exit(1); }

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const COLOR_MAIN = 0x7BB8FF;
const VOID_LOGO = 'https://cdn.discordapp.com/embed/avatars/0.png';

client.once('ready', () => {
  console.log(`[Void Welcome] ${client.user.tag} ✅`);
});

client.on('guildMemberAdd', async (member) => {
  const
