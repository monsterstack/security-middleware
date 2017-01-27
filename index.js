'use strict';

class AuthCheckMiddleware {
  constructor(proxy) {
    this.proxy = proxy;
  }


  authCheck() {
    return function(req, res, next) {
      next();
    }
  }
}


module.exports.AuthCheckMiddleware = AuthCheckMiddleware;
