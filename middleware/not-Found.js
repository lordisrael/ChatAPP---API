const notFound = (req, res) => res.status(404).send("Route not Found");
//console.log('Route not Found')

module.exports = notFound;
