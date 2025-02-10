const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

const minPossibleRating = 800;
const maxPossibleRating = 4000;

const tags = [
    'divide and conquer',
    'dp',
    'flows',
    'graphs',
    'graph matchings',
    'constructive algorithms',
    'interactive',
    'data structures',
    'geometry',
    'matrices',
    'probabilities',
    'string suffix structures',
    'bitmasks',
    'brute force',
    'greedy',
    'implementation',
    'math',
    '2-sat',
    'combinatorics',
    'sortings',
    'expression parsing',
    'dfs and similar',
    'dsu',
    'games',
    'two pointers',
    'binary search',
    'shortest paths',
    'hashing',
    'strings',
    'number theory',
    'trees',
    'schedules',
    'fft',
    'ternary search',
    'chinese remainder theorem',
    '*special',
    'meet-in-the-middle'
]

const random = new SlashCommandBuilder()
    .setName('random')
    .setDescription('Fetches a random problem from Codeforces!')
    .addIntegerOption(option =>
        option.setName("min_rating")
            .setDescription('Minimum problem rating')
            .setMinValue(minPossibleRating)
            .setMaxValue(maxPossibleRating)
    )
    .addIntegerOption(option =>
        option.setName("max_rating")
            .setDescription('Maximum problem rating')
            .setMinValue(minPossibleRating)
            .setMaxValue(maxPossibleRating)
    )
    .addStringOption(option =>
        option.setName("tags")
            .setDescription('Problems that have this tag')
            .setAutocomplete(true)
    )

//tags.map(tag => random.addBooleanOption(option => option.setName(tag).setDescription('Problems that have this tag')))

module.exports = {
    data: random,
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const filtered = tags.filter(choice => choice.startsWith(focusedValue));
        await interaction.respond(
            filtered.map(choice => ({
                name: choice,
                value: choice
            }))
        )

    },
    async execute(interaction) {
        await interaction.deferReply(); // Acknowledge the command to allow more time for processing

        try {
            const response = await fetch('https://codeforces.com/api/problemset.problems');
            const data = await response.json();

            if (data.status !== 'OK') {
                throw new Error('Failed to fetch problems from Codeforces.');
            }

            const problems = data.result.problems;

            // define range and filter problems
            const minRating = interaction.options.getInteger('min_rating') ?? minPossibleRating;
            const maxRating = interaction.options.getInteger('max_rating') ?? maxPossibleRating;

            const filterByRating = problem => minRating <= problem.rating && problem.rating <= maxRating
            //const filterByTags = To be implemented

            const filteredProblems = problems.filter(filterByRating);

            if (!filteredProblems.length) {
                throw new Error('No problems matched search.');
            }

            // select random problem
            const randomIndex = Math.floor(Math.random() * filteredProblems.length);
            const problem = filteredProblems[randomIndex];

            // make problem url
            const problemUrl = `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`;

            // embed
            const embed = new EmbedBuilder()
                .setTitle(`${problem.name}`)
                .setURL(problemUrl)
                .addFields(
                    { name: 'Contest ID', value: `${problem.contestId}`, inline: true },
                    { name: 'Rating', value: `||${problem.rating || 'N/A'}||`, inline: true },
                    { name: 'Topics', value : `||${problem.tags.join(', ')}||`, inline: true},
                )
                .setColor(0x0099ff)

            const completed = new ButtonBuilder()
                .setCustomId('completed')
                .setLabel('Completed')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder()
                .addComponents(completed);

            await interaction.editReply({
                embeds: [embed],
                components: [row],
                withResponse: true
            });

            // fetch reply message
            const message = await interaction.fetchReply();

            // create a message component collector
            const collector = message.createMessageComponentCollector({
                componentType: 'BUTTON',
                time: 3600000 // 1 hr
            });

            collector.on('collect', async i => {
                if (i.customId === 'completed') {
                    await i.reply({
                        content: `${i.user.username} has completed ${problem.name}!`,
                        ephemeral: true
                    });
                }
            });

        } catch (error) {
            console.error(error);
            await interaction.editReply('Sorry, I couldn\'t fetch a problem at this time.');
        }
    },
};
