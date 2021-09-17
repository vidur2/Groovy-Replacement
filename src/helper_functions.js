
import youtubedl from "youtube-dl-exec";

export async function getLink(link){
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