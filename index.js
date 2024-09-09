require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMembers] });

const { BOT_TOKEN, CLIENT_ID } = process.env;

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    registerSlashCommandsGlobally();
    loadReactionRoles();
});

// Function to register slash commands globally
async function registerSlashCommandsGlobally() {
    const commands = [
        new SlashCommandBuilder()
            .setName('setup')
            .setDescription('إرسال أو تعديل إمبد مع عنوان ووصف وصور')
            .addChannelOption(option =>
                option.setName('channel')
                    .setDescription('اختر القناة')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('title')
                    .setDescription('عنوان الإمبد')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('description')
                    .setDescription('وصف الإمبد')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('thumbnail')
                    .setDescription('رابط الصورة الصغيرة (اختياري)')
                    .setRequired(false)
            )
            .addStringOption(option =>
                option.setName('image')
                    .setDescription('رابط الصورة الكبيرة (اختياري)')
                    .setRequired(false)
            )
            .addStringOption(option =>
                option.setName('color')
                    .setDescription('لون الإمبد بصيغة HEX (اختياري)')
                    .setRequired(false)
            )
            .addStringOption(option =>
                option.setName('message_id')
                    .setDescription('معرف الرسالة (للتعديل على رسالة موجودة)')
                    .setRequired(false)
            )
            .toJSON(),
        new SlashCommandBuilder()
            .setName('addreactionrole')
            .setDescription('إضافة إيموجي مع رتبة للتفاعل على الإمبد')
            .addChannelOption(option =>
                option.setName('channel')
                    .setDescription('اختر القناة')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('message_id')
                    .setDescription('معرف الرسالة')
                    .setRequired(true)
            )
            .addRoleOption(option =>
                option.setName('role')
                    .setDescription('اختر الرتبة')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('emoji')
                    .setDescription('اختر إيموجي')
                    .setRequired(true)
            )
            .toJSON(),
        new SlashCommandBuilder()
            .setName('unsetup')
            .setDescription('حذف رسالة الإمبد وإزالتها من الملف')
            .addChannelOption(option =>
                option.setName('channel')
                    .setDescription('اختر القناة')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('message_id')
                    .setDescription('معرف الرسالة')
                    .setRequired(true)
            )
            .toJSON()
    ];

    const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

    try {
        console.log('Started refreshing application (/) commands globally.');

        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands globally.');
    } catch (error) {
        console.error(error);
    }
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'setup') {
        const channel = interaction.options.getChannel('channel');
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const thumbnail = interaction.options.getString('thumbnail');
        const image = interaction.options.getString('image');
        const color = interaction.options.getString('color');
        const messageId = interaction.options.getString('message_id');
        const guild = interaction.guild;

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color || 0x00AE86);  // Default color if not provided

        if (thumbnail) embed.setThumbnail(thumbnail);
        if (image) embed.setImage(image);

        let serverData = {};
        try {
            serverData = JSON.parse(fs.readFileSync('messages.json', 'utf8'));
        } catch (error) {
            console.error('Error reading messages.json:', error);
        }

        const guildId = guild.id;

        if (!serverData[guildId]) {
            serverData[guildId] = { messages: {} };
        }

        if (!serverData[guildId].messages[channel.id]) {
            serverData[guildId].messages[channel.id] = [];
        }

        try {
            if (messageId) {
                const message = await channel.messages.fetch(messageId);
                await message.edit({ embeds: [embed] });

                // Update existing message in data
                const existingMessageIndex = serverData[guildId].messages[channel.id].findIndex(msg => msg.message_id === messageId);
                if (existingMessageIndex !== -1) {
                    serverData[guildId].messages[channel.id][existingMessageIndex] = { message_id: messageId, reactions: [] };
                } else {
                    serverData[guildId].messages[channel.id].push({ message_id: messageId, reactions: [] });
                }

                fs.writeFileSync('messages.json', JSON.stringify(serverData, null, 2));
                await interaction.reply({ content: 'تم تعديل الرسالة بنجاح!', ephemeral: true });
            } else {
                const sentMessage = await channel.send({ embeds: [embed] });

                serverData[guildId].messages[channel.id].push({ message_id: sentMessage.id, reactions: [] });
                fs.writeFileSync('messages.json', JSON.stringify(serverData, null, 2));
                await interaction.reply({ content: 'تم إرسال الإمبد وحفظ معرف الرسالة بنجاح!', ephemeral: true });
            }
        } catch (error) {
            console.error('Error sending/editing message:', error);
            await interaction.reply({ content: 'حدث خطأ أثناء إرسال أو تعديل الرسالة.', ephemeral: true });
        }
    } else if (commandName === 'addreactionrole') {
        const channel = interaction.options.getChannel('channel');
        const messageId = interaction.options.getString('message_id');
        const role = interaction.options.getRole('role');
        const emoji = interaction.options.getString('emoji');
        const guild = interaction.guild;

        let serverData = {};
        try {
            serverData = JSON.parse(fs.readFileSync('messages.json', 'utf8'));
        } catch (error) {
            console.error('Error reading messages.json:', error);
        }

        const guildId = guild.id;

        if (!serverData[guildId]) {
            serverData[guildId] = { messages: {} };
        }

        if (serverData[guildId].messages[channel.id]) {
            try {
                const message = await channel.messages.fetch(messageId);

                let emojiObject;
                
                // Check if the emoji is custom or standard
                if (emoji.startsWith('<:') && emoji.endsWith('>')) {
                    // Extract custom emoji ID
                    const emojiIdMatch = emoji.match(/:(\d+)>$/);
                    if (emojiIdMatch) {
                        emojiObject = guild.emojis.cache.get(emojiIdMatch[1]);
                    }
                } else if (emoji.startsWith('<') && emoji.endsWith('>')) {
                    // Extract custom emoji ID for emoji in format like <:name:id>
                    const emojiIdMatch = emoji.match(/:(\d+)>$/);
                    if (emojiIdMatch) {
                        emojiObject = guild.emojis.cache.get(emojiIdMatch[1]);
                    }
                } else {
                    // For standard Discord emojis
                    emojiObject = emoji;
                }

                if (emojiObject) {
                    try {
                        await message.react(emojiObject);

                        const messageData = serverData[guildId].messages[channel.id].find(msg => msg.message_id === messageId);
                        if (messageData) {
                            messageData.reactions.push({ emoji: emojiObject.id || emojiObject, role_id: role.id });
                            fs.writeFileSync('messages.json', JSON.stringify(serverData, null, 2));
                            await interaction.reply({ content: 'تم إضافة الإيموجي والرتبة بنجاح!', ephemeral: true });
                        } else {
                            await interaction.reply({ content: 'لا توجد رسالة تطابق البيانات المقدمة.', ephemeral: true });
                        }
                    } catch (error) {
                        console.error('Error reacting to message:', error);
                        await interaction.reply({ content: 'حدث خطأ أثناء محاولة إضافة التفاعل. قد تكون الرسالة غير موجودة.', ephemeral: true });
                    }
                } else {
                    await interaction.reply({ content: 'الإيموجي غير موجود في السيرفر.', ephemeral: true });
                }
            } catch (error) {
                console.error('Error fetching message:', error);
                await interaction.reply({ content: 'لم أتمكن من العثور على الرسالة. تأكد من صحة معرف الرسالة.', ephemeral: true });
            }
        } else {
            await interaction.reply({ content: 'لا توجد رسالة تطابق البيانات المقدمة.', ephemeral: true });
        }
    } else if (commandName === 'unsetup') {
        const channel = interaction.options.getChannel('channel');
        const messageId = interaction.options.getString('message_id');
        const guild = interaction.guild;

        let serverData = {};
        try {
            serverData = JSON.parse(fs.readFileSync('messages.json', 'utf8'));
        } catch (error) {
            console.error('Error reading messages.json:', error);
        }

        const guildId = guild.id;

        if (serverData[guildId] && serverData[guildId].messages[channel.id]) {
            try {
                const messageIndex = serverData[guildId].messages[channel.id].findIndex(msg => msg.message_id === messageId);
                if (messageIndex !== -1) {
                    const message = await channel.messages.fetch(messageId);
                    await message.delete();

                    serverData[guildId].messages[channel.id].splice(messageIndex, 1);
                    fs.writeFileSync('messages.json', JSON.stringify(serverData, null, 2));
                    await interaction.reply({ content: 'تم حذف الرسالة بنجاح!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'لم أتمكن من العثور على الرسالة في البيانات.', ephemeral: true });
                }
            } catch (error) {
                console.error('Error deleting message:', error);
                await interaction.reply({ content: 'حدث خطأ أثناء محاولة حذف الرسالة.', ephemeral: true });
            }
        } else {
            await interaction.reply({ content: 'لا توجد رسالة تطابق البيانات المقدمة.', ephemeral: true });
        }
    }
});

