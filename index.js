const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType, REST, Routes, SlashCommandBuilder } = require('discord.js');

const TOKEN = process.env.TOKEN;
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID || null;
const SUPPORT_ROLE_ID = process.env.SUPPORT_ROLE_ID || null;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID || null;

if (!TOKEN) { console.error('[ERROR] TOKEN missing'); process.exit(1); }

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent], partials: [Partials.Channel] });

const COLOR_MAIN = 0x5865F2;
const COLOR_DANGER = 0xED4245;
const COLOR_SUCCESS = 0x57F287;
const VOID_LOGO = 'https://cdn.discordapp.com/embed/avatars/0.png';

const commands = [
  new SlashCommandBuilder().setName('setup-tickets').setDescription('أرسل embed التيكت').setDefaultMemberPermissions(PermissionFlagsBits.Administrator).toJSON(),
  new SlashCommandBuilder().setName('add').setDescription('أضف شخص للتيكت').addUserOption(o => o.setName('user').setDescription('اليوزر').setRequired(true)).toJSON(),
  new SlashCommandBuilder().setName('remove').setDescription('احذف شخص من التيكت').addUserOption(o => o.setName('user').setDescription('اليوزر').setRequired(true)).toJSON(),
];

client.once('ready', async () => {
  console.log(`[Void Tickets] ${client.user.tag}`);
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  for (const guild of client.guilds.cache.values()) {
    await rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), { body: commands }).catch(console.error);
  }
});

client.on('interactionCreate', async (interaction) => {

  if (interaction.isChatInputCommand() && interaction.commandName === 'setup-tickets') {
    const embed = new EmbedBuilder().setColor(COLOR_MAIN).setAuthor({ name: 'Void | نظام التيكت', iconURL: VOID_LOGO }).setTitle('🎫 فتح تيكت').setDescription('> مرحباً بك في دعم **Void**\n\n📌 اضغط على الزر أدناه لفتح تيكت خاص\n⚠️ لا تفتح تيكت إلا لسبب جدي\n\n**سيتم الرد عليك في أقرب وقت ممكن**').setFooter({ text: 'Void Support System', iconURL: VOID_LOGO }).setTimestamp();
    const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('open_ticket').setLabel('فتح تيكت').setEmoji('🎫').setStyle(ButtonStyle.Primary));
    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: '✅ تم!', ephemeral: true });
  }

  if (interaction.isChatInputCommand() && interaction.commandName === 'add') {
    const user = interaction.options.getUser('user');
    await interaction.channel.permissionOverwrites.edit(user.id, { ViewChannel: true, SendMessages: true });
    await interaction.reply({ content: `✅ تم إضافة ${user}` });
  }

  if (interaction.isChatInputCommand() && interaction.commandName === 'remove') {
    const user = interaction.options.getUser('user');
    await interaction.channel.permissionOverwrites.edit(user.id, { ViewChannel: false });
    await interaction.reply({ content: `✅ تم إزالة ${user}` });
  }

  if (interaction.isButton() && interaction.customId === 'open_ticket') {
    await interaction.deferReply({ ephemeral: true });
    const guild = interaction.guild;
    const member = interaction.member;
    const existing = guild.channels.cache.find(c => c.topic === `ticket:${member.id}`);
    if (existing) return interaction.editReply({ content: `⚠️ عندك تيكت مفتوح: ${existing}` });

    const perms = [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
    ];
    if (SUPPORT_ROLE_ID) perms.push({ id: SUPPORT_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });

    const channel = await guild.channels.create({ name: `🎫・${member.user.username}`, type: ChannelType.GuildText, topic: `ticket:${member.id}`, parent: TICKET_CATEGORY_ID, permissionOverwrites: perms });

    const ticketEmbed = new EmbedBuilder().setColor(COLOR_MAIN).setAuthor({ name: 'Void | تيكت جديد', iconURL: VOID_LOGO }).setTitle('🎫 تيكتك تم فتحه').setDescription(`> أهلاً ${member} 👋\n\n📝 **اشرح مشكلتك وسيتم الرد عليك قريباً**`).addFields({ name: '👤 المستخدم', value: `${member}`, inline: true }, { name: '📅 الوقت', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }).setFooter({ text: 'Void Support', iconURL: VOID_LOGO }).setTimestamp();
    const closeRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('close_ticket').setLabel('إغلاق').setEmoji('🔒').setStyle(ButtonStyle.Danger), new ButtonBuilder().setCustomId('delete_ticket').setLabel('حذف').setEmoji('🗑️').setStyle(ButtonStyle.Secondary));

    await channel.send({ content: `${member}${SUPPORT_ROLE_ID ? ` <@&${SUPPORT_ROLE_ID}>` : ''}`, embeds: [ticketEmbed], components: [closeRow] });
    if (LOG_CHANNEL_ID) { const lc = guild.channels.cache.get(LOG_CHANNEL_ID); if (lc) lc.send({ embeds: [new EmbedBuilder().setColor(COLOR_SUCCESS).setDescription(`📂 تيكت جديد بواسطة ${member} ← ${channel}`).setTimestamp()] }); }
    await interaction.editReply({ content: `✅ تيكتك: ${channel}` });
  }

  if (interaction.isButton() && interaction.customId === 'close_ticket') {
    if (!interaction.channel.topic?.startsWith('ticket:')) return;
    await interaction.deferReply();
    const ownerId = interaction.channel.topic.replace('ticket:', '');
    await interaction.channel.permissionOverwrites.edit(ownerId, { SendMessages: false });
    const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('delete_ticket').setLabel('حذف التيكت').setEmoji('🗑️').setStyle(ButtonStyle.Danger));
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(COLOR_DANGER).setDescription('🔒 **تم إغلاق التيكت**\nاضغط حذف لمسح الروم.')], components: [row] });
  }

  if (interaction.isButton() && interaction.customId === 'delete_ticket') {
    if (!interaction.channel.topic?.startsWith('ticket:')) return;
    await interaction.reply({ content: '🗑️ سيتم الحذف خلال 3 ثوان...' });
    if (LOG_CHANNEL_ID) { const lc = interaction.guild.channels.cache.get(LOG_CHANNEL_ID); if (lc) lc.send({ embeds: [new EmbedBuilder().setColor(COLOR_DANGER).setDescription(`🗑️ تيكت حُذف بواسطة ${interaction.member} — **${interaction.channel.name}**`).setTimestamp()] }); }
    setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
  }
});

client.on('error', (err) => console.error('[ERROR]', err.message));
client.login(TOKEN);
