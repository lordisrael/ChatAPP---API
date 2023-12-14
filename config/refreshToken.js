const jwt = require("jsonwebtoken");

const createRefreshJWT = function (id) {
  // try {
  //     console.log('creating')
  //     return jwt.sign({id}, process.env.JWT_SECRET, {
  //         expiresIn: process.env.JWT_LIFETIME
  //     })

  // } catch (error) {
  //     console.log('Not creating')
  // }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.RJWT_LIFETIME,
  });
};

module.exports = {
  createRefreshJWT,
};
