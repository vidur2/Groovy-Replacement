
const youtubedl = require("./node_modules/youtube-dl-exec");
const got = require("./node_modules/got");
const { Client, Intents } = require("./node_modules/discord.js")

const TOKEN = "ODg4MTYzNzc1MDE3MDA5MjAy.YUOs-Q.WhlKw1E-gmMQVcZ822E7EDQDSQQ";
// oauth link: "https://discord.com/api/oauth2/authorize?client_id=888163775017009202&permissions=3160064&scope=bot"

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_TYPING, Intents.GUILDS.VOICE_STATES] });
client.login(TOKEN)
let isPlaying = false;

async function getLink(link){
    const finalLink = youtubedl( link, {
        dumpSingleJson: true,
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        youtubeSkipDashManifest: true,
        referer: link
      });

      return finalLink;
}


client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on("message", (msg) => {
  console.log(msg.content)
  const hasRequiredTag = msg.content.indexOf("-p ")
  console.log(hasRequiredTag)
  if(hasRequiredTag != -1 && isPlaying == false){
    isPlaying = true;
    const voiceChannel = message.member.voice.channel;
    const link = msg.content.split(" ");
    const linkInfo = getLink(link[1]);
    msg.reply(`Song ${link[1]} has been added to queue`)

    linkInfo.then((value) => {
      const url = value.formats[0].url;
      console.log(value);
      const stream = got.stream(url);
      stream.path = "music.mp3"
      voiceChannel.join().then((connection => {
        const dispatcher = connection.play(stream)
        dispatcher.on("end", end => {
          isPlaying = false;
        })
      }))
    })
  }
})

