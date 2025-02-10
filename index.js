const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, InteractionType } = require('discord.js');
const { token } = require('./config.json');
const cron = require('node-cron');
require('dotenv').config();
const mongoose = require('mongoose');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

async function run() {
    try {
        // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
        await mongoose.connect(process.env.MONGO_URI, clientOptions);
        await mongoose.connection.db.admin().command({ ping: 1 });
        console.log("Connected to MongoDB Atlas");

    } catch (error) {
        console.log(error);
    }
}
run().catch(console.dir);


const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.once('ready', () => {

    // Schedule a message every day at 9:00 AM
    cron.schedule('06 12 * * *', async () => {
        try {
            const channel = client.channels.cache.get(process.env.CHANNEL_ID);

            if (!channel) {
                console.error('Channel not found');
                return;
            }
            // fetch command from bot's registered slash commands
            const command = client.commands.get('random');

            if (!command) {
                console.error('Scheduled Command Error: /random command not found');
                return;
            }

            // fake interaction object for the command execution
            const fakeInteraction = {
                client,
                commandName: 'random',
                type: InteractionType.ApplicationCommand,
                channel,
                guild: channel.guild,
                user: client.user, // bot itself runs the command
                options: {
                    getInteger: () => null, // No min/max rating
                    getString: () => null  // No specific tags
                },
                deferReply: async () => {}, // No need to defer
                editReply: async (message) => channel.send(message),
                reply: async (message) => channel.send(message),
                followUp: async (message) => channel.send(message),
                fetchReply: async () => {
                    const messages = await channel.messages.fetch({ limit: 1 });
                    return messages.first();
                },
                deferred: false
            };

            await channel.send('Here’s today\'s daily problem:');
            await command.execute(fakeInteraction); // execute the command as if it were called normally

            console.log('Scheduled message sent');
        } catch (error) {
            console.error('Error sending scheduled message:', error);
        }
    });

    console.log('Cron job scheduled to run daily at 9:00 AM');
});

client.login(token);