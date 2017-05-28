'use strict';

const HttpStatus = require('http-status');
const GetCurrentContext = require('app-context').GetCurrent;
const messageCatalog = require('./messageCatalog');
const KEY = 'fastPass';
const TENANT_NAME_KEY = "TenantName";
const BOOTSTRAP_TENANT_NAME = "CDSPTenant";

class AuthCheckMiddleware {
  constructor(app) {
    this.app = app;
  }

  fastPass() {
    return function(req, res, next) {
      let fastPass = req.headers['x-fast-pass'];
      req[KEY] = fastPass;
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
        // Forward the tenant name down the hill
        req.headers[TENANT_NAME_KEY] = BOOTSTRAP_TENANT_NAME;
        context.set('tenantName', req.headers[TENANT_NAME_KEY]);
        next();
      } else if(accessToken === undefined) {
        res.status(HttpStatus.BAD_REQUEST).send({errorMessage: messageCatalog.BAD_REQUEST_ACCESS_TOKEN.message});
      } else if(self.app.proxy) {
          let context = GetCurrentContext();
          context.set('accessToken', accessToken);
          self.app.proxy.apiForServiceType("SecurityService").then((service) => {
          if(service) {
            console.log(`Checking token ${accessToken}`);
            service.api.tokens.check({'access-token': accessToken}, (validity) => {
              console.log(validity);
              if(validity.obj.valid === true) {
                // Forward the tenant name down the hill
                req.headers[TENANT_NAME_KEY] = validity.obj.tenantName;
                context.set('tenantName', validity.obj.tenantName);
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
