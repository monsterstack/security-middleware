'use strict';
const ServiceError = require('core-server').ServiceError;

class AuthCheckMiddleware {
  constructor() {
  }


  authCheck(app) {
    return function(req, res, next) {
      if(app.proxy) {
        app.proxy.apiForServiceType("SecurityService").then((service) => {
          service.api.sercurity.check({access_token: "111111"}, (validity) => {
            if(validity.isValid === true) {
              next();
            } else {
              // 403 - Forbidden
              new ServiceError(HttpStatus.FORBIDDEN, "Forbidden Access").writeResponse(res);
            }
          }, (err) => {
            new ServiceError(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error").writeResponse(res);
          });
        }).catch((err) => {
          // 500 - Internal Service Error
          new ServiceError(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error").writeResponse(res);
        });
      } else {
        // 503 - Service Unavailable
        new ServiceError(HttpStatus.SERVICE_UNAVAILABLE, "Security Service Unavailable").writeResponse(res);
      }
    }
  }
}


module.exports.AuthCheckMiddleware = AuthCheckMiddleware;
