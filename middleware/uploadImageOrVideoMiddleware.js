const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
// const ffmpeg = require("fluent-ffmpeg");
// ffmpeg.setFfmpegPath("../../../Downloads/PATH_Programs/bin/ffmpeg.exe");
const ffmpegStatic = require("ffmpeg-static");
const ffmpeg = require("fluent-ffmpeg");

// Tell fluent-ffmpeg where it can find FFmpeg
ffmpeg.setFfmpegPath(ffmpegStatic);
const fs = require("fs");

const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = "";
    if (file.mimetype.startsWith("image/")) {
      uploadPath = path.join(__dirname, "../chat/image");
    } else if (file.mimetype.startsWith("video/")) {
      uploadPath = path.join(__dirname, "../chat/video");
    } else {
      // Handle unsupported file types here
      return cb(new Error("Unsupported file type"));
    }
    cb(null, uploadPath);
    //fs.unlinkSync(uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    let fileExtension = "";

    if (file.mimetype.startsWith("image/")) {
      fileExtension = ".jpeg";
    } else if (file.mimetype.startsWith("video/")) {
      fileExtension = ".mp4";
    } else {
      // Handle unsupported file types here
      return cb(new Error("Unsupported file type"));
    }

    cb(null, file.fieldname + "-" + uniqueSuffix + fileExtension);
  },
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image") || file.mimetype.startsWith("video")) {
    cb(null, true);
  } else {
    cb(
      {
        message: "Unsupported file format",
      },
      false
    );
  }
};


const uploadPhotoOrVideo = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fieldSize: 2000000 },
});

const chatImgResize = async (req, res, next) => {
  if (!req.files) return next();

 try {
   await Promise.all(
     req.files.map(async (file) => {
       if (file.mimetype.startsWith("image/")) {
         await sharp(file.path)
           .resize(300, 300)
           .toFormat("jpeg")
           .jpeg({ quality: 90 })
           .toFile(`chat/image/user/${file.filename}`);
         fs.unlinkSync(`chat/image/user/${file.filename}`); // Corrected the path here
       }
     })
   );
 } catch (err) {
   return next(err);
 }

 next();
};


const chatMediaResize = async (req, res, next) => {
  if (!req.files) return next();
  try {
    await Promise.all(
      req.files.map(async (file) => {
        if (file.mimetype.startsWith("video/")) {
          await ffmpeg(file.path)
            .size("640x?") // Set the width to 640 pixels and maintain aspect ratio
            .videoCodec("libx264") // Use H.264 codec for the video
            .on("error", (err) => {
              console.error("Error during video resizing:", err);
            })
            .on("end", () => {
              console.log("Video resizing completed");
              fs.unlinkSync(file.path); 
            })
            .save(`chat/video/user/${file.filename}`); 
        }
      })
    );
  } catch (err) {
    return next(err);
  }
  next();
};


 module.exports = {
   uploadPhotoOrVideo,
   chatImgResize,
   chatMediaResize
 };