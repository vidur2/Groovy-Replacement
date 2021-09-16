
const youtubedl = require("./node_modules/youtube-dl-exec");
const got = require("./node_modules/got");

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

const link = "https://www.youtube.com/watch?v=iJ47aOaGvyI";

const linkInfo = getLink(link);

linkInfo.then((value) => {
  const url = value.formats[0].url;
  console.log(url);
  const stream = got.stream(url);
  stream.path = "video.mp4";
})

