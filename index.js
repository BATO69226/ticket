const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const TOKEN = process.env.TOKEN;
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once('ready', () => {
  console.log(`[Void] ${client.user.tag} ready!`);
});

client.on('guildMemberAdd', async (member) => {
  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(0x7BB8FF)
    .setTitle('👋 عضو جديد!')
    .setDescription(`> 𝑯𝒆𝒍𝒍𝒐: ${member} 👋\n\n🎉 أهلاً وسهلاً بك في **${member.guild.name}**`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .addFields(
      { name: '👤 الاسم', value: `${member.user.username}`, inline: true },
      { name: '🔢 العضو رقم', value: `${member.guild.memberCount}`, inline: true }
    )
    .setFooter({ text: '© Void — All Rights Reserved' })
    .setTimestamp();

  await channel.send({ content: `${member}`, embeds: [embed] });
});

client.login(TOKEN);
