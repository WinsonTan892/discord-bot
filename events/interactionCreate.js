const { Events, MessageFlags } = require('discord.js');
const CompletedProblem = require("../models/CompletedProblem");

// Function to add data
async function addCompletedProblem(username, problemName) {
    const newProblem = new CompletedProblem({
        username,
        problemName
    });

    try {
        const result = await newProblem.save();
        console.log('Data saved:', result);
    } catch (err) {
        console.error('Error saving data:', err);
    }
}

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {

            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
                }
            }
        } else if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.autocomplete(interaction);
            } catch (error) {
                console.error(error);
            }
        } else if (interaction.isButton()) {

            if (interaction.customId === 'completed') {
                const embed = interaction.message.embeds[0];

                // Respond to the button interaction
                await interaction.reply({
                    content: `${interaction.user.username} has completed ${embed.title}!`,
                });


                await addCompletedProblem(interaction.user.username,embed.title);

            }

        }
    },
};