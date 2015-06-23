'use strict';

angular.module('paranoiaChat')
.directive('userBox', function () {
  return {
    scope: {
      user: '='
    },
    templateUrl: 'views/rooms/user_box.html',
    controller: 'UsersController'
  };
});