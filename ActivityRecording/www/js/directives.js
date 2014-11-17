/* 
 * MLE Directives used for UI input validation checks
 */

var directives = angular.module('directives', []);

directives.directive('onSwipeLeft', function($parse, $ionicGesture) {
    return {
        restrict :  'A',
        link : function(scope, elem, attrs) {
            var fn = $parse(attrs.onSwipeLeft);
            $ionicGesture.on('swipeleft', function(event) {
                console.log("swiped left");
                scope.$apply(function() {
                    fn(scope, {$event:event});
                });
            }, elem);
        }
    }
});

directives.directive('onSwipeRight', function($parse, $ionicGesture) {
    return {
        restrict :  'A',
        link : function(scope, elem, attrs) {
            var fn = $parse(attrs.onSwipeRight);
            $ionicGesture.on('swiperight', function(event) {
                console.log("swiped right");
                scope.$apply(function() {
                    fn(scope, {$event:event});
                });
            }, elem);
        }
    }
});


//directives.directive('date', function (dateFilter) {
//    return {
//        require:'ngModel',
//        link:function (scope, elm, attrs, ctrl) {
//
//            var dateFormat = attrs['date'] || 'dd.MM.yyyy';
//            var minDate = Date.parse(attrs['min']) || 0;
//            var maxDate = Date.parse(attrs['max']) || 9007199254740992;
//
//            ctrl.$parsers.unshift(function (viewValue) {
//                var parsedDateMilissec = Date.parse(viewValue);
//                if (parsedDateMilissec > 0) {
//                    if (parsedDateMilissec >= minDate && parsedDateMilissec <= maxDate) {
//                        ctrl.$setValidity('date', true);
//                        return parsedDateMilissec;
//                    }
//                }
//
//                // in all other cases it is invalid, return undefined (no model update)
//                ctrl.$setValidity('date', false);
//                return undefined;
//            });
//
//            ctrl.$formatters.unshift(function (modelValue) {
//                return new Date(modelValue);
//            });
//        }
//    };
//});
