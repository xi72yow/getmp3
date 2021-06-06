const fs = require('fs')
const youtubedl = require('youtube-dl')
const ffmpeg = require('fluent-ffmpeg')

const url = "https://music.youtube.com/watch?v=XUaX0zl-6to&feature=share";

async function getMp3fromYTURL(url) {
    let folder = new Date().toString();

    if (!fs.existsSync("temp/" + folder)) {
        fs.mkdirSync("temp/" + folder);
    }

    const options = {
        // Downloads available thumbnail.
        all: false,
        // The directory to save the downloaded files in.
        cwd: "temp/" + folder,
    }

    youtubedl.getThumbs(url, options, function (err, files) {
        if (err) throw err

        console.log('thumbnail file downloaded:', files)
    })

    const video = youtubedl(url,
        // Optional arguments passed to youtube-dl.
        ['--format=18'],
        // Additional options can be given for calling `child_process.execFile()`.
        { cwd: __dirname })

    // Will be called when the download starts.
    let titleData;
    video.on('info', function (info) {

        titleData = {
            "title": info.title,
            "author": info.channel,
            "album": info.album,
            "year": info.release_year,
            "thumbnail": info.thumbnail,
            "description": info.description,
            "filename": info._filename,
        }

        // stringify Object
        var jsonContent = JSON.stringify(info);

        fs.writeFile("temp/" + folder + "/output.json", jsonContent, 'utf8', function (err) {
            if (err) {
                console.log("An error occured while writing JSON Object to File.");
                return console.log(err);
            }

            console.log("JSON file has been saved.");
        });

    });

    function convert(input, output, callback) {
        ffmpeg(input)
            .output(output)
            .addOutputOption('-metadata', 'title="' + titleData.title + '"')
            .addOutputOption('-metadata', 'author="' + titleData.author + '"')
            .addOutputOption('-metadata', 'album="' + titleData.album + '"')
            .addOutputOption('-metadata', 'year="' + titleData.year + '"')
            .addOutputOption('-metadata', 'description="' + titleData.description + '"')
            .on('end', function () {
                console.log('conversion ended');
                callback(null);
            }).on('error', function (err) {
                console.log('error: ', err.code, err.msg);
                callback(err);
            }).run();
    }

    var vidStream = fs.createWriteStream("temp/" + folder + '/myvideo.mp4');
    vidStream.on('finish', function () {
        console.log('file done');

        convert("temp/" + folder + '/myvideo.mp4', 'extract/' + titleData.filename + '.mp3', function (err) {
            if (!err) {
                console.log('conversion complete');
                return;

            } else throw err
        });


    });

    video.pipe(vidStream);
}

getMp3fromYTURL("YT_URL");