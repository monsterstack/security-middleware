'use strict';
const HttpStatus = require('http-status');

class AuthCheckMiddleware {
  constructor(app) {
    this.app = app;
  }


  authCheck() {
    let self = this;
    return function(req, res, next) {
      if(self.app.proxy) {
        self.app.proxy.apiForServiceType("SecurityService").then((service) => {
          console.log(service);
          next();
          // service.api.sercurity.check({access_token: "111111"}, (validity) => {
          //   if(validity.isValid === true) {
          //     next();
          //   } else {
          //     // 403 - Forbidden
          //     new ServiceError(HttpStatus.FORBIDDEN, "Forbidden Access").writeResponse(res);
          //   }
          // }, (err) => {
          //   new ServiceError(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error").writeResponse(res);
          // });
        }).catch((err) => {
          // 500 - Internal Service Error
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ errorMessage: "Internal Server Error" });
        });
      } else {
        // 503 - Service Unavailable
        res.status(HttpStatus.SERVICE_UNAVAILABLE).send({ errorMessage: "Security Service Unavailable" });
      }
    }
  }
}


module.exports.AuthCheckMiddleware = AuthCheckMiddleware;
