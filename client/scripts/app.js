'use strict';

angular.module('paranoiaChat', ['ngRoute',
                                'ngSanitize',
                                'btford.socket-io',
                                'luegg.directives',
                                'paranoiaChat.rooms'])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.otherwise({redirectTo: '/rooms'});
  }]);