const cloudinary = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const cloudinaryUploadImg = async (fileToUploads) => {
  return await new Promise((resolve) => {
    cloudinary.uploader.upload(fileToUploads, (result) => {
      resolve(
        {
          url: result.secure_url,
        },
        {
          resource_type: "auto",
        }
      );
    });
  });
};


const cloudinaryUploadImgDel = async (fileToUploads) => {
  try {
    const result = await cloudinary.uploader.upload(fileToUploads, {
      resource_type: "auto",
    });

    return {
      url: result.secure_url,
    };
  } catch (error) {
    throw error;
  }
};


const cloudinaryDeleteImg = async (publicIdToDelete) => {
  try {
    const result = await cloudinary.uploader.destroy(publicIdToDelete);

    if (result && result.result === "ok") {
      return result;
    } else {
      throw new Error("Deletion unsuccessful");
    }
  } catch (error) {
    throw error;
  }
};



module.exports = {cloudinaryUploadImg, cloudinaryDeleteImg, cloudinaryUploadImgDel};
