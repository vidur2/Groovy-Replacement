import got from "got";
import { Client, Intents } from "discord.js";
import { getLink } from "./src/helper_functions.js";

const TOKEN = "ODg4MTYzNzc1MDE3MDA5MjAy.YUOs-Q.WhlKw1E-gmMQVcZ822E7EDQDSQQ";
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_TYPING,
    Intents.FLAGS.GUILD_VOICE_STATES,
  ],
});
// oauth link: "https://discord.com/api/oauth2/authorize?client_id=888163775017009202&permissions=3160064&scope=bot"

let isPlaying = false;

console.log(
  (await getLink("https://www.youtube.com/watch?v=E0e6PKOh1t0")).formats[0].url
);

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async (msg) => {
  if (msg.content.startsWith("-p ") && isPlaying == false) {
    isPlaying = true;

    const link = msg.content.split(" ");
    const url = await getLink(link[1]).formats[0].url;
    msg.reply(`Song ${link[1]} has been added to queue`);
    const stream = got.stream(url);
    stream.path = "music.mp3";
    const conn = await message.member.voice.channel.join();
    const dispatcher = conn.play(stream);

    dispatcher.on("end", (end) => {
      isPlaying = false;
    });
  }
});

client.login(TOKEN);
