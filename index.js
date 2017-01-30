'use strict';
const HttpStatus = require('http-status');

class AuthCheckMiddleware {
  constructor(app) {
    this.app = app;
  }


  authCheck() {
    let self = this;
    return function(req, res, next) {
      let accessToken = req.token; // Get from Authorization Header;
      if(self.app.proxy) {
        self.app.proxy.apiForServiceType("SecurityService").then((service) => {
          service.api.tokens.check({'access-token': "111111"}, (validity) => {
            if(validity.valid === true) {
              next();
            } else {
              // 403 - Forbidden
              res.status(HttpStatus.FORBIDDEN).send({errorMessage: "Forbidden Access"});
            }
          }, (err) => {
            if(err.status === HttpStatus.NOT_FOUND) {
              res.status(HttpStatus.UNAUTHORIZED).send({ errorMessage: "Unauthorized for BEARER, Matching Access Token Not Found" });
            } else {
              res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({errorMessage: "Internal Server Error"});
            }
          });
        }).catch((err) => {
          // 500 - Internal Service Error
          console.log(err);
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
