/**
 * timepicker
 * timepicker directive
 * Author: yangjiyuan@meituan.com
 * Date:2016-02-15
 */
angular.module('ui.fugu.timepicker', ['ui.fugu.timepanel'])
    .constant('fuguTimepickerConfig', {
        hourStep: 1,
        minuteStep: 1,
        secondStep: 1,
        readonlyInput:false,
        format:'HH:mm:ss'
    })
    .service('fuguTimepickerService', ['$document', function($document) {
        var openScope = null;
        this.open = function(timepickerScope) {
            if (!openScope) {
                $document.on('click', closeTimepicker);
            }
            if (openScope && openScope !== timepickerScope) {
                openScope.showTimepanel = false;
            }
            openScope = timepickerScope;
        };

        this.close = function(timepickerScope) {
            if (openScope === timepickerScope) {
                openScope = null;
                $document.off('click', closeTimepicker);
            }
        };

        function closeTimepicker(evt) {
            if (!openScope) { return; }
            var panelElement = openScope.getTimepanelElement();
            var toggleElement = openScope.getToggleElement();
            if(panelElement && panelElement.contains(evt.target) ||
                toggleElement && toggleElement.contains(evt.target)){
                return;
            }
            openScope.showTimepanel = false;
            openScope.$apply();
        }

    }])
    .controller('fuguTimepickerCtrl', ['$scope', '$element', '$attrs', '$parse', '$log', 'fuguTimepickerService', 'fuguTimepickerConfig','dateFilter', function($scope, $element, $attrs, $parse, $log, fuguTimepickerService, timepickerConfig,dateFilter) {
        var ngModelCtrl = { $setViewValue: angular.noop };
        this.init = function (_ngModelCtrl) {
            ngModelCtrl = _ngModelCtrl;
            ngModelCtrl.$render = this.render;
            ngModelCtrl.$formatters.unshift(function(modelValue) {
                return modelValue ? new Date(modelValue) : null;
            });
        };
        var _this = this;
        /*
         fix 父组件的controller优先于子组件初始化,hourStep三个属性需要在子组件初始化的是即传递进去
         不能在父组件执行link(link函数一般都是postLink函数)函数的时候执行
         http://xgfe.github.io/2015/12/22/penglu/link-controller/
         */
        $scope.hourStep = angular.isDefined($attrs.hourStep) ? $scope.$parent.$eval($attrs.hourStep) : timepickerConfig.hourStep;
        $scope.minuteStep = angular.isDefined($attrs.minuteStep) ? $scope.$parent.$eval($attrs.minuteStep) : timepickerConfig.minuteStep;
        $scope.secondStep = angular.isDefined($attrs.secondStep) ? $scope.$parent.$eval($attrs.secondStep) : timepickerConfig.secondStep;

        // readonly input
        $scope.readonlyInput = timepickerConfig.readonlyInput;
        if ($attrs.readonlyInput) {
            $scope.$parent.$watch($parse($attrs.readonlyInput), function (value) {
                $scope.readonlyInput = !!value;
            });
        }

        $scope.showTimepanel = false;
        this.toggle = function(open) {
            $scope.showTimepanel = arguments.length ? !!open : !$scope.showTimepanel;
        };
        this.showTimepanel = function() {
            return $scope.showTimepanel;
        };
        var format = angular.isDefined($attrs.format) ? $scope.$parent.$eval($attrs.format) : timepickerConfig.format;
        this.render = function () {
            var date = ngModelCtrl.$viewValue;
            if (isNaN(date)) {
                $log.error('Timepicker directive: "ng-model" value must be a Date object, a number of milliseconds since 01.01.1970 or a string representing an RFC2822 or ISO 8601 date.');
            } else if(date){
                $scope.selectedTime = date;
                $scope.inputValue = dateFilter(date,format);
            }
        };
        // 这里使用onChange，而不是watch selectedTime属性，因为watch的话，会出现循环赋值，待解决
        $scope.changeTime = function (time) {
            ngModelCtrl.$setViewValue(time);
            ngModelCtrl.$render();
        };
        $scope.toggleTimepanel = function (evt) {
            $element.find('input')[0].blur();
            evt.preventDefault();
            if (!$scope.isDisabled) {
                _this.toggle();
            }
        };
        $scope.getTimepanelElement = function () {
            // do not use $element.find() it only can find a element by tag name
            return $element[0].querySelector('.fugu-timepanel');
        };
        $scope.getToggleElement = function () {
            return $element[0].querySelector('.input-group');
        };
        $scope.$watch('showTimepanel', function(showTimepanel) {
            if (showTimepanel) {
                fuguTimepickerService.open($scope);
            } else {
                fuguTimepickerService.close($scope);
            }
        });
        $scope.$on('$locationChangeSuccess', function() {
            $scope.showTimepanel = false;
        });
    }])
    .directive('fuguTimepicker', function () {
        return {
            restrict: 'AE',
            templateUrl: 'templates/timepicker.html',
            replace: true,
            require: ['fuguTimepicker','ngModel'],
            scope: {
                isDisabled:'=?ngDisabled',
                minTime:'=?',
                maxTime:'=?',
                placeholder:'@'
            },
            controller: 'fuguTimepickerCtrl',
            link: function (scope, el, attrs, ctrls) {
                var timepickerCtrl = ctrls[0],ngModelCtrl = ctrls[1];
                timepickerCtrl.init(ngModelCtrl);
            }
        }
    });