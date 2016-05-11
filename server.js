var http = require('http');
var Pretender = require('./pretender');

function PretenderRequest(method, url) {
  this.method = method;
  this.url = url;
}
PretenderRequest.prototype = {
  method: null,
  url: null,
  respond: function(status, headers, body) {},
  _progress: function() {},
  upload: {_progress: function() {}}
};

function Server() {
  this.pretender = null;
  this.map = null;
  this.httpServer = http.createServer(this.handleRequest.bind(this));
  this.routeDefinitions = [];
}

Server.prototype.routes = function(callback) {
  this.map = callback;
};

Server.prototype.start = function(port) {
  this.pretender = new Pretender();
  this._executeDSL();
  this.pretender.unhandledRequest = this.unhandledRequest.bind(this);
  this.httpServer.listen(port);
};

Server.prototype._executeDSL = function() {
  this.map.call(this);
};

Server.prototype.get = function(url, callback) {
  this.routeDefinitions.push({method: 'GET', url: url});
  this.pretender.get(url, callback);
};

Server.prototype.stop = function(port) {
  this.pretender.shutdown();  
};

Server.prototype.handleRequest = function(request, response) {
  var pretenderRequest = new PretenderRequest(request.method, request.url);
  pretenderRequest.respond = function(status, headers, body) {
    response.statusCode = status;
    Object.keys(headers).forEach(function(header) {
      response.setHeader(header, headers[header]);
    });
    response.end(body);
  };

  var pretenderHandler = this.pretender._handlerFor(request.method, request.url, pretenderRequest);
  if (pretenderHandler) { 
    this.pretender.handleRequest(pretenderRequest);
  } else {
    response.statusCode = 404;
    response.end();
  }
};

Server.prototype.unhandledRequest = function(verb, path, request) {
  debugger;
};


Server.prototype.toJSON = function() {
  return {routes: this.routeDefinitions};
};
module.exports = Server;