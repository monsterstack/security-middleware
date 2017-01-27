'use strict';

class AuthCheckMiddleware {
  constructor() {
  }


  authCheck(app) {
    return function(req, res, next) {
      next();
    }
  }
}


module.exports.AuthCheckMiddleware = AuthCheckMiddleware;
