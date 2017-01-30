'use strict';
const HttpStatus = require('http-status');

const messageCatalog = require('./messageCatalog');

class AuthCheckMiddleware {
  constructor(app) {
    this.app = app;
  }

  fastPass() {
    return function(req, res, next) {
      let fastPass = req.headers['x-fast-pass'];
      req.fastPass = fastPass;
      next();
    }
  }

  authCheck() {
    let self = this;
    return function(req, res, next) {
      let accessToken = req.token; // Get from Authorization Header;

      // fast-pass
      let fastPass = req.fastPass;

      if(fastPass) {
        next();
      } if(accessToken === undefined) {
        res.status(HttpStatus.BAD_REQUEST).send({errorMessage: messageCatalog.BAD_REQUEST_ACCESS_TOKEN.message});
      } else if(self.app.proxy) {
          self.app.proxy.apiForServiceType("SecurityService").then((service) => {
          if(service) {
            service.api.tokens.check({'access-token': accessToken}, (validity) => {
              if(validity.obj.valid === true) {
                next();
              } else {
                // 403 - Forbidden
                res.status(HttpStatus.FORBIDDEN).send({errorMessage: messageCatalog.FORBIDDEN.message});
              }
            }, (err) => {
              if(err.status === HttpStatus.NOT_FOUND) {
                res.status(HttpStatus.UNAUTHORIZED).send({ errorMessage: messageCatalog.UNAUTHORIZED.message });
              } else if(err.status === HttpStatus.BAD_REQUEST) {
                res.status(err.status).send({ errorMessage: messageCatalog.BAD_REQUEST.message });
              } else {
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({errorMessage: messageCatalog.INTERNAL_SERVER_ERROR.message});
              }
            });
          } else {
            res.status(HttpStatus.SERVICE_UNAVAILABLE).send({errorMessage: messageCatalog.SERVICE_UNAVAILABLE.message});
          }
        }).catch((err) => {
          // 500 - Internal Service Error
          console.log(err);
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ errorMessage: messageCatalog.INTERNAL_SERVER_ERROR.message });
        });
      } else {
        // 503 - Service Unavailable
        res.status(HttpStatus.SERVICE_UNAVAILABLE).send({ errorMessage: messageCatalog.SERVICE_UNAVAILABLE.message });
      }
    }
  }
}


module.exports.AuthCheckMiddleware = AuthCheckMiddleware;
