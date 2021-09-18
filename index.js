// import got from "got";
// import { Client, Intents } from "discord.js";
// import { joinVoiceChannel } from '@discordjs/voice';
// import { getLink } from "./src/helper_functions.js";

 const TOKEN = "ODg4NTg0MDk2MzIwNzMzMjA1.YUU0bQ.GjlKOrh0-RPeGrGLS_N3-9UN7V0";
// const client = new Client({
//   intents: [
//     Intents.FLAGS.GUILDS,
//     Intents.FLAGS.GUILD_MESSAGES,
//     Intents.FLAGS.GUILD_MESSAGE_TYPING,
//     Intents.FLAGS.GUILD_VOICE_STATES,
//   ],
// });
// // oauth link: "https://discord.com/api/oauth2/authorize?client_id=888163775017009202&permissions=3160064&scope=bot"

// let isPlaying = false;

// console.log(
//   (await getLink("https://www.youtube.com/watch?v=E0e6PKOh1t0")).formats[0].url
// );

// client.on("ready", () => {
//   console.log(`Logged in as ${client.user.tag}!`);
// });

// client.on("messageCreate", async (msg) => {
//   if (msg.content.startsWith("-p ") && isPlaying == false) {
//     isPlaying = true;

//     const link = msg.content.split(" ")[1];
//     const url = (await getLink(link)).formats[0].url;
//     msg.reply(`Song ${link} has been added to queue`);
//     const stream = got.stream(url);
//     stream.path = "music.mp3";
    
//     const channel = msg.member.voice.channel
//     console.log(channel)
//     const connection = joinVoiceChannel({
//       channelId: channel.id,
//       guildId: channel.guild.id,
//       adapterCreator: channel.guild.voiceAdapterCreator,
//     });
//     const conn = await channel.join();
//     const dispatcher = conn.play(stream);

//     dispatcher.on("end", (end) => {
//       isPlaying = false;
//       connection.destroy();
//     });
//   }
// });

// client.login(TOKEN);

import Discord, { GuildMember } from 'discord.js';
import {
	AudioPlayerStatus,
	AudioResource,
	entersState,
	joinVoiceChannel,
	VoiceConnectionStatus,
} from '@discordjs/voice';
import { Track } from './src/track.js';
import { MusicSubscription } from './src/subscription.js';


const client = new Discord.Client({ intents: ['GUILD_VOICE_STATES', 'GUILD_MESSAGES', 'GUILDS'] });

client.on('ready', () => console.log('Ready!'));

// This contains the setup code for creating slash commands in a guild. The owner of the bot can send "!deploy" to create them.
/**
 * Maps guild IDs to music subscriptions, which exist if the bot has an active VoiceConnection to the guild.
 */
const subscriptions = new Map();

// Handles slash command msgs
client.on('messageCreate', async (msg) => {

  const args = msg.content.split(' ')
  if (!msg.content.startsWith('-') || !msg.guild || msg.author.id === client.user.id) return
  let subscription = subscriptions.get(msg.guildId);
	if (args[0] === '-play' || args[0] === '-p') {

		// Extract the video URL from the command
		const url = args[1]
		// If a connection to the guild doesn't already exist and the user is in a voice channel, join that channel
		// and create a subscription.
		if (!subscription) {
			if (msg.member instanceof GuildMember && msg.member.voice.channel) {
				const channel = msg.member.voice.channel;
				subscription = new MusicSubscription(
					joinVoiceChannel({
						channelId: channel.id,
						guildId: channel.guild.id,
						adapterCreator: channel.guild.voiceAdapterCreator,
					}),
				);
				subscription.voiceConnection.on('error', console.warn);
				subscriptions.set(msg.guildId, subscription);
			}
		}


		// If there is no subscription, tell the user they need to join a channel.
		if (!subscription) {
			await msg.reply('Join a voice channel and then try that again!');
			return;
		}

		// Make sure the connection is ready before processing the user's request
		try {
			await entersState(subscription.voiceConnection, VoiceConnectionStatus.Ready, 20e3);
		} catch (error) {
			console.warn(error);
			await msg.reply('Failed to join voice channel within 20 seconds, please try again later!');
			return;
		}

		try {
			// Attempt to create a Track from the user's video URL
			const track = await Track.from(url, {
				onStart() {
					msg.reply({ content: 'Now playing!', ephemeral: true }).catch(console.warn);
				},
				onFinish() {
					msg.reply({ content: 'Now finished!', ephemeral: true }).catch(console.warn);
				},
				onError(error) {
					console.warn(error);
					msg.reply({ content: `Error: ${error.message}`, ephemeral: true }).catch(console.warn);
				},
			});
			// Enqueue the track and reply a success message to the user
			subscription.enqueue(track);
			await msg.reply(`Enqueued **${track.title}**`);
		} catch (error) {
			console.warn(error);
			await msg.reply('Failed to play track, please try again later!');
		}
	} else if (args[0] === '-skip') {
		if (subscription) {
			// Calling .stop() on an AudioPlayer causes it to transition into the Idle state. Because of a state transition
			// listener defined in music/subscription.ts, transitions into the Idle state mean the next track from the queue
			// will be loaded and played.
			subscription.audioPlayer.stop();
			await msg.reply('Skipped song!');
		} else {
			await msg.reply('Not playing in this server!');
		}
	} else if (args[0] === '-queue') {
		// Print out the current queue, including up to the next 5 tracks to be played.
		if (subscription) {
			const current =
				subscription.audioPlayer.state.status === AudioPlayerStatus.Idle
					? `Nothing is currently playing!`
					: `Playing **${(subscription.audioPlayer.state.resource).metadata.title}**`;

			const queue = subscription.queue
				.slice(0, 5)
				.map((track, index) => `${index + 1}) ${track.title}`)
				.join('\n');

			await msg.reply(`${current}\n\n${queue}`);
		} else {
			await msg.reply('Not playing in this server!');
		}
	} else if (args[0] === '-pause') {
		if (subscription) {
			subscription.audioPlayer.pause();
			await msg.reply({ content: `Paused!`, ephemeral: true });
		} else {
			await msg.reply('Not playing in this server!');
		}
	} else if (args[0] === '-resume') {
		if (subscription) {
			subscription.audioPlayer.unpause();
			await msg.reply({ content: `Unpaused!`, ephemeral: true });
		} else {
			await msg.reply('Not playing in this server!');
		}
	} else if (args[0] === '-leave') {
		if (subscription) {
			subscription.voiceConnection.destroy();
			subscriptions.delete(msg.guildId);
			await msg.reply({ content: `Left channel!`, ephemeral: true });
		} else {
			await msg.reply('Not playing in this server!');
		}
	} else {
		await msg.reply('Unknown command');
	}
});

client.on('error', console.warn)
client.login(TOKEN)