async function loadReactionRoles() {
    let serverData = {};
    try {
        serverData = JSON.parse(fs.readFileSync('messages.json', 'utf8'));
    } catch (error) {
        console.error('Error reading messages.json:', error);
        return;
    }

    for (const [guildId, guildData] of Object.entries(serverData)) {
        const guild = await client.guilds.fetch(guildId);
        if (guild) {
            for (const [channelId, messages] of Object.entries(guildData.messages)) {
                const channel = await guild.channels.fetch(channelId);
                if (channel) {
                    for (const messageData of messages) {
                        try {
                            const message = await channel.messages.fetch(messageData.message_id);
                            for (const reaction of messageData.reactions) {
                                let emojiObject;
                                
                                // Check if the emoji is custom or standard
                                if (reaction.emoji.startsWith('<:') && reaction.emoji.endsWith('>')) {
                                    // Extract custom emoji ID
                                    const emojiIdMatch = reaction.emoji.match(/:(\d+)>$/);
                                    if (emojiIdMatch) {
                                        emojiObject = guild.emojis.cache.get(emojiIdMatch[1]);
                                    }
                                } else if (reaction.emoji.startsWith('<') && reaction.emoji.endsWith('>')) {
                                    // Extract custom emoji ID for emoji in format like <:name:id>
                                    const emojiIdMatch = reaction.emoji.match(/:(\d+)>$/);
                                    if (emojiIdMatch) {
                                        emojiObject = guild.emojis.cache.get(emojiIdMatch[1]);
                                    }
                                } else {
                                    // For standard Discord emojis
                                    emojiObject = reaction.emoji;
                                }

                                if (emojiObject) {
                                    await message.react(emojiObject);
                                }
                            }
                        } catch (error) {
                            console.error('Error fetching message:', error);
                        }
                    }
                }
            }
        }
    }
}

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;

    const { message, emoji } = reaction;
    const guild = message.guild;
    if (!guild) return;

    let serverData = {};
    try {
        serverData = JSON.parse(fs.readFileSync('messages.json', 'utf8'));
    } catch (error) {
        console.error('Error reading messages.json:', error);
        return;
    }

    const guildId = guild.id;
    const channelId = message.channel.id;

    if (serverData[guildId] && serverData[guildId].messages && serverData[guildId].messages[channelId]) {
        const messageData = serverData[guildId].messages[channelId].find(msg => msg.message_id === message.id);
        if (messageData) {
            const reactionRole = messageData.reactions.find(r => r.emoji === emoji.id || r.emoji === emoji.name);
            if (reactionRole) {
                const role = guild.roles.cache.get(reactionRole.role_id);
                if (role) {
                    const member = guild.members.cache.get(user.id);
                    if (member) {
                        await member.roles.add(role);
                        console.log(`Added role ${role.name} to ${member.user.tag}`);
                    }
                }
            }
        }
    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;

    const { message, emoji } = reaction;
    const guild = message.guild;
    if (!guild) return;

    let serverData = {};
    try {
        serverData = JSON.parse(fs.readFileSync('messages.json', 'utf8'));
    } catch (error) {
        console.error('Error reading messages.json:', error);
        return;
    }

    const guildId = guild.id;
    const channelId = message.channel.id;

    if (serverData[guildId] && serverData[guildId].messages && serverData[guildId].messages[channelId]) {
        const messageData = serverData[guildId].messages[channelId].find(msg => msg.message_id === message.id);
        if (messageData) {
            const reactionRole = messageData.reactions.find(r => r.emoji === emoji.id || r.emoji === emoji.name);
            if (reactionRole) {
                const role = guild.roles.cache.get(reactionRole.role_id);
                if (role) {
                    const member = guild.members.cache.get(user.id);
                    if (member) {
                        await member.roles.remove(role);
                        console.log(`Removed role ${role.name} from ${member.user.tag}`);
                    }
                }
            }
        }
    }
});


client.login(BOT_TOKEN);
