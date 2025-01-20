const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const minPossibleRating = 800;
const maxPossibleRating = 4000;

module.exports = {
    data: new SlashCommandBuilder()
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
                .addChoices(
                    {name : 'dp',  value: 'dp'},
                    {name : 'binary search',  value: 'binary search'},
                )
            )

    ,
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
            const filteredProblems = problems.filter(problem => minRating <= problem.rating && problem.rating <= maxRating);

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

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply('Sorry, I couldn\'t fetch a problem at this time.');
        }
    },
};
