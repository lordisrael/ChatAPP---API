const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});


const cloudinaryUploadImg = async(fileToUpload) => {
   try {
     const result = await cloudinary.uploader.upload(fileToUpload, {
       resource_type: "auto",
     });
     console.log(`> Result: ${result.secure_url}`);
     return {
       url: result.secure_url,
     };
   } catch (error) {}
}


const cloudinaryUploadVideo = async (fileToUpload, resourceType) => {
  try {
    const result = await cloudinary.uploader.upload(fileToUpload, {
      resource_type: "video",
    });
    console.log(`> Result: ${result.secure_url}`);
    if (result && result.secure_url) {
      return {
        url: result.secure_url,
        resource_type: result.resource_type || "video",
      };
    } else {
      throw new Error("Failed to get secure URL for video.");
    }
  } catch (error) {
    throw error;
  }
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



module.exports = {cloudinaryUploadImg, cloudinaryDeleteImg, cloudinaryUploadImgDel, cloudinaryUploadVideo};
