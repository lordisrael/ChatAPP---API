const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/image"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ".jpeg");
  },
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(
      {
        message: "Unsuported file format",
      },
      false
    );
  }
};

const uploadPhoto = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fieldSize: 2000000, files: 1 },
});

// const userImgResize = async (req, res, next) => {
//   if (!req.files) return next();
//   await Promise.all(
//     req.files.map(async (file) => {
//       await sharp(file.path)
//         .resize(300, 300)
//         .toFormat("jpeg")
//         .jpeg({ quality: 90 })
//         .toFile(`public/image/user/${file.filename}`);
//       fs.unlinkSync(`public/image/user/${file.filename}`);
//     })
//   );
//   next();
// };

const userImgResize = async (req, res, next) => {
  if (!req.file) return next(); // Check if there's a single file in req.file

  const { path: filePath } = req.file;

  await sharp(filePath)
    .resize(300, 300)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/image/user/${req.file.filename}`); // Save the resized image

  fs.unlinkSync(`public/image/user/${req.file.filename}`); // Remove the original image after resizing

  next();
};


module.exports = {
  uploadPhoto,
  userImgResize,
};
