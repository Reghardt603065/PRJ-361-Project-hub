// A stand-in until proper authorization has been developed
function mockAuth(req, res, next) {
  req.userId = 1;
  next();
}
module.exports = mockAuth;